"use client";

import { useState, useEffect } from "react";
import MediaCard from "./MediaCard";
import Lightbox from "./Lightbox";
import { Image, Film, Grid } from "lucide-react";

interface MediaFile {
  key: string;
  name: string;
  size: number;
  type: "image" | "video";
  url: string;
}

interface GalleryProps {
  isAdmin?: boolean;
}

export default function Gallery({ isAdmin = false }: GalleryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function loadFiles() {
      try {
        const response = await fetch("/api/files");
        const data = await response.json();
        if (!cancelled) {
          setFiles(data.files || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    loadFiles();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFiles = files.filter((f) => {
    if (filter === "all") return true;
    return f.type === filter;
  });

  const handleDelete = (key: string) => {
    setFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const imageCount = files.filter((f) => f.type === "image").length;
  const videoCount = files.filter((f) => f.type === "video").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <Grid className="w-4 h-4" aria-hidden="true" />
            Todos ({files.length})
          </button>
          <button
            onClick={() => setFilter("image")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filter === "image"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <Image className="w-4 h-4" aria-hidden="true" />
            Fotos ({imageCount})
          </button>
          <button
            onClick={() => setFilter("video")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filter === "video"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <Film className="w-4 h-4" />
            Videos ({videoCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p>No hay archivos para mostrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map((file, index) => (
            <MediaCard
              key={file.key}
              file={file}
              onDelete={handleDelete}
              onPreview={() => openLightbox(index)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          files={filteredFiles}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
