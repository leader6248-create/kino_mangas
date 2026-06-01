'use client'
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { use } from "react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function formatViews(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + "W"
  if (n >= 1000) return (n / 1000).toFixed(1) + "K"
  return String(n || 0)
}

export default function MoviePage({ params }) {
  const { id } = use(params)
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single()
      console.log("movie data:", data, "error:", error)
      setMovie(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-xl animate-pulse">Карж байна...</div>
    </div>
  )

  if (!movie) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-4">
      <div className="text-white text-xl">Кино олдсонгүй</div>
      <Link href="/" className="text-red-400 hover:text-red-300">← Нүүр хуудас руу харих</Link>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800 px-8 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-red-500 tracking-wider">MOVIE MN</Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Буцах</Link>
      </header>

      <section className="relative h-[70vh] flex items-end pb-12 px-8 pt-16">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(" + movie.poster_url + ")" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/50" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="bg-gray-800/80 text-gray-300 text-xs px-3 py-1 rounded-full">{movie.category}</span>
            <span className="bg-gray-800/80 text-gray-300 text-xs px-3 py-1 rounded-full">{movie.genre}</span>
            <span className="bg-gray-800/80 text-gray-300 text-xs px-3 py-1 rounded-full">{movie.year}</span>
            {movie.is_free && <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30">Үнэгүй</span>}
          </div>
          <h1 className="text-5xl font-black mb-4 leading-tight">{movie.title}</h1>
          <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
            <span className="text-yellow-400 font-bold text-base">&#9733; 9.2</span>
            <span>{formatViews(movie.view_count)} үзэлт</span>
            <span>{movie.year} он</span>
          </div>
          <p className="text-gray-300 text-base leading-relaxed mb-8 max-w-xl">{movie.description}</p>
          <div className="flex gap-3 flex-wrap items-center">
            {movie.is_free ? (
              <Link href={"/movies/" + movie.id + "/watch"} className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-xl font-black text-lg transition-all hover:scale-105 shadow-lg shadow-red-900/40">
                &#9654; Үзэх
              </Link>
            ) : (
              <button className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-xl font-black text-lg transition-all hover:scale-105 shadow-lg shadow-red-900/40">
                &#9654; Үзэх — {movie.price?.toLocaleString()}₮
              </button>
            )}
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-bold text-base transition-all border border-gray-700">
              &#43; Жагсаалтад нэмэх
            </button>
          </div>
        </div>
      </section>

      <section className="px-8 py-10 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-black mb-4">Киноны тухай</h2>
            <p className="text-gray-300 leading-relaxed text-base">{movie.description}</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-500 text-xs mb-1">Төрөл</p>
                <p className="text-white font-bold">{movie.genre}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-500 text-xs mb-1">Ангилал</p>
                <p className="text-white font-bold">{movie.category}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-500 text-xs mb-1">Гарсны он</p>
                <p className="text-white font-bold">{movie.year}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-500 text-xs mb-1">Үзэлт</p>
                <p className="text-white font-bold">{formatViews(movie.view_count)}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 h-fit">
            <p className="text-gray-400 text-sm mb-2">Үнэ</p>
            <p className="text-3xl font-black text-red-400 mb-4">
              {movie.is_free ? "Үнэгүй" : movie.price?.toLocaleString() + "₮"}
            </p>
            {movie.is_free ? (
              <Link href={"/movies/" + movie.id + "/watch"} className="block w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-black text-center transition-all">
                Үзэх
              </Link>
            ) : (
              <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-black transition-all">
                Төлбөр төлох
              </button>
            )}
            <p className="text-gray-600 text-xs text-center mt-3">QPay болон төлөнө</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-8 py-8 text-center text-gray-600 text-sm mt-10">
        <p className="font-bold text-gray-500 mb-1">MOVIE MN</p>
        <p>2024 &#169; Бүх эрх хуулиар хамгаалагдсан</p>
      </footer>
    </main>
  )
}