'use client'
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import Header from "@/components/Header"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function MyMoviesPage() {
  const { user, loading: authLoading } = useAuth()
  const [movies, setMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/login")
      return
    }

    async function load() {
      const { data } = await supabase
        .from("purchases")
        .select("created_at, movie:movies(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setMovies(data || [])
      setLoading(false)
    }
    load()
  }, [user, authLoading, router])

  return (
    <main className="min-h-screen text-white" style={{ background: "linear-gradient(to bottom, #0a0a0f, #0f0a1a)" }}>
      <Header />

      <section className="pt-24 px-6 pb-20 max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-yellow-400 transition-colors">← Нүүр</Link>
          <h1 className="text-4xl font-black mt-3 text-yellow-400">Миний кинонууд</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "..." : `${movies.length} кино худалдаж авсан`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Карж байна...</div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-gray-400 mb-4">Та одоогоор кино худалдаж аваагүй байна</p>
            <Link
              href="/"
              className="inline-block text-white px-6 py-3 rounded-xl font-bold"
              style={{ background: "linear-gradient(135deg, #dc2626, #f59e0b)" }}
            >
              Кино хайх
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((p) => p.movie && (
              <Link key={p.movie.id} href={"/movies/" + p.movie.id} className="group">
                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group-hover:border-yellow-500 transition-all duration-300 group-hover:scale-105">
                  <div className="relative">
                    <img src={p.movie.poster_url} alt={p.movie.title} className="w-full aspect-[2/3] object-cover" />
                    <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">✓ Авсан</span>
                    <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">{p.movie.year}</span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm truncate text-white">{p.movie.title}</p>
                    <p className="text-gray-400 text-xs mt-1">{p.movie.genre}</p>
                    <Link
                      href={"/movies/" + p.movie.id + "/watch"}
                      className="block text-center mt-2 bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 rounded-lg font-bold"
                    >
                      Үзэх
                    </Link>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
