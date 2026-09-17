import type { Mission, Phrase } from "../content/types";

export interface TypingVideoFrame {
  mission: Mission;
  phrase: Phrase;
  phraseIndex: number;
  typed: string;
  accuracy: number;
  keystrokes: number;
  misses: number;
  missionProgress: number;
  completed: boolean;
  districtName?: string;
}

export interface TypingVideoRecorder {
  start: () => boolean;
  draw: (frame: TypingVideoFrame) => void;
  finishAndDownload: (fileBaseName: string) => Promise<boolean>;
  cancel: () => void;
  isSupported: boolean;
  isRecording: () => boolean;
}

const WIDTH = 1280;
const HEIGHT = 720;

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const drawWrapped = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2) => {
  const chars = [...text];
  let line = "";
  let lineNo = 0;
  for (const char of chars) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineNo * lineHeight);
      lineNo += 1;
      line = char;
      if (lineNo >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (lineNo < maxLines) ctx.fillText(line, x, y + lineNo * lineHeight);
};

export function createTypingVideoRecorder(): TypingVideoRecorder {
  const isSupported = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement !== "undefined" && "captureStream" in HTMLCanvasElement.prototype;
  if (!isSupported) {
    return { start: () => false, draw: () => {}, finishAndDownload: async () => false, cancel: () => {}, isSupported: false, isRecording: () => false };
  }

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let stream: MediaStream | null = null;

  const draw = (frame: TypingVideoFrame) => {
    if (!ctx) return;
    const progress = Math.max(0, Math.min(20, frame.missionProgress));
    const complete = frame.completed;

    const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bg.addColorStop(0, "#07111f");
    bg.addColorStop(1, "#10223b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#7dd3fc";
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillText(`KEY CRAFT 5000  /  MISSION ${String(frame.mission.number).padStart(3, "0")}`, 60, 58);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 30px system-ui, sans-serif";
    ctx.fillText(frame.mission.title, 60, 100);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 18px system-ui, sans-serif";
    ctx.fillText(frame.districtName ?? "CRAFT DISTRICT", 60, 132);

    roundedRect(ctx, 60, 170, 820, 430, 26);
    ctx.fillStyle = "rgba(15,23,42,.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(125,211,252,.28)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText(`PHRASE ${String(frame.phraseIndex + 1).padStart(2, "0")}`, 100, 220);
    ctx.fillStyle = "#dbeafe";
    ctx.font = "600 24px system-ui, sans-serif";
    drawWrapped(ctx, frame.phrase.reading, 100, 265, 730, 34, 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 38px system-ui, sans-serif";
    drawWrapped(ctx, frame.phrase.text, 100, 345, 730, 52, 2);

    roundedRect(ctx, 100, 455, 730, 82, 18);
    ctx.fillStyle = "#081321";
    ctx.fill();
    ctx.fillStyle = frame.typed ? "#67e8f9" : "#64748b";
    ctx.font = "700 25px ui-monospace, SFMono-Regular, Menlo, monospace";
    drawWrapped(ctx, frame.typed || "ここに入力が表示されます", 124, 505, 680, 30, 1);

    const barWidth = 730;
    roundedRect(ctx, 100, 560, barWidth, 12, 6);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    roundedRect(ctx, 100, 560, barWidth * (progress / 20), 12, 6);
    ctx.fillStyle = "#22d3ee";
    ctx.fill();

    roundedRect(ctx, 920, 170, 300, 430, 26);
    ctx.fillStyle = "rgba(15,23,42,.92)";
    ctx.fill();
    ctx.fillStyle = complete ? "#34d399" : "#fbbf24";
    ctx.font = "900 22px system-ui, sans-serif";
    ctx.fillText(complete ? "MISSION COMPLETE" : "LIVE CRAFTING", 958, 220);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 52px system-ui, sans-serif";
    ctx.fillText(`${progress}/20`, 958, 300);
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("MISSION PROGRESS", 958, 330);

    const stats: Array<[string, string]> = [
      ["正確さ", `${frame.accuracy}%`],
      ["入力", String(frame.keystrokes)],
      ["ミス", String(frame.misses)],
    ];
    stats.forEach(([label, value], index) => {
      const yy = 390 + index * 60;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 17px system-ui, sans-serif";
      ctx.fillText(label, 958, yy);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 24px system-ui, sans-serif";
      ctx.fillText(value, 1090, yy);
    });

    ctx.fillStyle = "#64748b";
    ctx.font = "500 16px system-ui, sans-serif";
    ctx.fillText("画面のみ自動記録 / カメラ・マイク不使用", 60, 670);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(new Date().toLocaleString("ja-JP"), 950, 670);
  };

  const start = () => {
    if (!ctx || recorder?.state === "recording") return false;
    stream = (canvas as HTMLCanvasElement & { captureStream: (frameRate?: number) => MediaStream }).captureStream(30);
    const preferred = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
    recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred, videoBitsPerSecond: 2_500_000 } : { videoBitsPerSecond: 2_500_000 });
    chunks = [];
    recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
    recorder.start(1000);
    return true;
  };

  const finishAndDownload = async (fileBaseName: string) => {
    if (!recorder || recorder.state !== "recording") return false;
    const activeRecorder = recorder;
    return await new Promise<boolean>((resolve) => {
      activeRecorder.onstop = () => {
        const mime = activeRecorder.mimeType || "video/webm";
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${fileBaseName}.webm`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        recorder = null;
        chunks = [];
        resolve(true);
      };
      activeRecorder.stop();
    });
  };

  const cancel = () => {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    recorder = null;
    stream = null;
    chunks = [];
  };

  return { start, draw, finishAndDownload, cancel, isSupported: true, isRecording: () => recorder?.state === "recording" };
}
