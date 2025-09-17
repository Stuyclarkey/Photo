export async function POST(request: Request) {
  try {
    console.log("[v0] API request received")

    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return Response.json({ error: "No image data provided" }, { status: 400 })
    }

    console.log("[v0] Making request to Groq API...")

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and extract metadata. Return a JSON object with the following structure:
{
  "title": "A descriptive title for the image",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "summary": "A brief summary of the image content",
  "altText": "Accessible alt text for screen readers",
  "caption": "A social media style caption",
  "who": "People or subjects in the image",
  "what": "Main objects or activities",
  "where": "Location or setting description",
  "location": {
    "name": "Specific location name if identifiable",
    "description": "Description of the location"
  }
}

Only return the JSON object, no additional text.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    console.log("[v0] Groq API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Groq API error:", response.status, errorText)
      return Response.json(
        {
          error: `Groq API error: ${response.status} ${errorText}`,
        },
        { status: 500 },
      )
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text()
      console.log("[v0] Non-JSON response from Groq:", responseText)
      return Response.json(
        {
          error: `Non-JSON response from Groq: ${responseText}`,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("[v0] Groq API response received")

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return Response.json(
        {
          error: "No content in Groq response",
        },
        { status: 500 },
      )
    }

    // Try to parse the JSON response from Groq
    try {
      const metadata = JSON.parse(content)
      console.log("[v0] Successfully parsed metadata")
      return Response.json({ metadata })
    } catch (parseError) {
      console.log("[v0] Failed to parse Groq response as JSON:", content)
      // Return fallback metadata if JSON parsing fails
      return Response.json({
        metadata: {
          title: "Image Analysis",
          summary: content,
          altText: "Image description for screen readers",
          caption: "Image caption for social media",
          who: "Unknown",
          what: "Unknown",
          where: "Unknown",
          location: {
            name: "Unknown",
            description: "Unknown",
          },
        },
      })
    }
  } catch (error) {
    console.log("[v0] Error analyzing image:", error)
    return Response.json(
      {
        error: `Error analyzing image: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
