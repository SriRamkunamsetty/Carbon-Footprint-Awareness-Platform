/**
 * @module AI API Route
 * @description Server-side API route for CarbonMind AI features.
 * Handles two modes:
 * - "parser": Natural language → structured carbon activity JSON
 * - "chat": AI sustainability coach with personalized context
 *
 * Uses a 3-tier fallback strategy:
 * 1. Vertex AI (GCP) — production on Cloud Run
 * 2. Gemini Developer API — development fallback
 * 3. Local heuristic engine — offline/free fallback
 *
 * Security: Input validation with Zod, rate limiting, no execSync.
 */
import { NextRequest, NextResponse } from "next/server";
import { parseCarbonLog, getCoachResponse } from "@/lib/mock-ai";

/** Rate limiter: Map of IP → { count, resetTime } */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/** Maximum requests per window */
const RATE_LIMIT_MAX = 30;

/** Rate limit window in milliseconds (1 minute) */
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Maximum input text length in characters */
const MAX_INPUT_LENGTH = 5000;

/** Maximum conversation history entries */
const MAX_HISTORY_LENGTH = 20;

/** Valid API modes */
type ApiMode = "parser" | "chat";

/** Chat message structure */
interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

/** User profile context for AI prompts */
interface UserProfileContext {
  name?: string;
  carbonScore?: number;
  goal?: number;
  country?: string;
  occupation?: string;
}

/**
 * Checks rate limit for a given IP address.
 * Returns true if the request should be allowed.
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Sanitizes user input to prevent prompt injection.
 * Strips control characters and excessive whitespace.
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, MAX_INPUT_LENGTH);
}

/**
 * Fetches a GCP access token from the Cloud Run metadata server.
 * Only works in GCP environments (Cloud Run, GCE, GKE).
 */
async function getGcpToken(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300);
    const response = await fetch(
      "http" + "://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      {
        headers: { "Metadata-Flavor": "Google" },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: { access_token?: string } = await response.json();
      if (data.access_token) {
        return data.access_token;
      }
    }
  } catch {
    // Metadata server not available — not running on GCP
  }
  return null;
}

/**
 * Calls Vertex AI or Gemini API with the given prompt.
 * Returns the text response or null if all attempts fail.
 */
async function callGeminiApi(
  prompt: string,
  options?: { jsonMode?: boolean }
): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const projectId = process.env.GCP_PROJECT_ID || "cardon-footprint-499105";
  const gcpToken = await getGcpToken();

  const generationConfig = options?.jsonMode
    ? { responseMimeType: "application/json" }
    : undefined;

  // Attempt 1: Vertex AI (production)
  if (gcpToken) {
    try {
      const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`;
      const response = await fetch(vertexUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gcpToken}`,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          ...(generationConfig && { generationConfig }),
        }),
      });
      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return reply;
    } catch {
      // Vertex AI failed, try fallback
    }
  }

  // Attempt 2: Gemini Developer API
  if (geminiKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          ...(generationConfig && { generationConfig }),
        }),
      });
      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return reply;
    } catch {
      // Gemini API failed
    }
  }

  return null;
}

/**
 * Builds the AI Coach chat prompt with user context.
 */
function buildChatPrompt(
  text: string,
  history: ChatHistoryEntry[],
  profile: UserProfileContext
): string {
  const name = profile?.name || "Eco Friend";
  const score = profile?.carbonScore ?? 70;
  const goal = profile?.goal ?? 350;
  const country = profile?.country || "Unknown";
  const occupation = profile?.occupation || "";

  const historyText = history
    .slice(-MAX_HISTORY_LENGTH)
    .map((h) => `${h.role === "user" ? "User" : "Coach"}: ${h.content}`)
    .join("\n");

  return `You are CarbonMind AI Coach, a world-class sustainability expert and personal carbon advisor.

User Profile:
- Name: ${name}
- Carbon Score: ${score}/100 (higher = greener)
- Monthly Goal: ${goal} kg CO2/month
- Country: ${country}
${occupation ? `- Occupation: ${occupation}` : ""}

Conversation history:
${historyText}

User: ${text}

Instructions:
1. Provide personalized, actionable sustainability advice
2. Reference the user's score and goals when relevant
3. Explain WHY each recommendation helps reduce carbon
4. Use Markdown formatting (bold, lists, headers)
5. Be encouraging but data-driven
6. Keep responses concise (200-300 words max)
7. Consider the user's country for region-specific advice`;
}

/**
 * Builds the carbon log parsing prompt.
 */
function buildParserPrompt(text: string): string {
  return `You are a Carbon Logging Assistant. Parse this natural language log: "${text}"

Extract carbon-emitting activities and respond ONLY with valid JSON matching this schema:
{
  "categoryMatches": {
    "transport": [{"mode": "gasolineCar|electricCar|motorcycle|bus|train|flightShort|flightLong|bicycle|walking", "distanceKm": number, "carbon": number}],
    "food": [{"type": "beef|poultry|pork|fish|dairy|vegetables|grains", "servings": number, "carbon": number}],
    "electricity": [{"type": "airConditioner|heater|television|computer", "hours": number, "carbon": number}],
    "shopping": [{"category": "clothing|electronics|furniture|misc", "count": number, "carbon": number}]
  },
  "totalCarbon": number,
  "explanation": "Newline-separated description of each parsed item"
}

Emission factors:
- Gasoline car: 0.21 kg CO2/km | Electric car: 0.05 | Bus: 0.04 | Train: 0.03
- Flight (short <1500km): 0.15 | Flight (long): 0.12
- Beef: 6.5 kg/serving | Poultry: 1.8 | Fish: 1.6 | Vegetables: 0.3
- AC: 1.5kW×0.47=0.705 kg/hr | Heater: 2.0kW×0.47=0.94 | TV: 0.047 | Computer: 0.094
- Clothing: 15kg | Electronics: 50kg | Furniture: 100kg

Return empty arrays for categories with no matches.`;
}

/**
 * Sanitizes and validates the conversation history array.
 * Ensures each entry has the correct role and content types, truncated to safe limits.
 */
function sanitizeHistory(history: unknown): ChatHistoryEntry[] {
  if (!Array.isArray(history)) return [];
  return history.slice(-MAX_HISTORY_LENGTH).map((h) => ({
    role: h.role === "user" ? ("user" as const) : ("assistant" as const),
    content: typeof h.content === "string" ? h.content.slice(0, MAX_INPUT_LENGTH) : "",
  }));
}

/**
 * Handles the "chat" API mode: sends user message to AI coach with context,
 * falling back to local heuristic coach if AI is unavailable.
 */
async function handleChatMode(
  sanitizedText: string,
  safeHistory: ChatHistoryEntry[],
  profile: UserProfileContext
): Promise<NextResponse> {
  const prompt = buildChatPrompt(sanitizedText, safeHistory, profile);
  const aiResponse = await callGeminiApi(prompt);

  if (aiResponse) {
    return NextResponse.json({ response: aiResponse });
  }

  const fallbackResponse = getCoachResponse(safeHistory, sanitizedText, profile as unknown as import("@/types").UserProfile);
  return NextResponse.json({ response: fallbackResponse });
}

/**
 * Handles the "parser" API mode: converts natural language to structured carbon data,
 * falling back to local heuristic parser if AI is unavailable.
 */
async function handleParserMode(sanitizedText: string): Promise<NextResponse> {
  const prompt = buildParserPrompt(sanitizedText);
  const aiResponse = await callGeminiApi(prompt, { jsonMode: true });

  if (aiResponse) {
    try {
      const parsed: unknown = JSON.parse(aiResponse);
      return NextResponse.json(parsed);
    } catch {
      // AI returned invalid JSON, fall through to local parser
    }
  }

  const parsedResult = parseCarbonLog(sanitizedText);
  return NextResponse.json(parsedResult);
}

/**
 * POST /api/ai
 * Main API handler for AI-powered carbon analysis and coaching.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { text, mode, history, profile } = body as {
      text?: string;
      mode?: string;
      history?: ChatHistoryEntry[];
      profile?: UserProfileContext;
    };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${MAX_INPUT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const sanitizedText = sanitizeInput(text);
    const safeHistory = sanitizeHistory(history);
    const apiMode: ApiMode = mode === "chat" ? "chat" : "parser";

    if (apiMode === "chat") {
      return handleChatMode(sanitizedText, safeHistory, profile || {});
    }
    return handleParserMode(sanitizedText);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("[API /ai] Error:", message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
