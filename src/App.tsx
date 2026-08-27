import { useState, useEffect, useCallback, useMemo } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { ActivityCalendar, type Activity } from "react-activity-calendar";
import "react-activity-calendar/tooltips.css";

type Page = "tracker" | "calendar";

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
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

const CALENDAR_THEME = {
  light: ["#1a1a1d", "#166534", "#16a34a", "#4ade80", "#86efac"],
  dark: ["#1a1a1d", "#166534", "#16a34a", "#4ade80", "#86efac"],
};

const CALENDAR_LABELS = {
  months: [
    "tammi",
    "helmi",
    "maalis",
    "huhti",
    "touko",
    "kesä",
    "heinä",
    "elo",
    "syys",
    "loka",
    "marras",
    "joulu",
  ],
  weekdays: ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"],
  totalCount: "{{count}} yhteensä",
  legend: {
    less: "Vähemmän",
    more: "Enemmän",
  },
};

function toActivityData(completions: Record<string, number>): Activity[] {
  const today = todayStr();
  const startDate = shiftDate(today, -364);
  const byDate: Record<string, Activity> = {
    [startDate]: {
      date: startDate,
      count: completions[startDate] || 0,
      level: getLevel(completions[startDate] || 0),
    },
    [today]: {
      date: today,
      count: completions[today] || 0,
      level: getLevel(completions[today] || 0),
    },
  };

  for (const [date, count] of Object.entries(completions)) {
    if (date < startDate || date > today) continue;
    byDate[date] = { date, count, level: getLevel(count) };
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
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

function CalendarPage() {
  const [completions, setCompletions] = useState(getCompletions);

  useEffect(() => {
    const onFocus = () => setCompletions(getCompletions());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const streak = (() => {
    let s = 0;
    let cursor = todayStr();
    while (completions[cursor]) {
      s++;
      cursor = shiftDate(cursor, -1);
    }
    return s;
  })();

  const activityData = useMemo(() => toActivityData(completions), [completions]);

  const thisMonth = (() => {
    const prefix = todayStr().slice(0, 7);
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
        <ActivityCalendar
          data={activityData}
          colorScheme="dark"
          theme={CALENDAR_THEME}
          labels={CALENDAR_LABELS}
          weekStart={0}
          blockSize={11}
          blockRadius={2}
          blockMargin={3}
          fontSize={12}
          showWeekdayLabels
          style={{
            color: "var(--color-muted)",
            fontFamily: "var(--font-mono)",
          }}
          tooltips={{
            activity: {
              text: ({ count, date }) => `${date}: ${count} tehty`,
            },
          }}
        />
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
