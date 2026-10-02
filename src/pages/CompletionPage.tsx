import { Link } from "react-router-dom";
import { GameGate } from "../components/GameGate";
import { PremiumSettlement } from "../components/PremiumSettlement";
import { catalog } from "../content/catalog";
import { premiumHeroes } from "../content/premiumAssets";
import { usePlayer } from "../context/PlayerContext";

export function CompletionPage() {
  const { session } = usePlayer();
  if (!session) return <GameGate title="完成記録をひらく準備をしよう" />;

  const missions = session.completedMissionIds.length;
  const phrases = session.progress.length;
  const complete = missions >= catalog.missions.length && phrases >= catalog.phrases.length;

  return (
    <div className="completion-page">
      <PremiumSettlement completedMissions={missions} completedPhrases={phrases} nickname={session.preferences.nickname} />
      <section className="completion-overlay">
        <p className="eyebrow">{complete ? "WORLD COMPLETE" : "WORLD PROGRESS"}</p>
        <h1>{complete ? "KEY CRAFT 5000 完成！" : "完成まで、あと少し。"}</h1>
        <p>{complete ? "5,000の言葉が、250の建物とひとつの世界になりました。" : `あと ${Math.max(0, 5_000 - phrases).toLocaleString()} フレーズで世界が完成します。`}</p>
        <div className="completion-totals"><span><b>{phrases.toLocaleString()}</b><small>/ 5,000 PHRASES</small></span><span><b>{missions}</b><small>/ 250 MISSIONS</small></span><span><b>{premiumHeroes.filter((hero) => missions >= hero.unlockMission).length}</b><small>/ {premiumHeroes.length} HEROES</small></span></div>
        <div className="completion-actions">
          <Link className="button primary" to={complete ? "/missions?filter=complete" : "/play"}>{complete ? "完成MISSIONを練習する" : "続きをプレイ"}</Link>
          <Link className="button secondary" to="/deliverables">成果物を見る</Link>
          <Link className="button secondary" to="/map">完成した世界を見る</Link>
        </div>
      </section>
    </div>
  );
}
