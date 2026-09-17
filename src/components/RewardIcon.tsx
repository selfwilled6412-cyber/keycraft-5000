import { premiumBuildings } from "../content/premiumAssets";
import type { RewardKind } from "../content/types";

const buildingByKind: Record<RewardKind, number> = {
  gate: 1,
  sign: 2,
  plaza: 3,
  shop: 4,
  garden: 5,
  workshop: 2,
  station: 6,
  tower: 9,
  festival: 7,
  landmark: 10,
};

export function RewardIcon({ id, kind, locked = false, size = 64 }: { id: string; kind: RewardKind; locked?: boolean; size?: number }) {
  const building = premiumBuildings[buildingByKind[kind]] ?? premiumBuildings[1]!;
  const visualSize = Math.max(48, size);

  return (
    <span
      className={`reward-icon premium-reward-image${locked ? " locked" : ""}`}
      role="img"
      aria-label={locked ? `未完成の報酬 ${id}` : `完成した報酬 ${id}`}
      style={{
        position: "relative",
        width: visualSize,
        height: visualSize,
        display: "inline-grid",
        placeItems: "center",
        overflow: "visible",
      }}
    >
      <img
        src={building.image}
        alt=""
        crossOrigin="anonymous"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: locked
            ? "grayscale(.78) brightness(.46) opacity(.68) drop-shadow(0 12px 10px rgba(0,0,0,.35))"
            : "drop-shadow(0 16px 12px rgba(0,0,0,.38)) saturate(1.05)",
        }}
      />
      {locked && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: Math.max(28, visualSize * .28),
            height: Math.max(28, visualSize * .28),
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            color: "#ffd66c",
            background: "rgba(4, 12, 20, .86)",
            border: "1px solid rgba(255, 208, 95, .5)",
            boxShadow: "0 5px 14px rgba(0,0,0,.45)",
            fontSize: Math.max(14, visualSize * .14),
          }}
        >
          🔒
        </span>
      )}
    </span>
  );
}
