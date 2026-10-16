'use client';

import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface VirtualPadProps {
  onDirectionChange: (dir: { up: boolean; down: boolean; left: boolean; right: boolean }) => void;
  currentDirection: { up: boolean; down: boolean; left: boolean; right: boolean };
}

export const VirtualPad: React.FC<VirtualPadProps> = ({ onDirectionChange, currentDirection }) => {
  const handleTouch = (key: 'up' | 'down' | 'left' | 'right', isPressed: boolean) => {
    onDirectionChange({
      ...currentDirection,
      [key]: isPressed,
    });
  };

  return (
    <div className="relative w-36 h-36 select-none touch-none flex items-center justify-center">
      {/* 背景リング */}
      <div className="absolute inset-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-white/5" />
      </div>

      {/* 上ボタン */}
      <button
        type="button"
        className={`absolute top-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
          currentDirection.up
            ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
        }`}
        onTouchStart={(e) => { e.preventDefault(); handleTouch('up', true); }}
        onTouchEnd={(e) => { e.preventDefault(); handleTouch('up', false); }}
        onMouseDown={() => handleTouch('up', true)}
        onMouseUp={() => handleTouch('up', false)}
        onMouseLeave={() => handleTouch('up', false)}
        aria-label="上へ移動"
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* 下ボタン */}
      <button
        type="button"
        className={`absolute bottom-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
          currentDirection.down
            ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
        }`}
        onTouchStart={(e) => { e.preventDefault(); handleTouch('down', true); }}
        onTouchEnd={(e) => { e.preventDefault(); handleTouch('down', false); }}
        onMouseDown={() => handleTouch('down', true)}
        onMouseUp={() => handleTouch('down', false)}
        onMouseLeave={() => handleTouch('down', false)}
        aria-label="下へ移動"
      >
        <ArrowDown className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* 左ボタン */}
      <button
        type="button"
        className={`absolute left-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
          currentDirection.left
            ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
        }`}
        onTouchStart={(e) => { e.preventDefault(); handleTouch('left', true); }}
        onTouchEnd={(e) => { e.preventDefault(); handleTouch('left', false); }}
        onMouseDown={() => handleTouch('left', true)}
        onMouseUp={() => handleTouch('left', false)}
        onMouseLeave={() => handleTouch('left', false)}
        aria-label="左へ移動"
      >
        <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* 右ボタン */}
      <button
        type="button"
        className={`absolute right-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
          currentDirection.right
            ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
        }`}
        onTouchStart={(e) => { e.preventDefault(); handleTouch('right', true); }}
        onTouchEnd={(e) => { e.preventDefault(); handleTouch('right', false); }}
        onMouseDown={() => handleTouch('right', true)}
        onMouseUp={() => handleTouch('right', false)}
        onMouseLeave={() => handleTouch('right', false)}
        aria-label="右へ移動"
      >
        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
