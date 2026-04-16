"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, differenceInCalendarDays } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react"
import { Spinner } from "@/components/spinner"
import Link from "next/link"

export default function MyBookingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push("/auth/login")
    }
  }, [user, router, isHydrated])

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["myBookings"],
    queryFn: () => fetchApi("/user/bookings"),
    enabled: !!user
  })

  if (!isHydrated || isLoading) {
    return <Spinner />
  }

  if (!user) return null

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Мои бронирования</h1>
          <p className="text-muted-foreground">Все ваши забронированные квартиры</p>
        </div>
      </div>

      <div className="space-y-4">
        {(!bookings || bookings.length === 0) ? (
          <div className="bg-muted/30 border border-dashed rounded-xl p-12 text-center text-muted-foreground">
            У вас пока нет бронирований
          </div>
        ) : (
          bookings.map((booking: any) => {
            const startDate = new Date(booking.start_date)
            const endDate = new Date(booking.end_date)
            const nights = differenceInCalendarDays(endDate, startDate)
            const isPast = endDate < new Date()

            return (
              <Card key={booking.id} className={`overflow-hidden transition-colors ${isPast ? 'opacity-60 bg-muted/20' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="bg-muted p-6 md:w-56 border-b md:border-b-0 md:border-r flex flex-col justify-center items-center text-center gap-1">
                    <CalendarIcon className="w-6 h-6 text-primary mb-2 opacity-80" />
                    <span className="font-semibold text-lg">{format(startDate, "d MMMM", { locale: ru })}</span>
                    <span className="text-muted-foreground text-sm">↓ {nights} ноч{nights === 1 ? 'ь' : (nights < 5 ? 'и' : 'ей')}</span>
                    <span className="font-semibold text-lg">{format(endDate, "d MMMM", { locale: ru })}</span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="font-semibold text-xl">Гость: {booking.guest_name}</span>
                        <p className="text-sm text-muted-foreground">Телефон: {booking.guest_phone}</p>
                      </div>
                      <div className="text-right">
                        {isPast && <span className="inline-block text-xs font-semibold px-2 py-1 bg-muted rounded-full">Завершено</span>}
                      </div>
                    </div>

                    <Link href={`/apartments/${booking.apartment_id}`} className="mt-4">
                      <Button variant="outline" size="sm">Перейти к квартире</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
