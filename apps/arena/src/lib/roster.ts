export interface FighterDef {
  id: string;
  name: string;
  tagline: string;
  color: string;
  avatar: string;
}

export const ROSTER: FighterDef[] = [
  {
    id: "economist",
    name: "The Economist",
    tagline: "Data over feelings.",
    color: "bg-blue-600",
    avatar: "📈",
  },
  {
    id: "philosopher",
    name: "The Philosopher",
    tagline: "Truth beyond the spreadsheet.",
    color: "bg-purple-600",
    avatar: "👁️",
  },
  {
    id: "technologist",
    name: "The Technologist",
    tagline: "Progress is absolute.",
    color: "bg-green-600",
    avatar: "⚡",
  },
  {
    id: "doomer",
    name: "The Doomer",
    tagline: "Entropy always wins.",
    color: "bg-red-600",
    avatar: "💀",
  },
];
