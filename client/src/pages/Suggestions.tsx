import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquarePlus, Send, Clock, Tag, User } from "lucide-react";

const categories = [
  { id: "feature" as const, label: "功能建議", color: "#38bdf8" },
  { id: "bug" as const, label: "問題回報", color: "#fb7185" },
  { id: "design" as const, label: "設計建議", color: "#c084fc" },
  { id: "content" as const, label: "內容建議", color: "#34d399" },
  { id: "other" as const, label: "其他", color: "#94a3b8" },
];

function getCategoryInfo(id: string) {
  return categories.find((c) => c.id === id) || categories[4];
}

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "剛剛";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
  return d.toLocaleDateString("zh-TW");
}

export default function Suggestions() {
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState<"feature" | "bug" | "design" | "content" | "other">("feature");
  const [content, setContent] = useState("");

  const utils = trpc.useUtils();
  const { data: suggestionList, isLoading } = trpc.suggestions.list.useQuery();

  const createMutation = trpc.suggestions.create.useMutation({
    onSuccess: () => {
      toast.success("感謝你的建議！我們會認真看");
      setContent("");
      utils.suggestions.list.invalidate();
    },
    onError: (err) => {
      toast.error("送出失敗：" + err.message);
    },
  });

  const handleSubmit = () => {
    if (!nickname.trim()) {
      toast.error("請輸入暱稱");
      return;
    }
    if (!content.trim()) {
      toast.error("請輸入建議內容");
      return;
    }
    createMutation.mutate({
      nickname: nickname.trim(),
      category,
      content: content.trim(),
    });
  };

  return (
    <div
      className="min-h-screen pt-20 pb-16"
      style={{ background: "oklch(0.08 0.01 260)" }}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        {/* 頁面標題 */}
        <div className="pt-10 pb-8 text-center animate-fade-up">
          <p className="font-brand-en text-[10px] sm:text-xs mb-2" style={{ color: "rgba(56,189,248,0.7)" }}>
            Feedback
          </p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <MessageSquarePlus size={22} style={{ color: "#38bdf8" }} />
            <h1 className="font-display text-3xl sm:text-4xl text-gold-metal">
              修改建議區
            </h1>
          </div>
          <div className="gold-divider max-w-[64px] mx-auto mb-4" />
          <p className="text-[14px] font-light tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>
            有什麼想法或建議？歡迎留言，我們會持續改進
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左側：留言表單 */}
          <div className="lg:col-span-2 space-y-5">
            <div
              className="p-5 rounded-xl space-y-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(56,189,248,0.2)",
              }}
            >
              <h2 className="text-sm font-semibold tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>
                留下你的建議
              </h2>

              {/* 暱稱 */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  暱稱
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="怎麼稱呼你"
                  maxLength={100}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(56,189,248,0.15)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(56,189,248,0.4)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(56,189,248,0.15)"; }}
                />
              </div>

              {/* 類別 */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  建議類別
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: isSelected ? `${cat.color}18` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isSelected ? `${cat.color}50` : "rgba(255,255,255,0.08)"}`,
                          color: isSelected ? cat.color : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 內容 */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  建議內容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="寫下你的想法或建議..."
                  rows={5}
                  maxLength={2000}
                  className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(56,189,248,0.15)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(56,189,248,0.4)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(56,189,248,0.15)"; }}
                />
                <div className="text-right mt-1">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {content.length}/2000
                  </span>
                </div>
              </div>

              {/* 送出按鈕 */}
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || !nickname.trim() || !content.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background:
                    createMutation.isPending || !nickname.trim() || !content.trim()
                      ? "rgba(56,189,248,0.15)"
                      : "linear-gradient(135deg, #0ea5e9, #38bdf8)",
                  color:
                    createMutation.isPending || !nickname.trim() || !content.trim()
                      ? "rgba(255,255,255,0.3)"
                      : "#fff",
                  cursor:
                    createMutation.isPending || !nickname.trim() || !content.trim()
                      ? "not-allowed"
                      : "pointer",
                  boxShadow:
                    createMutation.isPending || !nickname.trim() || !content.trim()
                      ? "none"
                      : "0 4px 15px rgba(56,189,248,0.3)",
                }}
              >
                <Send size={14} />
                {createMutation.isPending ? "送出中..." : "送出建議"}
              </button>
            </div>
          </div>

          {/* 右側：留言列表 */}
          <div className="lg:col-span-3">
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(56,189,248,0.12)",
              }}
            >
              <div
                className="px-5 py-3 border-b flex items-center justify-between"
                style={{ borderColor: "rgba(56,189,248,0.12)" }}
              >
                <span className="text-xs font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                  所有建議
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {suggestionList?.length ?? 0} 則
                </span>
              </div>

              <div className="max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(56,189,248,0.2) transparent" }}>
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: "rgba(56,189,248,0.4)", borderTopColor: "transparent" }}
                    />
                  </div>
                ) : !suggestionList || suggestionList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <MessageSquarePlus size={36} style={{ color: "rgba(56,189,248,0.2)" }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                      還沒有人留言，成為第一個吧
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {suggestionList.map((item) => {
                      const cat = getCategoryInfo(item.category);
                      return (
                        <div key={item.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
                            >
                              <User size={14} style={{ color: cat.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                                  {item.nickname}
                                </span>
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs"
                                  style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}
                                >
                                  <Tag size={9} className="inline mr-1" style={{ verticalAlign: "middle" }} />
                                  {cat.label}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap" }}>
                                {item.content}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <Clock size={11} style={{ color: "rgba(255,255,255,0.2)" }} />
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                                  {timeAgo(item.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
