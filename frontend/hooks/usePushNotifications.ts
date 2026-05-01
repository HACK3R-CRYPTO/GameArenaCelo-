"use client";

import { useCallback, useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3005";
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const padded = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushState = "unsupported" | "default" | "granted" | "denied" | "subscribing" | "subscribed";

// "I deliberately turned this OFF" sticky bit. Set when the user toggles
// OFF in Settings, cleared when they toggle ON again. Without this flag
// the mount effect can't tell apart "subscription lost from cache clear"
// (re-attach silently) vs "user unsubscribed on purpose" (leave it off).
const OPT_OUT_KEY = "gamearena:push:opted-out";
function isOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(OPT_OUT_KEY) === "1";
}
function setOptedOut(v: boolean) {
  if (typeof window === "undefined") return;
  if (v) window.localStorage.setItem(OPT_OUT_KEY, "1");
  else window.localStorage.removeItem(OPT_OUT_KEY);
}

// Browser-level constraint: the FIRST permission grant requires a user
// gesture (click/tap). We can't bypass that — every browser enforces it.
// BUT once a user grants permission on our domain, the permission stays
// "granted" forever. If they later lose their subscription (cleared cache,
// new device, etc.) we silently re-attach without prompting. That's the
// "auto" behavior — automatic for everyone after their first opt-in tap.
async function silentlyResubscribeIfPossible(walletAddress: string): Promise<boolean> {
  if (!isSupported() || !VAPID_KEY || !walletAddress) return false;
  if (Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const key = urlBase64ToUint8Array(VAPID_KEY);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key as unknown as BufferSource,
      });
    }
    await fetch(`${BACKEND_URL}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, subscription: sub.toJSON() }),
    });
    return true;
  } catch {
    return false;
  }
}

export function usePushNotifications(walletAddress?: string) {
  const [state, setState] = useState<PushState>("default");

  // Initial state — read browser permission + check existing subscription.
  // If permission is already granted but no subscription exists (cleared
  // cache, new device), silently re-subscribe in the background. No prompt.
  useEffect(() => {
    if (!isSupported()) { setState("unsupported"); return; }
    const perm = Notification.permission;
    if (perm === "denied")  { setState("denied"); return; }
    if (perm === "granted") {
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        if (!reg) { setState("granted"); return; }
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setState("subscribed");
          return;
        }
        // No subscription but permission granted. Two cases:
        //  a) cache cleared / new device → silently re-attach
        //  b) user deliberately turned it OFF → stay off, respect their choice
        // The opt-out flag is set in unsubscribe() and cleared in subscribe(),
        // so it's the only way to tell those apart.
        if (walletAddress && !isOptedOut()) {
          const ok = await silentlyResubscribeIfPossible(walletAddress);
          setState(ok ? "subscribed" : "granted");
        } else {
          setState("granted");
        }
      });
      return;
    }
    setState("default");
  }, [walletAddress]);

  // First-time subscribe — must be called from a user gesture handler.
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported() || !VAPID_KEY) return false;
    if (!walletAddress) return false;
    setState("subscribing");

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "default");
        return false;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const key = urlBase64ToUint8Array(VAPID_KEY);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key as unknown as BufferSource,
        });
      }

      const r = await fetch(`${BACKEND_URL}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, subscription: sub.toJSON() }),
      });
      if (!r.ok) { setState("granted"); return false; }

      // Subscribed by explicit user action — clear the opt-out sticky bit
      // so future page loads with permission still granted will re-attach
      // silently if the subscription is ever lost (cache clear, new device).
      setOptedOut(false);
      setState("subscribed");
      return true;
    } catch (e) {
      console.warn("push subscribe failed:", e);
      setState("default");
      return false;
    }
  }, [walletAddress]);

  // Turn notifications off for THIS device. Unsubscribes locally + removes
  // the row from our backend. Does NOT revoke browser permission, so the
  // player can flip it back on later with one tap (no re-prompt).
  // Sets the opt-out sticky bit so the mount effect doesn't silently re-
  // attach the subscription on the next page load.
  const unsubscribe = useCallback(async () => {
    // Set opt-out FIRST so even if the unsubscribe steps below race with a
    // page reload, the next mount still respects the user's choice.
    setOptedOut(true);
    if (!isSupported()) { setState("granted"); return; }
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) { setState("granted"); return; }
    const sub = await reg.pushManager.getSubscription();
    if (!sub) { setState("granted"); return; }
    try {
      await fetch(`${BACKEND_URL}/api/push/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    } catch { /* still attempt local unsubscribe */ }
    await sub.unsubscribe();
    setState("granted");
  }, []);

  return { state, subscribe, unsubscribe };
}
