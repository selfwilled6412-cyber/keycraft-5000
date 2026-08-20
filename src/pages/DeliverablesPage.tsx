import { useMemo, useState } from "react";
import { PremiumSettlement } from "../components/PremiumSettlement";
import { GameGate } from "../components/GameGate";
import { catalog } from "../content/catalog";
import { premiumBuildings, premiumHeroes, premiumRewardIcons } from "../content/premiumAssets";
import { usePlayer } from "../context/PlayerContext";

const W = 1600;
const H = 900;

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
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

async function exportSettlementPoster(input: { filename: string; nickname: string; completedMissions: number; completedPhrases: number; districtName: string }) {
  const { canvas, ctx } = canvasBase();
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, "#07111f"); gradient.addColorStop(.55, "#173657"); gradient.addColorStop(1, "#08111d");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
  const images = await Promise.all(premiumBuildings.slice(0, 9).map((item) => loadImage(item.image)));
  ctx.fillStyle = "#dcecff"; ctx.beginPath(); ctx.ellipse(980, 690, 830, 290, -.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#b4d3ea"; ctx.beginPath(); ctx.ellipse(970, 700, 680, 205, -.08, 0, Math.PI * 2); ctx.fill();
  const coords = [[920,360,360],[560,300,230],[1210,310,230],[650,540,230],[1110,540,230],[390,515,210],[1320,520,210],[800,690,195],[1170,690,195]];
  images.forEach((image, index) => {
    if (!image) return;
    const [x,y,size] = coords[index]!;
    ctx.globalAlpha = index === 0 || input.completedMissions >= index ? 1 : .18;
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
  });
  ctx.globalAlpha = 1;
  const overlay = ctx.createLinearGradient(0, 0, 620, 0); overlay.addColorStop(0, "rgba(2,8,16,.98)"); overlay.addColorStop(1, "rgba(2,8,16,.12)"); ctx.fillStyle = overlay; ctx.fillRect(0,0,720,H);
  titleText(ctx, "KEY CRAFT 5000 / CURRENT SETTLEMENT", `${input.nickname} の極寒都市`, `${input.districtName} · ${input.completedMissions}/250 MISSION · ${input.completedPhrases}/5,000 PHRASES`);
  ctx.fillStyle = "#f4b942"; ctx.font = "900 118px sans-serif"; ctx.fillText(String(input.completedMissions).padStart(3,"0"), 74, 350);
  ctx.fillStyle = "#ffffff"; ctx.font = "800 28px sans-serif"; ctx.fillText("MISSIONS COMPLETE", 80, 395);
  ctx.fillStyle = "rgba(255,255,255,.10)"; roundedRect(ctx, 72, 455, 500, 230, 28); ctx.fill();
  const stats = [["CRAFT", `${input.completedMissions}/250`],["入力", `${input.completedPhrases}/5000`],["都市LEVEL", `${Math.max(1, Math.floor(input.completedPhrases / 100) + 1)}`],["稼働", "良好"]];
  stats.forEach(([label,value], index) => { const x = 105 + (index % 2) * 235; const y = 515 + Math.floor(index / 2) * 95; ctx.fillStyle="#86a1b5"; ctx.font="600 20px sans-serif"; ctx.fillText(label, x, y); ctx.fillStyle="#fff"; ctx.font="900 32px sans-serif"; ctx.fillText(value, x, y+37); });
  ctx.fillStyle="#ffb642"; ctx.font="800 22px sans-serif"; ctx.fillText("打つほど、世界ができていく。", 74, 830);
  downloadCanvas(canvas, input.filename);
}

async function exportMissionCard(input: { filename: string; nickname: string; missionNumber: number; missionTitle: string; rewardName: string; completedMissions: number }) {
  const { canvas, ctx } = canvasBase();
  const bg = ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,"#05080d"); bg.addColorStop(.45,"#122d4f"); bg.addColorStop(1,"#06101c"); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  const building = await loadImage(premiumBuildings[Math.min(10, Math.max(1, input.missionNumber % 11))]!.image);
  const hero = await loadImage(premiumHeroes[Math.min(premiumHeroes.length - 1, Math.floor(input.completedMissions / 3))]!.image);
  ctx.fillStyle="#f3b338"; ctx.fillRect(0,0,W,14); ctx.fillStyle="#55b9ef"; ctx.fillRect(0,H-12,W,12);
  ctx.fillStyle="rgba(255,255,255,.06)"; roundedRect(ctx, 66,60,1468,780,38); ctx.fill();
  ctx.fillStyle="#f2b741"; ctx.font="800 26px sans-serif"; ctx.fillText("MISSION CLEAR", 110, 130);
  ctx.fillStyle="#fff"; ctx.font="900 104px sans-serif"; ctx.fillText(String(input.missionNumber).padStart(3,"0"), 105, 250);
  ctx.font="900 54px sans-serif"; ctx.fillText(input.missionTitle, 110, 325);
  ctx.fillStyle="#a7bdcf"; ctx.font="500 24px sans-serif"; ctx.fillText(`${input.nickname} / KEY CRAFT 5000`, 112, 370);
  if (building) ctx.drawImage(building, 765, 155, 560, 560);
  if (hero) { ctx.save(); roundedRect(ctx, 1275, 510, 190, 250, 26); ctx.clip(); drawCover(ctx, hero, 1275,510,190,250); ctx.restore(); }
  ctx.fillStyle="rgba(3,8,14,.88)"; roundedRect(ctx, 105, 455, 620, 255, 24); ctx.fill();
  ctx.fillStyle="#f2b741"; ctx.font="800 20px sans-serif"; ctx.fillText("報酬獲得", 140, 505); ctx.fillStyle="#fff"; ctx.font="900 36px sans-serif"; ctx.fillText(input.rewardName, 140, 555);
  const icons = await Promise.all(premiumRewardIcons.map(loadImage));
  icons.forEach((icon,index)=>{ const x=140+index*132; ctx.fillStyle="#11263b"; roundedRect(ctx,x,590,105,105,16); ctx.fill(); if(icon) ctx.drawImage(icon,x+10,600,85,85); });
  ctx.fillStyle="#7dd7ff"; ctx.font="700 20px sans-serif"; ctx.fillText("新しい建物とクルーが都市へ追加されました", 110, 790);
  downloadCanvas(canvas, input.filename);
}

async function exportDistrictBoard(input: { filename: string; nickname: string; completedHere: number; districtName: string }) {
  const { canvas, ctx } = canvasBase();
  ctx.fillStyle="#07111f"; ctx.fillRect(0,0,W,H);
  titleText(ctx, "DISTRICT DEVELOPMENT BOARD", input.districtName, `${input.nickname} · ${input.completedHere}/10 CRAFTS COMPLETE`);
  const images = await Promise.all(premiumBuildings.slice(1,11).map((item)=>loadImage(item.image)));
  premiumBuildings.slice(1,11).forEach((building,index)=>{ const col=index%5,row=Math.floor(index/5),x=70+col*300,y=230+row*300; const unlocked=index<input.completedHere; ctx.fillStyle=unlocked?"#102a43":"#0d1620"; roundedRect(ctx,x,y,260,250,24); ctx.fill(); ctx.strokeStyle=unlocked?"#4fc3f7":"#26384a"; ctx.lineWidth=3; ctx.stroke(); const image=images[index]; ctx.globalAlpha=unlocked?1:.18; if(image) ctx.drawImage(image,x+45,y+15,170,155); ctx.globalAlpha=1; ctx.fillStyle=unlocked?"#fff":"#54687a"; ctx.font="800 24px sans-serif"; ctx.fillText(building.name,x+22,y+195); ctx.font="600 17px sans-serif"; ctx.fillText(unlocked?"稼働中":"LOCKED",x+22,y+224); });
  ctx.fillStyle="#f0b640"; ctx.font="800 22px sans-serif"; ctx.fillText("KEY CRAFT 5000 · DISTRICT BUILD RECORD",70,850);
  downloadCanvas(canvas,input.filename);
}

async function exportHeroBoard(input: { filename: string; nickname: string; completedMissions: number }) {
  const { canvas, ctx } = canvasBase();
  const bg=ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,"#07101d"); bg.addColorStop(1,"#102d53"); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  const unlocked=premiumHeroes.filter((hero)=>input.completedMissions>=hero.unlockMission).length;
  titleText(ctx,"HERO / CREW COLLECTION","英雄・クルー一覧",`${input.nickname} · ${unlocked}/${premiumHeroes.length} RECRUITED`);
  const images=await Promise.all(premiumHeroes.map((hero)=>loadImage(hero.image)));
  premiumHeroes.forEach((hero,index)=>{ const x=70+(index%4)*375,y=220+Math.floor(index/4)*300,w=330,h=250,isUnlocked=input.completedMissions>=hero.unlockMission; const grad=ctx.createLinearGradient(x,y,x,y+h); grad.addColorStop(0,isUnlocked?(hero.rarity==="SSR"?"#a84bd7":"#2f87c9"):"#17202a"); grad.addColorStop(1,"#0a1119"); ctx.fillStyle=grad; roundedRect(ctx,x,y,w,h,24); ctx.fill(); ctx.save(); roundedRect(ctx,x+10,y+10,150,h-20,18); ctx.clip(); ctx.globalAlpha=isUnlocked?1:.22; const img=images[index]; if(img) drawCover(ctx,img,x+10,y+10,150,h-20); ctx.restore(); ctx.globalAlpha=1; ctx.fillStyle=isUnlocked?"#fff":"#566575"; ctx.font="900 28px sans-serif"; ctx.fillText(hero.name,x+180,y+70); ctx.font="700 18px sans-serif"; ctx.fillText(`${hero.rarity} / ${hero.role}`,x+180,y+102); ctx.fillStyle=isUnlocked?"#75dcff":"#384958"; ctx.font="800 18px sans-serif"; ctx.fillText(isUnlocked?`Lv.${Math.max(1,Math.floor((input.completedMissions-hero.unlockMission)/3)+1)}`:`MISSION ${hero.unlockMission}`,x+180,y+145); ctx.fillStyle=isUnlocked?"#f0b640":"#526272"; ctx.font="700 20px sans-serif"; ctx.fillText(isUnlocked?"★★★★★":"🔒 LOCKED",x+180,y+190); });
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
          <div className="premium-product-head"><div><span>PRODUCT 01</span><h2>現在の街・完成ポスター</h2><p>納品先に1枚で進捗と世界観が伝わるメイン成果物。</p></div><button type="button" disabled={busy !== null} onClick={() => void run("poster", () => exportSettlementPoster({ filename:`${base}_SETTLEMENT_POSTER.png`, nickname, completedMissions:session.completedMissionIds.length, completedPhrases:session.progress.length, districtName:district.name }))}>{busy==="poster"?"生成中…":"PNGを作る"}</button></div>
          <div className="premium-product-preview settlement-preview"><PremiumSettlement compact completedMissions={session.completedMissionIds.length} completedPhrases={session.progress.length} nickname={nickname} /></div>
        </article>

        <article className="premium-product-card">
          <div className="premium-product-head"><div><span>PRODUCT 02</span><h2>MISSION CLEAR カード</h2><p>直近で完成した建物と報酬を1枚に。</p></div><button type="button" disabled={busy !== null} onClick={() => void run("mission", () => exportMissionCard({ filename:`${base}_MISSION_CLEAR.png`, nickname, missionNumber:anchorMission.number, missionTitle:anchorMission.title, rewardName:anchorMission.reward.name, completedMissions:session.completedMissionIds.length }))}>{busy==="mission"?"生成中…":"PNGを作る"}</button></div>
          <div className="mission-clear-preview"><div className="mission-clear-copy"><span>MISSION CLEAR</span><strong>{String(anchorMission.number).padStart(3,"0")}</strong><h3>{anchorMission.title}</h3><p>{anchorMission.reward.name} 解放</p></div><img src={premiumBuildings[Math.min(10,Math.max(1,completedHere))]!.image} alt="" crossOrigin="anonymous" /></div>
        </article>

        <article className="premium-product-card">
          <div className="premium-product-head"><div><span>PRODUCT 03</span><h2>DISTRICT 発展ボード</h2><p>地区に何が建ち、何が次に解放されるかを可視化。</p></div><button type="button" disabled={busy !== null} onClick={() => void run("district", () => exportDistrictBoard({ filename:`${base}_DISTRICT_BOARD.png`, nickname, completedHere, districtName:district.name }))}>{busy==="district"?"生成中…":"PNGを作る"}</button></div>
          <div className="district-board-preview">{premiumBuildings.slice(1,11).map((building,index)=><div key={building.id} className={index<completedHere?"built":"locked"}><img src={building.image} alt="" crossOrigin="anonymous" /><b>{building.name}</b><small>{index<completedHere?"稼働中":"LOCKED"}</small></div>)}</div>
        </article>

        <article className="premium-product-card wide">
          <div className="premium-product-head"><div><span>PRODUCT 04</span><h2>英雄・クルー コレクション</h2><p>タイピングで集まった仲間を、ゲームのコレクションボードとして残します。</p></div><button type="button" disabled={busy !== null} onClick={() => void run("heroes", () => exportHeroBoard({ filename:`${base}_HERO_COLLECTION.png`, nickname, completedMissions:session.completedMissionIds.length }))}>{busy==="heroes"?"生成中…":"PNGを作る"}</button></div>
          <div className="hero-board-preview">{premiumHeroes.map((hero)=><div key={hero.id} className={session.completedMissionIds.length>=hero.unlockMission?"unlocked":"locked"}><img src={hero.image} alt="" crossOrigin="anonymous" /><span>{hero.rarity}</span><b>{hero.name}</b><small>{hero.role}</small></div>)}</div>
        </article>
      </section>

      <aside className="premium-delivery-summary"><span>現在の納品内容</span><b>{activeBuildings.length} 建物 / {activeHeroes.length} 英雄 / {session.completedMissionIds.length} MISSION / {session.progress.length} フレーズ</b><p>成果物は利用者の進捗が増えるたびに内容が変わります。</p></aside>
    </div>
  );
}
