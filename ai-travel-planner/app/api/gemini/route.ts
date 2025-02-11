export async function POST(req: Request) {
  try {
    const requestData = await req.json();

    if (!requestData) {
      return new Response(JSON.stringify({ error: "Request data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get API Key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key is missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Format prompt to request structured JSON
    const prompt = `
      Generate a detailed travel itinerary in strict JSON format with no extra text or explanations.
      Follow this structure exactly:
      {
        "destination": "${requestData.location}",
        "trip_title": "Short Title",
        "budget": ${requestData.budget},
        "budget_breakdown": {
          "flights_accommodation": Number,
          "activities_entertainment": Number,
          "food": Number,
          "transportation_misc": Number
        },
        "days": [
          {
            "day": 1,
            "title": "Day Title",
            "activities": [
              { "time": "Time Range", "description": "Activity description" }
            ]
          }
        ],
        "meeting_people_tips": ["Tip 1", "Tip 2"],
        "important_notes": ["Note 1", "Note 2"]
      }
      
      Here is the user profile:
      - Age: ${requestData.age}
      - Gender: ${requestData.gender}
      - Interests: ${requestData.interests}
      - Number of Days: ${requestData.days}

      Return only valid JSON with no extra text. Do not include this prompt in the response, start with the JSON structure ("{...}").
    `;

    // Call the Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text(); // Get error details
      console.error("Gemini API Error:", errorData);
      return new Response(JSON.stringify({ error: `Gemini API error: ${response.statusText}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Extract the AI-generated response and attempt to parse it as JSON
    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Strip the string of all characters from the front until the first '{' character
    aiResponse = aiResponse.substring(aiResponse.indexOf("{")); // Strip the string of all character from the front until the first '{' character
    
    // Strip the string of all character from the back until the last '}' character
    aiResponse = aiResponse.substring(0, aiResponse.lastIndexOf("}") + 1); // Strip the string of all character from the back until the last '}' character
    
    console.log("AI Response:", aiResponse);

    try {
      const itinerary = JSON.parse(aiResponse); // Ensure valid JSON
      return new Response(JSON.stringify(itinerary), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return new Response(JSON.stringify({ error: "Invalid JSON format received from LLM" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
