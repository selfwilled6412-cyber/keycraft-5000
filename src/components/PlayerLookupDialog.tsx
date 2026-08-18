import { useEffect, useRef, useState, type FormEvent } from "react";
import { searchPlayersByName, type PlayerLookupMatch } from "../api/client";

interface PlayerLookupDialogProps {
  title?: string;
  description?: string;
  currentNickname?: string | null;
  currentKeyId?: string;
  onClose: () => void;
  onSelect: (keyId: string) => Promise<void>;
}

export function PlayerLookupDialog({
  title = "利用者を切り替える",
  description = "利用者名を入力してください。名前が同じ人だけ候補から選べます。",
  currentNickname,
  currentKeyId,
  onClose,
  onSelect,
}: PlayerLookupDialogProps) {
  const [mode, setMode] = useState<"name" | "key">("name");
  const [nickname, setNickname] = useState("");
  const [keyId, setKeyId] = useState("");
  const [matches, setMatches] = useState<PlayerLookupMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const selectPlayer = async (selectedKeyId: string) => {
    setBusy(true);
    setError(null);
    try {
      await onSelect(selectedKeyId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "利用者を読み込めませんでした");
      setBusy(false);
    }
  };

  const handleNameSearch = async (event: FormEvent) => {
    event.preventDefault();
    const name = nickname.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    setMatches([]);
    try {
      const result = await searchPlayersByName(name);
      if (result.matches.length === 0) {
        setError("この名前の利用者が見つかりません。名前が登録されているか確認してください。");
      } else if (result.matches.length === 1) {
        await onSelect(result.matches[0]!.keyId);
        return;
      } else {
        setMatches(result.matches);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "名前を検索できませんでした");
    }
    setBusy(false);
  };

  const handleKeySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (keyId.length !== 6) return;
    await selectPlayer(keyId);
  };

  const changeMode = (nextMode: "name" | "key") => {
    setMode(nextMode);
    setError(null);
    setMatches([]);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !busy && onClose()}>
      <section className="modal-card player-lookup-card" role="dialog" aria-modal="true" aria-labelledby="player-lookup-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} disabled={busy} aria-label="閉じる">×</button>
        <p className="eyebrow">PLAYER SWITCH</p>
        <h2 id="player-lookup-title">{title}</h2>
        <p>{description}</p>

        {(currentNickname || currentKeyId) && (
          <div className="current-player-summary">
            <span>現在の利用者</span>
            <strong>{currentNickname || "名前未登録"}</strong>
            {currentKeyId && <small>KEY ID …{currentKeyId.slice(-2)}</small>}
          </div>
        )}

        {mode === "name" ? (
          <>
            <form onSubmit={(event) => void handleNameSearch(event)}>
              <label htmlFor="lookup-player-name">利用者名（名前・ニックネーム）</label>
              <input
                ref={nameInputRef}
                className="player-name-input"
                id="lookup-player-name"
                value={nickname}
                maxLength={24}
                onChange={(event) => { setNickname(event.target.value); setMatches([]); setError(null); }}
                placeholder="例：ゆうき"
                autoComplete="off"
              />
              <button className="button primary" type="submit" disabled={busy || !nickname.trim()}>{busy ? "探しています…" : "名前で探す"}</button>
            </form>

            {matches.length > 1 && (
              <div className="player-match-list" aria-label="同じ名前の候補">
                <p>同じ名前が {matches.length} 人います。進み具合を見て選んでください。</p>
                {matches.map((match) => (
                  <button key={match.keyId} type="button" onClick={() => void selectPlayer(match.keyId)} disabled={busy}>
                    <span><strong>{match.nickname}</strong><small>KEY ID …{match.keyId.slice(-2)}</small></span>
                    <span><b>{match.completedPhrases}</b> フレーズ / <b>{match.completedMissions}</b> MISSION</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={(event) => void handleKeySubmit(event)}>
            <label htmlFor="lookup-key-id">KEY ID</label>
            <input
              id="lookup-key-id"
              value={keyId}
              onChange={(event) => setKeyId(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="K8F3M2"
              autoComplete="off"
            />
            <button className="button primary" type="submit" disabled={busy || keyId.length !== 6}>{busy ? "読み込み中…" : "KEY IDで続ける"}</button>
          </form>
        )}

        {error && <p className="form-error lookup-error" role="alert">{error}</p>}
        <button className="lookup-mode-toggle" type="button" onClick={() => changeMode(mode === "name" ? "key" : "name")} disabled={busy}>
          {mode === "name" ? "名前未登録の方は KEY IDで探す" : "← 名前で探す"}
        </button>
        {mode === "name" && <small className="lookup-help">新しく始める利用者は、最初に名前・ニックネームを登録するので次回から名前で探せます。</small>}
      </section>
    </div>
  );
}
