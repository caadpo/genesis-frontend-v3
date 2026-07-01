"use client";

import { useState } from "react";
import Image from "next/image";
import { FaInfo, FaUser } from "react-icons/fa";
import { FiX, FiSearch, FiCalendar } from "react-icons/fi";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Escala = {
  id: number;
  sistema: string;
  pg_escala: string;
  mat_escala: string;
  ng_escala: string;
  nomecompleto_escala: string;
  tipo_escala: string;
  dataInicio: string;
  horaInicio: string;
  horaFim: string;
  cota_escala: number;
  localApresentacao: string;
  funcao: string;
  situacao: string;
  anotacoes?: string;
  nomeOperacao?: string;
  cod_op?: string;
  nomeEvento?: string;
  nomeOme?: string;
  viatura?: { patrimonio: string } | null;
  presencaConfirmada?: boolean;
  presencaObservacao?: string | null;
  presencaConfirmadaEm?: string | null;
  presencaConfirmadaPorNome?: string | null;
  observacaoEscritaPorNome?: string | null;
  observacaoEscritaEm?: string | null;
};

type ObsModalState = {
  escala: Escala;
  observacao: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatarData = (data: string) => {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
};

const isPassada = (data: string) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(data + "T00:00:00") < hoje;
};

const isHoje = (data: string) => {
  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  return data === hojeStr;
};

const isAposHoraFim = (dataInicio: string, horaFim: string): boolean => {
  if (!isHoje(dataInicio)) return false;
  const agora = new Date();
  const [h, m] = horaFim.split(":").map(Number);
  const fim = new Date();
  fim.setHours(h, m, 0, 0);
  return agora > fim;
};

/**
 * Retorna se os campos de edição (presença + observação) estão bloqueados.
 * Bloqueado = data passada OU (hoje mas horaFim já passou).
 */
const isEdicaoBloqueada = (dataInicio: string, horaFim: string): boolean => {
  return isPassada(dataInicio) || isAposHoraFim(dataInicio, horaFim);
};

/**
 * Cor do FaInfo — sempre clicável (nunca desabilitado) exceto para datas futuras.
 *
 * 🔵 Azul        → confirmado, sem observação
 * 🟠 Laranja     → confirmado + tem observação
 * 🔴 Vermelho    → não confirmado + tem observação
 * 🟢 Verde       → hoje/passada, sem nada ainda (só leitura ou editável)
 * ⚫ Cinza       → data futura (desabilitado — ainda não chegou o dia)
 *
 * Tons claros quando a data já passou (passada ou horaFim passou hoje).
 */
function corBotaoInfo(e: Escala): {
  bg: string;
  border: string;
  cursor: string;
  disabled: boolean;
  title: string;
} {
  const passada = isPassada(e.dataInicio);
  const hoje = isHoje(e.dataInicio);
  const fimPassou = isAposHoraFim(e.dataInicio, e.horaFim);
  const temObs = !!e.presencaObservacao?.trim();
  const confirmado = !!e.presencaConfirmada;

  // Data futura → único caso realmente desabilitado
  if (!hoje && !passada) {
    return {
      bg: "#ccc",
      border: "#ccc",
      cursor: "not-allowed",
      disabled: true,
      title: "Disponível apenas no dia da escala",
    };
  }

  // A partir daqui sempre clicável (hoje com horaFim passada ou dias anteriores = só leitura na modal)
  const dim = passada || fimPassou; // usa tons claros

  if (confirmado && temObs) {
    return {
      bg: dim ? "#f5c892" : "#f97316",
      border: dim ? "#f5c892" : "#f97316",
      cursor: "pointer",
      disabled: false,
      title: dim
        ? "Ver presença confirmada com observação"
        : "Confirmado com observação",
    };
  }

  if (confirmado && !temObs) {
    return {
      bg: dim ? "#93c5fd" : "#2563eb",
      border: dim ? "#93c5fd" : "#2563eb",
      cursor: "pointer",
      disabled: false,
      title: dim ? "Ver presença confirmada" : "Presença confirmada",
    };
  }

  if (!confirmado && temObs) {
    return {
      bg: dim ? "#fca5a5" : "#dc2626",
      border: dim ? "#fca5a5" : "#dc2626",
      cursor: "pointer",
      disabled: false,
      title: dim
        ? "Ver observação registrada (sem confirmação)"
        : "Observação registrada sem confirmação",
    };
  }

  // Neutro — sem obs, sem confirmação
  return {
    bg: dim ? "#a3bfa3" : "#4f7a33",
    border: dim ? "#a3bfa3" : "#4f7a33",
    cursor: "pointer",
    disabled: false,
    title: dim ? "Ver detalhes" : "Registrar presença / observação",
  };
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function OperacoesPage() {
  const [codOp, setCodOp] = useState("");
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const [filtroHoje, setFiltroHoje] = useState(false);
  const [busca, setBusca] = useState("");

  const [obsModal, setObsModal] = useState<ObsModalState | null>(null);
  const [salvando, setSalvando] = useState(false);

  const escalasFiltradas = escalas.filter((e) => {
    if (filtroHoje && !isHoje(e.dataInicio)) return false;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      if (
        !e.mat_escala.toLowerCase().includes(termo) &&
        !e.ng_escala.toLowerCase().includes(termo)
      )
        return false;
    }
    return true;
  });

  async function buscarPorCodOp() {
    const cod = codOp.trim();
    if (!cod) return;
    setLoading(true);
    setErro(null);
    setEscalas([]);
    setBuscaRealizada(true);
    setBusca("");
    setFiltroHoje(false);
    try {
      const res = await fetch(`/api/escala/cod-op/${cod}`);
      const data = await res.json();
      if (!res.ok) {
        setErro(data?.message ?? "Erro ao buscar escalas");
        return;
      }
      setEscalas(data);
    } catch {
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function limparBusca() {
    setCodOp("");
    setEscalas([]);
    setErro(null);
    setBuscaRealizada(false);
    setBusca("");
    setFiltroHoje(false);
  }

  function abrirModal(escala: Escala) {
    setObsModal({ escala, observacao: escala.presencaObservacao ?? "" });
  }

  function aplicarAtualizacao(atualizada: Escala) {
    setEscalas((prev) =>
      prev.map((e) => (e.id === atualizada.id ? atualizada : e)),
    );
    setObsModal((prev) =>
      prev
        ? {
            ...prev,
            escala: atualizada,
            observacao: atualizada.presencaObservacao ?? "",
          }
        : prev,
    );
  }

  async function handleToggleCheck() {
    if (!obsModal) return;
    const escala = obsModal.escala;
    const novoValor = !escala.presencaConfirmada;
    try {
      const res = await fetch(`/api/escala/${escala.id}/presenca`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmado: novoValor,
          observacao: obsModal.observacao,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Erro ao atualizar");
      aplicarAtualizacao({
        ...escala,
        presencaConfirmada: data.presencaConfirmada,
        presencaConfirmadaEm: data.presencaConfirmadaEm,
        presencaConfirmadaPorNome: data.presencaConfirmadaPorNome,
        presencaObservacao: data.presencaObservacao,
        observacaoEscritaPorNome: data.observacaoEscritaPorNome,
        observacaoEscritaEm: data.observacaoEscritaEm,
      });
      toast.success(
        novoValor ? "Presença confirmada ✅" : "Presença desmarcada",
      );
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar presença");
    }
  }

  async function handleSalvarObservacao() {
    if (!obsModal) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/escala/${obsModal.escala.id}/presenca`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmado: obsModal.escala.presencaConfirmada ?? false,
          observacao: obsModal.observacao,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Erro ao salvar");
      aplicarAtualizacao({
        ...obsModal.escala,
        presencaConfirmada: data.presencaConfirmada,
        presencaObservacao: data.presencaObservacao,
        presencaConfirmadaEm: data.presencaConfirmadaEm,
        presencaConfirmadaPorNome: data.presencaConfirmadaPorNome,
        observacaoEscritaPorNome: data.observacaoEscritaPorNome,
        observacaoEscritaEm: data.observacaoEscritaEm,
      });
      toast.success("Observação salva ✅");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar observação");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="container" style={{ paddingBottom: 10 }}>
      {/* ── Campo de busca ───────────────────────────────────────────────── */}
      <div className="div-itens-sistema">
        <div className="titulo" style={{ marginBottom: 12 }}>
          <span>OPERAÇÕES</span>
        </div>
        <div className="divInputBuscarUsuarioEIcones">
          <input
            className="inputBuscarUsuario"
            type="text"
            placeholder="Digite o COP da Operação"
            value={codOp}
            onChange={(e) => setCodOp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") buscarPorCodOp();
            }}
          />
          {buscaRealizada && (
            <FiX
              size={20}
              color="#e53e3e"
              style={{ cursor: "pointer", marginRight: 4 }}
              onClick={limparBusca}
              title="Limpar busca"
            />
          )}
          <FiSearch
            size={25}
            color="green"
            style={{ cursor: "pointer" }}
            onClick={buscarPorCodOp}
          />
        </div>
      </div>

      {loading && (
        <p style={{ color: "#888", fontSize: 14, padding: "12px 0" }}>
          Carregando...
        </p>
      )}
      {erro && (
        <p style={{ color: "#e53e3e", fontSize: 14, padding: "12px 0" }}>
          {erro}
        </p>
      )}

      {/* ── Resultado ────────────────────────────────────────────────────── */}
      {!loading && !erro && escalas.length > 0 && (
        <div className="divOperacaoPrincipal">
          <div className="divOperacaoOme">
            <div style={{ color: "#8a8a8a", fontWeight: 600, fontSize: 18 }}>
              {escalas[0]?.nomeOme}
            </div>
          </div>
          <div className="divOperacaoNomeEvento">
            <div style={{ fontSize: 15, fontWeight: 600, color: "#2b2b2b" }}>
              {escalas[0]?.nomeEvento} | {escalas[0]?.nomeOperacao}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#4d78da" }}>
              COP: {codOp}
            </div>
          </div>
          <div className="divOperacaoTituloEscala">
            ESCALA DE SERVIÇO | {escalas[0]?.sistema}
          </div>

          {/* Filtros */}
          <div className="divOperacaoHoje">
            <button
              onClick={() => setFiltroHoje((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid #4d78da",
                background: filtroHoje ? "#4d78da" : "transparent",
                color: filtroHoje ? "#fff" : "#4d78da",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <FiCalendar size={12} /> Hoje
            </button>
            <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
              <FiSearch
                size={12}
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999",
                }}
              />
              <input
                type="text"
                placeholder="Buscar por matrícula ou nome de guerra"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                  width: "100%",
                  padding: "5px 8px 5px 26px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  fontSize: 11,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Tabela */}
          <div
            style={{
              overflowX: "auto",
              marginTop: 8,
              height: "100%",
              overflow: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#4f8ed3", color: "#fff" }}>
                  <th style={th}>DATA/HORA</th>
                  <th style={th}>POLICIAL</th>
                  <th style={th}>FUNÇÃO</th>
                  <th style={th}>VTR</th>
                  <th style={th}>
                    <FaInfo />
                  </th>
                </tr>
              </thead>
              <tbody>
                {escalasFiltradas.map((e) => {
                  const passada = isPassada(e.dataInicio);
                  const { bg, border, cursor, disabled, title } =
                    corBotaoInfo(e);
                  return (
                    <tr
                      key={e.id}
                      style={{
                        color: passada ? "#b0b0b0" : "inherit",
                        background: passada ? "#fafafa" : "transparent",
                      }}
                    >
                      <td style={td}>
                        {formatarData(e.dataInicio)}, {e.horaInicio.slice(0, 5)}{" "}
                        a {e.horaFim.slice(0, 5)}
                      </td>
                      <td style={td}>
                        {e.pg_escala} {e.mat_escala} {e.ng_escala}
                      </td>
                      <td style={td}>{e.funcao}</td>
                      <td style={td}>{e.viatura?.patrimonio ?? "-"}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <button
                          onClick={() => !disabled && abrirModal(e)}
                          disabled={disabled}
                          title={title}
                          style={{
                            padding: "2px 5px",
                            borderRadius: 6,
                            border: `1px solid ${border}`,
                            backgroundColor: bg,
                            color: "#ffffff",
                            cursor,
                          }}
                        >
                          <FaInfo />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {escalasFiltradas.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  fontSize: 13,
                  color: "#888",
                }}
              >
                Nenhuma escala encontrada.
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !erro && buscaRealizada && escalas.length === 0 && (
        <p style={{ color: "#888", fontSize: 14, padding: "12px 0" }}>
          Nenhuma escala encontrada para o COP <strong>{codOp}</strong>.
        </p>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {obsModal &&
        (() => {
          const bloqueado = isEdicaoBloqueada(
            obsModal.escala.dataInicio,
            obsModal.escala.horaFim,
          );
          const fimPassou = isAposHoraFim(
            obsModal.escala.dataInicio,
            obsModal.escala.horaFim,
          );
          const passada = isPassada(obsModal.escala.dataInicio);

          return (
            <div
              className="modalOverlay"
              style={{ zIndex: 1100 }}
              onClick={() => setObsModal(null)}
            >
              <div
                className="modalCard"
                style={{ maxWidth: 420, width: "94%", gap: "1px" }}
                onClick={(ev) => ev.stopPropagation()}
              >
                {/* Título */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <h2 style={{ fontSize: 15, margin: 0 }}>
                    {bloqueado ? "Detalhes da Escala" : "Presença / Observação"}
                  </h2>
                  <FiX
                    size={16}
                    style={{ cursor: "pointer" }}
                    onClick={() => setObsModal(null)}
                  />
                </div>

                {/* Info do policial */}
                <div
                  style={{
                    background: "#f4f6fb",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    paddingTop: "5px",
                    paddingLeft: "25px",
                    marginBottom: "10px",
                    fontSize: 13,
                    lineHeight: 1.2,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <FaUser
                      size={30}
                      color="gray"
                      style={{
                        borderRadius: "50%",
                        border: "solid 1px #b8b3b3",
                        width: "50px",
                        height: "50px",
                        padding: "3px",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: "8px 10px",
                    }}
                  >
                    <div>
                      <strong>
                        {obsModal.escala.pg_escala} {obsModal.escala.mat_escala}{" "}
                        {obsModal.escala.ng_escala}
                      </strong>
                    </div>
                    <div style={{ color: "#555" }}>
                      {formatarData(obsModal.escala.dataInicio)} &nbsp;|&nbsp;
                      {obsModal.escala.horaInicio.slice(0, 5)} às{" "}
                      {obsModal.escala.horaFim.slice(0, 5)}
                    </div>
                    <div style={{ color: "#555" }}>
                      {obsModal.escala.funcao}
                    </div>
                  </div>
                </div>

                {/* Aviso somente leitura */}
                {bloqueado && (
                  <div
                    style={{
                      background: "#fff3cd",
                      border: "1px solid #ffc107",
                      borderRadius: 6,
                      padding: "6px 10px",
                      marginBottom: 12,
                      fontSize: 11,
                      color: "#856404",
                    }}
                  >
                    {fimPassou && !passada
                      ? "⏰ O horário de término desta escala já passou. Somente leitura."
                      : "📅 Esta escala é de uma data anterior. Somente leitura."}
                  </div>
                )}

                <div>
                  <div
                    style={{
                      display: "flex",
                      height: "40px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "75%",
                        padding: "8px 10px",
                        borderRadius: 6,

                        opacity: bloqueado ? 0.7 : 1,
                      }}
                    >
                      <div
                        style={{
                          alignItems: "center",
                          padding: "8px 10px",
                          borderRadius: 6,
                          width: "100%",
                          border: "1px solid #d1d5db",
                        }}
                      >
                        {" "}
                        <input
                          type="checkbox"
                          id="chk-presenca"
                          checked={obsModal.escala.presencaConfirmada ?? false}
                          onChange={bloqueado ? undefined : handleToggleCheck}
                          disabled={bloqueado}
                          style={{
                            width: 16,
                            height: 16,
                            marginRight: "4px",
                            cursor: bloqueado ? "default" : "pointer",
                          }}
                        />
                        <label
                          htmlFor="chk-presenca"
                          style={{
                            fontSize: 18,
                            cursor: bloqueado ? "default" : "pointer",
                            userSelect: "none",
                          }}
                        >
                          {obsModal.escala.presencaConfirmada
                            ? "Presença confirmada ✅"
                            : "Presença não confirmada"}
                        </label>
                      </div>
                    </div>

                    {obsModal.escala.presencaConfirmadaPorNome && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#555",
                          marginBottom: 10,
                          width: "25%",
                          paddingLeft: 4,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <FaUser
                            size={30}
                            color="gray"
                            style={{
                              borderRadius: "50%",
                              border: "solid 1px #b8b3b3",
                              width: "34px",
                              height: "34px",
                              padding: "3px",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            fontSize: 9,
                            color: "#777",
                            marginTop: 4,
                            display: "flex",
                            paddingLeft: 2,
                            textAlign: "center",
                            fontStyle: "italic",
                          }}
                        >
                          <strong>
                            {obsModal.escala.presencaConfirmadaPorNome}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: "#777",
                      paddingLeft: "10px",
                      textAlign: "left",
                      fontStyle: "italic",
                    }}
                  >
                    {obsModal.escala.presencaConfirmadaEm && (
                      <>
                        {new Date(
                          obsModal.escala.presencaConfirmadaEm,
                        ).toLocaleString("pt-BR")}
                      </>
                    )}
                  </div>
                </div>

                <hr
                  style={{
                    marginTop: "20px",
                    marginBottom: "20px",
                    border: "solid 1px #d3d6da",
                  }}
                ></hr>

                <div
                  style={{
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: "25%",
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "10px",
                    }}
                  >
                    {obsModal.escala.observacaoEscritaPorNome && (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <FaUser
                            size={30}
                            color="gray"
                            style={{
                              borderRadius: "50%",
                              border: "solid 1px #b8b3b3",
                              width: "34px",
                              height: "34px",
                              padding: "3px",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            fontSize: 9,
                            color: "#777",
                            marginTop: 4,
                            marginRight: 4,
                            display: "flex",
                            paddingLeft: 2,
                            textAlign: "center",
                            fontStyle: "italic",
                          }}
                        >
                          <strong>
                            {obsModal.escala.observacaoEscritaPorNome}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      width: "75%",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#888282" }}>
                      Anotação
                    </span>
                    <textarea
                      value={obsModal.observacao}
                      onChange={(ev) =>
                        !bloqueado &&
                        setObsModal((prev) =>
                          prev
                            ? { ...prev, observacao: ev.target.value }
                            : prev,
                        )
                      }
                      readOnly={bloqueado}
                      rows={4}
                      placeholder={
                        bloqueado
                          ? obsModal.escala.presencaObservacao
                            ? ""
                            : "Nenhuma observação registrada."
                          : "Descreva alguma observação sobre a presença..."
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        fontSize: 10,
                        resize: bloqueado ? "none" : "vertical",
                        boxSizing: "border-box",
                        background: bloqueado ? "#f5f5f5" : "#fff",
                        color: bloqueado ? "#555" : "inherit",
                        cursor: bloqueado ? "default" : "text",
                      }}
                    />
                  </div>
                </div>

                {/* Quem escreveu a observação */}
                {obsModal.escala.observacaoEscritaPorNome && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "#777",
                      paddingLeft: 2,
                      textAlign: "right",
                      fontStyle: "italic",
                    }}
                  >
                    {obsModal.escala.observacaoEscritaEm && (
                      <>
                        {new Date(
                          obsModal.escala.observacaoEscritaEm,
                        ).toLocaleString("pt-BR")}
                      </>
                    )}
                  </div>
                )}

                <div className="modalActions" style={{ marginTop: 12 }}>
                  <button
                    className="btnCancel"
                    onClick={() => setObsModal(null)}
                  >
                    Fechar
                  </button>
                  {!bloqueado && (
                    <button
                      className="btnSave"
                      onClick={handleSalvarObservacao}
                      disabled={salvando}
                    >
                      {salvando ? "Salvando..." : "Salvar observação"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "4px 6px",
  border: "1px solid #d1d5db",
  fontSize: 10,
  textAlign: "center",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: "1px 2px",
  border: "1px solid #d1d5db",
  fontSize: 10,
  textAlign: "center",
  lineHeight: 1.1,
};
