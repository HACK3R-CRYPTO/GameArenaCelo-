"use client";

import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useSelfVerification } from "@/contexts/SelfVerificationContext";

// ─── Splash icons ──────────────────────────────────────────────────────────────
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

const NAV_ITEMS = [
  { label: "Home",        path: "/home",        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> },
  { label: "Games",       path: "/games",       icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3a1 1 0 00-1 1v10a1 1 0 001 1h18a1 1 0 001-1V7a1 1 0 00-1-1zm-10 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm4.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg> },
  { label: "Leaderboard", path: "/leaderboard", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11 21H5a2 2 0 01-2-2v-7a2 2 0 012-2h6v11zm2 0V6a2 2 0 012-2h4a2 2 0 012 2v13h-8z"/></svg> },
  { label: "Profile",     path: "/profile",     icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg> },
];

const GAME_STATS = [
  { name: "RHYTHM\nRUSH",  played: 10, wins: 8, color: "#f59e0b", grad: "linear-gradient(160deg,#7e22ce,#a21caf)", icon: "🥁" },
  { name: "SIMON\nMEMORY", played: 9,  wins: 6, color: "#22c55e", grad: "linear-gradient(160deg,#0e4f6b,#075985)", icon: "🧠" },
  { name: "CHALLENGE\nAI", played: 5,  wins: 3, color: "#3b82f6", grad: "linear-gradient(160deg,#1e3a5f,#1e4080)", icon: "🤖" },
];

const RECENT = [
  { game: "Rhythm Rush",  result: "WIN",  earned: "+1.3 G$", color: "#22c55e", icon: "🥁" },
  { game: "Simon Memory", result: "WIN",  earned: "+1.3 G$", color: "#22c55e", icon: "🧠" },
  { game: "Challenge AI", result: "LOSS", earned: "-1 G$",   color: "#ef4444", icon: "🤖" },
  { game: "Rhythm Rush",  result: "WIN",  earned: "+1.3 G$", color: "#22c55e", icon: "🥁" },
  { game: "Simon Memory", result: "LOSS", earned: "-1 G$",   color: "#ef4444", icon: "🧠" },
];

// ─── Juicy Button ─────────────────────────────────────────────────────────────
function JuicyBtn({
  label, wallColor, faceGrad, glowColor, onClick,
}: { label: string; wallColor: string; faceGrad: string; glowColor: string; onClick?: () => void }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick}
      style={{ cursor: "pointer", userSelect: "none" }}
      onMouseDown={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(0.95) translateY(4px)"; }}
      onMouseUp={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}
    >
      <div style={{ borderRadius: "14px", background: wallColor, paddingBottom: "5px", boxShadow: `0 10px 24px -4px ${glowColor}` }}>
        <div style={{
          borderRadius: "12px 12px 10px 10px", background: faceGrad,
          padding: "11px 20px", textAlign: "center",
          position: "relative", overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.45)",
          boxShadow: "inset 0 6px 14px rgba(255,255,255,0.65), inset 0 -3px 6px rgba(0,0,0,0.3)",
        }}>
          <div style={{
            position: "absolute", top: "2px", left: "4%", right: "4%", height: "48%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)",
            borderRadius: "12px 12px 60px 60px", pointerEvents: "none",
          }} />
          <span style={{ color: "white", fontSize: "13px", fontWeight: 900, letterSpacing: "0.14em", position: "relative", zIndex: 1 }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { logout, authenticated } = usePrivy();
  const { address } = useAccount();
  const { isVerified, entitlement, claimG$ } = useSelfVerification();

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected";
  const initials  = address ? address.slice(2, 4).toUpperCase() : "??";

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(160deg, #4c1d95 0%, #3b0a9e 35%, #1e0762 65%, #0d0230 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>

      {/* Floating bg icons */}
      {LEFT_ICONS.map((ic, i) => (
        <div key={`l${i}`} className="icon-float" style={{
          position: "absolute", top: ic.top, left: ic.left, width: ic.size, height: ic.size,
          transform: `rotate(${ic.rotate}deg)`, filter: `drop-shadow(0 0 8px ${ic.glow}99)`,
          ["--dur" as string]: `${ic.dur}s`, ["--delay" as string]: `${ic.delay}s`,
          userSelect: "none", pointerEvents: "none", zIndex: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ic.src} alt="" width={ic.size} height={ic.size} style={{ objectFit: "contain", display: "block" }} />
        </div>
      ))}
      {RIGHT_ICONS.map((ic, i) => (
        <div key={`r${i}`} className="icon-float" style={{
          position: "absolute", top: ic.top, right: ic.right, width: ic.size, height: ic.size,
          transform: `rotate(${ic.rotate}deg)`, filter: `drop-shadow(0 0 8px ${ic.glow}99)`,
          ["--dur" as string]: `${ic.dur}s`, ["--delay" as string]: `${ic.delay}s`,
          userSelect: "none", pointerEvents: "none", zIndex: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ic.src} alt="" width={ic.size} height={ic.size} style={{ objectFit: "contain", display: "block" }} />
        </div>
      ))}

      {/* ── Body row: sidebar + center + right panel ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative", zIndex: 2 }}>

        {/* ── Left nav sidebar ── */}
        <div style={{
          width: "68px", flexShrink: 0, alignSelf: "stretch",
          background: "rgba(4,1,18,0.7)", borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px",
        }}>
          {NAV_ITEMS.map(item => {
            const active = item.path === "/profile";
            return (
              <button key={item.path} onClick={() => router.push(item.path)} style={{
                width: "54px", borderRadius: "12px", padding: "8px 4px 6px",
                background: active ? "rgba(255,255,255,0.18)" : "transparent", border: "none",
                color: active ? "white" : "rgba(255,255,255,0.38)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                boxShadow: active ? "0 0 0 1px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.4)" : "none",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.38)"; }}
              >
                {item.icon}
                <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.04em" }}>{item.label.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* ── Center: Player card + game stats ── */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "16px 14px", gap: "14px", overflowY: "auto",
          }}>

            {/* ── PLAYER CARD (wall + face pattern) ── */}
            <div style={{
              width: "100%", maxWidth: "540px",
              borderRadius: "26px", background: "#1a0550", paddingBottom: "7px",
              boxShadow: "0 0 0 3px #5b21b6, 0 0 50px rgba(109,40,217,0.55), 0 24px 60px rgba(0,0,0,0.85)",
              flexShrink: 0,
            }}>
              <div style={{
                borderRadius: "24px 24px 20px 20px",
                background: "linear-gradient(180deg, #2a0c6e 0%, #13063a 50%, #07021a 100%)",
                border: "2px solid rgba(255,255,255,0.12)",
                overflow: "hidden", padding: "20px 20px 18px", position: "relative",
              }}>
                {/* Top gloss */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "80px",
                  background: "linear-gradient(180deg, rgba(200,160,255,0.14) 0%, transparent 100%)",
                  pointerEvents: "none",
                }} />

                {/* Avatar row */}
                <div style={{ display: "flex", alignItems: "center", gap: "18px", position: "relative", zIndex: 1 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {/* Avatar gem */}
                    <div style={{
                      width: "82px", height: "82px", borderRadius: "50%",
                      background: "radial-gradient(circle at 35% 30%, #c084fc, #5b21b6 70%)",
                      border: "3px solid rgba(192,132,252,0.7)",
                      boxShadow: "0 0 28px rgba(192,132,252,0.6), 0 0 55px rgba(139,92,246,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "28px", fontWeight: 900, color: "white",
                      textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                    }}>{initials}</div>
                    {/* Rank badge */}
                    <div style={{
                      position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)",
                      background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                      borderRadius: "10px", padding: "2px 8px",
                      boxShadow: "0 0 12px rgba(251,191,36,0.6)",
                      border: "1.5px solid rgba(255,255,255,0.4)",
                      whiteSpace: "nowrap",
                    }}>
                      <span style={{ fontSize: "8px", fontWeight: 900, color: "white", letterSpacing: "0.06em" }}>🏆 RANK #7</span>
                    </div>
                  </div>

                  {/* Name + verified */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "15px", fontWeight: 900, color: "white", letterSpacing: "0.04em",
                      textShadow: "0 0 16px rgba(192,132,252,0.6)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{shortAddr}</div>
                    {isVerified ? (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "7px",
                        padding: "3px 10px", borderRadius: "20px",
                        background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.45)",
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#22c55e"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "#22c55e", letterSpacing: "0.1em" }}>GOODDOLLAR VERIFIED</span>
                      </div>
                    ) : (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "7px",
                        padding: "3px 10px", borderRadius: "20px",
                        background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)",
                        cursor: "pointer",
                      }} onClick={() => router.push("/verify")}>
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "#fbbf24", letterSpacing: "0.1em" }}>⚠ VERIFY TO UNLOCK REWARDS</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stat gems row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "18px", position: "relative", zIndex: 1 }}>
                  {[
                    { val: "24",    label: "GAMES",    color: "#a78bfa", wall: "#1a0550" },
                    { val: "17",    label: "WINS",     color: "#22c55e", wall: "#002a10" },
                    { val: "71%",   label: "WIN RATE", color: "#fbbf24", wall: "#2a1800" },
                    { val: "22 G$", label: "EARNED",   color: "#e879f9", wall: "#2a0060" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      borderRadius: "14px", background: s.wall, paddingBottom: "4px",
                      boxShadow: `0 6px 16px -4px ${s.color}66, 0 0 0 1px ${s.color}44`,
                    }}>
                      <div style={{
                        borderRadius: "12px 12px 10px 10px",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.2) 100%)",
                        padding: "10px 6px 8px", textAlign: "center",
                        border: `1px solid ${s.color}44`,
                        boxShadow: "inset 0 4px 8px rgba(255,255,255,0.06)",
                      }}>
                        <div style={{ fontSize: "17px", fontWeight: 900, color: s.color, textShadow: `0 0 14px ${s.color}99`, lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: "7px", fontWeight: 800, color: "rgba(180,150,255,0.6)", letterSpacing: "0.12em", marginTop: "4px" }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* G$ Claim — only when available */}
                {isVerified && entitlement && Number(entitlement) > 0 && (
                  <div style={{
                    marginTop: "14px", position: "relative", zIndex: 1,
                    borderRadius: "14px", background: "#022010", paddingBottom: "4px",
                    boxShadow: "0 0 0 1.5px #15803d, 0 0 20px rgba(34,197,94,0.25)",
                  }}>
                    <div style={{
                      borderRadius: "12px 12px 10px 10px",
                      background: "linear-gradient(180deg, #064e20 0%, #022010 100%)",
                      border: "1.5px solid rgba(134,239,172,0.3)",
                      padding: "12px 16px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      overflow: "hidden", position: "relative",
                    }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(134,239,172,0.1) 0%, transparent 100%)", pointerEvents: "none" }} />
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(134,239,172,0.7)", letterSpacing: "0.12em" }}>WEEKLY REWARD READY</div>
                        <div style={{ fontSize: "20px", fontWeight: 900, color: "#86efac", textShadow: "0 0 16px rgba(134,239,172,0.7)", marginTop: "2px" }}>
                          {(Number(entitlement) / 1e18).toFixed(2)} G$
                        </div>
                      </div>
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <JuicyBtn label="CLAIM" wallColor="#003a00" faceGrad="linear-gradient(160deg, #86efac 0%, #22c55e 50%, #15803d 100%)" glowColor="rgba(34,197,94,0.7)" onClick={() => claimG$()} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── GAME STATS cards ── */}
            <div style={{ width: "100%", maxWidth: "540px", display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
              <div style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.18em", color: "rgba(190,150,255,0.8)", textAlign: "center", textShadow: "0 0 14px rgba(160,100,255,0.8)" }}>
                ── GAME STATS ──
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {GAME_STATS.map((g, i) => (
                  <div key={i} style={{
                    borderRadius: "18px", padding: "2.5px",
                    background: `linear-gradient(180deg, ${g.color} 0%, ${g.color}55 100%)`,
                    boxShadow: `0 0 20px ${g.color}55, 0 10px 28px rgba(0,0,0,0.7)`,
                  }}>
                    <div style={{
                      borderRadius: "16px", background: g.grad,
                      padding: "14px 10px 12px", textAlign: "center",
                      display: "flex", flexDirection: "column", gap: "8px",
                    }}>
                      <div style={{ fontSize: "22px" }}>{g.icon}</div>
                      <div style={{ fontSize: "10px", fontWeight: 900, color: "white", letterSpacing: "0.04em", lineHeight: 1.2, whiteSpace: "pre-line", textShadow: `0 0 10px ${g.color}cc` }}>{g.name}</div>
                      <div style={{ display: "flex", justifyContent: "space-around" }}>
                        <div>
                          <div style={{ fontSize: "18px", fontWeight: 900, color: "white" }}>{g.played}</div>
                          <div style={{ fontSize: "7px", fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>PLAYED</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "18px", fontWeight: 900, color: g.color, textShadow: `0 0 12px ${g.color}` }}>{g.wins}</div>
                          <div style={{ fontSize: "7px", fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>WINS</div>
                        </div>
                      </div>
                      {/* Win bar */}
                      <div style={{ height: "5px", borderRadius: "3px", background: "rgba(0,0,0,0.4)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "3px", width: `${Math.round(g.wins / g.played * 100)}%`, background: g.color, boxShadow: `0 0 6px ${g.color}` }} />
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 900, color: "#fbbf24", textShadow: "0 0 10px rgba(251,191,36,0.7)" }}>
                        {Math.round(g.wins / g.played * 100)}% WIN
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disconnect */}
            {authenticated && (
              <div style={{ width: "100%", maxWidth: "540px", flexShrink: 0 }}>
                <JuicyBtn
                  label="DISCONNECT WALLET"
                  wallColor="#3a0000"
                  faceGrad="linear-gradient(160deg, #ff6060 0%, #ee1111 50%, #b00000 100%)"
                  glowColor="rgba(200,0,0,0.5)"
                  onClick={() => { logout(); router.push("/home"); }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right: RECENT MATCHES panel ── */}
        <div style={{
          width: "clamp(220px, 24vw, 290px)", flexShrink: 0,
          alignSelf: "center",
          display: "flex", flexDirection: "column",
          padding: "0 12px 0 8px",
        }}>
          <div style={{
            borderRadius: "16px",
            background: "rgba(20,10,50,0.82)",
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #3b1fa3 0%, #6d28d9 60%, #3b1fa3 100%)",
              padding: "12px 14px", position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "50%",
                background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)",
                pointerEvents: "none",
              }} />
              <div style={{ color: "white", fontSize: "13px", fontWeight: 900, letterSpacing: "0.1em", position: "relative", zIndex: 1 }}>
                RECENT MATCHES
              </div>
            </div>

            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.15em", color: "rgba(200,180,255,0.7)" }}>
                LATEST GAMES
              </div>
              {RECENT.map((r, i) => (
                <div key={i} style={{
                  display: "flex", gap: "8px", alignItems: "center",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "8px",
                }}>
                  {/* Icon */}
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "8px", flexShrink: 0,
                    background: `radial-gradient(circle at 35% 30%, ${r.color}cc, ${r.color}44)`,
                    border: `1px solid ${r.color}66`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", boxShadow: `0 0 8px ${r.color}55`,
                  }}>{r.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "white", fontSize: "9px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.game}</div>
                    <div style={{ color: r.color, fontSize: "10px", fontWeight: 900, marginTop: "2px" }}>{r.earned}</div>
                  </div>
                  {/* Result badge */}
                  <div style={{
                    padding: "3px 8px", borderRadius: "8px",
                    background: r.color === "#22c55e" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    border: `1px solid ${r.color}66`, flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "9px", fontWeight: 900, color: r.color, letterSpacing: "0.08em" }}>{r.result}</span>
                  </div>
                </div>
              ))}

              <div style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.15em", color: "rgba(200,180,255,0.7)", marginTop: "4px" }}>
                ACHIEVEMENTS
              </div>
              {[
                { icon: "🥇", label: "First Win",     color: "#fbbf24", unlocked: true  },
                { icon: "🔥", label: "Hot Streak ×5", color: "#f97316", unlocked: true  },
                { icon: "🤖", label: "AI Slayer",      color: "#3b82f6", unlocked: false },
                { icon: "💎", label: "Diamond Hand",   color: "#a78bfa", unlocked: false },
              ].map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "10px",
                  border: `1px solid ${a.unlocked ? a.color + "44" : "rgba(255,255,255,0.07)"}`,
                  padding: "7px 10px",
                  opacity: a.unlocked ? 1 : 0.45,
                }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
                    background: a.unlocked ? `linear-gradient(135deg, ${a.color}cc 0%, ${a.color}55 100%)` : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", boxShadow: a.unlocked ? `0 0 10px ${a.color}55` : "none",
                  }}>{a.icon}</div>
                  <div style={{ color: a.unlocked ? "white" : "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 700 }}>{a.label}</div>
                  {a.unlocked && (
                    <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill={a.color}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
