export interface FighterDef {
  id: string;
  name: string;
  tagline: string;
  color: string;
}

export const ROSTER: FighterDef[] = [
  {
    id: "economist",
    name: "The Economist",
    tagline: "Data over feelings.",
    color: "bg-blue-500",
  },
  {
    id: "philosopher",
    name: "The Philosopher",
    tagline: "Truth beyond the spreadsheet.",
    color: "bg-purple-500",
  },
  {
    id: "technologist",
    name: "The Technologist",
    tagline: "Progress is absolute.",
    color: "bg-green-500",
  },
  {
    id: "doomer",
    name: "The Doomer",
    tagline: "Entropy always wins.",
    color: "bg-red-500",
  },
];
