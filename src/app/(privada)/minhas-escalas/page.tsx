"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/src/hooks/useApi";
import toast from "react-hot-toast";
import {
  FaCar,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaExchangeAlt,
  FaBan,
  FaUser,
  FaShieldAlt,
} from "react-icons/fa";
import { FiGrid, FiLayers } from "react-icons/fi";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Viatura = {
  id: number;
  patrimonio: string;
  statusVtr: "DISPONIVEL" | "INDISPONIVEL";
};

// ─── Tipo atualizado ─────────────────────────────────────────────────────────
type Escala = {
  id: number;
  sistema: string;
  mat: string;
  pg_escala: string;
  nome_escala: string;
  nomeome_escala: string;
  phone_escala?: string;
  dataInicio: string;
  horaInicio: string;
  horaFim: string;
  cota_escala: number;
  localApresentacao: string;
  funcao: string;
  situacao: string;
  anotacoes?: string;
  viaturaId?: number | null;
  viatura?: Viatura | null;
  operacaoId?: number;
  nomeOperacao?: string;
  nomeEvento?: string;
  nomeOme?: string; // ✅ novo
};

type Repasse = {
  id: number;
  escalaId: number; // ✅ número direto, não objeto
  statusRepasse: "ABERTO" | "ACEITO" | "CANCELADO";
  dataInicioRepasse: string;
  horaInicioRepasse: string;
  motivo?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatarHora(hora: string): string {
  return hora?.slice(0, 5) ?? "-";
}

function formatarData(data: string): string {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function MinhasEscalasPage() {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [escalaSelecionada, setEscalaSelecionada] = useState<Escala | null>(
    null,
  );
  const [motivo, setMotivo] = useState("");
  const [loadingRepasse, setLoadingRepasse] = useState(false);
  const [loadingCancelar, setLoadingCancelar] = useState(false);
  const [modalRepasse, setModalRepasse] = useState(false);
  // ─── Estado dos colegas ───────────────────────────────────────────────────────
  const [colegas, setColegas] = useState<Escala[]>([]);
  const [loadingColegas, setLoadingColegas] = useState(false);
  const [matLogado, setMatLogado] = useState<string | null>(null);
  const { data: escalas, loading } = useApi<Escala[]>("/api/escala/minhas", []);

  // ✅ busca todos os repasses do usuário para saber o status de cada escala

  const [meusRepasses, setMeusRepasses] = useState<Repasse[] | null>(null);

  async function recarregarRepasses() {
    const res = await fetch("/api/repasse/meus");
    const data = await res.json();
    setMeusRepasses(data);
  }

  useEffect(() => {
    recarregarRepasses();
  }, []);

  // ─── Buscar mat do usuário logado (para excluir da lista de colegas) ──────────
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u) => setMatLogado(u?.mat ?? null))
      .catch(() => {});
  }, []);

  // ─── Repasse ativo da escala selecionada ────────────────────────────────────
  const repasseAtivo = escalaSelecionada
    ? (meusRepasses?.find(
        (r) =>
          r.escalaId === escalaSelecionada.id && r.statusRepasse === "ABERTO",
      ) ?? null)
    : null;

  // ✅ Expirado = data+hora do serviço já passou
  const repasseExpirado = escalaSelecionada
    ? (() => {
        const dataHora = `${escalaSelecionada.dataInicio}T${escalaSelecionada.horaInicio}`;
        return new Date(dataHora) <= new Date();
      })()
    : false;

  // ─── Mapa de datas com escalas ───────────────────────────────────────────────
  const escalaPorData = new Map<string, Escala[]>();
  escalas?.forEach((e) => {
    if (!escalaPorData.has(e.dataInicio)) escalaPorData.set(e.dataInicio, []);
    escalaPorData.get(e.dataInicio)!.push(e);
  });

  // ─── Navegação do calendário ─────────────────────────────────────────────────
  function irParaMesAnterior() {
    setMesAtual((m) => (m === 0 ? 11 : m - 1));
    if (mesAtual === 0) setAnoAtual((a) => a - 1);
    setEscalaSelecionada(null);
  }

  function irParaProximoMes() {
    setMesAtual((m) => (m === 11 ? 0 : m + 1));
    if (mesAtual === 11) setAnoAtual((a) => a + 1);
    setEscalaSelecionada(null);
  }

  // ─── Gerar dias do calendário ────────────────────────────────────────────────
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const celulas = Array.from({ length: primeiroDia + totalDias }, (_, i) =>
    i < primeiroDia ? null : i - primeiroDia + 1,
  );

  // ─── Buscar colegas ao selecionar escala ─────────────────────────────────────
  async function selecionarEscala(escala: Escala) {
    setEscalaSelecionada(escala);
    setColegas([]);

    if (!escala.operacaoId) return;

    setLoadingColegas(true);
    try {
      const res = await fetch(`/api/escala?operacaoId=${escala.operacaoId}`);
      const todas: Escala[] = await res.json();

      // ✅ filtra pelo mesmo grupo: data + hora + viatura, excluindo o próprio usuário
      const mesmoGrupo = todas.filter(
        (e) =>
          e.mat !== escala.mat && // exclui o usuário logado
          e.dataInicio === escala.dataInicio &&
          e.horaInicio === escala.horaInicio &&
          e.horaFim === escala.horaFim &&
          (escala.viaturaId ? e.viaturaId === escala.viaturaId : true),
      );

      setColegas(mesmoGrupo);
    } catch {
      setColegas([]);
    } finally {
      setLoadingColegas(false);
    }
  }

  // ─── Solicitar repasse ───────────────────────────────────────────────────────
  async function handleRepasse() {
    if (!escalaSelecionada) return;
    if (!motivo.trim()) {
      toast.error("Informe o motivo do repasse");
      return;
    }

    setLoadingRepasse(true);
    try {
      const response = await fetch("/api/repasse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escalaId: escalaSelecionada.id,
          motivo: motivo.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Erro ao criar repasse",
        );
      }

      toast.success("Repasse solicitado com sucesso!");
      setModalRepasse(false);
      setMotivo("");
      recarregarRepasses?.(); // ✅ atualiza lista de repasses
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível solicitar o repasse");
    } finally {
      setLoadingRepasse(false);
    }
  }

  // ─── Cancelar repasse ────────────────────────────────────────────────────────
  async function handleCancelarRepasse() {
    if (!repasseAtivo) return;
    const ok = confirm("Deseja cancelar este repasse?");
    if (!ok) return;

    setLoadingCancelar(true);
    try {
      const response = await fetch(
        `/api/repasse/${repasseAtivo.id}?acao=cancelar`,
        { method: "PATCH" },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Erro ao cancelar repasse");
      }

      toast.success("Repasse cancelado com sucesso!");
      recarregarRepasses?.(); // ✅ atualiza lista de repasses
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível cancelar o repasse");
    } finally {
      setLoadingCancelar(false);
    }
  }

  // componente auxiliar para avatar do colega
  function AvatarColega({ mat, nome }: { mat: string; nome: string }) {
    const [erro, setErro] = useState(false);
    if (erro)
      return (
        <FaUser
          style={{
            border: "1px solid #ececec",
            borderRadius: "25px",
            marginRight: "5px",
            justifyContent: "center",
            justifyItems: "center",
          }}
          size={30}
          color="#94a3b8"
        />
      );
    return (
      <img
        src={`/avatares/${mat}.jpg`}
        alt={nome}
        onError={() => setErro(true)}
        style={{
          width: "30px",
          height: "30px",
          objectFit: "cover",
          borderRadius: "25px",
          marginRight: "5px",
        }}
      />
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <h1
        style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}
      >
        <FaCalendarAlt style={{ marginRight: "8px" }} />
        MINHAS ESCALAS
      </h1>

      {/* ─── Cabeçalho do calendário ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={irParaMesAnterior}
          style={{ cursor: "pointer", padding: "4px 10px" }}
        >
          <FaChevronLeft />
        </button>
        <strong style={{ fontSize: "15px" }}>
          {MESES[mesAtual]} {anoAtual}
        </strong>
        <button
          onClick={irParaProximoMes}
          style={{ cursor: "pointer", padding: "4px 10px" }}
        >
          <FaChevronRight />
        </button>
      </div>

      {/* ─── Dias da semana ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          textAlign: "center",
          fontSize: "11px",
          fontWeight: "bold",
          marginBottom: "4px",
          color: "#555",
        }}
      >
        {DIAS_SEMANA.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* ─── Grade do calendário ─── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          Carregando escalas...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
          }}
        >
          {celulas.map((dia, idx) => {
            if (!dia) return <div key={`vazio-${idx}`} />;

            const chave = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            const escalasNoDia = escalaPorData.get(chave) ?? [];
            const temEscala = escalasNoDia.length > 0;
            const isHoje =
              dia === hoje.getDate() &&
              mesAtual === hoje.getMonth() &&
              anoAtual === hoje.getFullYear();
            const isSelecionado = escalaSelecionada?.dataInicio === chave;

            // ─── Badge no calendário ────────────────────────────────────────────────────
            const temRepasseAberto = escalasNoDia.some((e) =>
              meusRepasses?.some(
                (r) => r.escalaId === e.id && r.statusRepasse === "ABERTO", // ✅ era r.escala?.id
              ),
            );

            return (
              <div
                key={chave}
                onClick={() => temEscala && selecionarEscala(escalasNoDia[0])}
                style={{
                  border: isSelecionado
                    ? "2px solid #1a56db"
                    : isHoje
                      ? "2px solid #f97316"
                      : "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "6px 4px",
                  minHeight: "60px",
                  cursor: temEscala ? "pointer" : "default",
                  backgroundColor: isSelecionado
                    ? "#eff6ff"
                    : temRepasseAberto
                      ? "#fff7ed" // ✅ laranja suave = tem repasse aberto
                      : temEscala
                        ? "#f0fdf4" // verde suave = escalado
                        : "#fff",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: isHoje ? "bold" : "normal",
                    color: isHoje ? "#f97316" : "#333",
                    marginBottom: "4px",
                  }}
                >
                  {dia}
                </div>
                {escalasNoDia.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      fontSize: "9px",
                      backgroundColor:
                        e.sistema === "PJES" ? "#dbeafe" : "#fef9c3",
                      color: e.sistema === "PJES" ? "#1d4ed8" : "#854d0e",
                      borderRadius: "3px",
                      padding: "1px 3px",
                      marginBottom: "2px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {e.sistema} {e.funcao}
                  </div>
                ))}
                {/* ✅ badge de repasse aberto */}
                {temRepasseAberto && (
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#f97316",
                      fontWeight: "bold",
                    }}
                  >
                    ⇄ repasse
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Detalhes da escala selecionada ─── */}
      {escalaSelecionada && (
        <div className="escala-card">
          <div className="escala-card__header_direita">
            <div
              style={{
                background: "#482cad",
                fontWeight: "bold",
                width: "100%",
                borderRadius: "20px",
                height: "30px",
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                padding: "5px",
              }}
            >
              <span className="escala-card__titulo">
                <FaCalendarAlt
                  style={{ marginLeft: "5px", marginRight: "5px" }}
                />
                {formatarData(escalaSelecionada.dataInicio)}
              </span>

              <button
                className="btn-repassar"
                onClick={() => setModalRepasse(true)}
                disabled={!!repasseAtivo || repasseExpirado}
              >
                <FaExchangeAlt />
                {repasseExpirado ? "PRAZO ENCERRADO" : "REPASSAR"}
              </button>

              {repasseAtivo && (
                <button
                  className="btn-cancelar-repasse"
                  onClick={handleCancelarRepasse}
                  disabled={loadingCancelar}
                >
                  <FaBan />
                  {loadingCancelar ? "CANCELANDO..." : "CANCELAR REPASSE"}
                </button>
              )}
            </div>

            <div>
              <div className="escala-card__body">
                <div className="escala-card-secundaria">
                  <div style={{ display: "flex" }}>
                    <div style={{ width: "50%", display: "flex" }}>
                      {escalaSelecionada.nomeEvento && (
                        <div style={{ display: "flex" }}>
                          <div
                            style={{ paddingRight: "5px", fontWeight: "700" }}
                          >
                            EVENTO:{" "}
                          </div>
                          <div> {escalaSelecionada.nomeEvento}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ width: "50%", display: "flex" }}>
                      {escalaSelecionada.nomeOperacao && (
                        <div style={{ display: "flex" }}>
                          <div
                            style={{ paddingRight: "5px", fontWeight: "700" }}
                          >
                            OPERAÇÃO:{" "}
                          </div>
                          <div> {escalaSelecionada.nomeOperacao}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex" }}>
                    <div style={{ width: "50%", display: "flex" }}>
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          SISTEMA:{" "}
                        </div>
                        <div> {escalaSelecionada.sistema}</div>
                      </div>
                    </div>

                    <div style={{ width: "50%", display: "flex" }}>
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          FUNÇÃO:{" "}
                        </div>
                        <div> {escalaSelecionada.funcao}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex" }}>
                    <div style={{ width: "50%", display: "flex" }}>
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          HORÁRIO:{" "}
                        </div>
                        <div>
                          {" "}
                          {formatarHora(escalaSelecionada.horaInicio)} às{" "}
                          {formatarHora(escalaSelecionada.horaFim)}
                        </div>
                      </div>
                    </div>

                    <div style={{ width: "50%", display: "flex" }}>
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          LOCAL:{" "}
                        </div>
                        <div> {escalaSelecionada.localApresentacao}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex" }}>
                    <div style={{ width: "50%", display: "flex" }}>
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          SITUAÇÃO:{" "}
                        </div>
                        <div>{escalaSelecionada.situacao}</div>
                      </div>
                    </div>

                    <div style={{ width: "50%", display: "flex" }}>
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          TOTAL DE COTA:{" "}
                        </div>
                        <div> {escalaSelecionada.cota_escala}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex" }}>
                    <div style={{ width: "50%", display: "flex" }}>
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          VIATURA:{" "}
                        </div>
                        {escalaSelecionada.viatura && (
                          <div>
                            {escalaSelecionada.viatura.patrimonio}{" "}
                            <span
                              style={{
                                color:
                                  escalaSelecionada.viatura.statusVtr ===
                                  "INDISPONIVEL"
                                    ? "#f87171"
                                    : "#4ade80",
                                fontSize: 10,
                              }}
                            >
                              ({escalaSelecionada.viatura.statusVtr})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ width: "50%", display: "flex" }}>
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          ANOTAÇÕES:{" "}
                        </div>
                        {escalaSelecionada.anotacoes && (
                          <div> {escalaSelecionada.anotacoes}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        paddingTop: "10px",
                        paddingLeft: "10px",
                        paddingRight: "10px",
                        width: "100%",
                      }}
                    >
                      {(loadingColegas || colegas.length > 0) && (
                        <div
                          style={{
                            width: "100%",
                          }}
                        >
                          <div
                            style={{
                              color: "#a09e9e",
                              fontSize: "12px",
                            }}
                          >
                            Equipe de Serviço
                          </div>
                          {loadingColegas ? (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#64748b",
                              }}
                            >
                              Carregando...
                            </div>
                          ) : (
                            colegas.map((c) => (
                              <div
                                key={c.id}
                                style={{
                                  width: "100%",
                                  height: "180px",
                                  padding: "10px",
                                  overflowY: "scroll",
                                  borderRadius: "10px",

                                  border: "1px solid #ececec",
                                }}
                              >
                                <div
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                  }}
                                >
                                  <div>
                                    <AvatarColega
                                      mat={c.mat}
                                      nome={c.nome_escala}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      fontSize: "11px",
                                      borderBottom: "1px solid #ececec",
                                    }}
                                  >
                                    {c.pg_escala} {c.mat} {c.nome_escala}{" "}
                                    {c.nomeome_escala} {c.phone_escala} |{" "}
                                    {c.funcao}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          width: "100%",
          marginTop: "10px",
          background: "#ffffff",
          padding: "18px",
          borderRadius: "20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          border: "1px solid #ececec",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* ITEM */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            paddingBottom: "14px",
            borderBottom: "1px solid #f1f1f1",
          }}
        >
          {/* ICON */}
          <div
            style={{
              minWidth: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#eef4ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiLayers size={22} color="#2563eb" />
          </div>

          {/* CONTENT */}
          <div style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <strong
                style={{
                  fontSize: "15px",
                  color: "#111827",
                  letterSpacing: "0.3px",
                }}
              >
                SISTEMA PJES
              </strong>

              <span
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Pago
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              <span>Enviado em 01/04/2026</span>
              <span>R$ 1.000,00</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#4b5563",
                }}
              >
                Valor total pago em 01/04/2026
              </span>

              <strong
                style={{
                  color: "#16a34a",
                  fontSize: "16px",
                }}
              >
                + R$ 1.000,00
              </strong>
            </div>
          </div>
        </div>

        {/* ITEM 2 */}
        <div
          style={{
            display: "flex",
            gap: "14px",
          }}
        >
          {/* ICON */}
          <div
            style={{
              minWidth: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#f3f0ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiGrid size={22} color="#7c3aed" />
          </div>

          {/* CONTENT */}
          <div style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <strong
                style={{
                  fontSize: "15px",
                  color: "#111827",
                  letterSpacing: "0.3px",
                }}
              >
                SISTEMA DIÁRIAS
              </strong>

              <span
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Processando
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              <span>Enviado em 01/04/2026</span>
              <span>R$ 1.000,00</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#4b5563",
                }}
              >
                Valor total pago em 01/04/2026
              </span>

              <strong
                style={{
                  color: "#16a34a",
                  fontSize: "16px",
                }}
              >
                + R$ 1.000,00
              </strong>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: "80px" }}></div>

      {/* ─── Modal de repasse ─── */}
      {modalRepasse && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "10px",
              padding: "24px",
              width: "360px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              Solicitar Repasse
            </h2>
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              <strong>{escalaSelecionada?.nomeEvento}</strong>
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "12px",
              }}
            >
              {escalaSelecionada?.nomeOperacao} —{" "}
              {formatarData(escalaSelecionada?.dataInicio ?? "")} |{" "}
              {escalaSelecionada?.funcao}
            </p>
            <label style={{ fontSize: "12px", fontWeight: "bold" }}>
              Motivo *
            </label>
            <textarea
              style={{
                width: "100%",
                marginTop: "6px",
                marginBottom: "16px",
                padding: "8px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                resize: "none",
                height: "80px",
              }}
              placeholder="Ex: Emergência médica com familiar"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setModalRepasse(false);
                  setMotivo("");
                }}
                style={{
                  padding: "7px 14px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  cursor: "pointer",
                  backgroundColor: "#fff",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRepasse}
                disabled={loadingRepasse}
                style={{
                  padding: "7px 14px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: loadingRepasse ? "not-allowed" : "pointer",
                  backgroundColor: "#f97316",
                  color: "#fff",
                  fontWeight: "bold",
                  opacity: loadingRepasse ? 0.6 : 1,
                }}
              >
                {loadingRepasse ? "Enviando..." : "Confirmar Repasse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
