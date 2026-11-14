/** Static diagram: three providers feed one cached, timestamped layer. Animated with SVG only. */
const DIAGRAM = `<svg viewBox="0 0 1100 420" role="img" aria-label="Diagram: FRED, FMP and Finnhub feed a cache and timestamp layer that feeds your screen">
          <defs>
            <path id="m1" d="M300 110 H690 L760 170"/><path id="m2" d="M300 210 H690"/><path id="m3" d="M300 310 H690 L760 250"/><path id="m4" d="M880 210 H980"/>
          </defs>
          <g>
            <text class="dtxt" x="60" y="106">Bonds and VIX</text><text class="dsub" x="60" y="124">FRED · DGS10, DGS2, VIXCLS</text>
            <text class="dtxt" x="60" y="206">Currencies and indices</text><text class="dsub" x="60" y="224">FMP · quotes, ratios, EBITDA</text>
            <text class="dtxt" x="60" y="306">Headlines</text><text class="dsub" x="60" y="324">Finnhub · company and forex news</text>
          </g>
          <path class="dl" d="M290 110 H690 L760 170"/><path class="dl" d="M290 210 H690"/><path class="dl" d="M290 310 H690 L760 250"/>
          <circle class="dnode" cx="290" cy="110" r="4"/><circle class="dnode" cx="290" cy="210" r="4"/><circle class="dnode" cx="290" cy="310" r="4"/>
          <g transform="translate(790 210)">
            <polygon class="dpl" points="0,-100 110,0 0,100 -110,0"/>
            <polygon class="dpl" points="0,-60 66,0 0,60 -66,0" style="animation-direction:reverse"/>
            <circle class="twinkle" cx="-20" cy="-30" r="2.4" fill="var(--text)"/><circle class="twinkle" cx="26" cy="-10" r="2.4" fill="var(--text)" style="animation-delay:.6s"/>
            <circle class="twinkle" cx="-6" cy="22" r="2.4" fill="var(--text)" style="animation-delay:1.2s"/><circle class="twinkle" cx="40" cy="30" r="2" fill="var(--text)" style="animation-delay:1.8s"/>
            <circle class="twinkle" cx="-52" cy="6" r="2" fill="var(--text)" style="animation-delay:.9s"/>
            <text class="dtxt" x="0" y="130" text-anchor="middle">Cache and timestamp</text><text class="dsub" x="0" y="148" text-anchor="middle">Supabase · UTC last updated</text>
          </g>
          <path class="dl" d="M900 210 H990"/><circle class="dnode" cx="990" cy="210" r="4"/>
          <rect x="990" y="176" width="90" height="68" rx="10" fill="var(--surface)" stroke="var(--line)"/><text class="dtxt" x="1035" y="216" text-anchor="middle" font-weight="500">Your screen</text>
          <circle r="3.5" fill="var(--accent)"><animateMotion dur="3.6s" repeatCount="indefinite"><mpath href="#m1"/></animateMotion></circle>
          <circle r="3.5" fill="var(--accent)"><animateMotion dur="3s" begin="-1s" repeatCount="indefinite"><mpath href="#m2"/></animateMotion></circle>
          <circle r="3.5" fill="var(--accent)"><animateMotion dur="3.6s" begin="-2s" repeatCount="indefinite"><mpath href="#m3"/></animateMotion></circle>
          <circle r="3.5" fill="var(--up)"><animateMotion dur="1.6s" repeatCount="indefinite"><mpath href="#m4"/></animateMotion></circle>
        </svg>`;

export default function HowItWorks() {
  return <div className="diagram rv" id="diagram" dangerouslySetInnerHTML={{ __html: DIAGRAM }} />;
}
