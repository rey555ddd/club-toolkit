import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CalendarDays, Copy, RefreshCw, Check, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Streamdown } from "streamdown";

type Hotel = "chinatown" | "dihao" | "both";

const hotelOptions = [
  { id: "chinatown" as Hotel, label: "中國城經典酒店" },
  { id: "dihao" as Hotel, label: "帝豪酒店" },
  { id: "both" as Hotel, label: "兩間聯合" },
];

const eventTypes = [
  { id: "promotion", label: "促銷活動", desc: "折扣、贈品、限時優惠", color: "#f0c040" },
  { id: "theme_party", label: "主題派對", desc: "電音夜、復古夜、節日派對", color: "#c084fc" },
  { id: "call_back", label: "Call 客活動", desc: "讓老客人回來開番", color: "#34d399" },
  { id: "new_girl", label: "新人見面會", desc: "新小姐上線推廣活動", color: "#fb7185" },
  { id: "holiday", label: "節日企劃", desc: "跨年、情人節、中秋等", color: "#38bdf8" },
  { id: "vip", label: "VIP 之夜", desc: "高端客群專屬活動", color: "#fbbf24" },
  { id: "custom", label: "自訂活動", desc: "自行描述活動類型", color: "#94a3b8" },
];

const durationOptions = ["一天", "三天", "一週", "兩週", "一個月"];
const budgetOptions = ["1 萬以下", "1-3 萬", "3-5 萬", "5-10 萬", "10 萬以上", "不限"];
const audienceOptions = ["老客人", "新客人", "高消費 VIP", "年輕族群", "商務客", "不限"];

export default function Planner() {
  const [selectedHotel, setSelectedHotel] = useState<Hotel>("both");
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [customEventType, setCustomEventType] = useState("");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [specialReq, setSpecialReq] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.planner.generate.useMutation({
    onSuccess: (data) => {
      setResult(typeof data.content === "string" ? data.content : "");
    },
    onError: (err) => {
      toast.error("生成失敗：" + err.message);
    },
  });

  const handleGenerate = () => {
    const eventType =
      selectedEventType === "custom"
        ? customEventType
        : eventTypes.find((e) => e.id === selectedEventType)?.label;

    if (!eventType) {
      toast.error("請選擇活動類型");
      return;
    }

    setResult("");
    generateMutation.mutate({
      hotel: selectedHotel,
      eventType,
      duration: duration || undefined,
      budget: budget || undefined,
      targetAudience: targetAudience || undefined,
      specialRequirements: specialReq || undefined,
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

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `活動企劃-${new Date().toLocaleDateString("zh-TW").replace(/\//g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("已下載企劃檔案");
  };

  const currentEvent = eventTypes.find((e) => e.id === selectedEventType);

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: "oklch(0.08 0.01 260)" }}>
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        {/* 頁面標題 */}
        <div className="pt-10 pb-8 text-center animate-fade-up">
          <p className="font-brand-en text-[10px] sm:text-xs mb-2" style={{ color: "rgba(56,189,248,0.7)" }}>
            Event Planner
          </p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <CalendarDays size={22} style={{ color: "#38bdf8" }} />
            <h1 className="font-display text-3xl sm:text-4xl text-gold-metal">
              活動企劃師
            </h1>
          </div>
          <div className="gold-divider max-w-[64px] mx-auto mb-4" />
          <p className="text-[14px] font-light tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>
            AI 幫你規劃完整的酒店促銷活動，含文案、排程、Call 客策略
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

            {/* 活動類型 */}
            <div
              className="p-5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                活動類型
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {eventTypes.map((et) => {
                  const isSelected = selectedEventType === et.id;
                  return (
                    <button
                      key={et.id}
                      onClick={() => setSelectedEventType(et.id)}
                      className="p-3 rounded-lg text-left transition-all"
                      style={{
                        background: isSelected ? `${et.color}12` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? `${et.color}40` : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <div
                        className="text-xs font-medium"
                        style={{ color: isSelected ? et.color : "rgba(255,255,255,0.7)" }}
                      >
                        {et.label}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {et.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedEventType === "custom" && (
                <input
                  type="text"
                  value={customEventType}
                  onChange={(e) => setCustomEventType(e.target.value)}
                  placeholder="請描述你想辦的活動類型..."
                  className="w-full mt-3 px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(201,168,76,0.15)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(56,189,248,0.4)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(201,168,76,0.15)"; }}
                />
              )}
            </div>

            {/* 進階設定 */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                  進階設定
                </span>
                {showAdvanced ? (
                  <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
                ) : (
                  <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
                )}
              </button>

              {showAdvanced && (
                <div className="px-5 pb-5 space-y-4">
                  {/* 活動期間 */}
                  <div>
                    <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                      活動期間
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {durationOptions.map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(duration === d ? "" : d)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: duration === d ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${duration === d ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: duration === d ? "#38bdf8" : "rgba(255,255,255,0.55)",
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 預算範圍 */}
                  <div>
                    <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                      預算範圍
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {budgetOptions.map((b) => (
                        <button
                          key={b}
                          onClick={() => setBudget(budget === b ? "" : b)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: budget === b ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${budget === b ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: budget === b ? "#38bdf8" : "rgba(255,255,255,0.55)",
                          }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 目標客群 */}
                  <div>
                    <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                      目標客群
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {audienceOptions.map((a) => (
                        <button
                          key={a}
                          onClick={() => setTargetAudience(targetAudience === a ? "" : a)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: targetAudience === a ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${targetAudience === a ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: targetAudience === a ? "#38bdf8" : "rgba(255,255,255,0.55)",
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 特殊需求 */}
                  <div>
                    <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                      特殊需求（選填）
                    </label>
                    <textarea
                      value={specialReq}
                      onChange={(e) => setSpecialReq(e.target.value)}
                      placeholder="例如：這次要配合新小姐上線、有贊助商提供的酒、想做社群互動..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(201,168,76,0.15)",
                        color: "rgba(255,255,255,0.8)",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(56,189,248,0.4)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(201,168,76,0.15)"; }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 生成按鈕 */}
            <button
              onClick={handleGenerate}
              disabled={!selectedEventType || generateMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background:
                  !selectedEventType || generateMutation.isPending
                    ? "rgba(201,168,76,0.25)"
                    : "linear-gradient(135deg, #c9a84c, #f0c040)",
                color:
                  !selectedEventType || generateMutation.isPending
                    ? "rgba(0,0,0,0.4)"
                    : "#0a0a1a",
                cursor:
                  !selectedEventType || generateMutation.isPending
                    ? "not-allowed"
                    : "pointer",
                boxShadow:
                  !selectedEventType || generateMutation.isPending
                    ? "none"
                    : "0 4px 20px rgba(201,168,76,0.35)",
              }}
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  AI 企劃中...
                </>
              ) : (
                <>
                  <CalendarDays size={16} />
                  生成活動企劃
                </>
              )}
            </button>
          </div>

          {/* 右側：輸出區 */}
          <div
            className="rounded-xl flex flex-col"
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
                企劃輸出
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
                    {copied ? "已複製" : "複製全文"}
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all"
                    style={{
                      background: "rgba(56,189,248,0.1)",
                      border: "1px solid rgba(56,189,248,0.25)",
                      color: "#38bdf8",
                    }}
                  >
                    <Download size={12} />
                    下載 .md
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
                    style={{ borderColor: "rgba(56,189,248,0.5)", borderTopColor: "transparent" }}
                  />
                  <div className="text-center">
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                      AI 正在規劃活動企劃...
                    </p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                      含文案、排程、Call 客策略
                    </p>
                  </div>
                </div>
              ) : result ? (
                <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                  <Streamdown>{result}</Streamdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <CalendarDays size={36} style={{ color: "rgba(56,189,248,0.2)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                    選擇活動類型後點擊「生成活動企劃」
                    <br />
                    AI 會幫你規劃完整的活動方案
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
