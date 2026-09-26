import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'header' | 'pin' | 'full';
  showBeta?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'header',
  showBeta = false,
}) => {
  if (variant === 'pin' || variant === 'full') {
    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        {/* Teardrop Location Pin with stylized 'e' and teal dot */}
        <svg
          width={size === 'lg' ? 64 : size === 'md' ? 48 : 36}
          height={size === 'lg' ? 80 : size === 'md' ? 60 : 45}
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Pin Outline */}
          <path
            d="M50 8C27.9 8 10 25.9 10 48C10 74 50 112 50 112C50 112 90 74 90 48C90 25.9 72.1 8 50 8Z"
            stroke="#0F172A"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Loop 'e' inside pin */}
          <path
            d="M33 48H67C67 36 58 29 48 29C35 29 28 38 28 50C28 63 36 71 52 71C63 71 68 64 68 64"
            stroke="#0F172A"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Teal accent dot */}
          <circle cx="60" cy="85" r="5" fill="#0D9488" />
        </svg>

        {variant === 'full' && (
          <div className="flex items-baseline mt-2">
            <span className="text-[#0F172A] font-bold text-2xl tracking-tight">evoyage</span>
            <span className="text-[#0D9488] font-bold text-2xl ml-1.5">ai</span>
          </div>
        )}
      </div>
    );
  }

  // Header Variant matching the UI mockup
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Black pill badge with white 'ev' */}
      <div className="w-8 h-8 rounded-xl bg-[#0F172A] flex items-center justify-center text-white text-xs font-black tracking-tighter shadow-sm">
        ev
      </div>

      {/* Brand Typography */}
      <div className="flex items-center text-lg">
        <span className="text-[#0F172A] font-bold tracking-tight">evoyage</span>
        <span className="text-[#0D9488] font-bold ml-1.5">ai</span>
      </div>

      {/* Beta Tag */}
      {showBeta && (
        <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-md tracking-wider uppercase">
          BETA
        </span>
      )}
    </div>
  );
};
