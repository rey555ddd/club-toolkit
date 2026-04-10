import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock Gemini helper
vi.mock("./gemini", () => ({
  geminiGenerateText: vi.fn().mockResolvedValue("這是一段測試文案內容"),
  geminiGenerateImage: vi.fn().mockResolvedValue(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  ),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "test-key",
    url: "https://example.com/uploaded.jpg",
  }),
}));

// Mock db
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("copywriter.generate", () => {
  it("should generate recruitment copy", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.copywriter.generate({
      type: "recruitment",
      hotel: "both",
      elements: ["高收入機會", "彈性排班"],
    });

    expect(result).toBeDefined();
    expect(result.content).toBe("這是一段測試文案內容");
  });

  it("should generate social media copy", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.copywriter.generate({
      type: "social",
      hotel: "chinatown",
      elements: [],
    });

    expect(result).toBeDefined();
    expect(typeof result.content).toBe("string");
  });

  it("should generate event promotion copy", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.copywriter.generate({
      type: "event",
      hotel: "dihao",
      elements: ["電音派對", "試管調酒"],
      customNote: "這次是週五晚上的活動",
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
  });

  it("should generate lady recruitment copy", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.copywriter.generate({
      type: "lady_recruitment",
      hotel: "both",
      elements: ["高底薪保障", "自由排班"],
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
  });

  it("should generate call client copy", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.copywriter.generate({
      type: "call_client",
      hotel: "chinatown",
      elements: ["新小姐登場", "老客人優惠"],
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
  });
});

describe("planner.generate", () => {
  it("should generate event plan", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.planner.generate({
      hotel: "both",
      eventType: "促銷活動",
      duration: "一週",
      budget: "3-5 萬",
      targetAudience: "老客人",
    });

    expect(result).toBeDefined();
    expect(result.content).toBe("這是一段測試文案內容");
  });

  it("should generate plan without optional fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.planner.generate({
      hotel: "chinatown",
      eventType: "主題派對",
    });

    expect(result).toBeDefined();
    expect(typeof result.content).toBe("string");
  });
});

describe("poster.generate", () => {
  it("should generate poster without uploaded photo (with personStyle and scene)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.poster.generate({
      hotel: "chinatown",
      style: "neon_electronic",
      theme: "電音派對夜",
      features: ["免費挑戰一次"],
      hasUploadedPhoto: false,
      effects: ["吸引新客人上門"],
      personStyle: "elegant",
      scene: "dance_floor",
    });

    expect(result).toBeDefined();
    // Imagen 4 生成後上傳至 S3，回傳 S3 URL
    expect(result.imageUrl).toBe("https://example.com/uploaded.jpg");
  });

  it("should generate poster with uploaded photo", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.poster.generate({
      hotel: "dihao",
      style: "luxury_gold",
      theme: "VIP 之夜",
      features: [],
      hasUploadedPhoto: true,
      uploadedPhotoUrl: "https://example.com/photo.jpg",
      effects: ["老客人回流", "品牌形象強化"],
      scene: "vip_room",
    });

    expect(result).toBeDefined();
    expect(result.imageUrl).toBeTruthy();
  });

  it("should generate poster with cool person style", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.poster.generate({
      hotel: "both",
      style: "modern_minimal",
      theme: "節日主題派對",
      features: ["VIP 專屬待遇"],
      hasUploadedPhoto: false,
      effects: ["品牌形象強化"],
      personStyle: "cool",
      scene: "red_carpet",
    });

    expect(result).toBeDefined();
    expect(result.imageUrl).toBeTruthy();
  });

  it("should upload photo", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.poster.uploadPhoto({
      base64Data: "data:image/jpeg;base64,/9j/4AAQ",
      mimeType: "image/jpeg",
      fileName: "test.jpg",
    });

    expect(result).toBeDefined();
    expect(result.url).toBe("https://example.com/uploaded.jpg");
  });
});

describe("suggestions", () => {
  it("should return empty list when db is null", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.suggestions.list();
    expect(result).toEqual([]);
  });

  it("should throw error when creating suggestion with no db", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suggestions.create({
        nickname: "測試用戶",
        category: "feature",
        content: "這是一個測試建議",
      })
    ).rejects.toThrow("資料庫連線失敗");
  });

  it("should create suggestion when db is available", async () => {
    const { getDb: mockGetDb } = await import("./db");
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    (mockGetDb as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      insert: mockInsert,
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.suggestions.create({
      nickname: "測試用戶",
      category: "feature",
      content: "這是一個測試建議",
    });

    expect(result).toEqual({ success: true });
  });

  it("should validate nickname is required", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suggestions.create({
        nickname: "",
        category: "bug",
        content: "測試內容",
      })
    ).rejects.toThrow();
  });

  it("should validate content is required", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.suggestions.create({
        nickname: "測試",
        category: "other",
        content: "",
      })
    ).rejects.toThrow();
  });
});
