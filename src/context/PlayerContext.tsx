import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPlayer, fetchSession, postPhraseProgress, putPreferences, type SavePhraseInput, type SavePhraseResult } from "../api/client";
import type { PlayerPreferences, PlayerSession } from "../content/types";

const LAST_KEY_ID = "keycraft:last-key-id";

interface PlayerContextValue {
  session: PlayerSession | null;
  loading: boolean;
  error: string | null;
  startNew: (nickname: string) => Promise<PlayerSession>;
  continueWith: (keyId: string) => Promise<PlayerSession>;
  savePhrase: (input: Omit<SavePhraseInput, "keyId">) => Promise<SavePhraseResult>;
  savePreferences: (preferences: PlayerPreferences) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const continueWith = useCallback(async (rawKeyId: string) => {
    const keyId = rawKeyId.trim().toUpperCase();
    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchSession(keyId);
      window.localStorage.setItem(LAST_KEY_ID, loaded.keyId);
      setSession(loaded);
      return loaded;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "KEY IDを読み込めませんでした";
      setError(message);
      throw caught;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const keyId = window.localStorage.getItem(LAST_KEY_ID);
    if (!keyId) {
      setLoading(false);
      return;
    }
    void continueWith(keyId).catch(() => {
      window.localStorage.removeItem(LAST_KEY_ID);
      setLoading(false);
    });
  }, [continueWith]);

  const startNew = useCallback(async (nickname: string) => {
    const name = nickname.trim();
    if (!name) throw new Error("利用者名を入力してください");
    setLoading(true);
    setError(null);
    try {
      const { keyId } = await createPlayer();
      const loaded = await continueWith(keyId);
      const preferences = { ...loaded.preferences, nickname: name };
      await putPreferences({ keyId, ...preferences });
      const namedSession = { ...loaded, preferences };
      setSession(namedSession);
      return namedSession;
    } finally {
      setLoading(false);
    }
  }, [continueWith]);

  const savePhrase = useCallback(async (input: Omit<SavePhraseInput, "keyId">) => {
    if (!session) throw new Error("KEY IDがありません");
    const result = await postPhraseProgress({ ...input, keyId: session.keyId });
    setSession((current) => {
      if (!current || current.progress.some((item) => item.phraseId === input.phraseId)) return current;
      return {
        ...current,
        progress: [...current.progress, { ...input, completedAt: new Date().toISOString() }],
        completedMissionIds: result.missionCompleted && !current.completedMissionIds.includes(input.missionId)
          ? [...current.completedMissionIds, input.missionId]
          : current.completedMissionIds,
      };
    });
    return result;
  }, [session]);

  const savePreferences = useCallback(async (preferences: PlayerPreferences) => {
    if (!session) throw new Error("KEY IDがありません");
    await putPreferences({ keyId: session.keyId, ...preferences });
    setSession((current) => current ? { ...current, preferences } : current);
  }, [session]);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(LAST_KEY_ID);
    setSession(null);
    setError(null);
  }, []);

  const value = useMemo<PlayerContextValue>(() => ({
    session,
    loading,
    error,
    startNew,
    continueWith,
    savePhrase,
    savePreferences,
    signOut,
    clearError: () => setError(null),
  }), [session, loading, error, startNew, continueWith, savePhrase, savePreferences, signOut]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePlayer must be used inside PlayerProvider");
  return value;
}
