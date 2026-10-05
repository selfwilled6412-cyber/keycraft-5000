import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GameGate } from "../components/GameGate";
import { catalog } from "../content/catalog";
import type { Phrase } from "../content/types";
import { calculateAccuracy, RomanizationMatcher, type TypingSnapshot } from "../core/typing";
import { usePlayer } from "../context/PlayerContext";
import { dateKey, selectEndlessPhrases } from "../game/endless";

const emptySnapshot: TypingSnapshot = { completed: false, nextKeys: [], tokenProgress: 0, typed: "", misses: 0, keystrokes: 0, missKeys: {} };

export function EndlessPage() {
  const { session } = usePlayer();
  const [run, setRun] = useState(0);
  const [index, setIndex] = useState(0);
  const [snapshot, setSnapshot] = useState<TypingSnapshot>(emptySnapshot);
  const [finished, setFinished] = useState(false);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [totalMisses, setTotalMisses] = useState(0);
  const matcherRef = useRef<RomanizationMatcher | null>(null);
  const advancingRef = useRef(false);
  const today = useMemo(() => dateKey(), []);
  const phrases = useMemo(() => selectEndlessPhrases(catalog.phrases, today, run), [run, today]);
  const phrase: Phrase | undefined = phrases[index];

  const resetPhrase = useCallback((nextPhrase: Phrase | undefined) => {
    if (!nextPhrase) return;
    const matcher = new RomanizationMatcher(nextPhrase.reading);
    matcherRef.current = matcher;
    advancingRef.current = false;
    setSnapshot(matcher.snapshot());
  }, []);

  useEffect(() => resetPhrase(phrase), [phrase, resetPhrase]);

  useEffect(() => {
    if (!session || finished) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Escape") {
        event.preventDefault();
        resetPhrase(phrase);
        return;
      }
      if (event.key.length !== 1 || advancingRef.current) return;
      const result = matcherRef.current?.press(event.key);
      if (!result) return;
      event.preventDefault();
      setSnapshot(result);
      if (!result.completed) return;
      advancingRef.current = true;
      setTotalStrokes((value) => value + result.keystrokes);
      setTotalMisses((value) => value + result.misses);
      window.setTimeout(() => {
        if (index >= phrases.length - 1) setFinished(true);
        else setIndex((value) => value + 1);
      }, 180);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finished, index, phrase, phrases.length, resetPhrase, session]);

  if (!session) return <GameGate title="無限チャレンジを始める準備をしよう" />;

  const completed = finished ? phrases.length : index;
  const liveStrokes = totalStrokes + snapshot.keystrokes;
  const liveMisses = totalMisses + snapshot.misses;
  const accuracy = calculateAccuracy(liveStrokes, liveMisses);
  const startNext = () => {
    setRun((value) => value + 1);
    setIndex(0);
    setFinished(false);
    setTotalStrokes(0);
    setTotalMisses(0);
  };

  return (
    <div className="page endless-page section-pad">
      <header className="endless-heading">
        <div><p className="eyebrow">DAILY / ENDLESS</p><h1>終わらない20問</h1><p>10,000問から今日のセットを選出。成績台帳を変えず、何周でも挑戦できます。</p></div>
        <div className="endless-date"><span>TODAY</span><strong>{today}</strong><small>SET {String(run + 1).padStart(2, "0")}</small></div>
      </header>

      {finished ? (
        <section className="endless-finish">
          <span>∞</span><p className="eyebrow">20 PHRASES CLEAR</p><h2>今日のセットを突破！</h2>
          <div><b>{accuracy.toFixed(1)}%</b><small>ACCURACY</small><b>{liveStrokes}</b><small>KEYS</small></div>
          <button className="button primary" type="button" onClick={startNext}>次の20問へ →</button>
          <Link className="button secondary" to="/">拠点へ戻る</Link>
        </section>
      ) : phrase ? (
        <section className={`endless-console ${snapshot.misses > 0 ? "has-miss" : ""}`}>
          <div className="endless-progress"><span><i style={{ width: `${(completed / phrases.length) * 100}%` }} /></span><b>{index + 1} / {phrases.length}</b></div>
          <div className="endless-source"><small>{phrase.genre} · LEVEL {phrase.level} · {phrase.id}</small><h2>{phrase.text}</h2><p>{phrase.reading}</p></div>
          <div className="endless-roman"><span>{snapshot.typed || " "}</span><b>{snapshot.nextKeys.map((key) => key.toUpperCase()).join(" / ") || "READY"}</b></div>
          <div className="endless-stats"><span><small>ACCURACY</small><b>{accuracy.toFixed(1)}%</b></span><span><small>MISSES</small><b>{liveMisses}</b></span><span><small>KEYS</small><b>{liveStrokes}</b></span></div>
          <p className="endless-help">キーボードで入力 · ESCで現在の問題をやり直す</p>
        </section>
      ) : null}
    </div>
  );
}
