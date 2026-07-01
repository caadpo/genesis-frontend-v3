"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import {
  FiLayers,
  FiGrid,
  FiX,
  FiSearch,
  FiUser,
  FiCheck,
} from "react-icons/fi";
import {
  FaCheckCircle,
  FaCheckSquare,
  FaExclamationTriangle,
  FaInfo,
} from "react-icons/fa";
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

type ContaPendente = {
  id: number;
  banco: string;
  cod_banco: string;
  agencia: string;
  conta: string;
  dig_conta: string;
  updatedAt: string;
  usuarioId: number;
  usuario: {
    id: number;
    mat: string;
    omeId: number;
    ome: { id: number; nomeOme: string } | null;
  } | null;
  atualizadoPor: { id: number; mat: string } | null;
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
    const matchBusca =
      ev.nome_ome.toLowerCase().includes(termo) ||
      ev.nome_evento.toLowerCase().includes(termo);

    return matchBusca && ev.sistema === "DIARIAS"; // ← adiciona esse filtro
  });

  // ─── Contas pendentes e-Fisco ───────────────────────────────────────────
  const [contasPendentes, setContasPendentes] = useState<ContaPendente[]>([]);
  const [loadingPendentes, setLoadingPendentes] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  const isFinanceiro = [5, 9, 10].includes(Number(user?.typeUser));

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

  // ─── Buscar contas pendentes e-Fisco ────────────────────────────────────
  useEffect(() => {
    if (!isFinanceiro) return;
    setLoadingPendentes(true);
    fetch("/api/conta/pendentes-efisco", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setContasPendentes(Array.isArray(data) ? data : []))
      .catch(() => setContasPendentes([]))
      .finally(() => setLoadingPendentes(false));
  }, [isFinanceiro]);

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

  // ─── Confirmar conta no e-Fisco ──────────────────────────────────────────
  async function handleConfirmarEfisco(conta: ContaPendente) {
    setConfirmandoId(conta.id);
    try {
      const res = await fetch(`/api/conta/${conta.id}/efisco`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      // Remove da lista de pendentes
      setContasPendentes((prev) => prev.filter((c) => c.id !== conta.id));
      toast.success(
        `Conta de ${conta.usuario?.mat ?? "usuário"} confirmada no e-Fisco ✅`,
      );
    } catch {
      toast.error("Erro ao confirmar conta no e-Fisco");
    } finally {
      setConfirmandoId(null);
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

      {/* ─── SEÇÃO: CONTAS PENDENTES E-FISCO ──────────────────────────────── */}
      {isFinanceiro && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <FaExclamationTriangle color="#e6a800" size={15} />
            <h2 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
              CONTAS AGUARDANDO ATUALIZAÇÃO NO E-FISCO
            </h2>
            {contasPendentes.length > 0 && (
              <span
                style={{
                  background: "#dc3545",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {contasPendentes.length}
              </span>
            )}
          </div>

          {loadingPendentes ? (
            <div style={{ fontSize: 13, color: "#888" }}>Carregando...</div>
          ) : contasPendentes.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                background: "#d4edda",
                borderRadius: 10,
                border: "1px solid #28a745",
                fontSize: 13,
                color: "#155724",
              }}
            >
              <FaCheckCircle color="#28a745" />
              Nenhuma conta pendente de atualização no e-Fisco
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contasPendentes.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #ffc107",
                    borderLeft: "4px solid #ffc107",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 180 }}>
                    {/* Usuário */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <FiUser size={13} color="#888" />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>
                        {c.usuario?.mat ?? "—"}
                      </span>
                      <span style={{ fontSize: 11, color: "#888" }}>
                        {c.usuario?.ome?.nomeOme ?? ""}
                      </span>
                    </div>

                    {/* Dados bancários */}
                    <div style={{ fontSize: 12, color: "#444" }}>
                      <strong>{c.banco}</strong>
                      {c.cod_banco ? ` (${c.cod_banco})` : ""} &nbsp;|&nbsp; Ag:{" "}
                      <strong>{c.agencia}</strong> &nbsp;|&nbsp; Conta:{" "}
                      <strong>
                        {c.conta}-{c.dig_conta}
                      </strong>
                    </div>

                    {/* Atualizado por */}
                    {c.atualizadoPor && (
                      <div
                        style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}
                      >
                        Solicitado por: {c.atualizadoPor.mat}
                      </div>
                    )}
                  </div>

                  {/* Botão confirmar */}
                  <button
                    onClick={() => handleConfirmarEfisco(c)}
                    disabled={confirmandoId === c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: confirmandoId === c.id ? "#ccc" : "#28a745",
                      border: "none",
                      borderRadius: 8,
                      padding: "7px 14px",
                      cursor:
                        confirmandoId === c.id ? "not-allowed" : "pointer",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {confirmandoId === c.id ? (
                      "Confirmando..."
                    ) : (
                      <>
                        <FiCheck /> Confirmar e-Fisco
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h1 style={{ fontSize: 12, fontWeight: 700 }}>PAGAMENTOS</h1>
        {/* Busca de eventos */}
        <input
          type="text"
          placeholder="Buscar por OME ou nome do evento"
          value={buscaEventos}
          onChange={(e) => setBuscaEventos(e.target.value)}
          className="inputBuscaUserPg"
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
                className="divClickAbrirEvento"
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

                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {ev.nome_ome} — {ev.nome_evento}
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    {ev.sistema} | {ev.nome_verba} | {ev.total_policiais}{" "}
                    policial(is)
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
            <div className="divModalPrinciapal">
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
                className="inputBuscaCpf"
              />
              <button
                onClick={() => {
                  setBusca(buscaInput);
                  setPage(1);
                }}
                className="btnBuscaCpf"
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
                  className="btnLimpar"
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
                  <table className="tablePg">
                    <thead>
                      <tr className="trbackground">
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
                          <td colSpan={9} className="tdNome">
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
                              className="inputCheckBox"
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
                              className="tdInfo"
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
                  <div className="paginacao">
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
