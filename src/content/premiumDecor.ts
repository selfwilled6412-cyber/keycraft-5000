const spriteBase = "https://raw.githubusercontent.com/SpriteCook/spritecook-free-game-assets/master/examples/isometric-buildings";

export interface PremiumDecorAsset {
  id: string;
  name: string;
  image: string;
  unlockMission: number;
}

export const premiumDecor: PremiumDecorAsset[] = [
  { id: "residence-a", name: "居住区A", image: `${spriteBase}/animated_house_2.webp`, unlockMission: 2 },
  { id: "residence-b", name: "居住区B", image: `${spriteBase}/animated_house_3.webp`, unlockMission: 4 },
  { id: "support-a", name: "支援街区A", image: `${spriteBase}/building11.png`, unlockMission: 6 },
  { id: "support-b", name: "支援街区B", image: `${spriteBase}/building12.png`, unlockMission: 9 },
  { id: "support-c", name: "支援街区C", image: `${spriteBase}/building13.png`, unlockMission: 12 },
  { id: "support-d", name: "支援街区D", image: `${spriteBase}/building14.png`, unlockMission: 15 },
];
