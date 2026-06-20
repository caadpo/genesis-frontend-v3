"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { FiLayers, FiGrid, FiX, FiSearch } from "react-icons/fi";
import { FaCheckSquare, FaInfo } from "react-icons/fa";
import toast from "react-hot-toast";

type EventoPago = {
  eventoId: number;
  nome_evento: string;
  nome_ome: string;
  sistema: string;
  nome_verba: string;
  total_policiais: number;
  valor_total_evento: number;
  createdAt: string;
};

type Pagamento = {
  id: number;
  nome_pagamento: string;
  nomeome_pagamento: string;
  cpf_pagamento: string;
  tipo_pagamento: string;
  banco_pagamento: string;
  agencia_pagamento: string;
  conta_pagamento: string;
  total_cotas: number;
  valor_cota: number;
  valor_total: number;
  pgtrue: boolean;
  comentario_pagamento: string;
};

export default function PagamentosPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useCurrentUser();

  const [eventos, setEventos] = useState<EventoPago[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  // modal
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoPago | null>(
    null,
  );
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [loadingModal, setLoadingModal] = useState(false);

  const [comentarioModal, setComentarioModal] = useState<{
    id: number;
    pgtrue: boolean;
    comentario: string;
  } | null>(null);
  const [salvandoComentario, setSalvandoComentario] = useState(false);

  const [buscaEventos, setBuscaEventos] = useState("");

  const eventosFiltrados = eventos.filter((ev) => {
    const termo = buscaEventos.toLowerCase();
    return (
      ev.nome_ome.toLowerCase().includes(termo) ||
      ev.nome_evento.toLowerCase().includes(termo)
    );
  });

  // ─── Proteção de acesso ──────────────────────────────────────────────────
  useEffect(() => {
    if (loadingUser) return;
    if (![9, 10, 5].includes(Number(user?.typeUser))) {
      router.replace("/sem-permissao");
    }
  }, [user, loadingUser]);

  // ─── Buscar eventos pagos ────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/pagamento/evento", { cache: "no-store" })
      .then((r) => r.json())
      .then(setEventos)
      .catch(() => {})
      .finally(() => setLoadingEventos(false));
  }, []);

  // ─── Buscar pagamentos do evento selecionado ─────────────────────────────
  useEffect(() => {
    if (!eventoSelecionado) return;

    async function buscarPagamentos() {
      setLoadingModal(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          ...(busca ? { busca } : {}),
        });

        const res = await fetch(
          `/api/pagamento/evento/${eventoSelecionado!.eventoId}/paginado?${params}`,
        );
        const data = await res.json();
        setPagamentos(data.data ?? []);
        setTotal(data.total ?? 0);
      } catch {
        setPagamentos([]);
      } finally {
        setLoadingModal(false);
      }
    }

    buscarPagamentos();
  }, [eventoSelecionado, page, busca]);

  function abrirEvento(ev: EventoPago) {
    setEventoSelecionado(ev);
    setPage(1);
    setBusca("");
    setBuscaInput("");
    setPagamentos([]);
    setTotal(0);
  }

  function fecharModal() {
    setEventoSelecionado(null);
    setPagamentos([]);
    setBusca("");
    setBuscaInput("");
    setPage(1);
  }

  async function handleTogglePgtrue(p: Pagamento) {
    const novo = !p.pgtrue;
    try {
      const res = await fetch(`/api/pagamento/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgtrue: novo,
          comentario_pagamento: p.comentario_pagamento ?? "",
        }),
      });
      if (!res.ok) throw new Error();
      setPagamentos((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, pgtrue: novo } : item,
        ),
      );
    } catch {
      toast.error("Erro ao atualizar pagamento");
    }
  }

  async function handleSalvarComentario() {
    if (!comentarioModal) return;
    setSalvandoComentario(true);
    try {
      const res = await fetch(`/api/pagamento/${comentarioModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgtrue: comentarioModal.pgtrue,
          comentario_pagamento: comentarioModal.comentario,
        }),
      });
      if (!res.ok) throw new Error();
      setPagamentos((prev) =>
        prev.map((item) =>
          item.id === comentarioModal.id
            ? { ...item, comentario_pagamento: comentarioModal.comentario }
            : item,
        ),
      );
      toast.success("Comentário salvo ✅");
      setComentarioModal(null);
    } catch {
      toast.error("Erro ao salvar comentário");
    } finally {
      setSalvandoComentario(false);
    }
  }

  const totalPaginas = Math.ceil(total / 50);

  const formatarCpf = (cpf: string) => {
    const s = String(cpf).replace(/\D/g, "").padStart(11, "0");
    return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  if (loadingUser) return null;
  if (![9, 10, 5].includes(Number(user?.typeUser))) return null;

  return (
    <div className="page">
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        PAGAMENTOS
      </h1>

      {/* Busca de eventos */}
      <input
        type="text"
        placeholder="Buscar por OME ou nome do evento"
        value={buscaEventos}
        onChange={(e) => setBuscaEventos(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #ccc",
          fontSize: 13,
          marginBottom: 16,
        }}
      />

      {loadingEventos && <p style={{ color: "#888" }}>Carregando...</p>}

      {!loadingEventos && eventosFiltrados.length === 0 && (
        <p style={{ color: "#888" }}>
          {buscaEventos
            ? "Nenhum evento encontrado."
            : "Nenhum pagamento encontrado."}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {eventosFiltrados.map((ev) => {
          const isPjes = ev.sistema === "PJES";
          return (
            <div
              key={ev.eventoId}
              onClick={() => abrirEvento(ev)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
                background: "#fafafa",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    color: isPjes ? "#3a60c8" : "#0db988",
                    fontSize: 20,
                  }}
                >
                  {isPjes ? <FiLayers /> : <FiGrid />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {ev.nome_ome} — {ev.nome_evento}
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    {ev.sistema} | {ev.nome_verba} | {ev.total_policiais}{" "}
                    policial(is)
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {Number(ev.valor_total_evento).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <div style={{ fontSize: 11, color: "#aaa" }}>
                  {new Date(ev.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Modal do evento ────────────────────────────────────────────── */}
      {eventoSelecionado && (
        <div
          className="modalOverlay"
          style={{ zIndex: 1000 }}
          onClick={fecharModal}
        >
          <div
            className="modalCard"
            style={{
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 15 }}>
                  {eventoSelecionado.nome_evento}
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                  {eventoSelecionado.nome_ome} | {eventoSelecionado.sistema} |{" "}
                  {eventoSelecionado.total_policiais} policial(is) —{" "}
                  {Number(eventoSelecionado.valor_total_evento).toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" },
                  )}
                </p>
              </div>
              <FiX
                size={20}
                style={{ cursor: "pointer" }}
                onClick={fecharModal}
              />
            </div>

            {/* Busca */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Buscar por CPF"
                value={buscaInput}
                onChange={(e) => setBuscaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setBusca(buscaInput);
                    setPage(1);
                  }
                }}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  fontSize: 13,
                }}
              />
              <button
                onClick={() => {
                  setBusca(buscaInput);
                  setPage(1);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  background: "#1e88e5",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <FiSearch />
              </button>
              {busca && (
                <button
                  onClick={() => {
                    setBusca("");
                    setBuscaInput("");
                    setPage(1);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: "#eee",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Tabela */}
            {loadingModal ? (
              <p style={{ color: "#888", fontSize: 13 }}>Carregando...</p>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#0a756c",
                          color: "#fff",
                        }}
                      >
                        <th style={th}>NOME</th>
                        <th style={th}>OME</th>
                        <th style={th}>CPF</th>
                        <th style={th}>TIPO</th>
                        <th style={th}>BANCO</th>
                        <th style={th}>AGÊNCIA</th>
                        <th style={th}>CONTA</th>
                        <th style={th}>COTAS</th>
                        <th style={th}>VALOR</th>
                        <th style={th}>
                          <FaCheckSquare size={16}></FaCheckSquare>
                        </th>
                        <th style={th}>NOTIFICAR O POLICIAL</th>
                        <th style={th}>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentos.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            style={{
                              textAlign: "center",
                              padding: 16,
                              color: "#999",
                            }}
                          >
                            Nenhum registro encontrado
                          </td>
                        </tr>
                      )}
                      {pagamentos.map((p, i) => (
                        <tr
                          key={p.id}
                          style={{
                            background: i % 2 === 0 ? "#fff" : "#f9f9f9",
                          }}
                        >
                          <td style={{ ...td, textAlign: "left" }}>
                            {p.nome_pagamento}
                          </td>
                          <td style={td}>{p.nomeome_pagamento}</td>
                          <td style={td}>{formatarCpf(p.cpf_pagamento)}</td>
                          <td style={{ ...td, textAlign: "center" }}>
                            {p.tipo_pagamento}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            {p.banco_pagamento}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            {p.agencia_pagamento}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            {p.conta_pagamento}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            {p.total_cotas}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            {Number(p.valor_total).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              style={{
                                width: "16px",
                                height: "16px",
                                cursor: "pointer",
                              }}
                              type="checkbox"
                              checked={p.pgtrue}
                              onChange={() => handleTogglePgtrue(p)}
                            />
                          </td>
                          <td
                            style={{
                              ...td,
                              textAlign: "left",
                              color: p.comentario_pagamento ? "#333" : "#bbb",
                              fontStyle: p.comentario_pagamento
                                ? "normal"
                                : "italic",
                            }}
                          >
                            {p.comentario_pagamento || "—"}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            <button
                              onClick={() =>
                                setComentarioModal({
                                  id: p.id,
                                  pgtrue: p.pgtrue,
                                  comentario: p.comentario_pagamento ?? "",
                                })
                              }
                              style={{
                                padding: "4px 6px",
                                borderRadius: 6,
                                border: "1px solid #0bec7b",
                                backgroundColor: "#4f7a33",
                                color: "#ffffff",
                                cursor: "pointer",
                              }}
                            >
                              <FaInfo />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        cursor: page === 1 ? "not-allowed" : "pointer",
                        opacity: page === 1 ? 0.4 : 1,
                      }}
                    >
                      ‹
                    </button>
                    <span style={{ fontSize: 13, alignSelf: "center" }}>
                      {page} / {totalPaginas}
                    </span>
                    <button
                      disabled={page === totalPaginas}
                      onClick={() => setPage((p) => p + 1)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        cursor:
                          page === totalPaginas ? "not-allowed" : "pointer",
                        opacity: page === totalPaginas ? 0.4 : 1,
                      }}
                    >
                      ›
                    </button>
                  </div>
                )}

                <p
                  style={{
                    fontSize: 11,
                    color: "#aaa",
                    marginTop: 8,
                    textAlign: "right",
                  }}
                >
                  Total: {total} registro(s)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {comentarioModal && (
        <div
          className="modalOverlay"
          style={{ zIndex: 1100 }} // 👈 no overlay, não no modalCard
          onClick={() => setComentarioModal(null)}
        >
          <div
            className="modalCard"
            style={{ maxWidth: 420 }} // sem zIndex aqui
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>Comentário</h2>

            <textarea
              value={comentarioModal.comentario}
              onChange={(e) =>
                setComentarioModal((prev) =>
                  prev ? { ...prev, comentario: e.target.value } : prev,
                )
              }
              rows={4}
              placeholder="Descreva o que aconteceu com este pagamento..."
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                fontSize: 13,
                resize: "vertical",
              }}
            />

            <div className="modalActions" style={{ marginTop: 12 }}>
              <button
                className="btnCancel"
                onClick={() => setComentarioModal(null)}
              >
                Cancelar
              </button>
              <button
                className="btnSave"
                onClick={handleSalvarComentario}
                disabled={salvandoComentario}
              >
                {salvandoComentario ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "6px 8px",
  textAlign: "center",
  fontWeight: 600,
  fontSize: 11,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "5px 8px",
  borderBottom: "1px solid #f0f0f0",
  textAlign: "center",
};
