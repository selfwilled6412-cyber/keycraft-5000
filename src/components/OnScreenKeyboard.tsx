import { getFingerGuide, keyboardRows } from "../core/typing";

export function OnScreenKeyboard({ nextKeys }: { nextKeys: string[] }) {
  const recommended = (nextKeys[0] ?? "").toLowerCase();
  return (
    <div className="screen-keyboard" aria-label={`画面キーボード。次の推奨キーは${recommended || "なし"}`}>
      {keyboardRows.map((row, rowIndex) => (
        <div className="keyboard-row" key={rowIndex}>
          {row.map((key) => {
            const guide = getFingerGuide(key);
            return <kbd key={key} className={`${recommended === key ? "active" : ""} ${guide.hand === "左手" ? "left" : "right"}`}>{key.toUpperCase()}</kbd>;
          })}
        </div>
      ))}
      <div className="keyboard-row"><kbd className={`space-key ${recommended === " " ? "active" : ""}`}>SPACE</kbd></div>
    </div>
  );
}
