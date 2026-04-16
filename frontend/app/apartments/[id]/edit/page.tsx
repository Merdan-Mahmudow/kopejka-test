"use client"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { z } from "zod"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import { toast } from "sonner"
import { Spinner } from "@/components/spinner"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MapAddressPicker } from "@/components/map-picker"

export default function EditApartmentPage() {
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

  const { data: apt, isLoading } = useQuery({
    queryKey: ["apartment", params.id],
    queryFn: () => fetchApi(`/apartments/${params.id}`)
  })
  
  useEffect(() => {
    if (apt && user && apt.owner_id !== user.id) {
        toast.error("У вас нет прав для редактирования этого объявления")
        router.push(`/apartments/${params.id}`)
    }
  }, [apt, user, router, params.id])

  const form = useForm({
    defaultValues: {
      name: apt?.name || "",
      address: apt?.address || "",
      price: apt?.price?.toString() || "",
      description: apt?.description || "",
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      try {
        await fetchApi(`/apartments/${params.id}`, {
            method: "PATCH",
            body: JSON.stringify({
                name: value.name,
                address: value.address,
                price: parseInt(value.price) || 0,
                description: value.description
            })
        })
        router.push(`/apartments/${params.id}`)
      } catch (err: any) {
        toast.error(err.message)
      }
    }
  })

  // Re-initialize default values when data loads
  useEffect(() => {
      if (apt && apt.name) {
          form.setFieldValue("name", apt.name)
          form.setFieldValue("address", apt.address)
          form.setFieldValue("price", apt.price.toString())
          form.setFieldValue("description", apt.description || "")
      }
  }, [apt, form])

  if (!isHydrated || isLoading || !apt) {
    return <Spinner />
  }

  if (!user) return null;

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Редактировать объявление</CardTitle>
          <CardDescription>Обновите информацию о вашей квартире</CardDescription>
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

            {/* Note: We omit photo uploads in the edit view for simplicity as per the plan */}

            <Button type="submit" className="w-full h-12 text-lg" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Сохранение..." : "Сохранить изменения"}
            </Button>
            
            <Button type="button" variant="ghost" className="w-full mt-2" onClick={() => router.push(`/apartments/${params.id}`)}>
              Отменить
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
