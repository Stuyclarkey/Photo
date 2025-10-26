"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Tag, FileText, ImageIcon, MapPin } from "lucide-react"
import type { ImageMetadata } from "@/app/page"
import { useToast } from "@/hooks/use-toast"

interface MetadataDisplayProps {
  metadata: ImageMetadata
}

export function MetadataDisplay({ metadata }: MetadataDisplayProps) {
  const { toast } = useToast()

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    })
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Suggested Title
            </span>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(metadata.title, "Title")}>
              <Copy className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 dark:text-slate-300 font-medium">{metadata.title}</p>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              Tags
            </span>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard((metadata.tags || []).join(", "), "Tags")}>
              <Copy className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(metadata.tags || []).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Who, What, Where */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-purple-600" />
            Who, What, Where
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-1">WHO</h4>
              <p className="text-slate-700 dark:text-slate-300">{metadata.who}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-1">WHAT</h4>
              <p className="text-slate-700 dark:text-slate-300">{metadata.what}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-1">WHERE</h4>
              <p className="text-slate-700 dark:text-slate-300">{metadata.where}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Summary
            </span>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(metadata.summary, "Summary")}>
              <Copy className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{metadata.summary}</p>
        </CardContent>
      </Card>

      {/* Alt Text & Caption */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-green-600" />
                Alt Text
              </span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(metadata.altText, "Alt Text")}>
                <Copy className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-slate-300">{metadata.altText}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Caption
              </span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(metadata.caption, "Caption")}>
                <Copy className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-slate-300">{metadata.caption}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
