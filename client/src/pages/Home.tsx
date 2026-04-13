import { Link } from "wouter";
import { FileText, Image, CalendarDays, ChevronRight, Zap, Shield, Target } from "lucide-react";

const CHINATOWN_LOGO = "/logos/chinatown-transparent.png";
const DIHAO_LOGO = "/logos/empire-transparent.png";
const SAMPLE_POSTER = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032574653/Pha3yvm4xNX2ySLS98jSEw/S__29811458_0_54e44c60.jpg";

const features = [
  {
    icon: FileText,
    title: "文案產生器",
    desc: "徵員、社群貼文、活動宣傳、小姐招募、Call 客文宣，一鍵生成接地氣的酒店業文案。",
    path: "/copywriter",
    tag: "5 種文案類型",
    color: "#f0c040",
  },
  {
    icon: Image,
    title: "女神海報生成器",
    desc: "AI 生成台灣女神人物（1-6 人）＋ 夜店場景底圖，下載純圖交給美編排版。",
    path: "/poster",
    tag: "AI 圖像生成",
    color: "#c084fc",
  },
  {
    icon: CalendarDays,
    title: "活動企劃師",
    desc: "AI 規劃促銷活動、Call 客方案，輸出完整企劃書含文案、排程與執行重點。",
    path: "/planner",
    tag: "完整企劃輸出",
    color: "#38bdf8",
  },
];

const highlights = [
  { icon: Zap, text: "AI 驅動，秒速生成" },
  { icon: Target, text: "專為八大行業設計" },
  { icon: Shield, text: "接地氣，去除 AI 感" },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.08 0.01 260)" }}>
      {/* Hero Section */}
      <section
        className="relative pt-24 pb-12 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, oklch(0.06 0.015 260) 0%, oklch(0.08 0.01 260) 100%)",
        }}
      >
        {/* 背景裝飾光效 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-20 left-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(155,89,182,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-20 right-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(52,152,219,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="container mx-auto px-4 lg:px-8 relative">
          {/* 雙 Logo 展示 */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
              <div className="flex flex-col items-center gap-3 group">
                <div
                  className="p-4 rounded-xl transition-all duration-500 group-hover:scale-105"
                  style={{
                    background: "transparent",
                  }}
                >
                  <img
                    src={CHINATOWN_LOGO}
                    alt="中國城經典酒店"
                    className="h-20 sm:h-24 w-auto object-contain"
                    style={{
                      filter: "drop-shadow(0 0 12px rgba(201,168,76,0.4))",
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "#f0c040" }}>中國城經典酒店</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>桃園區復興路99號 8F｜03-339-2188</p>
                </div>
              </div>

              <div
                className="text-3xl font-thin hidden sm:block"
                style={{ color: "rgba(201,168,76,0.4)" }}
              >
                ×
              </div>
              <div
                className="text-2xl font-thin sm:hidden"
                style={{ color: "rgba(201,168,76,0.4)" }}
              >
                ×
              </div>

              <div className="flex flex-col items-center gap-3 group">
                <div
                  className="p-4 rounded-xl transition-all duration-500 group-hover:scale-105"
                  style={{
                    background: "transparent",
                  }}
                >
                  <img
                    src={DIHAO_LOGO}
                    alt="帝豪酒店"
                    className="h-20 sm:h-24 w-auto object-contain"
                    style={{
                      filter: "drop-shadow(0 0 12px rgba(201,168,76,0.4))",
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "#f0c040" }}>帝豪酒店</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>桃園區復興路99號 6F｜03-339-3666</p>
                </div>
              </div>
            </div>

            {/* 分隔線 */}
            <div
              className="w-48 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)" }}
            />
          </div>

          {/* 主標題 */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
              style={{
                background: "linear-gradient(135deg, #c9a84c 0%, #f0c040 40%, #fff8e1 60%, #f0c040 80%, #c9a84c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI 行銷工具平台
            </h1>
            <p
              className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              專為八大行業酒店設計的智能行銷助手
              <br className="hidden sm:block" />
              文案、海報、企劃，一站搞定
            </p>
          </div>

          {/* 亮點標籤 */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                <h.icon size={14} style={{ color: "#f0c040" }} />
                {h.text}
              </div>
            ))}
          </div>

          {/* 功能卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {features.map((f) => (
              <Link key={f.path} href={f.path}>
                <div
                  className="group relative p-6 rounded-xl cursor-pointer transition-all duration-400 h-full"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(201,168,76,0.15)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = `${f.color}40`;
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.3), 0 0 20px ${f.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.15)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  {/* 頂部標籤 */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}
                    >
                      <f.icon size={20} style={{ color: f.color }} />
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: `${f.color}10`,
                        border: `1px solid ${f.color}25`,
                        color: f.color,
                      }}
                    >
                      {f.tag}
                    </span>
                  </div>

                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: "#f5f0e8" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-5"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {f.desc}
                  </p>

                  <div
                    className="flex items-center gap-1 text-sm font-medium transition-all duration-300 group-hover:gap-2"
                    style={{ color: f.color }}
                  >
                    立即使用
                    <ChevronRight size={15} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 品牌介紹 Section */}
      <section className="py-16" style={{ background: "oklch(0.10 0.012 260)" }}>
        <div className="container mx-auto px-4 lg:px-8">
          <div
            className="w-24 h-px mx-auto mb-8"
            style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)" }}
          />
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-xl sm:text-2xl font-semibold mb-5"
              style={{ color: "#f0c040" }}
            >
              蹦闆旗下酒店事業
            </h2>
            <p
              className="text-sm sm:text-base leading-loose"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              中國城經典酒店與帝豪酒店同屬桃園在地知名酒店集團，深耕八大行業多年。
              本平台整合 AI 技術，協助店內行銷人員快速產出高品質的文案、海報與活動企劃，
              讓每一次宣傳都更有效率、更有質感。
            </p>
          </div>
          <div
            className="w-24 h-px mx-auto mt-10"
            style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)" }}
          />
        </div>
      </section>

      {/* 視覺參考 Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <h2
            className="text-center text-lg font-medium mb-8 tracking-widest"
            style={{ color: "rgba(201,168,76,0.7)" }}
          >
            活動宣傳範例
          </h2>
          <div className="flex justify-center">
            <div
              className="relative rounded-xl overflow-hidden max-w-xs w-full"
              style={{
                border: "1px solid rgba(201,168,76,0.25)",
                boxShadow: "0 0 40px rgba(201,168,76,0.1)",
              }}
            >
              <img
                src={SAMPLE_POSTER}
                alt="活動宣傳範例"
                className="w-full h-auto object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(8,8,20,0.6) 0%, transparent 50%)",
                }}
              />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                  中國城經典酒店 — 電音星光閃耀主題活動
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 text-center"
        style={{
          borderTop: "1px solid rgba(201,168,76,0.15)",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        <p className="text-xs tracking-wide">
          © 2026 中國城經典酒店 × 帝豪酒店｜桃園市桃園區復興路99號
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(201,168,76,0.4)" }}>
          AI 行銷工具平台 — Powered by AI
        </p>
      </footer>
    </div>
  );
}
