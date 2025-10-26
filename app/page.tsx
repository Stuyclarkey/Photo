"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, ImageIcon, Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"
import { MetadataDisplay } from "@/components/metadata-display"
import { LocationInfo } from "@/components/location-info"
import { EtsyGenerator } from "@/components/etsy-generator"

export interface ImageMetadata {
  title: string
  tags: string[]
  summary: string
  altText: string
  caption: string
  who: string
  what: string
  where: string
  location?: {
    name: string
    coordinates?: { lat: number; lng: number }
    description: string
  }
}

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [exifData, setExifData] = useState<any>(null)
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showLocationInfo, setShowLocationInfo] = useState(false)
  const [showEtsyGenerator, setShowEtsyGenerator] = useState(false)

  const handleImageUpload = (imageUrl: string, exif?: any) => {
    setUploadedImage(imageUrl)
    setExifData(exif)
    setMetadata(null)
    setShowLocationInfo(false)
    setShowEtsyGenerator(false)
  }

  const analyzeImage = async () => {
    if (!uploadedImage) return

    setIsAnalyzing(true)
    try {
      console.log("[v0] Starting image analysis...")

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          exifData: exifData,
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Error response:", errorText)
        throw new Error(`Failed to analyze image: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("[v0] Raw response:", responseText.substring(0, 200) + "...")

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error("[v0] JSON parse error:", parseError)
        console.error("[v0] Response that failed to parse:", responseText)
        throw new Error("Invalid JSON response from server")
      }

      console.log("[v0] Parsed result:", result)

      if (result.error) {
        throw new Error(result.error)
      }

      if (!result.metadata) {
        throw new Error("No metadata received from server")
      }

      setMetadata(result.metadata)
      console.log("[v0] Successfully set metadata")
    } catch (error) {
      console.error("[v0] Error analyzing image:", error)
      alert(`Error analyzing image: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 text-balance">
            Image Metadata Generator
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-pretty">
            Upload an image to generate comprehensive metadata including titles, tags, descriptions, location
            information, and professional Etsy listings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  Upload Image
                </CardTitle>
                <CardDescription>Upload an image to analyze and generate metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload onImageUpload={handleImageUpload} />

                {uploadedImage && (
                  <div className="mt-6 space-y-4">
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded image"
                        className="w-full h-64 object-cover"
                      />
                    </div>

                    <Button
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing Image...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Analyze Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {metadata && (
              <>
                <MetadataDisplay metadata={metadata} />

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowLocationInfo(!showLocationInfo)} className="flex-1">
                    {showLocationInfo ? "Hide" : "Show"} Location Info
                  </Button>
                  <Button variant="outline" onClick={() => setShowEtsyGenerator(!showEtsyGenerator)} className="flex-1">
                    Generate Etsy Listing
                  </Button>
                </div>

                {showLocationInfo && metadata.location && <LocationInfo location={metadata.location} />}

                {showEtsyGenerator && <EtsyGenerator metadata={metadata} imageUrl={uploadedImage} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
