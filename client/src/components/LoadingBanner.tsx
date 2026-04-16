import { Sparkles } from "lucide-react";

interface Props {
  message?: string;
}

export default function LoadingBanner({ message = "Gemini AI 生成中..." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{ border: "2px solid rgba(240,192,64,0.12)", borderTopColor: "rgba(240,192,64,0.7)" }}
        />
        <Sparkles className="absolute inset-0 m-auto w-5 h-5" style={{ color: "rgba(240,192,64,0.7)" }} />
      </div>
      <p
        className="text-xs tracking-[0.06em] animate-pulse"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {message}
      </p>
    </div>
  );
}
