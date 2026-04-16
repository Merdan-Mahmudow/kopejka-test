"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import Script from "next/script"

// A subcomponent that actually interacts with the ymaps instance purely via vanilla integration
function YMapDynamicContent({ onSelectAddress, apiKey }: { onSelectAddress: (address: string) => void, apiKey: string }) {
  const [address, setAddress] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  // Note: Yandex Maps v3 uses [lng, lat] coordinate order
  const [coords, setCoords] = useState<number[]>([37.617698, 55.755864]) 
  
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    let unmounted = false;

    const initMap = async () => {
      try {
        if (typeof window === 'undefined' || !(window as any).ymaps3) return;
        
        await (window as any).ymaps3.ready;
        const ymaps3 = (window as any).ymaps3;
        
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapListener } = ymaps3;

        // Initialize Map
        if (!mapContainer.current || unmounted) return;
        
        const map = new YMap(mapContainer.current, {
           location: { center: coords, zoom: 10 }
        });

        // Add layers
        map.addChild(new YMapDefaultSchemeLayer({}));
        map.addChild(new YMapDefaultFeaturesLayer({}));

        mapRef.current = map;

        // Add click listener
        const listener = new YMapListener({
            layer: 'any',
            onClick: async (object: any, event: any) => {
                // In v3, coordinates are available on event.coordinates
                let newCoords: number[] | null = null;

                if (event && event.coordinates) {
                   newCoords = event.coordinates;
                }

                if (newCoords) {
                    setCoords(newCoords);
                    if (markerRef.current) {
                        markerRef.current.update({ coordinates: newCoords });
                    }
                    
                    // Geocode via HTTP with the SAME key
                    setIsLoading(true);
                    try {
                        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${newCoords[0]},${newCoords[1]}`;
                        const res = await fetch(url);
                        const data = await res.json();
                        const featureMember = data?.response?.GeoObjectCollection?.featureMember;
                        if (featureMember && featureMember.length > 0) {
                            const foundAddress = featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text;
                            setAddress(foundAddress);
                        } else {
                            setAddress("Не удалось определить адрес");
                        }
                    } catch(err) {
                        setAddress("Ошибка сети при получении адреса");
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        });
        map.addChild(listener);

        // Styling the custom marker element for v3
        const el = document.createElement('div');
        el.className = 'w-6 h-6 bg-primary rounded-full border-2 px-1 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center';
        const inner = document.createElement('div');
        inner.className = 'w-3 h-3 bg-white rounded-full';
        el.appendChild(inner);

        const marker = new YMapMarker({
            coordinates: coords,
            draggable: false
        }, el);
        map.addChild(marker);
        markerRef.current = marker;

      } catch (err) {
        console.error("YMap init error", err);
      }
    };

    if ((window as any).ymaps3) {
      initMap();
    } else {
      // Poll a few times until the next/script inserts and loads it
      const interval = setInterval(() => {
        if ((window as any).ymaps3 && (window as any).ymaps3.ready) {
          clearInterval(interval);
          initMap();
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 10000); // 10s timeout
    }

    return () => {
      unmounted = true;
      if (mapRef.current) {
         try {
             // Cleanup if needed
         } catch(e) {}
      }
    };
  }, [apiKey]); // Run once mostly

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div 
        ref={mapContainer} 
        className="w-full h-[400px] rounded-md overflow-hidden border bg-muted/30 flex items-center justify-center relative touch-none"
      >
        <span className="text-muted-foreground absolute -z-10">Загрузка карты...</span>
      </div>

      <div className="bg-muted p-3 rounded-md min-h-[60px] flex items-center justify-between">
        <div className="flex flex-col flex-1 pr-4">
            <span className="text-sm font-semibold text-muted-foreground">Выбранный адрес:</span>
            <span className="text-sm font-medium leading-tight mt-1 truncate">{isLoading ? "Поиск..." : (address || "Кликните на карту в нужное место")}</span>
        </div>
        <Button 
          disabled={!address || isLoading || address.includes("ошибка") || address.includes("Не удалось")} 
          onClick={() => onSelectAddress(address)}
        >
          Применить
        </Button>
      </div>
    </div>
  )
}

interface MapAddressPickerProps {
  onAddressSelect: (address: string) => void;
}

export function MapAddressPicker({ onAddressSelect }: MapAddressPickerProps) {
  const [open, setOpen] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY || "suggest_apikey_for_production";

  const handleAddressSelect = (addr: string) => {
      onAddressSelect(addr)
      setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] w-full">
        <DialogHeader>
          <DialogTitle>Выберите адрес на карте</DialogTitle>
          <DialogDescription className="sr-only">Кликните по карте, чтобы автоматически определить адрес</DialogDescription>
        </DialogHeader>
        
        {open && (
            <>
              {/* Native Yandex Maps API v3 Injection */}
              <Script src={`https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`} strategy="lazyOnload" />
              <YMapDynamicContent onSelectAddress={handleAddressSelect} apiKey={apiKey} />
            </>
        )}
        
      </DialogContent>
    </Dialog>
  )
}
