import { catalog } from "../content/catalog";
import { premiumBuildings, premiumHeroes, premiumRewardIcons } from "../content/premiumAssets";
import type { Mission } from "../content/types";

const W = 1600;
const H = 900;

export type AutoArtifactKind = "current_settlement" | "mission_clear" | "district_complete" | "hero_unlock";

export interface AutoArtifact {
  kind: AutoArtifactKind;
  eventKey: string;
  filename: string;
  metadata: Record<string, unknown>;
  blob: Blob;
}

interface AutoArtifactInput {
  keyId: string;
  nickname: string;
  mission: Mission;
  completedMissionIdsBefore: string[];
  completedPhrasesAfter: number;
}

const safeName = (value: string) => value.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "PLAYER";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("成果物キャンバスを作成できませんでした");
  return { canvas, ctx };
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, w, h);
}

function drawSnow(ctx: CanvasRenderingContext2D, count = 110) {
  ctx.fillStyle = "rgba(255,255,255,.72)";
  for (let index = 0; index < count; index += 1) {
    const x = (index * 137 + 83) % W;
    const y = (index * 211 + 29) % H;
    const radius = 1 + (index % 4) * .65;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  const glow = ctx.createRadialGradient(x, y - 32 * scale, 2, x, y - 32 * scale, 55 * scale);
  glow.addColorStop(0, "rgba(255,190,83,.9)");
  glow.addColorStop(.35, "rgba(255,150,45,.28)");
  glow.addColorStop(1, "rgba(255,130,30,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - 60 * scale, y - 95 * scale, 120 * scale, 120 * scale);
  ctx.fillStyle = "#273747";
  ctx.fillRect(x - 4 * scale, y - 42 * scale, 8 * scale, 44 * scale);
  ctx.fillStyle = "#ffc35a";
  ctx.beginPath();
  ctx.arc(x, y - 45 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeader(ctx: CanvasRenderingContext2D, kicker: string, title: string, subtitle: string) {
  ctx.fillStyle = "#72ddff";
  ctx.font = "800 22px sans-serif";
  ctx.fillText(kicker, 70, 72);
  ctx.fillStyle = "#fff";
  ctx.font = "900 56px sans-serif";
  ctx.fillText(title, 70, 137);
  ctx.fillStyle = "#a7bfd2";
  ctx.font = "600 23px sans-serif";
  ctx.fillText(subtitle, 72, 178);
}

async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNGを生成できませんでした")), "image/png");
  });
}

async function makeSettlement(input: AutoArtifactInput, completedAfter: string[], completedHere: number): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#050c15");
  bg.addColorStop(.48, "#153b61");
  bg.addColorStop(1, "#07111d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#d9e9f4";
  ctx.beginPath();
  ctx.ellipse(1030, 700, 920, 305, -.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c3d9e8";
  ctx.beginPath();
  ctx.ellipse(1035, 700, 780, 225, -.07, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#748b98";
  ctx.lineWidth = 70;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(600, 735);
  ctx.bezierCurveTo(780, 600, 1040, 615, 1485, 540);
  ctx.stroke();
  ctx.strokeStyle = "#aebdc5";
  ctx.lineWidth = 50;
  ctx.stroke();

  const buildingImages = await Promise.all(premiumBuildings.map((item) => loadImage(item.image)));
  const positions = [
    [1050, 345, 380], [640, 310, 250], [1325, 300, 250], [735, 525, 245], [1160, 520, 245],
    [500, 530, 225], [1410, 505, 225], [875, 680, 215], [1110, 695, 215], [1325, 690, 205], [620, 705, 205],
  ] as const;
  const unlockCount = Math.min(premiumBuildings.length, Math.max(2, completedHere + 1));
  buildingImages.forEach((image, index) => {
    if (!image) return;
    const point = positions[index];
    if (!point) return;
    const [x, y, size] = point;
    ctx.save();
    ctx.globalAlpha = index < unlockCount ? 1 : .18;
    if (index >= unlockCount) ctx.filter = "grayscale(1) brightness(.62)";
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  });

  const supportImages = await Promise.all([
    premiumBuildings[1]?.image,
    premiumBuildings[2]?.image,
    premiumBuildings[3]?.image,
    premiumBuildings[4]?.image,
  ].filter((value): value is string => Boolean(value)).map(loadImage));
  const supportPositions = [[850, 330, 155], [1185, 360, 150], [975, 565, 145], [1450, 330, 145], [780, 770, 130], [1240, 775, 135]] as const;
  supportPositions.forEach(([x, y, size], index) => {
    const image = supportImages[index % Math.max(1, supportImages.length)];
    if (!image) return;
    ctx.save();
    ctx.globalAlpha = .82;
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  });

  const lampPositions = [[690, 585], [835, 570], [1010, 585], [1215, 600], [1390, 625], [925, 735], [1140, 750]] as const;
  lampPositions.forEach(([x, y], index) => drawLamp(ctx, x, y, index % 2 ? .9 : 1.08));

  const unlockedHeroes = premiumHeroes.filter((hero) => completedAfter.length >= hero.unlockMission).slice(-5);
  const heroImages = await Promise.all(unlockedHeroes.map((hero) => loadImage(hero.image)));
  heroImages.forEach((image, index) => {
    if (!image) return;
    const coords = [[775, 625], [995, 625], [1180, 650], [1350, 715], [870, 760]] as const;
    const point = coords[index];
    if (!point) return;
    const [x, y] = point;
    ctx.save();
    roundedRect(ctx, x - 34, y - 72, 68, 92, 18);
    ctx.clip();
    drawCover(ctx, image, x - 34, y - 72, 68, 92);
    ctx.restore();
  });

  const panel = ctx.createLinearGradient(0, 0, 690, 0);
  panel.addColorStop(0, "rgba(3,9,16,.99)");
  panel.addColorStop(.8, "rgba(4,13,23,.92)");
  panel.addColorStop(1, "rgba(4,13,23,.08)");
  ctx.fillStyle = panel;
  ctx.fillRect(0, 0, 760, H);
  drawHeader(ctx, "KEY CRAFT 5000 / AUTO DELIVERABLE", `${input.nickname} の極寒都市`, `MISSION ${String(completedAfter.length).padStart(3, "0")} · ${input.completedPhrasesAfter.toLocaleString()}/5,000 PHRASES`);

  ctx.fillStyle = "#f5b83e";
  ctx.font = "900 122px sans-serif";
  ctx.fillText(String(completedAfter.length).padStart(3, "0"), 72, 360);
  ctx.fillStyle = "#fff";
  ctx.font = "800 27px sans-serif";
  ctx.fillText("MISSIONS COMPLETE", 79, 402);

  ctx.fillStyle = "rgba(5,18,30,.94)";
  roundedRect(ctx, 70, 455, 510, 245, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(91,190,240,.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
  const stats = [
    ["DISTRICT CRAFT", `${completedHere}/10`],
    ["PHRASES", `${input.completedPhrasesAfter}/5000`],
    ["CITY LEVEL", String(Math.max(1, Math.floor(input.completedPhrasesAfter / 100) + 1))],
    ["CREW", String(unlockedHeroes.length)],
  ] as const;
  stats.forEach(([label, value], index) => {
    const x = 105 + (index % 2) * 240;
    const y = 520 + Math.floor(index / 2) * 102;
    ctx.fillStyle = "#85a5bb";
    ctx.font = "700 18px sans-serif";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#fff";
    ctx.font = "900 34px sans-serif";
    ctx.fillText(value, x, y + 40);
  });
  ctx.fillStyle = "#ffc34f";
  ctx.font = "800 22px sans-serif";
  ctx.fillText("打つほど、世界ができていく。", 72, 830);
  drawSnow(ctx);
  return toBlob(canvas);
}

async function makeMissionClear(input: AutoArtifactInput, completedAfter: string[]): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#05080d");
  bg.addColorStop(.5, "#16385e");
  bg.addColorStop(1, "#06101b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f4b83f";
  ctx.fillRect(0, 0, W, 14);
  ctx.fillStyle = "#56c9ff";
  ctx.fillRect(0, H - 12, W, 12);

  ctx.fillStyle = "rgba(255,255,255,.055)";
  roundedRect(ctx, 65, 58, 1470, 782, 38);
  ctx.fill();
  ctx.fillStyle = "#f4b83f";
  ctx.font = "900 28px sans-serif";
  ctx.fillText("MISSION CLEAR", 108, 130);
  ctx.fillStyle = "#fff";
  ctx.font = "900 108px sans-serif";
  ctx.fillText(String(input.mission.number).padStart(3, "0"), 105, 250);
  ctx.font = "900 46px sans-serif";
  const title = input.mission.title.length > 15 ? `${input.mission.title.slice(0, 14)}…` : input.mission.title;
  ctx.fillText(title, 108, 320);
  ctx.fillStyle = "#a9bfd0";
  ctx.font = "600 22px sans-serif";
  ctx.fillText(`${input.nickname} / ${completedAfter.length} MISSIONS COMPLETE`, 110, 365);

  const building = await loadImage(premiumBuildings[Math.min(premiumBuildings.length - 1, Math.max(1, input.mission.number % premiumBuildings.length))]!.image);
  if (building) ctx.drawImage(building, 730, 120, 625, 625);
  const hero = premiumHeroes.filter((item) => completedAfter.length >= item.unlockMission).at(-1);
  const heroImage = hero ? await loadImage(hero.image) : null;
  if (heroImage) {
    ctx.save();
    roundedRect(ctx, 1280, 505, 190, 255, 25);
    ctx.clip();
    drawCover(ctx, heroImage, 1280, 505, 190, 255);
    ctx.restore();
  }

  ctx.fillStyle = "rgba(3,9,16,.96)";
  roundedRect(ctx, 105, 440, 600, 305, 25);
  ctx.fill();
  ctx.fillStyle = "#f4b83f";
  ctx.font = "800 21px sans-serif";
  ctx.fillText("報酬獲得", 140, 493);
  ctx.fillStyle = "#fff";
  ctx.font = "900 31px sans-serif";
  ctx.fillText(input.mission.reward.name.slice(0, 22), 140, 540);
  const rewardImages = await Promise.all(premiumRewardIcons.map(loadImage));
  rewardImages.forEach((image, index) => {
    const x = 140 + index * 132;
    ctx.fillStyle = "#11283e";
    roundedRect(ctx, x, 600, 106, 106, 17);
    ctx.fill();
    if (image) ctx.drawImage(image, x + 10, 610, 86, 86);
  });
  ctx.fillStyle = "#75d9ff";
  ctx.font = "700 20px sans-serif";
  ctx.fillText("都市に新しい建物と進行記録が追加されました", 110, 793);
  drawSnow(ctx, 70);
  return toBlob(canvas);
}

async function makeDistrictComplete(input: AutoArtifactInput, completedAfter: string[], districtName: string): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  ctx.fillStyle = "#07111f";
  ctx.fillRect(0, 0, W, H);
  drawHeader(ctx, "DISTRICT COMPLETE / AUTO DELIVERABLE", districtName, `${input.nickname} · 10/10 CRAFTS · ${completedAfter.length} MISSIONS COMPLETE`);
  const images = await Promise.all(premiumBuildings.slice(1, 11).map((item) => loadImage(item.image)));
  premiumBuildings.slice(1, 11).forEach((building, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    const x = 70 + col * 300;
    const y = 225 + row * 300;
    ctx.fillStyle = "#102c47";
    roundedRect(ctx, x, y, 260, 250, 24);
    ctx.fill();
    ctx.strokeStyle = "#55c9ff";
    ctx.lineWidth = 3;
    ctx.stroke();
    const image = images[index];
    if (image) ctx.drawImage(image, x + 45, y + 12, 170, 158);
    ctx.fillStyle = "#fff";
    ctx.font = "800 23px sans-serif";
    ctx.fillText(building.name, x + 22, y + 195);
    ctx.fillStyle = "#78e0ff";
    ctx.font = "700 17px sans-serif";
    ctx.fillText("COMPLETE / 稼働中", x + 22, y + 225);
  });
  ctx.fillStyle = "#f0b640";
  ctx.font = "800 22px sans-serif";
  ctx.fillText("KEY CRAFT 5000 · DISTRICT BUILD RECORD", 70, 850);
  return toBlob(canvas);
}

async function makeHeroUnlock(input: AutoArtifactInput, hero: (typeof premiumHeroes)[number], completedAfter: string[]): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#07101d");
  bg.addColorStop(.55, hero.rarity === "SSR" ? "#4d226e" : "#164c78");
  bg.addColorStop(1, "#081523");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f0b640";
  ctx.fillRect(0, 0, W, 14);
  drawHeader(ctx, "NEW HERO / CREW UNLOCKED", hero.name, `${hero.rarity} · ${hero.role} · MISSION ${String(hero.unlockMission).padStart(3, "0")}`);
  const image = await loadImage(hero.image);
  if (image) {
    ctx.save();
    roundedRect(ctx, 815, 100, 620, 700, 46);
    ctx.clip();
    drawCover(ctx, image, 815, 100, 620, 700);
    ctx.restore();
  }
  ctx.fillStyle = "rgba(3,10,18,.94)";
  roundedRect(ctx, 70, 250, 620, 430, 32);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 84px sans-serif";
  ctx.fillText(hero.rarity, 112, 370);
  ctx.fillStyle = "#7bdefe";
  ctx.font = "800 25px sans-serif";
  ctx.fillText("CITY CREW JOINED", 115, 420);
  ctx.fillStyle = "#fff";
  ctx.font = "900 42px sans-serif";
  ctx.fillText(hero.name, 112, 492);
  ctx.fillStyle = "#b4c7d6";
  ctx.font = "600 25px sans-serif";
  ctx.fillText(`${input.nickname} の都市へ加入`, 112, 540);
  ctx.fillText(`${completedAfter.length} MISSIONS COMPLETE`, 112, 585);
  ctx.fillStyle = "#f0b640";
  ctx.font = "800 22px sans-serif";
  ctx.fillText("タイピングで仲間が増え、都市が生きていく。", 112, 640);
  drawSnow(ctx, 60);
  return toBlob(canvas);
}

export async function createAutomaticMissionArtifacts(input: AutoArtifactInput): Promise<AutoArtifact[]> {
  const completedAfter = input.completedMissionIdsBefore.includes(input.mission.id)
    ? [...input.completedMissionIdsBefore]
    : [...input.completedMissionIdsBefore, input.mission.id];
  const district = catalog.districts.find((item) => item.id === input.mission.districtId);
  const districtMissions = catalog.missions.filter((item) => item.districtId === input.mission.districtId);
  const completedHere = districtMissions.filter((item) => completedAfter.includes(item.id)).length;
  const player = safeName(input.nickname || input.keyId);
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const missionNo = String(input.mission.number).padStart(3, "0");
  const artifacts: AutoArtifact[] = [];

  const [settlementBlob, missionBlob] = await Promise.all([
    makeSettlement(input, completedAfter, completedHere),
    makeMissionClear(input, completedAfter),
  ]);
  artifacts.push({
    kind: "current_settlement",
    eventKey: "current-settlement",
    filename: `KEYCRAFT_${player}_CURRENT_SETTLEMENT.png`,
    metadata: { missionId: input.mission.id, missionNumber: input.mission.number, completedMissions: completedAfter.length, completedPhrases: input.completedPhrasesAfter, districtId: input.mission.districtId },
    blob: settlementBlob,
  });
  artifacts.push({
    kind: "mission_clear",
    eventKey: `mission:${input.mission.id}`,
    filename: `KEYCRAFT_${player}_${date}_MISSION${missionNo}_CLEAR.png`,
    metadata: { missionId: input.mission.id, missionNumber: input.mission.number, title: input.mission.title, reward: input.mission.reward.name, districtId: input.mission.districtId },
    blob: missionBlob,
  });

  if (completedHere === 10 && district) {
    artifacts.push({
      kind: "district_complete",
      eventKey: `district:${district.id}`,
      filename: `KEYCRAFT_${player}_${date}_${district.id.toUpperCase()}_COMPLETE.png`,
      metadata: { districtId: district.id, districtName: district.name, completedMissions: completedAfter.length },
      blob: await makeDistrictComplete(input, completedAfter, district.name),
    });
  }

  const newlyUnlocked = premiumHeroes.filter((hero) => hero.unlockMission === completedAfter.length);
  for (const hero of newlyUnlocked) {
    artifacts.push({
      kind: "hero_unlock",
      eventKey: `hero:${hero.id}`,
      filename: `KEYCRAFT_${player}_${date}_HERO_${hero.id.toUpperCase()}_UNLOCK.png`,
      metadata: { heroId: hero.id, heroName: hero.name, rarity: hero.rarity, role: hero.role, unlockMission: hero.unlockMission },
      blob: await makeHeroUnlock(input, hero, completedAfter),
    });
  }

  return artifacts;
}
