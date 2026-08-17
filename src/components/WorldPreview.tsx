export function WorldPreview() {
  return (
    <div className="world-preview" aria-label="完成していく街のイメージ">
      <svg viewBox="0 0 620 440" role="img">
        <title>KEY CRAFTのクラフトマップ</title>
        <defs>
          <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0v24" fill="none" stroke="#17344d" strokeOpacity=".07" />
          </pattern>
        </defs>
        <path d="m45 185 253-146 279 161-255 147Z" fill="#e9dfc9" />
        <path d="m45 185 277 162v54L45 239Z" fill="#d4c8ae" />
        <path d="m322 347 255-147v54L322 401Z" fill="#b9ae98" />
        <path d="m45 185 253-146 279 161-255 147Z" fill="url(#map-grid)" />
        <path d="m83 194 218-126m58 259 178-102M142 129l278 162M232 79l276 161" fill="none" stroke="#f7f2e7" strokeWidth="19" strokeLinecap="round" />
        <path d="m83 194 218-126m58 259 178-102M142 129l278 162M232 79l276 161" fill="none" stroke="#b9aa8e" strokeWidth="2" strokeDasharray="8 10" />
        <g transform="translate(116 142)">
          <path d="m0 31 37-21 41 23-38 22Z" fill="#ffd16b" />
          <path d="m0 31 40 24v42L0 73Z" fill="#ee7853" />
          <path d="m40 55 38-22v42L40 97Z" fill="#b94939" />
          <path d="m-6 30 43-26 48 27-7 8-41-23L2 39Z" fill="#17344d" />
          <path d="m12 61 13 7v20l-13-7Z" fill="#a7ddf1" />
        </g>
        <g transform="translate(347 105)">
          <path d="m0 47 43-25 51 30-45 26Z" fill="#a3dfbd" />
          <path d="m0 47 49 31v61L0 109Z" fill="#2d9f80" />
          <path d="m49 78 45-26v60l-45 27Z" fill="#15705b" />
          <path d="M30 17h15v105H30z" fill="#1c4a43" />
          <circle cx="37" cy="13" r="22" fill="#f4c45c" />
        </g>
        <g transform="translate(221 228)">
          <path d="m0 20 35-20 42 24-37 22Z" fill="#a8d9ff" />
          <path d="m0 20 40 26v44L0 65Z" fill="#6172dc" />
          <path d="m40 46 37-22v45L40 90Z" fill="#3b49a1" />
          <path d="M17 12 35 2l22 13-19 11Z" fill="#fff" />
          <circle cx="37" cy="14" r="6" fill="#ef6d4c" />
        </g>
        <g transform="translate(432 244)">
          <path d="M18 87 27 20h14l10 67Z" fill="#f1a33a" />
          <path d="M7 87h56v9H7zM14 62h43v8H14zM22 39h27v7H22z" fill="#17344d" />
          <circle cx="34" cy="13" r="13" fill="#ffd76c" />
        </g>
        <g fill="#ef6d4c">
          <circle cx="110" cy="94" r="8" /><circle cx="305" cy="106" r="8" /><circle cx="500" cy="174" r="8" />
        </g>
        <g fill="#17344d" fontFamily="sans-serif" fontSize="11" fontWeight="700">
          <text x="76" y="79">MISSION 01</text><text x="268" y="91">MISSION 24</text><text x="462" y="159">MISSION 50</text>
        </g>
      </svg>
      <div className="floating-card card-one"><span>NEW CRAFT</span><strong>はじまりの家</strong></div>
      <div className="floating-card card-two"><b>3</b><span>MISSION<br />COMPLETE</span></div>
    </div>
  );
}
