import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FingerGuideView } from "../components/FingerGuideView";
import { GameGate } from "../components/GameGate";
import { OnScreenKeyboard } from "../components/OnScreenKeyboard";
import { RewardIcon } from "../components/RewardIcon";
import { catalog, districtById, phrasesByMission } from "../content/catalog";
import type { Mission, Phrase } from "../content/types";
import { calculateAccuracy, RomanizationMatcher, type TypingSnapshot } from "../core/typing";
import { usePlayer } from "../context/PlayerContext";
import { isMissionAvailable, nextMission } from "../game/progress";

const initialSnapshot: TypingSnapshot = { completed: false, nextKeys: [], tokenProgress: 0, typed: "", misses: 0, keystrokes: 0, missKeys: {} };

export function PlayPage() {
  const { session, savePhrase, continueWith } = usePlayer();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const requestedMission = params.get("mission");
  const mission = useMemo<Mission>(() => {
    const requested = catalog.missions.find((item) => item.id === requestedMission);
    if (session && requested && isMissionAvailable(requested, session.completedMissionIds)) return requested;
    return session ? nextMission(catalog, session.completedMissionIds, session.preferences.genres) : catalog.missions[0]!;
  }, [requestedMission, session]);
  const phrases = phrasesByMission.get(mission.id) ?? [];
  const savedIds = useMemo(() => new Set(session?.progress.map((item) => item.phraseId) ?? []), [session?.progress]);
  const firstIncomplete = Math.max(0, phrases.findIndex((phrase) => !savedIds.has(phrase.id)));
  const [phraseIndex, setPhraseIndex] = useState(firstIncomplete === -1 ? 19 : firstIncomplete);
  const phrase = phrases[phraseIndex] ?? phrases[0];
  const matcherRef = useRef<RomanizationMatcher | null>(null);
  const [snapshot, setSnapshot] = useState<TypingSnapshot>(initialSnapshot);
  const [feedback, setFeedback] = useState<"ready" | "miss" | "saved" | "error">("ready");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [missionComplete, setMissionComplete] = useState(session?.completedMissionIds.includes(mission.id) ?? false);
  const [switchingPlayer, setSwitchingPlayer] = useState(false);
  const [switchKeyId, setSwitchKeyId] = useState("");
  const [switchBusy, setSwitchBusy] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const initializedScopeRef = useRef("");

  const resetPhrase = useCallback((nextPhrase: Phrase | undefined) => {
    if (!nextPhrase) return;
    const matcher = new RomanizationMatcher(nextPhrase.reading);
    matcherRef.current = matcher;
    setSnapshot(matcher.snapshot());
    setFeedback("ready");
    setSaveError(null);
  }, []);

  useEffect(() => {
    const scope = `${session?.keyId ?? "guest"}:${mission.id}`;
    if (initializedScopeRef.current === scope) return;
    initializedScopeRef.current = scope;
    const newIndex = phrases.findIndex((item) => !savedIds.has(item.id));
    const nextIndex = newIndex === -1 ? 19 : newIndex;
    setPhraseIndex(nextIndex);
    setMissionComplete(session?.completedMissionIds.includes(mission.id) ?? false);
    resetPhrase(phrases[nextIndex]);
  }, [mission.id, phrases, resetPhrase, savedIds, session?.completedMissionIds, session?.keyId]);

  useEffect(() => {
    resetPhrase(phrase);
  }, [phrase?.id, resetPhrase]);

  const completePhrase = useCallback(async (result: TypingSnapshot) => {
    if (!session || !phrase || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await savePhrase({
        phraseId: phrase.id,
        missionId: mission.id,
        accuracy: calculateAccuracy(result.keystrokes, result.misses),
        keystrokes: result.keystrokes,
        missKeys: result.missKeys,
      });
      setFeedback("saved");
      if (response.missionCompleted || response.completedCount >= 20) {
        setMissionComplete(true);
      } else {
        window.setTimeout(() => setPhraseIndex((current) => Math.min(19, current + 1)), 260);
      }
    } catch (error) {
      setFeedback("error");
      setSaveError(error instanceof Error ? error.message : "保存できませんでした。通信を確認してください");
    } finally {
      setSaving(false);
    }
  }, [mission.id, phrase, savePhrase, saving, session]);

  const openPlayerSwitch = () => {
    setSwitchKeyId("");
    setSwitchError(null);
    setSwitchingPlayer(true);
  };

  const handlePlayerSwitch = async (event: FormEvent) => {
    event.preventDefault();
    if (switchKeyId.length !== 6) return;
    setSwitchBusy(true);
    setSwitchError(null);
    try {
      await continueWith(switchKeyId);
      setSwitchingPlayer(false);
      setSwitchKeyId("");
      void navigate("/play", { replace: true });
    } catch (error) {
      setSwitchError(error instanceof Error ? error.message : "KEY IDを読み込めませんでした");
    } finally {
      setSwitchBusy(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (switchingPlayer || missionComplete || saving || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      const key = event.key === "Spacebar" ? " " : event.key;
      if (key.length !== 1) return;
      event.preventDefault();
      const result = matcherRef.current?.press(key);
      if (!result) return;
      setSnapshot(result);
      if (!result.accepted) {
        setFeedback("miss");
        window.setTimeout(() => setFeedback((current) => current === "miss" ? "ready" : current), 280);
      } else if (result.completed) {
        void completePhrase(result);
      } else {
        setFeedback("ready");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [completePhrase, missionComplete, saving, switchingPlayer]);

  if (!session) return <GameGate title="最初のMISSIONを始めよう" />;
  if (!phrase) return <GameGate title="MISSIONデータを読み込めませんでした" />;

  const assistMode = session.preferences.assistMode;
  const nextKey = snapshot.nextKeys[0] ?? "✓";
  const completedBefore = session.progress.filter((item) => item.missionId === mission.id).length;
  const missionProgress = Math.min(20, Math.max(completedBefore, phraseIndex));
  const tokenPercent = (snapshot.tokenProgress / Math.max(1, matcherRef.current?.tokens.length ?? 1)) * 100;
  const accuracy = calculateAccuracy(snapshot.keystrokes, snapshot.misses);
  const roman = phrase.romanization;

  return (
    <div className={`play-page assist-${assistMode}`}>
      <div className="mobile-keyboard-note">このMISSIONはPCキーボードでの利用がおすすめです。</div>
      <header className="play-topbar">
        <Link to="/missions">← MISSION一覧</Link>
        <div><span>MISSION {String(mission.number).padStart(3, "0")}</span><strong>{mission.title}</strong></div>
        <div className="play-actions">
          <div className="assist-badge"><span>ASSIST</span><b>{assistMode.toUpperCase()}</b></div>
          <button className="player-switch-button" type="button" onClick={openPlayerSwitch} disabled={saving}>
            {saving ? "保存中…" : "利用者切替"}
          </button>
        </div>
      </header>
      <div className="mission-progress-bar"><span style={{ width: `${(missionProgress / 20) * 100}%` }} /><b>{missionProgress} / 20</b></div>

      <main className="typing-stage">
        <section className="typing-card">
          <div className="typing-meta"><span>{districtById.get(mission.districtId)?.name}</span><b>PHRASE {String(phraseIndex + 1).padStart(2, "0")}</b></div>
          <div className={`phrase-display ${feedback === "miss" ? "gentle-miss" : ""}`}>
            <p className="reading">{phrase.reading}</p>
            <h1>{phrase.text}</h1>
            {assistMode !== "challenge" && <p className="roman-target">{roman}</p>}
          </div>
          <div className="typing-progress"><span style={{ width: `${tokenPercent}%` }} /></div>
          <div className="typed-line"><span>{snapshot.typed || "ここに入力が表示されます"}</span><i className={feedback === "miss" ? "show" : ""}>もう一度</i></div>

          <div className="next-key-panel">
            <div><small>NEXT KEY</small><strong>{nextKey === " " ? "SPACE" : nextKey.toUpperCase()}</strong></div>
            <div className="live-stats"><span>正確さ<strong>{accuracy}%</strong></span><span>入力<strong>{snapshot.keystrokes}</strong></span><span>ミス<strong>{snapshot.misses}</strong></span></div>
          </div>

          {assistMode === "beginner" && <FingerGuideView nextKey={nextKey} />}
          {assistMode !== "challenge" && <OnScreenKeyboard nextKeys={snapshot.nextKeys} />}
          <p className="typing-hint" aria-live="polite">{saving ? "進み具合を保存しています…" : feedback === "saved" ? "保存しました。次へ進みます！" : "キーボードから入力してください"}</p>
          {saveError && <div className="save-error" role="alert"><span>{saveError}</span><button type="button" onClick={() => void completePhrase(snapshot)}>もう一度保存</button></div>}
        </section>

        <aside className="reward-preview">
          <p className="eyebrow">THIS MISSION CRAFTS</p>
          <RewardIcon id={mission.reward.id} kind={mission.reward.kind} locked={!missionComplete} size={126} />
          <h2>{mission.reward.name}</h2>
          <p>{mission.description}</p>
          <div><span style={{ width: `${(missionProgress / 20) * 100}%` }} /></div>
          <small>あと {Math.max(0, 20 - missionProgress)} フレーズで完成</small>
        </aside>
      </main>

      {switchingPlayer && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !switchBusy && setSwitchingPlayer(false)}>
          <section className="modal-card player-switch-card" role="dialog" aria-modal="true" aria-labelledby="player-switch-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setSwitchingPlayer(false)} disabled={switchBusy} aria-label="閉じる">×</button>
            <p className="eyebrow">PLAYER SWITCH</p>
            <h2 id="player-switch-title">利用者を切り替える</h2>
            <div className="switch-save-note">
              <strong>✓ 完了したフレーズまで自動保存済み</strong>
              <span>入力途中の1フレーズだけは、次回その問題の最初から再開します。</span>
            </div>
            <p className="current-player-id">現在のKEY ID <strong>{session.keyId}</strong></p>
            <form onSubmit={(event) => void handlePlayerSwitch(event)}>
              <label htmlFor="switch-key-id">次の利用者のKEY ID</label>
              <input
                autoFocus
                id="switch-key-id"
                value={switchKeyId}
                onChange={(event) => setSwitchKeyId(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="K8F3M2"
                autoComplete="off"
              />
              {switchError && <p className="form-error" role="alert">{switchError}</p>}
              <button className="button primary" type="submit" disabled={switchBusy || switchKeyId.length !== 6}>
                {switchBusy ? "切り替え中…" : "この利用者で続ける →"}
              </button>
            </form>
          </section>
        </div>
      )}

      {missionComplete && (
        <div className="modal-backdrop complete-backdrop">
          <section className="complete-card" role="dialog" aria-modal="true" aria-labelledby="complete-title">
            <p className="eyebrow">MISSION COMPLETE</p>
            <RewardIcon id={mission.reward.id} kind={mission.reward.kind} size={150} />
            <h1 id="complete-title">{mission.reward.name}<br /><span>が完成しました！</span></h1>
            <p>CRAFT MAPに新しい景色が追加されました。</p>
            <div><Link className="button secondary" to="/map">MAPを見る</Link><button className="button primary" type="button" onClick={() => navigate(`/play?mission=m${String(Math.min(250, mission.number + 1)).padStart(3, "0")}`)}>次のMISSIONへ →</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
