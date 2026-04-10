import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Copy, RefreshCw, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Streamdown } from "streamdown";

type CopyType = "recruitment" | "social" | "event" | "lady_recruitment" | "call_client";
type Hotel = "chinatown" | "dihao" | "both";

const copyTypes = [
  {
    id: "recruitment" as CopyType,
    label: "徵員文案",
    desc: "招募外場、控台、服裝部等職缺",
    color: "#f0c040",
    elements: [
      "高收入機會", "彈性排班", "完整教育訓練", "優質工作環境",
      "專人帶領", "多元職缺", "歡迎無經驗", "正職/兼職均可",
    ],
  },
  {
    id: "social" as CopyType,
    label: "社群貼文",
    desc: "IG / FB 日常經營貼文",
    color: "#c084fc",
    elements: [
      "氛圍感", "神秘感", "夜晚限定", "今晚開番",
      "新活動預告", "店內日常", "小姐出場", "調酒特調",
    ],
  },
  {
    id: "event" as CopyType,
    label: "活動宣傳",
    desc: "主題派對、特殊活動宣傳",
    color: "#38bdf8",
    elements: [
      "電音派對", "試管調酒", "摩天輪調酒", "VIP之夜",
      "節日主題", "免費挑戰", "贈品活動", "限時優惠",
    ],
  },
  {
    id: "lady_recruitment" as CopyType,
    label: "小姐招募",
    desc: "公關小姐招募文案",
    color: "#fb7185",
    elements: [
      "高底薪保障", "抽成制度", "自由排班", "安全環境",
      "歡迎新人", "姐妹情誼", "專業帶領", "不需特殊技能",
    ],
  },
  {
    id: "call_client" as CopyType,
    label: "Call 客文宣",
    desc: "傳給老客人的回店邀約",
    color: "#34d399",
    elements: [
      "新小姐登場", "老客人優惠", "特別活動", "好久不見",
      "今晚有空嗎", "限定優惠", "VIP專屬", "回來開番",
    ],
  },
];

const hotelOptions = [
  { id: "chinatown" as Hotel, label: "中國城經典酒店" },
  { id: "dihao" as Hotel, label: "帝豪酒店" },
  { id: "both" as Hotel, label: "兩間都要" },
];

function GoldButton({
  onClick,
  disabled,
  loading,
  children,
  variant = "primary",
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
      style={
        variant === "primary"
          ? {
              background: disabled || loading
                ? "rgba(201,168,76,0.3)"
                : "linear-gradient(135deg, #c9a84c, #f0c040)",
              color: disabled || loading ? "rgba(0,0,0,0.4)" : "#0a0a1a",
              cursor: disabled || loading ? "not-allowed" : "pointer",
              boxShadow: disabled || loading ? "none" : "0 4px 15px rgba(201,168,76,0.3)",
            }
          : {
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#f0c040",
              cursor: disabled || loading ? "not-allowed" : "pointer",
            }
      }
    >
      {loading && <RefreshCw size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export default function Copywriter() {
  const [selectedType, setSelectedType] = useState<CopyType | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel>("both");
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.copywriter.generate.useMutation({
    onSuccess: (data) => {
      setResult(typeof data.content === 'string' ? data.content : '');
    },
    onError: (err) => {
      toast.error("生成失敗：" + err.message);
    },
  });

  const currentType = copyTypes.find((t) => t.id === selectedType);

  const toggleElement = (el: string) => {
    setSelectedElements((prev) =>
      prev.includes(el) ? prev.filter((e) => e !== el) : [...prev, el]
    );
  };

  const handleGenerate = () => {
    if (!selectedType) {
      toast.error("請先選擇文案類型");
      return;
    }
    setResult("");
    generateMutation.mutate({
      type: selectedType,
      hotel: selectedHotel,
      elements: selectedElements,
      customNote: customNote || undefined,
    });
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      toast.success("已複製到剪貼簿");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="min-h-screen pt-20 pb-16"
      style={{ background: "oklch(0.08 0.01 260)" }}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        {/* 頁面標題 */}
        <div className="pt-8 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{ background: "rgba(240,192,64,0.12)", border: "1px solid rgba(240,192,64,0.25)" }}
            >
              <FileText size={20} style={{ color: "#f0c040" }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>
              文案產生器
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: "rgba(255,255,255,0.45)" }}>
            選擇文案類型，AI 幫你寫出接地氣的酒店業文案
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：設定區 */}
          <div className="space-y-5">
            {/* 文案類型選擇 */}
            <div
              className="p-5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <h2 className="text-sm font-semibold mb-4 tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>
                選擇文案類型
              </h2>
              <div className="space-y-2">
                {copyTypes.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id);
                        setSelectedElements([]);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200"
                      style={{
                        background: isSelected ? `${type.color}12` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? `${type.color}40` : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: isSelected ? type.color : "rgba(255,255,255,0.2)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium"
                          style={{ color: isSelected ? type.color : "rgba(255,255,255,0.8)" }}
                        >
                          {type.label}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {type.desc}
                        </div>
                      </div>
                      {isSelected && <Check size={14} style={{ color: type.color }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 酒店選擇 */}
            <div
              className="p-5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <h2 className="text-sm font-semibold mb-3 tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>
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

            {/* 進階選項 */}
            {currentType && (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(201,168,76,0.15)",
                }}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <span className="text-sm font-semibold tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>
                    進階元素勾選
                    {selectedElements.length > 0 && (
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded text-xs"
                        style={{ background: `${currentType.color}20`, color: currentType.color }}
                      >
                        {selectedElements.length} 個
                      </span>
                    )}
                  </span>
                  {showAdvanced ? (
                    <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
                  )}
                </button>

                {showAdvanced && (
                  <div className="px-5 pb-5">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentType.elements.map((el) => {
                        const isSelected = selectedElements.includes(el);
                        return (
                          <button
                            key={el}
                            onClick={() => toggleElement(el)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            style={{
                              background: isSelected ? `${currentType.color}20` : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isSelected ? `${currentType.color}50` : "rgba(255,255,255,0.1)"}`,
                              color: isSelected ? currentType.color : "rgba(255,255,255,0.55)",
                            }}
                          >
                            {isSelected && "✓ "}
                            {el}
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                        補充說明（選填）
                      </label>
                      <textarea
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="例如：這次活動是週五晚上，主打試管調酒，有特別優惠..."
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none transition-all"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(201,168,76,0.15)",
                          color: "rgba(255,255,255,0.8)",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "rgba(201,168,76,0.4)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "rgba(201,168,76,0.15)";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 生成按鈕 */}
            <GoldButton
              onClick={handleGenerate}
              disabled={!selectedType}
              loading={generateMutation.isPending}
            >
              {generateMutation.isPending ? "生成中..." : "生成文案"}
            </GoldButton>
          </div>

          {/* 右側：輸出區 */}
          <div
            className="rounded-xl flex flex-col"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(201,168,76,0.12)",
              minHeight: "400px",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: "rgba(201,168,76,0.12)" }}
            >
              <span className="text-xs font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                輸出結果
              </span>
              {result && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all"
                    style={{
                      background: "rgba(201,168,76,0.1)",
                      border: "1px solid rgba(201,168,76,0.25)",
                      color: "#f0c040",
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "已複製" : "複製"}
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    <RefreshCw size={12} />
                    重新生成
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-5 overflow-auto scrollbar-gold">
              {generateMutation.isPending ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "rgba(201,168,76,0.5)", borderTopColor: "transparent" }}
                  />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                    AI 正在撰寫文案...
                  </p>
                </div>
              ) : result ? (
                <div
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  <Streamdown>{result}</Streamdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <FileText size={36} style={{ color: "rgba(201,168,76,0.2)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                    選擇文案類型後點擊「生成文案」
                    <br />
                    AI 會幫你寫出接地氣的酒店業文案
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
