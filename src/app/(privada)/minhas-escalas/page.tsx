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
  FaExclamationTriangle,
  FaInfo,
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
  mat_escala: string;
  pg_escala: string;
  ng_escala: string;
  cpf_escala: string;
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
  cod_op?: string;
  nomeEvento?: string;
  nomeOme?: string;
  status_teto?: string;
  somacota_escala: number;
  somaCotaFinal: number;
  pagamento: string;
  phone?: string | null;
  presencaConfirmada?: boolean;
  presencaObservacao?: string | null;
  presencaConfirmadaEm?: string | null;
  presencaConfirmadaPorNome?: string | null;
  comentario_pagamento: string | null;
  valorIndividual?: number;

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

// ✅ NOVO — usuário retornado pelo autocomplete de destinatário
type UsuarioBusca = {
  mat: string;
  nomeGuerra: string;
  pg: string;
  imagemUrl: string | null;
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

  // ✅ NOVO — estados do autocomplete de destinatário
  const [matDestinatario, setMatDestinatario] = useState("");
  const [destinatarioSelecionado, setDestinatarioSelecionado] =
    useState<UsuarioBusca | null>(null);
  const [sugestoes, setSugestoes] = useState<UsuarioBusca[]>([]);
  const [buscandoSugestoes, setBuscandoSugestoes] = useState(false);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const [colegas, setColegas] = useState<Record<number, Escala[]>>({});
  const [loadingColegas, setLoadingColegas] = useState<Record<number, boolean>>(
    {},
  );

  const { data: escalas, loading } = useApi<Escala[]>("/api/escala/minhas", []);
  const [meusRepasses, setMeusRepasses] = useState<Repasse[] | null>(null);

  // ✅ NOVO — impede envio com matrícula digitada mas não confirmada na lista
  const destinatarioAmbiguo =
    matDestinatario.trim().length > 0 && !destinatarioSelecionado;

  // ✅ NOVO — busca com debounce enquanto o usuário digita a matrícula
  useEffect(() => {
    if (destinatarioSelecionado) return;

    const termo = matDestinatario.trim();
    if (termo.length < 6) {
      setSugestoes([]);
      return;
    }

    setBuscandoSugestoes(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/repasse/buscar-usuario?q=${encodeURIComponent(termo)}`,
        );
        const data: UsuarioBusca[] = await res.json();
        setSugestoes(data);
        setMostrarSugestoes(true);
      } catch {
        setSugestoes([]);
      } finally {
        setBuscandoSugestoes(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [matDestinatario, destinatarioSelecionado]);

  function selecionarDestinatario(usuario: UsuarioBusca) {
    setDestinatarioSelecionado(usuario);
    setMatDestinatario(usuario.mat);
    setSugestoes([]);
    setMostrarSugestoes(false);
  }

  function limparDestinatario() {
    setDestinatarioSelecionado(null);
    setMatDestinatario("");
    setSugestoes([]);
  }

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

    const somaCotaFinal = lista.reduce(
      (acc, e) => acc + (e.valorIndividual ?? 0),
      0,
    );

    const todosPagos = lista.every((e) => isPago(e.pagamento));
    const algumPago = lista.some((e) => isPago(e.pagamento));

    const pagamentoLabel = todosPagos
      ? "Pago"
      : algumPago
        ? "Parcialmente pago"
        : lista[0].pagamento;

    const somaCotaFinalPago = lista
      .filter((e) => isPago(e.pagamento))
      .reduce((acc, e) => acc + (e.valorIndividual ?? 0), 0);

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

  const escalaPorData = new Map<string, Escala[]>();
  escalas?.forEach((e) => {
    if (!escalaPorData.has(e.dataInicio)) escalaPorData.set(e.dataInicio, []);
    escalaPorData.get(e.dataInicio)!.push(e);
  });

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
        const data = await res.json();
        const todas: Escala[] = data.escalas ?? data;

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

    // ✅ NOVO — impede envio com matrícula digitada mas não confirmada
    if (matDestinatario.trim().length > 0 && !destinatarioSelecionado) {
      toast.error(
        "Selecione um usuário da lista ou limpe o campo para repasse aberto",
      );
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
          matDestinatario: destinatarioSelecionado?.mat || undefined,
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
      limparDestinatario();
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
            <span
              className="escala-card__titulo"
              onClick={() => {
                if (!escala.cod_op) return;
                navigator.clipboard.writeText(escala.cod_op);
                toast.success("Código da Operação Copiado");
              }}
              style={{ cursor: "pointer" }}
              title="Clique para copiar o código da operação"
            >
              <FaCalendarAlt
                style={{ marginLeft: "5px", marginRight: "5px" }}
              />
              {formatarData(escala.dataInicio)} | {escala.nomeOme} - COP{" "}
              {escala.cod_op}
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
                <div style={{ display: "flex" }}>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      VERIFICADOR:{" "}
                    </div>
                    {escala.presencaConfirmadaPorNome}
                  </div>
                  <div style={{ width: "50%", display: "flex" }}>
                    <div style={{ paddingRight: "5px", fontWeight: "700" }}>
                      DETALHES:{" "}
                    </div>
                    {escala.presencaConfirmadaPorNome ? (
                      <>
                        {escala.presencaConfirmadaEm && (
                          <div style={{ color: "#666", fontSize: 10 }}>
                            {new Date(
                              escala.presencaConfirmadaEm,
                            ).toLocaleString("pt-BR")}
                          </div>
                        )}
                        {escala.presencaObservacao && (
                          <div style={{ color: "#888", fontStyle: "italic" }}>
                            {escala.presencaObservacao}
                          </div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "#bbb" }}>—</span>
                    )}
                  </div>
                </div>
                {escala.comentario_pagamento && (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      textAlign: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "90%",
                        display: "flex",
                        textAlign: "center",
                        borderRadius: "5px",
                        backgroundColor: "#b90f09",
                        color: "#fff",
                        padding: "5px",
                        marginTop: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <FaExclamationTriangle />
                      <span style={{ marginLeft: "5px" }}>
                        {escala.comentario_pagamento}
                      </span>
                    </div>
                  </div>
                )}

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
                        {colegasEscala.slice(0, 3).map((c) => (
                          <div
                            key={c.id}
                            style={{
                              width: "100%",
                              display: "flex",
                              marginBottom: "6px",
                            }}
                          >
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

                        {colegasEscala.length > 3 && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              textAlign: "center",
                              marginTop: "4px",
                            }}
                          >
                            +{colegasEscala.length - 3} outro(s)
                          </div>
                        )}
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

      {escalasDoDiaSelecionado.map((escala) => (
        <CardEscala key={escala.id} escala={escala} />
      ))}

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
          onClick={() => {
            setModalRepasse(false);
            setMotivo("");
            limparDestinatario();
            setEscalaSelecionadaParaRepasse(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 60,
            paddingBottom: "var(--bottom-nav-height, 40px)", // ✅ NOVO
          }}
        >
          <style>{`
      @keyframes slideUpSheet {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .repasseModalInput {
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .repasseModalInput:focus {
        outline: none;
        border-color: #f97316 !important;
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
      }
      .repasseBtnConfirmar:not(:disabled):hover {
        background-color: #ea6c0c !important;
      }
      .repasseBtnCancelar:hover {
        background-color: #f9fafb !important;
      }
      .repasseSugestaoItem:hover {
        background-color: #f8fafc !important;
      }
    `}</style>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "20px 20px 0 0",
              width: "100%",
              maxWidth: "480px",
              height: "68vh",
              maxHeight: "calc(100vh - var(--bottom-nav-height, 64px) - 16px)",
              boxShadow: "0 -12px 40px rgba(0,0,0,0.18)",
              animation: "slideUpSheet 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ─── Alça de puxar ─── */}
            <div
              style={{
                width: "40px",
                height: "4px",
                borderRadius: "2px",
                backgroundColor: "#d1d5db",
                margin: "10px auto 0 auto",
                flexShrink: 0,
              }}
            />

            {/* ─── Conteúdo com scroll ─── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 20px 0 20px",
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    marginBottom: "8px",
                  }}
                >
                  REPASSE SUPERVISIONADO PELA DIRETORIA/OME
                </span>

                {/* Card de resumo do serviço */}
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #eef2f7",
                    borderRadius: "12px",
                    padding: "12px 14px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#111827",
                      margin: 0,
                      marginBottom: "3px",
                    }}
                  >
                    {escalaSelecionadaParaRepasse.nomeEvento}
                  </p>
                  <p
                    style={{ fontSize: "11.5px", color: "#6b7280", margin: 0 }}
                  >
                    {escalaSelecionadaParaRepasse.nomeOperacao} —{" "}
                    {formatarData(escalaSelecionadaParaRepasse.dataInicio)} |{" "}
                    {escalaSelecionadaParaRepasse.funcao}
                  </p>
                  {escalaSelecionadaParaRepasse.anotacoes && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        fontStyle: "italic",
                        margin: 0,
                        marginTop: "4px",
                      }}
                    >
                      {escalaSelecionadaParaRepasse.anotacoes}
                    </p>
                  )}
                </div>
              </div>

              {/* Motivo */}
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#374151",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Motivo do repasse *
              </label>
              <textarea
                className="repasseModalInput"
                style={{
                  width: "100%",
                  marginBottom: "18px",
                  padding: "10px 12px",
                  fontSize: "12.5px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  resize: "none",
                  height: "56px",
                  fontFamily: "inherit",
                  color: "#111827",
                }}
                placeholder="Ex: Emergência médica com familiar"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />

              {/* Destinatário */}
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#374151",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Deseja escolher alguém?{" "}
                <span style={{ fontWeight: 400, color: "#9ca3af" }}>
                  (opcional)
                </span>
              </label>

              {destinatarioSelecionado ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px 6px 6px",
                    marginBottom: "10px",
                    borderRadius: "999px",
                    border: "1px solid #bfdbfe",
                    backgroundColor: "#eff6ff",
                    width: "fit-content",
                  }}
                >
                  {destinatarioSelecionado.imagemUrl ? (
                    <img
                      src={destinatarioSelecionado.imagemUrl}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        backgroundColor: "#dbeafe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FaUser size={12} color="#1d4ed8" />
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1e3a8a",
                    }}
                  >
                    {destinatarioSelecionado.pg} {destinatarioSelecionado.mat}{" "}
                    {destinatarioSelecionado.nomeGuerra}
                  </span>
                  <button
                    onClick={limparDestinatario}
                    style={{
                      border: "none",
                      background: "#dbeafe",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      color: "#1e3a8a",
                      fontWeight: "bold",
                      fontSize: "12px",
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                    aria-label="Remover destinatário"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative", marginBottom: "10px" }}>
                  <input
                    className="repasseModalInput"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "12.5px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      color: "#111827",
                    }}
                    placeholder="Digite a matrícula do destinatário"
                    value={matDestinatario}
                    onChange={(e) => setMatDestinatario(e.target.value)}
                    onFocus={() =>
                      sugestoes.length > 0 && setMostrarSugestoes(true)
                    }
                    onBlur={() =>
                      setTimeout(() => setMostrarSugestoes(false), 150)
                    }
                  />

                  {mostrarSugestoes &&
                    (buscandoSugestoes || sugestoes.length > 0) && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 60,
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          marginTop: "6px",
                          maxHeight: "180px",
                          overflowY: "auto",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                        }}
                      >
                        {buscandoSugestoes ? (
                          <div
                            style={{
                              padding: "10px",
                              fontSize: "11px",
                              color: "#9ca3af",
                            }}
                          >
                            Buscando...
                          </div>
                        ) : (
                          sugestoes.map((u) => (
                            <div
                              key={u.mat}
                              className="repasseSugestaoItem"
                              onClick={() => selecionarDestinatario(u)}
                              onMouseDown={(e) => e.preventDefault()}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 10px",
                                cursor: "pointer",
                                fontSize: "12px",
                                borderBottom: "1px solid #f1f5f9",
                              }}
                            >
                              {u.imagemUrl ? (
                                <img
                                  src={u.imagemUrl}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    backgroundColor: "#f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <FaUser size={11} color="#94a3b8" />
                                </div>
                              )}
                              <span style={{ color: "#111827" }}>
                                {u.pg} {u.mat} {u.nomeGuerra}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                </div>
              )}

              {destinatarioAmbiguo &&
                !mostrarSugestoes &&
                !buscandoSugestoes && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#dc2626",
                      marginTop: "-4px",
                      marginBottom: "10px",
                    }}
                  >
                    Selecione um usuário da lista de sugestões ou limpe o campo.
                  </p>
                )}

              {/* Avisos */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  borderRadius: "12px",
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "#92400e",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  <strong>⚠ Prazo:</strong> o destinatário deve aceitar o
                  repasse até a data do serviço.
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#92400e",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  <strong>⚠ Formalização:</strong> deve ser enviado documento à
                  seção da OME responsável. O descumprimento poderá ocasionar o
                  cancelamento do repasse.
                </p>
              </div>
            </div>

            {/* ─── Rodapé fixo com os botões ─── */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                padding: "14px 20px",
                paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))", // ✅ NOVO
                borderTop: "1px solid #f1f5f9",
                backgroundColor: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className="repasseBtnCancelar"
                onClick={() => {
                  setModalRepasse(false);
                  setMotivo("");
                  limparDestinatario();
                  setEscalaSelecionadaParaRepasse(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  backgroundColor: "#fff",
                  color: "#374151",
                  transition: "background-color 0.15s ease",
                }}
              >
                Cancelar
              </button>
              <button
                className="repasseBtnConfirmar"
                onClick={handleRepasse}
                disabled={loadingRepasse || destinatarioAmbiguo}
                style={{
                  flex: 1.4,
                  padding: "10px 14px",
                  fontSize: "12.5px",
                  borderRadius: "10px",
                  border: "none",
                  cursor:
                    loadingRepasse || destinatarioAmbiguo
                      ? "not-allowed"
                      : "pointer",
                  backgroundColor: "#f97316",
                  color: "#fff",
                  fontWeight: 700,
                  opacity: loadingRepasse || destinatarioAmbiguo ? 0.5 : 1,
                  transition: "background-color 0.15s ease",
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
