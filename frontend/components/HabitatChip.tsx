"use client";

import { useEffect, useState } from "react";
import { getHabitat, type HabitatTier } from "@/lib/habitats";
import { HabitatBackground } from "./HabitatBackground";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3005";

// Module-level cache so multiple rows for the same wallet only fetch once.
// In-flight promises are also cached so concurrent renders dedupe at the
// network layer, not just at the result layer.
const CACHE = new Map<string, HabitatTier>();
const INFLIGHT = new Map<string, Promise<HabitatTier | null>>();

async function fetchEquipped(addr: string): Promise<HabitatTier | null> {
  const lower = addr.toLowerCase();
  const cached = CACHE.get(lower);
  if (cached) return cached;
  const flying = INFLIGHT.get(lower);
  if (flying) return flying;

  const promise = (async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/habitat/${lower}`);
      if (!r.ok) return null;
      const data = await r.json();
      const tier = getHabitat(typeof data.equipped === "number" ? data.equipped : 1);
      if (tier) CACHE.set(lower, tier);
      return tier ?? null;
    } catch {
      return null;
    } finally {
      INFLIGHT.delete(lower);
    }
  })();
  INFLIGHT.set(lower, promise);
  return promise;
}

// Small circular habitat preview shown next to a player's name on the
// leaderboard. Lazily fetches via /api/habitat, caches in module memory,
// renders the same HabitatBackground used everywhere else.
export function HabitatChip({ address, size = 22 }: { address: string; size?: number }) {
  const [tier, setTier] = useState<HabitatTier | null>(() => CACHE.get(address.toLowerCase()) ?? null);

  useEffect(() => {
    if (!address) return;
    if (tier) return;
    let cancelled = false;
    fetchEquipped(address).then(t => {
      if (!cancelled) setTier(t);
    });
    return () => { cancelled = true; };
  }, [address, tier]);

  if (!tier) {
    // Reserve space so rows don't reflow when chips load in.
    return (
      <div style={{
        width: size, height: size,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
        flexShrink: 0,
      }} />
    );
  }

  return (
    <div style={{
      width: size, height: size,
      position: "relative",
      borderRadius: "50%",
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: tier.type === "paid" ? `0 0 6px ${tier.bg.accent}88` : "none",
      border: `1px solid ${tier.bg.accent}66`,
    }} title={tier.name}>
      <HabitatBackground habitat={tier} radius={size / 2} glow={false} />
    </div>
  );
}
