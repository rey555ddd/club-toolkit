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
        elements: z.array(z.string()).default([]),
        customNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const typeLabels: Record<string, string> = {
        recruitment: "å¾µå¡ææ¡",
        social: "ç¤¾ç¾¤è²¼æ",
        event: "æ´»åå®£å³ææ¡",
        lady_recruitment: "å°å§æåææ¡",
        call_client: "Callå®¢æå®£",
      };

      const hotelInfo: Record<string, string> = {
        chinatown: "ä¸­ååç¶å¸éåºï¼æ¡åå¸æ¡ååå¾©èè·¯99è8æ¨ï¼é»è©± 03-339-2188ï¼",
        dihao: "å¸è±ªéåºï¼æ¡åå¸æ¡ååå¾©èè·¯99è6æ¨ï¼é»è©± 03-339-3666ï¼",
        both: "ä¸­ååç¶å¸éåºï¼8æ¨ï¼03-339-2188ï¼Ã å¸è±ªéåºï¼6æ¨ï¼03-339-3666ï¼",
      };

      const typePrompts: Record<string, string> = {
        recruitment: `ä½ æ¯ä¸åå¨å°ç£å«å¤§è¡æ¥­éåºæ¥­å·¥ä½å¤å¹´çèæï¼ç¾å¨å¹«åºè£¡å¯«å¾µå¡ææ¡ã
è·ç¼ºåå«ï¼å¤å ´æåçãæ§å°äººå¡ãæè£é¨å©çãå·¡ç®¡äººå¡ãç¸½åå©çãæ°´é»å¸«åç­ã
å¼·èª¿ï¼é«æ¶å¥æ©æãå½æ§æç­ãå®æ´æè²è¨ç·´ãåªè³ªå·¥ä½ç°å¢ãå°äººå¸¶é å¿«éä¸æã
èªæ°£ï¼ç´æ¥ãåå¯¦ãæèªªæåï¼ä¸è¦å¤ªæ­£å¼ï¼è¦åèéå¨è·æåèªªè©±ã`,

        social: `ä½ æ¯ä¸åæå¾éåºæ¥­ç¤¾ç¾¤ç¶ççå°ç·¨ï¼å¹«ä¸­åå/å¸è±ªéåºå¯« IG/FB è²¼æã
èªæ°£ï¼è¼é¬ãæåæ§ãå¸¶é»ç¥ç§æï¼è®äººæ³é»é²ä¾çã
ä¸è¦å¤ªå»£åæï¼è¦åå¨åäº«åºè£¡çæ¥å¸¸ææ°åã`,

        event: `ä½ æ¯ä¸åéåºæ¥­æ´»åä¼åï¼å¹«åºè£¡å¯«æ´»åå®£å³ææ¡ã
æ´»åé¡åå¯è½æ¯ï¼é»é³æ´¾å°ãè©¦ç®¡èª¿éãæ©å¤©è¼ªèª¿éãç¯æ¥ä¸»é¡æ´¾å°ãVIPä¹å¤ç­ã
èªæ°£ï¼ææ°£æ°ãæèªæåãè®äººæ³ä¾ç©ï¼è¦æå¤åºæä½ä¸è¦ä¿æ°£ã`,

        lady_recruitment: `ä½ æ¯ä¸åå¨å°ç£å«å¤§è¡æ¥­å·¥ä½çèæï¼å¹«éåºå¯«å¬éå°å§æåææ¡ã
å¼·èª¿ï¼é«æ¶å¥ãèªç±æç­ãå®å¨ç°å¢ãå°æ¥­å¸¶é ãä¸éè¦ç¹æ®æè½ãæ­¡è¿æ°äººã
èªæ°£ï¼çèª ãç´æ¥ï¼è®çå°çå¥³çè¦ºå¾éæ¯åå¥½æ©æï¼ä¸è¦å¤ªéè±ä¿ã
å¯ä»¥æå°ï¼åºèªä¿éãæ½æå¶åº¦ãç­è¡¨å½æ§ãåºè£¡æ°£æ°å¥½ãå§å¦¹æèª¼ã`,

        call_client: `ä½ æ¯ä¸åéåºæ¥­çæ¥­åï¼å¹«åºè£¡å¯«å³çµ¦èå®¢äººç Call å®¢æå®£ã
ç®çï¼è®èå®¢äººåä¾éçªï¼å¾èµ·ä»åçåæ¶åæ¾æã
èªæ°£ï¼åèæåå¨å³è¨æ¯ï¼è¦ªåãæé»æ©æ²ï¼è®äººçäºå°±æ³åä¾ã
å¯ä»¥æå°ï¼æ°æ´»åãæ°çå°å§ãç¹å¥åªæ ãèå®¢äººå°å±¬å¾éã`,
      };

      const elementsText = input.elements.length > 0
        ? `\n\nä½¿ç¨èç¹å¥è¦æ±åå«ä»¥ä¸åç´ ï¼${input.elements.join("ã")}`
        : "";

      const customText = input.customNote
        ? `\n\nä½¿ç¨èè£åèªªæï¼${input.customNote}`
        : "";

      const systemPrompt = `${typePrompts[input.type]}

éåºè³è¨ï¼${hotelInfo[input.hotel]}

ãéè¦çææ¡é¢¨æ ¼è¦å®ã
1. çµå°ä¸è¦ç¨ emoji ç¶æ¨é¡ææ®µè½éé ­
2. æ®µè½é·ç­è¦å»æåå·®ï¼æçé·æçç­ï¼ä¸è¦æ¯æ®µé½å·®ä¸å¤é·
3. ä¸è¦ç¨éäºè¬ç¨å¡«åè©ï¼ãä¸åå¦æ­¤ããå¼å¾ä¸æçæ¯ããç¸½èè¨ä¹ããæ­¤å¤ããå¦å¤ããåæããæ´éè¦çæ¯ã
4. èªæ°£è¦çµ±ä¸ï¼ä¸è¦ä¸ä¸æ­£å¼ä¸ä¸å£èª
5. çµå°¾ä¸è¦å¤ªå®ç¾æå¤ªåµå¿ï¼è¦èªç¶æ¶å°¾
6. æ´é«èªæ°£è¦ç´æ¥ãæ¥å°æ°£ï¼ç¬¦åå°ç£éåºæ¥­çèªªè©±æ¹å¼
7. ä¸è¦æ AI çæççè·¡ï¼è¦åçäººå¨å¯«
8. å¯ä»¥ç¨ä¸äºå°ç£å£èªï¼ä½ä¸è¦éåº¦
${elementsText}${customText}`;

      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, {
        systemPrompt,
        userPrompt: `è«å¹«æå¯«ä¸ç¯${typeLabels[input.type]}ï¼å¤§ç´ 200-400 å­ãç´æ¥è¼¸åºææ¡å§å®¹ï¼ä¸è¦æä»»ä½åè¨æè§£éã`,
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
