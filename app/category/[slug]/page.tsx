import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "@/components/Header"

const CATEGORIES: Record<string, { title: string; filter: (m: any) => boolean }> = {
  mongol: { title: "Монгол кино", filter: (m) => m.category === "Монгол кино" },
  hyatad: { title: "Хятад кино", filter: (m) => m.category === "Хятад кино" },
  amerik: { title: "Америк кино", filter: (m) => m.category === "Америк кино" },
  free: { title: "Үнэгүй кинонууд", filter: (m) => m.is_free },
  new: { title: "Шинэ кинонууд", filter: () => true },
  top: { title: "Хамгийн олон үзэлттэй", filter: () => true },
}

function formatViews(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + "W"
  if (n >= 1000) return (n / 1000).toFixed(1) + "K"
  return String(n || 0)
}

async function getMovies() {
  const { data } = await supabase.from("movies").select("*")
  return data || []
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const config = CATEGORIES[slug]
  if (!config) notFound()

  const all = await getMovies()
  let movies = all.filter(config.filter)

  if (slug === "new") movies = movies.sort((a, b) => b.year - a.year)
  if (slug === "top") movies = movies.sort((a, b) => b.view_count - a.view_count)

  return (
    <main className="min-h-screen text-white" style={{ background: "linear-gradient(to bottom, #0a0a0f, #0f0a1a)" }}>
      <Header />

      <section className="pt-24 px-6 pb-20 max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-yellow-400 transition-colors">← Нүүр</Link>
          <h1 className="text-4xl font-black mt-3 text-yellow-400">{config.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{movies.length} кино</p>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Энэ ангилалд кино байхгүй байна</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <Link key={movie.id} href={"/movies/" + movie.id} className="group">
                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group-hover:border-yellow-500 transition-all duration-300 group-hover:scale-105">
                  <div className="relative">
                    <img src={movie.poster_url} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
                    {movie.is_free && (
                      <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">Үнэгүй</span>
                    )}
                    <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">{movie.year}</span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm truncate text-white">{movie.title}</p>
                    <p className="text-gray-400 text-xs mt-1">{movie.genre}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-400 text-xs">{formatViews(movie.view_count)} үзэлт</span>
                      <span className={"text-xs font-bold " + (movie.is_free ? "text-green-400" : "text-yellow-400")}>
                        {movie.is_free ? "Үнэгүй" : movie.price?.toLocaleString() + "₮"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-yellow-900/30 px-8 py-10 text-center" style={{ background: "rgba(10,8,20,0.95)" }}>
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="text-red-500 font-black text-2xl tracking-widest">КИНО</span>
          <span className="text-yellow-400 font-black text-2xl tracking-widest">МАНГАС</span>
        </div>
        <p className="text-gray-600 text-sm">2024 &#169; Бүх эрх хуулиар хамгаалагдсан</p>
      </footer>
    </main>
  )
}
