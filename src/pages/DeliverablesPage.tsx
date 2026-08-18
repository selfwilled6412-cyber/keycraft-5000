import { useMemo, useRef } from "react";
import { GameGate } from "../components/GameGate";
import { catalog } from "../content/catalog";
import type { Mission, RewardKind } from "../content/types";
import { usePlayer } from "../context/PlayerContext";

const kindShape: Record<RewardKind, string> = {
  gate: "M-18 16V-8L0-22 18-8v24h-8V-4H-10v20Z",
  sign: "M-3 24h6V0h16v-18h-38V0h16Z",
  plaza: "M0-22 22-10 0 2-22-10Zm-18 17L0 7 18-5v16L0 22-18 11Z",
  shop: "M-20-4h40v27h-40Zm-4 0 6-18h36l6 18-8 6-8-6-8 6-8-6-8 6Z",
  garden: "M-24 18h48v7h-48Zm22 0V0h4v18Zm-10-12a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm20 0a11 11 0 1 1 0-22 11 11 0 0 1 0 22Z",
  workshop: "M-22 22V0L0-16 22 0v22Zm0-22v-16h10v9L0-16 22 0",
  station: "M-22 22V-10h44v32ZM-26-10 0-24l26 14Z",
  tower: "M-12 23-5-20h10l7 43Zm-8 0h40v5h-40Zm5-14h30v4h-30Zm5-15h20v4h-20Z",
  festival: "M-18-24h4v50h-4Zm32 0h4v50h-4ZM-14-20c10 7 18-5 28 2V6c-10-7-18 5-28-2Z",
  landmark: "M0-26 26-8 18 24h-36l-8-32Zm0 8 14 12-5 20h-18l-5-20Z",
};

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportSvg(svg: SVGSVGElement, filename: string) {
  const xml = new XMLSerializer().serializeToString(svg);
  downloadBlob(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }), filename);
}

function exportPng(svg: SVGSVGElement, filename: string) {
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 900;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#07111f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((png) => png && downloadBlob(png, filename), "image/png");
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

function TownArtwork({ missions, completedIds, title, subtitle }: { missions: Mission[]; completedIds: string[]; title: string; subtitle: string }) {
  return (
    <>
      <rect width="1600" height="900" fill="#07111f" />
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#162a4d" /><stop offset="1" stopColor="#07111f" /></linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#102a32" /><stop offset="1" stopColor="#0b1825" /></linearGradient>
      </defs>
      <rect width="1600" height="610" fill="url(#sky)" />
      <circle cx="1320" cy="140" r="72" fill="#f8d96a" opacity=".92" />
      <path d="M0 570 C300 500 470 620 760 540 S1180 510 1600 590 V900 H0Z" fill="url(#ground)" />
      <path d="M0 690 C360 620 540 760 850 670 S1260 630 1600 710" fill="none" stroke="#e8c56a" strokeWidth="22" opacity=".45" />
      <text x="80" y="110" fill="#ffffff" fontSize="54" fontFamily="sans-serif" fontWeight="700">{title}</text>
      <text x="82" y="158" fill="#a9bfd5" fontSize="25" fontFamily="sans-serif">{subtitle}</text>
      {missions.map((mission, i) => {
        const complete = completedIds.includes(mission.id);
        const x = 120 + (i % 5) * 300;
        const row = Math.floor(i / 5);
        const y = 520 + row * 150 + ((i % 2) * 20);
        return (
          <g key={mission.id} transform={`translate(${x} ${y}) scale(2.4)`} opacity={complete ? 1 : .14}>
            <path d={kindShape[mission.reward.kind]} fill={complete ? "#70d6c2" : "#64748b"} stroke="#d8fff5" strokeWidth="1.2" />
            <text x="0" y="43" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="sans-serif">{mission.number}</text>
          </g>
        );
      })}
      <text x="80" y="840" fill="#7fe7d2" fontSize="30" fontFamily="sans-serif" fontWeight="700">KEY CRAFT 5000</text>
      <text x="1510" y="840" fill="#a9bfd5" fontSize="24" textAnchor="end" fontFamily="sans-serif">打つほど、世界ができていく。</text>
    </>
  );
}

function MapArtwork({ missions, completedIds, title, subtitle }: { missions: Mission[]; completedIds: string[]; title: string; subtitle: string }) {
  return (
    <>
      <rect width="1600" height="900" fill="#07111f" />
      <text x="80" y="100" fill="#ffffff" fontSize="50" fontFamily="sans-serif" fontWeight="700">{title}</text>
      <text x="82" y="145" fill="#a9bfd5" fontSize="24" fontFamily="sans-serif">{subtitle}</text>
      <rect x="70" y="190" width="1460" height="620" rx="34" fill="#0c1c2d" stroke="#27445c" strokeWidth="4" />
      <path d="M160 260C420 190 520 410 820 300S1210 180 1440 310M170 680c250-250 430 20 690-120s390-40 570 120M430 220c-100 190 60 320-70 520M1150 220c80 180-50 320 30 520" fill="none" stroke="#31516a" strokeWidth="16" strokeLinecap="round" />
      {missions.map((mission) => {
        const complete = completedIds.includes(mission.id);
        const x = 120 + (mission.coordinates.x / 100) * 1360;
        const y = 240 + (mission.coordinates.y / 100) * 500;
        return (
          <g key={mission.id} transform={`translate(${x} ${y})`}>
            <circle r="46" fill={complete ? "#173f43" : "#111827"} stroke={complete ? "#74e3cd" : "#334155"} strokeWidth="5" />
            <g transform="scale(1.15)"><path d={kindShape[mission.reward.kind]} fill={complete ? "#8cebd8" : "#475569"} opacity={complete ? 1 : .35} /></g>
            <text y="72" textAnchor="middle" fill={complete ? "#ffffff" : "#64748b"} fontSize="22" fontFamily="sans-serif">{mission.number}</text>
          </g>
        );
      })}
      <text x="80" y="860" fill="#7fe7d2" fontSize="28" fontFamily="sans-serif" fontWeight="700">KEY CRAFT 5000 / CRAFT MAP</text>
    </>
  );
}

export function DeliverablesPage() {
  const { session } = usePlayer();
  const mapRef = useRef<SVGSVGElement>(null);
  const townRef = useRef<SVGSVGElement>(null);

  const currentMission = useMemo(() => session ? catalog.missions.find((m) => !session.completedMissionIds.includes(m.id)) ?? catalog.missions[catalog.missions.length - 1] : undefined, [session]);
  const district = currentMission ? catalog.districts.find((d) => d.id === currentMission.districtId) : undefined;
  const zone = district ? catalog.zones.find((z) => z.id === district.zoneId) : undefined;
  const missions = district ? catalog.missions.filter((m) => m.districtId === district.id) : [];
  const completedHere = session ? missions.filter((m) => session.completedMissionIds.includes(m.id)).length : 0;

  if (!session || !district || !zone || !currentMission) return <GameGate title="成果物をつくる準備をしよう" />;

  const base = `KEYCRAFT_${safeName(session.preferences.nickname ?? session.keyId)}_DISTRICT_${String(district.number).padStart(2, "0")}`;
  const title = `${district.name} / DISTRICT ${String(district.number).padStart(2, "0")}`;
  const subtitle = `${zone.name} · ${completedHere}/10 CRAFTS COMPLETE`;

  return (
    <div className="page section-pad">
      <header className="page-heading">
        <div><p className="eyebrow">DELIVERABLES</p><h1>納品成果物</h1><p>いま作っている街を、そのまま商品として書き出します。</p></div>
      </header>

      <section style={{ display: "grid", gap: "28px" }}>
        <article className="panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "end", flexWrap: "wrap" }}>
            <div><p className="eyebrow">PRODUCT 01</p><h2>現在地の町MAP</h2><p>{title} — {completedHere}/10 CRAFTS</p></div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" className="primary-button" onClick={() => mapRef.current && exportPng(mapRef.current, `${base}_MAP.png`)}>PNGで保存</button>
              <button type="button" className="secondary-button" onClick={() => mapRef.current && exportSvg(mapRef.current, `${base}_MAP.svg`)}>SVGで保存</button>
            </div>
          </div>
          <div style={{ marginTop: "18px", overflow: "hidden", borderRadius: "22px", border: "1px solid rgba(255,255,255,.12)" }}>
            <svg ref={mapRef} viewBox="0 0 1600 900" style={{ display: "block", width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg"><MapArtwork missions={missions} completedIds={session.completedMissionIds} title={title} subtitle={subtitle} /></svg>
          </div>
        </article>

        <article className="panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "end", flexWrap: "wrap" }}>
            <div><p className="eyebrow">PRODUCT 02</p><h2>現在地の街イラスト</h2><p>完成したCRAFTだけが街並みに現れます。</p></div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" className="primary-button" onClick={() => townRef.current && exportPng(townRef.current, `${base}_CITY.png`)}>PNGで保存</button>
              <button type="button" className="secondary-button" onClick={() => townRef.current && exportSvg(townRef.current, `${base}_CITY.svg`)}>SVGで保存</button>
            </div>
          </div>
          <div style={{ marginTop: "18px", overflow: "hidden", borderRadius: "22px", border: "1px solid rgba(255,255,255,.12)" }}>
            <svg ref={townRef} viewBox="0 0 1600 900" style={{ display: "block", width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg"><TownArtwork missions={missions} completedIds={session.completedMissionIds} title={title} subtitle={subtitle} /></svg>
          </div>
        </article>
      </section>
    </div>
  );
}
