"use client"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { fetchApi } from "@/lib/api"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

export default function Home() {
  const { data: apartments, isLoading } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => fetchApi("/apartments")
  })

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Посуточная аренда</h1>
          <p className="text-muted-foreground mt-2">Лучшие квартиры для вашего отдыха или командировки</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="h-[350px] bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments?.map((apt: any) => (
            <Card key={apt.id} className="overflow-hidden">
              <div 
                className="h-48 bg-muted bg-cover bg-center" 
                style={{ backgroundImage: `url(${apt.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'})` }}
              />
              <CardHeader>
                <CardTitle className="text-xl line-clamp-1">{apt.name}</CardTitle>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="line-clamp-1">{apt.address}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-primary mb-2">
                  от {apt.price} ₽ <span className="text-sm font-normal text-muted-foreground">/ ночь</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {apt.description || "Отличная квартира в удобном районе..."}
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/apartments/${apt.id}`} className="w-full">
                  <Button className="w-full">Подробнее</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
          {(!apartments || apartments.length === 0) && (
            <div className="col-span-full text-center py-24 text-muted-foreground">
              Объявлений пока нет :(
            </div>
          )}
        </div>
      )}
    </div>
  )
}
