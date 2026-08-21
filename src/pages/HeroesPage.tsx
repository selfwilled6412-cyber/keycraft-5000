import { premiumHeroes } from "../content/premiumAssets";
import { usePlayer } from "../context/PlayerContext";

export function HeroesPage() {
  const { session } = usePlayer();
  const completedMissions = session?.completedMissionIds.length ?? 0;

  return (
    <div className="premium-page premium-heroes-page">
      <header className="premium-subheader">
        <div><span>CREW COLLECTION</span><h1>英雄・クルー</h1><p>MISSIONを進めるほど、極寒都市に仲間が集まる。</p></div>
        <div className="premium-roster-count"><strong>{premiumHeroes.filter((hero) => completedMissions >= hero.unlockMission).length}</strong><span>/ {premiumHeroes.length} RECRUITED</span></div>
      </header>

      <section className="premium-hero-grid">
        {premiumHeroes.map((hero) => {
          const unlocked = completedMissions >= hero.unlockMission;
          const progress = Math.max(0, Math.min(10, completedMissions - hero.unlockMission + 1));
          return (
            <article key={hero.id} className={`premium-hero-card rarity-${hero.rarity.toLowerCase()} ${unlocked ? "is-unlocked" : "is-locked"}`}>
              <div className="premium-hero-image"><img src={hero.image} alt={hero.name} loading="lazy" crossOrigin="anonymous" /></div>
              <span className="premium-rarity">{hero.rarity}</span>
              <span className="premium-role">{hero.role}</span>
              <div className="premium-hero-copy">
                <h2>{hero.name}</h2>
                <strong>Lv.{unlocked ? Math.max(1, Math.floor((completedMissions - hero.unlockMission) / 3) + 1) : 0}</strong>
              </div>
              <div className="premium-star-row" aria-hidden="true">★★★★★</div>
              <div className="premium-shard-track"><i style={{ width: `${unlocked ? 100 : progress * 10}%` }} /><b>{unlocked ? "加入済み" : `${progress}/10`}</b></div>
              {!unlocked && <div className="premium-card-lock"><span>🔒</span><b>MISSION {String(hero.unlockMission).padStart(3, "0")}</b><small>到達で募集可能</small></div>}
            </article>
          );
        })}
      </section>

      <div className="premium-recruit-banner"><div><span>RECRUITMENT</span><strong>次の仲間まであと {Math.max(0, (premiumHeroes.find((hero) => completedMissions < hero.unlockMission)?.unlockMission ?? completedMissions) - completedMissions)} MISSION</strong></div><button type="button">英雄募集</button></div>
    </div>
  );
}
