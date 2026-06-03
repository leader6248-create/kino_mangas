'use client'
import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

function formatViews(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + "W"
  if (n >= 1000) return (n / 1000).toFixed(1) + "K"
  return String(n || 0)
}

function QpayModal({ movie, userId, accessToken, onClose, onSuccess }) {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState("")
  // Visible debug log shown at the bottom of the modal — every check call
  // appends a line so the user can screenshot exactly what's happening.
  const [debugLog, setDebugLog] = useState<string[]>([])
  const appendDebug = useCallback((line: string) => {
    const ts = new Date().toTimeString().slice(0, 8)
    setDebugLog((prev) => [...prev.slice(-9), `${ts} ${line}`])
  }, [])
  // Guards against recording the same payment twice (auto-poll + manual click
  // can both detect "paid" at the same time).
  const finalizedRef = useRef(false)

  useEffect(() => {
    async function createInvoice() {
      try {
        appendDebug("create: posting…")
        const res = await fetch("/api/qpay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieId: movie.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Алдаа гарлаа")
        setInvoice(data)
        appendDebug(`create OK invoice=${String(data.invoice_id).slice(0, 12)}`)
      } catch (err: any) {
        setError(err.message)
        appendDebug(`create ERR ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    createInvoice()
  }, [movie.id, appendDebug])

  const recordPurchase = useCallback(async (qpayInvoiceId: string) => {
    // Use the access token captured by the auth context at sign-in time.
    // Calling supabase.auth.getSession() here would hang on iOS Safari at
    // the worst moment (right after payment), leaving the modal stuck.
    if (!accessToken) {
      appendDebug("record: NO TOKEN PROP")
      throw new Error("Нэвтэрсэн сэшн олдсонгүй — дахин нэвтрэх шаардлагатай")
    }
    appendDebug(`record: posting (tok=${accessToken.length}b)`)
    const res = await fetch("/api/qpay/record-purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ movieId: movie.id, invoiceId: qpayInvoiceId }),
    })
    const txt = await res.text()
    appendDebug(`record: ${res.status} ${txt.slice(0, 80)}`)
    if (!res.ok) {
      let parsed: any = {}
      try { parsed = JSON.parse(txt) } catch {}
      console.error("Purchase record error:", parsed)
      throw new Error(parsed.error || `HTTP ${res.status}`)
    }
  }, [movie.id, accessToken, appendDebug])

  // Records the purchase and navigates exactly once, even if both the
  // auto-poller and the manual button detect payment simultaneously.
  const finalize = useCallback(async (qpayInvoiceId: string) => {
    if (finalizedRef.current) return
    finalizedRef.current = true
    try {
      await recordPurchase(qpayInvoiceId)
      onSuccess()
    } catch (err) {
      finalizedRef.current = false // let the user retry
      throw err
    }
  }, [recordPurchase, onSuccess])

  const checkPayment = useCallback(async () => {
    if (!invoice?.invoice_id || checking) return
    setChecking(true)
    setError("")
    appendDebug("check (manual)…")
    try {
      const res = await fetch(`/api/qpay/check?invoice_id=${invoice.invoice_id}`)
      const data = await res.json()
      const cnt = data?.data?.count ?? 0
      appendDebug(`check: paid=${data.paid} count=${cnt}`)
      if (data.paid) {
        await finalize(invoice.invoice_id)
      } else {
        setError("Төлбөр хараахан баталгаажаагүй байна. Төлбөрөө төлсний дараа дахин шалгана уу.")
      }
    } catch (err: any) {
      appendDebug(`check ERR ${err?.message}`)
      setError(err?.message || "Шалгахад алдаа гарлаа")
    } finally {
      setChecking(false)
    }
  }, [invoice, checking, finalize, appendDebug])

  useEffect(() => {
    if (!invoice?.invoice_id) return
    appendDebug("auto-poll started (2s)")
    // Single-flight guard: skip a tick if the previous /check is still
    // in flight, so a slow QPay response can't queue up parallel calls
    // when the interval is short.
    let inFlight = false
    const timer = setInterval(async () => {
      if (inFlight) return
      inFlight = true
      try {
        const res = await fetch(`/api/qpay/check?invoice_id=${invoice.invoice_id}`)
        const data = await res.json()
        const cnt = data?.data?.count ?? 0
        appendDebug(`auto: paid=${data.paid} count=${cnt}`)
        if (data.paid) {
          clearInterval(timer)
          await finalize(invoice.invoice_id)
        }
      } catch (err: any) {
        console.error("Auto-check error:", err)
        appendDebug(`auto ERR ${err?.message}`)
        setError(err?.message || "Худалдан авалтыг баталгаажуулахад алдаа гарлаа")
      } finally {
        inFlight = false
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [invoice, finalize, appendDebug])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-white">QPay төлбөр</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="text-center mb-4">
          <p className="text-gray-400 text-sm">{movie.title}</p>
          <p className="text-3xl font-black text-yellow-400 mt-1">{movie.price?.toLocaleString()}₮</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Invoice үүсгэж байна...</p>
          </div>
        )}

        {!loading && error && !invoice && (
          <div className="text-center py-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {invoice && (
          <>
            <div className="bg-white rounded-xl p-3 flex items-center justify-center mb-4">
              {invoice.qr_image ? (
                <img
                  src={`data:image/png;base64,${invoice.qr_image}`}
                  alt="QPay QR"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <p className="text-gray-500 text-xs text-center p-4">QR код ачааллаагүй байна</p>
              )}
            </div>

            <p className="text-gray-400 text-xs text-center mb-4">
              QPay апп-аар QR кодыг скан хийж төлбөрөө төлнө үү
            </p>

            {invoice.urls && invoice.urls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {invoice.urls.slice(0, 4).map((u: any, i: number) => {
                  // QPay returns mostly custom-scheme deeplinks (khanbank://, qpaywallet://,
                  // statebank://, xacbank://, ...). Mobile browsers refuse to open those
                  // in a new tab via target="_blank" — the OS app-intent only fires for
                  // same-window navigations. Open web URLs in a new tab, deeplinks in place.
                  const isWeb = /^https?:/i.test(u.link)
                  return (
                    <a
                      key={i}
                      href={u.link}
                      {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded-lg text-center transition-colors border border-gray-700 truncate"
                    >
                      {u.name}
                    </a>
                  )
                })}
              </div>
            )}

            {error && <p className="text-yellow-400 text-xs text-center mb-3">{error}</p>}

            <button
              onClick={checkPayment}
              disabled={checking}
              className="w-full py-3 rounded-xl font-black text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #dc2626, #f59e0b)" }}
            >
              {checking ? "Шалгаж байна..." : "Төлбөр шалгах"}
            </button>

            {debugLog.length > 0 && (
              <div className="mt-4 bg-black/60 border border-gray-800 rounded-lg p-2 max-h-40 overflow-y-auto">
                <p className="text-gray-500 text-[10px] font-bold mb-1">DEBUG (screenshot үүнийг)</p>
                <p className="text-gray-500 text-[10px] mb-1 break-all">
                  invoice: {String(invoice?.invoice_id || "-").slice(0, 20)}…
                </p>
                {debugLog.map((line, i) => (
                  <p key={i} className="text-green-400 text-[10px] font-mono leading-tight break-all">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LoginPrompt({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h3 className="text-xl font-black text-white mb-2">Нэвтрэх шаардлагатай</h3>
        <p className="text-gray-400 text-sm mb-6">
          Кино худалдан авахын тулд эхлээд бүртгэлдээ нэвтэрнэ үү
        </p>
        <div className="flex gap-2">
          <Link
            href="/login"
            className="flex-1 py-3 rounded-xl font-black text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #dc2626, #f59e0b)" }}
          >
            Нэвтрэх
          </Link>
          <Link
            href="/register"
            className="flex-1 py-3 rounded-xl font-black text-white bg-gray-800 hover:bg-gray-700 transition-all border border-gray-700"
          >
            Бүртгүүлэх
          </Link>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-sm mt-4">
          Болих
        </button>
      </div>
    </div>
  )
}

export default function MoviePage({ params }) {
  const { id } = use(params)
  const { user, accessToken, loading: authLoading } = useAuth()
  const [movie, setMovie] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [purchased, setPurchased] = useState(false)
  const [showQpay, setShowQpay] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("movies").select("*").eq("id", id).single()
      setMovie(data)

      if (user && data && !data.is_free) {
        const { data: purchase } = await supabase
          .from("purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("movie_id", id)
          .maybeSingle()
        setPurchased(!!purchase)
      }
      setLoading(false)
    }
    if (!authLoading) load()
  }, [id, user, authLoading])

  const handlePaySuccess = useCallback(() => {
    setShowQpay(false)
    setPurchased(true)
    router.push(`/movies/${id}/watch`)
  }, [id, router])

  const handleBuy = () => {
    if (!user) {
      setShowLogin(true)
    } else {
      setShowQpay(true)
    }
  }

  if (loading || authLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-xl animate-pulse">Ачааллаж байна...</div>
    </div>
  )

  if (!movie) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-4">
      <div className="text-white text-xl">Кино олдсонгүй</div>
      <Link href="/" className="text-red-400 hover:text-red-300">← Нүүр хуудас руу харих</Link>
    </div>
  )

  const canWatch = movie.is_free || purchased

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {showQpay && user && (
        <QpayModal
          movie={movie}
          userId={user.id}
          accessToken={accessToken}
          onClose={() => setShowQpay(false)}
          onSuccess={handlePaySuccess}
        />
      )}

      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}

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
            {purchased && <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/30">✓ Худалдаж авсан</span>}
          </div>
          <h1 className="text-5xl font-black mb-4 leading-tight">{movie.title}</h1>
          <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
            <span className="text-yellow-400 font-bold text-base">&#9733; 9.2</span>
            <span>{formatViews(movie.view_count)} үзэлт</span>
            <span>{movie.year} он</span>
          </div>
          <p className="text-gray-300 text-base leading-relaxed mb-8 max-w-xl">{movie.description}</p>
          <div className="flex gap-3 flex-wrap items-center">
            {canWatch ? (
              <Link href={"/movies/" + movie.id + "/watch"} className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-xl font-black text-lg transition-all hover:scale-105 shadow-lg shadow-red-900/40">
                &#9654; Үзэх
              </Link>
            ) : (
              <button
                onClick={handleBuy}
                className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-xl font-black text-lg transition-all hover:scale-105 shadow-lg shadow-red-900/40"
              >
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
            {canWatch ? (
              <Link href={"/movies/" + movie.id + "/watch"} className="block w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-black text-center transition-all">
                Үзэх
              </Link>
            ) : (
              <button
                onClick={handleBuy}
                className="w-full text-white py-3 rounded-xl font-black transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #dc2626, #f59e0b)" }}
              >
                QPay-аар төлөх
              </button>
            )}
            <p className="text-gray-600 text-xs text-center mt-3">QPay-аар төлбөр төлнө</p>
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
