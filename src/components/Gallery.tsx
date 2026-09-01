"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadFiles = useCallback(async (pageNum: number, filterType: string, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const response = await fetch(`/api/files?page=${pageNum}&filter=${filterType}`);
      const data = await response.json();
      
      if (append) {
        setFiles((prev) => [...prev, ...(data.files || [])]);
      } else {
        setFiles(data.files || []);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch {
      // Error
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setFiles([]);
    setPage(1);
    setHasMore(true);
    loadFiles(1, filter);
  }, [filter, loadFiles]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadFiles(page + 1, filter, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, filter, loadFiles]);

  const filteredFiles = files;

  const handleDelete = (key: string) => {
    setFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          <Grid className="w-4 h-4" aria-hidden="true" />
          Todos
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
          Fotos
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
          Videos
        </button>
      </div>

      {loading && files.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p>No hay archivos para mostrar</p>
        </div>
      ) : (
        <>
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

          <div ref={observerRef} className="h-10" />

          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!hasMore && files.length > 0 && (
            <p className="text-center text-zinc-500 py-4">Fin de la galería</p>
          )}
        </>
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
