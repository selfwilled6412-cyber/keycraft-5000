import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { uploadDeliverable } from "../api/client";
import { FingerGuideView } from "../components/FingerGuideView";
import { GameGate } from "../components/GameGate";
import { OnScreenKeyboard } from "../components/OnScreenKeyboard";
import { PlayerLookupDialog } from "../components/PlayerLookupDialog";
import { RewardIcon } from "../components/RewardIcon";
import { catalog, districtById, phrasesByMission } from "../content/catalog";
import type { Mission, Phrase } from "../content/types";
import { calculateAccuracy, RomanizationMatcher, type TypingSnapshot } from "../core/typing";
import { createAutomaticMissionArtifacts } from "../deliverables/autoArtifacts";
import { usePlayer } from "../context/PlayerContext";
import { isMissionAvailable, nextIncompleteMission } from "../game/progress";
import { createTypingVideoRecorder, type TypingVideoRecorder } from "../game/typingVideoRecorder";

const initialSnapshot: TypingSnapshot = { completed: false, nextKeys: [], tokenProgress: 0, typed: "", misses: 0, keystrokes: 0, missKeys: {} };

const safeFilePart = (value: string) => value.replace(/[\\/:*?"<>|\s]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "PLAYER";

export function PlayPage() {
  const { session, savePhrase, continueWith } = usePlayer();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const requestedMission = params.get("mission");
  const practiceRequested = params.get("practice") === "1";
  const mission = useMemo<Mission>(() => {
    const requested = catalog.missions.find((item) => item.id === requestedMission);
    if (session && requested && isMissionAvailable(requested, session.completedMissionIds)) return requested;
    return session ? nextIncompleteMission(catalog, session.completedMissionIds, session.preferences.genres) ?? catalog.missions[catalog.missions.length - 1]! : catalog.missions[0]!;
  }, [requestedMission, session]);
  const phrases = phrasesByMission.get(mission.id) ?? [];
  const missionWasAlreadyCompleted = session?.completedMissionIds.includes(mission.id) ?? false;
  const isPractice = practiceRequested && missionWasAlreadyCompleted;
  const savedIds = useMemo(() => new Set(session?.progress.map((item) => item.phraseId) ?? []), [session?.progress]);
  const firstIncomplete = isPractice ? 0 : Math.max(0, phrases.findIndex((phrase) => !savedIds.has(phrase.id)));
  const [phraseIndex, setPhraseIndex] = useState(firstIncomplete === -1 ? 19 : firstIncomplete);
  const phrase = phrases[phraseIndex] ?? phrases[0];
  const matcherRef = useRef<RomanizationMatcher | null>(null);
  const recorderRef = useRef<TypingVideoRecorder | null>(null);
  const recordedMissionRef = useRef<string | null>(null);
  const artifactMissionRef = useRef<string | null>(null);
  const [snapshot, setSnapshot] = useState<TypingSnapshot>(initialSnapshot);
  const [feedback, setFeedback] = useState<"ready" | "miss" | "saved" | "error">("ready");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [missionComplete, setMissionComplete] = useState(isPractice ? false : missionWasAlreadyCompleted);
  const [wasCompleteOnOpen, setWasCompleteOnOpen] = useState(missionWasAlreadyCompleted);
  const [switchingPlayer, setSwitchingPlayer] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<"starting" | "recording" | "saved" | "unsupported" | "practice">("starting");
  const [artifactStatus, setArtifactStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [artifactCount, setArtifactCount] = useState(0);
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
    if (!session) return;
    const requested = catalog.missions.find((item) => item.id === requestedMission);
    if (!requested && !nextIncompleteMission(catalog, session.completedMissionIds, session.preferences.genres)) {
      void navigate("/complete", { replace: true });
      return;
    }
    if (!requested || !isMissionAvailable(requested, session.completedMissionIds)) {
      void navigate(`/play?mission=${mission.id}`, { replace: true });
    }
  }, [mission.id, navigate, requestedMission, session]);

  useEffect(() => {
    const scope = `${session?.keyId ?? "guest"}:${mission.id}:${isPractice ? "practice" : "progress"}`;
    if (initializedScopeRef.current === scope) return;
    initializedScopeRef.current = scope;
    const newIndex = isPractice ? 0 : phrases.findIndex((item) => !savedIds.has(item.id));
    const nextIndex = newIndex === -1 ? 19 : newIndex;
    setPhraseIndex(nextIndex);
    const alreadyComplete = session?.completedMissionIds.includes(mission.id) ?? false;
    setWasCompleteOnOpen(alreadyComplete);
    setMissionComplete(isPractice ? false : alreadyComplete);
    setArtifactStatus("idle");
    setArtifactCount(0);
    artifactMissionRef.current = null;
    resetPhrase(phrases[nextIndex]);
  }, [isPractice, mission.id, phrases, resetPhrase, savedIds, session?.completedMissionIds, session?.keyId]);

  useEffect(() => {
    resetPhrase(phrase);
  }, [phrase?.id, resetPhrase]);

  useEffect(() => {
    if (!session || phrases.length === 0 || isPractice || wasCompleteOnOpen) {
      recorderRef.current?.cancel();
      setRecordingStatus(isPractice ? "practice" : "unsupported");
      return;
    }
    recorderRef.current?.cancel();
    const recorder = createTypingVideoRecorder();
    recorderRef.current = recorder;
    recordedMissionRef.current = null;
    if (!recorder.isSupported) {
      setRecordingStatus("unsupported");
      return;
    }
    setRecordingStatus(recorder.start() ? "recording" : "unsupported");
    return () => recorder.cancel();
  }, [isPractice, mission.id, phrases.length, session?.keyId, wasCompleteOnOpen]);

  const completedBefore = session?.progress.filter((item) => item.missionId === mission.id).length ?? 0;
  const missionProgress = isPractice ? (missionComplete ? 20 : phraseIndex) : Math.min(20, Math.max(completedBefore, phraseIndex));
  const accuracy = calculateAccuracy(snapshot.keystrokes, snapshot.misses);

  useEffect(() => {
    if (!session || !phrase || isPractice) return;
    recorderRef.current?.draw({
      mission,
      phrase,
      phraseIndex,
      typed: snapshot.typed,
      accuracy,
      keystrokes: snapshot.keystrokes,
      misses: snapshot.misses,
      missionProgress: missionComplete ? 20 : missionProgress,
      completed: missionComplete,
      districtName: districtById.get(mission.districtId)?.name,
    });
  }, [accuracy, isPractice, mission, missionComplete, missionProgress, phrase, phraseIndex, session, snapshot.keystrokes, snapshot.misses, snapshot.typed]);

  const finishMissionVideo = useCallback(async (result: TypingSnapshot) => {
    if (!session || !phrase || recordedMissionRef.current === mission.id) return;
    const recorder = recorderRef.current;
    if (!recorder?.isSupported || !recorder.isRecording()) return;
    recordedMissionRef.current = mission.id;
    recorder.draw({
      mission,
      phrase,
      phraseIndex,
      typed: result.typed,
      accuracy: calculateAccuracy(result.keystrokes, result.misses),
      keystrokes: result.keystrokes,
      misses: result.misses,
      missionProgress: 20,
      completed: true,
      districtName: districtById.get(mission.districtId)?.name,
    });
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const player = safeFilePart(session.preferences.nickname ?? session.keyId);
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const saved = await recorder.finishAndDownload(`KEYCRAFT_${player}_${date}_MISSION${String(mission.number).padStart(3, "0")}`);
    setRecordingStatus(saved ? "saved" : "unsupported");
  }, [mission, phrase, phraseIndex, session]);

  const saveAutomaticArtifacts = useCallback(async () => {
    if (!session || artifactMissionRef.current === mission.id) return;
    artifactMissionRef.current = mission.id;
    setArtifactStatus("saving");
    setArtifactCount(0);
    try {
      const completedPhrasesAfter = session.progress.some((item) => item.phraseId === phrase?.id)
        ? session.progress.length
        : session.progress.length + 1;
      const artifacts = await createAutomaticMissionArtifacts({
        keyId: session.keyId,
        nickname: session.preferences.nickname ?? session.keyId,
        mission,
        completedMissionIdsBefore: session.completedMissionIds,
        completedPhrasesAfter,
      });

      const uploadWithRetry = async (artifact: (typeof artifacts)[number]) => {
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            return await uploadDeliverable({ keyId: session.keyId, ...artifact });
          } catch (error) {
            lastError = error;
            if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 700 * (attempt + 1)));
          }
        }
        throw lastError instanceof Error ? lastError : new Error("成果物を保存できませんでした");
      };

      await Promise.all(artifacts.map(uploadWithRetry));
      setArtifactCount(artifacts.length);
      setArtifactStatus("saved");
    } catch (error) {
      console.error("automatic deliverable save failed", error);
      artifactMissionRef.current = null;
      setArtifactStatus("error");
    }
  }, [mission, phrase?.id, session]);

  const completePhrase = useCallback(async (result: TypingSnapshot) => {
    if (!session || !phrase || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (isPractice) {
        setFeedback("saved");
        if (phraseIndex >= phrases.length - 1) {
          setMissionComplete(true);
        } else {
          window.setTimeout(() => setPhraseIndex((current) => Math.min(phrases.length - 1, current + 1)), 260);
        }
        return;
      }
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
        void finishMissionVideo(result);
        void saveAutomaticArtifacts();
      } else {
        window.setTimeout(() => setPhraseIndex((current) => Math.min(19, current + 1)), 260);
      }
    } catch (error) {
      setFeedback("error");
      setSaveError(error instanceof Error ? error.message : "保存できませんでした。通信を確認してください");
    } finally {
      setSaving(false);
    }
  }, [finishMissionVideo, isPractice, mission.id, phrase, phraseIndex, phrases.length, saveAutomaticArtifacts, savePhrase, saving, session]);

  const restartPractice = () => {
    setPhraseIndex(0);
    setMissionComplete(false);
    setFeedback("ready");
    setSaveError(null);
    resetPhrase(phrases[0]);
  };

  const handlePlayerSwitch = async (keyId: string) => {
    recorderRef.current?.cancel();
    await continueWith(keyId);
    setSwitchingPlayer(false);
    void navigate("/play", { replace: true });
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
  const tokenPercent = (snapshot.tokenProgress / Math.max(1, matcherRef.current?.tokens.length ?? 1)) * 100;
  const roman = phrase.romanization;

  return (
    <div className={`play-page assist-${assistMode}`}>
      <div className="mobile-keyboard-note">このMISSIONはPCキーボードでの利用がおすすめです。</div>
      <header className="play-topbar">
        <Link to="/missions">← MISSION一覧</Link>
        <div><span>MISSION {String(mission.number).padStart(3, "0")}</span><strong>{mission.title}</strong></div>
        <div className="play-actions">
          <div className="assist-badge"><span>ASSIST</span><b>{assistMode.toUpperCase()}</b></div>
          <div className={`assist-badge recording-badge ${recordingStatus}`} title="カメラ・マイクは使用しません">
            <span>{isPractice ? "MODE" : "VIDEO"}</span><b>{recordingStatus === "practice" ? "PRACTICE" : recordingStatus === "recording" ? "● REC" : recordingStatus === "saved" ? "保存済" : recordingStatus === "unsupported" ? "非対応" : "準備中"}</b>
          </div>
          <button className="player-switch-button" type="button" onClick={() => setSwitchingPlayer(true)} disabled={saving}>
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
          <RewardIcon id={mission.reward.id} kind={mission.reward.kind} locked={!missionComplete && !missionWasAlreadyCompleted} size={126} />
          <h2>{mission.reward.name}</h2>
          <p>{mission.description}</p>
          <div><span style={{ width: `${(missionProgress / 20) * 100}%` }} /></div>
          <small>{isPractice ? `練習 あと ${Math.max(0, 20 - missionProgress)} フレーズ` : `あと ${Math.max(0, 20 - missionProgress)} フレーズで完成`}</small>
          <p className="recording-note">{isPractice ? "練習モードでは進捗・報酬・成果物を変更しません。" : "動画成果物：タイピング画面のみ自動記録。カメラ・マイク・デスクトップは記録しません。"}</p>
        </aside>
      </main>

      {switchingPlayer && (
        <PlayerLookupDialog
          description="次の利用者の名前を入力してください。完了したフレーズまで自動保存済みです。"
          currentNickname={session.preferences.nickname}
          currentKeyId={session.keyId}
          onClose={() => setSwitchingPlayer(false)}
          onSelect={handlePlayerSwitch}
          onStartNew={() => { recorderRef.current?.cancel(); void navigate("/?new=1"); }}
        />
      )}

      {missionComplete && (
        <div className="modal-backdrop complete-backdrop">
          <section className="complete-card" role="dialog" aria-modal="true" aria-labelledby="complete-title">
            <p className="eyebrow">{isPractice ? "PRACTICE COMPLETE" : "MISSION COMPLETE"}</p>
            <RewardIcon id={mission.reward.id} kind={mission.reward.kind} size={150} />
            <h1 id="complete-title">{mission.reward.name}<br /><span>{isPractice ? "の練習が完了しました！" : wasCompleteOnOpen ? "は完成済みです" : "が完成しました！"}</span></h1>
            <p>{isPractice ? "進捗や報酬を変えずに、20フレーズをもう一度練習しました。" : wasCompleteOnOpen ? "このMISSIONは練習モードで何度でも遊べます。" : "CRAFT MAPに新しい景色が追加されました。"}</p>
            {!isPractice && !wasCompleteOnOpen && <p>{recordingStatus === "saved" ? "制作動画も納品用ファイルとして保存しました。" : recordingStatus === "recording" ? "制作動画を保存しています…" : "動画保存に対応していないブラウザです。"}</p>}
            {!isPractice && !wasCompleteOnOpen && (
              <p className={`artifact-save-status ${artifactStatus}`} aria-live="polite">
                {artifactStatus === "saving" ? "成果物PNGを自動生成・クラウド保存しています…"
                  : artifactStatus === "saved" ? `成果物PNGを${artifactCount}件、自動保存しました。`
                    : artifactStatus === "error" ? "進捗は保存済みです。成果物PNGの保存だけ自動再試行できませんでした。"
                      : "成果物PNGはMISSION完了後に自動保存されます。"}
              </p>
            )}
            {isPractice ? (
              <div><Link className="button secondary" to="/missions?filter=complete">MISSION一覧へ</Link><button className="button primary" type="button" onClick={restartPractice}>もう一度練習する ↻</button></div>
            ) : wasCompleteOnOpen ? (
              <div><Link className="button secondary" to="/map">MAPを見る</Link><button className="button primary" type="button" onClick={() => navigate(`/play?mission=${mission.id}&practice=1`, { replace: true })}>このMISSIONを練習する ↻</button></div>
            ) : (
              <div><Link className="button secondary" to="/map">MAPを見る</Link><button className="button primary" type="button" disabled={artifactStatus === "saving"} onClick={() => navigate(mission.number >= 250 ? "/complete" : `/play?mission=m${String(mission.number + 1).padStart(3, "0")}`)}>{artifactStatus === "saving" ? "成果物保存中…" : mission.number >= 250 ? "完成記録を見る →" : "次のMISSIONへ →"}</button></div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
