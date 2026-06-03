'use client'
import { useEffect, useState } from "react"

const RELOAD_FLAG = "lastAutoReloadAt"
const AUTO_RELOAD_AFTER_MS = 5000
const RELOAD_COOLDOWN_MS = 15000 // don't auto-reload twice in a row

// Loading screen that auto-reloads the page once if it lingers — covers
// edge cases where the underlying data fetch silently hangs (a known
// iOS Safari + Supabase issue). A sessionStorage cooldown prevents an
// infinite reload loop.
export default function LoadingScreen({
  message = "Ачааллаж байна...",
  variant = "full",
}: { message?: string; variant?: "full" | "inline" }) {
  const [reloading, setReloading] = useState(false)
  const [showRetry, setShowRetry] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      const now = Date.now()
      const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0)
      if (now - last > RELOAD_COOLDOWN_MS) {
        sessionStorage.setItem(RELOAD_FLAG, String(now))
        setReloading(true)
        window.location.reload()
      } else {
        // We auto-reloaded recently and still loading — stop looping,
        // surface a manual retry instead.
        setShowRetry(true)
      }
    }, AUTO_RELOAD_AFTER_MS)
    return () => clearTimeout(t)
  }, [])

  const text = reloading ? "Дахин ачаалж байна..." : message

  if (variant === "inline") {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="animate-pulse">{text}</p>
        {showRetry && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-yellow-400 text-sm hover:underline"
          >
            Дахин оролдох
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-3">
      <div className="text-white text-xl animate-pulse">{text}</div>
      {showRetry && (
        <button
          onClick={() => window.location.reload()}
          className="text-yellow-400 text-sm hover:underline"
        >
          Дахин оролдох
        </button>
      )}
    </div>
  )
}
