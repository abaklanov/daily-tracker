import { useState, useCallback } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { getCompletions, saveCompletions, todayStr } from "../completions";

export default function Tracker() {
  const [flash, setFlash] = useState(false);
  const [todayCount, setTodayCount] = useState(() => {
    const c = getCompletions();
    return c[todayStr()] || 0;
  });

  const handleClick = useCallback(() => {
    const data = getCompletions();
    const today = todayStr();
    data[today] = (data[today] || 0) + 1;
    saveCompletions(data);
    setTodayCount(data[today]);
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-12 px-6">
      <div className="text-center">
        <h1
          className="text-5xl mb-3 leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
        >
          Tänään tehty
        </h1>
        <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-sans)", fontSize: 15 }}>
          Paina nappia joka kerta kun saat asian tehtyä
        </p>
      </div>

      <button
        onClick={handleClick}
        className={`
          relative w-48 h-48 rounded-full border-2 transition-all duration-300 select-none
          flex flex-col items-center justify-center gap-3
          active:scale-95 hover:scale-105
          ${flash
            ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] shadow-[0_0_40px_8px_rgba(74,222,128,0.25)]"
            : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] hover:shadow-[0_0_24px_4px_rgba(74,222,128,0.12)]"
          }
        `}
        style={{ cursor: "pointer" }}
      >
        <CheckIcon className="size-12" aria-hidden="true" />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: flash ? "var(--color-accent)" : "var(--color-muted)",
            transition: "color 0.3s",
          }}
        >
          {flash ? "Merkitty!" : "Merkitse tehty"}
        </span>
      </button>

      <div
        className="flex flex-col items-center gap-1"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span className="text-4xl" style={{ color: "var(--color-accent)" }}>
          {todayCount}
        </span>
        <span style={{ color: "var(--color-muted)", fontSize: 12 }}>tehty tänään</span>
      </div>
    </div>
  );
}
