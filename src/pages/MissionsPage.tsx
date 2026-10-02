import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GameGate } from "../components/GameGate";
import { RewardIcon } from "../components/RewardIcon";
import { catalog, districtById } from "../content/catalog";
import { usePlayer } from "../context/PlayerContext";
import { isMissionAvailable, missionPhraseCount, nextIncompleteMission } from "../game/progress";

type Filter = "all" | "available" | "complete";

export function MissionsPage() {
  const { session } = usePlayer();
  const [params] = useSearchParams();
  const [zoneId, setZoneId] = useState(params.get("zone") ?? "all");
  const requestedFilter = params.get("filter");
  const [filter, setFilter] = useState<Filter>(requestedFilter === "complete" || requestedFilter === "all" ? requestedFilter : "available");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filtered = useMemo(() => catalog.missions.filter((mission) => {
    if (zoneId !== "all" && mission.zoneId !== zoneId) return false;
    if (!session) return true;
    if (filter === "complete") return session.completedMissionIds.includes(mission.id);
    if (filter === "available") return isMissionAvailable(mission, session.completedMissionIds) && !session.completedMissionIds.includes(mission.id);
    return true;
  }), [filter, session, zoneId]);

  if (!session) return <GameGate title="MISSIONを始める準備をしよう" />;

  const recommended = nextIncompleteMission(catalog, session.completedMissionIds, session.preferences.genres);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((Math.min(page, pages) - 1) * pageSize, Math.min(page, pages) * pageSize);

  return (
    <div className="page missions-page section-pad">
      <header className="page-heading">
        <div><p className="eyebrow">250 PURPOSEFUL MISSIONS</p><h1>MISSION</h1><p>すべてのMISSIONに、完成させる場所とクラフト報酬があります。</p></div>
      </header>

      {recommended ? (
        <section className="recommend-card">
          <RewardIcon id={recommended.reward.id} kind={recommended.reward.kind} locked size={88} />
          <div><p className="eyebrow">NEXT RECOMMEND</p><h2>{recommended.title}</h2><p>{recommended.description}</p><span>{districtById.get(recommended.districtId)?.name} ・ {recommended.genre}</span></div>
          <Link className="button primary" to={`/play?mission=${recommended.id}`}>このMISSIONへ →</Link>
        </section>
      ) : (
        <section className="recommend-card all-clear-recommend">
          <RewardIcon id={catalog.missions[catalog.missions.length - 1]!.reward.id} kind={catalog.missions[catalog.missions.length - 1]!.reward.kind} size={88} />
          <div><p className="eyebrow">ALL 250 COMPLETE</p><h2>KEY CRAFT 5000 完成！</h2><p>5,000フレーズと250 MISSIONをすべてクラフトしました。</p><span>完成済みMISSIONは何度でも練習できます。</span></div>
          <Link className="button primary" to="/complete">完成記録を見る →</Link>
        </section>
      )}

      <div className="mission-controls">
        <label>ZONE<select value={zoneId} onChange={(event) => { setZoneId(event.target.value); setPage(1); }}><option value="all">すべてのZONE</option>{catalog.zones.map((zone) => <option key={zone.id} value={zone.id}>ZONE {zone.number} — {zone.japaneseName}</option>)}</select></label>
        <div className="segmented" aria-label="MISSIONの表示を切り替える">
          {(["available", "complete", "all"] as const).map((item) => <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => { setFilter(item); setPage(1); }}>{item === "available" ? "挑戦できる" : item === "complete" ? "完成済み" : "すべて"}</button>)}
        </div>
        <span>{filtered.length} MISSIONS</span>
      </div>

      <div className="mission-list">
        {visible.map((mission) => {
          const complete = session.completedMissionIds.includes(mission.id);
          const available = isMissionAvailable(mission, session.completedMissionIds);
          const count = missionPhraseCount(mission.id, session.progress);
          return (
            <article key={mission.id} className={`${complete ? "complete" : ""} ${!available ? "locked" : ""}`}>
              <span className="mission-number">{String(mission.number).padStart(3, "0")}</span>
              <RewardIcon id={mission.reward.id} kind={mission.reward.kind} locked={!complete} size={66} />
              <div className="mission-copy"><small>{districtById.get(mission.districtId)?.name} ・ LEVEL {mission.level}</small><h2>{mission.title}</h2><p>{mission.description}</p></div>
              <div className="mission-status"><span><i style={{ width: `${(count / 20) * 100}%` }} /></span><b>{complete ? "COMPLETE" : `${count} / 20`}</b></div>
              {available ? <Link className="round-link" to={`/play?mission=${mission.id}${complete ? "&practice=1" : ""}`} aria-label={`${mission.title}${complete ? "を練習する" : "を開く"}`}>{complete ? "↻" : "→"}</Link> : <span className="round-link disabled" aria-label="前のMISSIONを完成させると開きます">⌁</span>}
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="no-results">条件に合うMISSIONはまだありません。</p>}
      {pages > 1 && <nav className="pagination" aria-label="ページ送り"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>← 前へ</button><span>{Math.min(page, pages)} / {pages}</span><button type="button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>次へ →</button></nav>}
    </div>
  );
}
