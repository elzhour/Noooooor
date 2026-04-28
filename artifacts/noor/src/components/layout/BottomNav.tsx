import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

/* ── 3D-style Nav Icons ─────────────────────────────────────
   Each icon takes a `color` string so BottomNav can control
   active (#C19A6B) vs inactive (muted) tones precisely.
──────────────────────────────────────────────────────────── */

function HomeNav3D({ color }: { color: string }) {
  const hi = "rgba(255,255,255,0.35)";
  const sh = "rgba(0,0,0,0.18)";
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Roof shadow */}
      <path d="M3 12L12 4l9 8" stroke={color} strokeWidth="2.2" strokeOpacity="0.2"
        strokeLinecap="round" strokeLinejoin="round" transform="translate(0.4,0.4)" />
      {/* Roof */}
      <path d="M3 12L12 4l9 8" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Shadow side (right) */}
      <polygon points="12,4 21,12 21,12.8 12,4.8" fill={sh} />

      {/* Walls */}
      <path d="M5 12 L5 21 L19 21 L19 12"
        fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Lit side (left) */}
      <path d="M5 12 L5 21 L6 21 L6 12 Z" fill={hi} />
      {/* Top gloss */}
      <path d="M5 12 L19 12 L19 13.5 Q12 13 5 13.5 Z" fill={hi} fillOpacity="0.5" />

      {/* Door */}
      <path d="M9.5 21V15.5h5V21"
        fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1.2"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Door knob */}
      <circle cx="11.8" cy="18" r="0.45" fill="white" fillOpacity="0.7" />

      {/* Dome on top */}
      <path d="M9 12 Q9 8.5 12 8.5 Q15 8.5 15 12"
        fill={color} fillOpacity="0.35" stroke={color} strokeWidth="0.9" />
      {/* Dome highlight */}
      <path d="M10 11.5 Q10.5 9 12 9" stroke={hi} strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}

function QuranNav3D({ color }: { color: string }) {
  const hi = "rgba(255,255,255,0.3)";
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Shadow */}
      <g opacity="0.18" transform="translate(0.4,0.4)">
        <path d="M12 4 C10 4 4 5 3 7 L3 20 C4 18 10 17 12 17" fill={color} />
        <path d="M12 4 C14 4 20 5 21 7 L21 20 C20 18 14 17 12 17" fill={color} />
      </g>

      {/* Left page (lit face) */}
      <path d="M12 4 C10 4 4 5 3 7 L3 20 C4 18 10 17 12 17"
        fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      {/* Left page highlight */}
      <path d="M12 4.5 C10 4.8 5.5 5.8 3.8 8 L3.8 11 C5.5 8.5 10 7.5 12 7 Z"
        fill={hi} />

      {/* Right page (shadow face) */}
      <path d="M12 4 C14 4 20 5 21 7 L21 20 C20 18 14 17 12 17"
        fill={color} fillOpacity="0.13" stroke={color} strokeWidth="1.4" strokeLinecap="round" />

      {/* Spine */}
      <line x1="12" y1="4" x2="12" y2="17"
        stroke={color} strokeWidth="1.6" strokeOpacity="0.9" strokeLinecap="round" />
      <line x1="12" y1="4" x2="12" y2="17"
        stroke="white" strokeWidth="0.65" strokeOpacity="0.4" strokeLinecap="round" />

      {/* Lines — left */}
      {[8.5, 10.5, 12.5, 14.5].map(y => (
        <line key={y} x1="5" y1={y} x2="10.5" y2={y}
          stroke={color} strokeWidth="0.9" strokeOpacity="0.55" strokeLinecap="round" />
      ))}
      {/* Lines — right */}
      {[8.5, 10.5, 12.5, 14.5].map(y => (
        <line key={y} x1="13.5" y1={y} x2="19" y2={y}
          stroke={color} strokeWidth="0.9" strokeOpacity="0.35" strokeLinecap="round" />
      ))}

      {/* Ornament */}
      <circle cx="8" cy="6.5" r="0.9" fill={color} fillOpacity="0.35" />
      <circle cx="8" cy="6.5" r="0.4" fill={color} fillOpacity="0.75" />
    </svg>
  );
}

function AzkarNav3D({ color }: { color: string }) {
  const hi = "rgba(255,255,255,0.45)";
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Crescent moon shadow */}
      <path d="M20.3 12.5A8.3 8.3 0 1 1 11.7 4a6.3 6.3 0 0 0 8.6 8.5z"
        fill={color} fillOpacity="0.15" transform="translate(0.35,0.35)" />
      {/* Crescent moon */}
      <path d="M20 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 20 12.79z"
        fill={color} fillOpacity="0.82" />
      {/* Moon inner highlight */}
      <path d="M11.21 3 Q7.5 5 5.5 9.5 Q5.5 6 8.5 3.5 Z" fill={hi} />
      {/* Rim gloss */}
      <path d="M20 12.79 Q19 10 17 7.5" stroke={hi} strokeWidth="0.8" strokeOpacity="0.4" fill="none" strokeLinecap="round" />

      {/* Stars — 3D dots */}
      {[
        { x: 19.5, y: 5.5, r: 0.9 },
        { x: 17, y: 3.3, r: 0.65 },
        { x: 22, y: 8.5, r: 0.6 },
      ].map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={s.r} fill={color} fillOpacity="0.9" />
          <circle cx={s.x - s.r * 0.35} cy={s.y - s.r * 0.35} r={s.r * 0.38}
            fill="white" fillOpacity="0.65" />
        </g>
      ))}
    </svg>
  );
}

function TasbihNav3D({ color }: { color: string }) {
  const cx = 12, cy = 14, r = 6.5;
  const hi = "rgba(255,255,255,0.45)";
  const beads = Array.from({ length: 12 }, (_, i) => {
    const deg = 15 + i * 30;
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  });
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Ring */}
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="1.1" fill="none" strokeOpacity="0.5" />
      {/* Ring highlight arc */}
      <path d={`M ${cx - r * 0.65} ${cy - r * 0.65} A ${r} ${r} 0 0 1 ${cx + r * 0.65} ${cy - r * 0.65}`}
        stroke={hi} strokeWidth="0.75" fill="none" strokeLinecap="round" />

      {/* Beads */}
      {beads.map((b, i) => {
        const br = i === 5 ? 1.7 : 1.15;
        return (
          <g key={i}>
            <circle cx={b.x + 0.2} cy={b.y + 0.2} r={br} fill={color} fillOpacity="0.18" />
            <circle cx={b.x} cy={b.y} r={br} fill={color} />
            <circle cx={b.x - br * 0.35} cy={b.y - br * 0.35} r={br * 0.37} fill="white" fillOpacity="0.5" />
          </g>
        );
      })}

      {/* Imam bead */}
      <circle cx={12} cy={5.5} r={2.2} fill={color} fillOpacity="0.22" />
      <circle cx={12} cy={5.5} r={1.9} fill={color} />
      <circle cx={11.2} cy={4.7} r={0.72} fill="white" fillOpacity="0.55" />

      {/* Tail */}
      <line x1="12" y1="20.7" x2="12" y2="22.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="12" cy="23" r="0.75" fill={color} />
      <circle cx="11.65" cy="22.65" r="0.28" fill="white" fillOpacity="0.55" />
    </svg>
  );
}

function RankingNav3D({ color }: { color: string }) {
  const hi = "rgba(255,255,255,0.4)";
  const sh = "rgba(0,0,0,0.18)";
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Trophy shadow */}
      <path d="M8.3 4.3 H15.7 V9.7 a3.7 3.7 0 0 1 -7.4 0 Z" fill={color} fillOpacity="0.18"
        transform="translate(0.35,0.35)" />

      {/* Trophy cup body */}
      <path d="M8 4 H16 V9.5 a4 4 0 0 1 -8 0 Z"
        fill={color} fillOpacity="0.85" stroke={color} strokeWidth="1.2"
        strokeLinejoin="round" />
      {/* Cup highlight (lit side) */}
      <path d="M8.5 4.5 H10 V9 a2.5 2.5 0 0 0 1.5 2.3 V13 a4 4 0 0 1 -3 -3.5 Z" fill={hi} />
      {/* Cup shadow (right side) */}
      <path d="M14 4.5 H15.5 V9.5 a3.5 3.5 0 0 1 -1.5 2.85 V11 a3 3 0 0 0 0 -5 Z" fill={sh} />

      {/* Left handle */}
      <path d="M8 5.5 C5.5 5.5 5 7 5 8 C5 9.5 6.5 10.5 8 10.5"
        stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Right handle */}
      <path d="M16 5.5 C18.5 5.5 19 7 19 8 C19 9.5 17.5 10.5 16 10.5"
        stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Stem */}
      <rect x="11" y="14.5" width="2" height="3" fill={color} fillOpacity="0.85" />
      <rect x="11" y="14.5" width="0.7" height="3" fill={hi} />

      {/* Base */}
      <rect x="7.5" y="17.5" width="9" height="2.2" rx="0.5"
        fill={color} fillOpacity="0.85" stroke={color} strokeWidth="0.8" />
      <rect x="7.5" y="17.5" width="9" height="0.7" rx="0.4" fill={hi} />

      {/* Star on cup */}
      <polygon points="12,5.8 12.7,7.3 14.3,7.5 13.1,8.6 13.4,10.2 12,9.4 10.6,10.2 10.9,8.6 9.7,7.5 11.3,7.3"
        fill="white" fillOpacity="0.7" />
    </svg>
  );
}

function MoreNav3D({ color }: { color: string }) {
  const hi = "rgba(255,255,255,0.5)";
  const positions = [
    { x: 5,  y: 5  },  { x: 12, y: 5  },  { x: 19, y: 5  },
    { x: 5,  y: 12 },  { x: 12, y: 12 },  { x: 19, y: 12 },
    { x: 5,  y: 19 },  { x: 12, y: 19 },  { x: 19, y: 19 },
  ];
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {positions.map((p, i) => (
        <g key={i}>
          {/* dot shadow */}
          <circle cx={p.x + 0.25} cy={p.y + 0.25} r="1.65" fill={color} fillOpacity="0.18" />
          {/* dot body */}
          <circle cx={p.x} cy={p.y} r="1.65" fill={color}
            fillOpacity={i === 4 ? 1 : 0.75} />
          {/* dot highlight */}
          <circle cx={p.x - 0.6} cy={p.y - 0.6} r="0.6" fill={hi} />
        </g>
      ))}
    </svg>
  );
}

/* ── Nav items configuration ─────────────────────────────── */
type NavIconComp = React.ComponentType<{ color: string }>;

const NAV_ITEMS: { id: string; path: string; Icon: NavIconComp; label: string }[] = [
  { id: "home",         path: "/",             Icon: HomeNav3D,    label: "الرئيسية" },
  { id: "quran",        path: "/quran",        Icon: QuranNav3D,   label: "القرآن"   },
  { id: "azkar",        path: "/azkar",        Icon: AzkarNav3D,   label: "الأذكار"  },
  { id: "tasbih",       path: "/tasbih",       Icon: TasbihNav3D,  label: "التسبيح"  },
  { id: "ranking",      path: "/ranking",      Icon: RankingNav3D, label: "الترتيب"  },
  { id: "more",         path: "/more",         Icon: MoreNav3D,    label: "المزيد"   },
];

const ACTIVE_COLOR   = "#C19A6B";
const INACTIVE_COLOR = "var(--color-muted-foreground, #9c8670)";

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around px-1 h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          const Icon = item.Icon;
          const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

          return (
            <Link key={item.id} href={item.path} className="flex-1 h-full">
              <div className="flex flex-col items-center justify-center h-full gap-0.5 transition-all duration-300">
                <div
                  className="p-1.5 rounded-xl transition-all duration-300"
                  style={{
                    background: isActive ? "rgba(193,154,107,0.12)" : "transparent",
                    transform: isActive ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  <Icon color={color} />
                </div>
                <span
                  className={cn(
                    "text-[10px] transition-all duration-300",
                    isActive ? "font-bold" : "font-medium opacity-60"
                  )}
                  style={{ color }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
