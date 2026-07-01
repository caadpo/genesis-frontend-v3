"use client";

import { useState } from "react";
import Image from "next/image";
import { FaCheckSquare, FaInfo } from "react-icons/fa";
import { FiX, FiSearch, FiCalendar } from "react-icons/fi";
import toast from "react-hot-toast";

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
};

type Props = {
  open: boolean;
  onClose: () => void;
  escalas: Escala[];
  codOp: string;
  loading: boolean;
  erro: string | null;
  onEscalasAtualizadas?: (escalas: Escala[]) => void;
};

export default function BuscaCopModal({
  open,
  onClose,
  escalas,
  codOp,
  loading,
  erro,
  onEscalasAtualizadas,
}: Props) {
  const [obsModal, setObsModal] = useState<{
    escalaId: number;
    confirmado: boolean;
    observacao: string;
  } | null>(null);
  const [salvando, setSalvando] = useState(false);

  // ✅ novos estados de filtro
  const [filtroHoje, setFiltroHoje] = useState(false);
  const [busca, setBusca] = useState("");

  if (!open) return null;

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}`;
  };

  const isPassada = (data: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEscala = new Date(data + "T00:00:00");
    return dataEscala < hoje;
  };

  const isHoje = (data: string) => {
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    return data === hojeStr;
  };

  // ✅ aplica os filtros
  const escalasFiltradas = escalas.filter((e) => {
    if (filtroHoje && !isHoje(e.dataInicio)) return false;

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const matchMat = e.mat_escala.toLowerCase().includes(termo);
      const matchNome = e.ng_escala.toLowerCase().includes(termo);
      if (!matchMat && !matchNome) return false;
    }

    return true;
  });

  async function handleToggleCheck(escala: Escala) {
    const novoValor = !escala.presencaConfirmada;
    try {
      const res = await fetch(`/api/escala/${escala.id}/presenca`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmado: novoValor,
          observacao: escala.presencaObservacao ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Erro ao atualizar");

      const atualizadas = escalas.map((e) =>
        e.id === escala.id
          ? {
              ...e,
              presencaConfirmada: data.presencaConfirmada,
              presencaConfirmadaEm: data.presencaConfirmadaEm,
              presencaConfirmadaPorNome: data.presencaConfirmadaPorNome,
              presencaObservacao: data.presencaObservacao,
            }
          : e,
      );
      onEscalasAtualizadas?.(atualizadas);
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
      const res = await fetch(`/api/escala/${obsModal.escalaId}/presenca`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmado: obsModal.confirmado,
          observacao: obsModal.observacao,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Erro ao salvar");

      const atualizadas = escalas.map((e) =>
        e.id === obsModal.escalaId
          ? {
              ...e,
              presencaConfirmada: data.presencaConfirmada,
              presencaObservacao: data.presencaObservacao,
              presencaConfirmadaEm: data.presencaConfirmadaEm,
              presencaConfirmadaPorNome: data.presencaConfirmadaPorNome,
            }
          : e,
      );
      onEscalasAtualizadas?.(atualizadas);
      toast.success("Observação salva ✅");
      setObsModal(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar observação");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="modalOverlay"
      onClick={onClose}
      style={{ alignItems: "flex-start", paddingTop: "20px" }}
    >
      <div
        className="modalCardCodOP"
        style={{
          width: "98%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          overflowY: "auto",
          paddingBottom: "10px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "10px 15px",
          }}
        >
          <FiX size={12} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <div style={{ padding: "0 5px 5px 5px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 5,
            }}
          >
            <Image
              src="/gov_pe.png"
              alt="Logo DPO"
              width={60}
              height={30}
              priority
            />
          </div>

          <div
            style={{
              textAlign: "center",
              lineHeight: 1.4,
              fontSize: 10,
              marginBottom: 5,
            }}
          >
            <div>SECRETARIA DE DEFESA SOCIAL</div>
            <div>QUARTEL DO COMANDO GERAL</div>
            <div>DIRETORIA DE PLANEJAMENTO OPERACIONAL</div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 5,
            }}
          >
            <div style={{ color: "#8a8a8a", fontWeight: 600, fontSize: 14 }}>
              {escalas[0]?.nomeOme}
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              {escalas[0]?.nomeEvento}
              {" | "}
              {escalas[0]?.nomeOperacao}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4d78da" }}>
              COP: {codOp}
            </div>
          </div>

          <div
            style={{
              background: "#0a4d92",
              color: "#fff",
              textAlign: "center",
              padding: "8px",
              marginTop: 10,
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            ESCALA DE SERVIÇO | {escalas[0]?.sistema}
          </div>

          {/* ✅ Filtros */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              alignItems: "center",
            }}
          >
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
              <FiCalendar size={12} />
              Hoje
            </button>

            <div style={{ position: "relative", flex: 1 }}>
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
                }}
              />
            </div>
          </div>

          {!loading && !erro && (
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #d1d5db",
                marginTop: 8,
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
                      <FaCheckSquare size={16} />
                    </th>
                    <th style={th}>CONFIRMADO</th>
                    <th style={th}>
                      <FaInfo />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {escalasFiltradas.map((e) => {
                    const passada = isPassada(e.dataInicio);
                    const podeConfirmar = isHoje(e.dataInicio); // ✅ só no dia exato

                    return (
                      <tr
                        key={e.id}
                        style={{
                          color: passada ? "#b0b0b0" : "inherit",
                          background: passada ? "#fafafa" : "transparent",
                        }}
                      >
                        <td style={td}>
                          {formatarData(e.dataInicio)},{" "}
                          {e.horaInicio.slice(0, 5)} a {e.horaFim.slice(0, 5)}
                        </td>

                        <td style={td}>
                          {e.pg_escala} {e.mat_escala} {e.ng_escala}
                        </td>

                        <td style={td}>{e.funcao}</td>
                        <td style={td}>{e.viatura?.patrimonio ?? "-"}</td>

                        <td style={td}>
                          <input
                            style={{
                              width: "14px",
                              height: "14px",
                              cursor: podeConfirmar ? "pointer" : "not-allowed",
                            }}
                            type="checkbox"
                            checked={e.presencaConfirmada ?? false}
                            disabled={!podeConfirmar}
                            title={
                              !podeConfirmar
                                ? "Só é possível confirmar no dia da escala"
                                : undefined
                            }
                            onChange={() =>
                              podeConfirmar && handleToggleCheck(e)
                            }
                          />
                        </td>

                        <td style={{ ...td, textAlign: "left", fontSize: 9 }}>
                          {e.presencaConfirmadaPorNome ? (
                            <>
                              {e.presencaConfirmadaPorNome}
                              {e.presencaConfirmadaEm && (
                                <div style={{ color: "#666", fontSize: 8 }}>
                                  {new Date(
                                    e.presencaConfirmadaEm,
                                  ).toLocaleString("pt-BR")}
                                </div>
                              )}
                              {e.presencaObservacao && (
                                <div
                                  style={{ color: "#888", fontStyle: "italic" }}
                                >
                                  {e.presencaObservacao}
                                </div>
                              )}
                            </>
                          ) : (
                            <span style={{ color: "#bbb" }}>—</span>
                          )}
                        </td>

                        <td style={{ ...td, textAlign: "center" }}>
                          <button
                            onClick={() =>
                              setObsModal({
                                escalaId: e.id,
                                confirmado: e.presencaConfirmada ?? false,
                                observacao: e.presencaObservacao ?? "",
                              })
                            }
                            disabled={!podeConfirmar}
                            style={{
                              padding: "2px 3px",
                              borderRadius: 6,
                              border: "1px solid #0bec7b",
                              backgroundColor: podeConfirmar
                                ? "#4f7a33"
                                : "#ccc",
                              color: "#ffffff",
                              cursor: podeConfirmar ? "pointer" : "not-allowed",
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
                <div style={{ padding: 20, textAlign: "center" }}>
                  Nenhuma escala encontrada.
                </div>
              )}
            </div>
          )}

          {loading && <div style={{ padding: 20 }}>Carregando...</div>}
          {erro && <div style={{ color: "red", padding: 20 }}>{erro}</div>}
        </div>
      </div>

      {/* Modal de observação */}
      {obsModal && (
        <div
          className="modalOverlay"
          style={{ zIndex: 1100 }}
          onClick={(e) => {
            e.stopPropagation();
            setObsModal(null);
          }}
        >
          <div
            className="modalCard"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>Observação</h2>

            <textarea
              value={obsModal.observacao}
              onChange={(e) =>
                setObsModal((prev) =>
                  prev ? { ...prev, observacao: e.target.value } : prev,
                )
              }
              rows={4}
              placeholder="Descreva alguma observação sobre a presença..."
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
              <button className="btnCancel" onClick={() => setObsModal(null)}>
                Cancelar
              </button>
              <button
                className="btnSave"
                onClick={handleSalvarObservacao}
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
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
