"use client";

import { useEffect } from "react";

export function WakeUpPing() {
  useEffect(() => {
    // Silently wake up the Render backend while the user explores the landing page
    const engineUrl =
      process.env.NEXT_PUBLIC_ENGINE_URL || "http://127.0.0.1:8000";
    fetch(`${engineUrl}/health`).catch(() => {});
  }, []);

  return null;
}
