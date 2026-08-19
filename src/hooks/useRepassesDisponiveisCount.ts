// src/hooks/useRepassesDisponiveisCount.ts
"use client";

import { useEffect, useState, useCallback } from "react";

export function useRepassesDisponiveisCount(intervalMs = 3000) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/repasse/disponiveis/count", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setCount(typeof data.count === "number" ? data.count : 0);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, intervalMs);

    function onFocus() {
      fetchCount();
    }
    window.addEventListener("focus", onFocus);
    window.addEventListener("repassesAtualizados", fetchCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("repassesAtualizados", fetchCount);
    };
  }, [fetchCount, intervalMs]);

  return count;
}
