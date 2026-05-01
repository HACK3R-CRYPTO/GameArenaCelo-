// ─── Pet mood derivation ────────────────────────────────────────────────────
// The pet stage (egg → king) is determined by player level. Mood is an
// orthogonal layer on top: same king slime can be happy, sleepy, or worried
// depending on how recently the player engaged. Thresholds intentionally
// match the push-notification re-engagement escalation (re-d1, re-d3, re-d7,
// re-d14) so the door-bell copy and the pet's emotional state tell the same
// story across channels.

export type PetMood = "happy" | "neutral" | "sleepy" | "sad" | "worried";

export type MoodInput = {
  // Current play streak in days. 0 means no active streak.
  streak: number;
  // ISO "YYYY-MM-DD" date of last play, or null for never-played.
  lastPlayDate: string | null;
  // Did the player play today already?
  playedToday: boolean;
};

// Days between two ISO-date strings ("YYYY-MM-DD"). Computed via UTC midnight
// snapshots so DST and timezone drift can't off-by-one the threshold buckets.
function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(
    Number(fromIso.slice(0, 4)),
    Number(fromIso.slice(5, 7)) - 1,
    Number(fromIso.slice(8, 10)),
  );
  const b = Date.UTC(
    Number(toIso.slice(0, 4)),
    Number(toIso.slice(5, 7)) - 1,
    Number(toIso.slice(8, 10)),
  );
  return Math.floor((b - a) / 86400000);
}

export function moodFor({ streak, lastPlayDate, playedToday }: MoodInput): PetMood {
  // Brand-new player or never played — treat as a fresh egg, neutral. Don't
  // saddle a first-time visitor with a sad pet before they've even tapped play.
  if (!lastPlayDate) return "neutral";

  if (playedToday) {
    // Active today + meaningful streak = visibly happy. Threshold of 3 picks
    // the moment a streak feels real; 1 or 2 days is just "I tried it twice."
    if (streak >= 3) return "happy";
    return "neutral";
  }

  // Lapsed buckets — match push escalation (1d, 3d, 7d).
  const today = new Date().toISOString().slice(0, 10);
  const days = daysBetween(lastPlayDate, today);
  if (days <= 2) return "sleepy";   // 1–2 days
  if (days <= 6) return "sad";      // 3–6 days
  return "worried";                 // 7+ days
}

// Mood-specific bubble pools — the textual layer that telegraphs mood without
// needing a literal "MOOD: SAD" label. Variant chosen at random per poke.
export function bubblesFor(mood: PetMood, opts?: { isEgg?: boolean; streak?: number }): string[] {
  const streak = opts?.streak ?? 0;
  if (opts?.isEgg) {
    if (mood === "sad" || mood === "worried") return ["So cold…", "Where'd you go?", "I need warmth."];
    if (mood === "sleepy") return ["Sleepy egg…", "Zzz…", "5 more minutes."];
    if (mood === "happy")  return ["Almost hatching!", "It's tapping!", `Day ${streak}!`];
    return ["It's warm.", "Cozy in here.", "I hear tapping!"];
  }
  if (mood === "happy")   return [`On fire 🔥`, `Day ${streak}!`, "Don't stop!", "Boop!"];
  if (mood === "sleepy")  return ["Need a nap…", "Where'd you go?", "Zzz…"];
  if (mood === "sad")     return ["I miss you.", "It's been a while.", "Come play?"];
  if (mood === "worried") return ["Are you okay?", "Come back?", "I'm waiting…"];
  return ["Hi!", "Boop!", "Let's play!", "Squish!"];
}

// Idle CSS class — drives unique motion per mood. Color/filter alone reads as
// a UI bug; motion is what makes the pet feel alive. Keyframes are defined
// in globals.css.
export function idleClassFor(mood: PetMood, isEgg: boolean): string {
  if (mood === "happy")   return isEgg ? "egg-wobble pet-mood-happy"   : "slime-idle pet-mood-happy";
  if (mood === "sleepy")  return isEgg ? "egg-wobble pet-mood-sleepy"  : "slime-idle pet-mood-sleepy";
  if (mood === "sad")     return isEgg ? "egg-wobble pet-mood-sad"     : "slime-idle pet-mood-sad";
  if (mood === "worried") return isEgg ? "egg-wobble pet-mood-worried" : "slime-idle pet-mood-worried";
  return isEgg ? "egg-wobble" : "slime-idle";
}

// CSS filter applied to the pet sprite for moods that need a tonal shift.
// Worried is the strongest desaturation; sad is mild; happy is brighter +
// slightly warmer. Sleepy uses motion only (no filter), so the sprite stays
// recognizable while the bob slows down.
export function filterFor(mood: PetMood): string | undefined {
  if (mood === "happy")   return "saturate(1.15) brightness(1.08)";
  if (mood === "sad")     return "saturate(0.7) brightness(0.92)";
  if (mood === "worried") return "grayscale(0.4) brightness(0.85)";
  return undefined;
}

// Floating overlay glyph rendered above the pet for moods with a clear
// emoji shorthand. null means no overlay (neutral, happy use motion alone).
// The overlay is the SOLE textual-equivalent mood signal — bubble copy on
// tap carries the rest. No permanent label chip: status-bar UI fights with
// the sprite's expression and reads as Tamagotchi clutter.
export function overlayFor(mood: PetMood): string | null {
  if (mood === "sleepy")  return "💤";
  if (mood === "worried") return "💧";
  return null;
}
