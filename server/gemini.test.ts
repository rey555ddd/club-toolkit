import { describe, it, expect, vi, beforeEach } from "vitest";

// 必須在 import gemini 之前設定 mock
vi.mock("@google/generative-ai", () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => "這是一段測試文案，語氣直接接地氣，符合酒店業風格。",
    },
  });

  const mockGetGenerativeModel = vi.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  });

  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

describe("Gemini Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-api-key-mock";
  });

  it("geminiGenerateText 應正確呼叫 Gemini SDK 並回傳文字", async () => {
    const { geminiGenerateText } = await import("./gemini");

    const result = await geminiGenerateText({
      systemPrompt: "你是一個酒店業文案專家",
      userPrompt: "請幫我寫一篇徵員文案",
    });

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("文案");
  });

  it("geminiGenerateImage 應在 Imagen 3 成功時回傳 base64 data URL", async () => {
    // Mock fetch for Imagen 3
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        predictions: [
          {
            bytesBase64Encoded:
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            mimeType: "image/png",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { geminiGenerateImage } = await import("./gemini");
    const result = await geminiGenerateImage("test poster prompt");

    expect(result).not.toBeNull();
    expect(result).toMatch(/^data:image\/png;base64,/);

    vi.unstubAllGlobals();
  });

  it("geminiGenerateImage 應在 Imagen 3 失敗時回傳 null", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });
    vi.stubGlobal("fetch", mockFetch);

    const { geminiGenerateImage } = await import("./gemini");
    const result = await geminiGenerateImage("test prompt");

    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });

  it("geminiGenerateImage 應在沒有 predictions 時回傳 null", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ predictions: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { geminiGenerateImage } = await import("./gemini");
    const result = await geminiGenerateImage("test prompt");

    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });
});
