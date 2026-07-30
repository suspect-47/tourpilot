"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AutopilotButton({
  endpoint,
  label,
  runningLabel,
}: {
  endpoint: string;
  label: string;
  runningLabel: string;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      await fetch(endpoint, { method: "POST" });
      router.refresh();
    } finally {
      setRunning(false);
    }
  };

  return (
    <button
      onClick={run}
      disabled={running}
      className="group inline-flex items-center gap-2 rounded-control bg-sunset px-4 py-2 text-sm font-semibold text-paper shadow-[0_6px_18px_-10px_rgba(246,134,74,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:bg-sunset-strong active:translate-y-px disabled:opacity-60"
    >
      {running && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-paper/30 border-t-paper"
        />
      )}
      {running ? runningLabel : label}
    </button>
  );
}
