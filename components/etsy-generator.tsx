"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Copy, ShoppingBag, Loader2, Sparkles } from "lucide-react"
import type { ImageMetadata } from "@/app/page"
import { useToast } from "@/hooks/use-toast"

interface EtsyGeneratorProps {
  metadata: ImageMetadata
  imageUrl: string | null
}

interface EtsyListing {
  title: string
  description: string
  tags: string[]
  price: string
  category: string
}

export function EtsyGenerator({ metadata, imageUrl }: EtsyGeneratorProps) {
  const [etsyListing, setEtsyListing] = useState<EtsyListing | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generateEtsyListing = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-etsy-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metadata, imageUrl }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate Etsy listing")
      }

      const result = await response.json()
      setEtsyListing(result.listing)
    } catch (error) {
      console.error("Error generating Etsy listing:", error)
      toast({
        title: "Error",
        description: "Failed to generate Etsy listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    })
  }

  return (
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingBag className="h-5 w-5 text-green-600" />
          Etsy Listing Generator
        </CardTitle>
        <CardDescription>Generate a professional Etsy listing based on your image metadata</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!etsyListing ? (
          <Button
            onClick={generateEtsyListing}
            disabled={isGenerating}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Listing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Professional Etsy Listing
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400">Listing Title</h4>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(etsyListing.title, "Title")}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium">{etsyListing.title}</p>
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-1">Category</h4>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  {etsyListing.category}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-1">Suggested Price</h4>
                <p className="text-slate-700 dark:text-slate-300 font-semibold">{etsyListing.price}</p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400">Etsy Tags</h4>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(etsyListing.tags.join(", "), "Tags")}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {etsyListing.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400">Description</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(etsyListing.description, "Description")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Textarea value={etsyListing.description} readOnly className="min-h-32 bg-slate-50 dark:bg-slate-900" />
            </div>

            <Button onClick={generateEtsyListing} variant="outline" className="w-full bg-transparent">
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate Listing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
