export type AssistMode = "beginner" | "normal" | "challenge";

export interface TextReading {
  text: string;
  reading: string;
}

export interface Zone {
  id: string;
  number: number;
  name: string;
  japaneseName: string;
  description: string;
  level: number;
  accent: string;
}

export interface District {
  id: string;
  zoneId: string;
  number: number;
  name: string;
  reading: string;
  genre: string;
  description: string;
}

export type RewardKind =
  | "gate"
  | "sign"
  | "plaza"
  | "shop"
  | "garden"
  | "workshop"
  | "station"
  | "tower"
  | "festival"
  | "landmark";

export interface Mission {
  id: string;
  number: number;
  zoneId: string;
  districtId: string;
  title: string;
  description: string;
  level: number;
  genre: string;
  reward: {
    id: string;
    name: string;
    kind: RewardKind;
  };
  coordinates: { x: number; y: number };
  phraseIds: string[];
}

export interface Phrase {
  id: string;
  missionId: string;
  order: number;
  text: string;
  reading: string;
  romanization: string;
  level: number;
  genre: string;
}

export interface ContentCatalog {
  generatedAt: string;
  version: number;
  zones: Zone[];
  districts: District[];
  missions: Mission[];
  phrases: Phrase[];
}

export interface PlayerPreferences {
  assistMode: AssistMode;
  genres: string[];
  nickname: string | null;
}

export interface PhraseProgress {
  phraseId: string;
  missionId: string;
  accuracy: number;
  keystrokes: number;
  completedAt: string;
  missKeys: Record<string, number>;
}

export interface PlayerSession {
  keyId: string;
  preferences: PlayerPreferences;
  progress: PhraseProgress[];
  completedMissionIds: string[];
  createdAt: string;
}
