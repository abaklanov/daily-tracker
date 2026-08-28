import { useState } from "react";
import Tracker from "./pages/Tracker";
import Calendar from "./pages/Calendar";

type Page = "tracker" | "calendar";

export default function App() {
  const [page, setPage] = useState<Page>("tracker");

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--color-background)" }}
    >
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

      <div className="flex-1 overflow-auto">
        {page === "tracker" ? <Tracker /> : <Calendar />}
      </div>
    </div>
  );
}
