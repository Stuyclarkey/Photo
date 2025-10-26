"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Globe, Navigation, History, Info } from "lucide-react"

interface LocationInfoProps {
  location: {
    name: string
    coordinates?: { lat: number | null; lng: number | null }
    description: string
    history?: string
    context?: string
  }
}

export function LocationInfo({ location }: LocationInfoProps) {
  const hasValidCoordinates =
    location.coordinates && location.coordinates.lat !== null && location.coordinates.lng !== null

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

        {hasValidCoordinates && (
          <div>
            <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              GPS Coordinates
            </h4>
            <p className="text-slate-700 dark:text-slate-300 font-mono text-sm">
              {location.coordinates!.lat!.toFixed(6)}, {location.coordinates!.lng!.toFixed(6)}
            </p>
            <a
              href={`https://www.google.com/maps?q=${location.coordinates!.lat},${location.coordinates!.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-1 inline-block"
            >
              View on Google Maps →
            </a>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2">Description</h4>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{location.description}</p>
        </div>

        {location.history && (
          <div>
            <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
              <History className="h-4 w-4" />
              Historical Information
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{location.history}</p>
          </div>
        )}

        {location.context && (
          <div>
            <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              About This Area
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{location.context}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
