import { getFingerGuide } from "../core/typing";

const fingers = ["小指", "薬指", "中指", "人差し指", "親指"] as const;

export function FingerGuideView({ nextKey }: { nextKey: string }) {
  const guide = getFingerGuide(nextKey);
  return (
    <div className="finger-guide" aria-label={`使う指は${guide.label}`}>
      <div className={`hand left-hand ${guide.hand === "左手" ? "active" : ""}`}>
        {[...fingers].reverse().map((finger) => <i key={finger} className={guide.hand === "左手" && guide.finger === finger ? "active" : ""} />)}
      </div>
      <div className="finger-copy"><small>NEXT FINGER</small><strong>{guide.label}</strong><span>力を抜いて、そっと押そう</span></div>
      <div className={`hand right-hand ${guide.hand === "右手" ? "active" : ""}`}>
        {fingers.map((finger) => <i key={finger} className={guide.hand === "右手" && guide.finger === finger ? "active" : ""} />)}
      </div>
    </div>
  );
}
