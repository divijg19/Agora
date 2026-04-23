import type { FighterDef } from "../types/fighter";

export interface MatchRequest {
  topic: string;
  fighter_a: string;
  fighter_b: string;
}

export interface MatchResponse {
  message: string;
  match_id: string;
}

const API_BASE = import.meta.env.VITE_ENGINE_URL
  ? `${import.meta.env.VITE_ENGINE_URL}/api`
  : "http://localhost:8000/api";

export async function startMatch(data: MatchRequest): Promise<string> {
  const res = await fetch(`${API_BASE}/match/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to start match");

  const json: MatchResponse = await res.json();
  return json.match_id;
}

// Ensure this matches exactly how the router is prefixed in FastAPI
export async function fetchRoster(): Promise<FighterDef[]> {
  const res = await fetch(`${API_BASE}/match/roster`);
  if (!res.ok) throw new Error("Failed to fetch roster");
  const json = await res.json();
  return json.roster;
}
