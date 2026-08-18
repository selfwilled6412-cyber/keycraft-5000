import { useState, type CSSProperties, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerLookupDialog } from "../components/PlayerLookupDialog";
import { RewardIcon } from "../components/RewardIcon";
import { WorldPreview } from "../components/WorldPreview";
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
    void navigate("/play");
  };

  return (
    <div className="home-page">
      <section className="hero section-pad">
        <div className="hero-copy">
          <p className="eyebrow"><span>●</span> 登録なしですぐ遊べる</p>
          <h1><span>KEY CRAFT</span><strong>5000</strong></h1>
          <p className="tagline">打つほど、<em>世界ができていく。</em></p>
          <p className="hero-description">速さだけを競わない、新しいタイピングゲーム。<br />ひとつ打つたび、あなただけの街が少しずつ育ちます。</p>
          <div className="hero-actions">
            <button className="button primary large" type="button" onClick={openNewPlayer} disabled={busy || loading}>
              <span>{session ? "新しい世界を始める" : "すぐ始める"}</span><b aria-hidden="true">→</b>
            </button>
            {session ? (
              <>
                <button className="button secondary large" type="button" onClick={() => navigate("/play")}>
                  つづきのMISSIONへ
                </button>
                <button className="text-button" type="button" onClick={() => setLookupOpen(true)}>
                  共有PCで使う <span>利用者を切り替える →</span>
                </button>
              </>
            ) : (
              <button className="text-button" type="button" onClick={() => setLookupOpen(true)}>
                以前遊んだ方 <span>名前でつづきから →</span>
              </button>
            )}
          </div>
          <div className="hero-facts" aria-label="ゲームの規模">
            <div><strong>5,000</strong><span>フレーズ</span></div>
            <div><strong>250</strong><span>MISSION</span></div>
            <div><strong>250</strong><span>クラフト報酬</span></div>
          </div>
        </div>
        <WorldPreview />
      </section>

      <section className="loop-section section-pad">
        <div className="section-heading centered">
          <p className="eyebrow">HOW TO CRAFT</p>
          <h2>打つ。完成する。<br /><span>次の景色へ。</span></h2>
          <p>むずかしい説明はありません。ひとつのMISSIONが、あなたの世界のひとつになります。</p>
        </div>
        <div className="loop-grid">
          <article><div className="step-number">01</div><div className="step-visual keyboard-mini"><b>F</b><b>J</b></div><h3>ことばを打つ</h3><p>次のキーと使う指が見えるから、初めてでも迷いません。</p></article>
          <article><div className="step-number">02</div><div className="step-visual progress-mini"><span style={{ width: "72%" }} /></div><h3>20フレーズで完成</h3><p>時間制限なし。自分のペースで一歩ずつ進めます。</p></article>
          <article><div className="step-number">03</div><div className="step-visual"><RewardIcon id="demo-reward" kind="shop" size={82} /></div><h3>街に新しい建物</h3><p>クリアするたび、CRAFT MAPに施設や景色が増えます。</p></article>
        </div>
      </section>

      <section className="zones-section section-pad">
        <div className="section-heading">
          <p className="eyebrow">5 ZONES / 25 DISTRICTS</p>
          <h2>小さな街から、<br /><span>未来の世界まで。</span></h2>
        </div>
        <div className="zone-ribbon">
          {catalog.zones.map((zone) => (
            <article key={zone.id} style={{ "--zone": zone.accent } as CSSProperties}>
              <span>ZONE {String(zone.number).padStart(2, "0")}</span>
              <b>{zone.name}</b>
              <h3>{zone.japaneseName}</h3>
              <p>{zone.description}</p>
              <small>LEVEL {zone.level}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta section-pad">
        <div><p className="eyebrow">YOUR WORLD IS WAITING</p><h2>最初の一打から、<br />世界を作ろう。</h2></div>
      </section>

      {startingNew && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !busy && setStartingNew(false)}>
          <section className="modal-card new-player-card" role="dialog" aria-modal="true" aria-labelledby="new-player-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setStartingNew(false)} disabled={busy} aria-label="閉じる">×</button>
            <p className="eyebrow">NEW PLAYER</p>
            <h2 id="new-player-title">新しい世界を始める</h2>
            <p>次回、名前だけで続きを探せるように利用者名を決めます。本名でなくニックネームでもOKです。</p>
            {session && <div className="switch-save-note"><strong>✓ 今の世界はそのまま保存されています</strong><span>新しい利用者として別の世界を作ります。</span></div>}
            <form onSubmit={(event) => void handleStart(event)}>
              <label htmlFor="new-player-name">利用者名（名前・ニックネーム）</label>
              <input
                autoFocus
                className="player-name-input"
                id="new-player-name"
                value={newNickname}
                maxLength={24}
                onChange={(event) => setNewNickname(event.target.value)}
                placeholder="例：ゆうき"
                autoComplete="off"
              />
              {startError && <p className="form-error" role="alert">{startError}</p>}
              <button className="button primary" type="submit" disabled={busy || !newNickname.trim()}>{busy ? "作成中…" : "この名前で始める →"}</button>
            </form>
          </section>
        </div>
      )}

      {lookupOpen && (
        <PlayerLookupDialog
          title={session ? "利用者を切り替える" : "つづきから"}
          description={session ? "次の利用者の名前を入力してください。完了した進み具合は自動保存されています。" : "前に使った名前・ニックネームを入力してください。"}
          currentNickname={session?.preferences.nickname}
          currentKeyId={session?.keyId}
          onClose={() => setLookupOpen(false)}
          onSelect={handlePlayerSelect}
        />
      )}
    </div>
  );
}
