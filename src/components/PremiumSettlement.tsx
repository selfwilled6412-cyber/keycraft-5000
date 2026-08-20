import { premiumBuildings, premiumHeroes } from "../content/premiumAssets";
import { premiumDecor } from "../content/premiumDecor";

interface PremiumSettlementProps {
  completedMissions: number;
  completedPhrases: number;
  nickname?: string | null;
  compact?: boolean;
}

const buildingPositions = [
  { left: 45, top: 45, scale: 1.18, z: 8 },
  { left: 9, top: 22, scale: .76, z: 4 },
  { left: 25, top: 14, scale: .73, z: 3 },
  { left: 66, top: 14, scale: .75, z: 3 },
  { left: 80, top: 27, scale: .70, z: 4 },
  { left: 14, top: 48, scale: .75, z: 7 },
  { left: 72, top: 48, scale: .71, z: 7 },
  { left: 27, top: 65, scale: .68, z: 9 },
  { left: 59, top: 66, scale: .69, z: 9 },
  { left: 4, top: 68, scale: .62, z: 8 },
  { left: 84, top: 68, scale: .62, z: 8 },
] as const;

const decorPositions = [
  { left: 34, top: 27, scale: .56, z: 2, tone: "back" },
  { left: 56, top: 27, scale: .54, z: 2, tone: "back" },
  { left: 36, top: 47, scale: .58, z: 6, tone: "mid" },
  { left: 58, top: 48, scale: .56, z: 6, tone: "mid" },
  { left: 20, top: 73, scale: .54, z: 10, tone: "front" },
  { left: 73, top: 74, scale: .52, z: 10, tone: "front" },
] as const;

const townLights = [
  { left: 31, top: 39, delay: 0 }, { left: 39, top: 36, delay: .3 },
  { left: 54, top: 36, delay: .6 }, { left: 63, top: 41, delay: .9 },
  { left: 31, top: 57, delay: 1.2 }, { left: 40, top: 61, delay: 1.5 },
  { left: 53, top: 59, delay: 1.8 }, { left: 65, top: 57, delay: 2.1 },
  { left: 21, top: 57, delay: 2.4 }, { left: 76, top: 57, delay: 2.7 },
] as const;

export function PremiumSettlement({ completedMissions, completedPhrases, nickname, compact = false }: PremiumSettlementProps) {
  const districtProgress = completedMissions === 0 ? 0 : completedMissions % 10 || 10;
  const unlockedHeroes = premiumHeroes.filter((hero) => completedMissions >= hero.unlockMission);
  const heat = Math.max(320, 320 + completedPhrases * 9);
  const wood = Math.max(480, 480 + completedPhrases * 13);
  const decorUnlocked = premiumDecor.filter((item) => completedMissions >= item.unlockMission);

  return (
    <section className={`premium-settlement ${compact ? "is-compact" : ""}`} aria-label={`現在の拠点。完了MISSION ${completedMissions}`}>
      <div className="premium-world-sky" />
      <div className="premium-world-mountains mountain-a" />
      <div className="premium-world-mountains mountain-b" />
      <div className="premium-world-ground">
        <div className="premium-road road-a" />
        <div className="premium-road road-b" />
        <div className="premium-road road-c" />
        <div className="premium-road road-d" />
        <div className="premium-snowfall" />

        {decorUnlocked.map((decor, index) => {
          const position = decorPositions[index] ?? decorPositions[decorPositions.length - 1]!;
          return (
            <div
              key={decor.id}
              className={`premium-city-fill premium-city-fill-${position.tone}`}
              style={{ left: `${position.left}%`, top: `${position.top}%`, zIndex: position.z, transform: `translate(-50%, -50%) scale(${position.scale})` }}
              title={decor.name}
            >
              <img src={decor.image} alt="" loading="eager" crossOrigin="anonymous" />
            </div>
          );
        })}

        {premiumBuildings.map((building, index) => {
          const position = buildingPositions[index] ?? buildingPositions[buildingPositions.length - 1]!;
          const unlocked = building.threshold === 0 || districtProgress >= building.threshold;
          return (
            <div
              key={building.id}
              className={`premium-building ${unlocked ? "is-built" : "is-locked"} ${building.id === "forge" ? "is-forge" : ""}`}
              style={{ left: `${position.left}%`, top: `${position.top}%`, zIndex: position.z, transform: `translate(-50%, -50%) scale(${position.scale})` }}
            >
              <img src={building.image} alt="" loading="eager" crossOrigin="anonymous" />
              <div className="premium-building-name"><b>{building.name}</b><span>{unlocked ? `Lv.${Math.max(1, Math.min(9, Math.ceil(completedMissions / 3)))}` : `あと${Math.max(1, building.threshold - districtProgress)}MISSION`}</span></div>
              {!unlocked && <div className="premium-building-lock">🔒</div>}
            </div>
          );
        })}

        <div className="premium-town-lights" aria-hidden="true">
          {townLights.slice(0, Math.max(2, Math.min(townLights.length, 2 + Math.floor(completedMissions / 2)))).map((light, index) => (
            <i key={`${light.left}-${light.top}`} style={{ left: `${light.left}%`, top: `${light.top}%`, animationDelay: `${light.delay}s` }} data-index={index} />
          ))}
        </div>

        <div className="premium-world-beacon" aria-hidden="true"><i /><i /><i /></div>

        {unlockedHeroes.slice(0, 5).map((hero, index) => (
          <div key={hero.id} className={`premium-crew-marker crew-${index + 1}`} title={`${hero.name} / ${hero.role}`}>
            <img src={hero.image} alt="" crossOrigin="anonymous" />
            <span>{hero.name}</span>
          </div>
        ))}
      </div>

      <div className="premium-world-vignette" />
      <div className="premium-world-title">
        <span>FROST FRONTIER / DISTRICT {String(Math.floor(completedMissions / 10) + 1).padStart(2, "0")}</span>
        <strong>{nickname ? `${nickname} の拠点` : "極寒都市 KEY CRAFT"}</strong>
        <small>{districtProgress}/10 CRAFTS BUILT · {decorUnlocked.length} SUPPORT BLOCKS · {completedMissions}/250 MISSIONS · {completedPhrases}/5000 PHRASES</small>
      </div>
      <div className="premium-world-production"><span>🔥 {heat.toLocaleString()}</span><span>🪵 {wood.toLocaleString()}</span><span>❄ -27.3°C</span></div>
    </section>
  );
}
