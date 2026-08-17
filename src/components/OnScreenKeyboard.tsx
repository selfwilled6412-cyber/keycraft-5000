import { getFingerGuide, keyboardRows } from "../core/typing";

export function OnScreenKeyboard({ nextKeys }: { nextKeys: string[] }) {
  const active = new Set(nextKeys.map((key) => key.toLowerCase()));
  return (
    <div className="screen-keyboard" aria-label={`画面キーボード。次のキーは${nextKeys.join(" または ")}`}>
      {keyboardRows.map((row, rowIndex) => (
        <div className="keyboard-row" key={rowIndex}>
          {row.map((key) => {
            const guide = getFingerGuide(key);
            return <kbd key={key} className={`${active.has(key) ? "active" : ""} ${guide.hand === "左手" ? "left" : "right"}`}>{key.toUpperCase()}</kbd>;
          })}
        </div>
      ))}
      <div className="keyboard-row"><kbd className={`space-key ${active.has(" ") ? "active" : ""}`}>SPACE</kbd></div>
    </div>
  );
}
