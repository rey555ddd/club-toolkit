import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Image,
  Upload,
  RefreshCw,
  Download,
  Sparkles,
  X,
  Check,
  ChevronDown,
  Type,
  Wand2,
  Pencil,
} from "lucide-react";

type Hotel = "chinatown" | "dihao" | "both";
type PosterStyle = "neon_electronic" | "luxury_gold" | "festival_red" | "modern_minimal";
type PersonStyle = "elegant" | "sweet" | "fashionable" | "graceful" | "cool";
type SceneType = "vip_room" | "dance_floor" | "bar_counter" | "red_carpet";

interface PosterText {
  title: string;
  subtitle: string;
  info: string;
  cta: string;
}

const hotelOptions = [
  { id: "chinatown" as Hotel, label: "中國城經典酒店" },
  { id: "dihao" as Hotel, label: "帝豪酒店" },
  { id: "both" as Hotel, label: "兩間聯名" },
];

const posterStyles = [
  {
    id: "neon_electronic" as PosterStyle,
    label: "霓虹電音風",
    desc: "紫藍霓虹、電子音樂感",
    gradient: "linear-gradient(135deg, #1a0533, #0d1b4d)",
    accent: "#c084fc",
  },
  {
    id: "luxury_gold" as PosterStyle,
    label: "輕奢金色風",
    desc: "黑金配色、高端奢華感",
    gradient: "linear-gradient(135deg, #1a1200, #2d2000)",
    accent: "#f0c040",
  },
  {
    id: "festival_red" as PosterStyle,
    label: "節慶紅金風",
    desc: "紅金配色、喜慶熱鬧感",
    gradient: "linear-gradient(135deg, #2d0000, #1a0000)",
    accent: "#fb7185",
  },
  {
    id: "modern_minimal" as PosterStyle,
    label: "現代簡約風",
    desc: "極簡設計、當代質感",
    gradient: "linear-gradient(135deg, #0a0a0a, #1a1a1a)",
    accent: "#94a3b8",
  },
];

const personStyleOptions: { id: PersonStyle; label: string; desc: string }[] = [
  { id: "elegant", label: "優雅", desc: "氣質高雅、成熟知性" },
  { id: "sweet", label: "甜美", desc: "清純可愛、親切討喜" },
  { id: "fashionable", label: "時尚", desc: "潮流前衛、個性十足" },
  { id: "graceful", label: "氣質", desc: "溫婉大方、書卷氣息" },
  { id: "cool", label: "冷豔", desc: "神秘高冷、攝人心魄" },
];

const sceneOptions: { id: SceneType; label: string; desc: string }[] = [
  { id: "vip_room", label: "VIP包廂", desc: "奢華私密包廂空間" },
  { id: "dance_floor", label: "舞池派對", desc: "燈光閃爍的熱鬧舞池" },
  { id: "bar_counter", label: "酒吧吧台", desc: "精緻調酒吧台環境" },
  { id: "red_carpet", label: "紅毯走秀", desc: "星光紅毯貴賓場合" },
];

const themeOptions = [
  "電音派對夜", "試管調酒挑戰", "摩天輪調酒", "VIP 之夜",
  "新人見面會", "週年慶典", "節日主題派對", "限定優惠活動",
];

const featureOptions = [
  "免費挑戰一次", "贈品活動", "特調飲品", "VIP 專屬待遇",
  "新小姐登場", "限時優惠", "老客人回饋", "精彩表演",
];

const effectOptions = [
  "吸引新客人上門", "老客人回流", "提升開番率",
  "增加社群曝光", "小姐曝光度提升", "品牌形象強化",
];

// ─── Canvas text rendering with effects ──────────────────────────────────
function renderTextOnCanvas(
  baseImageUrl: string,
  text: PosterText,
  style: PosterStyle,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Poster at 9:16 ratio, using image natural dimensions
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject("canvas error"); return; }

      ctx.drawImage(img, 0, 0);

      const W = canvas.width;
      const H = canvas.height;

      // Style-specific text configs
      const styleConfigs: Record<PosterStyle, {
        titleColor: string;
        titleShadow: string;
        titleStroke?: string;
        subtitleColor: string;
        infoColor: string;
        ctaGradient?: [string, string];
        ctaBg: string;
        ctaTextColor: string;
        glowColor?: string;
        glowBlur?: number;
      }> = {
        neon_electronic: {
          titleColor: "#e0b0ff",
          titleShadow: "rgba(192, 132, 252, 0.9)",
          subtitleColor: "#c0e8ff",
          infoColor: "rgba(200, 210, 255, 0.85)",
          ctaBg: "rgba(192, 132, 252, 0.25)",
          ctaTextColor: "#e8d0ff",
          glowColor: "rgba(160, 100, 252, 0.8)",
          glowBlur: 25,
        },
        luxury_gold: {
          titleColor: "#ffd700",
          titleShadow: "rgba(180, 140, 20, 0.6)",
          titleStroke: "#8B6914",
          subtitleColor: "#ffe8a0",
          infoColor: "rgba(255, 240, 200, 0.8)",
          ctaBg: "rgba(240, 192, 64, 0.2)",
          ctaTextColor: "#ffd700",
          glowColor: "rgba(255, 200, 50, 0.5)",
          glowBlur: 15,
        },
        festival_red: {
          titleColor: "#ff4060",
          titleShadow: "rgba(200, 50, 50, 0.7)",
          subtitleColor: "#ffd700",
          infoColor: "rgba(255, 220, 180, 0.85)",
          ctaBg: "rgba(255, 64, 96, 0.25)",
          ctaTextColor: "#ffd700",
          glowColor: "rgba(255, 80, 80, 0.6)",
          glowBlur: 18,
        },
        modern_minimal: {
          titleColor: "#ffffff",
          titleShadow: "rgba(0, 0, 0, 0.6)",
          subtitleColor: "rgba(255,255,255,0.8)",
          infoColor: "rgba(255,255,255,0.6)",
          ctaBg: "rgba(255,255,255,0.1)",
          ctaTextColor: "#ffffff",
          glowBlur: 0,
        },
      };

      const cfg = styleConfigs[style];

      // Semi-transparent bottom gradient overlay for text readability
      const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.4, "rgba(0,0,0,0.35)");
      grad.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, H * 0.45, W, H * 0.55);

      // Text layout from bottom up
      ctx.textAlign = "center";

      const titleSize = Math.round(W * 0.078);
      const subtitleSize = Math.round(W * 0.042);
      const infoSize = Math.round(W * 0.032);
      const ctaSize = Math.round(W * 0.034);

      // CTA (bottom-most)
      if (text.cta) {
        const ctaY = H * 0.92;
        ctx.font = `bold ${ctaSize}px "Noto Sans TC", sans-serif`;
        // CTA pill background
        const ctaMetrics = ctx.measureText(text.cta);
        const pillW = ctaMetrics.width + ctaSize * 2.5;
        const pillH = ctaSize * 2.2;
        ctx.fillStyle = cfg.ctaBg;
        ctx.beginPath();
        const pillX = W / 2 - pillW / 2;
        const pillY2 = ctaY - pillH / 2;
        const r = pillH / 2;
        ctx.moveTo(pillX + r, pillY2);
        ctx.lineTo(pillX + pillW - r, pillY2);
        ctx.quadraticCurveTo(pillX + pillW, pillY2, pillX + pillW, pillY2 + r);
        ctx.quadraticCurveTo(pillX + pillW, pillY2 + pillH, pillX + pillW - r, pillY2 + pillH);
        ctx.lineTo(pillX + r, pillY2 + pillH);
        ctx.quadraticCurveTo(pillX, pillY2 + pillH, pillX, pillY2 + r);
        ctx.quadraticCurveTo(pillX, pillY2, pillX + r, pillY2);
        ctx.closePath();
        ctx.fill();
        // Border
        ctx.strokeStyle = cfg.ctaTextColor + "40";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // CTA text
        ctx.fillStyle = cfg.ctaTextColor;
        ctx.fillText(text.cta, W / 2, ctaY + ctaSize * 0.35);
      }

      // Info line
      if (text.info) {
        const infoY = H * 0.845;
        ctx.font = `${infoSize}px "Noto Sans TC", sans-serif`;
        ctx.fillStyle = cfg.infoColor;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText(text.info, W / 2, infoY);
        ctx.shadowBlur = 0;
      }

      // Subtitle
      if (text.subtitle) {
        const subY = H * 0.77;
        ctx.font = `600 ${subtitleSize}px "Noto Sans TC", sans-serif`;
        ctx.fillStyle = cfg.subtitleColor;
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 6;
        ctx.fillText(text.subtitle, W / 2, subY);
        ctx.shadowBlur = 0;
      }

      // Title — the main effect text
      if (text.title) {
        const titleY = H * 0.68;
        ctx.font = `900 ${titleSize}px "Noto Sans TC", sans-serif`;

        // Glow effect
        if (cfg.glowColor && cfg.glowBlur) {
          ctx.shadowColor = cfg.glowColor;
          ctx.shadowBlur = cfg.glowBlur;
          // Draw multiple times for stronger glow
          ctx.fillStyle = cfg.titleColor;
          ctx.fillText(text.title, W / 2, titleY);
          ctx.fillText(text.title, W / 2, titleY);
        }

        // Stroke for depth
        if (cfg.titleStroke) {
          ctx.strokeStyle = cfg.titleStroke;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 0;
          ctx.strokeText(text.title, W / 2, titleY);
        }

        // Final fill
        ctx.shadowColor = cfg.titleShadow;
        ctx.shadowBlur = cfg.glowBlur ? cfg.glowBlur / 2 : 4;
        ctx.fillStyle = cfg.titleColor;
        ctx.fillText(text.title, W / 2, titleY);
        ctx.shadowBlur = 0;

        // Decorative line under title
        const lineW = Math.min(ctx.measureText(text.title).width * 0.6, W * 0.5);
        ctx.strokeStyle = cfg.titleColor + "40";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lineW / 2, titleY + titleSize * 0.5);
        ctx.lineTo(W / 2 + lineW / 2, titleY + titleSize * 0.5);
        ctx.stroke();
      }

      resolve(canvas.toDataURL("image/png", 0.95));
    };
    img.onerror = () => reject("image load error");
    img.src = baseImageUrl;
  });
}

// ─── Custom Select component ──────────────────────────────────────────────
function SelectDropdown<T extends string>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: T | "";
  onChange: (v: T) => void;
  options: { id: T; label: string; desc?: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(192,132,252,0.4)" : "rgba(201,168,76,0.15)"}`,
          color: selected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
        }}
      >
        <span>
          {selected ? (
            <span>
              <span className="font-medium">{selected.label}</span>
              {selected.desc && (
                <span className="ml-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {selected.desc}
                </span>
              )}
            </span>
          ) : (
            placeholder ?? "請選擇..."
          )}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: "rgba(255,255,255,0.4)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden"
          style={{
            background: "rgba(18,14,30,0.98)",
            border: "1px solid rgba(192,132,252,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className="w-full px-3 py-2.5 text-left flex items-center justify-between transition-all"
              style={{
                background: value === opt.id ? "rgba(192,132,252,0.12)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }
              }}
            >
              <span>
                <span
                  className="text-sm font-medium"
                  style={{ color: value === opt.id ? "#c084fc" : "rgba(255,255,255,0.8)" }}
                >
                  {opt.label}
                </span>
                {opt.desc && (
                  <span className="ml-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {opt.desc}
                  </span>
                )}
              </span>
              {value === opt.id && (
                <Check size={13} style={{ color: "#c084fc" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────
export default function Poster() {
  const [selectedHotel, setSelectedHotel] = useState<Hotel>("chinatown");
  const [selectedStyle, setSelectedStyle] = useState<PosterStyle>("neon_electronic");
  const [selectedPersonStyle, setSelectedPersonStyle] = useState<PersonStyle | "">("");
  const [selectedScene, setSelectedScene] = useState<SceneType | "">("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [useUploadedPhoto, setUseUploadedPhoto] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadedPhotoPreview, setUploadedPhotoPreview] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [finalPosterUrl, setFinalPosterUrl] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poster text state
  const [posterText, setPosterText] = useState<PosterText>({
    title: "",
    subtitle: "",
    info: "",
    cta: "",
  });
  const [isTextEditing, setIsTextEditing] = useState(false);

  const uploadMutation = trpc.poster.uploadPhoto.useMutation({
    onSuccess: (data) => {
      setUploadedPhotoUrl(data.base64 ? `data:${data.mimeType};base64,${data.base64}` : null);
      toast.success("照片上傳成功");
    },
    onError: (err) => {
      toast.error("上傳失敗：" + err.message);
    },
  });

  const generateMutation = trpc.poster.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageBase64 ?? null);
      setGenerationCount((c) => c + 1);
      // If text is set, auto-compose
      if (posterText.title || posterText.subtitle) {
        // Will be handled by effect
      }
    },
    onError: (err) => {
      toast.error("生成失敗：" + err.message);
    },
  });

  // AI suggest copy mutation
  const suggestCopyMutation = trpc.poster.suggestCopy.useMutation({
    onSuccess: (data) => {
      setPosterText({
        title: data.title,
        subtitle: data.subtitle,
        info: data.info,
        cta: data.cta,
      });
      toast.success("AI 文案推薦完成！可自由編輯修改");
    },
    onError: (err) => {
      toast.error("文案推薦失敗：" + err.message);
    },
  });

  // Auto-compose text onto image when either changes
  const composePoster = useCallback(async () => {
    if (!generatedImageUrl) return;
    const hasText = posterText.title || posterText.subtitle || posterText.info || posterText.cta;
    if (!hasText) {
      setFinalPosterUrl(generatedImageUrl);
      return;
    }
    try {
      const result = await renderTextOnCanvas(generatedImageUrl, posterText, selectedStyle);
      setFinalPosterUrl(result);
    } catch {
      setFinalPosterUrl(generatedImageUrl);
    }
  }, [generatedImageUrl, posterText, selectedStyle]);

  useEffect(() => {
    composePoster();
  }, [composePoster]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("圖片大小不能超過 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setUploadedPhotoPreview(base64);
      uploadMutation.mutate({
        base64Data: base64,
        mimeType: file.type,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    const theme = customTheme || selectedTheme;
    if (!theme) {
      toast.error("請選擇或填寫活動主題");
      return;
    }

    generateMutation.mutate({
      hotel: selectedHotel,
      style: selectedStyle,
      theme,
      features: selectedFeatures,
      hasUploadedPhoto: useUploadedPhoto && !!uploadedPhotoUrl,
      uploadedPhotoUrl: uploadedPhotoUrl ?? undefined,
      customPrompt: customPrompt || undefined,
      effects: selectedEffects,
      personStyle: selectedPersonStyle || undefined,
      scene: selectedScene || undefined,
      excludeText: true,
    });
  };

  const handleSuggestCopy = () => {
    const theme = customTheme || selectedTheme;
    if (!theme) {
      toast.error("請先選擇活動主題，AI 才能推薦文案");
      return;
    }

    const hotelName = hotelOptions.find((h) => h.id === selectedHotel)?.label ?? "酒店";
    suggestCopyMutation.mutate({
      hotel: selectedHotel,
      hotelName,
      theme,
      features: selectedFeatures,
      style: selectedStyle,
    });
  };

  const handleDownload = () => {
    const url = finalPosterUrl || generatedImageUrl;
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `poster-${Date.now()}.png`;
    link.target = "_blank";
    link.click();
  };

  const toggleFeature = (f: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const toggleEffect = (e: string) => {
    setSelectedEffects((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  const currentStyle = posterStyles.find((s) => s.id === selectedStyle)!;
  const displayImage = finalPosterUrl || generatedImageUrl;

  return (
    <div
      className="min-h-screen pt-20 pb-16"
      style={{ background: "oklch(0.08 0.01 260)" }}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        {/* 頁面標題 */}
        <div className="pt-8 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{ background: "rgba(192,132,252,0.12)", border: "1px solid rgba(192,132,252,0.25)" }}
            >
              <Image size={20} style={{ color: "#c084fc" }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>
              海報美編產生器
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: "rgba(255,255,255,0.45)" }}>
            AI 生成海報底圖 + 自訂特效字，打造高質感宣傳海報
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：設定區 */}
          <div className="space-y-5">
            {/* 酒店選擇 */}
            <div
              className="p-5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                代表酒店
              </h2>
              <div className="flex gap-2 flex-wrap">
                {hotelOptions.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHotel(h.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: selectedHotel === h.id ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedHotel === h.id ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`,
                      color: selectedHotel === h.id ? "#f0c040" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 視覺風格選擇 */}
            <div
              className="p-5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                視覺風格
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {posterStyles.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className="p-3 rounded-lg text-left transition-all"
                      style={{
                        background: isSelected ? `${style.accent}12` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? `${style.accent}40` : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <div
                        className="w-full h-8 rounded mb-2"
                        style={{ background: style.gradient, border: `1px solid ${style.accent}30` }}
                      />
                      <div
                        className="text-xs font-medium"
                        style={{ color: isSelected ? style.accent : "rgba(255,255,255,0.7)" }}
                      >
                        {style.label}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {style.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 活動主題 */}
            <div
              className="p-5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                活動主題
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {themeOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedTheme(t);
                      setCustomTheme("");
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: selectedTheme === t ? "rgba(192,132,252,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedTheme === t ? "rgba(192,132,252,0.4)" : "rgba(255,255,255,0.08)"}`,
                      color: selectedTheme === t ? "#c084fc" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {selectedTheme === t && "✓ "}
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customTheme}
                onChange={(e) => {
                  setCustomTheme(e.target.value);
                  setSelectedTheme("");
                }}
                placeholder="或自行輸入活動主題..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  color: "rgba(255,255,255,0.8)",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(192,132,252,0.4)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(201,168,76,0.15)"; }}
              />
            </div>

            {/* ★ 海報文案（新增） */}
            <div
              className="p-5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${currentStyle.accent}25`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Type size={14} style={{ color: currentStyle.accent }} />
                  <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                    海報文案
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: `${currentStyle.accent}15`, color: currentStyle.accent }}>
                    特效字
                  </span>
                </div>
                <button
                  onClick={handleSuggestCopy}
                  disabled={suggestCopyMutation.isPending || (!selectedTheme && !customTheme)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: suggestCopyMutation.isPending
                      ? "rgba(255,255,255,0.03)"
                      : `${currentStyle.accent}12`,
                    border: `1px solid ${currentStyle.accent}30`,
                    color: currentStyle.accent,
                    opacity: (!selectedTheme && !customTheme) ? 0.4 : 1,
                    cursor: (!selectedTheme && !customTheme) ? "not-allowed" : "pointer",
                  }}
                >
                  {suggestCopyMutation.isPending ? (
                    <><RefreshCw size={12} className="animate-spin" /> 推薦中...</>
                  ) : (
                    <><Wand2 size={12} /> AI 推薦文案</>
                  )}
                </button>
              </div>

              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                輸入文字會以「{currentStyle.label}」特效字渲染在海報上。可先讓 AI 推薦，再自行修改。
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.45)" }}>
                    主標題
                  </label>
                  <input
                    type="text"
                    value={posterText.title}
                    onChange={(e) => setPosterText((p) => ({ ...p, title: e.target.value }))}
                    placeholder="例：電音派對夜"
                    maxLength={15}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${currentStyle.accent}20`,
                      color: "rgba(255,255,255,0.9)",
                      fontWeight: 700,
                    }}
                    onFocus={(e) => { e.target.style.borderColor = `${currentStyle.accent}50`; }}
                    onBlur={(e) => { e.target.style.borderColor = `${currentStyle.accent}20`; }}
                  />
                  <span className="text-[10px] mt-0.5 block" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {posterText.title.length}/15 字
                  </span>
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.45)" }}>
                    副標題
                  </label>
                  <input
                    type="text"
                    value={posterText.subtitle}
                    onChange={(e) => setPosterText((p) => ({ ...p, subtitle: e.target.value }))}
                    placeholder="例：今晚不劉不歸"
                    maxLength={20}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      color: "rgba(255,255,255,0.8)",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = `${currentStyle.accent}40`; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(201,168,76,0.15)"; }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.45)" }}>
                      活動資訊
                    </label>
                    <input
                      type="text"
                      value={posterText.info}
                      onChange={(e) => setPosterText((p) => ({ ...p, info: e.target.value }))}
                      placeholder="日期 / 地點 / 電話"
                      maxLength={30}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(201,168,76,0.15)",
                        color: "rgba(255,255,255,0.8)",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = `${currentStyle.accent}40`; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(201,168,76,0.15)"; }}
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.45)" }}>
                      行動呼粡
                    </label>
                    <input
                      type="text"
                      value={posterText.cta}
                      onChange={(e) => setPosterText((p) => ({ ...p, cta: e.target.value }))}
                      placeholder="例：立即訂位"
                      maxLength={10}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(201,168,76,0.15)",
                        color: "rgba(255,255,255,0.8)",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = `${currentStyle.accent}40`; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(201,168,76,0.15)"; }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 內容特色 + 預期效果 (collapsed) */}
            <details className="group">
              <summary
                className="p-4 rounded-xl cursor-pointer list-none flex items-center justify-between"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
              >
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                  進階設定
                  {(selectedFeatures.length + selectedEffects.length) > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs"
                      style={{ background: "rgba(192,132,252,0.15)", color: "#c084fc" }}>
                      {selectedFeatures.length + selectedEffects.length} 個已選
                    </span>
                  )}
                </span>
                <ChevronDown size={14}
                  className="transition-transform group-open:rotate-180"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
              </summary>
              <div className="mt-3 space-y-4">
                {/* 內容特色 */}
                <div
                  className="p-5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
                >
                  <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                    內容特色
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {featureOptions.map((f) => {
                      const isSelected = selectedFeatures.includes(f);
                      return (
                        <button
                          key={f}
                          onClick={() => toggleFeature(f)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: isSelected ? "rgba(192,132,252,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isSelected ? "rgba(192,132,252,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: isSelected ? "#c084fc" : "rgba(255,255,255,0.55)",
                          }}
                        >
                          {isSelected && "✓ "}
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 預期效果 */}
                <div
                  className="p-5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
                >
                  <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                    預期效果
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {effectOptions.map((ef) => {
                      const isSelected = selectedEffects.includes(ef);
                      return (
                        <button
                          key={ef}
                          onClick={() => toggleEffect(ef)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: isSelected ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isSelected ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: isSelected ? "#34d399" : "rgba(255,255,255,0.55)",
                          }}
                        >
                          {isSelected && "✓ "}
                          {ef}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </details>

            {/* 人物設定 */}
            <div
              className="p-5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                人物設定
              </h2>

              {/* AI 生成 / 上傳照片 切換 */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setUseUploadedPhoto(false)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                  style={{
                    background: !useUploadedPhoto ? "rgba(240,192,64,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${!useUploadedPhoto ? "rgba(240,192,64,0.35)" : "rgba(255,255,255,0.08)"}`,
                    color: !useUploadedPhoto ? "#f0c040" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <Sparkles size={13} />
                  AI 生成人物
                </button>
                <button
                  onClick={() => setUseUploadedPhoto(true)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                  style={{
                    background: useUploadedPhoto ? "rgba(240,192,64,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${useUploadedPhoto ? "rgba(240,192,64,0.35)" : "rgba(255,255,255,0.08)"}`,
                    color: useUploadedPhoto ? "#f0c040" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <Upload size={13} />
                  上傳照片
                </button>
              </div>

              {/* AI 生成模式 */}
              {!useUploadedPhoto && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                      人物氣質
                    </p>
                    <SelectDropdown
                      value={selectedPersonStyle}
                      onChange={(v) => setSelectedPersonStyle(v)}
                      options={personStyleOptions}
                      placeholder="選擇人物氣質（選填）"
                    />
                  </div>
                </div>
              )}

              {/* 上傳照片模式 */}
              {useUploadedPhoto && (
                <div>
                  {uploadedPhotoPreview ? (
                    <div className="relative">
                      <img
                        src={uploadedPhotoPreview}
                        alt="上傳的照片"
                        className="w-full h-40 object-cover rounded-lg"
                        style={{ border: "1px solid rgba(201,168,76,0.2)" }}
                      />
                      <button
                        onClick={() => {
                          setUploadedPhotoPreview(null);
                          setUploadedPhotoUrl(null);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                      >
                        <X size={14} style={{ color: "white" }} />
                      </button>
                      {uploadMutation.isPending && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg"
                          style={{ background: "rgba(0,0,0,0.5)" }}>
                          <RefreshCw size={20} className="animate-spin" style={{ color: "#f0c040" }} />
                        </div>
                      )}
                      {uploadedPhotoUrl && !uploadMutation.isPending && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded text-xs"
                          style={{ background: "rgba(0,0,0,0.7)", color: "#34d399" }}>
                          <Check size={11} />
                          已上傳
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 rounded-lg flex flex-col items-center justify-center gap-2 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "2px dashed rgba(201,168,76,0.25)",
                        color: "rgba(255,255,255,0.4)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.5)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.25)";
                      }}
                    >
                      <Upload size={22} style={{ color: "rgba(201,168,76,0.5)" }} />
                      <span className="text-xs">點擊上傳小姐照片</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                        支援 JPG / PNG，最大 10MB
                      </span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

            {/* 場景 + 補充說明 */}
            <div
              className="p-5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                場景設定
              </h2>
              <SelectDropdown
                value={selectedScene}
                onChange={(v) => setSelectedScene(v)}
                options={sceneOptions}
                placeholder="選擇場景（選填）"
              />
              <div className="mt-4">
                <h2 className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  補充說明（選填）
                </h2>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="例如：要有試管調酒的道具、背景要有摩天輪..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(201,168,76,0.15)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(192,132,252,0.4)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(201,168,76,0.15)"; }}
                />
              </div>
            </div>

            {/* 生成按鈕 */}
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || (!selectedTheme && !customTheme)}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background:
                  generateMutation.isPending || (!selectedTheme && !customTheme)
                    ? "rgba(201,168,76,0.25)"
                    : "linear-gradient(135deg, #c9a84c, #f0c040)",
                color:
                  generateMutation.isPending || (!selectedTheme && !customTheme)
                    ? "rgba(0,0,0,0.4)"
                    : "#0a0a1a",
                cursor:
                  generateMutation.isPending || (!selectedTheme && !customTheme)
                    ? "not-allowed"
                    : "pointer",
                boxShadow:
                  generateMutation.isPending || (!selectedTheme && !customTheme)
                    ? "none"
                    : "0 4px 20px rgba(201,168,76,0.35)",
              }}
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  AI 生成中（約 15-30 秒）...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {generationCount > 0 ? "重新生成海報" : "生成海報"}
                </>
              )}
            </button>
          </div>

          {/* 右側：預覽區 */}
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl overflow-hidden flex-1"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(201,168,76,0.12)",
                minHeight: "500px",
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: "rgba(201,168,76,0.12)" }}
              >
                <span className="text-xs font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                  海報預覽
                  {generationCount > 0 && (
                    <span className="ml-2" style={{ color: "rgba(201,168,76,0.5)" }}>
                      第 {generationCount} 次生成
                    </span>
                  )}
                </span>
                {displayImage && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all"
                    style={{
                      background: "rgba(201,168,76,0.1)",
                      border: "1px solid rgba(201,168,76,0.25)",
                      color: "#f0c040",
                    }}
                  >
                    <Download size={12} />
                    下載
                  </button>
                )}
              </div>

              <div className="p-5 flex items-center justify-center" style={{ minHeight: "450px" }}>
                {generateMutation.isPending ? (
                  <div className="flex flex-col items-center gap-5">
                    <div
                      className="w-16 h-16 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: `${currentStyle.accent}50`, borderTopColor: "transparent" }}
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                        AI 正在創作海報底圖...
                      </p>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                        生成後會自動合成特效字，約需 15-30 秒
                      </p>
                    </div>
                  </div>
                ) : displayImage ? (
                  <div className="w-full flex flex-col items-center gap-4">
                    <img
                      src={displayImage}
                      alt="生成的海報"
                      className="w-full maw-w-xs rounded-xl object-contain"
                      style={{
                        border: "1px solid rgba(201,168,76,0.25)",
                        boxShadow: `0 0 40px ${currentStyle.accent}20`,
                      }}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleGenerate}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        <RefreshCw size={13} />
                        換底圖
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all"
                        style={{
                          background: "rgba(201,168,76,0.12)",
                          border: "1px solid rgba(201,168,76,0.3)",
                          color: "#f0c040",
                        }}
                      >
                        <Download size={13} />
                        下載海報
                      </button>
                    </div>
                    {/* Quick text edit hint */}
                    {!(posterText.title || posterText.subtitle) && (
                      <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                        <Pencil size={11} className="inline mr-1" />
                        左側「海報文案」輸入文字，會自動套用特效字到海報上
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.15)" }}
                    >
                      <Image size={36} style={{ color: "rgba(192,132,252,0.4)" }} />
                    </div>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                      設定活動主題後
                      <br />
                      點擊「生成海報」
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                      AI 生成底圖 + 你打的字 = 完美海報
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 風格說明 */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: `${currentStyle.accent}08`,
                border: `1px solid ${currentStyle.accent}20`,
              }}
            >
              <p className="text-xs" style={{ color: `${currentStyle.accent}` }}>
                目前風格：{currentStyle.label}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                {currentStyle.desc}。文字會自動套用對應風格的特效字渲染。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
