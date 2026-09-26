import React from 'react';
import { Zap } from 'lucide-react';

interface BatteryIndicatorProps {
  soc: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  soc,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const getBatteryColor = (level: number) => {
    if (level <= 15) return 'bg-danger text-danger border-danger/30';
    if (level <= 30) return 'bg-warning text-warning border-warning/30';
    return 'bg-teal-500 text-teal-600 border-teal-500/30';
  };

  const getBarColor = (level: number) => {
    if (level <= 15) return 'bg-danger';
    if (level <= 30) return 'bg-warning';
    return 'bg-teal-500';
  };

  const sizeStyles = {
    sm: 'h-5 px-2 text-xs gap-1.5',
    md: 'h-7 px-2.5 text-xs font-semibold gap-2',
    lg: 'h-9 px-3.5 text-sm font-bold gap-2.5',
  };

  return (
    <div
      className={`inline-flex items-center rounded-pill border bg-white shadow-sm ${sizeStyles[size]} ${className}`}
    >
      {/* Battery outline container */}
      <div className="relative flex items-center">
        <div className="w-5 h-3 rounded-sm border border-slate-400 p-[1.5px] flex items-center">
          <div
            className={`h-full rounded-[1px] transition-all duration-500 ${getBarColor(soc)}`}
            style={{ width: `${Math.max(8, Math.min(100, soc))}%` }}
          />
        </div>
        {/* Battery terminal pip */}
        <div className="w-[2px] h-1.5 bg-slate-400 rounded-r-sm -ml-[1px]" />
      </div>

      <span className="text-slate-800 tabular-nums font-semibold">{Math.round(soc)}%</span>

      {showIcon && <Zap className="w-3 h-3 text-teal-600 fill-teal-600 animate-pulse" />}
    </div>
  );
};
