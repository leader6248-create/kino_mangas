'use client'
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

export default function Header() {
  const { user, isAdmin, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-yellow-900/30 px-6 py-2 flex items-center justify-between"
      style={{ background: "rgba(10,8,20,0.95)" }}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Кино Мангас" className="h-12 w-auto object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-red-500 font-black text-xl tracking-widest">КИНО</span>
            <span className="text-yellow-400 font-black text-xl tracking-widest">МАНГАС</span>
          </div>
        </Link>
        <nav className="hidden md:flex gap-5 text-sm text-gray-400">
          <Link href="/" className="hover:text-yellow-400 transition-colors">Нүүр</Link>
          <Link href="/category/mongol" className="hover:text-yellow-400 transition-colors">Монгол кино</Link>
          <Link href="/category/hyatad" className="hover:text-yellow-400 transition-colors">Хятад кино</Link>
          <Link href="/category/amerik" className="hover:text-yellow-400 transition-colors">Америк кино</Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {loading ? (
          <div className="w-20 h-8 bg-gray-800 animate-pulse rounded-lg" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors"
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs" style={{ background: "linear-gradient(135deg, #dc2626, #f59e0b)" }}>
                {user.email?.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:block max-w-[120px] truncate">{user.email}</span>
              <span className="text-gray-500 text-xs">▾</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-xs text-gray-500">Нэвтэрсэн</p>
                  <p className="text-sm text-white font-bold truncate">{user.email}</p>
                </div>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-yellow-400 hover:bg-gray-800 transition-colors border-t border-gray-800"
                  >
                    ⚙️ Админ хэсэг
                  </Link>
                )}
                <button
                  onClick={async () => {
                    setMenuOpen(false)
                    await signOut()
                    window.location.href = "/"
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition-colors border-t border-gray-800"
                >
                  Гарах
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors"
            >
              Нэвтрэх
            </Link>
            <Link
              href="/register"
              className="text-white text-sm px-4 py-1.5 rounded-lg font-bold"
              style={{ background: "linear-gradient(135deg, #dc2626, #f59e0b)" }}
            >
              Бүртгүүлэх
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
