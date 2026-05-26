"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/src/hooks/useApi";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaExchangeAlt,
  FaBan,
  FaUser,
} from "react-icons/fa";
import { FiGrid, FiLayers } from "react-icons/fi";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Viatura = {
  id: number;
  patrimonio: string;
  statusVtr: "DISPONIVEL" | "INDISPONIVEL";
};

type Escala = {
  id: number;
  sistema: string;
  mat_escala: string; // ← adicione
  pg_escala: string; // ← adicione
  ng_escala: string; // ← adicione
  cpf_escala: string; // ← adicione
  tipo_escala: string;
  nomeome_escala: string;
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
  nomeOme?: string;
  status_teto?: string;
  somacota_escala: number;
  somaCotaFinal: number;
  pagamento: string;
  phone?: string | null;

  conta?: {
    banco: string;
    agencia: string;
    conta: string;
  } | null;
};

type Repasse = {
  id: number;
  escalaId: number;
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

  const [escalasDoDiaSelecionado, setEscalasDoDiaSelecionado] = useState<
    Escala[]
  >([]);
  const [escalaSelecionadaParaRepasse, setEscalaSelecionadaParaRepasse] =
    useState<Escala | null>(null);

  const [motivo, setMotivo] = useState("");
  const [loadingRepasse, setLoadingRepasse] = useState(false);
  const [loadingCancelar, setLoadingCancelar] = useState(false);
  const [modalRepasse, setModalRepasse] = useState(false);

  const [colegas, setColegas] = useState<Record<number, Escala[]>>({});
  const [loadingColegas, setLoadingColegas] = useState<Record<number, boolean>>(
    {},
  );

  const { data: escalas, loading } = useApi<Escala[]>("/api/escala/minhas", []);
  const [meusRepasses, setMeusRepasses] = useState<Repasse[] | null>(null);

  // ─── Resumo financeiro ───────────────────────────────────────────────────────
  const mesStr = String(mesAtual + 1).padStart(2, "0");
  const prefixoMes = `${anoAtual}-${mesStr}`;

  const escalasContexto: Escala[] =
    escalasDoDiaSelecionado.length > 0
      ? escalasDoDiaSelecionado
      : (escalas?.filter((e) => e.dataInicio.startsWith(prefixoMes)) ?? []);

  const tituloContexto =
    escalasDoDiaSelecionado.length > 0
      ? `${formatarData(escalasDoDiaSelecionado[0].dataInicio)}`
      : `${MESES[mesAtual]} ${anoAtual}`;

  function isPago(pagamento: string): boolean {
    return pagamento.trim().toLowerCase().startsWith("pago");
  }

  function resumoPorSistema(sistema: string) {
    const lista = escalasContexto.filter((e) => e.sistema === sistema);
    if (lista.length === 0)
      return {
        cota_escala: 0,
        somaCotaFinal: 0,
        pagamento: "—",
        pago: false,
        somaCotaFinalPago: 0,
      };

    const totalCotas = lista.reduce((acc, e) => acc + e.cota_escala, 0);
    const somaCotaFinal = lista[0].somaCotaFinal;
    const todosPagos = lista.every((e) => isPago(e.pagamento));
    const algumPago = lista.some((e) => isPago(e.pagamento));

    const pagamentoLabel = todosPagos
      ? "Pago"
      : algumPago
        ? "Parcialmente pago"
        : lista[0].pagamento;

    const somaCotaFinalPago = lista
      .filter((e) => isPago(e.pagamento))
      .reduce(
        (acc, e) =>
          acc + (e.somaCotaFinal / (e.somacota_escala || 1)) * e.cota_escala,
        0,
      );

    return {
      cota_escala: totalCotas,
      somaCotaFinal,
      somaCotaFinalPago,
      pagamento: pagamentoLabel,
      pago: todosPagos,
    };
  }

  const pjes = resumoPorSistema("PJES");
  const diarias = resumoPorSistema("DIARIAS");

  async function recarregarRepasses() {
    const res = await fetch("/api/repasse/meus");
    const data = await res.json();
    setMeusRepasses(data);
  }

  useEffect(() => {
    recarregarRepasses();
  }, []);

  function getRepasseAtivo(escalaId: number): Repasse | null {
    return (
      meusRepasses?.find(
        (r) => r.escalaId === escalaId && r.statusRepasse === "ABERTO",
      ) ?? null
    );
  }

  function isRepasseExpirado(escala: Escala): boolean {
    const dataHora = `${escala.dataInicio}T${escala.horaInicio}`;
    return new Date(dataHora) <= new Date();
  }

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
    setEscalasDoDiaSelecionado([]);
  }

  function irParaProximoMes() {
    setMesAtual((m) => (m === 11 ? 0 : m + 1));
    if (mesAtual === 11) setAnoAtual((a) => a + 1);
    setEscalasDoDiaSelecionado([]);
  }

  // ─── Grade do calendário ─────────────────────────────────────────────────────
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const celulas = Array.from({ length: primeiroDia + totalDias }, (_, i) =>
    i < primeiroDia ? null : i - primeiroDia + 1,
  );

  async function selecionarDia(escalasNoDia: Escala[]) {
    setEscalasDoDiaSelecionado(escalasNoDia);
    setColegas({});

    for (const escala of escalasNoDia) {
      if (!escala.operacaoId) continue;

      setLoadingColegas((prev) => ({ ...prev, [escala.id]: true }));
      try {
        const res = await fetch(`/api/escala?operacaoId=${escala.operacaoId}`);
        const data = await res.json(); // ← recebe o objeto
        const todas: Escala[] = data.escalas ?? data; // ← extrai o array

        const mesmoGrupo = todas.filter(
          (e) =>
            e.mat_escala !== escala.mat_escala &&
            e.dataInicio === escala.dataInicio &&
            e.horaInicio === escala.horaInicio &&
            e.horaFim === escala.horaFim &&
            (escala.viaturaId ? e.viaturaId === escala.viaturaId : true),
        );

        setColegas((prev) => ({ ...prev, [escala.id]: mesmoGrupo }));
      } catch {
        setColegas((prev) => ({ ...prev, [escala.id]: [] }));
      } finally {
        setLoadingColegas((prev) => ({ ...prev, [escala.id]: false }));
      }
    }
  }

  // ─── Solicitar repasse ───────────────────────────────────────────────────────
  async function handleRepasse() {
    if (!escalaSelecionadaParaRepasse) return;
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
          escalaId: escalaSelecionadaParaRepasse.id,
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
      recarregarRepasses();
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível solicitar o repasse");
    } finally {
      setLoadingRepasse(false);
    }
  }

  // ─── Cancelar repasse ────────────────────────────────────────────────────────
  async function handleCancelarRepasse(escala: Escala) {
    const repasseAtivo = getRepasseAtivo(escala.id);
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
      if (!response.ok)
        throw new Error(data?.message || "Erro ao cancelar repasse");
      toast.success("Repasse cancelado com sucesso!");
      recarregarRepasses();
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível cancelar o repasse");
    } finally {
      setLoadingCancelar(false);
    }
  }

  // ─── Avatar do colega ─────────────────────────────────────────────────────────
  function AvatarColega({ mat, nome }: { mat: string; nome: string }) {
    const [erro, setErro] = useState(false);
    if (erro)
      return (
        <FaUser
          style={{
            border: "1px solid #ececec",
            borderRadius: "25px",
            marginRight: "5px",
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

  // ─── Card de detalhe por escala ───────────────────────────────────────────────
  function CardEscala({ escala }: { escala: Escala }) {
    const repasseAtivo = getRepasseAtivo(escala.id);
    const expirado = isRepasseExpirado(escala);
    const colegasEscala = colegas[escala.id] ?? [];
    const carregandoColegas = loadingColegas[escala.id] ?? false;

    return (
      <div className="escala-card" style={{ marginBottom: "3px" }}>
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
              {formatarData(escala.dataInicio)} | {escala.nomeOme}
            </span>

            <button
              className="btn-repassar"
              onClick={() => {
                setEscalaSelecionadaParaRepasse(escala);
                setModalRepasse(true);
              }}
              disabled={!!repasseAtivo || expirado}
            >
              <FaExchangeAlt />
              {expirado ? "PRAZO ENCERRADO" : "REPASSAR"}
            </button>

            {repasseAtivo && (
              <button
                className="btn-cancelar-repasse"
                onClick={() => handleCancelarRepasse(escala)}
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
                    {escala.nomeEvento && (
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          EVENTO:{" "}
                        </div>
                        <div>{escala.nomeEvento}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ width: "50%", display: "flex" }}>
                    {escala.nomeOperacao && (
                      <div style={{ display: "flex" }}>
                        <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                          OPERAÇÃO:{" "}
                        </div>
                        <div>{escala.nomeOperacao}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex" }}>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      SISTEMA:{" "}
                    </div>
                    <div>{escala.sistema}</div>
                  </div>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      FUNÇÃO:{" "}
                    </div>
                    <div>{escala.funcao}</div>
                  </div>
                </div>

                <div style={{ display: "flex" }}>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      HORÁRIO:{" "}
                    </div>
                    <div>
                      {formatarHora(escala.horaInicio)} às{" "}
                      {formatarHora(escala.horaFim)}
                    </div>
                  </div>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      LOCAL:{" "}
                    </div>
                    <div>{escala.localApresentacao}</div>
                  </div>
                </div>

                <div style={{ display: "flex" }}>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      SITUAÇÃO:{" "}
                    </div>
                    <div>{escala.situacao}</div>
                  </div>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      TOTAL DE COTA:{" "}
                    </div>
                    <div>{escala.cota_escala}</div>
                  </div>
                </div>

                <div style={{ display: "flex" }}>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      VIATURA:{" "}
                    </div>
                    {escala.viatura && (
                      <div>
                        {escala.viatura.patrimonio}{" "}
                        <span
                          style={{
                            color:
                              escala.viatura.statusVtr === "INDISPONIVEL"
                                ? "#f87171"
                                : "#4ade80",
                            fontSize: 10,
                          }}
                        >
                          ({escala.viatura.statusVtr})
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      ANOTAÇÕES:{" "}
                    </div>
                    {escala.anotacoes && <div>{escala.anotacoes}</div>}
                  </div>
                </div>

                {/* Equipe de serviço */}
                {(carregandoColegas || colegasEscala.length > 0) && (
                  <div
                    style={{
                      paddingTop: "10px",
                      paddingLeft: "10px",
                      paddingRight: "10px",
                    }}
                  >
                    <div style={{ color: "#a09e9e", fontSize: "12px" }}>
                      Equipe de Serviço
                    </div>
                    {carregandoColegas ? (
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Carregando...
                      </div>
                    ) : (
                      <div
                        style={{
                          overflowY: "scroll",
                          borderRadius: "10px",
                          border: "1px solid #ececec",
                          padding: "10px",
                        }}
                      >
                        {colegasEscala.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              width: "100%",
                              display: "flex",
                              marginBottom: "6px",
                            }}
                          >
                            {/* ✅ nome vem de dadosSgp.nomeGuerraSgp */}
                            <AvatarColega
                              mat={c.mat_escala ?? c.mat_escala}
                              nome={c.ng_escala ?? c.ng_escala}
                            />
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                fontSize: "11px",
                                borderBottom: "1px solid #ececec",
                              }}
                            >
                              {c.pg_escala} {c.mat_escala} {c.ng_escala}{" "}
                              {c.nomeome_escala} {c.phone} | {c.funcao}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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
            const isSelecionado =
              escalasDoDiaSelecionado.length > 0 &&
              escalasDoDiaSelecionado[0].dataInicio === chave;
            const temRepasseAberto = escalasNoDia.some((e) =>
              meusRepasses?.some(
                (r) => r.escalaId === e.id && r.statusRepasse === "ABERTO",
              ),
            );

            return (
              <div
                key={chave}
                onClick={() => temEscala && selecionarDia(escalasNoDia)}
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
                      ? "#fff7ed"
                      : temEscala
                        ? "#f0fdf4"
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

      {/* Cards do dia selecionado */}
      {escalasDoDiaSelecionado.map((escala) => (
        <CardEscala key={escala.id} escala={escala} />
      ))}

      {/* ─── Resumo financeiro ─── */}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Resumo financeiro
          </span>
          <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>
            📅 {tituloContexto}
          </span>
        </div>

        {/* PJES */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            paddingBottom: "14px",
            borderBottom: "1px solid #f1f1f1",
          }}
        >
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
          <div style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <strong style={{ fontSize: "15px", color: "#111827" }}>
                SISTEMA PJES
              </strong>
              <span
                style={{
                  background: pjes.cota_escala > 0 ? "#dcfce7" : "#f3f4f6",
                  color: pjes.cota_escala > 0 ? "#166534" : "#9ca3af",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {pjes.cota_escala > 0
                  ? `${pjes.cota_escala} Cota(s)`
                  : "Sem escalas"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "8px",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: pjes.pago
                    ? "#16a34a"
                    : pjes.cota_escala === 0
                      ? "#9ca3af"
                      : "#f97316",
                }}
              >
                {pjes.pago
                  ? "✔ PAGO"
                  : pjes.cota_escala > 0
                    ? `● ${pjes.pagamento}`
                    : "—"}
              </span>
              <span>R$ {pjes.somaCotaFinal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px", color: "#4b5563" }}>
                Valor total pago
              </span>
              <strong style={{ color: "#16a34a", fontSize: "16px" }}>
                + R${" "}
                {(pjes.somaCotaFinalPago ?? 0) > 0
                  ? (pjes.somaCotaFinalPago ?? 0).toFixed(2).replace(".", ",")
                  : "0,00"}
              </strong>
            </div>
          </div>
        </div>

        {/* DIÁRIAS */}
        <div style={{ display: "flex", gap: "14px" }}>
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
          <div style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <strong style={{ fontSize: "15px", color: "#111827" }}>
                SISTEMA DIÁRIAS
              </strong>
              <span
                style={{
                  background: diarias.cota_escala > 0 ? "#fef3c7" : "#f3f4f6",
                  color: diarias.cota_escala > 0 ? "#92400e" : "#9ca3af",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {diarias.cota_escala > 0
                  ? `${diarias.cota_escala} Cota(s)`
                  : "Sem escalas"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "8px",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: diarias.pago
                    ? "#16a34a"
                    : diarias.cota_escala === 0
                      ? "#9ca3af"
                      : "#f97316",
                }}
              >
                {diarias.pago
                  ? "✔ PAGO"
                  : diarias.cota_escala > 0
                    ? `● ${diarias.pagamento}`
                    : "—"}
              </span>
              <span>
                R$ {diarias.somaCotaFinal.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px", color: "#4b5563" }}>
                Valor total pago
              </span>
              <strong style={{ color: "#16a34a", fontSize: "16px" }}>
                + R${" "}
                {(diarias.somaCotaFinalPago ?? 0) > 0
                  ? (diarias.somaCotaFinalPago ?? 0)
                      .toFixed(2)
                      .replace(".", ",")
                  : "0,00"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: "80px" }}></div>

      {/* ─── Modal de repasse ─── */}
      {modalRepasse && escalaSelecionadaParaRepasse && (
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
              <strong>{escalaSelecionadaParaRepasse.nomeEvento}</strong>
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "12px",
              }}
            >
              {escalaSelecionadaParaRepasse.nomeOperacao} —{" "}
              {formatarData(escalaSelecionadaParaRepasse.dataInicio)} |{" "}
              {escalaSelecionadaParaRepasse.funcao}
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
                  setEscalaSelecionadaParaRepasse(null);
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
