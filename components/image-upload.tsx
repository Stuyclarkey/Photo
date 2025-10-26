"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, exifData?: any) => void
}

const extractExifData = async (file: File): Promise<any> => {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const view = new DataView(arrayBuffer)

        // Check for JPEG marker
        if (view.getUint16(0, false) !== 0xffd8) {
          console.log("[v0] Not a JPEG file")
          resolve(null)
          return
        }

        let offset = 2
        let gpsData: any = null

        // Look for APP1 marker (EXIF)
        while (offset < view.byteLength - 4) {
          const marker = view.getUint16(offset, false)

          if (marker === 0xffe1) {
            // APP1 marker found
            const segmentLength = view.getUint16(offset + 2, false)
            const segmentEnd = offset + 2 + segmentLength

            // Check for "Exif\0\0" identifier
            const exifIdentifier = String.fromCharCode(
              view.getUint8(offset + 4),
              view.getUint8(offset + 5),
              view.getUint8(offset + 6),
              view.getUint8(offset + 7),
            )

            if (exifIdentifier === "Exif") {
              console.log("[v0] Found EXIF data")
              const tiffOffset = offset + 10

              // Parse TIFF header
              const byteOrder = view.getUint16(tiffOffset, false)
              const littleEndian = byteOrder === 0x4949

              console.log("[v0] Byte order:", littleEndian ? "Little Endian" : "Big Endian")

              // Parse IFD0
              const ifd0Offset = view.getUint32(tiffOffset + 4, littleEndian)
              gpsData = parseIFD(view, tiffOffset, tiffOffset + ifd0Offset, littleEndian)

              if (gpsData) {
                console.log("[v0] GPS data extracted:", gpsData)
              }
            }
            break
          }

          // Move to next marker
          if (marker >= 0xffc0 && marker <= 0xffef && marker !== 0xffd8 && marker !== 0xffd9) {
            offset += 2 + view.getUint16(offset + 2, false)
          } else {
            offset += 2
          }
        }

        resolve(gpsData ? { gps: gpsData } : null)
      } catch (error) {
        console.error("[v0] EXIF extraction error:", error)
        resolve(null)
      }
    }

    reader.onerror = () => {
      console.error("[v0] FileReader error")
      resolve(null)
    }
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024)) // Read first 128KB for EXIF
  })
}

const parseIFD = (view: DataView, tiffOffset: number, ifdOffset: number, littleEndian: boolean): any => {
  try {
    const numEntries = view.getUint16(ifdOffset, littleEndian)
    console.log("[v0] Parsing IFD with", numEntries, "entries")

    let gpsIFDOffset = null

    // Look for GPS IFD pointer (tag 0x8825)
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12
      const tag = view.getUint16(entryOffset, littleEndian)

      if (tag === 0x8825) {
        // GPS IFD Pointer
        gpsIFDOffset = view.getUint32(entryOffset + 8, littleEndian)
        console.log("[v0] Found GPS IFD pointer at offset:", gpsIFDOffset)
        break
      }
    }

    if (gpsIFDOffset) {
      return parseGPSIFD(view, tiffOffset, tiffOffset + gpsIFDOffset, littleEndian)
    }

    // Check next IFD
    const nextIFDOffset = view.getUint32(ifdOffset + 2 + numEntries * 12, littleEndian)
    if (nextIFDOffset !== 0) {
      return parseIFD(view, tiffOffset, tiffOffset + nextIFDOffset, littleEndian)
    }

    return null
  } catch (error) {
    console.error("[v0] Error parsing IFD:", error)
    return null
  }
}

const parseGPSIFD = (view: DataView, tiffOffset: number, gpsIFDOffset: number, littleEndian: boolean): any => {
  try {
    const numEntries = view.getUint16(gpsIFDOffset, littleEndian)
    console.log("[v0] Parsing GPS IFD with", numEntries, "entries")

    const gpsData: any = {}

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = gpsIFDOffset + 2 + i * 12
      const tag = view.getUint16(entryOffset, littleEndian)
      const type = view.getUint16(entryOffset + 2, littleEndian)
      const count = view.getUint32(entryOffset + 4, littleEndian)
      const valueOffset = view.getUint32(entryOffset + 8, littleEndian)

      // GPS tags we care about
      switch (tag) {
        case 1: // GPSLatitudeRef
          gpsData.latitudeRef = String.fromCharCode(view.getUint8(entryOffset + 8))
          break
        case 2: // GPSLatitude
          gpsData.latitude = readRational(view, tiffOffset + valueOffset, littleEndian, count)
          break
        case 3: // GPSLongitudeRef
          gpsData.longitudeRef = String.fromCharCode(view.getUint8(entryOffset + 8))
          break
        case 4: // GPSLongitude
          gpsData.longitude = readRational(view, tiffOffset + valueOffset, littleEndian, count)
          break
        case 5: // GPSAltitudeRef
          gpsData.altitudeRef = view.getUint8(entryOffset + 8)
          break
        case 6: // GPSAltitude
          const altRational = readRational(view, tiffOffset + valueOffset, littleEndian, 1)
          gpsData.altitude = altRational[0]
          break
      }
    }

    // Convert to decimal degrees
    if (gpsData.latitude && gpsData.longitude) {
      const lat = convertToDecimalDegrees(gpsData.latitude, gpsData.latitudeRef)
      const lon = convertToDecimalDegrees(gpsData.longitude, gpsData.longitudeRef)

      return {
        latitude: lat,
        longitude: lon,
        altitude: gpsData.altitude || null,
        coordinates: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Error parsing GPS IFD:", error)
    return null
  }
}

const readRational = (view: DataView, offset: number, littleEndian: boolean, count: number): number[] => {
  const values: number[] = []
  for (let i = 0; i < count; i++) {
    const numerator = view.getUint32(offset + i * 8, littleEndian)
    const denominator = view.getUint32(offset + i * 8 + 4, littleEndian)
    values.push(denominator !== 0 ? numerator / denominator : 0)
  }
  return values
}

const convertToDecimalDegrees = (coords: number[], ref: string): number => {
  const degrees = coords[0] || 0
  const minutes = coords[1] || 0
  const seconds = coords[2] || 0

  let decimal = degrees + minutes / 60 + seconds / 3600

  // Apply reference (N/S for latitude, E/W for longitude)
  if (ref === "S" || ref === "W") {
    decimal = -decimal
  }

  return decimal
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

    const maxFileSize = 20 * 1024 * 1024 // 20MB

    if (file.size > maxFileSize) {
      console.error("[v0] File too large:", file.size, "max allowed:", maxFileSize)
      reject(
        new Error(
          `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image smaller than 20MB.`,
        ),
      )
      return
    }

    try {
      console.log("[v0] Starting image compression...")

      // Create an image element to load the file
      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Failed to get canvas context")
      }

      // Create object URL for the file
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        try {
          console.log("[v0] Image loaded, original dimensions:", img.width, "x", img.height)

          // Calculate new dimensions (max 1920px width while maintaining aspect ratio)
          const maxWidth = 1920
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          console.log("[v0] Resizing to:", width, "x", height)

          // Set canvas dimensions
          canvas.width = width
          canvas.height = height

          // Draw and compress the image
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to base64 with compression (0.7 quality for JPEG)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7)

          console.log(
            "[v0] Compression successful, original size:",
            file.size,
            "compressed base64 size:",
            compressedDataUrl.length,
          )

          // Clean up
          URL.revokeObjectURL(objectUrl)

          resolve(compressedDataUrl)
        } catch (error) {
          console.error("[v0] Error during compression:", error)
          URL.revokeObjectURL(objectUrl)
          reject(new Error("Failed to compress image"))
        }
      }

      img.onerror = () => {
        console.error("[v0] Failed to load image")
        URL.revokeObjectURL(objectUrl)
        reject(new Error("Failed to load image for compression"))
      }

      // Start loading the image
      img.src = objectUrl
    } catch (error) {
      console.error("[v0] Compression failed:", error)
      reject(new Error("Failed to compress image. Please try a different image."))
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
        console.log("[v0] Extracting EXIF data...")
        const exifData = await extractExifData(file)
        if (exifData) {
          console.log("[v0] EXIF data extracted:", exifData)
        } else {
          console.log("[v0] No EXIF GPS data found in image")
        }

        const imageUrl = await compressImage(file)
        console.log("[v0] File processing successful, calling onImageUpload")
        onImageUpload(imageUrl, exifData)
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
      <p className="text-xs text-slate-400 dark:text-slate-500">Supports JPEG, PNG, GIF, WebP (max 20MB)</p>
    </div>
  )
}
