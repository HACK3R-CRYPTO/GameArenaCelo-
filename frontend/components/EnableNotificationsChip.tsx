"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// Passive nudge for connected wallets that haven't opted in yet. The
// PushOptInModal handles the "you just had a great moment" ask path; this
// chip handles the "you're browsing the home page and haven't played yet"
// path. Auto-hides once subscribed, denied, or unsupported.
//
// Deliberately ignores the modal's `gamearena:push:asked` localStorage gate
// so that a player who tapped "Not now" can still opt in here without
// having to navigate to Profile → Settings.

export function EnableNotificationsChip() {
  const { address } = useAccount();
  const { state, subscribe } = usePushNotifications(address);
  const [busy, setBusy] = useState(false);

  // Hide unless connected + has a clear "could subscribe" state. We let
  // "default" and "granted" through (granted-but-no-subscription happens
  // when cache is cleared on a previously-permissioned device).
  if (!address) return null;
  if (state === "subscribed" || state === "denied" || state === "unsupported") return null;

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try { await subscribe(); }
    finally { setBusy(false); }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy || state === "subscribing"}
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: "7px 14px", borderRadius: "999px",
        background: "rgba(124,58,237,0.18)",
        border: "1.5px solid rgba(167,139,250,0.55)",
        boxShadow: "0 0 14px rgba(124,58,237,0.35)",
        color: "rgba(230,220,255,0.95)",
        fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em",
        cursor: busy ? "not-allowed" : "pointer",
        opacity: busy ? 0.7 : 1,
        backdropFilter: "blur(6px)",
      }}
    >
      <span style={{ fontSize: "13px" }}>🔔</span>
      <span>{busy || state === "subscribing" ? "ENABLING…" : "ENABLE NOTIFICATIONS"}</span>
    </button>
  );
}
