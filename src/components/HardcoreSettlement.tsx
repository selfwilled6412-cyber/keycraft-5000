import { townCoreWebp } from "../assets/townCore";

interface HardcoreSettlementProps {
  completedCrafts: number;
  currentCraft?: number;
  compact?: boolean;
}

export function HardcoreSettlement({ completedCrafts, currentCraft = 0, compact = false }: HardcoreSettlementProps) {
  const districtCrafts = completedCrafts % 10;
  const activeCount = Math.max(completedCrafts === 0 ? 0 : (districtCrafts || 10), Math.min(10, currentCraft));
  const reveal = Math.max(.42, Math.min(1, .42 + activeCount * .058));

  return (
    <div className={`hc-settlement ${compact ? "compact" : ""}`} aria-label={`現在の拠点。完成CRAFT ${completedCrafts}`}>
      <img
        src={townCoreWebp}
        alt="極寒の拠点に中央塔、工房、住宅、住民が並ぶKEY CRAFTの街"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 50%",
          transform: compact ? "scale(1.01)" : "scale(1.08)",
          filter: `brightness(${.72 + reveal * .32}) saturate(${.78 + reveal * .42}) contrast(1.08)`,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(4,9,16,.12), rgba(3,8,14,${Math.max(.08, .38 - reveal * .25)})), radial-gradient(circle at 47% 42%, rgba(255,137,44,${.04 + reveal * .14}), transparent 31%)`,
          pointerEvents: "none",
        }}
      />
      {activeCount < 10 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, rgba(5,12,22,${.35 - activeCount * .02}) 0%, transparent 30%, transparent 72%, rgba(5,12,22,${.42 - activeCount * .025}) 100%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div className="hc-settlement-vignette" />
      <div className="hc-settlement-label"><span>FROST DISTRICT</span><strong>{activeCount}/10 CRAFTS BUILT</strong></div>
    </div>
  );
}
