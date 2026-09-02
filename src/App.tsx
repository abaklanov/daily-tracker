import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDaysIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import LanguageSelector from "./LanguageSelector";
import Tracker from "./pages/Tracker";
import Calendar from "./pages/Calendar";

type Page = "tracker" | "calendar";

const NAV_ICONS = {
  tracker: CheckCircleIcon,
  calendar: CalendarDaysIcon,
} as const;

export default function App() {
  const { t } = useTranslation();
  const [page, setPage] = useState<Page>("tracker");

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--color-background)" }}
    >
      <nav
        className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div />
        <div className="flex items-center justify-center gap-1">
          {(["tracker", "calendar"] as Page[]).map((p) => {
            const Icon = NAV_ICONS[p];
            const label = t(`nav.${p}`);
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-label={label}
                className={`px-3 py-1.5 sm:px-4 rounded-lg text-sm transition-all ${
                  page === p ? "font-medium" : "font-normal"
                }`}
                style={{
                  fontFamily: "var(--font-sans)",
                  background: page === p ? "var(--color-surface-raised)" : "transparent",
                  color: page === p ? "var(--color-text)" : "var(--color-muted)",
                  border: page === p ? "1px solid var(--color-border)" : "1px solid transparent",
                  cursor: "pointer",
                }}
              >
                <Icon className="size-5 sm:hidden" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        <LanguageSelector />
      </nav>

      <div className="flex-1 overflow-auto">
        {page === "tracker" ? <Tracker /> : <Calendar />}
      </div>
    </div>
  );
}
