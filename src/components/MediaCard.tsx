"use client";

import { useState } from "react";
import { Download, Trash2, Play } from "lucide-react";

interface MediaCardProps {
  file: {
    key: string;
    name: string;
    size: number;
    type: "image" | "video";
    url: string;
  };
  onDelete?: (key: string) => void;
  onPreview?: (file: { key: string; name: string; type: "image" | "video"; url: string }) => void;
  isAdmin?: boolean;
}

export default function MediaCard({ file, onDelete, onPreview, isAdmin }: MediaCardProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Eliminar este archivo?")) {
      await fetch(`/api/delete?key=${encodeURIComponent(file.key)}`, {
        method: "DELETE",
      });
      onDelete?.(file.key);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className="group relative bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
      onClick={() => onPreview?.(file)}
    >
      <div className="aspect-square relative overflow-hidden">
        {file.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <Play className="w-12 h-12 text-white/70" />
          </div>
        ) : (
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className="p-2">
        <p className="text-sm text-white truncate">{file.name}</p>
        <p className="text-xs text-zinc-400">{formatSize(file.size)}</p>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={handleDownload}
          className="p-1.5 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
          title="Descargar"
        >
          <Download className="w-4 h-4 text-white" />
        </button>
        
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="p-1.5 bg-red-600/70 rounded-full hover:bg-red-600/90 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
