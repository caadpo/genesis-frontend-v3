"use client";
import { useEffect, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type OmeResumo = {
  omeId: number;
  nomeOme: string;
  soma_of: number;
  soma_prc: number;
  cotas_of: number;
  cotas_prc: number;
};

type Distribuicao = {
  id: number;
  nome_dist: string;
  qtd_dist_of: number;
  qtd_dist_prc: number;
  totalCotasOficiais: number;
  totalCotasPracas: number;
  diretoria: { nomeDiretoria: string };
};

// ─── Cores ────────────────────────────────────────────────────────────────────
// Altere aqui para mudar as cores do gráfico
const COR_PREVISTO = "#e6e6e6"; // cinza claro — barra de fundo (previsão)
const COR_CONSUMIDO = "#5DCAA5"; // verde claro — barra de consumo
const COR_LABEL = "#ffffff"; // cor do texto "Oficiais" / "Praças"

// ─── Duração das animações (ms) ───────────────────────────────────────────────
// Altere aqui para deixar as animações mais rápidas ou lentas
const DURACAO_BARRA = 800; // quanto tempo a barra leva para crescer
const DURACAO_FADE_GRUPO = 400; // fade + slide de cada grupo ao entrar
const DURACAO_FADE_NIVEL = 250; // fade entre nível distribuição ↔ OME
const DELAY_ENTRE_GRUPOS = 60; // atraso escalonado entre grupos (ms por item)
const DELAY_ENTRE_BARRAS = 80; // atraso escalonado entre Oficiais e Praças

// ─── Componente: barra individual ─────────────────────────────────────────────
function Barra({
  label,
  prev,
  cons,
  maxPrev, // ✅ maior valor do grupo — define 100% da largura visual
  delay = 0,
}: {
  label: string;
  prev: number;
  cons: number;
  maxPrev: number;
  delay?: number;
}) {
  const [animado, setAnimado] = useState(false);

  useEffect(() => {
    setAnimado(false);
    const t = setTimeout(() => setAnimado(true), delay);
    return () => clearTimeout(t);
  }, [prev, cons, delay]);

  // Percentual de consumo dentro do previsto
  const pctConsumo =
    prev > 0 ? Math.min(100, Math.round((cons / prev) * 100)) : 0;

  // Largura proporcional da trilha em relação ao maior valor do conjunto
  // Altere MIN_LARGURA_PCT para definir a largura mínima (evita barras invisíveis)
  const MIN_LARGURA_PCT = 8;
  const larguraTrilha =
    maxPrev > 0
      ? Math.max(MIN_LARGURA_PCT, Math.round((prev / maxPrev) * 100))
      : 100;

  return (
    <div style={{ marginBottom: 8, paddingLeft: 10, paddingRight: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Label ao lado esquerdo da barra */}
        <span
          style={{
            fontSize: 11,
            color: COR_LABEL,
            minWidth: 52,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          {label}
        </span>

        {/* Container da trilha — ocupa sempre 100% mas a trilha tem largura proporcional */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div
            style={{
              position: "relative",
              height: 16,
              // ✅ largura proporcional ao maxPrev
              width: `${larguraTrilha}%`,
              background: COR_PREVISTO,
              borderRadius: 4,
              overflow: "hidden",
              transition: `width ${DURACAO_BARRA}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          >
            {/* Shimmer enquanto ainda não animou */}
            {!animado && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: "100%",
                  background: `linear-gradient(90deg, ${COR_PREVISTO} 25%, #c4c2b8 50%, ${COR_PREVISTO} 75%)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1s infinite",
                }}
              />
            )}

            {/* Barra de consumo — percentual dentro da trilha */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: animado ? `${pctConsumo}%` : "0%",
                background: COR_CONSUMIDO,
                borderRadius: 4,
                transition: `width ${DURACAO_BARRA}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
              }}
            />
          </div>
        </div>

        {/* Valor à direita */}
        <span
          style={{
            fontSize: 11,
            color: COR_LABEL,
            minWidth: 60,
            opacity: animado ? 1 : 0,
            transition: `opacity 0.4s ease ${delay}ms`,
            flexShrink: 0,
          }}
        >
          {cons} | {prev} ({pctConsumo}%)
        </span>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Componente: grupo de barras (uma por diretoria ou OME) ───────────────────
function GrupoBarras({
  titulo,
  itens,
  maxPrev, // ✅ recebe de fora em vez de calcular internamente
  delay = 0,
}: {
  titulo: string;
  itens: { label: string; prev: number; cons: number }[];
  maxPrev: number; // ✅ nova prop
  delay?: number;
}) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    setVisivel(false);
    const t = setTimeout(() => setVisivel(true), delay);
    return () => clearTimeout(t);
  }, [titulo, delay]);

  return (
    <div
      style={{
        marginBottom: 14,
        opacity: visivel ? 1 : 0,
        transform: visivel ? "translateY(0)" : "translateY(8px)",
        transition: `opacity ${DURACAO_FADE_GRUPO}ms ease ${delay}ms, transform ${DURACAO_FADE_GRUPO}ms ease ${delay}ms`,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#ffffff",
          marginBottom: 6,
          paddingLeft: 10,
        }}
      >
        {titulo}
      </div>

      {itens.map((item, i) => (
        <Barra
          key={item.label}
          label={item.label}
          prev={item.prev}
          cons={item.cons}
          maxPrev={maxPrev} // passa o global
          delay={delay + i * DELAY_ENTRE_BARRAS}
        />
      ))}
    </div>
  );
}

// ─── Componente principal exportado ──────────────────────────────────────────
export default function GraficoDistribuicao({
  distribuicoes,
  omesMap,
  distExpandida,
}: {
  distribuicoes: Distribuicao[];
  omesMap: Record<number, OmeResumo[]>;
  distExpandida: number | null;
}) {
  const distSel = distExpandida
    ? distribuicoes.find((d) => d.id === distExpandida)
    : null;

  const nivel = distSel ? "ome" : "dist";

  // Controla o fade entre níveis sem piscar o conteúdo antigo
  const [nivelAnterior, setNivelAnterior] = useState(nivel);
  const [transicionando, setTransicionando] = useState(false);

  useEffect(() => {
    if (nivel !== nivelAnterior) {
      setTransicionando(true);
      const t = setTimeout(() => {
        setNivelAnterior(nivel);
        setTransicionando(false);
      }, DURACAO_FADE_NIVEL);
      return () => clearTimeout(t);
    }
  }, [nivel]);

  const maxPrevGlobal =
    nivelAnterior === "dist"
      ? Math.max(
          ...distribuicoes.flatMap((d) => [d.qtd_dist_of, d.qtd_dist_prc]),
          1,
        )
      : Math.max(
          ...(omesMap[distSel?.id ?? 0] ?? []).flatMap((o) => [
            o.soma_of,
            o.soma_prc,
          ]),
          1,
        );

  return (
    <div style={{ padding: "8px 0" }}>
      {/* ── Legenda ── altere os textos e cores aqui */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 12,
          fontSize: 20,
          color: "#ffffff",
          paddingLeft: 10,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 15,
              height: 15,
              borderRadius: 2,
              background: COR_PREVISTO,
              display: "inline-block",
            }}
          />
          Previsto
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 15,
              height: 15,
              borderRadius: 2,
              background: COR_CONSUMIDO,
              display: "inline-block",
            }}
          />
          Consumido
        </span>
      </div>

      {/* ── Breadcrumb — só aparece no nível OME */}
      <div
        style={{
          fontSize: 18,
          marginBottom: 12,
          paddingLeft: 10,
          color: "#ffffff",
          minHeight: 20,
          opacity: nivel === "ome" ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      >
        {distSel && (
          <>
            DISTRIBUIÇÃO ›{" "}
            <strong
              style={{ fontWeight: 500, color: "var(--color-text-primary)" }}
            >
              {distSel.diretoria.nomeDiretoria} — {distSel.nome_dist}
            </strong>
          </>
        )}
      </div>

      {/* ── Área de conteúdo com fade na troca de nível */}
      <div
        style={{
          opacity: transicionando ? 0 : 1,
          transition: `opacity ${DURACAO_FADE_NIVEL}ms ease`,
        }}
      >
        {/* Nível: distribuições */}
        {nivelAnterior === "dist" &&
          distribuicoes.map((d, i) => (
            <GrupoBarras
              key={d.id}
              titulo={`${d.diretoria.nomeDiretoria} — ${d.nome_dist}`}
              delay={i * DELAY_ENTRE_GRUPOS}
              maxPrev={maxPrevGlobal} // ✅
              itens={[
                {
                  label: "Oficiais",
                  prev: d.qtd_dist_of,
                  cons: d.totalCotasOficiais,
                },
                {
                  label: "Praças",
                  prev: d.qtd_dist_prc,
                  cons: d.totalCotasPracas,
                },
              ]}
            />
          ))}

        {/* Nível: OMEs */}
        {nivelAnterior === "ome" &&
          distSel &&
          (omesMap[distSel.id] ?? []).map((o, i) => (
            <GrupoBarras
              key={o.omeId}
              titulo={o.nomeOme}
              delay={i * DELAY_ENTRE_GRUPOS}
              maxPrev={maxPrevGlobal} // ✅
              itens={[
                { label: "Oficiais", prev: o.soma_of, cons: o.cotas_of },
                { label: "Praças", prev: o.soma_prc, cons: o.cotas_prc },
              ]}
            />
          ))}
      </div>
    </div>
  );
}
