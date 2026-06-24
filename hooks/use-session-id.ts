"use client";

import { useEffect, useState } from "react";

export function useSessionId(storageKey = "fsl-lens-session-id") {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) {
      setSessionId(existing);
      return;
    }

    const next = window.crypto.randomUUID();
    window.sessionStorage.setItem(storageKey, next);
    setSessionId(next);
  }, [storageKey]);

  return sessionId;
}
