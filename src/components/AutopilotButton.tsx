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
      className="rounded-lg bg-rust px-4 py-2 text-sm font-semibold text-paper-raised shadow-sm transition hover:bg-rust/90 disabled:opacity-60"
    >
      {running ? runningLabel : label}
    </button>
  );
}
