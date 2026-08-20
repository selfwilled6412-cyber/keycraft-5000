import { useMemo, useRef } from "react";
import { townCoreWebp } from "../assets/townCore";
import { GameGate } from "../components/GameGate";
import { catalog } from "../content/catalog";
import type { Mission } from "../content/types";
import { usePlayer } from "../context/PlayerContext";

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
    ctx.fillStyle = "#06101b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((png) => png && downloadBlob(png, filename), "image/png", .96);
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

function SceneBase() {
  return (
    <>
      <defs>
        <linearGradient id="scene-dark" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#04101b" stopOpacity=".1" />
          <stop offset=".6" stopColor="#04101b" stopOpacity=".08" />
          <stop offset="1" stopColor="#02060b" stopOpacity=".92" />
        </linearGradient>
        <linearGradient id="gold-line" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#ffc754"/><stop offset="1" stopColor="#7c5414"/></linearGradient>
        <filter id="soft-shadow"><feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000" floodOpacity=".75"/></filter>
      </defs>
      <rect width="1600" height="900" fill="#07111f" />
      <image href={townCoreWebp} x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice" />
      <rect width="1600" height="900" fill="url(#scene-dark)" />
      <rect x="34" y="34" width="1532" height="832" rx="26" fill="none" stroke="#b8862d" strokeWidth="3" opacity=".72" />
      <rect x="45" y="45" width="1510" height="810" rx="20" fill="none" stroke="#35485b" strokeWidth="1" opacity=".9" />
    </>
  );
}

function MissionBadges({ missions, completedIds }: { missions: Mission[]; completedIds: string[] }) {
  return (
    <g transform="translate(80 706)">
      {missions.map((mission, index) => {
        const complete = completedIds.includes(mission.id);
        const x = index * 142;
        return (
          <g key={mission.id} transform={`translate(${x} 0)`} opacity={complete ? 1 : .34}>
            <rect width="118" height="92" rx="14" fill={complete ? "#10283a" : "#09121d"} stroke={complete ? "#6bcdf2" : "#465463"} strokeWidth="2" />
            <circle cx="59" cy="34" r="19" fill={complete ? "#f4b942" : "#263646"} />
            <text x="59" y="41" textAnchor="middle" fill="#07111f" fontSize="17" fontWeight="900" fontFamily="sans-serif">{String(mission.number).padStart(2,"0")}</text>
            <text x="59" y="70" textAnchor="middle" fill={complete ? "#ffffff" : "#8192a1"} fontSize="12" fontWeight="700" fontFamily="sans-serif">{complete ? "COMPLETE" : "LOCKED"}</text>
          </g>
        );
      })}
    </g>
  );
}

function CityPosterArtwork({ missions, completedIds, title, subtitle, player }: { missions: Mission[]; completedIds: string[]; title: string; subtitle: string; player: string }) {
  const completed = missions.filter((mission) => completedIds.includes(mission.id)).length;
  return (
    <>
      <SceneBase />
      <g filter="url(#soft-shadow)">
        <rect x="72" y="72" width="640" height="206" rx="18" fill="#07101a" fillOpacity=".88" stroke="#9a7428" strokeWidth="2" />
        <text x="104" y="116" fill="#60c9f4" fontSize="20" fontWeight="800" fontFamily="sans-serif" letterSpacing="3">KEY CRAFT 5000 / DISTRICT ART</text>
        <text x="104" y="176" fill="#ffffff" fontSize="48" fontWeight="900" fontFamily="sans-serif">{title}</text>
        <text x="104" y="218" fill="#a9bfd5" fontSize="23" fontFamily="sans-serif">{subtitle}</text>
        <text x="104" y="254" fill="#f0bd53" fontSize="18" fontWeight="700" fontFamily="sans-serif">BUILDER: {player}</text>
      </g>
      <g transform="translate(1170 88)" filter="url(#soft-shadow)">
        <rect width="338" height="154" rx="18" fill="#07101a" fillOpacity=".9" stroke="#9a7428" strokeWidth="2" />
        <text x="28" y="42" fill="#f0bd53" fontSize="18" fontWeight="900" fontFamily="sans-serif">CRAFT PROGRESS</text>
        <text x="28" y="105" fill="#ffffff" fontSize="58" fontWeight="900" fontFamily="sans-serif">{completed}<tspan fill="#9fb1c2" fontSize="28"> / 10</tspan></text>
      </g>
      <MissionBadges missions={missions} completedIds={completedIds} />
      <text x="80" y="850" fill="#75e3d0" fontSize="24" fontFamily="sans-serif" fontWeight="800">打つほど、世界ができていく。</text>
    </>
  );
}

function DistrictMapArtwork({ missions, completedIds, title, subtitle }: { missions: Mission[]; completedIds: string[]; title: string; subtitle: string }) {
  return (
    <>
      <SceneBase />
      <rect x="64" y="66" width="1472" height="122" rx="18" fill="#06101a" fillOpacity=".87" stroke="#7b8ea1" strokeWidth="1.5" />
      <text x="94" y="118" fill="#ffffff" fontSize="42" fontWeight="900" fontFamily="sans-serif">{title}</text>
      <text x="96" y="156" fill="#9fb6ca" fontSize="20" fontFamily="sans-serif">{subtitle} / LIVE CRAFT MAP</text>
      <path d="M140 620C370 520 490 608 690 502S1030 455 1440 585" fill="none" stroke="#08111b" strokeWidth="34" opacity=".75" strokeLinecap="round" />
      <path d="M140 620C370 520 490 608 690 502S1030 455 1440 585" fill="none" stroke="#d7b257" strokeWidth="8" opacity=".75" strokeLinecap="round" />
      {missions.map((mission, index) => {
        const complete = completedIds.includes(mission.id);
        const x = 155 + index * 142;
        const y = 616 - Math.sin(index * .9) * 68;
        return (
          <g key={mission.id} transform={`translate(${x} ${y})`} filter="url(#soft-shadow)">
            <circle r="43" fill={complete ? "#102b3e" : "#09131d"} stroke={complete ? "#76dbff" : "#566372"} strokeWidth="4" />
            <circle r="29" fill={complete ? "#f0b849" : "#1a2734"} />
            <text y="8" textAnchor="middle" fill={complete ? "#06101a" : "#8d9baa"} fontSize="22" fontWeight="900" fontFamily="sans-serif">{String(mission.number).padStart(2,"0")}</text>
          </g>
        );
      })}
      <g transform="translate(1110 720)">
        <rect width="386" height="102" rx="16" fill="#07101a" fillOpacity=".88" stroke="#8f6a27" strokeWidth="2" />
        <text x="24" y="38" fill="#efb846" fontSize="16" fontWeight="900" fontFamily="sans-serif">CURRENT DISTRICT</text>
        <text x="24" y="74" fill="#ffffff" fontSize="24" fontWeight="800" fontFamily="sans-serif">MISSION進行が街に蓄積</text>
      </g>
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
  const player = session.preferences.nickname ?? session.keyId;

  return (
    <div className="page section-pad">
      <header className="page-heading">
        <div><p className="eyebrow">DELIVERABLES</p><h1>納品成果物</h1><p>線画ではなく、現在の街をゲームアートとしてPNG/SVGに書き出します。</p></div>
      </header>

      <section style={{ display: "grid", gap: "28px" }}>
        <article className="panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "end", flexWrap: "wrap" }}>
            <div><p className="eyebrow">PRODUCT 01</p><h2>現在地のゲームMAP</h2><p>{title} — {completedHere}/10 CRAFTS</p></div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" className="primary-button" onClick={() => mapRef.current && exportPng(mapRef.current, `${base}_MAP.png`)}>PNGで保存</button>
              <button type="button" className="secondary-button" onClick={() => mapRef.current && exportSvg(mapRef.current, `${base}_MAP.svg`)}>SVGで保存</button>
            </div>
          </div>
          <div style={{ marginTop: "18px", overflow: "hidden", borderRadius: "22px", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 24px 70px rgba(0,0,0,.4)" }}>
            <svg ref={mapRef} viewBox="0 0 1600 900" style={{ display: "block", width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg"><DistrictMapArtwork missions={missions} completedIds={session.completedMissionIds} title={title} subtitle={subtitle} /></svg>
          </div>
        </article>

        <article className="panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "end", flexWrap: "wrap" }}>
            <div><p className="eyebrow">PRODUCT 02</p><h2>街の完成ポスター</h2><p>背景・建物・住民が見えるゲーム画面を、そのまま納品用ポスターにします。</p></div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" className="primary-button" onClick={() => townRef.current && exportPng(townRef.current, `${base}_CITY.png`)}>PNGで保存</button>
              <button type="button" className="secondary-button" onClick={() => townRef.current && exportSvg(townRef.current, `${base}_CITY.svg`)}>SVGで保存</button>
            </div>
          </div>
          <div style={{ marginTop: "18px", overflow: "hidden", borderRadius: "22px", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 24px 70px rgba(0,0,0,.4)" }}>
            <svg ref={townRef} viewBox="0 0 1600 900" style={{ display: "block", width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg"><CityPosterArtwork missions={missions} completedIds={session.completedMissionIds} title={title} subtitle={subtitle} player={player} /></svg>
          </div>
        </article>
      </section>
    </div>
  );
}
