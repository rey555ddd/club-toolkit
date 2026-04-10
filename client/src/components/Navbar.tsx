import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sparkles } from "lucide-react";

const CHINATOWN_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032574653/Pha3yvm4xNX2ySLS98jSEw/中國城Logo_c1bf6212.jpg";
const DIHAO_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032574653/Pha3yvm4xNX2ySLS98jSEw/帝豪Logo_9eea1077.jpg";

const navItems = [
  { label: "首頁", path: "/" },
  { label: "文案產生器", path: "/copywriter" },
  { label: "海報美編", path: "/poster" },
  { label: "活動企劃師", path: "/planner" },
  { label: "修改建議", path: "/suggestions" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(8, 8, 20, 0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(201, 168, 76, 0.25)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.5), 0 1px 0 rgba(201,168,76,0.15)",
      }}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo 區域 */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center gap-2">
              <img
                src={CHINATOWN_LOGO}
                alt="中國城經典酒店"
                className="h-8 w-auto object-contain"
                style={{ filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))" }}
              />
              <span
                className="text-xs font-light tracking-widest"
                style={{ color: "rgba(201,168,76,0.5)" }}
              >
                ×
              </span>
              <img
                src={DIHAO_LOGO}
                alt="帝豪酒店"
                className="h-8 w-auto object-contain"
                style={{ filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))" }}
              />
            </div>
          </Link>

          {/* 桌面版導航 */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="relative px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 rounded-sm"
                  style={{
                    color: isActive ? "#f0c040" : "rgba(255,255,255,0.7)",
                    textShadow: isActive ? "0 0 12px rgba(240,192,64,0.8)" : "none",
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-sm"
                      style={{
                        background: "rgba(201,168,76,0.08)",
                        border: "1px solid rgba(201,168,76,0.2)",
                      }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5"
                      style={{ background: "linear-gradient(90deg, transparent, #f0c040, transparent)" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 右側標籤 */}
          <div className="hidden md:flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.3)",
                color: "#f0c040",
              }}
            >
              <Sparkles size={12} />
              <span>AI 行銷工具</span>
            </div>
          </div>

          {/* 手機版漢堡選單 */}
          <button
            className="md:hidden p-2 rounded-sm"
            style={{ color: "#f0c040" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* 手機版選單 */}
      {mobileOpen && (
        <div
          className="md:hidden border-t"
          style={{
            background: "rgba(8, 8, 20, 0.98)",
            borderColor: "rgba(201,168,76,0.2)",
          }}
        >
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="px-4 py-3 text-sm font-medium rounded-sm transition-all"
                  style={{
                    color: isActive ? "#f0c040" : "rgba(255,255,255,0.75)",
                    background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                    borderLeft: isActive ? "2px solid #f0c040" : "2px solid transparent",
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
