import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  UserPlus,
  FileText,
  Users,
  RefreshCw,
  Copy,
  Check,
  Shield,
  EyeOff,
  Wallet,
  Clock,
  Gift,
  HandHeart,
  Heart,
  MessageCircle,
  X,
  Upload,
  Trash2,
  FileUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { getTextSamples, getImageRefs, getLibrarySummary, loadLibrary as _loadLibrary } from "@/lib/library";
import type { FileCategory, LibraryItem } from "@/lib/library";

type Tab = "copy" | "referral" | "library";
type Channel = "dcard" | "ig_story" | "ig_post" | "threads" | "line_group";
type Position = "hostess" | "foh" | "control" | "wardrobe";
type PainPoint = "secret" | "no_photo" | "base_salary" | "flexible" | "referral" | "safe" | "sister";
type Hotel = "chinatown" | "dihao" | "both";

const channelOptions: { id: Channel; label: string; desc: string }[] = [
  { id: "dcard", label: "Dcard 徵才", desc: "學姊爆料口吻、300-500 字" },
  { id: "threads", label: "Threads 短文", desc: "隨性敢講、150-300 字" },
  { id: "ig_post", label: "IG 貼文", desc: "生活感、80-150 字" },
  { id: "ig_story", label: "IG 限動", desc: "極短一句話、20-40 字" },
  { id: "line_group", label: "LINE 群分享", desc: "傳給現職小姐轉發、100-200 字" },
];

const positionOptions: { id: Position; label: string; desc: string }[] = [
  { id: "hostess", label: "公關小姐", desc: "包廂公關" },
  { id: "foh", label: "外場服務", desc: "不用坐檯" },
  { id: "control", label: "控台", desc: "燈光音響" },
  { id: "wardrobe", label: "服裝部", desc: "服裝整理" },
];

const painOptions: { id: PainPoint; label: string; icon: typeof Shield; desc: string; defaultOn: boolean }[] = [
  { id: "secret", label: "絕對保密", icon: Shield, desc: "家人朋友不會知道", defaultOn: true },
  { id: "no_photo", label: "零曝光", icon: EyeOff, desc: "不拍照上網", defaultOn: true },
  { id: "base_salary", label: "試坐底薪", icon: Wallet, desc: "新人保障", defaultOn: true },
  { id: "flexible", label: "彈性排班", icon: Clock, desc: "想上就上", defaultOn: true },
  { id: "referral", label: "介紹獎金", icon: Gift, desc: "朋友一起來有紅利", defaultOn: true },
  { id: "safe", label: "安全環境", icon: HandHeart, desc: "幹部駐場保護", defaultOn: false },
  { id: "sister", label: "姐妹帶領", icon: Heart, desc: "資深姐姐罩妳", defaultOn: false },
];

const hotelOptions: { id: Hotel; label: string }[] = [
  { id: "both", label: "兩間聯名" },
  { id: "chinatown", label: "中國城" },
  { id: "dihao", label: "帝豪" },
];

export default function Recruit() {
  const [tab, setTab] = useState<Tab>("copy");

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: "oklch(0.08 0.01 260)" }}>
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div className="pt-10 pb-6 text-center animate-fade-up">
          <p className="font-brand-en text-[10px] sm:text-xs mb-2" style={{ color: "rgba(34,197,94,0.75)" }}>
            Recruit Assistant
          </p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <UserPlus size={22} style={{ color: "#22c55e" }} />
            <h1 className="font-display text-3xl sm:text-4xl text-gold-metal">徵才助手</h1>
          </div>
          <div className="gold-divider max-w-[64px] mx-auto mb-4" />
          <p className="text-[14px] font-light tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>
            兩大增員武器 — 痛點反轉文案 · 介紹制計算
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {[
            { id: "copy" as Tab, label: "徵才文案", icon: FileText, color: "#f0c040" },
            { id: "referral" as Tab, label: "介紹制計算", icon: Users, color: "#22c55e" },
            { id: "library" as Tab, label: "檔案上傳區", icon: Upload, color: "#38bdf8" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: tab === t.id ? `${t.color}18` : "rgba(255,255,255,0.03)",
                border: `1px solid ${tab === t.id ? t.color + "55" : "rgba(255,255,255,0.08)"}`,
                color: tab === t.id ? t.color : "rgba(255,255,255,0.55)",
              }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "copy" && <CopyTab />}
        {tab === "referral" && <ReferralTab />}
        {tab === "library" && <LibraryTab />}
      </div>

      <RecruitChatAssistant />
    </div>
  );
}

// ────────────────────────────────────────────────────
// 浮動徵才助手對話框
// ────────────────────────────────────────────────────
function RecruitChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const chatMut = trpc.recruit.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: typeof data.content === "string" ? data.content : "" }]);
    },
    onError: (err) => {
      toast.error("助手回覆失敗：" + err.message);
    },
  });

  const handleSend = (content: string) => {
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    const summary = getLibrarySummary();
    chatMut.mutate({
      messages: next,
      librarySummary: {
        posters: summary.posters,
        hostessPhotos: summary.hostessPhotos,
        planners: summary.planners,
        copySamples: summary.copySamples,
      },
    });
  };

  const suggested = [
    "公司現在缺三位美眉，需要什麼樣年紀的人？",
    "我應該怎麼樣招募？給我一些招募建議",
    "建議我用哪一個功能？",
    "介紹獎金給多少才合理？",
    "Dcard 要怎麼發才不會被檢舉？",
  ];

  return (
    <>
      {/* 浮動按鈕 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            boxShadow: "0 8px 32px rgba(34,197,94,0.4)",
          }}
        >
          <MessageCircle size={18} />
          <span className="text-sm font-semibold">徵才助手</span>
        </button>
      )}

      {/* 聊天面板 */}
      {open && (
        <div
          className="fixed z-50 flex flex-col rounded-2xl overflow-hidden animate-fade-up"
          style={{
            bottom: "1.5rem",
            right: "1.5rem",
            width: "min(420px, calc(100vw - 3rem))",
            maxHeight: "min(680px, calc(100vh - 3rem))",
            background: "oklch(0.10 0.015 260)",
            border: "1px solid rgba(34,197,94,0.35)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.15)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.08)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.2)" }}>
                <MessageCircle size={16} style={{ color: "#22c55e" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#86efac" }}>徵才助手</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>跟我討論你的增員需求</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg transition-all hover:bg-white/10" style={{ color: "rgba(255,255,255,0.6)" }}>
              <X size={16} />
            </button>
          </div>

          <AIChatBox
            messages={messages}
            onSendMessage={handleSend}
            isLoading={chatMut.isPending}
            placeholder="輸入你的增員問題..."
            height="min(600px, calc(100vh - 9rem))"
            emptyStateMessage="哈囉老闆，有什麼增員問題想討論？"
            suggestedPrompts={suggested}
            className="flex-1 border-0 rounded-none"
          />
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────
// Tab 1: 徵才文案
// ────────────────────────────────────────────────────
function CopyTab() {
  const [channel, setChannel] = useState<Channel>("dcard");
  const [position, setPosition] = useState<Position>("hostess");
  const [hotel, setHotel] = useState<Hotel>("both");
  const [pains, setPains] = useState<Set<PainPoint>>(
    new Set(painOptions.filter((p) => p.defaultOn).map((p) => p.id))
  );
  const [customNote, setCustomNote] = useState("");
  const [refineInstruction, setRefineInstruction] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const mut = trpc.recruit.generateCopy.useMutation({
    onSuccess: (data) => setResult(typeof data.content === "string" ? data.content : ""),
    onError: (e) => toast.error("生成失敗：" + e.message),
  });

  const toggle = (id: PainPoint) => {
    const next = new Set(pains);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPains(next);
  };

  const handleGen = (extra?: string, prev?: string) => {
    const note = [customNote, extra, prev ? `基於以下原稿微調（保留方向）：\n${prev}` : ""]
      .filter((s) => s && s.trim())
      .join("\n\n");
    setResult("");
    mut.mutate({
      channel,
      position,
      painPoints: Array.from(pains),
      hotel,
      customNote: note || undefined,
      librarySamples: getTextSamples("copy_sample", 3),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* 左：設定 */}
      <div className="lg:col-span-2 space-y-5">
        <Section title="通路" subtitle="不同通路語氣／長度會自動適配">
          <div className="grid grid-cols-1 gap-2">
            {channelOptions.map((c) => (
              <Choice
                key={c.id}
                active={channel === c.id}
                onClick={() => setChannel(c.id)}
                title={c.label}
                desc={c.desc}
                color="#f0c040"
              />
            ))}
          </div>
        </Section>

        <Section title="職位">
          <div className="grid grid-cols-2 gap-2">
            {positionOptions.map((p) => (
              <Choice
                key={p.id}
                active={position === p.id}
                onClick={() => setPosition(p.id)}
                title={p.label}
                desc={p.desc}
                color="#f0c040"
              />
            ))}
          </div>
        </Section>

        <Section title="痛點反轉" subtitle="幫求職者預先解除疑慮，文案會自動帶入">
          <div className="grid grid-cols-2 gap-2">
            {painOptions.map((p) => {
              const on = pains.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="flex items-start gap-2 p-3 rounded-lg text-left transition-all"
                  style={{
                    background: on ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${on ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <p.icon size={14} className="mt-0.5" style={{ color: on ? "#22c55e" : "rgba(255,255,255,0.4)" }} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: on ? "#86efac" : "rgba(255,255,255,0.7)" }}>{p.label}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{p.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="酒店">
          <div className="flex gap-2">
            {hotelOptions.map((h) => (
              <button
                key={h.id}
                onClick={() => setHotel(h.id)}
                className="flex-1 py-2 rounded-lg text-xs transition-all"
                style={{
                  background: hotel === h.id ? "rgba(240,192,64,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${hotel === h.id ? "rgba(240,192,64,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: hotel === h.id ? "#f0c040" : "rgba(255,255,255,0.6)",
                }}
              >
                {h.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="補充說明（選填）">
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="例如：強調試坐保證 1500 / 急徵週末班 / 想寫成姐姐找朋友的口吻"
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)", color: "rgba(255,255,255,0.8)" }}
          />
        </Section>

        <button
          onClick={() => handleGen()}
          disabled={mut.isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
        >
          {mut.isPending ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
          {mut.isPending ? "生成中..." : "生成徵才文案"}
        </button>
      </div>

      {/* 右：輸出 */}
      <div className="lg:col-span-3 rounded-xl overflow-hidden flex flex-col" style={{ background: "oklch(0.10 0.015 260)", border: "1px solid rgba(34,197,94,0.15)", minHeight: "500px" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(34,197,94,0.12)" }}>
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>徵才文案輸出</span>
          {result && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(result);
                setCopied(true);
                toast.success("已複製");
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac" }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "已複製" : "複製"}
            </button>
          )}
        </div>
        <div className="flex-1 p-5 overflow-auto">
          {mut.isPending ? (
            <LoadingState text="AI 正在寫徵才文案..." />
          ) : result ? (
            <div className="space-y-4">
              <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                <Streamdown>{result}</Streamdown>
              </div>
              <RefinementBox
                value={refineInstruction}
                onChange={setRefineInstruction}
                onApply={() => {
                  if (!refineInstruction.trim()) return toast.error("請先輸入修改指令");
                  handleGen(refineInstruction, result);
                }}
                onRegen={() => { setRefineInstruction(""); handleGen(); }}
                isPending={mut.isPending}
                color="#22c55e"
                placeholder="例：語氣更狠一點 / 開頭加數字 / 縮短一半"
              />
            </div>
          ) : (
            <EmptyState icon={FileText} text="設定好左側條件，點生成徵才文案" color="rgba(34,197,94,0.2)" />
          )}
        </div>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────
// Tab 3: 介紹制計算
// ────────────────────────────────────────────────────
function ReferralTab() {
  const [currentCount, setCurrentCount] = useState(15);
  const [targetCount, setTargetCount] = useState(5);
  const [bonus, setBonus] = useState(15000);
  const [customNote, setCustomNote] = useState("");
  const [refineInstruction, setRefineInstruction] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const mut = trpc.recruit.generateReferralMessage.useMutation({
    onSuccess: (data) => setResult(typeof data.content === "string" ? data.content : ""),
    onError: (e) => toast.error("生成失敗：" + e.message),
  });

  const totalBudget = targetCount * bonus;
  const avgReferralPerSister = targetCount / Math.max(1, currentCount);
  const pctConversion = (avgReferralPerSister * 100).toFixed(1);

  const handleGen = (extra?: string, prev?: string) => {
    const note = [customNote, extra, prev ? `基於以下原訊息修改：\n${prev}` : ""].filter((s) => s && s.trim()).join("\n\n");
    setResult("");
    mut.mutate({ currentCount, targetCount, bonusPerHead: bonus, customNote: note || undefined });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <Section title="現職人數">
          <NumberInput value={currentCount} onChange={setCurrentCount} min={1} max={200} suffix="人" />
        </Section>
        <Section title="本月目標補新人">
          <NumberInput value={targetCount} onChange={setTargetCount} min={1} max={50} suffix="人" />
        </Section>
        <Section title="每人介紹獎金" subtitle="介紹 1 人坐滿 30 節的獎金">
          <NumberInput value={bonus} onChange={setBonus} min={1000} max={50000} step={1000} prefix="$" />
        </Section>

        <Section title="補充說明（選填）">
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="例：強調本月急徵 / 想要姐姐口吻 / 帶一點趕快衝刺感"
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(34,197,94,0.2)", color: "rgba(255,255,255,0.85)" }}
          />
        </Section>

        <button
          onClick={() => handleGen()}
          disabled={mut.isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
        >
          {mut.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Users size={14} />}
          {mut.isPending ? "生成中..." : "生成群組激勵訊息"}
        </button>
      </div>

      <div className="lg:col-span-3 space-y-5">
        {/* 計算結果卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <Metric label="預估總預算" value={`$${totalBudget.toLocaleString()}`} color="#f0c040" />
          <Metric label="人均分攤" value={`${pctConversion}%`} subtitle="現職介紹率" color="#22c55e" />
          <Metric label="單人獎金" value={`$${bonus.toLocaleString()}`} subtitle="坐滿 30 節" color="#c084fc" />
        </div>

        <div className="p-5 rounded-xl" style={{ background: "oklch(0.10 0.015 260)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#86efac" }}>
            <Gift size={14} /> 建議方案
          </h4>
          <ul className="text-[13px] space-y-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            <li>• 介紹 1 位新人進來 <strong style={{ color: "#86efac" }}>坐滿 30 節（約 3-4 週）</strong>，介紹人一次領 <strong style={{ color: "#f0c040" }}>${bonus.toLocaleString()}</strong></li>
            <li>• 本月需讓 <strong style={{ color: "#86efac" }}>{currentCount} 位現職 / {targetCount} 人目標</strong> = 約 {Math.ceil((targetCount / currentCount) * 100) / 100} 位現職平均負責 1 位</li>
            <li>• 可在群組每週公告進度 / 加碼本月前 3 名介紹者再領額外 5,000</li>
            <li>• 文案中強調『自己的朋友妳最放心，一起上班有伴』</li>
          </ul>
        </div>

        <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: "oklch(0.10 0.015 260)", border: "1px solid rgba(34,197,94,0.15)", minHeight: "280px" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(34,197,94,0.12)" }}>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>群組激勵訊息</span>
            {result && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  setCopied(true);
                  toast.success("已複製");
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac" }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "已複製" : "複製"}
              </button>
            )}
          </div>
          <div className="flex-1 p-5 overflow-auto">
            {mut.isPending ? (
              <LoadingState text="AI 正在寫激勵訊息..." />
            ) : result ? (
              <div className="space-y-4">
                <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                  <Streamdown>{result}</Streamdown>
                </div>
                <RefinementBox
                  value={refineInstruction}
                  onChange={setRefineInstruction}
                  onApply={() => {
                    if (!refineInstruction.trim()) return toast.error("請先輸入修改指令");
                    handleGen(refineInstruction, result);
                  }}
                  onRegen={() => { setRefineInstruction(""); handleGen(); }}
                  isPending={mut.isPending}
                  color="#22c55e"
                  placeholder="例：口吻親切一點 / 加一句大家辛苦了 / 縮短"
                />
              </div>
            ) : (
              <EmptyState icon={Users} text="調整人數與獎金後，點上方『生成群組激勵訊息』" color="rgba(34,197,94,0.2)" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────
// Shared small components
// ────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <h3 className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.8)" }}>{title}</h3>
      {subtitle && <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}

function Choice({ active, onClick, title, desc, color }: { active: boolean; onClick: () => void; title: string; desc: string; color: string }) {
  return (
    <button
      onClick={onClick}
      className="text-left px-3 py-2.5 rounded-lg transition-all"
      style={{
        background: active ? `${color}15` : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? color + "55" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div className="text-sm font-medium" style={{ color: active ? color : "rgba(255,255,255,0.75)" }}>{title}</div>
      <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</div>
    </button>
  );
}

function NumberInput({ value, onChange, min, max, step = 1, prefix, suffix }: { value: number; onChange: (n: number) => void; min: number; max: number; step?: number; prefix?: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, value - step))} className="w-9 h-9 rounded-lg text-sm font-bold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>−</button>
      <div className="flex-1 text-center px-3 py-2 rounded-lg" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="font-num font-bold text-base" style={{ color: "#f0c040" }}>{prefix}{value.toLocaleString()}{suffix && ` ${suffix}`}</span>
      </div>
      <button onClick={() => onChange(Math.min(max, value + step))} className="w-9 h-9 rounded-lg text-sm font-bold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>+</button>
    </div>
  );
}

function Metric({ label, value, subtitle, color }: { label: string; value: string; subtitle?: string; color: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: "oklch(0.10 0.015 260)", border: `1px solid ${color}30` }}>
      <p className="text-[10px] tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
      <p className="font-num font-bold text-xl" style={{ color }}>{value}</p>
      {subtitle && <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{subtitle}</p>}
    </div>
  );
}

function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(34,197,94,0.5)", borderTopColor: "transparent" }} />
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{text}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text, color }: { icon: typeof FileText; text: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
      <Icon size={36} style={{ color }} />
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>{text}</p>
    </div>
  );
}

function RefinementBox({ value, onChange, onApply, onRegen, isPending, color, placeholder }: { value: string; onChange: (v: string) => void; onApply: () => void; onRegen: () => void; isPending: boolean; color: string; placeholder: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <label className="text-xs block mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>✏️ 修改指令</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={onApply}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs disabled:opacity-50"
          style={{ background: `${color}25`, border: `1px solid ${color}55`, color }}
        >
          <RefreshCw size={12} /> 套用指令再生成
        </button>
        <button
          onClick={onRegen}
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
        >
          完全重新生成
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────
// Tab 3: 檔案上傳區（素材庫）
// ────────────────────────────────────────────────────
const CATEGORIES: { id: FileCategory; label: string; desc: string; kind: "image" | "text"; color: string }[] = [
  { id: "poster", label: "過去的海報", desc: "上傳過去做過的活動／徵才海報，當風格參考", kind: "image", color: "#c084fc" },
  { id: "hostess_photo", label: "小姐照片", desc: "員工形象照，未來生成人物時可參考", kind: "image", color: "#ec4899" },
  { id: "planner", label: "活動企劃", desc: "過去寫過的活動企劃書，AI 可學你的風格與 SOP", kind: "text", color: "#38bdf8" },
  { id: "copy_sample", label: "文案範本", desc: "過去有效的文案，AI 模仿語氣與套路", kind: "text", color: "#f0c040" },
];

function loadLibrary(): LibraryItem[] { return _loadLibrary(); }

function saveLibrary(items: LibraryItem[]) {
  try {
    localStorage.setItem("club-toolkit-library", JSON.stringify(items));
  } catch (e) {
    toast.error("儲存失敗（可能超出瀏覽器容量限制）：" + (e instanceof Error ? e.message : ""));
  }
}

function LibraryTab() {
  const [category, setCategory] = useState<FileCategory>("poster");
  const [items, setItems] = useState<LibraryItem[]>(() => loadLibrary());
  const [textInput, setTextInput] = useState("");
  const [textName, setTextName] = useState("");

  const activeCat = CATEGORIES.find((c) => c.id === category)!;
  const filteredItems = items.filter((i) => i.category === category);

  const persist = (next: LibraryItem[]) => {
    setItems(next);
    saveLibrary(next);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newOnes: LibraryItem[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`${file.name} 超過 3MB，請壓縮後再上傳`);
        continue;
      }
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject();
        reader.readAsDataURL(file);
      });
      newOnes.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        category,
        name: file.name,
        kind: "image",
        data,
        size: file.size,
        createdAt: Date.now(),
      });
    }
    if (newOnes.length > 0) {
      persist([...items, ...newOnes]);
      toast.success(`已上傳 ${newOnes.length} 個檔案`);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return toast.error("請先輸入內容");
    const item: LibraryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category,
      name: textName.trim() || `${activeCat.label} ${new Date().toLocaleDateString()}`,
      kind: "text",
      data: textInput.trim(),
      size: textInput.length,
      createdAt: Date.now(),
    };
    persist([...items, item]);
    setTextInput("");
    setTextName("");
    toast.success("已儲存");
  };

  const handleDelete = (id: string) => {
    persist(items.filter((i) => i.id !== id));
    toast.success("已刪除");
  };

  return (
    <div className="space-y-5">
      {/* 說明橫幅 */}
      <div className="p-4 rounded-xl" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)" }}>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(125,211,252,0.9)" }}>
          💡 上傳過去的海報／小姐照片／企劃／文案當作<strong>素材庫</strong>，AI 未來生成時會參考這些資料，讓輸出更符合店裡風格與過往做過的內容。
          <br />
          <span className="text-[11px] opacity-80">目前檔案儲存在你的瀏覽器本地，同一台裝置可跨頁共用。單檔上限 3MB。</span>
        </p>
      </div>

      {/* 類別切換 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CATEGORIES.map((c) => {
          const count = items.filter((i) => i.category === c.id).length;
          const active = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: active ? `${c.color}18` : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? c.color + "55" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold" style={{ color: active ? c.color : "rgba(255,255,255,0.7)" }}>{c.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${c.color}25`, color: c.color }}>{count}</span>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{c.desc}</p>
            </button>
          );
        })}
      </div>

      {/* 上傳區 */}
      {activeCat.kind === "image" ? (
        <div>
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFileUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <div
              className="p-8 rounded-xl text-center transition-all hover:bg-white/5"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px dashed ${activeCat.color}55` }}
            >
              <FileUp size={32} className="mx-auto mb-2" style={{ color: activeCat.color }} />
              <p className="text-sm font-semibold" style={{ color: activeCat.color }}>點擊上傳 {activeCat.label}</p>
              <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>可多選、jpg/png/webp、單檔 3MB 以內</p>
            </div>
          </label>
        </div>
      ) : (
        <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <label className="text-xs block mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>名稱（選填）</label>
          <input
            value={textName}
            onChange={(e) => setTextName(e.target.value)}
            placeholder={`例如：2025 聖誕派對${activeCat.label}`}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-3"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
          />
          <label className="text-xs block mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>內容</label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={activeCat.id === "planner" ? "貼上過去的活動企劃書全文..." : "貼上過去有效的文案..."}
            rows={8}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
          />
          <button
            onClick={handleTextSubmit}
            className="mt-3 w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: `linear-gradient(135deg, ${activeCat.color}, ${activeCat.color}cc)`, color: "#0a0a0a" }}
          >
            <Upload size={14} className="inline mr-1.5" />
            儲存到素材庫
          </button>
        </div>
      )}

      {/* 檔案清單 */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
          已儲存 {filteredItems.length} 份 {activeCat.label}
        </h4>
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>尚無資料，上傳後會列在這裡</p>
          </div>
        ) : (
          <div className={activeCat.kind === "image" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" : "space-y-3"}>
            {filteredItems.slice().reverse().map((item) => (
              <LibraryCard key={item.id} item={item} color={activeCat.color} onDelete={() => handleDelete(item.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryCard({ item, color, onDelete }: { item: LibraryItem; color: string; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  if (item.kind === "image") {
    return (
      <div className="relative group rounded-xl overflow-hidden" style={{ border: `1px solid ${color}30` }}>
        <img src={item.data} alt={item.name} className="w-full aspect-[3/4] object-cover" />
        <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
          <span className="text-[10px] truncate flex-1" style={{ color: "rgba(255,255,255,0.8)" }}>{item.name}</span>
          <button
            onClick={onDelete}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30` }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{item.name}</p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {new Date(item.createdAt).toLocaleDateString()} · {item.size} 字
          </p>
        </div>
        <button onClick={onDelete} className="p-1.5 rounded-lg transition-all hover:bg-red-500/10" style={{ color: "rgba(255,100,100,0.7)" }}>
          <Trash2 size={13} />
        </button>
      </div>
      <div
        className="text-[12px] leading-relaxed whitespace-pre-wrap cursor-pointer"
        style={{ color: "rgba(255,255,255,0.6)", maxHeight: expanded ? "none" : "64px", overflow: "hidden" }}
        onClick={() => setExpanded(!expanded)}
      >
        {item.data}
      </div>
      {item.data.length > 100 && (
        <button onClick={() => setExpanded(!expanded)} className="mt-2 text-[11px]" style={{ color }}>{expanded ? "收合" : "展開全文"}</button>
      )}
    </div>
  );
}
