import { useState, useEffect, useCallback } from "react";

type Page = "tracker" | "calendar";

interface CompletionRecord {
  date: string; // YYYY-MM-DD
  count: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCompletions(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem("completions") || "{}");
  } catch {
    return {};
  }
}

function saveCompletions(data: Record<string, number>) {
  localStorage.setItem("completions", JSON.stringify(data));
}

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

const LEVEL_COLORS = [
  "bg-[#1a1a1d] border border-[#2a2a2e]",
  "bg-[#166534]",
  "bg-[#16a34a]",
  "bg-[#4ade80]",
  "bg-[#86efac]",
];

function CalendarGrid({ completions }: { completions: Record<string, number> }) {
  const today = new Date();
  const weeks: Array<Array<{ date: string; count: number } | null>> = [];

  // Build 52 weeks + partial current week going back from today
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const cursor = new Date(startDate);
  while (cursor <= today) {
    const week: Array<{ date: string; count: number } | null> = [];
    for (let d = 0; d < 7; d++) {
      if (cursor > today) {
        week.push(null);
      } else {
        const ds = cursor.toISOString().slice(0, 10);
        week.push({ date: ds, count: completions[ds] || 0 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels
  const monthLabels: Array<{ label: string; col: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) return;
    const m = new Date(firstDay.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        label: new Date(firstDay.date).toLocaleDateString("fi-FI", { month: "short" }),
        col: wi,
      });
      lastMonth = m;
    }
  });

  const total = Object.values(completions).reduce((s, v) => s + v, 0);

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-max">
        {/* Month labels */}
        <div className="flex mb-1 ml-8" style={{ gap: "3px" }}>
          {weeks.map((_, wi) => {
            const label = monthLabels.find((m) => m.col === wi);
            return (
              <div
                key={wi}
                className="w-[11px] shrink-0 text-[10px] leading-none"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted)" }}
              >
                {label ? label.label : ""}
              </div>
            );
          })}
        </div>

        <div className="flex" style={{ gap: "3px" }}>
          {/* Day labels */}
          <div className="flex flex-col mr-1" style={{ gap: "3px" }}>
            {["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"].map((day, i) => (
              <div
                key={i}
                className="h-[11px] text-[9px] leading-[11px] pr-1 text-right"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted)", width: 20 }}
              >
                {i % 2 === 1 ? day : ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: "3px" }}>
              {week.map((day, di) =>
                day === null ? (
                  <div key={di} className="w-[11px] h-[11px] rounded-[2px]" />
                ) : (
                  <div
                    key={di}
                    title={`${day.date}: ${day.count} tehty`}
                    className={`w-[11px] h-[11px] rounded-[2px] cursor-default transition-transform hover:scale-125 ${LEVEL_COLORS[getLevel(day.count)]}`}
                  />
                )
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-1 mt-3 ml-8"
          style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-muted)" }}
        >
          <span>Vähemmän</span>
          {LEVEL_COLORS.map((cls, i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${cls}`} />
          ))}
          <span>Enemmän</span>
          <span className="ml-auto">{total} yhteensä</span>
        </div>
      </div>
    </div>
  );
}

function TrackerPage({ onMark }: { onMark: () => void }) {
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
    onMark();
  }, [onMark]);

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
        <span className="text-5xl select-none">✓</span>
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

function CalendarPage() {
  const [completions, setCompletions] = useState(getCompletions);

  useEffect(() => {
    const onFocus = () => setCompletions(getCompletions());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const streak = (() => {
    let s = 0;
    const cursor = new Date();
    while (true) {
      const ds = cursor.toISOString().slice(0, 10);
      if (!completions[ds]) break;
      s++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return s;
  })();

  const thisMonth = (() => {
    const prefix = new Date().toISOString().slice(0, 7);
    return Object.entries(completions)
      .filter(([k]) => k.startsWith(prefix))
      .reduce((s, [, v]) => s + v, 0);
  })();

  return (
    <div className="flex flex-col h-full px-6 py-10 max-w-4xl mx-auto w-full">
      <h1
        className="text-4xl mb-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
      >
        Aktiivisuus
      </h1>
      <p className="mb-8" style={{ color: "var(--color-muted)", fontSize: 14 }}>
        Viimeiset 365 päivää
      </p>

      {/* Stats */}
      <div className="flex gap-4 mb-10">
        {[
          { label: "Putki", value: streak, unit: "päivää" },
          { label: "Tässä kuussa", value: thisMonth, unit: "tehty" },
        ].map(({ label, value, unit }) => (
          <div
            key={label}
            className="flex-1 rounded-xl px-5 py-4"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div
              className="text-3xl mb-1"
              style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}
            >
              {value}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-muted)", fontFamily: "var(--font-sans)" }}>
              {label} · {unit}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <CalendarGrid completions={completions} />
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("tracker");
  const [completions, setCompletions] = useState(getCompletions);

  const handleMark = useCallback(() => {
    setCompletions(getCompletions());
  }, []);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--color-background)" }}
    >
      {/* Nav */}
      <nav
        className="flex items-center justify-center gap-1 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {(["tracker", "calendar"] as Page[]).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className="px-4 py-1.5 rounded-lg text-sm transition-all"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: page === p ? 500 : 400,
              background: page === p ? "var(--color-surface-raised)" : "transparent",
              color: page === p ? "var(--color-text)" : "var(--color-muted)",
              border: page === p ? "1px solid var(--color-border)" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            {p === "tracker" ? "Merkitse" : "Kalenteri"}
          </button>
        ))}
      </nav>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        {page === "tracker" ? (
          <TrackerPage onMark={handleMark} />
        ) : (
          <CalendarPage />
        )}
      </div>
    </div>
  );
}
