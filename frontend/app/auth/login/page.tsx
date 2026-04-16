"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { z } from "zod"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore(state => state.setUser)

  const form = useForm({
    defaultValues: {
      email: "",
      password: ""
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      try {
        const user = await fetchApi("/auth/login", {
          method: "POST",
          body: JSON.stringify(value)
        })
        setUser(user)
        router.push("/")
      } catch (err: any) {
        toast.error(err.message)
      }
    }
  })

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">С возвращением</CardTitle>
          <CardDescription>
            Войдите в свой аккаунт, чтобы бронировать квартиры
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field
              name="email"
              validators={{ onChange: z.string().email("Неверный email") }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input 
                    id={field.name}
                    type="email"
                    placeholder="user@example.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors ? (
                    <em className="text-sm text-destructive">{field.state.meta.errors.map((e: any) => typeof e === "string" ? e : (e?.message || JSON.stringify(e))).join(", ")}</em>
                  ) : null}
                </div>
              )}
            />
            
            <form.Field
              name="password"
              validators={{ onChange: z.string().min(1, "Обязательное поле") }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Пароль</Label>
                  <Input 
                    id={field.name}
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors ? (
                    <em className="text-sm text-destructive">{field.state.meta.errors.map((e: any) => typeof e === "string" ? e : (e?.message || JSON.stringify(e))).join(", ")}</em>
                  ) : null}
                </div>
              )}
            />

            <Button type="submit" className="w-full mt-6" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-center mt-4">
          <div className="text-sm text-muted-foreground">
            Еще нет аккаунта?{" "}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
