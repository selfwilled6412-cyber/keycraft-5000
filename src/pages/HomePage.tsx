import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { RewardIcon } from "../components/RewardIcon";
import { WorldPreview } from "../components/WorldPreview";
import { catalog } from "../content/catalog";
import { usePlayer } from "../context/PlayerContext";

export function HomePage() {
  const navigate = useNavigate();
  const { session, loading, error, startNew, continueWith, clearError } = usePlayer();
  const [continuing, setContinuing] = useState(false);
  const [keyId, setKeyId] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (continuing) inputRef.current?.focus();
  }, [continuing]);

  const handleStart = async () => {
    setBusy(true);
    try {
      await startNew();
      void navigate("/play");
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await continueWith(keyId);
      void navigate("/play");
    } catch {
      // Error text is provided by the player context.
    } finally {
      setBusy(false);
    }
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
            <button className="button primary large" type="button" onClick={() => void handleStart()} disabled={busy || loading}>
              <span>{session ? "新しい世界を始める" : "すぐ始める"}</span><b aria-hidden="true">→</b>
            </button>
            {session ? (
              <button className="button secondary large" type="button" onClick={() => navigate("/play")}>
                つづきのMISSIONへ
              </button>
            ) : (
              <button className="text-button" type="button" onClick={() => { clearError(); setContinuing(true); }}>
                KEY IDをお持ちの方 <span>つづきから →</span>
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
        <button className="button light large" type="button" onClick={() => void handleStart()} disabled={busy}>無料で始める <b>→</b></button>
      </section>

      {continuing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setContinuing(false)}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="continue-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setContinuing(false)} aria-label="閉じる">×</button>
            <p className="eyebrow">WELCOME BACK</p>
            <h2 id="continue-title">つづきから</h2>
            <p>6文字のKEY IDを入力してください。別のPCでも同じ世界を開けます。</p>
            <form onSubmit={(event) => void handleContinue(event)}>
              <label htmlFor="continue-key-id">KEY ID</label>
              <input ref={inputRef} id="continue-key-id" value={keyId} onChange={(event) => setKeyId(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="K8F3M2" autoComplete="off" />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button primary" type="submit" disabled={busy || keyId.length !== 6}>{busy ? "読み込み中…" : "世界をひらく"}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
