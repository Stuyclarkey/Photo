"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Globe, Navigation } from "lucide-react"

interface LocationInfoProps {
  location: {
    name: string
    coordinates?: { lat: number; lng: number }
    description: string
  }
}

export function LocationInfo({ location }: LocationInfoProps) {
  return (
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-red-600" />
          Location Information
        </CardTitle>
        <CardDescription>Detailed information about the photo location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Location Name
          </h4>
          <p className="text-slate-700 dark:text-slate-300">{location.name}</p>
        </div>

        {location.coordinates && (
          <div>
            <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Coordinates
            </h4>
            <p className="text-slate-700 dark:text-slate-300 font-mono text-sm">
              {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2">Description</h4>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{location.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
