"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaDownload } from "react-icons/fa";
import { FiChevronUp } from "react-icons/fi";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { apiFetch } from "@/src/lib/api";

type UsuarioResumo = {
  usuarioId: number;
  nomeCompleto: string;
  cpf: string;
  nunfunc: string;
  nunvinc: string;
  banco: string;
  cod_banco: string;
  agencia: string;
  conta: string;
  dig_conta: string;
  totalCotas: number;
};

type ResumoEvento = {
  id: number;
  nome_evento: string;
  qtd_of_evento: number;
  qtd_prc_evento: number;
  status_evento: string;

  ome: { id: number; nomeOme: string; efisco: string };
  teto: { id: number; nome_verba: string; sistema: string };
  totalCotasOficiais: number;
  totalCotasPracas: number;

  criado_em?: string;
  criado_por?: string;
  homologado_em?: string;
  homologado_por?: string;
  pd_concluida_em?: string;
  pd_concluida_por?: string;
  pago_em?: string;
  pago_por?: string;

  usuarios: UsuarioResumo[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  eventoId: number | null;
};

// ─── Enum de Status ───────────────────────────────────────────────────────────

enum STATUS_EVENTO {
  CRIADO = "CRIADO",
  HOMOLOGADO = "HOMOLOGADO",
  PD_CONCLUIDA = "PD_CONCLUIDA",
  PAGO = "PAGO",
}

export default function ResumoEventoModal({ open, onClose, eventoId }: Props) {
  const [resumo, setResumo] = useState<ResumoEvento | null>(null);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [gerandoPagamento, setGerandoPagamento] = useState(false);
  const [progressoLinha, setProgressoLinha] = useState("0%");
  const [fasesAtivas, setFasesAtivas] = useState<string[]>([]);
  const { user } = useCurrentUser();
  const [baixandoPdf, setBaixandoPdf] = useState(false);

  useEffect(() => {
    if (!open || !eventoId) return;

    setProgressoLinha("0%");
    setFasesAtivas([]); // reseta os círculos
    setLoading(true);

    fetch(`/api/evento/${eventoId}`)
      .then((r) => r.json())
      .then((data) => {
        setResumo(data);
        setBusca("");

        const fases = ["CRIADO", "HOMOLOGADO", "PD_CONCLUIDA", "PAGO"];
        const idxAtual = fases.indexOf(data.status_evento);
        const fasesParaAtivar = fases.slice(0, idxAtual + 1);

        // linha começa a andar após 150ms
        setTimeout(() => {
          setProgressoLinha(calcEventoProgressoLinha(data.status_evento));
        }, 150);

        // cada círculo acende com delay proporcional à sua posição
        fasesParaAtivar.forEach((fase, i) => {
          setTimeout(
            () => {
              setFasesAtivas((prev) => [...prev, fase]);
            },
            150 + i * 550,
          ); // 550ms por etapa, sincronizado com a linha
        });
      })
      .finally(() => setLoading(false));
  }, [open, eventoId]);

  if (!open) return null;

  const valorCota =
    resumo?.teto?.sistema === "PJES"
      ? { oficial: 300, praca: 200 }
      : { oficial: 180, praca: 180 };

  const usuariosFiltrados =
    resumo?.usuarios.filter((u) => {
      if (!busca.trim()) return true;
      const term = busca.toLowerCase();
      return [u.nomeCompleto, u.cpf, u.nunfunc]
        .map((v) => String(v).toLowerCase())
        .some((v) => v.includes(term));
    }) ?? [];

  const formatarCPF = (cpf: string): string => {
    const s = String(cpf).replace(/\D/g, "").padStart(11, "0");
    return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  function calcEventoProgressoLinha(status: string) {
    const map: Record<string, string> = {
      CRIADO: "0%",
      HOMOLOGADO: "33.3%",
      PD_CONCLUIDA: "66.6%",
      PAGO: "100%",
    };
    return map[status] ?? "0%";
  }

  // ─── Permissões por status e tipo de usuário ─────────────────────────────────
  function getPermissoesEvento(status: string, typeUser: number | undefined) {
    const isAdmin = Number(typeUser) === 9 || Number(typeUser) === 10;
    const isAux = Number(typeUser) === 2;
    const isPd = Number(typeUser) === 6;
    const st = status?.trim();

    console.log("DEBUG getPermissoesEvento:", {
      status: `"${status}"`,
      st: `"${st}"`,
      typeUser,
      isAdmin,
      isAux,
      isPd,
      STATUS_EVENTO_CRIADO: STATUS_EVENTO.CRIADO,
      comparacao: st === STATUS_EVENTO.CRIADO,
    });

    return {
      podeHomologar: (isAdmin || isAux) && st === STATUS_EVENTO.CRIADO,
      podeDeHomologar: isAdmin && st === STATUS_EVENTO.HOMOLOGADO,
      podePD: (isAdmin || isPd) && st === STATUS_EVENTO.HOMOLOGADO,
      podePago: (isAdmin || isPd) && st === STATUS_EVENTO.PD_CONCLUIDA,
    };
  }

  function getEventoAcao(status?: string) {
    switch (status?.trim()) {
      case STATUS_EVENTO.CRIADO:
        return {
          label: "Homologar evento",
          novoStatus: STATUS_EVENTO.HOMOLOGADO,
        };
      case STATUS_EVENTO.HOMOLOGADO:
        return {
          label: "Concluir previsão de desembolso",
          novoStatus: STATUS_EVENTO.PD_CONCLUIDA,
        };
      case STATUS_EVENTO.PD_CONCLUIDA:
        return {
          label: "Marcar como pago",
          novoStatus: STATUS_EVENTO.PAGO,
        };
      default:
        return null;
    }
  }

  async function handleAlterarStatus(novoStatus: STATUS_EVENTO) {
    if (!resumo) return;

    setGerandoPagamento(true);
    try {
      const response = await apiFetch(`/api/evento/${resumo.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Erro ao alterar status",
        );
      }

      toast.success(`Evento atualizado para ${data.status_evento} ✅`);
      setResumo((prev) =>
        prev
          ? {
              ...prev,
              status_evento: data.status_evento,
            }
          : prev,
      );

      // Se mudou para PD_CONCLUIDA, gera os pagamentos
      if (novoStatus === STATUS_EVENTO.PD_CONCLUIDA) {
        try {
          const pagamentoResponse = await fetch(
            `/api/pagamento/evento/${resumo.id}`,
            { method: "POST" },
          );
          const pagamentoData = await pagamentoResponse.json();
          if (!pagamentoResponse.ok) {
            throw new Error(
              Array.isArray(pagamentoData?.message)
                ? pagamentoData.message.join(", ")
                : pagamentoData?.message || "Erro ao gerar pagamento",
            );
          }
          toast.success(
            `Previsão de desembolso gerada para ${pagamentoData.length} policial(is) ✅`,
          );
        } catch (pagamentoError: any) {
          toast.error(pagamentoError?.message || "Erro ao gerar pagamento");
        }
      }

      const refresh = await fetch(`/api/evento/${resumo.id}`);
      const updated = await refresh.json();
      setResumo(updated);
      setBusca("");
      const fases = ["CRIADO", "HOMOLOGADO", "PD_CONCLUIDA", "PAGO"];
      const idxAtual = fases.indexOf(updated.status_evento);
      const fasesParaAtivar = fases.slice(0, idxAtual + 1);
      setProgressoLinha(calcEventoProgressoLinha(updated.status_evento));
      setFasesAtivas(fasesParaAtivar);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao alterar status do evento");
    } finally {
      setGerandoPagamento(false);
    }
  }

  async function handleDownloadPdf() {
    if (!resumo) return;
    setBaixandoPdf(true);
    try {
      const response = await fetch(`/api/evento/${resumo.id}/pdf`);
      if (!response.ok) throw new Error("Erro ao gerar PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `EVENTO_${resumo.nome_evento.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar o PDF");
    } finally {
      setBaixandoPdf(false);
    }
  }

  return (
    <div className="modalOverlayEventoResumo" onClick={onClose}>
      <div
        className="modalCardEventoResumo"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="divEventoResumoCarregando">Carregando...</div>
        )}

        {!loading && resumo && (
          <>
            {/* ─── Cabeçalho ─────────────────────────────────────────────── */}
            <div>
              <div style={{ textAlign: "right" }}>
                <FiChevronUp onClick={onClose} />
              </div>
              <div className="divLogoResumoEvento">
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div>
                    <img
                      src="/logo_pmpe.jpg"
                      alt="Logo da PMPE"
                      className="logoEventoResumo"
                    />
                  </div>

                  <h4 className="tituloEventoResumo">
                    Policia Militar de Pernambuco
                  </h4>
                  <h4 className="tituloEventoResumo">
                    Quartel do Comando Geral
                  </h4>
                  <h4 className="tituloEventoResumo">
                    Diretoria de Planejamento Operacional
                  </h4>
                  <div className="divTitlePlanilha">
                    PLANILHA DE RESUMO DO EVENTO
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Busca ─────────────────────────────────────────────────── */}
            <div className="divNomeEventoInputBusca">
              <div>
                <div className="divOmeNomeEventoResumo">
                  {resumo.ome.nomeOme} | {resumo.nome_evento}
                  <br></br>
                  E-FISCO: <strong>{resumo.ome.efisco}</strong>
                </div>

                <div className="divStatusEventoResumo">
                  <strong>
                    {resumo.homologado_em && (
                      <span>
                        {resumo.status_evento}{" "}
                        {new Date(resumo.homologado_em).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </strong>
                </div>
              </div>

              <div style={{ display: "flex" }}>
                <div>
                  <input
                    type="text"
                    placeholder="Buscar por matrícula, nome, OME..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="inputBusca"
                  />
                </div>

                <div
                  className="divIconeDonwloadEventoResumo"
                  onClick={handleDownloadPdf}
                  style={{
                    cursor: baixandoPdf ? "wait" : "pointer",
                    opacity: baixandoPdf ? 0.5 : 1,
                  }}
                  title="Baixar PDF"
                >
                  <FaDownload size={25} />
                </div>
              </div>
            </div>

            {/* ─── Tabela ─────────────────────────────────────────────────── */}
            <table className="tabelaResumoEvento">
              <thead>
                <tr className="trResumoEvento">
                  <th className="hide-mobile" style={th}>
                    FOLHA DE PAGAMENTO
                  </th>
                  <th style={th}>UNIDADE</th>
                  <th style={th}>IDENTIFICAÇÃO DO POLICIAL</th>
                  <th style={th}>CPF</th>

                  <th className="hide-mobile" style={th}>
                    NUFUNC
                  </th>
                  {resumo.teto.sistema === "DIARIAS" && (
                    <th className="hide-mobile" style={th}>
                      DADOS BANCÁRIOS
                    </th>
                  )}
                  <th style={th}>TOTAL COTAS</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={9} className="tdDefaultEvento">
                      NÃO HÁ POLICIAIS ESCALADOS
                    </td>
                  </tr>
                )}
                {usuariosFiltrados.map((u) => (
                  <tr
                    key={u.usuarioId}
                    style={{
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(u.cpf);
                      toast.success(`CPF de ${u.nomeCompleto} copiado!`);
                    }}
                  >
                    <td className="hide-mobile" style={td}>
                      {resumo.teto.sistema} | {resumo.teto.nome_verba}
                    </td>

                    <td style={td}>{resumo.ome.nomeOme}</td>

                    <td style={td}>{u.nomeCompleto}</td>

                    <td style={td}>{formatarCPF(u.cpf)}</td>

                    <td className="hide-mobile" style={td}>
                      {u.nunfunc} | {u.nunvinc}
                    </td>

                    {resumo.teto.sistema === "DIARIAS" && (
                      <td className="hide-mobile" style={td}>
                        {u.banco
                          ? `${u.banco} | ${u.cod_banco} | Ag: ${u.agencia} | Ct: ${u.conta} - ${u.dig_conta}`
                          : "-"}
                      </td>
                    )}

                    <td
                      style={{ ...td, textAlign: "center", fontWeight: "bold" }}
                    >
                      {u.totalCotas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ─── Rodapé ─────────────────────────────────────────────────── */}
            <div className="divRodapeEventoPrincipal">
              {usuariosFiltrados.length} policial(is) escalado(s)
            </div>

            <div className="divRodapeEventoSecundaria">
              <div style={{ fontSize: "10px", color: "#555" }}>
                Oficiais:{" "}
                <strong>
                  {(
                    resumo.totalCotasOficiais * valorCota.oficial
                  ).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
              <div className="divRodapePrcValor">
                Praças:{" "}
                <strong>
                  {(resumo.totalCotasPracas * valorCota.praca).toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    },
                  )}
                </strong>
              </div>

              <div className="divValorTtEvento">
                Valor total da planilha:{" "}
                <strong>
                  {(
                    resumo.totalCotasPracas * valorCota.praca +
                    resumo.totalCotasOficiais * valorCota.oficial
                  ).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
            </div>

            <div className="divNomeSisGenesis">
              <div>
                <h4 className="tituloEventoResumo">
                  Genesis - Sistema de Planejamento, Gestão e Controle
                </h4>

                <div>
                  <img
                    src="/logo_dpo.png"
                    alt="Logo da PMPE"
                    className="logoEventoResumoRodape"
                  />
                </div>
              </div>
            </div>
            {/* ─── Progresso do Evento ──────────────────────────────────────── */}
            <div className="modalFooter">
              <div className="eventoProgressoWrap">
                <div className="eventoProgressoSteps">
                  <div className="eventoProgressoLine">
                    <div
                      className="eventoProgressoLineFill"
                      style={{ width: progressoLinha }}
                    />
                  </div>

                  {[
                    {
                      key: "CRIADO",
                      label: "Criado",
                      icon: "ti-file-plus",
                      data: resumo.criado_em,
                      usuario: resumo.criado_por,
                    },
                    {
                      key: "HOMOLOGADO",
                      label: "Homologado",
                      icon: "ti-circle-check",
                      data: resumo.homologado_em,
                      usuario: resumo.homologado_por,
                    },

                    ...(resumo.teto.sistema === "DIARIAS"
                      ? [
                          {
                            key: "PD_CONCLUIDA",
                            label: "Prev. Desembolso",
                            icon: "ti-cash",
                            data: resumo.pd_concluida_em,
                            usuario: resumo.pd_concluida_por,
                          },
                          {
                            key: "PAGO",
                            label: "Pago",
                            icon: "ti-rosette-discount-check",
                            data: resumo.pago_em,
                            usuario: resumo.pago_por,
                          },
                        ]
                      : []),
                  ].map(({ key, label, icon, data, usuario }) => {
                    const fases = [
                      "CRIADO",
                      "HOMOLOGADO",
                      "PD_CONCLUIDA",
                      "PAGO",
                    ];
                    const idxAtual = fases.indexOf(resumo.status_evento);
                    const idxFase = fases.indexOf(key);

                    const ativo =
                      fasesAtivas.includes(key) && idxFase < idxAtual;
                    const atual =
                      fasesAtivas.includes(key) && idxFase === idxAtual;

                    return (
                      <div className="eventoProgressoStep" key={key}>
                        <div
                          className={`eventoProgressoCircle${ativo ? " ativo" : atual ? " atual" : ""}`}
                        >
                          <i className={`ti ${icon}`} aria-hidden="true" />
                        </div>
                        <div
                          className={`eventoProgressoLabel${ativo || atual ? " ativo" : ""}`}
                        >
                          {label}
                        </div>
                        {(ativo || atual) && data && (
                          <div className="eventoProgressoInfo ativo">
                            {new Date(data).toLocaleString("pt-BR")}
                            {usuario && (
                              <>
                                <br />
                                {usuario}
                              </>
                            )}
                          </div>
                        )}
                        {!(ativo || atual) && (
                          <div className="eventoProgressoInfo" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                }}
              >
                {resumo &&
                  (() => {
                    const permissoes = getPermissoesEvento(
                      resumo.status_evento,
                      user?.typeUser,
                    );
                    const acao = getEventoAcao(resumo.status_evento);
                    const podeExecutar =
                      acao?.novoStatus === STATUS_EVENTO.HOMOLOGADO
                        ? permissoes.podeHomologar
                        : acao?.novoStatus === STATUS_EVENTO.PD_CONCLUIDA
                          ? permissoes.podePD
                          : acao?.novoStatus === STATUS_EVENTO.PAGO
                            ? permissoes.podePago
                            : false;

                    return acao && podeExecutar ? (
                      <button
                        className="botaoConcluirPd"
                        onClick={() => handleAlterarStatus(acao.novoStatus)}
                        disabled={gerandoPagamento}
                      >
                        {gerandoPagamento ? "Aguarde..." : acao.label}
                      </button>
                    ) : null;
                  })()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Estilos inline reutilizáveis ─────────────────────────────────────────────
const th: React.CSSProperties = {
  padding: "6px 8px",
  textAlign: "left",
  borderBottom: "1px solid #dcdcdc",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "5px 8px",
  verticalAlign: "middle",
};
126300;
