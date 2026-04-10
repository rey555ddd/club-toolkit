import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function getClient() {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY 環境變數未設定");
  }
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * 使用 Gemini gemini-2.5-flash 生成文字內容
 */
export async function geminiGenerateText({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  const response = result.response;
  return response.text();
}

/**
 * 使用 Imagen 4 生成圖片（主要方式）
 * 若失敗則 fallback 至 gemini-2.5-flash-preview-image-generation
 * 若兩者皆失敗則回傳 null
 */
export async function geminiGenerateImage(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY 環境變數未設定");
  }

  // 嘗試 Imagen 4（主要方式）
  console.log("[Image] 嘗試 Imagen 4...");
  const imagen4Result = await tryImagen4(prompt);
  if (imagen4Result) {
    console.log("[Image] Imagen 4 成功");
    return imagen4Result;
  }

  // Fallback 1: 使用 gemini-2.5-flash-preview-image-generation（支援 responseModalities）
  console.log("[Image] Imagen 4 失敗，改用 gemini-2.5-flash-preview-image-generation fallback");
  const geminiImageResult = await tryGeminiImageModel(prompt);
  if (geminiImageResult) {
    console.log("[Image] gemini-2.5-flash-preview-image-generation 成功");
    return geminiImageResult;
  }

  // Fallback 2: 嘗試 gemini-2.0-flash-exp-image-generation
  console.log("[Image] 嘗試 gemini-2.0-flash-exp-image-generation fallback...");
  const gemini20Result = await tryGemini20ImageModel(prompt);
  if (gemini20Result) {
    console.log("[Image] gemini-2.0-flash-exp-image-generation 成功");
    return gemini20Result;
  }

  console.error("[Image] 所有圖片生成方式均失敗");
  return null;
}

async function tryImagen4(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`,
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

async function tryGeminiImageModel(prompt: string): Promise<string | null> {
  try {
    const client = getClient();
    // 使用 responseModalities 明確要求圖片輸出
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash-preview-image-generation",
      generationConfig: {
        // @ts-expect-error - responseModalities 是實驗性 API，型別定義尚未更新
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

async function tryGemini20ImageModel(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
