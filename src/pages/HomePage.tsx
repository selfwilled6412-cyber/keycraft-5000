import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { HardcoreSettlement } from "../components/HardcoreSettlement";
import { PlayerLookupDialog } from "../components/PlayerLookupDialog";
import { RewardIcon } from "../components/RewardIcon";
import { catalog } from "../content/catalog";
import { usePlayer } from "../context/PlayerContext";

export function HomePage() {
  const navigate = useNavigate();
  const { session, loading, startNew, continueWith } = usePlayer();
  const [lookupOpen, setLookupOpen] = useState(false);
  const [startingNew, setStartingNew] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const completedCrafts = session?.completedMissionIds.length ?? 0;
  const completedPhrases = session?.progress.length ?? 0;
  const currentMission = useMemo(() => {
    if (!session) return catalog.missions[0]!;
    return catalog.missions.find((mission) => !session.completedMissionIds.includes(mission.id)) ?? catalog.missions[catalog.missions.length - 1]!;
  }, [session]);
  const currentDistrict = catalog.districts.find((district) => district.id === currentMission.districtId);
  const completedInMission = session?.progress.filter((item) => item.missionId === currentMission.id).length ?? 0;
  const missionPercent = Math.min(100, (completedInMission / 20) * 100);
  const level = Math.max(1, Math.floor(completedPhrases / 100) + 1);
  const phraseProgress = completedPhrases % 100;
  const resources = {
    heat: Math.max(320, completedPhrases * 7 + 320),
    wood: Math.max(480, completedPhrases * 11 + 480),
    ore: Math.max(90, completedCrafts * 84 + 90),
    crystal: Math.max(20, completedCrafts * 16 + 20),
  };

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
    <div className="hc-home-page">
      <section className="hc-command-screen">
        <HardcoreSettlement completedCrafts={completedCrafts} currentCraft={completedInMission > 0 ? Math.ceil(completedInMission / 2) : 0} />

        <header className="hc-resource-bar">
          <button className="hc-brand-block" type="button" onClick={() => navigate("/")}>
            <span className="hc-emblem">KC</span>
            <span className="hc-brand-copy"><b>KEY CRAFT 5000</b><small>LEVEL {String(level).padStart(2, "0")}</small></span>
            <span className="hc-level-track"><i style={{ width: `${phraseProgress}%` }} /></span>
          </button>
          <div className="hc-resources" aria-label="拠点資源">
            <div><span className="heat">◆</span><b>{resources.heat.toLocaleString()}</b><small>+{Math.max(8, level * 8)}/分</small></div>
            <div><span className="wood">▰</span><b>{resources.wood.toLocaleString()}</b><small>+{Math.max(12, level * 11)}/分</small></div>
            <div><span className="ore">⬢</span><b>{resources.ore.toLocaleString()}</b><small>+{Math.max(4, completedCrafts + 4)}/分</small></div>
            <div><span className="crystal">✦</span><b>{resources.crystal.toLocaleString()}</b><small>CRAFT</small></div>
          </div>
          <button className="hc-plus-button" type="button" onClick={() => navigate("/progress")} aria-label="進捗を見る">＋</button>
        </header>

        <aside className="hc-weather-panel">
          <span className="hc-panel-kicker">現在の環境</span>
          <div className="hc-weather-icon">❄</div>
          <strong>-27.3°C</strong>
          <b>吹雪</b>
          <small>安定まで 01:26:48</small>
          <hr />
          <dl><div><dt>拠点耐性</dt><dd>中</dd></div><div><dt>稼働状態</dt><dd className="good">良好</dd></div><div><dt>CRAFT</dt><dd>{completedCrafts}/250</dd></div><div><dt>入力進捗</dt><dd>{completedPhrases}/5000</dd></div></dl>
        </aside>

        <section className="hc-main-mission">
          <div className="hc-mission-label">⚒ メインMISSION</div>
          <div className="hc-mission-copy">
            <span>MISSION {String(currentMission.number).padStart(3, "0")}</span>
            <strong>{currentMission.title}</strong>
            <small>{currentDistrict?.name ?? "CRAFT DISTRICT"}</small>
          </div>
          <div className="hc-mission-progress"><i style={{ width: `${missionPercent}%` }} /><b>{completedInMission} / 20</b></div>
          <button type="button" onClick={() => session ? navigate(`/play?mission=${currentMission.id}`) : openNewPlayer()}>
            {session ? "MISSION開始" : "世界を作る"} <span>▶</span>
          </button>
        </section>

        <section className="hc-chapter-card">
          <div className="hc-chapter-scene">
            <div className="hc-mountain one" /><div className="hc-mountain two" /><div className="hc-expedition"><span>●</span><i /><span>●</span><i /><span>●</span></div>
          </div>
          <div className="hc-chapter-body">
            <p>MISSION <strong>{String(currentMission.number).padStart(2, "0")}</strong></p>
            <h1>{session ? "新区画へ出発！" : "最初の拠点を築け！"}</h1>
            <span>{session ? "タイピングを進めて、新しい建物と景色を解放しよう。" : "5,000フレーズの先に、ひとつの巨大都市が完成する。"}</span>
            <div className="hc-reward-row">
              <div><RewardIcon id={currentMission.reward.id} kind={currentMission.reward.kind} locked={!session} size={52} /><small>{currentMission.reward.name}</small></div>
              <div className="hc-reward-token"><b>✦</b><span>CRAFT<br />x1</span></div>
              <div className="hc-reward-token"><b>◆</b><span>CORE<br />x{Math.max(1, level)}</span></div>
            </div>
            <button type="button" onClick={() => session ? navigate(`/play?mission=${currentMission.id}`) : openNewPlayer()} disabled={loading || busy}>{session ? "出発する" : "ゲーム開始"}</button>
          </div>
        </section>

        <div className="hc-side-actions" aria-label="ショートカット">
          <button type="button" onClick={() => setLookupOpen(true)}><span>♟</span><small>利用者</small>{session && <i />}</button>
          <button type="button" onClick={() => navigate("/deliverables")}><span>◆</span><small>成果物</small></button>
          <button type="button" onClick={() => navigate("/progress")}><span>★</span><small>実績</small></button>
        </div>

        <div className="hc-player-strip">
          <span className="hc-avatar">{(session?.preferences.nickname ?? "K").slice(0, 1).toUpperCase()}</span>
          <div><b>{session?.preferences.nickname ?? "GUEST PLAYER"}</b><small>{session ? `KEY ${session.keyId}` : "登録不要 / いつでも開始"}</small></div>
          {session ? <button type="button" onClick={() => setLookupOpen(true)}>利用者切替</button> : <button type="button" onClick={() => setLookupOpen(true)}>つづきから</button>}
        </div>

        <nav className="hc-bottom-dock" aria-label="ゲームメニュー">
          <button className="active" type="button" onClick={() => navigate("/")}><span>♜</span><b>拠点</b></button>
          <button type="button" onClick={() => navigate("/map")}><span>⚒</span><b>建設</b></button>
          <button type="button" onClick={() => session ? navigate("/play") : openNewPlayer()}><span>⌨</span><b>タイピング</b></button>
          <button type="button" onClick={() => navigate("/missions")}><span>✦</span><b>MISSION</b></button>
          <button type="button" onClick={() => navigate("/deliverables")}><span>⬢</span><b>成果物</b></button>
          <button type="button" onClick={() => navigate("/settings")}><span>⚙</span><b>設定</b></button>
        </nav>

        {!session && (
          <div className="hc-start-banner">
            <div><span>NEW WORLD</span><strong>タイピングで極寒の拠点を都市へ。</strong></div>
            <button type="button" onClick={openNewPlayer} disabled={loading || busy}>無料で始める →</button>
          </div>
        )}
      </section>

      {startingNew && (
        <div className="modal-backdrop hc-modal-backdrop" role="presentation" onMouseDown={() => !busy && setStartingNew(false)}>
          <section className="modal-card new-player-card hc-modal-card" role="dialog" aria-modal="true" aria-labelledby="new-player-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setStartingNew(false)} disabled={busy} aria-label="閉じる">×</button>
            <p className="eyebrow">NEW COMMANDER</p>
            <h2 id="new-player-title">新しい拠点を始める</h2>
            <p>利用者名を決めると、別のPCからでも名前で続きを探せます。ニックネームでもOKです。</p>
            {session && <div className="switch-save-note"><strong>✓ 今の拠点は保存済みです</strong><span>新しい利用者として別の世界を作ります。</span></div>}
            <form onSubmit={(event) => void handleStart(event)}>
              <label htmlFor="new-player-name">利用者名</label>
              <input autoFocus className="player-name-input" id="new-player-name" value={newNickname} maxLength={24} onChange={(event) => setNewNickname(event.target.value)} placeholder="例：ゆうき" autoComplete="off" />
              {startError && <p className="form-error" role="alert">{startError}</p>}
              <button className="button primary" type="submit" disabled={busy || !newNickname.trim()}>{busy ? "拠点作成中…" : "この名前で開始 →"}</button>
            </form>
          </section>
        </div>
      )}

      {lookupOpen && (
        <PlayerLookupDialog
          title={session ? "利用者を切り替える" : "つづきから"}
          description={session ? "次の利用者の名前を入力してください。進捗はサーバーに保存されています。" : "前に使った名前・ニックネームを入力してください。"}
          currentNickname={session?.preferences.nickname}
          currentKeyId={session?.keyId}
          onClose={() => setLookupOpen(false)}
          onSelect={handlePlayerSelect}
        />
      )}
    </div>
  );
}
