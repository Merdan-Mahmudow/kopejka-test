"use client"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { fetchApi } from "@/lib/api"
import { useParams } from "next/navigation"
import { useState } from "react"
import { MapPin, Calendar as CalendarIcon, User } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { format } from "date-fns"
import { useAuthStore } from "@/lib/store"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"

import { differenceInCalendarDays } from "date-fns"

export default function ApartmentDetailsPage() {
  const params = useParams()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)

  const { data: apt, isLoading } = useQuery({
    queryKey: ["apartment", params.id],
    queryFn: () => fetchApi(`/apartments/${params.id}`)
  })

  const { data: bookings } = useQuery({
    queryKey: ["apartmentBookings", params.id],
    queryFn: () => fetchApi(`/apartments/${params.id}/bookings`)
  })

  const form = useForm({
    defaultValues: {
      dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
      guest_name: "",
      guest_phone: ""
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      if (!value.dateRange.from || !value.dateRange.to) {
        toast.warning("Выберите даты")
        return
      }
      try {
        await fetchApi(`/apartments/${params.id}/book`, {
          method: "POST",
          body: JSON.stringify({
            start_date: format(value.dateRange.from, "yyyy-MM-dd"),
            end_date: format(value.dateRange.to, "yyyy-MM-dd"),
            guest_name: value.guest_name,
            guest_phone: value.guest_phone
          })
        })
        toast.success("Успешно забронировано!")
        setOpen(false)
      } catch (err: any) {
        toast.error(err.message)
      }
    }
  })

  if (isLoading) return <Spinner />
  if (!apt) return <div className="p-8">Не найдено</div>

  const isOwner = user?.id === apt.owner_id;

  // We will compute dateRange and isSubmitting inside form.Subscribe instead

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-4">{apt.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="aspect-video bg-muted rounded-xl overflow-hidden relative">
            <img
              src={apt.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80'}
              alt="Квартира"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-3 py-4 border-b">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="text-primary w-5 h-5" />
              <span className="text-foreground font-medium text-lg">Локация: {apt.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="text-primary w-5 h-5" />
              <span className="text-foreground">Свободные даты смотрите в календаре бронирования</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">Описание</h2>
            <p className="text-muted-foreground whitespace-pre-line">{apt.description || "Описания нет"}</p>
          </div>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold">{apt.price} ₽</span>
                <span className="text-muted-foreground">/ ночь</span>
              </div>

              <div className="bg-muted/50 p-4 rounded-xl mb-6 space-y-3">
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Владелец</div>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <span className="font-medium text-lg">{apt.owner?.full_name || "Имя не указано"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm">{apt.owner?.phone || "Телефон скрыт"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {isOwner ? (
                  <>
                    <Button size="lg" variant="outline" className="h-14 flex-shrink-0 px-6 font-medium text-lg" asChild>
                      <Link href={`/apartments/${apt.id}/bookings`}>
                        Бронирования
                      </Link>
                    </Button>
                    <Button size="lg" className="h-14 flex-shrink-0 px-6 font-medium text-lg" asChild>
                      <Link href={`/apartments/${apt.id}/edit`}>
                        Редактировать
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    {apt.owner?.phone && apt.owner.phone.length > 0 && (
                      <Button size="lg" variant="outline" className="h-14 flex-shrink-0 px-6 font-medium text-lg" asChild>
                        <a href={`tel:${apt.owner.phone}`}>
                          Позвонить
                        </a>
                      </Button>
                    )}
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button size="lg" className="h-14 flex-shrink-0 px-6 font-medium text-lg">
                          {user ? "Забронировать" : "Войдите для бронирования"}
                        </Button>
                      </DialogTrigger>
                      {user && (
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Бронирование квартиры</DialogTitle>
                            <DialogDescription className="sr-only">
                              Заполните форму, чтобы отправить заявку на бронирование
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              form.handleSubmit()
                            }}
                            className="space-y-4 mt-4"
                          >
                            <form.Field
                              name="dateRange"
                              children={(field) => (
                                <div className="space-y-2">
                                  <Label>Даты проживания</Label>
                                  <div className="border rounded-md p-2 flex justify-center bg-card">
                                    <Calendar
                                      mode="range"
                                      selected={field.state.value}
                                      onSelect={(range: any) => field.handleChange(range)}
                                      numberOfMonths={1}
                                      disabled={[
                                        (date) => date < new Date(new Date().setHours(0, 0, 0, 0)),
                                        ...(bookings || []).map((b: any) => ({
                                          from: new Date(b.start_date),
                                          to: new Date(b.end_date)
                                        }))
                                      ]}
                                    />
                                  </div>
                                </div>
                              )}
                            />

                            <form.Field
                              name="guest_name"
                              validators={{ onChange: z.string().min(2, "Введите имя") }}
                              children={(field) => (
                                <div className="space-y-2 pt-2">
                                  <Label>Ваше Имя</Label>
                                  <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                                  {field.state.meta.errors ? <em className="text-xs text-destructive">{field.state.meta.errors.map((e: any) => typeof e === "string" ? e : (e?.message || JSON.stringify(e))).join(", ")}</em> : null}
                                </div>
                              )}
                            />

                            <form.Field
                              name="guest_phone"
                              validators={{ onChange: z.string().min(5, "Введите телефон") }}
                              children={(field) => (
                                <div className="space-y-2">
                                  <Label>Номер телефона</Label>
                                  <Input type="tel" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                                  {field.state.meta.errors ? <em className="text-xs text-destructive">{field.state.meta.errors.map((e: any) => typeof e === "string" ? e : (e?.message || JSON.stringify(e))).join(", ")}</em> : null}
                                </div>
                              )}
                            />

                            <form.Subscribe
                              selector={(state) => ({ dateRange: state.values.dateRange, isSubmitting: state.isSubmitting })}
                              children={({ dateRange, isSubmitting }) => {
                                let totalNights = 0;
                                if (dateRange?.from && dateRange?.to) {
                                  totalNights = differenceInCalendarDays(dateRange.to, dateRange.from);
                                }

                                return (
                                  <>
                                    {totalNights > 0 && (
                                      <div className="py-4 mt-4 mb-2 border-t flex justify-between items-center text-lg font-semibold">
                                        <span>Итого за {totalNights} ноч{totalNights === 1 ? "ь" : (totalNights < 5 ? "и" : "ей")}:</span>
                                        <span className="text-primary">{apt.price * totalNights} ₽</span>
                                      </div>
                                    )}

                                    <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isSubmitting || totalNights === 0}>
                                      {isSubmitting ? "Отправка..." : "Отправить заявку"}
                                    </Button>
                                  </>
                                )
                              }}
                            />
                          </form>
                        </DialogContent>
                      )}
                    </Dialog>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
