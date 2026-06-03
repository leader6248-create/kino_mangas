'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  accessToken: string | null
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
})

async function fetchIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle()
    return !!data?.is_admin
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let settled = false

    // Hard fallback: if supabase never resolves the initial session
    // (iOS Safari has been seen to hang here), don't block the UI on
    // "Карж байна..." forever. After 3s, give up and proceed as
    // signed-out; a later auth-state event can still update state.
    const fallback = setTimeout(() => {
      if (mounted && !settled) {
        settled = true
        setLoading(false)
      }
    }, 3000)

    // supabase-js fires INITIAL_SESSION via onAuthStateChange on subscribe,
    // so we don't need a separate getSession() call (which is the call that
    // can hang). Relying solely on the subscription avoids that path.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      setAccessToken(session?.access_token ?? null)
      try {
        if (u) {
          const admin = await fetchIsAdmin(u.id)
          if (mounted) setIsAdmin(admin)
        } else {
          setIsAdmin(false)
        }
      } catch (err) {
        console.error("Auth state change error:", err)
      } finally {
        if (mounted && !settled) {
          settled = true
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setAccessToken(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
