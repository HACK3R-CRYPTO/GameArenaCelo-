"use client";

import { useCallback, useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3005";
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

// Browser support check — we never prompt on iOS Safari pre-16.4 since web
// push doesn't work there. Android Chrome and modern desktop browsers are
// the primary target.
function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// VAPID public key needs to be a Uint8Array for the browser API.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const padded = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushState = "unsupported" | "default" | "granted" | "denied" | "subscribing" | "subscribed";

export function usePushNotifications(walletAddress?: string) {
  const [state, setState] = useState<PushState>("default");

  // Initial state — read browser permission + check existing subscription.
  useEffect(() => {
    if (!isSupported()) { setState("unsupported"); return; }
    const perm = Notification.permission;
    if (perm === "denied")  { setState("denied"); return; }
    if (perm === "granted") {
      // Already granted — verify there's an active subscription.
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        if (!reg) { setState("granted"); return; }
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "subscribed" : "granted");
      });
      return;
    }
    setState("default");
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported() || !VAPID_KEY) return false;
    if (!walletAddress) return false;
    setState("subscribing");

    try {
      // 1. Make sure the service worker is registered
      const reg = await navigator.serviceWorker.register("/sw.js");

      // 2. Ask the browser for permission (this is the OS-level prompt)
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "default");
        return false;
      }

      // 3. Subscribe with the backend's VAPID public key
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        // Cast through BufferSource — the browser accepts Uint8Array but the
        // TS lib type is overly strict about ArrayBuffer vs ArrayBufferLike.
        const key = urlBase64ToUint8Array(VAPID_KEY);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key as unknown as BufferSource,
        });
      }

      // 4. Hand the subscription to our backend so it can send pushes
      const r = await fetch(`${BACKEND_URL}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, subscription: sub.toJSON() }),
      });
      if (!r.ok) { setState("granted"); return false; }

      setState("subscribed");
      return true;
    } catch (e) {
      console.warn("push subscribe failed:", e);
      setState("default");
      return false;
    }
  }, [walletAddress]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported()) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
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
