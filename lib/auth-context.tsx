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

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        const u = session?.user ?? null
        setUser(u)
        setAccessToken(session?.access_token ?? null)
        if (u) {
          const admin = await fetchIsAdmin(u.id)
          if (mounted) setIsAdmin(admin)
        }
      } catch (err) {
        console.error("Auth init error:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

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
        if (mounted) setLoading(false)
      }
    })

    return () => {
      mounted = false
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
