"use client";

import { useState } from "react";

export function UpgradeButton({ tier }: { tier: "starter" | "pro" }) {
  const [loading, setLoading] = useState(false);

  const upgrade = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  };

  return (
    <button
      onClick={upgrade}
      disabled={loading}
      className="rounded-control bg-sunset px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-sunset-strong disabled:opacity-60"
    >
      {loading ? "Redirecting…" : `Upgrade to ${tier}`}
    </button>
  );
}
