import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { GameGate } from "../components/GameGate";
import { ProgressRing } from "../components/ProgressRing";
import { RewardIcon } from "../components/RewardIcon";
import { catalog } from "../content/catalog";
import { usePlayer } from "../context/PlayerContext";
import { isMissionAvailable, missionPhraseCount } from "../game/progress";

export function MapPage() {
  const { session } = usePlayer();
  const defaultZone = session
    ? catalog.missions.find((mission) => !session.completedMissionIds.includes(mission.id))?.zoneId ?? "z5"
    : "z1";
  const [selectedZoneId, setSelectedZoneId] = useState(defaultZone);
  const selectedZone = catalog.zones.find((zone) => zone.id === selectedZoneId) ?? catalog.zones[0]!;
  const districts = useMemo(() => catalog.districts.filter((district) => district.zoneId === selectedZone.id), [selectedZone.id]);

  if (!session) return <GameGate title="CRAFT MAPをひらく準備をしよう" />;

  const zoneMissions = catalog.missions.filter((mission) => mission.zoneId === selectedZone.id);
  const completedInZone = zoneMissions.filter((mission) => session.completedMissionIds.includes(mission.id)).length;
  const totalProgress = (session.progress.length / catalog.phrases.length) * 100;

  return (
    <div className="page map-page section-pad">
      <header className="page-heading map-heading">
        <div>
          <p className="eyebrow">DATA-DRIVEN WORLD</p>
          <h1>CRAFT MAP</h1>
          <p>完成したMISSIONから、あなたの世界を何度でも組み立てます。</p>
        </div>
        <div className="map-overall"><ProgressRing value={totalProgress} label="WORLD" size={104} /><div><span>完成した建物</span><strong>{session.completedMissionIds.length}<small> / 250</small></strong></div></div>
      </header>

      <div className="zone-tabs" role="tablist" aria-label="ZONEを選ぶ">
        {catalog.zones.map((zone) => (
          <button key={zone.id} type="button" role="tab" aria-selected={zone.id === selectedZone.id} className={zone.id === selectedZone.id ? "active" : ""} onClick={() => setSelectedZoneId(zone.id)} style={{ "--zone": zone.accent } as CSSProperties}>
            <span>{String(zone.number).padStart(2, "0")}</span><b>{zone.name}</b><small>{zone.japaneseName}</small>
          </button>
        ))}
      </div>

      <section className="zone-map" style={{ "--zone": selectedZone.accent } as CSSProperties}>
        <div className="zone-map-topbar">
          <div><span>ZONE {selectedZone.number}</span><h2>{selectedZone.name}</h2><p>{selectedZone.description}</p></div>
          <strong>{completedInZone}<small> / 50 CRAFTS</small></strong>
        </div>
        <div className="district-map-grid">
          {districts.map((district, districtIndex) => {
            const missions = catalog.missions.filter((mission) => mission.districtId === district.id);
            const completed = missions.filter((mission) => session.completedMissionIds.includes(mission.id)).length;
            return (
              <article className="district-map" key={district.id}>
                <header><div><span>DISTRICT {String(district.number).padStart(2, "0")}</span><h3>{district.name}</h3></div><b>{completed}/10</b></header>
                <div className="map-canvas" style={{ "--district-index": districtIndex } as CSSProperties}>
                  <svg className="road-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M8 22C27 4 39 38 57 24S80 4 94 20M7 73c18-28 34 2 48-15s29-4 40 18" /><path d="M20 8c14 28 0 47 20 78M74 8c-8 27 10 48-5 84" /></svg>
                  {missions.map((mission) => {
                    const complete = session.completedMissionIds.includes(mission.id);
                    const available = isMissionAvailable(mission, session.completedMissionIds);
                    const count = missionPhraseCount(mission.id, session.progress);
                    const style = { left: `${mission.coordinates.x}%`, top: `${mission.coordinates.y}%` };
                    return available ? (
                      <Link key={mission.id} className={`map-node ${complete ? "complete" : "available"}`} to={`/play?mission=${mission.id}`} style={style} aria-label={`${mission.title} ${complete ? "完成" : `${count}/20`}`}>
                        <RewardIcon id={mission.reward.id} kind={mission.reward.kind} locked={!complete} size={48} />
                        <span>{mission.number}</span>
                      </Link>
                    ) : (
                      <span key={mission.id} className="map-node locked-node" style={style} aria-label={`MISSION ${mission.number} 未解放`}><i>·</i><span>{mission.number}</span></span>
                    );
                  })}
                </div>
                <footer>{completed === 10 ? <strong>地区完成！</strong> : <span>次の完成まで {Math.max(0, 10 - completed)} CRAFTS</span>}<Link to={`/missions?zone=${selectedZone.id}`}>一覧を見る →</Link></footer>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
