"use client";

// ─── LevelUpToast ─────────────────────────────────────────────────────────────
// Full-screen celebratory pop-up that fires the moment a player crosses a
// level threshold. Before this, level-ups were communicated only by a
// small "★ LEVEL UP ★" callout buried inside the finished-screen scroll
// region — easy to miss, no audio, no celebration moment. Players asked
// for the satisfying pop they get in Duolingo / Clash Royale / Brawl
// Stars whenever they hit a new level.
//
// Behavior:
//   • When `level` becomes a number (i.e. a level-up just landed),
//     the toast renders with a scale-in bounce animation and plays the
//     level-up arpeggio via playLevelUp().
//   • Auto-dismisses after ~3.2s, or instantly on tap.
//   • Sits on top of every other UI (zIndex 2000) so it works inside
//     game modals, finished screens, and idle screens alike.
//   • Mobile-first sizing — fluid clamp() everywhere so a 360px phone
//     gets a readable card without overflow on a desktop monitor.

import { useEffect, useRef } from "react";
import { playLevelUp } from "@/hooks/useAppAudio";

type Props = {
  level: number | null;
  onClose: () => void;
};

export default function LevelUpToast({ level, onClose }: Props) {
  // Guard against double-firing the audio if the parent re-renders while
  // the same `level` value is still on screen. Reset on dismiss so the
  // next level-up plays fresh.
  const playedForLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (level == null) {
      playedForLevelRef.current = null;
      return;
    }
    if (playedForLevelRef.current === level) return;
    playedForLevelRef.current = level;
    // Tiny delay so the visual scale-in lands first, then the sound hits
    // on the bounce — feels punchier than firing them simultaneously.
    const audioT = setTimeout(() => playLevelUp(), 120);
    // Auto-dismiss — long enough to read the level number, short enough
    // not to block whatever the player wants to do next (tap CONTINUE,
    // restart the run, etc.). Tap-to-dismiss also wired below.
    const dismissT = setTimeout(() => onClose(), 3200);
    return () => {
      clearTimeout(audioT);
      clearTimeout(dismissT);
    };
  }, [level, onClose]);

  if (level == null) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(4,0,20,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "clamp(20px, 6vw, 40px)",
        animation: "fadeIn 0.25s ease both",
        cursor: "pointer", userSelect: "none",
      }}
    >
      <div style={{
        position: "relative",
        width: "100%", maxWidth: "360px",
        borderRadius: "28px",
        padding: "3px",
        background: "linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #c026d3 100%)",
        boxShadow: "0 0 60px rgba(251,191,36,0.55), 0 0 120px rgba(192,38,211,0.35), 0 30px 60px rgba(0,0,0,0.85)",
        animation: "bounce-scale-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      }}>
        {/* Confetti sparkles around the card — small absolutely-positioned
            stars/dots that pulse in time with the entrance animation. */}
        {[
          { top: "-14px", left: "12%",  size: 14, color: "#fde68a" },
          { top: "-22px", right: "18%", size: 18, color: "#f9a8d4" },
          { top: "10%",   left: "-22px", size: 12, color: "#67e8f9" },
          { top: "32%",   right: "-26px", size: 16, color: "#fde68a" },
          { bottom: "-18px", left: "20%", size: 14, color: "#86efac" },
          { bottom: "-22px", right: "14%", size: 18, color: "#f9a8d4" },
        ].map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            top: s.top, left: s.left, right: s.right, bottom: s.bottom,
            width: s.size, height: s.size,
            borderRadius: "50%",
            background: s.color,
            boxShadow: `0 0 ${s.size * 1.5}px ${s.color}, 0 0 ${s.size * 3}px ${s.color}66`,
            animation: `dot-pulse 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.08}s`,
            pointerEvents: "none",
          }} />
        ))}

        <div style={{
          borderRadius: "26px",
          background: "linear-gradient(180deg, #2a0c6e 0%, #13063a 50%, #07021a 100%)",
          padding: "clamp(28px, 7vw, 40px) clamp(20px, 5vw, 32px)",
          textAlign: "center",
          position: "relative", overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.12)",
        }}>
          {/* Top gloss strip */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "60px",
            background: "linear-gradient(180deg, rgba(251,191,36,0.18) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />

          {/* Eyebrow */}
          <div style={{
            color: "#fbbf24",
            fontSize: "clamp(10px, 3vw, 12px)",
            fontWeight: 900, letterSpacing: "0.32em",
            textShadow: "0 0 14px rgba(251,191,36,0.7)",
            position: "relative", zIndex: 1,
          }}>
            ★ LEVEL UP ★
          </div>

          {/* Big level number — the hero of this card. White center with
              gold + magenta halo so the number reads instantly even on
              small phones, while the colors signal celebration. */}
          <div style={{
            marginTop: "clamp(10px, 3vw, 14px)",
            color: "white",
            fontSize: "clamp(64px, 18vw, 92px)",
            fontWeight: 900, lineHeight: 1,
            textShadow: "0 0 18px rgba(251,191,36,0.85), 0 0 40px rgba(251,191,36,0.55), 0 0 70px rgba(192,38,211,0.45), 0 4px 8px rgba(0,0,0,0.7)",
            WebkitTextStroke: "1.5px #fbbf24",
            position: "relative", zIndex: 1,
          }}>
            LV.{level}
          </div>

          {/* Sub-line */}
          <div style={{
            marginTop: "clamp(10px, 3vw, 16px)",
            color: "rgba(254,215,170,0.85)",
            fontSize: "clamp(12px, 3.4vw, 14px)",
            fontWeight: 800, letterSpacing: "0.06em",
            position: "relative", zIndex: 1,
          }}>
            You&apos;re now level {level}
          </div>
          <div style={{
            marginTop: "6px",
            color: "rgba(200,180,255,0.55)",
            fontSize: "clamp(9px, 2.6vw, 11px)",
            fontWeight: 700, letterSpacing: "0.14em",
            position: "relative", zIndex: 1,
          }}>
            TAP TO CONTINUE
          </div>
        </div>
      </div>
    </div>
  );
}
