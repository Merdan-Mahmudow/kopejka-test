import { create } from "zustand"
import { persist } from "zustand/middleware"
import { API_URL } from "./api"

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  gender: string
  created_at: string
}

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: async () => {
        try {
          await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" })
        } catch (e) {
          // ignore network errors on logout
        }
        set({ user: null })
      },
    }),
    {
      name: "auth-storage",
    }
  )
)
