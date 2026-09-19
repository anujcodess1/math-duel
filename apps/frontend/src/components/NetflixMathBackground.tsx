import React from "react";

interface FloatingTileProps {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: "sm" | "md" | "lg";
  animation: string;
  delay?: string;
  symbol: React.ReactNode;
  label?: string;
}

const FloatingGlassTile: React.FC<FloatingTileProps> = ({
  top,
  bottom,
  left,
  right,
  size,
  animation,
  delay = "0s",
  symbol,
  label,
}) => {
  const sizeClasses =
    size === "lg"
      ? "w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl rounded-2xl"
      : size === "md"
      ? "w-13 h-13 sm:w-16 sm:h-16 text-xl sm:text-2xl rounded-xl"
      : "w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg rounded-xl";

  return (
    <div
      className={`absolute pointer-events-none select-none flex flex-col items-center justify-center ${animation}`}
      style={{
        top,
        bottom,
        left,
        right,
        animationDelay: delay,
      }}
    >
      <div
        className={`glass-box relative flex items-center justify-center p-2.5 transition-transform duration-700 ${sizeClasses}`}
      >
        <div className="absolute inset-0 rounded-inherit bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none rounded-2xl" />

        <div className="text-[#84cc16] flex items-center justify-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {symbol}
        </div>

        {label && (
          <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-zinc-400 font-bold tracking-tighter opacity-80">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export const NetflixMathBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 z-0">
        <img
          src="/netflix_math_bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center opacity-25 mix-blend-screen scale-105"
        />
      </div>

      <div
        className="absolute inset-0 z-1"
        style={{
          background:
            "radial-gradient(ellipse at 50% 25%, rgba(132, 204, 22, 0.18) 0%, rgba(10, 10, 10, 0.6) 50%, rgba(10, 10, 10, 0.95) 100%)",
        }}
      />

      <div className="absolute inset-0 z-2 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-[#0a0a0a]" />

      <div
        className="absolute inset-0 z-3 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(132, 204, 22, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(132, 204, 22, 0.4) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="absolute inset-0 z-4">
        <FloatingGlassTile
          top="12%"
          left="4%"
          size="lg"
          animation="animate-float-slow"
          delay="0s"
          label="ADD"
          symbol={
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        />

        <FloatingGlassTile
          top="14%"
          right="5%"
          size="lg"
          animation="animate-float-med"
          delay="1.2s"
          label="SUB"
          symbol={
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          }
        />

        <FloatingGlassTile
          top="42%"
          left="2%"
          size="md"
          animation="animate-float-rev"
          delay="2s"
          label="MUL"
          symbol={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          }
        />

        <FloatingGlassTile
          top="40%"
          right="3%"
          size="md"
          animation="animate-float-sway"
          delay="0.7s"
          label="DIV"
          symbol={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="6" r="1.5" fill="currentColor" />
              <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            </svg>
          }
        />

        <FloatingGlassTile
          bottom="16%"
          left="5%"
          size="lg"
          animation="animate-float-slow"
          delay="3s"
          label="SUM"
          symbol={
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 4H6l6 8-6 8h12" />
            </svg>
          }
        />

        <FloatingGlassTile
          bottom="18%"
          right="6%"
          size="lg"
          animation="animate-float-med"
          delay="1.8s"
          label="SQRT"
          symbol={
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 13l3 7 5-15h10" />
            </svg>
          }
        />

        <FloatingGlassTile
          top="26%"
          left="12%"
          size="sm"
          animation="animate-float-sway"
          delay="2.5s"
          label="PI"
          symbol={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M9 7v10M15 7v9a2 2 0 0 0 2 2" />
            </svg>
          }
        />

        <FloatingGlassTile
          top="28%"
          right="13%"
          size="sm"
          animation="animate-float-slow"
          delay="1.5s"
          label="INF"
          symbol={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.26-8-12.356-8-5.096 0-5.096 8 0 8 5.096 0 7.261-8 12.356-8z" />
            </svg>
          }
        />

        <FloatingGlassTile
          bottom="32%"
          left="10%"
          size="sm"
          animation="animate-float-rev"
          delay="0.4s"
          label="INT"
          symbol={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 4a3 3 0 0 0-3 3v10a3 3 0 0 1-3 3" />
            </svg>
          }
        />

        <FloatingGlassTile
          bottom="30%"
          right="12%"
          size="sm"
          animation="animate-float-med"
          delay="3.2s"
          label="MOD"
          symbol={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="6.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
          }
        />

        <FloatingGlassTile
          top="8%"
          left="48%"
          size="sm"
          animation="animate-float-sway"
          delay="2.1s"
          label="DELTA"
          symbol={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 4 21 20 3 20" />
            </svg>
          }
        />

        <FloatingGlassTile
          bottom="8%"
          left="50%"
          size="sm"
          animation="animate-float-slow"
          delay="1.1s"
          label="NOT-EQ"
          symbol={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="9" x2="19" y2="9" />
              <line x1="5" y1="15" x2="19" y2="15" />
              <line x1="19" y1="5" x2="5" y2="19" strokeWidth="2.2" />
            </svg>
          }
        />
      </div>
    </div>
  );
};
