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

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore(state => state.setUser)

  const form = useForm({
    defaultValues: {
      email: "",
      full_name: "",
      phone: "",
      gender: "Мужской",
      password: "",
      passwordRepeat: ""
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      if (value.password !== value.passwordRepeat) {
        toast.error("Пароли не совпадают")
        return
      }
      try {
        const user = await fetchApi("/auth/register", {
          method: "POST",
          body: JSON.stringify({ 
            email: value.email,
            full_name: value.full_name,
            phone: value.phone,
            gender: value.gender,
            password: value.password 
          })
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
          <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт, чтобы начать работу с сервисом
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
              name="full_name"
              validators={{ onChange: z.string().min(2, "Минимум 2 символа") }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>ФИО</Label>
                  <Input 
                    id={field.name}
                    placeholder="Иванов Иван Иванович"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors ? (
                    <em className="text-sm text-destructive">{field.state.meta.errors.map((e: any) => typeof e === "string" ? e : (e?.message || JSON.stringify(e))).join(", ")}</em>
                  ) : null}
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="phone"
                validators={{ onChange: z.string().min(5, "Укажите телефон") }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Телефон</Label>
                    <Input 
                      id={field.name}
                      type="tel"
                      placeholder="+7 999 ..."
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
                name="gender"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Пол</Label>
                    <select
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Мужской">Мужской</option>
                      <option value="Женский">Женский</option>
                    </select>
                  </div>
                )}
              />
            </div>

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
              validators={{ onChange: z.string().min(6, "Мин 6 символов") }}
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
            
            <form.Field
              name="passwordRepeat"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Повторите пароль</Label>
                  <Input 
                    id={field.name}
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />

            <Button type="submit" className="w-full mt-6" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-center mt-4">
          <div className="text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Войти
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
