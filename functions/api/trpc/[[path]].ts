/**
 * Cloudflare Pages Functions - tRPC Handler
 * Self-contained implementation of all club-toolkit routes
 * No imports from server/ directory - everything is inline
 */

import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ===== Types & Interfaces =====
interface Env {
  GEMINI_API_KEY: string;
}

interface Context {
  env: Env;
}

interface PagesFunction<Env = unknown> {
  (context: { request: Request; env: Env; next?: () => Promise<Response> }): Response | Promise<Response>;
}

// ===== tRPC Setup =====
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const router = t.router;
const publicProcedure = t.procedure;

// ===== Gemini Helpers =====

function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

const TEXT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

async function geminiGenerateText(
  apiKey: string,
  {
    systemPrompt,
    userPrompt,
  }: {
    systemPrompt: string;
    userPrompt: string;
  }
): Promise<string> {
  const client = getGeminiClient(apiKey);
  let lastError: unknown;
  for (const modelName of TEXT_MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent(userPrompt);
      return result.response.text();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("503") || msg.includes("overloaded") || msg.includes("high demand")) {
        console.log(`Model ${modelName} overloaded, trying next fallback...`);
        continue;
      }
      throw err; // non-503 errors should not be retried
    }
  }
  throw lastError;
}

async function tryImagen4(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "9:16",
            safetyFilterLevel: "block_only_high",
            personGeneration: "allow_adult",
          },
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Imagen4] API error:", response.status, errText.substring(0, 300));
      return null;
    }

    const data = (await response.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
    };

    const prediction = data.predictions?.[0];
    if (!prediction?.bytesBase64Encoded) {
      console.error("[Imagen4] No image returned:", JSON.stringify(data).substring(0, 200));
      return null;
    }

    const mimeType = prediction.mimeType ?? "image/png";
    return `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;
  } catch (e) {
    console.error("[Imagen4] Exception:", e);
    return null;
  }
}

async function tryGeminiImageModel(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const client = getGeminiClient(apiKey);
    // @ts-expect-error - responseModalities is experimental API
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash-preview-image-generation",
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    const result = await model.generateContent(
      `Generate a professional vertical marketing poster (9:16 ratio) for a luxury nightclub in Taiwan. ${prompt}`
    );

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const p = part as { inlineData?: { data: string; mimeType: string } };
      if (p.inlineData?.data) {
        return `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
      }
    }

    console.error("[GeminiImage25] No inline image in response, parts:", parts.length);
    return null;
  } catch (e) {
    console.error("[GeminiImage25] Error:", e);
    return null;
  }
}

async function tryGemini20ImageModel(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a professional vertical marketing poster (9:16 ratio) for a luxury nightclub in Taiwan. ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Gemini20Image] API error:", response.status, errText.substring(0, 300));
      return null;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }>;
        };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    console.error("[Gemini20Image] No inline image in response");
    return null;
  } catch (e) {
    console.error("[Gemini20Image] Exception:", e);
    return null;
  }
}

async function geminiGenerateImage(apiKey: string, prompt: string): Promise<string | null> {
  console.log("[Image] 嘗試 Imagen 4...");
  const imagen4Result = await tryImagen4(apiKey, prompt);
  if (imagen4Result) {
    console.log("[Image] Imagen 4 成功");
    return imagen4Result;
  }

  console.log("[Image] Imagen 4 失敗，改用 gemini-2.5-flash-preview-image-generation fallback");
  const geminiImageResult = await tryGeminiImageModel(apiKey, prompt);
  if (geminiImageResult) {
    console.log("[Image] gemini-2.5-flash-preview-image-generation 成功");
    return geminiImageResult;
  }

  console.log("[Image] 嘗試 gemini-2.0-flash-exp-image-generation fallback...");
  const gemini20Result = await tryGemini20ImageModel(apiKey, prompt);
  if (gemini20Result) {
    console.log("[Image] gemini-2.0-flash-exp-image-generation 成功");
    return gemini20Result;
  }

  console.error("[Image] 所有圖片生成方式均失敗");
  return null;
}

// ===== Router: Copywriter =====
const copywriterRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        type: z.enum(["recruitment", "social", "event", "lady_recruitment", "call_client"]),
        hotel: z.enum(["chinatown", "dihao", "both"]).default("both"),
        elements: z.array(z.string()).default([]),
        customNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const typeLabels: Record<string, string> = {
        recruitment: "徵員文案",
        social: "社群貼文",
        event: "活動宣傳文案",
        lady_recruitment: "小姐招募文案",
        call_client: "Call客文宣",
      };

      const hotelInfo: Record<string, string> = {
        chinatown: "中國城經典酒店（桃園市桃園區復興路99號8樓，電話 03-339-2188）",
        dihao: "帝豪酒店（桃園市桃園區復興路99號6樓，電話 03-339-3666）",
        both: "中國城經典酒店（8樓，03-339-2188）× 帝豪酒店（6樓，03-339-3666）",
      };

      const typePrompts: Record<string, string> = {
        recruitment: `你是一個在台灣八大行業酒店業工作多年的老手，現在幫店裡寫徵員文案。
職缺包含：外場服務生、控台人員、服裝部助理、巡管人員、總務助理、水電師傅等。
強調：高收入機會、彈性排班、完整教育訓練、優質工作環境、專人帶領快速上手。
語氣：直接、務實、有說服力，不要太正式，要像老闆在跟朋友說話。`,

        social: `你是一個懂得酒店業社群經營的小編，幫中國城/帝豪酒店寫 IG/FB 貼文。
語氣：輕鬆、有個性、帶點神秘感，讓人想點進來看。
不要太廣告感，要像在分享店裡的日常或氛圍。`,

        event: `你是一個酒店業活動企劃，幫店裡寫活動宣傳文案。
活動類型可能是：電音派對、試管調酒、摩天輪調酒、節日主題派對、VIP之夜等。
語氣：有氣氛、有誘惑力、讓人想來玩，要有夜店感但不要俗氣。`,

        lady_recruitment: `你是一個在台灣八大行業工作的老手，幫酒店寫公關小姐招募文案。
強調：高收入、自由排班、安全環境、專業帶領、不需要特殊技能、歡迎新人。
語氣：真誠、直接，讓看到的女生覺得這是個好機會，不要太過花俏。
可以提到：底薪保障、抽成制度、班表彈性、店裡氣氛好、姐妹情誼。`,

        call_client: `你是一個酒店業的業務，幫店裡寫傳給老客人的 Call 客文宣。
目的：讓老客人回來開番，勾起他們的回憶和慾望。
語氣：像老朋友在傳訊息，親切、有點撩撲，讓人看了就想回來。
可以提到：新活動、新的小姐、特別優惠、老客人專屬待遇。`,
      };

      const elementsText = input.elements.length > 0
        ? `\n\n使用者特別要求包含以下元素：${input.elements.join("、")}`
        : "";

      const customText = input.customNote
        ? `\n\n使用者補充說明：${input.customNote}`
        : "";

      const systemPrompt = `${typePrompts[input.type]}

酒店資訊：${hotelInfo[input.hotel]}

【重要的文案風格規定】
1. 絕對不要用 emoji 當標題或段落開頭
2. 段落長短要刻意參差，有的長有的短，不要每段都差不多長
3. 不要用這些萬用填充詞：「不僅如此」「值得一提的是」「總而言之」「此外」「另外」「同時」「更重要的是」
4. 語氣要統一，不要一下正式一下口語
5. 結尾不要太完美或太勵志，要自然收尾
6. 整體語氣要直接、接地氣，符合台灣酒店業的說話方式
7. 不要有 AI 生成的痕跡，要像真人在寫
8. 可以用一些台灣口語，但不要過度
${elementsText}${customText}`;

      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, {
        systemPrompt,
        userPrompt: `請幫我寫一篇${typeLabels[input.type]}，大約 200-400 字。直接輸出文案內容，不要有任何前言或解釋。`,
      });

      return { content };
    }),
});

// ===== Router: Planner =====
const plannerRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        hotel: z.enum(["chinatown", "dihao", "both"]).default("both"),
        eventType: z.string(),
        duration: z.string().optional(),
        budget: z.string().optional(),
        targetAudience: z.string().optional(),
        specialRequirements: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hotelInfo: Record<string, string> = {
        chinatown: "中國城經典酒店（桃園市桃園區復興路99號8樓，電話 03-339-2188）",
        dihao: "帝豪酒店（桃園市桃園區復興路99號6樓，電話 03-339-3666）",
        both: "中國城經典酒店（8樓，03-339-2188）× 帝豪酒店（6樓，03-339-3666）",
      };

      const systemPrompt = `你是一個在台灣八大行業酒店業工作超過十年的老手，專門負責活動企劃和行銷。
你非常了解酒店業的生態、客人的心理、以及什麼樣的活動最能帶動業績。

酒店資訊：${hotelInfo[input.hotel]}

請幫我規劃一個完整的活動企劃，包含以下內容：
1. 活動主題與名稱
2. 活動核心賣點（3-5個）
3. 執行排程（活動前、活動中、活動後）
4. 宣傳文案（可以成人向，符合酒店業風格）
5. Call客策略（怎麼讓老客人回來）
6. 預算建議（如果有提供預算範圍）
7. 注意事項

語氣要專業但接地氣，像是老手在跟新人分享經驗。
內容可以成人向，符合八大行業酒店的實際需求。`;

      const userPrompt = `活動類型：${input.eventType}
${input.duration ? `活動期間：${input.duration}` : ""}
${input.budget ? `預算範圍：${input.budget}` : ""}
${input.targetAudience ? `目標客群：${input.targetAudience}` : ""}
${input.specialRequirements ? `特殊需求：${input.specialRequirements}` : ""}

請給我一份完整的活動企劃。`;

      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, {
        systemPrompt,
        userPrompt,
      });

      return { content };
    }),
});

// ===== Router: Poster =====
const posterRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        hotel: z.enum(["chinatown", "dihao", "both"]).default("chinatown"),
        style: z.enum(["neon_electronic", "luxury_gold", "festival_red", "modern_minimal"]),
        theme: z.string(),
        features: z.array(z.string()).default([]),
        hasUploadedPhoto: z.boolean().default(false),
        uploadedPhotoUrl: z.string().optional(),
        customPrompt: z.string().optional(),
        effects: z.array(z.string()).default([]),
        personStyle: z.enum(["elegant", "sweet", "fashionable", "graceful", "cool"]).optional(),
        scene: z.enum(["vip_room", "dance_floor", "bar_counter", "red_carpet"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const styleDescriptions: Record<string, string> = {
        neon_electronic: "neon electronic music night club style, purple and blue neon lights, dark background, futuristic cyberpunk aesthetic, glowing neon signs",
        luxury_gold: "luxury gold and black style, elegant golden decorations, dark background with golden accents, high-end nightclub atmosphere, sophisticated and glamorous",
        festival_red: "festive red and gold Chinese style, red background with golden decorations, auspicious Chinese patterns, celebration atmosphere",
        modern_minimal: "modern minimalist luxury style, dark background, clean typography, subtle gold accents, contemporary high-end design",
      };

      const hotelNames: Record<string, string> = {
        chinatown: "China Town Club",
        dihao: "Empire Royal Club",
        both: "China Town Club x Empire Royal Club",
      };

      const personStyleMap: Record<string, string> = {
        elegant: "elegant and sophisticated hostess in a luxurious evening gown, graceful posture, mature and refined appearance",
        sweet: "charming and approachable hostess in a chic cocktail dress, warm smile, youthful and pleasant appearance",
        fashionable: "trendy and stylish hostess in a contemporary designer outfit, confident pose, modern and chic appearance",
        graceful: "graceful and poised hostess in a classic evening dress, gentle demeanor, cultured and refined appearance",
        cool: "mysterious and alluring hostess in a sleek evening outfit, captivating gaze, cool and sophisticated appearance",
      };

      const sceneMap: Record<string, string> = {
        vip_room: "luxurious VIP private lounge with plush seating, ambient lighting, and exclusive decor",
        dance_floor: "vibrant nightclub dance floor with dynamic lighting effects and energetic atmosphere",
        bar_counter: "elegant bar counter with premium spirits display, professional bar setup, and sophisticated ambiance",
        red_carpet: "glamorous red carpet event setting with spotlights, velvet ropes, and VIP atmosphere",
      };

      const personDesc = input.personStyle ? personStyleMap[input.personStyle] : "elegant and glamorous hostess in a sophisticated evening gown, professional and alluring appearance";
      const sceneDesc = input.scene ? sceneMap[input.scene] : "upscale nightclub venue with premium lighting and luxurious interior";

      const featureKeywords = input.features.length > 0
        ? `Special features: ${input.features.join(", ")}.`
        : "";

      const effectKeywords = input.effects.length > 0
        ? `Marketing objectives: ${input.effects.join(", ")}.`
        : "";

      const qualityTerms = "High quality commercial photography, professional studio lighting, magazine editorial style, sharp focus, vibrant colors, premium production value.";

      let imagePrompt = "";

      if (input.hasUploadedPhoto && input.uploadedPhotoUrl) {
        imagePrompt = `Professional nightclub marketing poster for ${hotelNames[input.hotel]}, a premium luxury entertainment venue in Taiwan.
Event theme: ${input.theme}.
Setting: ${sceneDesc}.
Style: ${styleDescriptions[input.style]}.
${featureKeywords}
${effectKeywords}
Design: elegant bilingual (Chinese and English) typography, hotel name prominently featured, professional layout with decorative elements.
${input.customPrompt ? `Additional details: ${input.customPrompt}.` : ""}
${qualityTerms}
Vertical portrait format, 9:16 aspect ratio.`;
      } else {
        imagePrompt = `Professional nightclub marketing poster for ${hotelNames[input.hotel]}, a premium luxury entertainment venue in Taiwan.
Event theme: ${input.theme}.
Featuring: ${personDesc}.
Setting: ${sceneDesc}.
Style: ${styleDescriptions[input.style]}.
${featureKeywords}
${effectKeywords}
Design: elegant bilingual (Chinese and English) typography, hotel name prominently featured, professional layout with decorative elements.
${input.customPrompt ? `Additional details: ${input.customPrompt}.` : ""}
${qualityTerms}
Vertical portrait format, 9:16 aspect ratio.`;
      }

      const imageDataUrl = await geminiGenerateImage(ctx.env.GEMINI_API_KEY, imagePrompt);

      if (!imageDataUrl) {
        throw new Error("圖片生成失敗。Imagen 4 需要 Google AI 付費方案，請到 https://ai.dev/projects 升級後再試。");
      }

      return { imageBase64: imageDataUrl };
    }),

  uploadPhoto: publicProcedure
    .input(
      z.object({
        base64Data: z.string(),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
      })
    )
    .mutation(async ({ input }) => {
      const base64 = input.base64Data.replace(/^data:[^;]+;base64,/, "");
      return { base64, mimeType: input.mimeType, fileName: input.fileName };
    }),
});

// ===== Router: Suggestions =====
const suggestionsRouter = router({
  list: publicProcedure.query(async () => {
    return [];
  }),

  create: publicProcedure
    .input(
      z.object({
        nickname: z.string().min(1, "請輸入暱稱").max(100),
        category: z.enum(["feature", "bug", "design", "content", "other"]).default("other"),
        content: z.string().min(1, "請輸入建議內容").max(2000),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[Suggestions] Created:", { ...input });
      return { success: true };
    }),
});

// ===== Main App Router =====
const appRouter = router({
  copywriter: copywriterRouter,
  planner: plannerRouter,
  poster: posterRouter,
  suggestions: suggestionsRouter,
});

export type AppRouter = typeof appRouter;

// ===== Cloudflare Pages Handler =====
export const onRequest: PagesFunction<Env> = async (context) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: context.request,
    router: appRouter,
    createContext: () => ({ env: context.env as unknown as Env }),
  });
};
