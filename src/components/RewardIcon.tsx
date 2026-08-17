import type { RewardKind } from "../content/types";

const palettes = [
  ["#f06a45", "#ffd269", "#17344d"],
  ["#6359d9", "#a7d8ff", "#29335c"],
  ["#178a72", "#9ee0be", "#18493f"],
  ["#df9226", "#ffe09c", "#5b3c18"],
  ["#2677b8", "#9bd8ef", "#153c59"],
] as const;

const hash = (value: string): number => {
  let result = 0;
  for (const character of value) result = ((result << 5) - result + character.charCodeAt(0)) | 0;
  return Math.abs(result);
};

export function RewardIcon({ id, kind, locked = false, size = 64 }: { id: string; kind: RewardKind; locked?: boolean; size?: number }) {
  const [primary, secondary, dark] = palettes[hash(id) % palettes.length] ?? palettes[0];
  const body = (() => {
    switch (kind) {
      case "gate": return <><path d="M18 47V25l14-10 14 10v22h-8V31H26v16Z" fill={primary} /><path d="M15 47h34v5H15z" fill={dark} /></>;
      case "sign": return <><path d="M29 17h6v35h-6z" fill={dark} /><path d="M12 13h40v23H12z" rx="4" fill={primary} /><path d="M19 20h26v4H19zm0 8h17v3H19z" fill={secondary} /></>;
      case "plaza": return <><path d="m32 9 20 13-20 13L12 22Z" fill={secondary} /><path d="m12 22 20 13 20-13v15L32 50 12 37Z" fill={primary} /><circle cx="32" cy="27" r="6" fill={dark} /></>;
      case "shop": return <><path d="M14 24h36v29H14z" fill={secondary} /><path d="m11 24 5-12h32l5 12-7 5-7-5-7 5-7-5-7 5Z" fill={primary} /><path d="M21 36h11v17H21zm15 0h8v8h-8z" fill={dark} /></>;
      case "garden": return <><path d="M13 47h38v7H13z" fill={dark} /><path d="M30 48V28h4v20z" fill={dark} /><circle cx="24" cy="26" r="10" fill={primary} /><circle cx="39" cy="24" r="11" fill={secondary} /><circle cx="32" cy="17" r="9" fill={primary} /></>;
      case "workshop": return <><path d="M12 30 31 17l21 13v23H12z" fill={secondary} /><path d="M12 30V17h10v7l9-7 21 13Z" fill={primary} /><path d="M25 37h14v16H25z" fill={dark} /><circle cx="45" cy="19" r="7" fill={dark} /></>;
      case "station": return <><path d="M13 19h38v34H13z" fill={secondary} /><path d="M10 19 32 8l22 11Z" fill={primary} /><path d="M21 29h22v12H21zm7 12h8v12h-8z" fill={dark} /></>;
      case "tower": return <><path d="m25 53 5-35h4l5 35Z" fill={primary} /><path d="M20 53h24v4H20zM23 38h18v4H23zM27 25h10v4H27z" fill={dark} /><circle cx="32" cy="13" r="6" fill={secondary} /></>;
      case "festival": return <><path d="M18 10h4v45h-4zm24 0h4v45h-4z" fill={dark} /><path d="M22 14c8 6 12-4 20 2v18c-8-6-12 4-20-2Z" fill={primary} /><path d="M15 51h34v5H15z" fill={secondary} /></>;
      case "landmark": return <><path d="m32 7 22 16-8 30H18l-8-30Z" fill={secondary} /><path d="m32 13 14 12-5 22H23l-5-22Z" fill={primary} /><path d="m32 20 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill={dark} /></>;
    }
  })();

  return (
    <svg className={`reward-icon${locked ? " locked" : ""}`} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={locked ? "未完成の報酬" : "完成した報酬"}>
      {body}
      {locked && <path d="M22 32v-5a10 10 0 0 1 20 0v5m-23 0h26v21H19z" fill="#52606b" opacity=".78" />}
    </svg>
  );
}
