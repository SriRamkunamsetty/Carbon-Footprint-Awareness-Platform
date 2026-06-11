/**
 * @vitest-environment node
 */
import { POST } from "@/app/api/ai/route";
import { NextRequest } from "next/server";
import { vi } from "vitest";

// Mock the getGcpToken and fetch for Gemini APIs
global.fetch = vi.fn();

describe("API /ai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  const createRequest = (body: any) => {
    return new NextRequest("http" + "://localhost:3000/api/ai", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("returns 400 for missing text field", async () => {
    const req = createRequest({ mode: "parser" });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Text is required");
  });

  it("handles valid parser request with mocked AI", async () => {
    (global.fetch as any).mockImplementation(async (url: string) => {
      if (url.includes("metadata.google.internal")) {
        return { ok: false };
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        return {
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    categoryMatches: {
                      transport: [{ mode: "gasolineCar", distanceKm: 10, carbon: 2.1 }],
                      food: [], electricity: [], shopping: [],
                    },
                    totalCarbon: 2.1,
                    explanation: "Drove 10km",
                  })
                }]
              }
            }]
          })
        };
      }
      return { ok: false };
    });

    const req = createRequest({ text: "I drove 10km in my car", mode: "parser" });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.totalCarbon).toBeDefined();
    expect(data.categoryMatches).toBeDefined();
  });

  it("handles valid chat request with mocked AI", async () => {
    (global.fetch as any).mockImplementation(async (url: string) => {
      if (url.includes("metadata.google.internal")) {
        return { ok: false };
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        return {
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: "That is great that you used public transport!" }] } }],
          }),
        };
      }
      return { ok: false };
    });

    const req = createRequest({ text: "I took the bus today", mode: "chat" });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.response).toContain("public transport");
  });
});
