import Gallery from "@/components/Gallery";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Galería</h1>
        <p className="text-zinc-400 mb-8">Fotos y videos de la colección</p>
        <Gallery />
      </div>
    </main>
  );
}
