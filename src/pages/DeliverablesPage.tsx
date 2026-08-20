import { useMemo, useState } from "react";
import { PremiumSettlement } from "../components/PremiumSettlement";
import { GameGate } from "../components/GameGate";
import { catalog } from "../content/catalog";
import { premiumBuildings, premiumHeroes, premiumRewardIcons } from "../content/premiumAssets";
import { usePlayer } from "../context/PlayerContext";

const W = 1600;
const H = 900;
const spriteBase = "https://raw.githubusercontent.com/SpriteCook/spritecook-free-game-assets/master/examples/isometric-buildings";
const ambientSettlementImages = [
  `${spriteBase}/building11.png`,
  `${spriteBase}/building12.png`,
  `${spriteBase}/building13.png`,
  `${spriteBase}/building14.png`,
  `${spriteBase}/building15.png`,
  `${spriteBase}/building16.png`,
  `${spriteBase}/animated_house_2.webp`,
  `${spriteBase}/animated_house_3.webp`,
];

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function chunkText(value: string, maxChars: number, maxLines = 2): string[] {
  const normalized = value.trim();
  if (!normalized) return [""];
  const lines: string[] = [];
  let cursor = 0;
  while (cursor < normalized.length && lines.length < maxLines) {
    const remaining = normalized.length - cursor;
    const isLastAllowedLine = lines.length === maxLines - 1;
    if (isLastAllowedLine && remaining > maxChars) {
      lines.push(`${normalized.slice(cursor, cursor + Math.max(1, maxChars - 1))}…`);
      break;
    }
    lines.push(normalized.slice(cursor, cursor + maxChars));
    cursor += maxChars;
  }
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, "image/png");
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function canvasBase() {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvasを作成できませんでした");
  return { canvas, ctx };
}

function titleText(ctx: CanvasRenderingContext2D, kicker: string, title: string, subtitle: string) {
  ctx.fillStyle = "#67d6ff";
  ctx.font = "700 24px sans-serif";
  ctx.fillText(kicker, 72, 75);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 58px sans-serif";
  ctx.fillText(title, 72, 140);
  ctx.fillStyle = "#a8bfd1";
  ctx.font = "500 24px sans-serif";
  ctx.fillText(subtitle, 74, 178);
}

function drawRoad(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, width = 44) {
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.strokeStyle = "rgba(73, 91, 105, .88)";
  ctx.lineWidth = width + 14;
  ctx.stroke();
  ctx.strokeStyle = "rgba(133, 151, 164, .95)";
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.setLineDash([10, 18]);
  ctx.strokeStyle = "rgba(217, 231, 240, .56)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const glow = ctx.createRadialGradient(0, -30, 2, 0, -30, 42);
  glow.addColorStop(0, "rgba(255,205,103,.82)");
  glow.addColorStop(1, "rgba(255,170,55,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -30, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#23313d";
  ctx.fillRect(-3, -31, 6, 34);
  ctx.fillStyle = "#ffd373";
  ctx.beginPath();
  ctx.arc(0, -31, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

async function exportSettlementPoster(input: { filename: string; nickname: string; completedMissions: number; completedPhrases: number; districtName: string }) {
  const { canvas, ctx } = canvasBase();
  const districtCrafts = input.completedMissions === 0 ? 0 : input.completedMissions % 10 || 10;
  const cityLevel = Math.max(1, Math.floor(input.completedPhrases / 100) + 1);
  const production = 320 + input.completedPhrases * 9;

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#06101c");
  sky.addColorStop(.34, "#163655");
  sky.addColorStop(.35, "#9db4c4");
  sky.addColorStop(1, "#dce9f1");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(199,218,231,.62)";
  ctx.beginPath();
  ctx.moveTo(520, 350); ctx.lineTo(760, 95); ctx.lineTo(980, 350); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(89,111,130,.6)";
  ctx.beginPath();
  ctx.moveTo(780, 350); ctx.lineTo(1040, 125); ctx.lineTo(1310, 350); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(226,237,244,.85)";
  ctx.beginPath();
  ctx.ellipse(1040, 745, 820, 420, -.04, 0, Math.PI * 2);
  ctx.fill();

  drawRoad(ctx, [[500, 690], [760, 595], [1010, 575], [1390, 650]], 46);
  drawRoad(ctx, [[895, 360], [930, 500], [900, 765]], 38);
  drawRoad(ctx, [[700, 745], [860, 660], [1090, 730], [1300, 790]], 32);

  const [primaryImages, ambientImages, heroImages] = await Promise.all([
    Promise.all(premiumBuildings.map((item) => loadImage(item.image))),
    Promise.all(ambientSettlementImages.map(loadImage)),
    Promise.all(premiumHeroes.slice(0, 5).map((hero) => loadImage(hero.image))),
  ]);

  const ambientCoords = [
    [485, 415, 190], [640, 380, 180], [1225, 395, 185], [1380, 455, 175],
    [505, 710, 205], [1345, 720, 195], [720, 785, 180], [1195, 810, 170],
  ] as const;
  ambientImages.forEach((image, index) => {
    if (!image) return;
    const [x, y, size] = ambientCoords[index]!;
    ctx.globalAlpha = .94;
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
  });
  ctx.globalAlpha = 1;

  const primaryCoords = [
    [930, 500, 330],
    [680, 495, 215],
    [1165, 485, 215],
    [760, 645, 205],
    [1115, 640, 205],
    [575, 585, 195],
    [1300, 585, 195],
    [850, 760, 185],
    [1055, 760, 185],
    [560, 800, 165],
    [1290, 805, 165],
  ] as const;
  primaryImages.forEach((image, index) => {
    if (!image) return;
    const [x, y, size] = primaryCoords[index]!;
    const unlocked = index === 0 || districtCrafts >= index;
    ctx.save();
    ctx.globalAlpha = unlocked ? 1 : .2;
    if (!unlocked) ctx.filter = "grayscale(1) brightness(.65)";
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  });

  const lampPositions = [[640, 570], [820, 545], [1085, 545], [1250, 670], [990, 700], [760, 710]] as const;
  lampPositions.forEach(([x, y], index) => drawLamp(ctx, x, y, index % 2 === 0 ? 1.15 : .95));

  heroImages.forEach((image, index) => {
    if (!image) return;
    const positions = [[845, 555], [1045, 545], [710, 690], [1200, 690], [970, 755]] as const;
    const [x, y] = positions[index]!;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, image, x - 32, y - 32, 64, 64);
    ctx.restore();
    ctx.strokeStyle = "#e6b84b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.stroke();
  });

  const cityGlow = ctx.createRadialGradient(940, 530, 20, 940, 530, 220);
  cityGlow.addColorStop(0, "rgba(255,165,52,.28)");
  cityGlow.addColorStop(1, "rgba(255,165,52,0)");
  ctx.fillStyle = cityGlow;
  ctx.beginPath();
  ctx.arc(940, 530, 220, 0, Math.PI * 2);
  ctx.fill();

  const overlay = ctx.createLinearGradient(0, 0, 690, 0);
  overlay.addColorStop(0, "rgba(2,8,16,.995)");
  overlay.addColorStop(.72, "rgba(2,8,16,.9)");
  overlay.addColorStop(1, "rgba(2,8,16,.08)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, 735, H);

  ctx.fillStyle = "rgba(6,19,31,.86)";
  roundedRect(ctx, 75, 55, 245, 44, 13); ctx.fill();
  ctx.strokeStyle = "rgba(100,188,239,.4)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#7ed6ff"; ctx.font = "800 18px sans-serif"; ctx.fillText("CURRENT SETTLEMENT", 95, 84);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 55px sans-serif";
  ctx.fillText(`${input.nickname} の極寒都市`, 72, 170);
  ctx.fillStyle = "#9db3c4";
  ctx.font = "600 22px sans-serif";
  ctx.fillText(`${input.districtName} / DISTRICT ${String(Math.floor(input.completedMissions / 10) + 1).padStart(2, "0")}`, 76, 210);

  ctx.fillStyle = "#f4b942";
  ctx.font = "900 122px sans-serif";
  ctx.fillText(String(input.completedMissions).padStart(3, "0"), 70, 370);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 27px sans-serif";
  ctx.fillText("MISSIONS COMPLETE", 78, 412);

  ctx.fillStyle = "rgba(3,10,18,.94)";
  roundedRect(ctx, 72, 455, 510, 245, 28); ctx.fill();
  ctx.strokeStyle = "rgba(94,163,207,.34)"; ctx.lineWidth = 2; ctx.stroke();
  const stats = [
    ["CRAFTS BUILT", `${districtCrafts}/10`],
    ["PHRASES", `${input.completedPhrases}/5000`],
    ["CITY LEVEL", String(cityLevel).padStart(2, "0")],
    ["HEAT OUTPUT", production.toLocaleString()],
  ] as const;
  stats.forEach(([label, value], index) => {
    const x = 105 + (index % 2) * 242;
    const y = 520 + Math.floor(index / 2) * 98;
    ctx.fillStyle = "#7f9bb0"; ctx.font = "700 17px sans-serif"; ctx.fillText(label, x, y);
    ctx.fillStyle = "#ffffff"; ctx.font = "900 31px sans-serif"; ctx.fillText(value, x, y + 38);
  });

  ctx.fillStyle = "rgba(7,18,29,.88)";
  roundedRect(ctx, 1130, 54, 390, 88, 18); ctx.fill();
  ctx.strokeStyle = "rgba(242,182,61,.44)"; ctx.stroke();
  ctx.fillStyle = "#91abc0"; ctx.font = "700 17px sans-serif"; ctx.fillText("FROST WEATHER", 1160, 88);
  ctx.fillStyle = "#ffffff"; ctx.font = "900 31px sans-serif"; ctx.fillText("-27.3°C / 吹雪", 1160, 125);

  ctx.fillStyle = "#ffbf45";
  ctx.font = "800 23px sans-serif";
  ctx.fillText("打つほど、世界ができていく。", 74, 826);
  ctx.fillStyle = "#7f9bb0";
  ctx.font = "700 16px sans-serif";
  ctx.fillText("KEY CRAFT 5000 / PERSONAL BUILD RECORD", 74, 858);

  downloadCanvas(canvas, input.filename);
}

async function exportMissionCard(input: { filename: string; nickname: string; missionNumber: number; missionTitle: string; rewardName: string; completedMissions: number }) {
  const { canvas, ctx } = canvasBase();
  const bg = ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,"#05080d"); bg.addColorStop(.45,"#122d4f"); bg.addColorStop(1,"#06101c"); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  const building = await loadImage(premiumBuildings[Math.min(10, Math.max(1, input.missionNumber % 11))]!.image);
  const hero = await loadImage(premiumHeroes[Math.min(premiumHeroes.length - 1, Math.floor(input.completedMissions / 3))]!.image);
  ctx.fillStyle="#f3b338"; ctx.fillRect(0,0,W,14); ctx.fillStyle="#55b9ef"; ctx.fillRect(0,H-12,W,12);
  ctx.fillStyle="rgba(255,255,255,.06)"; roundedRect(ctx, 66,60,1468,780,38); ctx.fill();
  ctx.strokeStyle="rgba(242,183,65,.35)"; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle="#f2b741"; ctx.font="800 26px sans-serif"; ctx.fillText("MISSION CLEAR", 110, 130);
  ctx.fillStyle="#fff"; ctx.font="900 104px sans-serif"; ctx.fillText(String(input.missionNumber).padStart(3,"0"), 105, 250);
  const titleLines = chunkText(input.missionTitle, 13, 2);
  ctx.font="900 44px sans-serif";
  titleLines.forEach((line, index) => ctx.fillText(line, 110, 315 + index * 54));
  ctx.fillStyle="#a7bdcf"; ctx.font="500 23px sans-serif"; ctx.fillText(`${input.nickname} / KEY CRAFT 5000`, 112, titleLines.length > 1 ? 420 : 374);
  if (building) {
    const glow = ctx.createRadialGradient(1045,420,40,1045,420,310); glow.addColorStop(0,"rgba(255,185,69,.22)"); glow.addColorStop(1,"rgba(255,185,69,0)"); ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(1045,420,310,0,Math.PI*2); ctx.fill();
    ctx.drawImage(building, 765, 155, 560, 560);
  }
  if (hero) { ctx.save(); roundedRect(ctx, 1275, 510, 190, 250, 26); ctx.clip(); drawCover(ctx, hero, 1275,510,190,250); ctx.restore(); ctx.strokeStyle="#e3b64b"; ctx.lineWidth=3; roundedRect(ctx,1275,510,190,250,26); ctx.stroke(); }
  ctx.fillStyle="rgba(3,8,14,.94)"; roundedRect(ctx, 105, 455, 620, 285, 24); ctx.fill();
  ctx.fillStyle="#f2b741"; ctx.font="800 20px sans-serif"; ctx.fillText("報酬獲得", 140, 505);
  const rewardLines = chunkText(input.rewardName, 16, 2);
  ctx.fillStyle="#fff"; ctx.font="900 30px sans-serif";
  rewardLines.forEach((line, index) => ctx.fillText(line, 140, 550 + index * 37));
  const icons = await Promise.all(premiumRewardIcons.map(loadImage));
  icons.forEach((icon,index)=>{ const x=140+index*132; ctx.fillStyle="#11263b"; roundedRect(ctx,x,620,105,105,16); ctx.fill(); ctx.strokeStyle="rgba(92,175,224,.4)"; ctx.stroke(); if(icon) ctx.drawImage(icon,x+10,630,85,85); });
  ctx.fillStyle="#7dd7ff"; ctx.font="700 20px sans-serif"; ctx.fillText("新しい建物とクルーが都市へ追加されました", 110, 790);
  downloadCanvas(canvas, input.filename);
}

async function exportDistrictBoard(input: { filename: string; nickname: string; completedHere: number; districtName: string }) {
  const { canvas, ctx } = canvasBase();
  const bg = ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,"#06101b"); bg.addColorStop(1,"#0d2740"); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  titleText(ctx, "DISTRICT DEVELOPMENT BOARD", input.districtName, `${input.nickname} · ${input.completedHere}/10 CRAFTS COMPLETE`);
  const images = await Promise.all(premiumBuildings.slice(1,11).map((item)=>loadImage(item.image)));
  premiumBuildings.slice(1,11).forEach((building,index)=>{ const col=index%5,row=Math.floor(index/5),x=70+col*300,y=230+row*300; const unlocked=index<input.completedHere; const card=ctx.createLinearGradient(x,y,x,y+250); card.addColorStop(0,unlocked?"#123859":"#0c1620"); card.addColorStop(1,"#07101a"); ctx.fillStyle=card; roundedRect(ctx,x,y,260,250,24); ctx.fill(); ctx.strokeStyle=unlocked?"#4fc3f7":"#26384a"; ctx.lineWidth=3; ctx.stroke(); const image=images[index]; ctx.globalAlpha=unlocked?1:.18; if(image) ctx.drawImage(image,x+45,y+15,170,155); ctx.globalAlpha=1; ctx.fillStyle=unlocked?"#fff":"#54687a"; ctx.font="800 24px sans-serif"; ctx.fillText(building.name,x+22,y+195); ctx.font="600 17px sans-serif"; ctx.fillText(unlocked?"稼働中":"LOCKED",x+22,y+224); if(unlocked){ctx.fillStyle="#80dcff";ctx.beginPath();ctx.arc(x+230,y+28,8,0,Math.PI*2);ctx.fill();} });
  ctx.fillStyle="#f0b640"; ctx.font="800 22px sans-serif"; ctx.fillText("KEY CRAFT 5000 · DISTRICT BUILD RECORD",70,850);
  downloadCanvas(canvas,input.filename);
}

async function exportHeroBoard(input: { filename: string; nickname: string; completedMissions: number }) {
  const { canvas, ctx } = canvasBase();
  const bg=ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,"#07101d"); bg.addColorStop(1,"#102d53"); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  const unlocked=premiumHeroes.filter((hero)=>input.completedMissions>=hero.unlockMission).length;
  titleText(ctx,"HERO / CREW COLLECTION","英雄・クルー一覧",`${input.nickname} · ${unlocked}/${premiumHeroes.length} RECRUITED`);
  const images=await Promise.all(premiumHeroes.map((hero)=>loadImage(hero.image)));
  premiumHeroes.forEach((hero,index)=>{ const x=70+(index%4)*375,y=220+Math.floor(index/4)*300,w=330,h=250,isUnlocked=input.completedMissions>=hero.unlockMission; const grad=ctx.createLinearGradient(x,y,x,y+h); grad.addColorStop(0,isUnlocked?(hero.rarity==="SSR"?"#a84bd7":"#2f87c9"):"#17202a"); grad.addColorStop(1,"#0a1119"); ctx.fillStyle=grad; roundedRect(ctx,x,y,w,h,24); ctx.fill(); ctx.strokeStyle=isUnlocked?(hero.rarity==="SSR"?"rgba(231,166,255,.6)":"rgba(111,208,255,.55)"):"#273849"; ctx.lineWidth=2; ctx.stroke(); ctx.save(); roundedRect(ctx,x+10,y+10,150,h-20,18); ctx.clip(); ctx.globalAlpha=isUnlocked?1:.22; const img=images[index]; if(img) drawCover(ctx,img,x+10,y+10,150,h-20); ctx.restore(); ctx.globalAlpha=1; ctx.fillStyle=isUnlocked?"#fff":"#566575"; ctx.font="900 28px sans-serif"; ctx.fillText(hero.name,x+180,y+70); ctx.font="700 18px sans-serif"; ctx.fillText(`${hero.rarity} / ${hero.role}`,x+180,y+102); ctx.fillStyle=isUnlocked?"#75dcff":"#384958"; ctx.font="800 18px sans-serif"; ctx.fillText(isUnlocked?`Lv.${Math.max(1,Math.floor((input.completedMissions-hero.unlockMission)/3)+1)}`:`MISSION ${hero.unlockMission}`,x+180,y+145); ctx.fillStyle=isUnlocked?"#f0b640":"#526272"; ctx.font="700 20px sans-serif"; ctx.fillText(isUnlocked?"★★★★★":"🔒 LOCKED",x+180,y+190); });
  ctx.fillStyle="#77d8ff"; ctx.font="800 20px sans-serif"; ctx.fillText("タイピングで仲間が増え、都市が生きていく。",70,850);
  downloadCanvas(canvas,input.filename);
}

export function DeliverablesPage() {
  const { session } = usePlayer();
  const [busy, setBusy] = useState<string | null>(null);
  const currentMission = useMemo(() => session ? catalog.missions.find((mission) => !session.completedMissionIds.includes(mission.id)) ?? catalog.missions[catalog.missions.length - 1] : undefined, [session]);
  const lastCompletedMission = useMemo(() => session?.completedMissionIds.length ? catalog.missions.find((mission) => mission.id === session.completedMissionIds[session.completedMissionIds.length - 1]) : undefined, [session]);
  const anchorMission = lastCompletedMission ?? currentMission;
  const district = anchorMission ? catalog.districts.find((item) => item.id === anchorMission.districtId) : undefined;
  const districtMissions = district ? catalog.missions.filter((mission) => mission.districtId === district.id) : [];
  const completedHere = session ? districtMissions.filter((mission) => session.completedMissionIds.includes(mission.id)).length : 0;

  if (!session || !anchorMission || !district) return <GameGate title="成果物をつくる準備をしよう" />;

  const nickname = session.preferences.nickname ?? session.keyId;
  const base = `KEYCRAFT_${safeName(nickname)}_${String(session.completedMissionIds.length).padStart(3,"0")}`;
  const activeBuildings = premiumBuildings.slice(1, Math.max(2, completedHere + 1));
  const activeHeroes = premiumHeroes.filter((hero) => session.completedMissionIds.length >= hero.unlockMission);

  const run = async (key: string, job: () => Promise<void>) => { setBusy(key); try { await job(); } finally { setBusy(null); } };

  return (
    <div className="premium-page premium-deliverables-page">
      <header className="premium-subheader"><div><span>DELIVERABLE FACTORY</span><h1>納品成果物</h1><p>作業記録ではなく、都市・MISSION・仲間の成長を「作品」として残します。</p></div><div className="premium-roster-count"><strong>{session.completedMissionIds.length}</strong><span>MISSION COMPLETE</span></div></header>

      <section className="premium-product-grid">
        <article className="premium-product-card wide">
          <div className="premium-product-head"><div><span>PRODUCT 01 / MAIN VISUAL</span><h2>現在の街・完成ポスター</h2><p>住宅・道路・照明・クルーまで描き込んだ、納品用メインビジュアル。</p></div><button type="button" disabled={busy !== null} onClick={() => void run("poster", () => exportSettlementPoster({ filename:`${base}_SETTLEMENT_POSTER.png`, nickname, completedMissions:session.completedMissionIds.length, completedPhrases:session.progress.length, districtName:district.name }))}>{busy==="poster"?"生成中…":"1600×900 PNGを作る"}</button></div>
          <div className="premium-product-preview settlement-preview"><PremiumSettlement compact completedMissions={session.completedMissionIds.length} completedPhrases={session.progress.length} nickname={nickname} /></div>
        </article>

        <article className="premium-product-card">
          <div className="premium-product-head"><div><span>PRODUCT 02</span><h2>MISSION CLEAR カード</h2><p>直近で完成した建物・報酬・クルーを記念カードに。</p></div><button type="button" disabled={busy !== null} onClick={() => void run("mission", () => exportMissionCard({ filename:`${base}_MISSION_CLEAR.png`, nickname, missionNumber:anchorMission.number, missionTitle:anchorMission.title, rewardName:anchorMission.reward.name, completedMissions:session.completedMissionIds.length }))}>{busy==="mission"?"生成中…":"PNGを作る"}</button></div>
          <div className="mission-clear-preview"><div className="mission-clear-copy"><span>MISSION CLEAR</span><strong>{String(anchorMission.number).padStart(3,"0")}</strong><h3>{anchorMission.title}</h3><p>{anchorMission.reward.name} 解放</p></div><img src={premiumBuildings[Math.min(10,Math.max(1,completedHere))]!.image} alt="" crossOrigin="anonymous" /></div>
        </article>

        <article className="premium-product-card">
          <div className="premium-product-head"><div><span>PRODUCT 03</span><h2>DISTRICT 発展ボード</h2><p>地区に建った施設と次の解放を、10枠のゲームボードとして保存。</p></div><button type="button" disabled={busy !== null} onClick={() => void run("district", () => exportDistrictBoard({ filename:`${base}_DISTRICT_BOARD.png`, nickname, completedHere, districtName:district.name }))}>{busy==="district"?"生成中…":"PNGを作る"}</button></div>
          <div className="district-board-preview">{premiumBuildings.slice(1,11).map((building,index)=><div key={building.id} className={index<completedHere?"built":"locked"}><img src={building.image} alt="" crossOrigin="anonymous" /><b>{building.name}</b><small>{index<completedHere?"稼働中":"LOCKED"}</small></div>)}</div>
        </article>

        <article className="premium-product-card wide">
          <div className="premium-product-head"><div><span>PRODUCT 04</span><h2>英雄・クルー コレクション</h2><p>タイピングで集まった仲間を、レア度・Lv付きコレクションとして残します。</p></div><button type="button" disabled={busy !== null} onClick={() => void run("heroes", () => exportHeroBoard({ filename:`${base}_HERO_COLLECTION.png`, nickname, completedMissions:session.completedMissionIds.length }))}>{busy==="heroes"?"生成中…":"PNGを作る"}</button></div>
          <div className="hero-board-preview">{premiumHeroes.map((hero)=><div key={hero.id} className={session.completedMissionIds.length>=hero.unlockMission?"unlocked":"locked"}><img src={hero.image} alt="" crossOrigin="anonymous" /><span>{hero.rarity}</span><b>{hero.name}</b><small>{hero.role}</small></div>)}</div>
        </article>
      </section>

      <aside className="premium-delivery-summary"><span>現在の納品内容</span><b>{activeBuildings.length} 建物 / {activeHeroes.length} 英雄 / {session.completedMissionIds.length} MISSION / {session.progress.length} フレーズ</b><p>4種類すべて1600×900 PNG。進捗が増えるたび、都市・施設・仲間・数値が更新されます。</p></aside>
    </div>
  );
}