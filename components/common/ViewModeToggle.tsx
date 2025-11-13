"use client";
import React from 'react';
import Image from 'next/image';

type ViewMode = 'table' | 'kanban';

type Props = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
  size?: { width: number; height: number };
};

const ViewModeToggle: React.FC<Props> = ({ mode, onChange, className, size }) => {
  const activeIndex = mode === 'table' ? 0 : 1;
  const w = size?.width ?? 120;
  const h = size?.height ?? 36;
  const insetV = 3; // top/bottom inset in px
  const insetH = 6; // left/right inset in px
  const half = w / 2;
  const indicatorW = half - insetH * 2;
  const indicatorH = h - insetV * 2;
  const left = activeIndex === 0 ? insetH : (half + insetH);
  return (
    <div
      className={className ? `${className} relative inline-flex items-center justify-between select-none overflow-hidden` : 'relative inline-flex items-center justify-between select-none overflow-hidden'}
      style={{ width: w, height: h }}
      role="tablist"
      aria-label="View mode"
    >
      <div className="absolute inset-0 bg-white border border-gray-300 rounded-[3px]" />
      <div
        className="absolute rounded-[3px] bg-[#C81C1F] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ top: insetV, left, width: indicatorW, height: indicatorH, willChange: 'left,width,height' }}
        aria-hidden
      />
      <button
        type="button"
        className="relative z-[1] flex-1 h-full grid place-items-center"
        aria-pressed={mode === 'table'}
        onClick={() => onChange('table')}
      >
        <Image
          src="/icons/table toggle.svg"
          alt="Table view"
          width={h - 12}
          height={h - 12}
          className={`filter brightness-0 ${mode === 'table' ? 'invert' : ''}`}
          priority
        />
      </button>
      <button
        type="button"
        className="relative z-[1] flex-1 h-full grid place-items-center"
        aria-pressed={mode === 'kanban'}
        onClick={() => onChange('kanban')}
      >
        <Image
          src="/icons/kanban toggle.svg"
          alt="Kanban view"
          width={h - 12}
          height={h - 12}
          className={`filter brightness-0 ${mode === 'kanban' ? 'invert' : ''}`}
          priority
        />
      </button>
    </div>
  );
};

export default ViewModeToggle;
