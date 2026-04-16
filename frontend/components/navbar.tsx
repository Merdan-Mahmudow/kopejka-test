"use client"
import Link from "next/link"
import { useAuthStore } from "@/lib/store"
import { Button } from "./ui/button"

export function Navbar() {
  const { user, logout } = useAuthStore()

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Rent<span className="text-primary">Hub</span>
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/apartments/create">
                <Button variant="ghost">Сдать квартиру</Button>
              </Link>
              <Link href="/bookings">
                <Button variant="ghost">Мои брони</Button>
              </Link>
              <div className="text-sm text-muted-foreground mr-2">{user.email}</div>
              <Button variant="outline" onClick={logout}>Выйти</Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost">Войти</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Регистрация</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
