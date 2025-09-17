"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
}

const compressImage = (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    console.log("[v0] Processing file:", file.name, "size:", file.size, "type:", file.type)

    // Validate file type and size first
    if (!file.type.startsWith("image/")) {
      console.error("[v0] Invalid file type:", file.type)
      reject(new Error("File is not an image"))
      return
    }

    if (file.size === 0) {
      console.error("[v0] File is empty")
      reject(new Error("File is empty"))
      return
    }

    // Base64 encoding increases size by ~33%, so 8MB file becomes ~10.6MB base64
    const maxFileSize = 15 * 1024 * 1024 // Increased to 15MB to accommodate larger files

    if (file.size > maxFileSize) {
      console.error("[v0] File too large:", file.size, "max allowed:", maxFileSize)
      reject(
        new Error(
          `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image smaller than 15MB.`,
        ),
      )
      return
    }

    try {
      console.log("[v0] Converting file to base64 using arrayBuffer stream")

      const arrayBuffer = await file.arrayBuffer()
      console.log("[v0] ArrayBuffer conversion successful, size:", arrayBuffer.byteLength)

      // Convert arrayBuffer to base64 using btoa with chunking for large files
      const uint8Array = new Uint8Array(arrayBuffer)
      let binaryString = ""

      // Process in chunks to avoid call stack issues
      const chunkSize = 8192
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize)
        binaryString += String.fromCharCode.apply(null, Array.from(chunk))
      }

      const base64 = btoa(binaryString)
      const dataUrl = `data:${file.type};base64,${base64}`

      console.log("[v0] Stream conversion successful, base64 size:", dataUrl.length)
      resolve(dataUrl)
    } catch (error) {
      console.error("[v0] Stream method failed:", error)

      console.log("[v0] Falling back to FileReader method")
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const result = e.target?.result
          if (typeof result === "string") {
            console.log("[v0] FileReader conversion successful, base64 size:", result.length)
            resolve(result)
          } else {
            console.error("[v0] FileReader result is not a string:", typeof result)
            reject(new Error("Failed to read file as string"))
          }
        } catch (error) {
          console.error("[v0] Error processing FileReader result:", error)
          reject(new Error("Failed to process file data"))
        }
      }

      reader.onerror = (error) => {
        console.error("[v0] FileReader error:", error)
        reject(
          new Error(
            "Unable to read the image file. The file may be corrupted, too large, or in an unsupported format. Please try a different image.",
          ),
        )
      }

      reader.onabort = () => {
        console.error("[v0] FileReader aborted")
        reject(new Error("File reading was cancelled"))
      }

      const timeout = setTimeout(() => {
        reader.abort()
        reject(new Error("File reading timed out. The file may be too large or corrupted."))
      }, 30000) // 30 second timeout

      reader.onloadend = () => {
        clearTimeout(timeout)
      }

      try {
        reader.readAsDataURL(file)
      } catch (readerError) {
        clearTimeout(timeout)
        console.error("[v0] Failed to start FileReader:", readerError)
        reject(new Error("Failed to start reading the file"))
      }
    }
  })
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      console.log("[v0] Files dropped:", acceptedFiles.length)
      const file = acceptedFiles[0]

      if (!file) {
        console.error("[v0] No file provided")
        return
      }

      console.log("[v0] Processing file:", file.name, file.size, file.type)
      setIsCompressing(true)

      try {
        const imageUrl = await compressImage(file)
        console.log("[v0] File processing successful, calling onImageUpload")
        onImageUpload(imageUrl)
      } catch (error) {
        console.error("[v0] File processing failed:", error)
        alert(
          `Failed to process image "${file.name}". ${error instanceof Error ? error.message : "Please try a different image."}`,
        )
      } finally {
        setIsCompressing(false)
      }
    },
    [onImageUpload],
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive: dropzoneActive,
  } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${
          isDragActive || dropzoneActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
        }
        ${isCompressing ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
      <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
        {isCompressing ? "Processing image..." : isDragActive ? "Drop your image here" : "Upload an image"}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {isCompressing ? "Please wait while we process your image" : "Drag and drop an image file, or click to select"}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Supports JPEG, PNG, GIF, WebP (max 15MB)</p>
    </div>
  )
}
