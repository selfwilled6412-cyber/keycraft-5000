import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerLookupDialog } from "../components/PlayerLookupDialog";
import { PremiumSettlement } from "../components/PremiumSettlement";
import { catalog } from "../content/catalog";
import { premiumHeroes, premiumRewardIcons } from "../content/premiumAssets";
import { usePlayer } from "../context/PlayerContext";

export function HomePage() {
  const navigate = useNavigate();
  const { session, loading, startNew, continueWith } = usePlayer();
  const [lookupOpen, setLookupOpen] = useState(false);
  const [startingNew, setStartingNew] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const completedMissions = session?.completedMissionIds.length ?? 0;
  const completedPhrases = session?.progress.length ?? 0;
  const currentMission = useMemo(() => session ? catalog.missions.find((mission) => !session.completedMissionIds.includes(mission.id)) ?? catalog.missions[catalog.missions.length - 1]! : catalog.missions[0]!, [session]);
  const currentDistrict = catalog.districts.find((district) => district.id === currentMission.districtId);
  const completedInMission = session?.progress.filter((item) => item.missionId === currentMission.id).length ?? 0;
  const missionPercent = Math.min(100, completedInMission * 5);
  const level = Math.max(1, Math.floor(completedPhrases / 100) + 1);
  const nextHero = premiumHeroes.find((hero) => completedMissions < hero.unlockMission) ?? premiumHeroes[premiumHeroes.length - 1]!;
  const unlockedHeroCount = premiumHeroes.filter((hero) => completedMissions >= hero.unlockMission).length;

  const openNewPlayer = () => {
    setNewNickname("");
    setStartError(null);
    setStartingNew(true);
  };

  const handleStart = async (event: FormEvent) => {
    event.preventDefault();
    const nickname = newNickname.trim();
    if (!nickname) return;
    setBusy(true);
    setStartError(null);
    try {
      await startNew(nickname);
      setStartingNew(false);
      void navigate("/play");
    } catch (caught) {
      setStartError(caught instanceof Error ? caught.message : "新しい世界を作れませんでした");
    } finally {
      setBusy(false);
    }
  };

  const handlePlayerSelect = async (keyId: string) => {
    await continueWith(keyId);
    setLookupOpen(false);
    void navigate("/");
  };

  return (
    <div className="premium-command-page">
      <PremiumSettlement completedMissions={completedMissions} completedPhrases={completedPhrases} nickname={session?.preferences.nickname} />

      <section className="premium-top-hud">
        <button type="button" className="premium-player-badge" onClick={() => setLookupOpen(true)}>
          <span className="premium-avatar-ring"><img src={premiumHeroes[0].image} alt="" crossOrigin="anonymous" /></span>
          <span><b>{session?.preferences.nickname ?? "NEW COMMANDER"}</b><small>LV.{String(level).padStart(2, "0")} · {completedPhrases.toLocaleString()} / 5,000</small></span>
        </button>
        <div className="premium-resource"><span>🔥</span><b>{(completedPhrases * 9 + 320).toLocaleString()}</b><small>+{level * 8}/分</small></div>
        <div className="premium-resource"><span>🪵</span><b>{(completedPhrases * 13 + 480).toLocaleString()}</b><small>+{level * 11}/分</small></div>
        <div className="premium-resource"><span>⬢</span><b>{(completedMissions * 84 + 90).toLocaleString()}</b><small>+{completedMissions + 4}/分</small></div>
        <div className="premium-resource crystal"><span>◆</span><b>{completedMissions * 20 + 20}</b><small>CRAFT</small></div>
      </section>

      <aside className="premium-weather-card">
        <span>猛吹雪到来</span><strong>-27.3°C</strong><b>00:48:37</b>
        <div><small>拠点耐性</small><em>中</em></div><div><small>住民の体調</small><em className="good">良好</em></div><div><small>英雄</small><em>{unlockedHeroCount}/{premiumHeroes.length}</em></div>
      </aside>

      <section className="premium-mission-card">
        <span>⚒ メインMISSION</span>
        <small>MISSION {String(currentMission.number).padStart(3, "0")}</small>
        <h2>{currentMission.title}</h2>
        <p>{currentDistrict?.name ?? "FROST DISTRICT"}</p>
        <div className="premium-progress-bar"><i style={{ width: `${missionPercent}%` }} /><b>{completedInMission} / 20</b></div>
        <button type="button" onClick={() => session ? navigate(`/play?mission=${currentMission.id}`) : openNewPlayer()}>{session ? "MISSION開始" : "最初の拠点を作る"}<span>▶</span></button>
      </section>

      <section className="premium-event-card">
        <div className="premium-event-art"><img src={nextHero.image} alt="" crossOrigin="anonymous" /></div>
        <div className="premium-event-copy"><span>CHAPTER {String(Math.floor(completedMissions / 10) + 1).padStart(2, "0")}</span><h1>{completedMissions ? "新区画へ出発！" : "極寒都市、始動。"}</h1><p>{completedMissions ? `次の仲間「${nextHero.name}」と、新しい建物が待っている。` : "最初の20フレーズから、自分だけの都市を築き始めよう。"}</p></div>
        <div className="premium-reward-strip">
          {premiumRewardIcons.map((icon, index) => <div key={icon}><img src={icon} alt="" crossOrigin="anonymous" /><b>x{index === 0 ? 300 : index + 1}</b></div>)}
        </div>
        <button type="button" onClick={() => session ? navigate(`/play?mission=${currentMission.id}`) : openNewPlayer()}>{session ? "探索を続ける" : "ゲーム開始"}</button>
      </section>

      <div className="premium-side-menu">
        <button type="button" onClick={() => navigate("/heroes")}><span>♟</span><b>英雄</b><i>{unlockedHeroCount}</i></button>
        <button type="button" onClick={() => navigate("/deliverables")}><span>◆</span><b>成果物</b>{completedMissions > 0 && <i>!</i>}</button>
        <button type="button" onClick={() => navigate("/progress")}><span>★</span><b>実績</b></button>
        <button type="button" onClick={() => setLookupOpen(true)}><span>👤</span><b>利用者</b></button>
      </div>

      <nav className="premium-bottom-nav" aria-label="ゲームメニュー">
        <button className="active" type="button" onClick={() => navigate("/")}><span>♜</span><b>拠点</b></button>
        <button type="button" onClick={() => navigate("/map")}><span>⚒</span><b>建設</b></button>
        <button type="button" onClick={() => navigate("/heroes")}><span>♟</span><b>英雄</b></button>
        <button type="button" onClick={() => session ? navigate("/play") : openNewPlayer()}><span>⌨</span><b>タイピング</b></button>
        <button type="button" onClick={() => navigate("/deliverables")}><span>◆</span><b>成果物</b></button>
      </nav>

      {startingNew && (
        <div className="modal-backdrop premium-modal-backdrop" role="presentation" onMouseDown={() => !busy && setStartingNew(false)}>
          <section className="modal-card new-player-card premium-modal-card" role="dialog" aria-modal="true" aria-labelledby="new-player-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setStartingNew(false)} disabled={busy} aria-label="閉じる">×</button>
            <p className="eyebrow">NEW COMMANDER</p><h2 id="new-player-title">新しい拠点を始める</h2><p>利用者名を決めると、別のPCからでも名前で続きを探せます。</p>
            <form onSubmit={(event) => void handleStart(event)}><label htmlFor="new-player-name">利用者名</label><input autoFocus className="player-name-input" id="new-player-name" value={newNickname} maxLength={24} onChange={(event) => setNewNickname(event.target.value)} placeholder="例：ゆうき" autoComplete="off" />{startError && <p className="form-error" role="alert">{startError}</p>}<button className="button primary" type="submit" disabled={busy || !newNickname.trim()}>{busy ? "拠点作成中…" : "この名前で開始 →"}</button></form>
          </section>
        </div>
      )}

      {lookupOpen && <PlayerLookupDialog title={session ? "利用者を切り替える" : "つづきから"} description="名前・ニックネームで保存済みの世界を探します。" currentNickname={session?.preferences.nickname} currentKeyId={session?.keyId} onClose={() => setLookupOpen(false)} onSelect={handlePlayerSelect} />}
    </div>
  );
}
