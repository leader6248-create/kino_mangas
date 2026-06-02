'use client'
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Нууц үг доод тал нь 6 тэмдэгт байх ёстой")
      return
    }
    if (password !== confirm) {
      setError("Нууц үг таарахгүй байна")
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message || "Бүртгэлд алдаа гарлаа")
      setLoading(false)
      return
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError("Бүртгэгдсэн боловч нэвтрэхэд алдаа гарлаа. Имэйл баталгаажуулалт асаалттай байж магадгүй.")
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    router.push("/")
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(to bottom, #0a0a0f, #0f0a1a)" }}>
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <img src="/logo.png" alt="Кино Мангас" className="h-14 w-auto object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-red-500 font-black text-2xl tracking-widest">КИНО</span>
            <span className="text-yellow-400 font-black text-2xl tracking-widest">МАНГАС</span>
          </div>
        </Link>

        <div className="bg-gray-900/80 backdrop-blur rounded-2xl border border-gray-800 p-8">
          <h1 className="text-2xl font-black text-white mb-6">Бүртгүүлэх</h1>

          {success ? (
            <div className="text-center py-6">
              <p className="text-green-400 text-base font-bold mb-2">Амжилттай бүртгэгдлээ! ✓</p>
              <p className="text-gray-400 text-sm">Нэвтрэх хуудас руу шилжиж байна...</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Имэйл</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Нууц үг</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-yellow-500 transition-colors"
                      placeholder="Доод тал нь 6 тэмдэгт"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 text-sm px-2 py-1"
                      tabIndex={-1}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Нууц үг давтах</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-yellow-500 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 text-sm px-2 py-1"
                      tabIndex={-1}
                    >
                      {showConfirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-black text-white transition-all hover:scale-105 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #dc2626, #f59e0b)" }}
                >
                  {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
                </button>
              </form>

              <p className="text-center text-gray-500 text-sm mt-6">
                Аль хэдийн бүртгэлтэй юу?{" "}
                <Link href="/login" className="text-yellow-400 hover:text-yellow-300 font-bold">
                  Нэвтрэх
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          <Link href="/" className="hover:text-yellow-400">← Нүүр хуудас</Link>
        </p>
      </div>
    </main>
  )
}
