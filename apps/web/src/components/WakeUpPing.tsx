"use client";

import { useEffect } from "react";
import { getEngineUrl } from "@/lib/engineUrl";

export function WakeUpPing() {
  useEffect(() => {
    // Silently wake up the Render backend while the user explores the landing page
    const engineUrl = getEngineUrl();
    fetch(`${engineUrl}/health`).catch(() => {});
  }, []);

  return null;
}
