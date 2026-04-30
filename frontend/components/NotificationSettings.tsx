"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3005";

type Prefs = {
  streak_warnings: boolean;
  cup_deadlines: boolean;
  rank_changes: boolean;
  reengagement: boolean;
};

const DEFAULT_PREFS: Prefs = {
  streak_warnings: true,
  cup_deadlines: true,
  rank_changes: true,
  reengagement: true,
};

// NotificationSettings — master toggle + per-category mute. Renders inside
// the Settings tab on the profile page.
//
// The browser-permission constraint: the very first opt-in still needs a
// tap. After that the hook auto re-subscribes the device on every visit.
// This component owns the "off" path too — anyone can turn alerts off in
// one tap without losing their granted permission, so re-enabling is
// instant later.
export function NotificationSettings() {
  const { address } = useAccount();
  const { state, subscribe, unsubscribe } = usePushNotifications(address);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  // Load existing prefs for this wallet
  useEffect(() => {
    if (!address) return;
    fetch(`${BACKEND_URL}/api/push/prefs/${address}`)
      .then(r => r.json())
      .then(d => setPrefs({
        streak_warnings: d.streak_warnings ?? true,
        cup_deadlines: d.cup_deadlines ?? true,
        rank_changes: d.rank_changes ?? true,
        reengagement: d.reengagement ?? true,
      }))
      .catch(() => {});
  }, [address]);

  const savePrefs = async (next: Prefs) => {
    if (!address) return;
    setSaving(true);
    setPrefs(next);
    try {
      await fetch(`${BACKEND_URL}/api/push/prefs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, ...next }),
      });
    } catch {}
    setSaving(false);
  };

  const masterOn = state === "subscribed";
  const handleMaster = async () => {
    if (masterOn) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // Browser blocked at OS level — show a help message
  if (state === "denied") {
    return (
      <div style={{
        padding: "12px 14px", borderRadius: "12px",
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.3)",
      }}>
        <div style={{ color: "#fca5a5", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>
          🔕 Notifications blocked
        </div>
        <div style={{ color: "rgba(255,200,200,0.7)", fontSize: "10.5px", lineHeight: 1.5 }}>
          You blocked notifications in your browser settings. To turn them back on, click the lock icon in the address bar → Site settings → Notifications → Allow.
        </div>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div style={{
        padding: "10px 14px", borderRadius: "12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.55)", fontSize: "10.5px",
      }}>
        Push notifications aren't supported on this browser.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Master toggle */}
      <div style={{
        padding: "12px 14px", borderRadius: "12px",
        background: "rgba(167,139,250,0.08)",
        border: `1px solid rgba(167,139,250,${masterOn ? 0.45 : 0.2})`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "10px",
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: "white", fontSize: "13px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
            <span>{masterOn ? "🔔" : "🔕"}</span>
            <span>Notifications</span>
            {state === "subscribing" && (
              <span style={{ color: "rgba(167,139,250,0.7)", fontSize: "9.5px", marginLeft: "4px" }}>setting up…</span>
            )}
          </div>
          <div style={{ color: "rgba(200,180,255,0.6)", fontSize: "10.5px", marginTop: "2px", lineHeight: 1.4 }}>
            {masterOn
              ? "On for this device. Streak warnings, cup deadlines, rank changes."
              : "Get pinged before your streak dies and when cups end."}
          </div>
        </div>
        <button
          onClick={handleMaster}
          disabled={state === "subscribing"}
          style={{
            padding: "8px 16px",
            borderRadius: "999px",
            background: masterOn
              ? "rgba(255,255,255,0.06)"
              : "linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)",
            border: masterOn ? "1px solid rgba(255,255,255,0.2)" : "none",
            color: "white",
            fontSize: "10.5px", fontWeight: 900, letterSpacing: "0.1em",
            cursor: state === "subscribing" ? "not-allowed" : "pointer",
            boxShadow: masterOn ? "none" : "0 0 14px rgba(124,58,237,0.4)",
            flexShrink: 0,
          }}
        >
          {masterOn ? "TURN OFF" : "TURN ON"}
        </button>
      </div>

      {/* Per-category mutes — only meaningful when master is on */}
      {masterOn && (
        <div style={{
          padding: "10px 14px", borderRadius: "12px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", flexDirection: "column", gap: "6px",
        }}>
          <CategoryRow
            label="Streak warnings"
            hint="Before your streak dies"
            on={prefs.streak_warnings}
            onChange={v => savePrefs({ ...prefs, streak_warnings: v })}
            disabled={saving}
          />
          <CategoryRow
            label="Cup deadlines"
            hint="1 hour before a cup ends"
            on={prefs.cup_deadlines}
            onChange={v => savePrefs({ ...prefs, cup_deadlines: v })}
            disabled={saving}
          />
          <CategoryRow
            label="Rank changes"
            hint="When someone passes you on the podium"
            on={prefs.rank_changes}
            onChange={v => savePrefs({ ...prefs, rank_changes: v })}
            disabled={saving}
          />
          <CategoryRow
            label="Updates & re-engagement"
            hint="Game updates and 'we miss you' pings"
            on={prefs.reengagement}
            onChange={v => savePrefs({ ...prefs, reengagement: v })}
            disabled={saving}
          />
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  label, hint, on, onChange, disabled,
}: {
  label: string; hint: string; on: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>{label}</div>
        <div style={{ color: "rgba(200,180,255,0.5)", fontSize: "9.5px" }}>{hint}</div>
      </div>
      <button
        onClick={() => onChange(!on)}
        disabled={disabled}
        style={{
          width: 38, height: 22,
          borderRadius: 11,
          background: on ? "#a78bfa" : "rgba(255,255,255,0.1)",
          border: "1px solid " + (on ? "#c4b5fd" : "rgba(255,255,255,0.15)"),
          position: "relative",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background 0.15s",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute",
          top: 2, left: on ? 18 : 2,
          width: 16, height: 16,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }} />
      </button>
    </div>
  );
}
