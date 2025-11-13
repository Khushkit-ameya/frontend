import React, { useMemo, useRef, useEffect } from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

export type ActivityTimelineProps = SvgProps & {
  daysWindow?: number; // legacy: initial window size
  visibleCount?: number; // how many candles are visible without scrolling
  totalDays?: number; // total scrollable days (from today going back)
  // Provide either lastActivityDate or daysAgo; if neither provided, render grey placeholder bar
  lastActivityDate?: string | Date | null;
  daysAgo?: number | null;
  // Set of day differences (0 = today, 1 = yesterday, etc.) that had activity
  activeDayDiffs?: number[];
  // Optional counts per day for tooltips
  dayCounts?: Record<number, number>;
  showLabel?: boolean;
  onCandleClick?: (payload: { dayDiff: number; date: Date }) => void;
  onCandleHover?: (payload: { dayDiff: number; date: Date }) => void;
};

const Candle: React.FC<{ variant: 'inactive' | 'oldActive' | 'recentActive' } & React.SVGProps<SVGRectElement>> = ({ variant, children, ...rest }) => {
  const fill = variant === 'recentActive' ? '#C81C1F' : variant === 'oldActive' ? '#9CA3AF' : '#D9D9D9';
  const fillOpacity = variant === 'inactive' ? 0.6 : 0.95;
  return (
    <rect
      width={6}
      height={18}
      rx={3}
      fill={fill}
      fillOpacity={fillOpacity}
      {...rest}
    >
      {children}
    </rect>
  );
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  daysWindow = 8,
  visibleCount = 8,
  totalDays,
  lastActivityDate,
  daysAgo,
  activeDayDiffs = [],
  dayCounts,
  showLabel = true,
  onCandleClick,
  onCandleHover,
  ...props
}) => {
  const resolvedDaysAgo = useMemo(() => {
    if (typeof daysAgo === 'number') return daysAgo;
    if (lastActivityDate) {
      try {
        const last = new Date(lastActivityDate);
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startLast = new Date(last.getFullYear(), last.getMonth(), last.getDate());
        const diff = Math.floor((start.getTime() - startLast.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
      } catch {
        return null;
      }
    }
    return null;
  }, [daysAgo, lastActivityDate]);

  const totalDaysToRender = useMemo(() => {
    const base = typeof totalDays === 'number' && totalDays > 0 ? totalDays : daysWindow;
    const maxActive = (activeDayDiffs && activeDayDiffs.length > 0) ? Math.max(...activeDayDiffs) : -1;
    const lastAgo = typeof resolvedDaysAgo === 'number' ? resolvedDaysAgo : -1;
    return Math.max(base, maxActive + 1, lastAgo + 1);
  }, [totalDays, daysWindow, activeDayDiffs, resolvedDaysAgo]);

  const activeSet = useMemo(() => new Set(activeDayDiffs?.filter((d) => d >= 0 && d < totalDaysToRender)), [activeDayDiffs, totalDaysToRender]);

  // If no info at all, mark placeholder needed (do not early-return to keep hooks order stable)
  const noData = resolvedDaysAgo === null && (!activeDayDiffs || activeDayDiffs.length === 0);

  // Layout: optional label + candles row
  const gap = 4; // px between candles
  const candleWidth = 6;
  const totalWidth = totalDaysToRender * (candleWidth + gap) - gap;
  const visibleWidth = visibleCount * (candleWidth + gap) - gap;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // scroll to the rightmost end (latest days on the right)
    try {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    } catch {}
  }, [totalWidth, visibleWidth]);

  return (
    noData ? (
      <svg width={108} height={18} viewBox="0 0 108 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect width={108} height={18} rx={2} fill="#D9D9D9" fillOpacity={0.6} />
      </svg>
    ) : (
      <div className="flex items-center gap-3">
        {showLabel && (
          <span className="text-[12px] text-gray-400 whitespace-nowrap">{resolvedDaysAgo !== null ? `${resolvedDaysAgo}d ago` : ''}</span>
        )}
        <div ref={scrollRef} className="overflow-x-auto no-scrollbar" style={{ width: visibleWidth }}>
          <svg width={totalWidth} height={18} viewBox={`0 0 ${totalWidth} 18`} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {Array.from({ length: totalDaysToRender }).map((_, idx) => {
              const dayDiff = totalDaysToRender - 1 - idx; // 0 today ... oldest on the left
              const x = idx * (candleWidth + gap);
              const isActive = activeSet.has(dayDiff);
              const date = new Date(startOfToday - dayDiff * dayMs);
              const variant: 'inactive' | 'oldActive' | 'recentActive' = !isActive ? 'inactive' : (dayDiff <= 7 ? 'recentActive' : 'oldActive');
              const count = dayCounts?.[dayDiff] || 0;
              const dateStr = date.toLocaleDateString();
              const countStr = count > 0 ? ` • ${count} ${count === 1 ? 'activity' : 'activities'}` : '';
              return (
                <Candle
                  key={idx}
                  x={x}
                  y={0}
                  variant={variant}
                  className={onCandleClick ? 'cursor-pointer transition-opacity duration-150 hover:opacity-100' : 'transition-opacity duration-150'}
                  onClick={onCandleClick ? (e) => { e.stopPropagation(); onCandleClick({ dayDiff, date }); } : undefined}
                  onMouseEnter={onCandleHover ? () => onCandleHover({ dayDiff, date }) : undefined}
                >
                  <title>{`${dateStr}${countStr}`}</title>
                </Candle>
              );
            })}
          </svg>
        </div>
      </div>
    )
  );
};

export default ActivityTimeline;