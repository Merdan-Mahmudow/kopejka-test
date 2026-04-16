"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { z } from "zod"
import { postApiForm } from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MapAddressPicker } from "@/components/map-picker"
import { toast } from "sonner"

export default function CreateApartmentPage() {
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

  const form = useForm({
    defaultValues: {
      name: "",
      address: "",
      price: "",
      description: "",
      photos: [] as File[],
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      const formData = new FormData()
      formData.append("name", value.name)
      formData.append("address", value.address)
      formData.append("price", value.price.toString())
      formData.append("description", value.description)
      value.photos.forEach(file => {
        formData.append("files", file)
      })

      try {
        const apt = await postApiForm("/apartments/", formData)
        router.push(`/apartments/${apt.id}`)
      } catch (err: any) {
        toast.error(err.message)
      }
    }
  })

  if (!isHydrated || !user) {
    return null // Prevent flash of page content before redirect
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Сдать квартиру</CardTitle>
          <CardDescription>Заполните детали о вашей квартире, чтобы начать получать бронирования</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            <form.Field
              name="name"
              validators={{ onChange: z.string().min(5, "Слишком короткое название") }}
              children={(field) => (
                <div className="space-y-2">
                  <Label>Название объявления</Label>
                  <Input 
                    value={field.state.value} 
                    onChange={(e) => field.handleChange(e.target.value)} 
                    placeholder="Loft-студия в центре" 
                  />
                  {field.state.meta.errors ? <em className="text-sm text-destructive">{field.state.meta.errors.map((e: any) => typeof e === "string" ? e : (e?.message || JSON.stringify(e))).join(", ")}</em> : null}
                </div>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <form.Field
                name="address"
                validators={{ onChange: z.string().min(5, "Слишком короткий адрес") }}
                children={(field) => (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Адрес</Label>
                      <MapAddressPicker onAddressSelect={(addr) => field.handleChange(addr)} />
                    </div>
                    <Input 
                      value={field.state.value} 
                      onChange={(e) => field.handleChange(e.target.value)} 
                      placeholder="г. Москва, ул. Пушкина, д. 10" 
                    />
                    {field.state.meta.errors ? <em className="text-sm text-destructive">{field.state.meta.errors.map((e: any) => typeof e === "string" ? e : (e?.message || JSON.stringify(e))).join(", ")}</em> : null}
                  </div>
                )}
              />

              <form.Field
                name="price"
                validators={{ onChange: z.coerce.number().min(1, "Введите корректную цену") }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Цена (₽ / ночь)</Label>
                    <Input 
                      type="number"
                      value={field.state.value} 
                      onChange={(e) => field.handleChange(e.target.value)} 
                      placeholder="2500" 
                    />
                    {field.state.meta.errors ? <em className="text-sm text-destructive">{field.state.meta.errors.map((e: any) => typeof e === "string" ? e : (e?.message || JSON.stringify(e))).join(", ")}</em> : null}
                  </div>
                )}
              />
            </div>

            <form.Field
              name="description"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Описание (Опционально)</Label>
                  <Input 
                    value={field.state.value} 
                    onChange={(e) => field.handleChange(e.target.value)} 
                    placeholder="Уютная светлая квартира в центре..." 
                  />
                </div>
              )}
            />

            <form.Field
              name="photos"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Фотографии (через S3 / Supabase)</Label>
                  <Input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        field.handleChange(Array.from(e.target.files))
                      }
                    }} 
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Выберите несколько файлов (jpg, png).
                  </div>
                </div>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Отправка..." : "Опубликовать объявление"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
