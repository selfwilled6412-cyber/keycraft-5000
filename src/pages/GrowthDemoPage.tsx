import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { RewardIcon } from "../components/RewardIcon";
import { catalog } from "../content/catalog";

const STAGES = [0, 10, 50, 100, 250] as const;
const DISTRICT_ANCHORS = [
  { x: 18, y: 25 },
  { x: 50, y: 18 },
  { x: 81, y: 28 },
  { x: 30, y: 72 },
  { x: 69, y: 72 },
] as const;

const STAGE_COPY: Record<number, { title: string; description: string }> = {
  0: { title: "まだ何もない世界", description: "道路と区画だけ。ここからタイピングで街を作ります。" },
  10: { title: "最初の地区が完成", description: "10 MISSIONで、1つ目のDISTRICTに10個のCRAFTが並びます。" },
  50: { title: "最初のZONEが完成", description: "50 MISSIONで、5 DISTRICTS・50個のCRAFTが1つの街を形づくります。" },
  100: { title: "世界が2つのZONEへ拡張", description: "100 MISSIONで、日常の街から遊びの街まで成長します。" },
  250: { title: "KEY CRAFT WORLD 完成", description: "25 DISTRICTS・250 MISSION・250個のCRAFTがすべて解放された状態です。" },
};

function missionPosition(missionNumber: number, districtNumber: number, x: number, y: number) {
  const indexInZone = (districtNumber - 1) % 5;
  const anchor = DISTRICT_ANCHORS[indexInZone] ?? DISTRICT_ANCHORS[0];
  const jitterX = ((missionNumber * 17) % 9) - 4;
  const jitterY = ((missionNumber * 11) % 7) - 3;
  return {
    left: `${Math.max(6, Math.min(94, anchor.x + (x - 50) * 0.2 + jitterX))}%`,
    top: `${Math.max(8, Math.min(92, anchor.y + (y - 50) * 0.18 + jitterY))}%`,
  };
}

export function GrowthDemoPage() {
  const [stage, setStage] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const visibleMissionIds = useMemo(
    () => new Set(catalog.missions.filter((mission) => mission.number <= stage).map((mission) => mission.id)),
    [stage],
  );

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => {
      setStage((current) => {
        const index = STAGES.indexOf(current as (typeof STAGES)[number]);
        return STAGES[(index + 1) % STAGES.length] ?? 0;
      });
    }, 2300);
    return () => window.clearInterval(timer);
  }, [autoPlay]);

  const copy = STAGE_COPY[stage] ?? STAGE_COPY[0]!;
  const completedDistricts = Math.floor(stage / 10);
  const completedZones = Math.floor(stage / 50);

  return (
    <div className="growth-demo-page">
      <header className="growth-demo-hero">
        <div>
          <p className="eyebrow">PRESENTATION / VERIFIED WORLD GROWTH</p>
          <h1>打つほど、<br /><span>本当に世界ができていく。</span></h1>
          <p>実際の250 MISSION・250 CRAFT・MISSION座標を使った成長シミュレーターです。利用者のD1進捗は変更しません。</p>
        </div>
        <div className="growth-proof-card">
          <span>SIMULATION</span>
          <strong>{stage}<small> / 250</small></strong>
          <b>MISSION COMPLETE</b>
        </div>
      </header>

      <section className="growth-controls" aria-label="成長段階を選ぶ">
        <div className="growth-stage-buttons">
          {STAGES.map((value) => (
            <button key={value} className={stage === value ? "active" : ""} type="button" onClick={() => { setAutoPlay(false); setStage(value); }}>
              <strong>{value}</strong><span>MISSION</span>
            </button>
          ))}
        </div>
        <button className={`growth-autoplay ${autoPlay ? "active" : ""}`} type="button" onClick={() => setAutoPlay((current) => !current)}>
          {autoPlay ? "■ 自動再生を止める" : "▶ 成長を自動再生"}
        </button>
      </section>

      <section className="growth-summary">
        <div className="growth-summary-copy"><span>NOW</span><h2>{copy.title}</h2><p>{copy.description}</p></div>
        <div className="growth-metrics">
          <div><strong>{stage}</strong><span>CRAFT / 250</span></div>
          <div><strong>{completedDistricts}</strong><span>DISTRICTS / 25</span></div>
          <div><strong>{completedZones}</strong><span>ZONES / 5</span></div>
        </div>
      </section>

      <section className="growth-world" aria-label={`${stage} MISSION完成時の世界`}>
        {catalog.zones.map((zone) => {
          const zoneDistricts = catalog.districts.filter((district) => district.zoneId === zone.id);
          const zoneMissions = catalog.missions.filter((mission) => mission.zoneId === zone.id);
          const visibleInZone = zoneMissions.filter((mission) => visibleMissionIds.has(mission.id));
          return (
            <article className={`growth-zone ${visibleInZone.length > 0 ? "awake" : "sleeping"}`} key={zone.id} style={{ "--zone": zone.accent } as CSSProperties}>
              <header>
                <div><span>ZONE {String(zone.number).padStart(2, "0")}</span><h3>{zone.japaneseName}</h3></div>
                <strong>{visibleInZone.length}<small> / 50</small></strong>
              </header>
              <div className="growth-zone-canvas">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M8 50H92M50 8V92M15 18C34 34 66 34 85 18M15 82C34 66 66 66 85 82" />
                  <path d="M20 28L80 72M80 28L20 72" />
                </svg>
                {zoneDistricts.map((district, districtIndex) => {
                  const anchor = DISTRICT_ANCHORS[districtIndex] ?? DISTRICT_ANCHORS[0];
                  return <span className="growth-district-label" key={district.id} style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}>{district.name}</span>;
                })}
                {visibleInZone.map((mission) => {
                  const district = zoneDistricts.find((item) => item.id === mission.districtId);
                  if (!district) return null;
                  const position = missionPosition(mission.number, district.number, mission.coordinates.x, mission.coordinates.y);
                  return (
                    <span className="growth-building" key={mission.id} style={position} title={`${mission.number}. ${mission.reward.name}`}>
                      <RewardIcon id={mission.reward.id} kind={mission.reward.kind} size={28} />
                    </span>
                  );
                })}
                {visibleInZone.length === 0 && <div className="growth-empty-zone"><span>LOCKED</span><b>タイピングで解放</b></div>}
              </div>
              <footer><span>{zone.name}</span><b>{visibleInZone.length === 50 ? "ZONE COMPLETE" : `${50 - visibleInZone.length} CRAFTS TO GO`}</b></footer>
            </article>
          );
        })}
      </section>

      <section className="growth-evidence">
        <p className="eyebrow">VERIFICATION POINTS</p>
        <div>
          <article><strong>250</strong><span>MISSION = 250 CRAFT</span><p>MISSIONごとに固有の報酬IDを持ち、完成数と建物表示数が1対1で増えます。</p></article>
          <article><strong>25 × 10</strong><span>DISTRICTS</span><p>各DISTRICTは10 MISSION。10個完成するたび、ひとつの地区が完成します。</p></article>
          <article><strong>5 × 50</strong><span>ZONES</span><p>各ZONEは50 MISSION。50・100・150・200・250で世界が大きく広がります。</p></article>
        </div>
      </section>
    </div>
  );
}
