import { useState, useRef } from "react";
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
} from "lucide-react";

type Hotel = "chinatown" | "dihao" | "both";
type PosterStyle = "neon_electronic" | "luxury_gold" | "festival_red" | "modern_minimal";
type PersonStyle = "elegant" | "sweet" | "fashionable" | "graceful" | "cool";
type SceneType = "vip_room" | "dance_floor" | "bar_counter" | "red_carpet";

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

// 自訂 Select 元件
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
  const [generationCount, setGenerationCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.poster.uploadPhoto.useMutation({
    onSuccess: (data) => {
      setUploadedPhotoUrl(data.url);
      toast.success("照片上傳成功");
    },
    onError: (err) => {
      toast.error("上傳失敗：" + err.message);
    },
  });

  const generateMutation = trpc.poster.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl ?? null);
      setGenerationCount((c) => c + 1);
    },
    onError: (err) => {
      toast.error("生成失敗：" + err.message);
    },
  });

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
    });
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement("a");
    link.href = generatedImageUrl;
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
            上傳照片或 AI 生成人物，快速產出高質感宣傳海報
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

            {/* 內容特色 */}
            <div
              className="p-5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                內容特色
                {selectedFeatures.length > 0 && (
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded text-xs"
                    style={{ background: "rgba(192,132,252,0.15)", color: "#c084fc" }}
                  >
                    {selectedFeatures.length} 個
                  </span>
                )}
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
                {selectedEffects.length > 0 && (
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded text-xs"
                    style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
                  >
                    {selectedEffects.length} 個
                  </span>
                )}
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

              {/* AI 生成模式：人物氣質選擇 */}
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

            {/* 場景選擇 */}
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
            </div>

            {/* 補充說明 */}
            <div
              className="p-5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <h2 className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                補充說明（選填）
              </h2>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="例如：要有試管調酒的道具、背景要有摩天輪、文字要有電話號碼..."
                rows={3}
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
                {generatedImageUrl && (
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
                        AI 正在創作海報...
                      </p>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                        這需要約 15-30 秒，請稍候
                      </p>
                    </div>
                  </div>
                ) : generatedImageUrl ? (
                  <div className="w-full flex flex-col items-center gap-4">
                    <img
                      src={generatedImageUrl}
                      alt="生成的海報"
                      className="w-full max-w-xs rounded-xl object-contain"
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
                        再生成一張
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
                      支援多次重新生成，直到滿意為止
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
                {currentStyle.desc}。每次生成結果都不同，可多次嘗試找到最滿意的版本。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
