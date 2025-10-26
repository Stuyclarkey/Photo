export async function POST(request: Request) {
  try {
    console.log("[v0] API request received")

    const { imageUrl, exifData } = await request.json()

    if (!imageUrl) {
      return Response.json({ error: "No image data provided" }, { status: 400 })
    }

    console.log("[v0] Making request to Groq API...")

    let locationContext = ""
    if (exifData?.gps) {
      locationContext = `\n\nEXIF GPS Data Available:
- Latitude: ${exifData.gps.latitude}
- Longitude: ${exifData.gps.longitude}
${exifData.gps.altitude ? `- Altitude: ${exifData.gps.altitude}m` : ""}
${exifData.location ? `- Location from tags: ${exifData.location}` : ""}

Please use these GPS coordinates as the primary location data and provide detailed historical and contextual information about this specific location.`
    }

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
                text: `Analyze this image and extract comprehensive metadata including location data. ${locationContext}

Return a JSON object with the following structure:
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
    "name": "Specific location name (e.g., 'Eiffel Tower, Paris, France' or 'Bristol, England')",
    "coordinates": {
      "lat": ${exifData?.gps?.latitude || "null"},
      "lng": ${exifData?.gps?.longitude || "null"}
    },
    "description": "Detailed description of the location based on visual cues and GPS data",
    "history": "Comprehensive historical information about this location, including: founding/establishment dates, significant historical events, cultural importance, architectural history, notable figures associated with the location, and how it has evolved over time",
    "context": "Rich current information about the area, including: what it's known for today, major tourist attractions nearby, local culture and traditions, current events or festivals, interesting facts, and why people visit this location"
  }
}

IMPORTANT: 
- Use the provided GPS coordinates if available
- If you can identify the location from landmarks, architecture, signs, or other visual cues, provide specific details
- Include comprehensive historical information (at least 3-4 sentences)
- Provide rich contextual information about the current state of the area (at least 3-4 sentences)
- If location cannot be determined, provide general information based on the setting type (urban, rural, etc.)

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
        max_tokens: 2500,
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
      let jsonContent = content.trim()

      // Remove markdown code blocks if present
      if (jsonContent.startsWith("```")) {
        // Remove opening \`\`\`json or \`\`\` and closing \`\`\`
        jsonContent = jsonContent
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "")
          .trim()
      }

      const metadata = JSON.parse(jsonContent)
      console.log("[v0] Successfully parsed metadata")
      return Response.json({ metadata })
    } catch (parseError) {
      console.log("[v0] Failed to parse Groq response as JSON:", content)
      return Response.json({
        metadata: {
          title: "Image Analysis",
          tags: ["image", "analysis", "metadata"],
          summary: content,
          altText: "Image description for screen readers",
          caption: "Image caption for social media",
          who: "Unknown",
          what: "Unknown",
          where: "Unknown",
          location: {
            name: "Unknown",
            coordinates: {
              lat: null,
              lng: null,
            },
            description: "Unknown",
            history: "Unknown",
            context: "Unknown",
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
