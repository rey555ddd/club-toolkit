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

const TEXT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash-lite"];

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
      if (msg.includes("503") || msg.includes("404") || msg.includes("overloaded") || msg.includes("high demand") || msg.includes("no longer available")) {
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
      model: "gemini-2.5-flash-image",
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

    console.error("[gemini-2.5-flash-image] No inline image in response, parts:", parts.length);
    return null;
  } catch (e) {
    console.error("[gemini-2.5-flash-image] Error:", e);
    return null;
  }
}

async function tryGemini20ImageModel(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
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
  console.log("[Image] åè©¦ Imagen 4...");
  const imagen4Result = await tryImagen4(apiKey, prompt);
  if (imagen4Result) {
    console.log("[Image] Imagen 4 æå");
    return imagen4Result;
  }

  console.log("[Image] Imagen 4 å¤±æï¼æ¹ç¨ gemini-2.5-flash-image fallback");
  const geminiImageResult = await tryGeminiImageModel(apiKey, prompt);
  if (geminiImageResult) {
    console.log("[Image] gemini-2.5-flash-image æå");
    return geminiImageResult;
  }

  console.log("[Image] åè©¦ gemini-2.0-flash-lite image fallback...");
  const gemini20Result = await tryGemini20ImageModel(apiKey, prompt);
  if (gemini20Result) {
    console.log("[Image] gemini-2.0-flash-lite æå");
    return gemini20Result;
  }

  console.error("[Image] ææåççææ¹å¼åå¤±æ");
  return null;
}

// ===== Router: Copywriter =====
const copywriterRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        type: z.enum(["recruitment", "social", "event", "lady_recruitment", "call_client"]),
        hotel: z.enum(["chinatown", "dihao", "both"]).default("both"),
        platform: z.enum(["ig_post", "ig_story", "fb_post", "line_msg", "sms"]).default("ig_post"),
        elements: z.array(z.string()).default([]),
        customNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const typeLabels = {
        recruitment: "徵員文案",
        social: "社群貼文",
        event: "活動宣傳文案",
        lady_recruitment: "小姐招募文案",
        call_client: "Call客文宣",
      };
      const hotelInfo = {
        chinatown: "中國城經典酒店（桃園市桃園區復興路99號8樓，電話 03-339-2188）",
        dihao: "帝豪酒店（桃園市桃園區復興路99號6樓，電話 03-339-3666）",
        both: "中國城經典酒店（8樓，03-339-2188）× 帝豪酒店（6樓，03-339-3666）",
      };
      const typePrompts = {
        recruitment: `你是在桃園八大行業幹了十幾年的老鳥，現在幫店裡寫徵員文案。
架構用 PAS：先講這行的痛點（一般工作薪水低、看不到未來），再放大（每天朝九晚五賺那點錢值得嗎），最後帶出解方（來這裡，收入翻倍、彈性自由）。
職缺包含：外場服務生、控台、服裝部助理、巡管、總監助理、水電師傅。
語氣：講人話、直接、像學長在跟你說真心話。不要官腔，不要像人力銀行貼的。
必須帶一個具體數字（薪資範圍或上手天數），讓人覺得「這是真的」。`,
        social: `你是很懂夜店酒店氛圍的社群操盤手，幫中國城/帝豪寫 IG/FB 貼文。
架構用 AIDA：Attention 用一句 Hook 抓眼球 → Interest 用畫面感讓人好奇 → Desire 製造想去的衝動 → Action 暗示今晚來。
語氣：帶點曖昧、帶點神秘，像在說一個只有懂的人才懂的故事。
用五感寫作：燈光的顏色、音樂的節奏、酒杯碰撞的聲音、空氣裡的香水味——讓人「看到畫面」。
不要寫得像廣告，要像在分享一個值得去的秘密基地。`,
        event: `你是酒店業的活動行銷高手，幫店裡寫活動宣傳文案。
架構用 AIDA：Attention 用衝擊力的標題 → Interest 活動亮點 → Desire 製造 FOMO（錯過等明年）→ Action 訂位資訊。
活動類型：電音派對、試管調酒、摩天輪調酒、節日主題派對、VIP之夜等。
語氣：有氣勢、有節奏感，像在預告一場你不能缺席的事件。
開頭要有 Hook——用提問、反常識、或直接喊出一個讓人停下來的句子。`,
        lady_recruitment: `你是在八大行業帶過很多新人的資深姐姐，幫店裡寫公關小姐招募文案。
架構用 PAS：先講現在工作的痛（薪水少、被壓榨、看人臉色），再放大（這樣的日子要過多久），最後帶出這裡的好（收入高、姐妹互挺、時間自由）。
強調：底薪保障、抽成透明、自由排班、安全環境、專業帶領。
語氣：真誠、溫暖但直接，像姐姐在跟你說實話。不要太夢幻，要讓人覺得靠譜。
帶一個具體數字（收入範圍或到職人數），增加可信度。`,
        call_client: `你是酒店的王牌業務，幫店裡寫傳給老客人的回店邀約訊息。
架構用 AIDA：Attention 用一句讓人想回的話開頭 → Interest 提新的亮點 → Desire 專屬感加回憶殺 → Action 今晚或這週來。
語氣：像老朋友傳 LINE，親切、有點撩、讓人嘴角上揚就想回。
不要太正式、不要像群發，要讓人覺得「這是專門傳給我的」。
可以提：新來的妹、新活動、老客人才有的待遇、好久不見想你了。`,
      };
      const platformMap = {
        ig_post: {
          label: "Instagram 貼文",
          length: "80-150 字",
          format: "適合 IG 閱讀節奏：短段落、有留白、可加 hashtag。語氣輕鬆帶感。",
        },
        ig_story: {
          label: "Instagram 限時動態",
          length: "30-60 字",
          format: "極短、一句話抓住眼球。像在對朋友喊話，要有衝擊力。可以用一個問句或一句狠話。",
        },
        fb_post: {
          label: "Facebook 貼文",
          length: "120-200 字",
          format: "比 IG 可以稍長，但段落要分明。適合說故事或帶情境。",
        },
        line_msg: {
          label: "LINE 訊息",
          length: "50-100 字",
          format: "像私訊朋友，簡短親切。不要有標題感，直接講重點。適合 Call 客或通知。",
        },
        sms: {
          label: "簡訊",
          length: "30-50 字",
          format: "極精簡，一句話講完重點加行動呼籲。像傳簡訊給熟人。",
        },
      };
      const platformInfo = platformMap[input.platform];
      const elementsText = input.elements.length > 0
        ? "\n\n使用者特別要求包含以下元素：" + input.elements.join("、")
        : "";
      const customText = input.customNote
        ? "\n\n使用者補充說明：" + input.customNote
        : "";

      const systemPrompt = typePrompts[input.type] + `

酒店資訊：${hotelInfo[input.hotel]}
發布平台：${platformInfo.label}
字數要求：${platformInfo.length}
排版要求：${platformInfo.format}

══ 文案鐵律 ══

【Hook 開頭 3 秒法則】
前兩句決定生死。五選一：痛點提問、反常識、具體數字、說出心聲、製造懸念。開頭絕對不能平鋪直敘。

【去 AI 味】
1. 不用 emoji 當標題或段落開頭
2. 段落長短參差不齊，有的一句話就一段，有的三四行
3. 禁用詞：「不僅如此」「值得一提」「總而言之」「此外」「更重要的是」「在這個…的時代」「讓我們一起」「相信你一定會」「話不多說」「氛圍」「整體」「超級」「真心覺得」「非常推薦」
4. 語氣全篇統一，開頭什麼調性結尾就什麼調性
5. 結尾不要太完美：用吐槽式、懸念式、或突然結束式收尾
6. 帶至少一個具體數字（非圓整數更好）
7. 加語氣緩衝（「可能」「我猜」「應該是」），別太肯定地下結論
8. 關鍵處用一句話獨立成段，製造節奏停頓
9. 拿掉酒店名讀起來要像一個有血有肉的人寫的

【五感寫作】
至少用一種感官描寫（燈光畫面、音樂節拍、酒香、皮沙發觸感、冰塊碰杯聲），讓人看到場景不是讀到形容詞。

【行銷 4 有自檢】
有哏：讓人想停下來看 / 有關：跟目標受眾的生活有關 / 有感：引起情緒共鳴 / 有想要：看完想行動
` + elementsText + customText;
      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, {
        systemPrompt,
        userPrompt: "請幫我寫一篇" + typeLabels[input.type] + "，發布在" + platformInfo.label + "。字數控制在" + platformInfo.length + "。精簡有力，每個字都要有用。直接輸出文案，不要任何前言、說明、或「以下是文案」之類的開場。",
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
        chinatown: "ä¸­ååç¶å¸éåºï¼æ¡åå¸æ¡ååå¾©èè·¯99è8æ¨ï¼é»è©± 03-339-2188ï¼",
        dihao: "å¸è±ªéåºï¼æ¡åå¸æ¡ååå¾©èè·¯99è6æ¨ï¼é»è©± 03-339-3666ï¼",
        both: "ä¸­ååç¶å¸éåºï¼8æ¨ï¼03-339-2188ï¼Ã å¸è±ªéåºï¼6æ¨ï¼03-339-3666ï¼",
      };

      const systemPrompt = `ä½ æ¯ä¸åå¨å°ç£å«å¤§è¡æ¥­éåºæ¥­å·¥ä½è¶éåå¹´çèæï¼å°éè² è²¬æ´»åä¼ååè¡é·ã
ä½ éå¸¸äºè§£éåºæ¥­ççæãå®¢äººçå¿çãä»¥åä»éº¼æ¨£çæ´»åæè½å¸¶åæ¥­ç¸¾ã

éåºè³è¨ï¼${hotelInfo[input.hotel]}

è«å¹«æè¦åä¸åå®æ´çæ´»åä¼åï¼åå«ä»¥ä¸å§å®¹ï¼
1. æ´»åä¸»é¡èåç¨±
2. æ´»åæ ¸å¿è³£é»ï¼3-5åï¼
3. å·è¡æç¨ï¼æ´»ååãæ´»åä¸­ãæ´»åå¾ï¼
4. å®£å³ææ¡ï¼å¯ä»¥æäººåï¼ç¬¦åéåºæ¥­é¢¨æ ¼ï¼
5. Callå®¢ç­ç¥ï¼æéº¼è®èå®¢äººåä¾ï¼
6. é ç®å»ºè­°ï¼å¦æææä¾é ç®ç¯åï¼
7. æ³¨æäºé 

èªæ°£è¦å°æ¥­ä½æ¥å°æ°£ï¼åæ¯èæå¨è·æ°äººåäº«ç¶é©ã
å§å®¹å¯ä»¥æäººåï¼ç¬¦åå«å¤§è¡æ¥­éåºçå¯¦ééæ±ã`;

      const userPrompt = `æ´»åé¡åï¼${input.eventType}
${input.duration ? `æ´»åæéï¼${input.duration}` : ""}
${input.budget ? `é ç®ç¯åï¼${input.budget}` : ""}
${input.targetAudience ? `ç®æ¨å®¢ç¾¤ï¼${input.targetAudience}` : ""}
${input.specialRequirements ? `ç¹æ®éæ±ï¼${input.specialRequirements}` : ""}

è«çµ¦æä¸ä»½å®æ´çæ´»åä¼åã`;

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
        excludeText: z.boolean().default(false),
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
        elegant: "elegant and sophisticated hostess in a luxurious evening gown, graceful posture, mature and refined appearance, genuine warm smile with sparkling eyes, natural relaxed joyful expression, candid moment of laughter",
        sweet: "charming and approachable hostess in a chic cocktail dress, bright radiant smile showing natural happiness, youthful and pleasant appearance, eyes lit up with genuine delight, relaxed and comfortable expression",
        fashionable: "trendy and stylish hostess in a contemporary designer outfit, confident pose with a natural beaming smile, modern and chic appearance, authentic joyful expression, eyes crinkled with genuine happiness",
        graceful: "graceful and poised hostess in a classic evening dress, gentle warm smile radiating natural charm, cultured and refined appearance, soft genuine expression of contentment, relaxed and inviting demeanor",
        cool: "mysterious and alluring hostess in a sleek evening outfit, captivating gaze with a subtle confident smile, cool and sophisticated appearance, naturally relaxed expression, effortlessly charming demeanor",
      };

      const sceneMap: Record<string, string> = {
        vip_room: "luxurious VIP private lounge with plush seating, ambient lighting, and exclusive decor",
        dance_floor: "vibrant nightclub dance floor with dynamic lighting effects and energetic atmosphere",
        bar_counter: "elegant bar counter with premium spirits display, professional bar setup, and sophisticated ambiance",
        red_carpet: "glamorous red carpet event setting with spotlights, velvet ropes, and VIP atmosphere",
      };

      const personDesc = input.personStyle ? personStyleMap[input.personStyle] : "elegant and glamorous hostess in a sophisticated evening gown, professional and alluring appearance, genuine warm radiant smile, natural relaxed joyful expression, eyes sparkling with authentic happiness";
      const sceneDesc = input.scene ? sceneMap[input.scene] : "upscale nightclub venue with premium lighting and luxurious interior";

      const featureKeywords = input.features.length > 0
        ? `Special features: ${input.features.join(", ")}.`
        : "";

      const effectKeywords = input.effects.length > 0
        ? `Marketing objectives: ${input.effects.join(", ")}.`
        : "";

      const qualityTerms = "High quality commercial photography, professional studio lighting, magazine editorial style, sharp focus, vibrant colors, premium production value.";
      const personPhotographyTerms = "Photograph the person with natural, candid expression. Capture a genuine, relaxed moment - not a posed studio shot. The smile should look real and warm, with natural eye crinkle (Duchenne smile). Avoid stiff, robotic, or overly perfect expressions.";

      const typographyLine = input.excludeText
        ? "Design: clean background-focused composition, NO text, NO typography, NO words, NO letters on the image. Leave space for text overlay."
        : "Design: elegant bilingual (Chinese and English) typography, hotel name prominently featured, professional layout with decorative elements.";

      let imagePrompt = "";

      if (input.hasUploadedPhoto && input.uploadedPhotoUrl) {
        imagePrompt = `Professional nightclub marketing poster for ${hotelNames[input.hotel]}, a premium luxury entertainment venue in Taiwan.
Event theme: ${input.theme}.
Setting: ${sceneDesc}.
Style: ${styleDescriptions[input.style]}.
${featureKeywords}
${effectKeywords}
${typographyLine}
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
${typographyLine}
${personPhotographyTerms}
${input.customPrompt ? `Additional details: ${input.customPrompt}.` : ""}
${qualityTerms}
Vertical portrait format, 9:16 aspect ratio.`;
      }

      const imageDataUrl = await geminiGenerateImage(ctx.env.GEMINI_API_KEY, imagePrompt);

      if (!imageDataUrl) {
        throw new Error("åççæå¤±æãImagen 4 éè¦ Google AI ä»è²»æ¹æ¡ï¼è«å° https://ai.dev/projects åç´å¾åè©¦ã");
      }

      return { imageBase64: imageDataUrl };
    }),

  suggestCopy: publicProcedure
    .input(
      z.object({
        hotel: z.enum(["chinatown", "dihao", "both"]).default("chinatown"),
        style: z.enum(["neon_electronic", "luxury_gold", "festival_red", "modern_minimal"]),
        theme: z.string(),
        features: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hotelLabels: Record<string, string> = {
        chinatown: "中國城經典酒店",
        dihao: "帝豪酒店",
        both: "中國城經典酒店 × 帝豪酒店",
      };

      const styleLabels: Record<string, string> = {
        neon_electronic: "霓虹電子風",
        luxury_gold: "奢華金色風",
        festival_red: "節慶紅金風",
        modern_minimal: "現代極簡風",
      };

      const systemPrompt = `你是一個在台灣八大行業酒店業工作多年的資深行銷，擅長寫吸睛的海報文案。
你要根據活動主題和風格，生成適合放在海報上的文字。

規則：
1. 標題要簡短有力，最多15個字，要有衝擊力
2. 副標題補充說明，最多20個字
3. 資訊行放日期/地點等細節，最多30個字
4. CTA按鈕文字要有行動力，最多10個字
5. 語氣要符合酒店業：有點性感、有點神秘、讓人想來
6. 文字要適合放在海報上，不是寫文章

請用 JSON 格式回覆，格式如下：
{"title": "主標題", "subtitle": "副標題", "info": "資訊行", "cta": "CTA按鈕"}
只回覆 JSON，不要有其他文字。`;

      const userPrompt = `酒店：${hotelLabels[input.hotel]}
風格：${styleLabels[input.style]}
活動主題：${input.theme}
${input.features.length > 0 ? `內容特色：${input.features.join("、")}` : ""}`;

      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, {
        systemPrompt,
        userPrompt,
      });

      try {
        const cleanJson = content.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleanJson) as { title: string; subtitle: string; info: string; cta: string };
        return {
          title: (parsed.title || "").slice(0, 15),
          subtitle: (parsed.subtitle || "").slice(0, 20),
          info: (parsed.info || "").slice(0, 30),
          cta: (parsed.cta || "").slice(0, 10),
        };
      } catch {
        return {
          title: "今夜不醉不歸",
          subtitle: "最頂級的夜生活體驗",
          info: "每晚 9:00 PM 起",
          cta: "立即預約",
        };
      }
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
        nickname: z.string().min(1, "è«è¼¸å¥æ±ç¨±").max(100),
        category: z.enum(["feature", "bug", "design", "content", "other"]).default("other"),
        content: z.string().min(1, "è«è¼¸å¥å»ºè­°å§å®¹").max(2000),
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
