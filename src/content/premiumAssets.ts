export const PREMIUM_ASSET_LICENSE = {
  city: {
    source: "SpriteCook Free Game Assets / Isometric Buildings",
    license: "CC0-1.0",
    repository: "https://github.com/SpriteCook/spritecook-free-game-assets",
  },
  heroes: {
    source: "SpriteCook Free Game Assets / Detailed Anime Characters",
    license: "CC0-1.0",
    repository: "https://github.com/SpriteCook/spritecook-free-game-assets",
  },
} as const;

const spriteBase = "https://raw.githubusercontent.com/SpriteCook/spritecook-free-game-assets/master";

export interface PremiumBuildingAsset {
  id: string;
  name: string;
  role: string;
  image: string;
  threshold: number;
}

export const premiumBuildings: PremiumBuildingAsset[] = [
  { id: "forge", name: "中央炉心塔", role: "拠点の熱源と中枢", image: `${spriteBase}/examples/isometric-buildings/animated_house_1.webp`, threshold: 0 },
  { id: "lodge", name: "探検家の宿舎", role: "探索隊の出発拠点", image: `${spriteBase}/examples/isometric-buildings/building1.png`, threshold: 1 },
  { id: "workshop", name: "クラフト工房", role: "資材を加工して建設", image: `${spriteBase}/examples/isometric-buildings/building2.png`, threshold: 2 },
  { id: "kitchen", name: "暖炉食堂", role: "住民の体力を回復", image: `${spriteBase}/examples/isometric-buildings/building3.png`, threshold: 3 },
  { id: "clinic", name: "医療室", role: "遠征隊を治療", image: `${spriteBase}/examples/isometric-buildings/building4.png`, threshold: 4 },
  { id: "lumber", name: "伐採管理所", role: "木材資源を管理", image: `${spriteBase}/examples/isometric-buildings/building5.png`, threshold: 5 },
  { id: "hunter", name: "ハンターの家", role: "食料と素材を確保", image: `${spriteBase}/examples/isometric-buildings/building6.png`, threshold: 6 },
  { id: "lab", name: "研究所", role: "新技術を解放", image: `${spriteBase}/examples/isometric-buildings/building7.png`, threshold: 7 },
  { id: "depot", name: "資材倉庫", role: "資源を備蓄", image: `${spriteBase}/examples/isometric-buildings/building8.png`, threshold: 8 },
  { id: "watch", name: "監視塔", role: "吹雪と危険を監視", image: `${spriteBase}/examples/isometric-buildings/building9.png`, threshold: 9 },
  { id: "hall", name: "遠征司令部", role: "地区を完成へ導く", image: `${spriteBase}/examples/isometric-buildings/building10.png`, threshold: 10 },
];

export interface PremiumHeroAsset {
  id: string;
  name: string;
  role: string;
  rarity: "R" | "SR" | "SSR";
  image: string;
  unlockMission: number;
}

export const premiumHeroes: PremiumHeroAsset[] = [
  { id: "rhea", name: "レア", role: "斥候", rarity: "SSR", image: `${spriteBase}/examples/detailed-characters-anime/forest_archer.png`, unlockMission: 1 },
  { id: "garm", name: "ガルム", role: "守備隊長", rarity: "SSR", image: `${spriteBase}/examples/detailed-characters-anime/battleworn_knight.png`, unlockMission: 3 },
  { id: "boris", name: "ボリス", role: "ハンター", rarity: "SR", image: `${spriteBase}/examples/detailed-characters-anime/monster_hunter.png`, unlockMission: 5 },
  { id: "milo", name: "ミロ", role: "交易商", rarity: "SR", image: `${spriteBase}/examples/detailed-characters-anime/gnome_merchant.png`, unlockMission: 7 },
  { id: "nox", name: "ノクス", role: "深層探索", rarity: "SSR", image: `${spriteBase}/examples/detailed-characters-anime/deepsea_knight.png`, unlockMission: 10 },
  { id: "pip", name: "ピップ", role: "工兵", rarity: "R", image: `${spriteBase}/examples/detailed-characters-anime/mouse_knight.png`, unlockMission: 13 },
  { id: "mori", name: "モリ", role: "薬草研究", rarity: "SR", image: `${spriteBase}/examples/detailed-characters-anime/mushroom_druid.png`, unlockMission: 16 },
  { id: "vlad", name: "ヴラド", role: "夜間警備", rarity: "SSR", image: `${spriteBase}/examples/detailed-characters-anime/noble_vampire.png`, unlockMission: 20 },
];

export const premiumRewardIcons = [
  `${spriteBase}/examples/spell-icon-set/icon_1.png`,
  `${spriteBase}/examples/spell-icon-set/icon_2.png`,
  `${spriteBase}/examples/spell-icon-set/icon_3.png`,
  `${spriteBase}/examples/spell-icon-set/icon_4.png`,
];
