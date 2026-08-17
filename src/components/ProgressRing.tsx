import type { CSSProperties } from "react";

export function ProgressRing({ value, label, size = 96 }: { value: number; label: string; size?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-ring" style={{ "--progress": `${clamped * 3.6}deg`, width: size, height: size } as CSSProperties} role="img" aria-label={`${label} ${Math.round(clamped)}%`}>
      <span><strong>{Math.round(clamped)}%</strong><small>{label}</small></span>
    </div>
  );
}
