import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"

// Schema for Etsy listing
const EtsyListingSchema = z.object({
  title: z.string().describe("SEO-optimized Etsy listing title (under 140 characters)"),
  description: z.string().describe("Detailed product description with benefits, uses, and specifications"),
  tags: z.array(z.string()).describe("13 Etsy-specific tags for maximum searchability"),
  price: z.string().describe("Suggested price range (e.g., '$15.00 - $25.00')"),
  category: z.string().describe("Most appropriate Etsy category for this item"),
})

export async function POST(request: NextRequest) {
  try {
    const { metadata, imageUrl } = await request.json()

    if (!metadata) {
      return NextResponse.json({ error: "Metadata is required" }, { status: 400 })
    }

    // Generate Etsy listing based on the image metadata
    const result = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      messages: [
        {
          role: "user",
          content: `Based on the following image metadata, create a professional Etsy listing that would attract buyers and rank well in search results.

Image Metadata:
- Title: ${metadata.title}
- Summary: ${metadata.summary}
- Tags: ${metadata.tags.join(", ")}
- Who: ${metadata.who}
- What: ${metadata.what}
- Where: ${metadata.where}
- Alt Text: ${metadata.altText}
- Caption: ${metadata.caption}

Create an Etsy listing that:
1. Has an SEO-optimized title under 140 characters
2. Includes a compelling product description with benefits and uses
3. Uses all 13 available Etsy tag slots with high-search-volume keywords
4. Suggests an appropriate price range based on the item type
5. Identifies the best Etsy category

Consider what type of product this image represents (art print, digital download, physical product, etc.) and tailor the listing accordingly. Focus on what buyers would search for and what would make them want to purchase this item.`,
        },
      ],
      schema: EtsyListingSchema,
      temperature: 0.8,
    })

    return NextResponse.json({
      listing: result.object,
      success: true,
    })
  } catch (error) {
    console.error("Error generating Etsy listing:", error)
    return NextResponse.json({ error: "Failed to generate Etsy listing. Please try again." }, { status: 500 })
  }
}
