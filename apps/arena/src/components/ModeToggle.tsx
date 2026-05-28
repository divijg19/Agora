interface ModeToggleProps {
  value: "manual" | "auto";
  onChange: (v: "manual" | "auto") => void;
}

export function ModeToggle({ value, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-2 bg-black/50 p-1 rounded-md border border-white/10">
      <button
        type="button"
        onClick={() => onChange("manual")}
        className={`px-3 py-1 text-sm font-bold uppercase rounded-sm transition-colors ${
          value === "manual" ? "bg-white text-black" : "text-white/70"
        }`}
      >
        Manual
      </button>
      <button
        type="button"
        onClick={() => onChange("auto")}
        className={`px-3 py-1 text-sm font-bold uppercase rounded-sm transition-colors ${
          value === "auto" ? "bg-white text-black" : "text-white/70"
        }`}
      >
        Auto
      </button>
    </div>
  );
}
