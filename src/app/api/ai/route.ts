import { NextRequest, NextResponse } from "next/server";
import { parseCarbonLog, getCoachResponse } from "@/lib/mock-ai";
import { execSync } from "child_process";

async function getGcpToken(): Promise<string | null> {
  // 1. Try to fetch from Cloud Run metadata server first (200ms timeout)
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 200);
    const response = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-account/default/token", {
      headers: { "Metadata-Flavor": "Google" },
      signal: controller.signal,
    });
    clearTimeout(id);
    if (response.ok) {
      const data = await response.json();
      if (data.access_token) {
        return data.access_token;
      }
    }
  } catch (err) {
    // Metadata server not available
  }

  // 2. Try executing gcloud locally
  try {
    const token = execSync("gcloud auth print-access-token", { encoding: "utf8", timeout: 2000 }).trim();
    if (token) return token;
  } catch (err) {
    // gcloud command failed or not logged in
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, mode, history, profile } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY || "AIzaSyDQW1Rz1Mfqcga3_MOVoxt_1RevVKZedMg";
    const projectId = "cardon-footprint-499105";
    const gcpToken = await getGcpToken();

    if (mode === "chat") {
      const prompt = `You are CarbonMind AI Coach, a world-class sustainability expert. 
User Profile: Name: ${profile?.name || "Eco Friend"}, Score: ${profile?.carbonScore || 70}/100, Goal: ${profile?.goal || 350} kg CO2/month, Country: ${profile?.country || "Unknown"}.
Conversation history:
${(history || []).map((h: any) => `${h.role === "user" ? "User" : "Coach"}: ${h.content}`).join("\n")}
User: ${text}
Provide a helpful, actionable response in Markdown format. Keep it concise but highly premium, encouraging sustainable habits. Do not use generic advice; tailor it.`;

      // Option A: Try Vertex AI if token is available
      if (gcpToken) {
        try {
          console.log("AI API (Chat): Attempting Vertex AI generateContent endpoint...");
          const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`;
          const response = await fetch(vertexUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${gcpToken}`
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          });
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            console.log("AI API (Chat): Vertex AI call successful!");
            return NextResponse.json({ response: reply });
          } else {
            console.warn("AI API (Chat): Vertex AI returned empty reply, trying Gemini Developer API fallback...", data);
          }
        } catch (apiErr) {
          console.error("AI API (Chat): Vertex AI call failed, trying Gemini Developer API fallback:", apiErr);
        }
      }

      // Option B: Try Gemini Developer API
      if (geminiKey) {
        try {
          console.log("AI API (Chat): Attempting Gemini Developer API endpoint...");
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          });
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            console.log("AI API (Chat): Gemini Developer API call successful!");
            return NextResponse.json({ response: reply });
          }
        } catch (apiErr) {
          console.error("AI API (Chat): Gemini Developer API call failed:", apiErr);
        }
      }

      // Fallback to local heuristic coach
      console.log("AI API (Chat): Falling back to local heuristic coach responses");
      const responseText = getCoachResponse(history || [], text, profile);
      return NextResponse.json({ response: responseText });
    } else {
      // Parsing mode
      const prompt = `You are a Carbon Logging Assistant. Parse this log: "${text}"
Extract the carbon-emitting activities.
Respond ONLY with a valid JSON matching this schema:
{
  "categoryMatches": {
    "transport": [{"mode": "gasolineCar|electricCar|motorcycle|bus|train|flightShort|flightLong|bicycle|walking", "distanceKm": number, "carbon": number}],
    "food": [{"type": "beef|poultry|pork|fish|dairy|vegetables|grains", "servings": number, "carbon": number}],
    "electricity": [{"type": "airConditioner|heater|television|computer", "hours": number, "carbon": number}],
    "shopping": [{"category": "clothing|electronics|furniture|misc", "count": number, "carbon": number}]
  },
  "totalCarbon": number,
  "explanation": "Provide a newline-separated description of each item parsed."
}
Calculate emissions using standard factors:
- Gasoline car: 0.21 kg CO2/km
- Electric car: 0.05 kg CO2/km
- Bus: 0.04 kg CO2/km
- Train: 0.03 kg CO2/km
- Flight: 0.15 kg CO2/km
- Beef: 6.5 kg/serving, Poultry: 1.8 kg/serving, Fish: 1.6 kg/serving, Vegetables: 0.3 kg/serving
- AC: 1.5 kW draw, Heater: 2.0 kW draw, TV: 0.1 kW draw, Computer: 0.2 kW draw (Grid factor: 0.47 kg CO2/kWh)
If no matches, return empty categories.`;

      // Option A: Try Vertex AI if token is available
      if (gcpToken) {
        try {
          console.log("AI API (Parser): Attempting Vertex AI generateContent endpoint...");
          const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`;
          const response = await fetch(vertexUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${gcpToken}`
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            }),
          });
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            console.log("AI API (Parser): Vertex AI call successful!");
            const parsed = JSON.parse(replyText);
            return NextResponse.json(parsed);
          }
        } catch (apiErr) {
          console.error("AI API (Parser): Vertex AI call failed, trying Gemini Developer API fallback:", apiErr);
        }
      }

      // Option B: Try Gemini Developer API
      if (geminiKey) {
        try {
          console.log("AI API (Parser): Attempting Gemini Developer API endpoint...");
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            }),
          });
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            console.log("AI API (Parser): Gemini Developer API call successful!");
            const parsed = JSON.parse(replyText);
            return NextResponse.json(parsed);
          }
        } catch (apiErr) {
          console.error("AI API (Parser): Gemini Developer API call failed:", apiErr);
        }
      }

      // Fallback to local heuristic parser
      console.log("AI API (Parser): Falling back to local heuristic logs parser");
      const parsedResult = parseCarbonLog(text);
      return NextResponse.json(parsedResult);
    }
  } catch (error: any) {
    console.error("AI API General Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
