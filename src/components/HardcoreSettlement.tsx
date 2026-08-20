interface HardcoreSettlementProps {
  completedCrafts: number;
  currentCraft?: number;
  compact?: boolean;
}

const buildings = [
  { x: 170, y: 302, s: .92, threshold: 1 },
  { x: 310, y: 245, s: .78, threshold: 2 },
  { x: 705, y: 250, s: 1.05, threshold: 3 },
  { x: 790, y: 365, s: .76, threshold: 4 },
  { x: 160, y: 420, s: .72, threshold: 5 },
  { x: 665, y: 455, s: .86, threshold: 6 },
  { x: 300, y: 490, s: .68, threshold: 7 },
  { x: 820, y: 510, s: .72, threshold: 8 },
  { x: 525, y: 505, s: .62, threshold: 9 },
  { x: 105, y: 535, s: .6, threshold: 10 },
];

function Cabin({ x, y, s, active }: { x: number; y: number; s: number; active: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={active ? 1 : .16} className={active ? "hc-building built" : "hc-building blueprint"}>
      <ellipse cx="0" cy="44" rx="86" ry="25" fill="#07111d" opacity=".6" />
      <path d="M-62 6 0-29 64 7 2 43Z" fill="url(#hc-roof)" stroke="#7e91a8" strokeWidth="2" />
      <path d="M-53 8 1 39 1 91-53 59Z" fill="url(#hc-wall-left)" stroke="#202d3b" strokeWidth="2" />
      <path d="M1 39 57 9 57 59 1 91Z" fill="url(#hc-wall-right)" stroke="#172331" strokeWidth="2" />
      <path d="M-15 46 7 58 7 83-15 70Z" fill="#151b24" />
      <path d="M18 43 40 32 40 52 18 63Z" fill={active ? "#ffc35d" : "#365063"} opacity={active ? .95 : .55} />
      <path d="M-44 24-2 1 47 29" fill="none" stroke="#c9d6df" strokeWidth="4" opacity=".35" />
      <path d="M-54 5 0-26 60 7" fill="none" stroke="#e6eef5" strokeWidth="6" opacity=".85" />
      {active && <circle cx="31" cy="47" r="22" fill="#ff9b36" opacity=".12" filter="url(#hc-glow)" />}
    </g>
  );
}

function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity=".78">
      <path d="M0-38-21-6h12l-18 27h20L0 44l7-23h20L9-6h12Z" fill="#152b3a" stroke="#29465b" strokeWidth="2" />
      <path d="M-17-5 0-31 17-5" fill="none" stroke="#dce8f0" strokeWidth="4" opacity=".75" />
      <path d="M-16 21 0-2 16 21" fill="none" stroke="#dce8f0" strokeWidth="4" opacity=".55" />
    </g>
  );
}

function BeaconTower({ level }: { level: number }) {
  const lit = level > 0;
  return (
    <g transform="translate(500 315)">
      <ellipse cy="147" rx="135" ry="42" fill="#050b12" opacity=".75" />
      <path d="M-99 112-61 88 61 88 102 112 62 139-61 139Z" fill="#151e28" stroke="#37485a" strokeWidth="3" />
      <path d="M-63 84-41 41 42 41 63 84 39 103-39 103Z" fill="url(#hc-metal)" stroke="#8a9eb3" strokeWidth="3" />
      <path d="M-42 40-25-58 24-58 42 40 21 54-22 54Z" fill="url(#hc-tower)" stroke="#8ea3b8" strokeWidth="3" />
      <path d="M-29-57-39-81 0-101 39-81 28-57Z" fill="#222d38" stroke="#a8bac9" strokeWidth="3" />
      <path d="M-50-84H50L40-108H-40Z" fill="#111923" stroke="#71869b" strokeWidth="4" />
      <path d="M-29-111H29L20-132H-20Z" fill="#17212b" stroke="#8aa0b5" strokeWidth="3" />
      <path d="M-20-53 0-64 20-53 20-18 0-7-20-18Z" fill={lit ? "#ffac42" : "#31465b"} opacity={lit ? .92 : .5} />
      <path d="M-11 18 0 12 11 18 11 41 0 47-11 41Z" fill={lit ? "#ffcc6a" : "#35495c"} opacity={lit ? .85 : .45} />
      <path d="M-57 83H57M-50 68H50M-43 54H43" stroke="#536a7e" strokeWidth="4" opacity=".75" />
      <path d="M-70 105 0 70 70 105" fill="none" stroke="#b64932" strokeWidth="7" opacity=".7" />
      <g opacity={lit ? 1 : .2}>
        <ellipse cy="-159" rx="48" ry="18" fill="#ff7b2e" opacity=".24" filter="url(#hc-glow)" />
        <path d="M0-136C-21-158-9-177 1-191c3 15 15 22 9 40 15-14 25 5 15 19-9 12-39 12-49 0-9-11-5-23 4-31 0 14 8 20 20 27Z" fill="url(#hc-flame)" filter="url(#hc-glow)" />
      </g>
    </g>
  );
}

export function HardcoreSettlement({ completedCrafts, currentCraft = 0, compact = false }: HardcoreSettlementProps) {
  const districtCrafts = completedCrafts % 10;
  const sceneLevel = completedCrafts === 0 ? 0 : Math.max(1, districtCrafts || 10);
  const activeCount = Math.max(sceneLevel, Math.min(10, currentCraft));

  return (
    <div className={`hc-settlement ${compact ? "compact" : ""}`}>
      <svg viewBox="0 0 1000 620" role="img" aria-label={`現在の拠点。完成CRAFT ${completedCrafts}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#07111f" />
            <stop offset=".45" stopColor="#14243b" />
            <stop offset="1" stopColor="#23364a" />
          </linearGradient>
          <radialGradient id="hc-horizon" cx="50%" cy="26%" r="62%">
            <stop offset="0" stopColor="#5c6f8f" stopOpacity=".32" />
            <stop offset=".7" stopColor="#122033" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hc-ground" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#aabbd0" />
            <stop offset=".45" stopColor="#7f93aa" />
            <stop offset="1" stopColor="#566d83" />
          </linearGradient>
          <linearGradient id="hc-roof" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#243646" /><stop offset="1" stopColor="#0f1a24" /></linearGradient>
          <linearGradient id="hc-wall-left" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4c3a31" /><stop offset="1" stopColor="#201d1c" /></linearGradient>
          <linearGradient id="hc-wall-right" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#342a25" /><stop offset="1" stopColor="#171719" /></linearGradient>
          <linearGradient id="hc-metal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#3e4a57" /><stop offset=".5" stopColor="#151d26" /><stop offset="1" stopColor="#2b3643" /></linearGradient>
          <linearGradient id="hc-tower" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#44515e" /><stop offset=".45" stopColor="#17212c" /><stop offset="1" stopColor="#2c3844" /></linearGradient>
          <linearGradient id="hc-flame" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff3a0" /><stop offset=".35" stopColor="#ffb43d" /><stop offset="1" stopColor="#e64c1e" /></linearGradient>
          <filter id="hc-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#02050a" floodOpacity=".75" /></filter>
          <filter id="hc-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="hc-soft"><feGaussianBlur stdDeviation="22" /></filter>
          <pattern id="hc-snowgrid" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="8" cy="12" r="1.5" fill="#fff" opacity=".18"/><circle cx="33" cy="31" r="1" fill="#fff" opacity=".12"/></pattern>
        </defs>

        <rect width="1000" height="620" fill="url(#hc-sky)" />
        <rect width="1000" height="620" fill="url(#hc-horizon)" />
        <path d="M0 166 130 91l87 47 99-79 104 66 101-90 92 75 132-68 117 70 138-54v190H0Z" fill="#0b1725" opacity=".9" />
        <path d="M0 203 135 137l80 39 98-70 111 69 94-84 103 72 124-62 123 64 132-49v99H0Z" fill="#1a2a3b" opacity=".92" />
        <g opacity=".8">
          <Pine x={80} y={184} s={.8}/><Pine x={132} y={168} s={.62}/><Pine x={870} y={175} s={.82}/><Pine x={922} y={190} s={.65}/><Pine x={795} y={164} s={.55}/><Pine x={226} y={180} s={.5}/>
        </g>

        <path d="M0 250C202 192 334 252 489 220c185-38 300-11 511 51v349H0Z" fill="url(#hc-ground)" />
        <rect y="235" width="1000" height="385" fill="url(#hc-snowgrid)" opacity=".9" />
        <path d="M46 467C185 415 289 432 424 391S708 372 932 432" fill="none" stroke="#2f3b49" strokeWidth="66" opacity=".62" strokeLinecap="round" />
        <path d="M44 458C188 412 294 425 426 385S712 365 940 426" fill="none" stroke="#a8b9c8" strokeWidth="44" opacity=".72" strokeLinecap="round" />
        <path d="M83 444C230 408 326 416 453 378S704 363 898 411" fill="none" stroke="#dce7ef" strokeWidth="6" opacity=".32" strokeDasharray="18 24" />
        <ellipse cx="501" cy="354" rx="245" ry="126" fill="#ff9a35" opacity={sceneLevel > 0 ? .08 : 0} filter="url(#hc-soft)" />

        <g filter="url(#hc-shadow)">
          {buildings.map((building) => <Cabin key={`${building.x}-${building.y}`} {...building} active={activeCount >= building.threshold} />)}
          <BeaconTower level={sceneLevel} />
        </g>

        <g fill="#ffc760" opacity={sceneLevel > 0 ? .95 : .2} filter="url(#hc-glow)">
          {[{x:388,y:422},{x:600,y:414},{x:742,y:404},{x:248,y:398},{x:486,y:477},{x:839,y:475}].map((lamp) => <circle key={`${lamp.x}-${lamp.y}`} cx={lamp.x} cy={lamp.y} r="4" />)}
        </g>

        <g fill="#102032" opacity=".85">
          {[{x:390,y:348},{x:639,y:377},{x:335,y:449},{x:727,y:493},{x:585,y:500}].map((p,i) => <g key={i} transform={`translate(${p.x} ${p.y})`}><circle cy="-7" r="5"/><path d="M-5-2h10l5 22h-20Z"/></g>)}
        </g>

        <g fill="#fff" opacity=".45">
          {Array.from({ length: 46 }, (_, index) => {
            const x = (index * 83 + 31) % 990;
            const y = (index * 47 + 19) % 600;
            const r = index % 3 === 0 ? 2 : 1.2;
            return <circle key={index} cx={x} cy={y} r={r} />;
          })}
        </g>
        <rect width="1000" height="620" fill="url(#hc-horizon)" opacity=".25" />
      </svg>
      <div className="hc-settlement-vignette" />
      <div className="hc-settlement-label"><span>FROST DISTRICT</span><strong>{activeCount}/10 CRAFTS BUILT</strong></div>
    </div>
  );
}
