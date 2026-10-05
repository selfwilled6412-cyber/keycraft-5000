import { Link } from "react-router-dom";
import { GameGate } from "../components/GameGate";
import { PremiumSettlement } from "../components/PremiumSettlement";
import { catalog } from "../content/catalog";
import { PRODUCT_NAME, TOTAL_MISSIONS, TOTAL_PHRASES, WORLD_ONE_MISSIONS, WORLD_ONE_PHRASES } from "../content/limits";
import { premiumHeroes } from "../content/premiumAssets";
import { usePlayer } from "../context/PlayerContext";

export function CompletionPage() {
  const { session } = usePlayer();
  if (!session) return <GameGate title="完成記録をひらく準備をしよう" />;

  const missions = session.completedMissionIds.length;
  const phrases = session.progress.length;
  const complete = missions >= catalog.missions.length && phrases >= catalog.phrases.length;
  const worldOneComplete = missions >= WORLD_ONE_MISSIONS && phrases >= WORLD_ONE_PHRASES;
  const headline = complete ? `${PRODUCT_NAME} 完成！` : worldOneComplete ? "第1世界クリア！" : "完成まで、あと少し。";
  const description = complete
    ? `${TOTAL_PHRASES.toLocaleString()}の言葉が、${TOTAL_MISSIONS}の建物と二つの世界になりました。`
    : worldOneComplete
      ? "5,000問・250 MISSIONを制覇しました。MISSION 251から第2世界が始まります。"
      : `あと ${Math.max(0, TOTAL_PHRASES - phrases).toLocaleString()} フレーズで二つの世界が完成します。`;

  return (
    <div className="completion-page">
      <PremiumSettlement completedMissions={missions} completedPhrases={phrases} nickname={session.preferences.nickname} />
      <section className="completion-overlay">
        <p className="eyebrow">{complete ? "WORLD COMPLETE" : worldOneComplete ? "WORLD 1 COMPLETE" : "WORLD PROGRESS"}</p>
        <h1>{headline}</h1>
        <p>{description}</p>
        <div className="completion-totals"><span><b>{phrases.toLocaleString()}</b><small>/ {TOTAL_PHRASES.toLocaleString()} PHRASES</small></span><span><b>{missions}</b><small>/ {TOTAL_MISSIONS} MISSIONS</small></span><span><b>{premiumHeroes.filter((hero) => missions >= hero.unlockMission).length}</b><small>/ {premiumHeroes.length} HEROES</small></span></div>
        <div className="completion-actions">
          <Link className="button primary" to={complete ? "/endless" : worldOneComplete ? "/play?mission=m251" : "/play"}>{complete ? "無限チャレンジへ" : worldOneComplete ? "MISSION 251へ進む" : "続きをプレイ"}</Link>
          {complete && <Link className="button secondary" to="/missions?filter=complete">完成MISSIONを練習する</Link>}
          <Link className="button secondary" to="/deliverables">成果物を見る</Link>
          <Link className="button secondary" to="/map">完成した世界を見る</Link>
        </div>
      </section>
    </div>
  );
}
