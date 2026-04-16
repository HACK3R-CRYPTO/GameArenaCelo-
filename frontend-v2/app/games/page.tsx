"use client";

import { useRouter } from "next/navigation";

// ─── Splash icons ─────────────────────────────────────────────────────────────
const D = "/splash_screen_icons/dice.png";
const G = "/splash_screen_icons/gamepad.png";
const J = "/splash_screen_icons/joystick.png";
const M = "/splash_screen_icons/golden_music.png";
const V = "/splash_screen_icons/vending.png";

const LEFT_ICONS = [
  { src: D, top: "1%",  left: "-18px", size: 120, delay: 0.0, dur: 5.2, glow: "#cc44ff", rotate: -18 },
  { src: M, top: "8%",  left: "34px",  size: 80,  delay: 0.7, dur: 4.3, glow: "#ffaa00", rotate: 12  },
  { src: G, top: "24%", left: "6px",   size: 110, delay: 1.4, dur: 6.0, glow: "#aa88ff", rotate: -6  },
  { src: D, top: "36%", left: "72px",  size: 140, delay: 0.3, dur: 4.8, glow: "#cc44ff", rotate: 16  },
  { src: J, top: "54%", left: "-10px", size: 105, delay: 2.1, dur: 5.5, glow: "#22aaff", rotate: -8  },
  { src: G, top: "72%", left: "4px",   size: 108, delay: 2.8, dur: 5.0, glow: "#aa88ff", rotate: -14 },
  { src: D, top: "88%", left: "60px",  size: 95,  delay: 1.9, dur: 4.6, glow: "#cc44ff", rotate: 10  },
];

const RIGHT_ICONS = [
  { src: D, top: "0%",  right: "-22px", size: 115, delay: 0.4, dur: 5.0, glow: "#cc44ff", rotate: 20  },
  { src: J, top: "16%", right: "54px",  size: 100, delay: 1.2, dur: 4.8, glow: "#22aaff", rotate: 8   },
  { src: V, top: "30%", right: "0px",   size: 120, delay: 2.0, dur: 6.2, glow: "#ff44cc", rotate: -4  },
  { src: M, top: "50%", right: "44px",  size: 82,  delay: 0.6, dur: 4.0, glow: "#ffaa00", rotate: -16 },
  { src: D, top: "65%", right: "-8px",  size: 100, delay: 2.4, dur: 5.2, glow: "#cc44ff", rotate: 10  },
  { src: G, top: "80%", right: "58px",  size: 108, delay: 1.8, dur: 5.8, glow: "#aa88ff", rotate: -10 },
];

// ─── Data ─────────────────────────────────────────────────────────────────────

const GAMES = [
  {
    id: "rhythm",
    title: "RHYTHM RUSH",
    wager: "1 G$",
    payout: "1.3×",
    path: "/games/rhythm",
    active: true,
    artGrad: "linear-gradient(160deg, #7e22ce 0%, #a21caf 55%, #6d28d9 100%)",
    glow: "#c026d3",
    accent: "#e879f9",
    showWager: true,
    borderColor: "#f59e0b",
    startWall: "#7c2d00",
    startGrad: "linear-gradient(160deg, #fde68a 0%, #f59e0b 50%, #b45309 100%)",
    startGlow: "rgba(245,158,11,0.75)",
    art: (
      <svg width="140" height="115" viewBox="0 0 140 115" fill="none">
        <defs>
          <radialGradient id="rr-stage" cx="50%" cy="90%" r="65%">
            <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#f0abfc" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="rr-drum-shine" cx="35%" cy="30%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </radialGradient>
          <radialGradient id="rr-snare-shine" cx="35%" cy="30%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </radialGradient>
        </defs>
        {/* Stage glow */}
        <ellipse cx="70" cy="112" rx="62" ry="22" fill="url(#rr-stage)"/>
        {/* Floor shadow */}
        <ellipse cx="70" cy="105" rx="52" ry="10" fill="rgba(0,0,0,0.35)"/>

        {/* Crash cymbal — left */}
        <ellipse cx="28" cy="42" rx="22" ry="6" fill="#b0860d" stroke="#fde68a" strokeWidth="1.5"/>
        <ellipse cx="28" cy="42" rx="22" ry="6" fill="url(#rr-snare-shine)" opacity="0.6"/>
        <rect x="26" y="42" width="4" height="30" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>

        {/* Crash cymbal — right */}
        <ellipse cx="112" cy="38" rx="22" ry="6" fill="#b0860d" stroke="#fde68a" strokeWidth="1.5"/>
        <ellipse cx="112" cy="38" rx="22" ry="6" fill="url(#rr-snare-shine)" opacity="0.6"/>
        <rect x="110" y="38" width="4" height="34" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>

        {/* Hi-hat stand */}
        <rect x="48" y="60" width="3" height="32" rx="1.5" fill="rgba(255,255,255,0.25)"/>
        {/* Hi-hat cymbals */}
        <ellipse cx="49" cy="60" rx="16" ry="4.5" fill="#c8a010" stroke="#fde68a" strokeWidth="1.5"/>
        <ellipse cx="49" cy="57" rx="16" ry="4.5" fill="#daa520" stroke="#fde68a" strokeWidth="1.5"/>
        <ellipse cx="49" cy="57" rx="16" ry="4.5" fill="url(#rr-snare-shine)" opacity="0.5"/>

        {/* Snare drum */}
        <ellipse cx="38" cy="88" rx="22" ry="8" fill="#c8102e" stroke="#fda4af" strokeWidth="2"/>
        <rect x="16" y="88" width="44" height="14" rx="0" fill="#a01020"/>
        <ellipse cx="38" cy="102" rx="22" ry="8" fill="#9b0e27" stroke="#fda4af" strokeWidth="1.5"/>
        <ellipse cx="38" cy="88" rx="22" ry="8" fill="url(#rr-snare-shine)" opacity="0.6"/>
        {/* Snare lug bolts */}
        {[0,1,2,3].map(i => (
          <circle key={i} cx={22 + i * 10} cy="88" r="2" fill="#fda4af" opacity="0.8"/>
        ))}

        {/* Bass drum — main body */}
        <ellipse cx="78" cy="95" rx="34" ry="14" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="2.5"/>
        <rect x="44" y="95" width="68" height="14" rx="0" fill="#1a1060"/>
        <ellipse cx="78" cy="109" rx="34" ry="14" fill="#16103d" stroke="#a78bfa" strokeWidth="2"/>
        {/* Bass drum face */}
        <ellipse cx="78" cy="95" rx="34" ry="14" fill="url(#rr-drum-shine)" opacity="0.7"/>
        {/* Bass drum logo circle */}
        <ellipse cx="78" cy="95" rx="18" ry="7.5" fill="rgba(167,139,250,0.25)" stroke="rgba(167,139,250,0.6)" strokeWidth="1.5"/>
        {/* Bass drum note */}
        <text x="70" y="98" fontSize="10" fill="#e879f9" fontFamily="serif" fontWeight="bold">♪</text>
        {/* Bass drum lug bolts */}
        {[0,1,2,3,4,5].map(i => {
          const angle = (i * 60 - 90) * Math.PI / 180;
          return <circle key={i} cx={78 + 30 * Math.cos(angle)} cy={95 + 12 * Math.sin(angle)} r="2" fill="#a78bfa" opacity="0.75"/>;
        })}

        {/* Tom tom — top right */}
        <ellipse cx="98" cy="72" rx="18" ry="7" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="2"/>
        <rect x="80" y="72" width="36" height="10" rx="0" fill="#1e40af"/>
        <ellipse cx="98" cy="82" rx="18" ry="7" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5"/>
        <ellipse cx="98" cy="72" rx="18" ry="7" fill="url(#rr-snare-shine)" opacity="0.5"/>

        {/* Drumstick left */}
        <rect x="26" y="18" width="4" height="36" rx="2" fill="#f5e6c8" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"
          transform="rotate(-35 28 36)"/>
        <circle cx="20" cy="22" r="4" fill="#f5e6c8" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>

        {/* Drumstick right */}
        <rect x="110" y="18" width="4" height="36" rx="2" fill="#f5e6c8" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"
          transform="rotate(35 112 36)"/>
        <circle cx="120" cy="22" r="4" fill="#f5e6c8" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>

        {/* Floating notes */}
        <text x="4" y="24" fontSize="20" fill="rgba(255,255,255,0.75)" fontFamily="serif">♪</text>
        <text x="116" y="20" fontSize="16" fill="rgba(233,121,249,0.85)" fontFamily="serif">♫</text>
        <text x="6" y="52" fontSize="12" fill="rgba(255,255,255,0.45)" fontFamily="serif">♩</text>

        {/* Sparkles */}
        <circle cx="60" cy="10" r="2.5" fill="white" opacity="0.65"/>
        <circle cx="85" cy="8" r="1.5" fill="#e879f9" opacity="0.8"/>
        <circle cx="130" cy="50" r="2" fill="white" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: "simon",
    title: "SIMON MEMORY",
    wager: "1 G$",
    payout: "1.3×",
    path: "/games/simon",
    active: true,
    artGrad: "linear-gradient(160deg, #0e4f6b 0%, #075985 55%, #0c3f5e 100%)",
    glow: "#06b6d4",
    accent: "#67e8f9",
    showWager: false,
    borderColor: "#22c55e",
    startWall: "#003a00",
    startGrad: "linear-gradient(160deg, #86efac 0%, #22c55e 50%, #15803d 100%)",
    startGlow: "rgba(34,197,94,0.75)",
    art: (
      <svg width="140" height="115" viewBox="0 0 140 115" fill="none">
        <defs>
          <radialGradient id="sm-glow-g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="sm-glow-r" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="sm-board" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#1e1b4b"/>
            <stop offset="100%" stopColor="#0f0a2e"/>
          </radialGradient>
          <filter id="sm-glow-filter">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Board base shadow */}
        <ellipse cx="70" cy="108" rx="48" ry="10" fill="rgba(0,0,0,0.4)"/>

        {/* Board body — dark circle */}
        <circle cx="70" cy="62" r="50" fill="url(#sm-board)" stroke="rgba(100,80,200,0.4)" strokeWidth="2"/>

        {/* Green quadrant (top-left) — LIT/ACTIVE */}
        <path d="M70 62 L28 28 A50 50 0 0 1 70 12 Z"
          fill="#15803d" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/>
        <path d="M70 62 L28 28 A50 50 0 0 1 70 12 Z" fill="#4ade80" opacity="0.85"/>
        {/* Green glow pulse */}
        <circle cx="52" cy="40" r="20" fill="url(#sm-glow-g)" opacity="0.7" filter="url(#sm-glow-filter)"/>
        {/* Green shine */}
        <path d="M70 62 L28 28 A50 50 0 0 1 70 12 Z"
          fill="rgba(255,255,255,0.3)" clipPath="inset(0 50% 50% 0)"/>

        {/* Red quadrant (top-right) */}
        <path d="M70 62 L112 28 A50 50 0 0 0 70 12 Z"
          fill="#991b1b" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/>
        <path d="M70 62 L112 28 A50 50 0 0 0 70 12 Z" fill="#ef4444" opacity="0.6"/>

        {/* Yellow quadrant (bottom-left) */}
        <path d="M70 62 L28 96 A50 50 0 0 0 70 112 Z"
          fill="#92400e" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/>
        <path d="M70 62 L28 96 A50 50 0 0 0 70 112 Z" fill="#fbbf24" opacity="0.55"/>

        {/* Blue quadrant (bottom-right) */}
        <path d="M70 62 L112 96 A50 50 0 0 1 70 112 Z"
          fill="#1e3a8a" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/>
        <path d="M70 62 L112 96 A50 50 0 0 1 70 112 Z" fill="#3b82f6" opacity="0.6"/>

        {/* Divider lines */}
        <line x1="70" y1="12" x2="70" y2="112" stroke="rgba(0,0,0,0.7)" strokeWidth="3"/>
        <line x1="20" y1="62" x2="120" y2="62" stroke="rgba(0,0,0,0.7)" strokeWidth="3"/>

        {/* Center button */}
        <circle cx="70" cy="62" r="16" fill="#0f0a2e" stroke="rgba(100,80,200,0.5)" strokeWidth="2"/>
        <circle cx="70" cy="62" r="12" fill="#1e1b4b" stroke="rgba(140,100,255,0.4)" strokeWidth="1.5"/>
        {/* Center logo — START text */}
        <text x="70" y="66" textAnchor="middle" fontSize="7" fontWeight="900" fill="rgba(180,150,255,0.9)" letterSpacing="0.5">START</text>

        {/* Outer ring */}
        <circle cx="70" cy="62" r="49" fill="none" stroke="rgba(100,80,200,0.3)" strokeWidth="1"/>

        {/* Active glow from green button radiating outward */}
        <circle cx="52" cy="40" r="28" fill="none" stroke="rgba(74,222,128,0.35)" strokeWidth="2"/>

        {/* Floating digits — memory sequence */}
        <text x="8" y="22" fontSize="14" fill="rgba(74,222,128,0.7)" fontFamily="monospace" fontWeight="bold">1</text>
        <text x="122" y="22" fontSize="14" fill="rgba(248,113,113,0.7)" fontFamily="monospace" fontWeight="bold">3</text>
        <text x="8" y="106" fontSize="14" fill="rgba(251,191,36,0.7)" fontFamily="monospace" fontWeight="bold">2</text>
        <text x="122" y="106" fontSize="14" fill="rgba(59,130,246,0.7)" fontFamily="monospace" fontWeight="bold">4</text>

        {/* Sparkles */}
        <circle cx="16" cy="50" r="2" fill="#4ade80" opacity="0.8"/>
        <circle cx="124" cy="76" r="2" fill="#3b82f6" opacity="0.7"/>
        <circle cx="70" cy="6" r="2.5" fill="white" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: "arena",
    title: "CHALLENGE AI",
    wager: "1 G$",
    payout: "1.9×",
    path: "/games/arena",
    active: true,
    artGrad: "linear-gradient(160deg, #1e3a5f 0%, #1e4080 55%, #0f2040 100%)",
    glow: "#3b82f6",
    accent: "#fbbf24",
    showWager: false,
    borderColor: "#3b82f6",
    startWall: "#001a40",
    startGrad: "linear-gradient(160deg, #93c5fd 0%, #3b82f6 50%, #1d4ed8 100%)",
    startGlow: "rgba(59,130,246,0.75)",
    art: (
      <svg width="140" height="115" viewBox="0 0 140 115" fill="none">
        <defs>
          <radialGradient id="ai-eye-l" cx="40%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#60a5fa"/>
            <stop offset="100%" stopColor="#1d4ed8"/>
          </radialGradient>
          <radialGradient id="ai-eye-r" cx="40%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#fbbf24"/>
            <stop offset="100%" stopColor="#b45309"/>
          </radialGradient>
          <radialGradient id="ai-body-shine" cx="30%" cy="20%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </radialGradient>
          <radialGradient id="ai-base-glow" cx="50%" cy="90%" r="60%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Base glow */}
        <ellipse cx="70" cy="108" rx="52" ry="14" fill="url(#ai-base-glow)"/>
        <ellipse cx="70" cy="108" rx="42" ry="10" fill="rgba(0,0,0,0.4)"/>

        {/* Circuit lines — background */}
        <line x1="10" y1="30" x2="40" y2="30" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"/>
        <line x1="40" y1="30" x2="40" y2="55" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5"/>
        <circle cx="40" cy="30" r="3" fill="rgba(59,130,246,0.4)"/>
        <line x1="130" y1="30" x2="100" y2="30" stroke="rgba(251,191,36,0.25)" strokeWidth="1.5"/>
        <line x1="100" y1="30" x2="100" y2="55" stroke="rgba(251,191,36,0.25)" strokeWidth="1.5"/>
        <circle cx="100" cy="30" r="3" fill="rgba(251,191,36,0.4)"/>
        <line x1="10" y1="85" x2="35" y2="85" stroke="rgba(59,130,246,0.2)" strokeWidth="1.5"/>
        <line x1="130" y1="85" x2="105" y2="85" stroke="rgba(251,191,36,0.2)" strokeWidth="1.5"/>
        <circle cx="10" cy="85" r="2.5" fill="rgba(59,130,246,0.35)"/>
        <circle cx="130" cy="85" r="2.5" fill="rgba(251,191,36,0.35)"/>

        {/* Robot body — torso */}
        <rect x="42" y="78" width="56" height="30" rx="10" fill="#1e293b" stroke="rgba(59,130,246,0.5)" strokeWidth="2"/>
        <rect x="42" y="78" width="56" height="30" rx="10" fill="url(#ai-body-shine)" opacity="0.6"/>
        {/* Chest panel */}
        <rect x="52" y="86" width="36" height="14" rx="5" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" strokeWidth="1"/>
        {/* Chest LEDs */}
        {[0,1,2,3,4].map(i => (
          <circle key={i} cx={59 + i * 7} cy="93" r="2.5" fill={i % 2 === 0 ? "#60a5fa" : "#fbbf24"} opacity={0.7 + (i % 2) * 0.2}/>
        ))}

        {/* Arms */}
        <rect x="20" y="80" width="20" height="22" rx="8" fill="#1e293b" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5"/>
        <rect x="100" y="80" width="20" height="22" rx="8" fill="#1e293b" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5"/>
        {/* Hand grippers */}
        <rect x="22" y="100" width="16" height="8" rx="4" fill="#0f172a" stroke="rgba(59,130,246,0.5)" strokeWidth="1"/>
        <rect x="102" y="100" width="16" height="8" rx="4" fill="#0f172a" stroke="rgba(251,191,36,0.5)" strokeWidth="1"/>

        {/* Robot head */}
        <rect x="36" y="32" width="68" height="48" rx="14" fill="#1e293b" stroke="rgba(59,130,246,0.6)" strokeWidth="2.5"/>
        <rect x="36" y="32" width="68" height="48" rx="14" fill="url(#ai-body-shine)" opacity="0.5"/>

        {/* Antenna */}
        <rect x="68" y="18" width="4" height="16" rx="2" fill="#334155" stroke="rgba(59,130,246,0.4)" strokeWidth="1"/>
        <circle cx="70" cy="15" r="6" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="2"/>
        <circle cx="70" cy="15" r="3" fill="#93c5fd"/>

        {/* Eyes */}
        {/* Left eye — blue */}
        <rect x="47" y="46" width="22" height="16" rx="6" fill="#0f172a" stroke="rgba(59,130,246,0.6)" strokeWidth="1.5"/>
        <rect x="49" y="48" width="18" height="12" rx="5" fill="url(#ai-eye-l)"/>
        <circle cx="55" cy="52" r="3" fill="rgba(0,0,0,0.6)"/>
        <circle cx="53" cy="50" r="1.5" fill="rgba(255,255,255,0.8)"/>
        {/* Left eye glow */}
        <rect x="47" y="46" width="22" height="16" rx="6" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.7"/>

        {/* Right eye — amber */}
        <rect x="71" y="46" width="22" height="16" rx="6" fill="#0f172a" stroke="rgba(251,191,36,0.6)" strokeWidth="1.5"/>
        <rect x="73" y="48" width="18" height="12" rx="5" fill="url(#ai-eye-r)"/>
        <circle cx="79" cy="52" r="3" fill="rgba(0,0,0,0.6)"/>
        <circle cx="77" cy="50" r="1.5" fill="rgba(255,255,255,0.8)"/>
        {/* Right eye glow */}
        <rect x="71" y="46" width="22" height="16" rx="6" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.7"/>

        {/* Mouth — speaker grill */}
        <rect x="52" y="68" width="36" height="8" rx="4" fill="#0f172a" stroke="rgba(100,150,255,0.4)" strokeWidth="1"/>
        {[0,1,2,3,4,5].map(i => (
          <rect key={i} x={55 + i * 5} y="69" width="2" height="6" rx="1" fill="rgba(96,165,250,0.6)"/>
        ))}

        {/* Floating binary */}
        <text x="4" y="18" fontSize="9" fill="rgba(96,165,250,0.5)" fontFamily="monospace">01</text>
        <text x="118" y="18" fontSize="9" fill="rgba(251,191,36,0.5)" fontFamily="monospace">10</text>
        <text x="4" y="110" fontSize="9" fill="rgba(96,165,250,0.4)" fontFamily="monospace">11</text>
        <text x="118" y="110" fontSize="9" fill="rgba(251,191,36,0.4)" fontFamily="monospace">00</text>

        {/* Sparkles */}
        <circle cx="18" cy="38" r="2" fill="#60a5fa" opacity="0.7"/>
        <circle cx="122" cy="42" r="2" fill="#fbbf24" opacity="0.7"/>
      </svg>
    ),
  },
];

const NEWS = [
  {
    title: "Rhythm Rush is now a top Community game!",
    desc: "Join the weekly leaderboard now.",
    thumb: "linear-gradient(135deg, #9333ea 0%, #c026d3 100%)",
    thumbIcon: "🥁",
  },
  {
    title: "Game Arena adds an awesome Playing Community!",
    desc: "Over 1.2M players and growing.",
    thumb: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
    thumbIcon: "🎮",
  },
];

const TOURNAMENTS = [
  { rank: 1, name: "Rhythm Tourney", winner: "Alex W.", color: "#fbbf24" },
  { rank: 2, name: "Memory Masters", winner: "0x44f…", color: "#e2e8f0" },
  { rank: 3, name: "AI Challenge Cup", winner: "Maria K.", color: "#f97316" },
];

// ─── Nav sidebar icons ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Home",
    path: "/home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    ),
  },
  {
    label: "Games",
    path: "/games",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 6H3a1 1 0 00-1 1v10a1 1 0 001 1h18a1 1 0 001-1V7a1 1 0 00-1-1zm-10 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm4.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    path: "/leaderboard",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 21H5a2 2 0 01-2-2v-7a2 2 0 012-2h6v11zm2 0V6a2 2 0 012-2h4a2 2 0 012 2v13h-8z"/>
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "/profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    ),
  },
];

// ─── Stats data ────────────────────────────────────────────────────────────────
const STATS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
    label: "PLAYERS",
    value: "1.2M+",
    borderColor: "#f472b6",
    textColor: "#f9a8d4",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 6H3a1 1 0 00-1 1v10a1 1 0 001 1h18a1 1 0 001-1V7a1 1 0 00-1-1zm-10 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm4.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
      </svg>
    ),
    label: "GAMES",
    value: "500K+",
    borderColor: "#22d3ee",
    textColor: "#67e8f9",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
      </svg>
    ),
    label: "POT",
    value: "$250K",
    borderColor: "#fbbf24",
    textColor: "#fde68a",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function GamesPage() {
  const router = useRouter();
  const activePath = "/games";

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(160deg, #4c1d95 0%, #3b0a9e 35%, #1e0762 65%, #0d0230 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Left icons */}
      {LEFT_ICONS.map((icon, i) => (
        <div
          key={`l-${i}`}
          className="icon-float"
          style={{
            position: "absolute",
            top: icon.top,
            left: icon.left,
            width: icon.size,
            height: icon.size,
            transform: `rotate(${icon.rotate}deg)`,
            filter: `drop-shadow(0 0 8px ${icon.glow}99)`,
            ["--dur" as string]: `${icon.dur}s`,
            ["--delay" as string]: `${icon.delay}s`,
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon.src} alt="" width={icon.size} height={icon.size} style={{ objectFit: "contain", display: "block" }} />
        </div>
      ))}

      {/* Right icons */}
      {RIGHT_ICONS.map((icon, i) => (
        <div
          key={`r-${i}`}
          className="icon-float"
          style={{
            position: "absolute",
            top: icon.top,
            right: icon.right,
            width: icon.size,
            height: icon.size,
            transform: `rotate(${icon.rotate}deg)`,
            filter: `drop-shadow(0 0 8px ${icon.glow}99)`,
            ["--dur" as string]: `${icon.dur}s`,
            ["--delay" as string]: `${icon.delay}s`,
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon.src} alt="" width={icon.size} height={icon.size} style={{ objectFit: "contain", display: "block" }} />
        </div>
      ))}

      {/* ── Body (sidebar + center + news) ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative", zIndex: 2 }}>

        {/* ── Left nav sidebar ── */}
        <div style={{
          width: "68px", flexShrink: 0,
          alignSelf: "stretch",
          background: "rgba(4,1,18,0.7)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.path === activePath;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  width: "54px",
                  borderRadius: "12px",
                  padding: "8px 4px 6px",
                  background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                  border: "none",
                  color: isActive ? "white" : "rgba(255,255,255,0.38)",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "4px",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                  boxShadow: isActive
                    ? "0 0 0 1px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.4)"
                    : "none",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.38)"; }}
              >
                {item.icon}
                <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.04em" }}>
                  {item.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Center: stats + logo + game cards ── */}
        <div style={{
          flex: 1, minWidth: 0,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "14px 12px 16px",
          gap: "12px",
          overflowY: "auto",
        }}>

          {/* Stats pills */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "10px", flexWrap: "wrap", flexShrink: 0,
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "7px 16px",
                borderRadius: "24px",
                background: "rgba(8,2,28,0.65)",
                border: `2px solid ${s.borderColor}`,
                boxShadow: `0 0 16px ${s.borderColor}55, inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}>
                <span style={{ color: s.textColor, display: "flex" }}>{s.icon}</span>
                <span style={{ color: s.textColor, fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em" }}>{s.label}:</span>
                <span style={{ color: "white", fontSize: "13px", fontWeight: 900, letterSpacing: "0.04em" }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/components/game_arena_text.png"
            alt="Game Arena"
            style={{
              width: "clamp(180px, 32vw, 420px)", height: "auto",
              filter: "drop-shadow(0 0 24px rgba(160,100,255,0.6))",
              flexShrink: 0,
            }}
          />

          {/* Game cards row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "14px",
            width: "100%",
            maxWidth: "680px",
            height: "clamp(280px, 48vh, 420px)",
          }}>
            {GAMES.map(g => (
              <GameCard
                key={g.id}
                game={g}
                onStart={() => g.path && router.push(g.path)}
              />
            ))}
          </div>
        </div>
        </div>

        {/* ── Right: NEWS / EVENTS panel ── */}
        <div style={{
          width: "clamp(220px, 24vw, 290px)", flexShrink: 0,
          alignSelf: "center",
          display: "flex", flexDirection: "column",
          padding: "0 12px 0 8px",
        }}>
          {/* Card — natural height */}
          <div style={{
            borderRadius: "16px",
            background: "rgba(20,10,50,0.82)",
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>

            {/* ── Header ── */}
            <div style={{
              background: "linear-gradient(135deg, #3b1fa3 0%, #6d28d9 60%, #3b1fa3 100%)",
              padding: "12px 14px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "50%",
                background: "linear-gradient(180deg,rgba(255,255,255,0.28) 0%,transparent 100%)",
                pointerEvents: "none",
              }}/>
              <div style={{ color: "white", fontSize: "13px", fontWeight: 900, letterSpacing: "0.1em", position: "relative", zIndex: 1 }}>
                NEWS/EVENTS
              </div>
            </div>

            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", flex: 1 }}>

              {/* Latest Updates */}
              <div style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.15em", color: "rgba(200,180,255,0.7)" }}>
                LATEST UPDATES
              </div>

              {NEWS.map((n, i) => (
                <div key={i} style={{
                  display: "flex", gap: "8px", alignItems: "flex-start",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "8px",
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "8px", flexShrink: 0,
                    background: n.thumb,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                  }}>
                    {n.thumbIcon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: "white", fontSize: "10px", fontWeight: 700, lineHeight: 1.3,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>{n.title}</div>
                    <div style={{ color: "rgba(180,155,255,0.5)", fontSize: "9px", marginTop: "2px" }}>{n.desc}</div>
                  </div>
                </div>
              ))}

              {/* Upcoming Tournaments */}
              <div style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.15em", color: "rgba(200,180,255,0.7)", marginTop: "2px" }}>
                UPCOMING TOURNAMENTS
              </div>

              {TOURNAMENTS.map((t, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "8px 10px",
                }}>
                  {/* Trophy badge */}
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                    background: `linear-gradient(135deg, ${t.color}dd 0%, ${t.color}66 100%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 10px ${t.color}55`,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "white", fontSize: "10px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                    <div style={{ color: t.color, fontSize: "9px", fontWeight: 700, marginTop: "1px" }}>Winner {t.rank} · {t.winner}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GameCard ─────────────────────────────────────────────────────────────────
function GameCard({
  game,
  onStart,
}: {
  game: typeof GAMES[number];
  onStart: () => void;
}) {
  return (
    <div
      style={{
        height: "100%",
        transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: game.active ? "pointer" : "default",
      }}
      onMouseEnter={e => { if (game.active) (e.currentTarget as HTMLDivElement).style.transform = "scale(1.04) translateY(-6px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1) translateY(0)"; }}
    >
      {/* Neon border wrapper — gradient border + glow */}
      <div style={{
        height: "100%",
        borderRadius: "22px",
        padding: "3px",
        background: `linear-gradient(180deg, ${game.borderColor} 0%, ${game.borderColor}88 100%)`,
        boxShadow: [
          `0 0 0 1px ${game.borderColor}44`,
          `0 0 20px ${game.borderColor}88`,
          `0 0 50px ${game.borderColor}33`,
          `0 20px 50px -10px ${game.glow}88`,
        ].join(", "),
      }}>
        {/* Card inner — flex column filling full height */}
        <div style={{
          height: "100%",
          borderRadius: "20px",
          background: "linear-gradient(180deg, #230d6b 0%, #0e0535 60%, #060118 100%)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* ── Title strip ── */}
          <div style={{
            padding: "12px 8px 10px",
            textAlign: "center",
            flexShrink: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 100%)`,
          }}>
            <span style={{
              color: "white",
              fontSize: "15px",
              fontWeight: 900,
              letterSpacing: "0.06em",
              lineHeight: 1.1,
              display: "block",
              textShadow: `0 0 16px ${game.borderColor}dd, 0 2px 6px rgba(0,0,0,0.9)`,
            }}>
              {game.title.replace(" ", "\n")}
            </span>
          </div>

          {/* ── Art — grows to fill available space ── */}
          <div style={{
            flex: 1, minHeight: 0,
            background: game.artGrad,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}>
            {/* Top gloss */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "35%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)",
              pointerEvents: "none",
            }} />
            {/* Bottom fade into card */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
              background: "linear-gradient(0deg, rgba(6,1,24,0.7) 0%, transparent 100%)",
              pointerEvents: "none",
            }} />
            {!game.active && (
              <div style={{
                position: "absolute", inset: 0, background: "rgba(5,1,20,0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  fontSize: "9px", fontWeight: 900, letterSpacing: "0.16em",
                  color: "rgba(180,150,255,0.85)",
                  border: "1px solid rgba(140,80,255,0.5)", padding: "5px 12px",
                  borderRadius: "20px", background: "rgba(40,10,80,0.8)",
                }}>COMING SOON</span>
              </div>
            )}
            <div style={{
              filter: !game.active ? "opacity(0.35) grayscale(0.7)" : "drop-shadow(0 6px 16px rgba(0,0,0,0.8))",
              zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {game.art}
            </div>
          </div>

          {/* ── BET / WIN — only for games that have a wager ── */}
          {game.active && game.showWager && (
            <div style={{
              display: "flex",
              borderTop: `1px solid ${game.borderColor}44`,
              borderBottom: `1px solid ${game.borderColor}22`,
              flexShrink: 0,
            }}>
              <div style={{ flex: 1, textAlign: "center", padding: "7px 4px", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "rgba(200,170,255,0.5)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.1em" }}>BET</div>
                <div style={{ color: "white", fontSize: "13px", fontWeight: 900 }}>{game.wager}</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", padding: "7px 4px" }}>
                <div style={{ color: "rgba(200,170,255,0.5)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.1em" }}>WIN</div>
                <div style={{ color: game.borderColor, fontSize: "13px", fontWeight: 900 }}>{game.payout}</div>
              </div>
            </div>
          )}

          {/* ── START button ── */}
          <div style={{ padding: "10px 10px 12px", flexShrink: 0 }}>
            {game.active ? (
              <div
                role="button"
                tabIndex={0}
                onClick={onStart}
                style={{ cursor: "pointer", userSelect: "none" }}
                onMouseDown={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(0.94) translateY(4px)"; }}
                onMouseUp={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1) translateY(0)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1) translateY(0)"; }}
              >
                {/* Wall gives 3D depth */}
                <div style={{
                  borderRadius: "14px",
                  background: game.startWall,
                  paddingBottom: "5px",
                  boxShadow: `0 10px 24px -4px ${game.startGlow}, 0 0 0 1px rgba(255,255,255,0.06)`,
                }}>
                  {/* Face */}
                  <div style={{
                    borderRadius: "12px 12px 10px 10px",
                    background: game.startGrad,
                    padding: "11px 10px",
                    textAlign: "center",
                    position: "relative", overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.5)",
                    boxShadow: "inset 0 6px 14px rgba(255,255,255,0.7), inset 0 -3px 8px rgba(0,0,0,0.3)",
                  }}>
                    {/* Gloss crescent */}
                    <div style={{
                      position: "absolute", top: "2px", left: "4%", right: "4%", height: "48%",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)",
                      borderRadius: "12px 12px 60px 60px", pointerEvents: "none",
                    }} />
                    {/* Specular dot */}
                    <div style={{
                      position: "absolute", top: "3px", left: "16%", width: "18px", height: "6px",
                      borderRadius: "50%", background: "rgba(255,255,255,0.85)", pointerEvents: "none",
                    }} />
                    <span style={{
                      color: "white", fontSize: "15px", fontWeight: 900, letterSpacing: "0.16em",
                      textShadow: "0px 2px 5px rgba(0,0,0,0.45)",
                      position: "relative", zIndex: 1,
                    }}>START</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                borderRadius: "14px", padding: "11px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                textAlign: "center", color: "rgba(180,150,255,0.3)",
                fontSize: "13px", fontWeight: 700, letterSpacing: "0.14em",
              }}>LOCKED</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
