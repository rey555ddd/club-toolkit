import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  UserPlus,
  FileText,
  Image as ImageIcon,
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
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type Tab = "copy" | "poster" | "referral";
type Channel = "dcard" | "ig_story" | "ig_post" | "threads" | "line_group";
type Position = "hostess" | "foh" | "control" | "wardrobe";
type PainPoint = "secret" | "no_photo" | "base_salary" | "flexible" | "referral" | "safe" | "sister";
type Hotel = "chinatown" | "dihao" | "both";
type RecruitPosterMode = "party" | "workplace" | "direct";

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

const posterModeOptions: { id: RecruitPosterMode; label: string; desc: string }[] = [
  { id: "workplace", label: "溫馨工作環境", desc: "1-2 位氣質小姐，明亮更衣室／包廂，感覺像正常工作" },
  { id: "direct", label: "高薪直白", desc: "大大的薪資數字、試坐保障字樣，素雅底圖" },
  { id: "party", label: "派對氣氛", desc: "熱鬧但不過度性感，展示正向團隊氣氛" },
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
            三位一體解決增員問題 — 痛點反轉文案 · 徵才海報 · 介紹制計算
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {[
            { id: "copy" as Tab, label: "徵才文案", icon: FileText, color: "#f0c040" },
            { id: "poster" as Tab, label: "徵才海報", icon: ImageIcon, color: "#c084fc" },
            { id: "referral" as Tab, label: "介紹制計算", icon: Users, color: "#22c55e" },
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
        {tab === "poster" && <PosterTab />}
        {tab === "referral" && <ReferralTab />}
      </div>
    </div>
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
// Tab 2: 徵才海報（簡化版，呼叫 poster.generate）
// ────────────────────────────────────────────────────
function PosterTab() {
  const [mode, setMode] = useState<RecruitPosterMode>("workplace");
  const [hotel, setHotel] = useState<Hotel>("both");
  const [salary, setSalary] = useState("");
  const [contact, setContact] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const mut = trpc.poster.generate.useMutation({
    onSuccess: (data) => setImageUrl(data.imageBase64 ?? null),
    onError: (e) => toast.error("生成失敗：" + e.message),
  });

  const modeDescriptions: Record<RecruitPosterMode, string> = {
    workplace: "Recruitment-focused poster, bright clean warmly-lit interior (dressing room / lounge / hallway), 1-2 Taiwanese women with elegant natural vibe (NOT overtly sexy, NOT party glam, NOT heavy nightclub makeup — more like a classy workplace ambassador photo), reassuring professional atmosphere suitable for recruiting new hostesses.",
    direct: "Recruitment poster with MINIMAL imagery (optional 1 small tasteful portrait in corner), MAIN VISUAL is LARGE BOLD TYPOGRAPHY of salary/bonus numbers and job guarantees like '試坐底薪保障' '介紹獎金 $15,000'. Clean elegant gold-on-black background. Feels like a premium job posting, not a party ad.",
    party: "Recruitment poster showing a positive team atmosphere — 2-3 Taiwanese women together in a friendly upbeat pose (NOT sexually provocative, focus on team friendship and fun work vibe), warm nightclub lighting but wholesome feel. Goal: showcase good team culture to attract new members.",
  };

  const handleGen = () => {
    const detailsLines = [
      salary ? `薪資訴求：${salary}` : "",
      contact ? `聯絡方式：${contact}（請放在海報上顯眼位置）` : "",
      customNote,
    ].filter(Boolean).join("；");

    const customPrompt = `${modeDescriptions[mode]}

IMPORTANT — this is a RECRUITMENT poster targeting potential NEW hostesses, NOT a marketing poster for customers. The tone must be reassuring, professional, tasteful, approachable. Avoid provocative / heavy-sexy / fetishized imagery that would scare away job applicants.

Leave substantial clean blank areas at top and bottom for adding text like: job title, guaranteed base pay, referral bonus, contact LINE ID. Design should look like a job ad, not a night event ad.

${detailsLines ? `Additional details: ${detailsLines}` : ""}`;

    setImageUrl(null);
    mut.mutate({
      hotel,
      style: mode === "direct" ? "luxury_gold" : "modern_minimal",
      theme: mode === "workplace" ? "徵才 - 溫馨工作環境" : mode === "direct" ? "徵才 - 高薪直白" : "徵才 - 團隊派對感",
      features: [],
      effects: [],
      hasUploadedPhoto: false,
      personCount: mode === "direct" ? 1 : mode === "workplace" ? 2 : 3,
      personStyle: mode === "workplace" ? "graceful" : mode === "party" ? "sweet" : undefined,
      outfitStyle: mode === "party" ? "sweet_cutie" : undefined,
      excludeText: true,
      customPrompt,
    });
  };

  const download = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `recruit-poster-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <Section title="海報風格">
          <div className="grid grid-cols-1 gap-2">
            {posterModeOptions.map((m) => (
              <Choice key={m.id} active={mode === m.id} onClick={() => setMode(m.id)} title={m.label} desc={m.desc} color="#c084fc" />
            ))}
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
                  background: hotel === h.id ? "rgba(192,132,252,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${hotel === h.id ? "rgba(192,132,252,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: hotel === h.id ? "#c084fc" : "rgba(255,255,255,0.6)",
                }}
              >
                {h.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="薪資 / 獎金文字（選填）">
          <input
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="例：試坐底薪 $1,500 / 日"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(192,132,252,0.2)", color: "rgba(255,255,255,0.85)" }}
          />
        </Section>

        <Section title="聯絡窗口（選填）">
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="例：LINE @abc123"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(192,132,252,0.2)", color: "rgba(255,255,255,0.85)" }}
          />
        </Section>

        <Section title="補充說明（選填）">
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="例：背景用咖啡色調 / 想要姐妹感 / 女生要看起來像大學生"
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(192,132,252,0.2)", color: "rgba(255,255,255,0.85)" }}
          />
        </Section>

        <button
          onClick={handleGen}
          disabled={mut.isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #c084fc, #a855f7)", color: "#fff" }}
        >
          {mut.isPending ? <RefreshCw size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          {mut.isPending ? "生成中..." : "生成徵才海報"}
        </button>

        <p className="text-[11px] leading-relaxed p-3 rounded-lg" style={{ color: "rgba(252,211,77,0.8)", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
          ⚠️ AI 海報為底圖參考，正式徵才海報建議由美編加上聯絡資訊、試坐保障等細節
        </p>
      </div>

      <div className="lg:col-span-3 rounded-xl overflow-hidden flex flex-col items-center p-6" style={{ background: "oklch(0.10 0.015 260)", border: "1px solid rgba(192,132,252,0.15)", minHeight: "500px" }}>
        {mut.isPending ? (
          <LoadingState text="AI 正在生成徵才海報...（約 20-40 秒）" />
        ) : imageUrl ? (
          <div className="w-full flex flex-col items-center gap-4">
            <img src={imageUrl} alt="徵才海報" className="w-full max-w-xs rounded-xl" style={{ border: "1px solid rgba(192,132,252,0.25)" }} />
            <button onClick={download} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs" style={{ background: "rgba(192,132,252,0.12)", border: "1px solid rgba(192,132,252,0.3)", color: "#c084fc" }}>
              <Download size={13} /> 下載海報
            </button>
          </div>
        ) : (
          <EmptyState icon={ImageIcon} text="選好風格後點生成徵才海報" color="rgba(192,132,252,0.2)" />
        )}
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
