"use client";

import { useState, useEffect } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  files: Array<{ key: string; name: string; type: "image" | "video"; url: string }>;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ files, currentIndex, onClose, onNavigate }: LightboxProps) {
  const currentFile = files[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < files.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [currentIndex, files.length, onClose, onNavigate]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = currentFile.url;
    a.download = currentFile.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 p-2 text-white/70 hover:text-white z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {currentIndex < files.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 p-2 text-white/70 hover:text-white z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        {currentFile.type === "video" ? (
          <video
            src={currentFile.url}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] object-contain"
          />
        ) : (
          <img
            src={currentFile.url}
            alt={currentFile.name}
            className="max-w-full max-h-[85vh] object-contain"
          />
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
        <p className="text-white text-sm">{currentFile.name}</p>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white text-sm"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>
        <p className="text-white/50 text-xs">
          {currentIndex + 1} / {files.length}
        </p>
      </div>
    </div>
  );
}
