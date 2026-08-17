import { useEffect, useState, type FormEvent } from "react";
import { GameGate } from "../components/GameGate";
import { GENRES } from "../content/source";
import type { AssistMode } from "../content/types";
import { usePlayer } from "../context/PlayerContext";

const modes: Array<{ id: AssistMode; title: string; description: string; features: string[] }> = [
  { id: "beginner", title: "BEGINNER", description: "次のキーも指も、全部見ながら進める", features: ["大きな次キー", "画面キーボード", "使う指", "ローマ字"] },
  { id: "normal", title: "NORMAL", description: "必要なヒントだけでテンポよく進める", features: ["次キー", "画面キーボード", "ローマ字"] },
  { id: "challenge", title: "CHALLENGE", description: "補助を減らして、自分の入力に集中する", features: ["次キー", "正確さ", "入力記録"] },
];

export function SettingsPage() {
  const { session, savePreferences, signOut } = usePlayer();
  const [mode, setMode] = useState<AssistMode>(session?.preferences.assistMode ?? "beginner");
  const [genres, setGenres] = useState<string[]>(session?.preferences.genres ?? []);
  const [nickname, setNickname] = useState(session?.preferences.nickname ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (!session) return;
    setMode(session.preferences.assistMode);
    setGenres(session.preferences.genres);
    setNickname(session.preferences.nickname ?? "");
  }, [session?.keyId]);

  if (!session) return <GameGate title="設定を保存するKEY IDを作ろう" />;

  const toggleGenre = (genre: string) => {
    setGenres((current) => current.includes(genre) ? current.filter((item) => item !== genre) : current.length < 3 ? [...current, genre] : current);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    try {
      await savePreferences({ assistMode: mode, genres, nickname: nickname.trim() || null });
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="page settings-page section-pad">
      <header className="page-heading"><div><p className="eyebrow">MAKE IT YOURS</p><h1>設定</h1><p>見え方と好きなジャンルを、自分にちょうどよく整えます。</p></div></header>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <section className="settings-section panel">
          <header><span>01</span><div><h2>ASSIST MODE</h2><p>いつでも変更できます。時間制限はどのモードにもありません。</p></div></header>
          <div className="mode-grid">{modes.map((item) => <label key={item.id} className={mode === item.id ? "selected" : ""}><input type="radio" name="assist-mode" value={item.id} checked={mode === item.id} onChange={() => setMode(item.id)} /><span className="radio-dot" /><strong>{item.title}</strong><p>{item.description}</p><ul>{item.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></label>)}</div>
        </section>

        <section className="settings-section panel">
          <header><span>02</span><div><h2>好きなジャンル</h2><p>最大3つ。おすすめMISSIONやホームの案内に反映します。</p></div><b>{genres.length} / 3</b></header>
          <div className="genre-grid">{GENRES.map((genre) => <button key={genre} type="button" aria-pressed={genres.includes(genre)} className={genres.includes(genre) ? "selected" : ""} onClick={() => toggleGenre(genre)} disabled={!genres.includes(genre) && genres.length >= 3}><span>{genreIcon(genre)}</span>{genre}<b>✓</b></button>)}</div>
        </section>

        <section className="settings-section panel profile-settings">
          <header><span>03</span><div><h2>プレイヤー情報</h2><p>名前は不要です。ニックネームはこの端末以外にも同期されます。</p></div></header>
          <div><label htmlFor="nickname">ニックネーム <small>任意・24文字まで</small></label><input id="nickname" value={nickname} maxLength={24} onChange={(event) => setNickname(event.target.value)} placeholder="クラフター" /></div>
          <div className="key-id-setting"><span>KEY ID</span><strong>{session.keyId}</strong><small>このIDだけで進み具合を復元できます。公開場所への投稿は避けてください。</small></div>
        </section>

        <div className="settings-actions"><button className="button primary large" type="submit" disabled={status === "saving"}>{status === "saving" ? "保存中…" : status === "saved" ? "保存しました ✓" : "設定を保存する"}</button>{status === "error" && <span role="alert">保存できませんでした。通信を確認してください。</span>}</div>
      </form>

      <section className="signout-panel"><div><h2>別のKEY IDを使う</h2><p>この端末からKEY IDの記憶だけを消します。D1に保存した進み具合は消えません。</p></div><button className="button danger" type="button" onClick={signOut}>この端末から離れる</button></section>
    </div>
  );
}

function genreIcon(genre: string): string {
  return ({ 食べ物: "◒", 動物: "♧", ゲーム: "▣", スポーツ: "◉", 音楽: "♫", 旅行: "⌖", 乗り物: "▰", 科学: "⚗", 宇宙: "✦", パソコン: "⌨", 自然: "⌁", ものづくり: "◇" } as Record<string, string>)[genre] ?? "◇";
}
