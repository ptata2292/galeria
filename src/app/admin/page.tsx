"use client";

import { useState } from "react";
import Gallery from "@/components/Gallery";
import { Upload, Lock, LogOut } from "lucide-react";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newProgress: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith("video/");
      const folder = isVideo ? "video" : "image";
      
      newProgress.push(`Subiendo ${file.name}...`);
      setUploadProgress([...newProgress]);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            folder,
          }),
        });

        const { presignedUrl } = await response.json();

        await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        newProgress[i] = `✓ ${file.name}`;
      } catch {
        newProgress[i] = `✗ Error: ${file.name}`;
      }

      setUploadProgress([...newProgress]);
    }

    setUploading(false);
    window.location.reload();
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded-lg w-80">
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-white text-center mb-6">Panel Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Panel Admin</h1>
            <p className="text-zinc-400">Gestionar galería</p>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Subir archivos</h2>
          <label className="flex items-center justify-center gap-3 px-6 py-12 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <Upload className="w-8 h-8 text-zinc-400" />
            <span className="text-zinc-400">
              {uploading ? "Subiendo..." : "Arrastra archivos o haz clic para seleccionar"}
            </span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {uploadProgress.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadProgress.map((progress, i) => (
                <p key={i} className="text-sm text-zinc-300">
                  {progress}
                </p>
              ))}
            </div>
          )}
        </div>

        <Gallery isAdmin />
      </div>
    </main>
  );
}
