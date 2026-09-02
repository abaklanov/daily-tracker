import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityCalendar, type Activity } from "react-activity-calendar";
import "react-activity-calendar/tooltips.css";
import { getCompletions, getLevel, shiftDate, todayStr } from "../completions";

const CALENDAR_THEME = {
  light: ["#1a1a1d", "#166534", "#16a34a", "#4ade80", "#86efac"],
  dark: ["#1a1a1d", "#166534", "#16a34a", "#4ade80", "#86efac"],
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

export default function Calendar() {
  const { t } = useTranslation();
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

  const activityData = useMemo(
    () => toActivityData(completions),
    [completions],
  );

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
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--color-text)",
        }}
      >
        {t("calendar.title")}
      </h1>
      <p className="mb-8" style={{ color: "var(--color-muted)", fontSize: 14 }}>
        {t("calendar.subtitle")}
      </p>

      <div className="flex gap-4 mb-10">
        {[
          {
            label: t("calendar.streak"),
            value: streak,
            unit: t("calendar.days"),
          },
          {
            label: t("calendar.thisMonth"),
            value: thisMonth,
            unit: t("calendar.done"),
          },
        ].map(({ label, value, unit }) => (
          <div
            key={label}
            className="flex-1 rounded-xl px-5 py-4"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="text-3xl mb-1"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-accent)",
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {label} · {unit}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <ActivityCalendar
          data={activityData}
          colorScheme="dark"
          theme={CALENDAR_THEME}
          labels={{
            months: t("calendar.months", { returnObjects: true }) as string[],
            weekdays: t("calendar.weekdays", {
              returnObjects: true,
            }) as string[],
            totalCount: t("calendar.totalCount"),
            legend: {
              less: t("calendar.less"),
              more: t("calendar.more"),
            },
          }}
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
              text: ({ count, date }) =>
                t("calendar.activity", { count, date }),
            },
          }}
        />
      </div>
    </div>
  );
}
