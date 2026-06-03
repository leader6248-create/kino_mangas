'use client'
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { use } from "react"

export default function WatchPage({ params }) {
  const { id } = use(params)
  const [movie, setMovie] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: movieData } = await supabase.from("movies").select("*").eq("id", id).single()
      setMovie(movieData)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-xl animate-pulse">Карж байна...</div>
    </div>
  )

  if (!movie) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Кино олдсонгүй</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="bg-black/90 backdrop-blur px-6 py-3 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
        <Link href="/" className="text-lg font-black text-red-500">MOVIE MN</Link>
        <h1 className="text-sm font-bold text-gray-300 truncate max-w-md">{movie.title}</h1>
        <Link href={"/movies/" + movie.id} className="text-sm text-gray-400 hover:text-white transition-colors">← Буцах</Link>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="w-full bg-black" style={{ aspectRatio: "16/9", maxHeight: "75vh" }}>
          {(() => {
            const videoId = movie.youtube_id || ""
            const isBunny = videoId.includes("-") && videoId.length > 20
            const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID
            const src = isBunny
              ? `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&preload=true`
              : `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
            return (
              <iframe
                src={src}
                className="w-full h-full"
                style={{ minHeight: "400px" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          })()}
        </div>

        <div className="px-6 py-6 max-w-4xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-black mb-2">{movie.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                <span className="text-yellow-400 font-bold">&#9733; 9.2</span>
                <span>{movie.year}</span>
                <span>{movie.genre}</span>
                <span>{movie.category}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">{movie.description}</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-gray-700">
                &#128077; Таалах
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-gray-700">
                &#128279; Хуваалцах
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
