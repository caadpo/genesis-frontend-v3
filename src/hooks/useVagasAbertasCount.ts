"use client";

import { useEffect, useState } from "react";

/**
 * Quantidade de vagas em aberto destinadas à OME do usuário logado
 * (alimenta o contador do menu "Compartilhadas").
 *
 * - `enabled`: só consulta quando verdadeiro (ex.: usuário Auxiliar).
 * - Atualiza sozinho a cada `intervaloMs` (padrão: 60 s).
 */
export function useVagasAbertasCount(enabled = true, intervaloMs = 60000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    let cancelado = false;

    async function carregar() {
      try {
        const res = await fetch("/api/escala/vagas", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelado) setCount(Array.isArray(data) ? data.length : 0);
      } catch {
        // sem rede: mantém o último valor
      }
    }

    carregar();
    const id = setInterval(carregar, intervaloMs);

    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [enabled, intervaloMs]);

  return count;
}
