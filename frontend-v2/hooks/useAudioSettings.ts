"use client";

import { useCallback, useEffect, useState } from "react";

// ─── Shared game audio / feedback settings ───────────────────────────────────
// Persisted in localStorage under the key "gameSettings". Shape mirrors the
// profile page's settings UI exactly so the panel and the game are always in
// sync. Any call to the setters writes through to localStorage immediately.
//
// Volumes are 0–100 ints (matches slider UI). The game should scale them to
// 0–1 by dividing by 100 before feeding into Web Audio gain nodes.

export type AudioSettings = {
  musicOn: boolean;
  sfxOn: boolean;
  musicVol: number;   // 0–100
  sfxVol: number;     // 0–100
  notifOn: boolean;
  hapticsOn: boolean;
};

const KEY = "gameSettings";

const DEFAULTS: AudioSettings = {
  musicOn: true,
  sfxOn: true,
  musicVol: 70,
  sfxVol: 85,
  notifOn: true,
  hapticsOn: true,
};

// SSR-safe reader — localStorage is undefined on the server, so fall back to
// defaults. Hydration will pick up the real value on the first client render.
function read(): AudioSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULTS);

  // Hydrate from localStorage on first mount — avoids SSR hydration mismatch.
  useEffect(() => { setSettings(read()); }, []);

  // Cross-tab sync: if another tab changes the settings, pick up the update.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      setSettings(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<AudioSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { ...settings, update };
}

// Helper for games: returns the effective gain multipliers (0–1) accounting
// for both the master toggle and the slider. Use these when scheduling audio.
export function effectiveGains(s: AudioSettings) {
  return {
    music: s.musicOn ? s.musicVol / 100 : 0,
    sfx:   s.sfxOn   ? s.sfxVol   / 100 : 0,
  };
}
