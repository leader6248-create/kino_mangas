const fs = require('fs')

const adminPage = `'use client'
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const EMPTY = { title: "", description: "", poster_url: "", youtube_id: "", price: 3000, genre: "", year: 2024, category: "\u041c\u043e\u043d\u0433\u043e\u043b \u043a\u0438\u043d\u043e", is_free: false }

export default function AdminPage() {
  const [movies, setMovies] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState("")
  const [tab, setTab] = useState("list")

  useEffect(() => { loadMovies() }, [])

  async function loadMovies() {
    const { data } = await supabase.from("movies").select("*").order("created_at", { ascending: false })
    setMovies(data || [])
  }

  async function uploadPoster(file) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = Date.now() + '.' + ext
    const { error } = await supabase.storage.from('posters').upload(fileName, file, { upsert: true })
    if (error) { alert('\u0410\u043b\u0434\u0430\u0430: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fileName)
    setForm(f => ({...f, poster_url: urlData.publicUrl}))
    setUploading(false)
  }

  async function saveMovie() {
    setLoading(true)
    setMsg("")
    if (!form.title || !form.youtube_id) {
      setMsg("\u0413\u0430\u0440\u0447\u0438\u0433 \u0431\u043e\u043b\u043e\u043d \u0442\u0430\u043b\u0431\u0430\u0440\u0443\u0443\u0434\u044b\u0433 \u0431\u04e9\u0433\u043b\u04e9\u04e9\u0440\u04d9\u0439!")
      setLoading(false)
      return
    }
    const payload = {
      title: form.title,
      description: form.description,
      poster_url: form.poster_url,
      youtube_id: form.youtube_id,
      price: form.is_free ? 0 : Number(form.price),
      genre: form.genre,
      year: Number(form.year),
      category: form.category,
      is_free: form.is_free
    }
    if (editing) {
      const { error } = await supabase.from("movies").update(payload).eq("id", editing)
      if (error) { setMsg("\u0410\u043b\u0434\u0430\u0430: " + error.message); setLoading(false); return }
      setMsg("\u0410\u043c\u0436\u0438\u043b\u0442\u0442\u0430\u0439 \u0437\u0430\u0441\u0432\u0430\u0440\u043b\u0430\u0433\u0434\u043b\u0430\u0430!")
    } else {
      const { error } = await supabase.from("movies").insert(payload)
      if (error) { setMsg("\u0410\u043b\u0434\u0430\u0430: " + error.message); setLoading(false); return }
      setMsg("\u0410\u043c\u0436\u0438\u043b\u0442\u0442\u0430\u0439 \u043d\u044d\u043c\u044d\u0433\u0434\u043b\u044d\u044d!")
    }
    setForm(EMPTY)
    setEditing(null)
    setTab("list")
    await loadMovies()
    setLoading(false)
  }

  async function deleteMovie(id) {
    if (!confirm("\u0423\u0441\u0442\u0433\u0430\u0445 \u0443\u0443?")) return
    await supabase.from("movies").delete().eq("id", id)
    loadMovies()
  }

  function editMovie(movie) {
    setForm({
      title: movie.title || "",
      description: movie.description || "",
      poster_url: movie.poster_url || "",
      youtube_id: movie.youtube_id || "",
      price: movie.price || 3000,
      genre: movie.genre || "",
      year: movie.year || 2024,
      category: movie.category || "\u041c\u043e\u043d\u0433\u043e\u043b \u043a\u0438\u043d\u043e",
      is_free: movie.is_free || false
    })
    setEditing(movie.id)
    setTab("add")
  }

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
  const lbl = "block text-gray-400 text-xs mb-1.5 font-medium"

  return (
    <main className="min-h-screen text-white" style={{background: "linear-gradient(to bottom, #0a0a0f, #0f0a1a)"}}>
      <header className="backdrop-blur-md border-b border-yellow-900/30 px-6 py-3 flex items-center justify-between" style={{background: "rgba(10,8,20,0.95)"}}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-red-500 font-black text-lg tracking-widest">\u041a\u0418\u041d\u041e</span>
            <span className="text-yellow-400 font-black text-lg tracking-widest">\u041c\u0410\u041d\u0413\u0410\u0421</span>
          </Link>
          <span className="text-gray-600 mx-1">|</span>
          <span className="text-gray-300 font-bold">Admin</span>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-yellow-400">\u2190 \u0421\u0430\u0439\u0442 \u0440\u0443\u0443 \u0445\u0430\u0440\u0438\u0445</Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-8">
          <button onClick={() => { setTab("list"); setEditing(null); setForm(EMPTY) }}
            className={"px-6 py-2.5 rounded-lg font-bold text-sm " + (tab === "list" ? "text-white" : "bg-gray-800 text-gray-400")}
            style={tab === "list" ? {background: "linear-gradient(135deg,#dc2626,#f59e0b)"} : {}}>
            \u0416\u0430\u0433\u0441\u0430\u0430\u043b\u0442 ({movies.length})
          </button>
          <button onClick={() => { setTab("add"); setEditing(null); setForm(EMPTY) }}
            className={"px-6 py-2.5 rounded-lg font-bold text-sm " + (tab === "add" && !editing ? "text-white" : "bg-gray-800 text-gray-400")}
            style={tab === "add" && !editing ? {background: "linear-gradient(135deg,#dc2626,#f59e0b)"} : {}}>
            + \u0428\u0438\u043d\u044d \u043a\u0438\u043d\u043e
          </button>
        </div>

        {msg && (
          <div className={"mb-6 px-4 py-3 rounded-lg text-sm font-bold " + (msg.includes("\u0410\u043c\u0436\u0438\u043b\u0442\u0442\u0430\u0439") ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30")}>
            {msg}
          </div>
        )}

        {tab === "list" && (
          <div className="grid gap-4">
            {movies.length === 0 && <div className="text-center py-20 text-gray-500">\u041a\u0438\u043d\u043e \u0431\u0430\u0439\u0445\u0433\u04af\u0439</div>}
            {movies.map(movie => (
              <div key={movie.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-4 hover:border-yellow-500/50 transition-colors">
                <img src={movie.poster_url || "/placeholder.jpg"} alt={movie.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-800" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg truncate">{movie.title}</h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-gray-400 text-xs bg-gray-800 px-2 py-0.5 rounded">{movie.category}</span>
                    <span className="text-gray-400 text-xs">{movie.genre}</span>
                    <span className="text-gray-400 text-xs">{movie.year}</span>
                    <span className="text-gray-500 text-xs">{movie.view_count?.toLocaleString()} \u04af\u0437\u044d\u043b\u0442</span>
                    <span className={movie.is_free ? "text-green-400 text-xs font-bold" : "text-yellow-400 text-xs font-bold"}>
                      {movie.is_free ? "\u04ae\u043d\u044d\u0433\u04af\u0439" : movie.price?.toLocaleString() + "\u20ae"}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1 truncate">{movie.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => editMovie(movie)} className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-2 rounded-lg text-sm font-bold border border-yellow-500/30">
                    \u0417\u0430\u0441\u0432\u0430\u0440\u043b\u0430\u0445
                  </button>
                  <button onClick={() => deleteMovie(movie.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/30">
                    \u0423\u0441\u0442\u0433\u0430\u0445
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "add" && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl">
            <h2 className="text-xl font-black mb-6 text-yellow-400">{editing ? "\u041a\u0438\u043d\u043e \u0437\u0430\u0441\u0432\u0430\u0440\u043b\u0430\u0445" : "\u0428\u0438\u043d\u044d \u043a\u0438\u043d\u043e \u043d\u044d\u043c\u044d\u0445"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={lbl}>\u0413\u0430\u0440\u0447\u0438\u0433 *</label>
                <input className={inp} placeholder="\u041a\u0438\u043d\u043e\u043d\u044b \u043d\u044d\u0440" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>\u0422\u0430\u0439\u043b\u0431\u0430\u0440</label>
                <textarea className={inp + " h-24 resize-none"} placeholder="\u041a\u0438\u043d\u043e\u043d\u044b \u0442\u0443\u0445\u0430\u0439..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className={lbl}>YouTube ID *</label>
                <input className={inp} placeholder="dQw4w9WgXcQ" value={form.youtube_id} onChange={e => setForm({...form, youtube_id: e.target.value})} />
                <p className="text-gray-600 text-xs mt-1">youtube.com/watch?v=<span className="text-yellow-500">ID</span></p>
              </div>
              <div>
                <label className={lbl}>\u0410\u043d\u0433\u0438\u043b\u0430\u043b</label>
                <select className={inp} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="\u041c\u043e\u043d\u0433\u043e\u043b \u043a\u0438\u043d\u043e">\u041c\u043e\u043d\u0433\u043e\u043b \u043a\u0438\u043d\u043e</option>
                  <option value="\u0425\u044f\u0442\u0430\u0434 \u043a\u0438\u043d\u043e">\u0425\u044f\u0442\u0430\u0434 \u043a\u0438\u043d\u043e</option>
                  <option value="\u0410\u043c\u0435\u0440\u0438\u043a \u043a\u0438\u043d\u043e">\u0410\u043c\u0435\u0440\u0438\u043a \u043a\u0438\u043d\u043e</option>
                </select>
              </div>
              <div>
                <label className={lbl}>\u0422\u04e9\u0440\u04e9\u043b</label>
                <input className={inp} placeholder="\u0414\u0440\u0430\u043c, \u042d\u043a\u0448\u043d..." value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} />
              </div>
              <div>
                <label className={lbl}>\u0413\u0430\u0440\u0441\u043d\u044b \u043e\u043d</label>
                <input className={inp} type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className={lbl}>\u04ae\u043d\u044d (\u0442\u04e9\u0433\u0440\u04e9\u0433)</label>
                <input className={inp} type="number" value={form.price} disabled={form.is_free} onChange={e => setForm({...form, price: parseInt(e.target.value)})} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_free" checked={form.is_free} onChange={e => setForm({...form, is_free: e.target.checked, price: e.target.checked ? 0 : 3000})} className="w-4 h-4 accent-yellow-500" />
                <label htmlFor="is_free" className="text-gray-300 text-sm font-medium cursor-pointer">\u04ae\u043d\u044d\u0433\u04af\u0439 \u043a\u0438\u043d\u043e</label>
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>\u041f\u043e\u0441\u0442\u0435\u0440 \u0437\u0443\u0440\u0430\u0433 \u0442\u0430\u0442\u0430\u0445</label>
                <input type="file" accept="image/*"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm file:bg-yellow-500 file:text-black file:border-0 file:rounded file:px-3 file:py-1 file:font-bold file:mr-3 cursor-pointer"
                  onChange={async (e) => { const file = e.target.files?.[0]; if (file) await uploadPoster(file) }} />
                {uploading && <p className="text-yellow-400 text-xs mt-1">\u0425\u0430\u0434\u0430\u043b\u0430\u0436 \u0431\u0430\u0439\u043d\u0430...</p>}
                <p className="text-gray-600 text-xs mt-2">\u042d\u0441\u0432\u044d\u043b URL \u0448\u0443\u0443\u0434 \u0431\u0438\u0447\u0438\u0436 \u0431\u043e\u043b\u043d\u043e:</p>
                <input className={inp + " mt-1"} placeholder="https://..." value={form.poster_url} onChange={e => setForm({...form, poster_url: e.target.value})} />
              </div>
              {form.poster_url && (
                <div className="md:col-span-2">
                  <label className={lbl}>\u0423\u0440\u044c\u0434\u0447\u043b\u0430\u043b</label>
                  <img src={form.poster_url} alt="preview" className="h-48 rounded-lg object-cover border border-gray-700" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveMovie} disabled={loading || uploading}
                className="text-white px-8 py-3 rounded-lg font-black hover:scale-105 disabled:opacity-50 transition-all"
                style={{background: "linear-gradient(135deg,#dc2626,#f59e0b)"}}>
                {loading ? "\u0425\u0430\u0434\u0430\u043b\u0430\u0436 \u0431\u0430\u0439\u043d\u0430..." : editing ? "\u0425\u0430\u0434\u0430\u0433\u043b\u0430\u0445" : "\u041d\u044d\u043c\u044d\u0445"}
              </button>
              <button onClick={() => { setForm(EMPTY); setEditing(null); setTab("list") }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-3 rounded-lg font-bold">
                \u0426\u0443\u0446\u043b\u0430\u0445
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}`

fs.writeFileSync('app/admin/page.tsx', adminPage, 'utf8')
console.log('Done!')