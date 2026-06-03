import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Header from "@/components/Header"

async function getMovies() {
  const { data } = await supabase.from("movies").select("*").order("view_count", { ascending: false })
  return data || []
}

function formatViews(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + "W"
  if (n >= 1000) return (n / 1000).toFixed(1) + "K"
  return String(n || 0)
}

function MovieCard({ movie }) {
  return (
    <Link href={"/movies/" + movie.id} className="flex-shrink-0 group">
      <div className="w-40 md:w-48 bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group-hover:border-yellow-500 transition-all duration-300 group-hover:scale-105">
        <div className="relative">
          <img src={movie.poster_url} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <span className="text-white text-xs font-bold bg-red-600 px-2 py-1 rounded-full">Үзэх</span>
          </div>
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
  )
}

export default async function Home() {
  const movies = await getMovies()
  const featured = movies[0] || null
  const mongol = movies.filter(m => m.category === "Монгол кино")
  const hyatad = movies.filter(m => m.category === "Хятад кино")
  const amerik = movies.filter(m => m.category === "Америк кино")
  const topViews = [...movies].sort((a, b) => b.view_count - a.view_count).slice(0, 8)
  const newest = [...movies].sort((a, b) => b.year - a.year).slice(0, 8)
  const free = movies.filter(m => m.is_free)

  const sections = [
    { title: "Хамгийн олон үзэлттэй", slug: "top", movies: topViews },
    { title: "Шинэ кинонууд", slug: "new", movies: newest },
    { title: "Монгол кино", slug: "mongol", movies: mongol },
    { title: "Хятад кино", slug: "hyatad", movies: hyatad },
    { title: "Америк кино", slug: "amerik", movies: amerik },
    { title: "Үнэгүй кинонууд", slug: "free", movies: free },
  ]

  return (
    <main className="min-h-screen text-white" style={{background: "linear-gradient(to bottom, #0a0a0f, #0f0a1a)"}}>
      <Header />

      {featured && (
        <section className="relative h-[60vh] flex items-end pb-10 px-8 pt-16">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(" + featured.poster_url + ")" }} />
          <div className="absolute inset-0" style={{background: "linear-gradient(to right, rgba(10,8,20,0.98) 40%, rgba(10,8,20,0.4) 100%)"}} />
          <div className="absolute inset-0" style={{background: "linear-gradient(to top, rgba(10,8,20,1) 0%, transparent 60%)"}} />
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-white text-xs px-3 py-1 rounded-full font-bold" style={{background: "linear-gradient(135deg, #dc2626, #f59e0b)"}}>&#11088; ОНЦЛОХ</span>
              <span className="bg-gray-800/80 text-gray-300 text-xs px-3 py-1 rounded-full">{featured.category}</span>
              {featured.is_free && <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30">Үнэгүй</span>}
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-2 leading-tight">{featured.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
              <span className="text-yellow-400 font-black text-lg">&#9733; 9.2</span>
              <span>{featured.year}</span>
              <span>{featured.genre}</span>
              <span>{featured.view_count?.toLocaleString()} үзэлт</span>
            </div>
            <p className="text-gray-300 mb-5 text-sm leading-relaxed line-clamp-2">{featured.description}</p>
            <div className="flex gap-3 flex-wrap">
              <Link href={"/movies/" + featured.id} className="text-white px-7 py-3 rounded-xl font-black text-base transition-all hover:scale-105 shadow-lg flex items-center gap-2" style={{background: "linear-gradient(135deg, #dc2626, #f59e0b)"}}>
                &#9654; Одоо үзэх
              </Link>
              <span className="bg-gray-800/60 backdrop-blur text-yellow-400 px-5 py-3 rounded-xl font-black text-base border border-yellow-500/30">
                {featured.is_free ? "Үнэгүй" : featured.price?.toLocaleString() + "₮"}
              </span>
            </div>
          </div>
        </section>
      )}

      <div className="relative z-10 px-6 pb-10 space-y-6 -mt-4">
        {sections.map(section =>
          section.movies.length > 0 ? (
            <div key={section.title}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-black text-yellow-400">{section.title}</h3>
                <Link href={"/category/" + section.slug} className="text-xs text-gray-500 hover:text-yellow-400 transition-colors">Бүгдийг харах →</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {section.movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </div>
          ) : null
        )}
      </div>

      <footer className="border-t border-yellow-900/30 px-8 py-6 text-center" style={{background: "rgba(10,8,20,0.95)"}}>
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-red-500 font-black text-xl tracking-widest">КИНО</span>
          <span className="text-yellow-400 font-black text-xl tracking-widest">МАНГАС</span>
        </div>
        <p className="text-gray-600 text-xs">2024 &#169; Бүх эрх хуулиар хамгаалагдсан</p>
      </footer>
    </main>
  )
}