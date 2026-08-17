import { Link } from "react-router-dom";
import { GameGate } from "../components/GameGate";
import { ProgressRing } from "../components/ProgressRing";
import { RewardIcon } from "../components/RewardIcon";
import { catalog, missionById } from "../content/catalog";
import { usePlayer } from "../context/PlayerContext";
import { aggregateMissKeys, completedDistrictCount, nextMission } from "../game/progress";

export function ProgressPage() {
  const { session } = usePlayer();
  if (!session) return <GameGate title="進み具合を記録しよう" />;

  const phraseCount = session.progress.length;
  const missionCount = session.completedMissionIds.length;
  const districtCount = completedDistrictCount(catalog, session.completedMissionIds);
  const accuracy = phraseCount === 0 ? 100 : session.progress.reduce((sum, item) => sum + item.accuracy, 0) / phraseCount;
  const keystrokes = session.progress.reduce((sum, item) => sum + item.keystrokes, 0);
  const missKeys = aggregateMissKeys(session.progress).slice(0, 5);
  const recommended = nextMission(catalog, session.completedMissionIds, session.preferences.genres);
  const recent = [...session.completedMissionIds].reverse().slice(0, 6).map((id) => missionById.get(id)).filter(Boolean);

  return (
    <div className="page progress-page section-pad">
      <header className="page-heading">
        <div><p className="eyebrow">YOUR CRAFT RECORD</p><h1>進み具合</h1><p>速さより、積み重ねた完成と正確さを大切にします。</p></div>
        <div className="record-key"><span>あなたのKEY ID</span><strong>{session.keyId}</strong><small>別のPCで「つづきから」に入力できます</small></div>
      </header>

      <section className="stats-grid">
        <article className="main-stat"><ProgressRing value={(phraseCount / 5000) * 100} label="WORLD" size={128} /><div><span>入力したフレーズ</span><strong>{phraseCount.toLocaleString()}<small> / 5,000</small></strong><p>ひとつずつ、世界が形になっています。</p></div></article>
        <article><span className="stat-icon">◇</span><small>完成MISSION</small><strong>{missionCount}<em> / 250</em></strong></article>
        <article><span className="stat-icon">▦</span><small>完成DISTRICT</small><strong>{districtCount}<em> / 25</em></strong></article>
        <article><span className="stat-icon">◎</span><small>平均正確さ</small><strong>{accuracy.toFixed(1)}<em>%</em></strong></article>
        <article><span className="stat-icon">⌨</span><small>積み重ねた入力</small><strong>{keystrokes.toLocaleString()}<em> keys</em></strong></article>
      </section>

      <div className="progress-columns">
        <section className="recent-crafts panel">
          <header><div><p className="eyebrow">RECENT CRAFTS</p><h2>最近完成したもの</h2></div><Link to="/map">MAPで見る →</Link></header>
          {recent.length > 0 ? <div>{recent.map((mission) => mission && <article key={mission.id}><RewardIcon id={mission.reward.id} kind={mission.reward.kind} size={70} /><span><small>MISSION {mission.number}</small><strong>{mission.reward.name}</strong></span></article>)}</div> : <p className="panel-empty">最初のMISSIONを完成させると、ここにクラフト報酬が並びます。</p>}
        </section>
        <section className="key-practice panel">
          <header><div><p className="eyebrow">NEXT PRACTICE</p><h2>次のおすすめ練習</h2></div></header>
          <p>入力で少し迷ったキーを、前向きな練習候補として表示しています。</p>
          {missKeys.length > 0 ? <div className="practice-keys">{missKeys.map(([key, count], index) => <span key={key} className={index === 0 ? "top" : ""}><kbd>{key.toUpperCase()}</kbd><small>{count}回</small></span>)}</div> : <div className="perfect-note">まだ迷ったキーはありません。いいスタートです！</div>}
          <Link className="button secondary" to={`/play?mission=${recommended.id}`}>おすすめMISSIONへ</Link>
        </section>
      </div>

      <section className="zone-progress panel">
        <header><div><p className="eyebrow">ZONE PROGRESS</p><h2>世界の完成度</h2></div></header>
        <div>{catalog.zones.map((zone) => { const zoneMissions = catalog.missions.filter((mission) => mission.zoneId === zone.id); const done = zoneMissions.filter((mission) => session.completedMissionIds.includes(mission.id)).length; return <article key={zone.id}><span style={{ background: zone.accent }}>{zone.number}</span><div><strong>{zone.name}</strong><small>{zone.japaneseName}</small><i><b style={{ width: `${(done / 50) * 100}%`, background: zone.accent }} /></i></div><em>{done} / 50</em></article>; })}</div>
      </section>
    </div>
  );
}
