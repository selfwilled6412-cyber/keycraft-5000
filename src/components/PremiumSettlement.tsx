import { premiumBuildings, premiumHeroes } from "../content/premiumAssets";

interface PremiumSettlementProps {
  completedMissions: number;
  completedPhrases: number;
  nickname?: string | null;
  compact?: boolean;
}

const buildingPositions = [
  { left: 45, top: 45, scale: 1.18, z: 8 },
  { left: 11, top: 24, scale: .78, z: 4 },
  { left: 26, top: 15, scale: .76, z: 3 },
  { left: 66, top: 15, scale: .78, z: 3 },
  { left: 78, top: 29, scale: .72, z: 4 },
  { left: 15, top: 49, scale: .78, z: 7 },
  { left: 72, top: 49, scale: .74, z: 7 },
  { left: 28, top: 64, scale: .72, z: 9 },
  { left: 59, top: 66, scale: .72, z: 9 },
  { left: 5, top: 67, scale: .66, z: 8 },
  { left: 82, top: 68, scale: .64, z: 8 },
];

export function PremiumSettlement({ completedMissions, completedPhrases, nickname, compact = false }: PremiumSettlementProps) {
  const districtProgress = completedMissions === 0 ? 0 : completedMissions % 10 || 10;
  const unlockedHeroes = premiumHeroes.filter((hero) => completedMissions >= hero.unlockMission);
  const heat = Math.max(320, 320 + completedPhrases * 9);
  const wood = Math.max(480, 480 + completedPhrases * 13);

  return (
    <section className={`premium-settlement ${compact ? "is-compact" : ""}`} aria-label={`現在の拠点。完了MISSION ${completedMissions}`}>
      <div className="premium-world-sky" />
      <div className="premium-world-mountains mountain-a" />
      <div className="premium-world-mountains mountain-b" />
      <div className="premium-world-ground">
        <div className="premium-road road-a" />
        <div className="premium-road road-b" />
        <div className="premium-road road-c" />
        <div className="premium-snowfall" />
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
        <small>{districtProgress}/10 CRAFTS BUILT · {completedMissions}/250 MISSIONS · {completedPhrases}/5000 PHRASES</small>
      </div>
      <div className="premium-world-production"><span>🔥 {heat.toLocaleString()}</span><span>🪵 {wood.toLocaleString()}</span><span>❄ -27.3°C</span></div>
    </section>
  );
}
