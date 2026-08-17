import type { CSSProperties } from "react";
import { getFingerGuide } from "../core/typing";

const leftFingers = ["小指", "薬指", "中指", "人差し指"] as const;
const rightFingers = ["人差し指", "中指", "薬指", "小指"] as const;

const heights: Record<(typeof leftFingers)[number], number> = {
  小指: 34,
  薬指: 45,
  中指: 52,
  人差し指: 47,
};

function fingerStyle(finger: (typeof leftFingers)[number]): CSSProperties {
  return {
    width: "22%",
    height: `${heights[finger]}px`,
    transform: "none",
  };
}

export function FingerGuideView({ nextKey }: { nextKey: string }) {
  const guide = getFingerGuide(nextKey);
  const isThumb = guide.finger === "親指";
  return (
    <div className="finger-guide" aria-label={`使う指は${guide.label}`}>
      <div className={`hand left-hand ${guide.hand === "左手" ? "active" : ""}`} style={{ justifyContent: "flex-end" }}>
        {leftFingers.map((finger) => (
          <i
            key={finger}
            style={fingerStyle(finger)}
            className={!isThumb && guide.hand === "左手" && guide.finger === finger ? "active" : ""}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="finger-copy">
        <small>NEXT FINGER</small>
        <strong>{guide.label}</strong>
        <span>{isThumb ? "SPACEは親指で押そう" : "力を抜いて、そっと押そう"}</span>
      </div>
      <div className={`hand right-hand ${guide.hand === "右手" ? "active" : ""}`} style={{ justifyContent: "flex-start" }}>
        {rightFingers.map((finger) => (
          <i
            key={finger}
            style={fingerStyle(finger)}
            className={!isThumb && guide.hand === "右手" && guide.finger === finger ? "active" : ""}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
