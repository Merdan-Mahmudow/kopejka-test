"use client"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, differenceInCalendarDays } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar as CalendarIcon, Phone, User, Home, ArrowLeft } from "lucide-react"

export default function ApartmentBookingsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && user === null) {
      router.push("/auth/login")
    }
  }, [user, router, isHydrated])

  const { data: apt, isLoading: isLoadingApt } = useQuery({
    queryKey: ["apartment", params.id],
    queryFn: () => fetchApi(`/apartments/${params.id}`)
  })

  useEffect(() => {
    if (apt && user && apt.owner_id !== user.id) {
        toast.error("У вас нет прав для просмотра бронирований этого объявления")
        router.push(`/apartments/${params.id}`)
    }
  }, [apt, user, router, params.id])

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["ownerBookings", params.id],
    queryFn: () => fetchApi(`/apartments/${params.id}/bookings/owner`),
    enabled: !!apt && !!user && apt.owner_id === user.id
  })

  // Calculate total revenue from all bookings to make the dashboard nice
  const totalRevenue = bookings ? bookings.reduce((sum: number, b: any) => {
    const days = differenceInCalendarDays(new Date(b.end_date), new Date(b.start_date))
    return sum + (days * (apt?.price || 0))
  }, 0) : 0;

  if (!isHydrated || isLoadingApt || isLoading || !apt) {
    return <Spinner />
  }

  if (!user) return null;

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/apartments/${params.id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Бронирования</h1>
          <p className="text-muted-foreground">{apt.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-primary">Всего заявок</CardDescription>
            <CardTitle className="text-4xl">{bookings?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-primary">Ожидаемая выручка</CardDescription>
            <CardTitle className="text-4xl">{totalRevenue} ₽</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Список гостей</h2>
      <div className="space-y-4">
        {bookings?.length === 0 ? (
          <div className="bg-muted/30 border border-dashed rounded-xl p-12 text-center text-muted-foreground">
            Пока нет ни одного бронирования
          </div>
        ) : (
          bookings?.map((booking: any) => {
            const startDate = new Date(booking.start_date)
            const endDate = new Date(booking.end_date)
            const nights = differenceInCalendarDays(endDate, startDate)
            const isPast = endDate < new Date()

            return (
              <Card key={booking.id} className={`overflow-hidden transition-colors ${isPast ? 'opacity-60 bg-muted/20' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center">
                  {/* Dates Sidebar Area */}
                  <div className="bg-muted p-6 md:w-64 border-b md:border-b-0 md:border-r flex flex-col justify-center items-center text-center gap-1">
                    <CalendarIcon className="w-6 h-6 text-primary mb-2 opacity-80" />
                    <span className="font-semibold text-lg">{format(startDate, "d MMMM", { locale: ru })}</span>
                    <span className="text-muted-foreground text-sm">↓ {nights} ноч{nights === 1 ? 'ь' : (nights < 5 ? 'и' : 'ей')}</span>
                    <span className="font-semibold text-lg">{format(endDate, "d MMMM", { locale: ru })}</span>
                  </div>
                  
                  {/* Info Area */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <span className="font-semibold text-xl">{booking.guest_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${booking.guest_phone}`} className="text-primary hover:underline">
                            {booking.guest_phone}
                          </a>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Сумма к оплате</div>
                        <div className="text-2xl font-bold">{nights * apt.price} ₽</div>
                        {isPast && <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 bg-muted rounded-full">Завершено</span>}
                      </div>
                    </div>
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
