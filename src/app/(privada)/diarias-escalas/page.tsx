"use client";

import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { useApi } from "@/src/hooks/useApi";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { UserType } from "@/src/lib/userType";
import { FiArrowLeft, FiChevronUp, FiRefreshCcw, FiStar } from "react-icons/fi";
import {
  FaBarcode,
  FaCar,
  FaEdit,
  FaExchangeAlt,
  FaFilePdf,
  FaLink,
  FaLock,
  FaLockOpen,
  FaMapMarkerAlt,
  FaPhone,
  FaRegClock,
  FaTrash,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { FaTriangleExclamation } from "react-icons/fa6";
import { UploadEscalaPlanilha } from "@/src/components/ui/UploadEscalaPlanilha";
import MapaPresencasModal, {
  PontoPresenca,
} from "@/src/components/ui/MapaPresencasModal";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Teto = {
  id: number;
  imagemUrl: string;
  nome_verba: string;
  data_inicio: string;
  data_fim: string;
};
type Evento = {
  id: number;
  nome_evento: string;
  teto?: Teto;
  status_evento: string;
  ome?: { id: number; nomeOme: string };
};
type Operacao = {
  id: number;
  nome_operacao: string;
  qtd_oficiais_oper: number;
  qtd_pracas_oper: number;
  totalCotasOficiais: number;
  totalCotasPracas: number;
  cod_op: string;
  ome: { nomeOme: string };
  evento?: Evento;
};

type Usuario = {
  id: number;
  imagemUrl: string;
  pg: string;
  nomeGuerra: string;
  phone: string;
  cpf?: string;
  nunfunc: string;
  nunvinc: string;
  situacao: string;
  tipo: string;
  ome?: { nomeOme: string };
  conta?: { banco: string; agencia: string; conta: string };
};

type Viatura = {
  id: number;
  patrimonio: string;
  statusVtr: "DISPONIVEL" | "INDISPONIVEL";
};

type EscalaOperacaoResponse = {
  escalas: Escala[];
  totalCotasOficiais: number;
  totalCotasPracas: number;
};

type FiltroStatus = "PRESENTE" | "AUSENTE" | "VAGA" | null;

type Escala = {
  id: number;
  sistema: string;
  mat_escala: string | null;
  pg_escala: string | null;
  ng_escala: string | null;
  cpf_escala: string | null;
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
  isRepasse: boolean;
  repasseOrigemId?: number | null;
  usuarioId?: number;
  operacaoId?: number;
  viaturaId?: number | null;
  viatura?: Viatura | null;
  phone?: string | null;
  isVagaAberta?: boolean;
  omeDestinoId?: number | null;
  omeDestinoNome?: string | null;
  preenchidaEm?: string | null;

  // ── Presença ──
  presencaConfirmada?: boolean;
  presencaConfirmadaEm?: string | null;
  presencaLatitude?: number | null;
  presencaLongitude?: number | null;
  presencaConfirmadaPorNome?: string | null;

  // ── Saída ──
  saidaConfirmada?: boolean;
  saidaConfirmadaEm?: string | null;
  saidaConfirmadaPorNome?: string | null;
  saidaAutomatica?: boolean;

  // ── 1ª verificação ──
  primeiraVerificacao?: boolean;
  verificador1Nome?: string | null;
  dataHoraVerificador1?: string | null;
  obsVerificador1?: string | null;

  // ── 2ª verificação ──
  segundaVerificacao?: boolean;
  verificador2Nome?: string | null;
  dataHoraVerificador2?: string | null;
  obsVerificador2?: string | null;

  conta?: { banco: string; agencia: string; conta: string } | null;
};

const CARGOS = [
  "POG",
  "CMT",
  "MOT",
  "PAT",
  "FISCAL",
  "MO",
  "CMT_GD",
  "SENT",
  "AUX",
  "OUTRO",
];

// ─── Helpers de formatação ───────────────────────────────────────────────────

function formatarDataHoraCurta(valor?: string | null): string {
  if (!valor) return "";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Célula de status (Presença / Saída / 1ª e 2ª verificação) ───────────────

function StatusCell({
  confirmado,
  nome,
  dataHora,
  obs,
  extra,
}: {
  confirmado?: boolean;
  nome?: string | null;
  dataHora?: string | null;
  obs?: string | null;
  extra?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        minWidth: 92,
      }}
    >
      <input
        type="checkbox"
        checked={!!confirmado}
        readOnly
        style={{ width: 11, height: 11, cursor: "default" }}
      />
      {nome && (
        <div
          style={{
            fontSize: 9,
            color: "#555",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {nome}
        </div>
      )}
      {dataHora && (
        <div style={{ fontSize: 8.5, color: "#999" }}>
          {formatarDataHoraCurta(dataHora)}
          {extra ? ` (${extra})` : ""}
        </div>
      )}
      {obs && (
        <div
          title={obs}
          style={{
            fontSize: 8.5,
            color: "#888",
            fontStyle: "italic",
            maxWidth: 110,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {obs}
        </div>
      )}
    </div>
  );
}

// ─── Ocupação da viatura (visualização) ──────────────────────────────────────

type GrupoVtr = "COMANDO" | "MOT" | "PAT";

const CAPACIDADE: Record<GrupoVtr, number> = { COMANDO: 1, MOT: 1, PAT: 2 };

const NOME_GRUPO: Record<GrupoVtr, string> = {
  COMANDO: "FISCAL/CMT",
  MOT: "MOT",
  PAT: "PAT",
};

function grupoDaFuncao(funcao?: string | null): GrupoVtr | null {
  if (funcao === "FISCAL" || funcao === "CMT") return "COMANDO";
  if (funcao === "MOT") return "MOT";
  if (funcao === "PAT") return "PAT";
  return null;
}

/** Converte data + hora início/fim em [ini, fim) em minutos.
 *  Trata 24h (início === fim) e serviços que viram a noite. */
function intervaloEmMinutos(
  data?: string,
  horaIni?: string,
  horaFim?: string,
): [number, number] | null {
  if (!data || !horaIni || !horaFim) return null;
  const [a, m, d] = data.split("-").map(Number);
  if (!a || !m || !d) return null;
  const base = Date.UTC(a, m - 1, d) / 60000;
  const toMin = (h: string) => {
    const [H, M] = h.substring(0, 5).split(":").map(Number);
    return H * 60 + M;
  };
  const ini = toMin(horaIni);
  let dur = (toMin(horaFim) - ini + 1440) % 1440;
  if (dur === 0) dur = 1440;
  return [base + ini, base + ini + dur];
}

type SeatState = "ocupado" | "novo" | "conflito" | "livre";

function Seat({
  label,
  texto,
  estado,
}: {
  label: string;
  texto: string;
  estado: SeatState;
}) {
  const cores: Record<
    SeatState,
    { bg: string; border: string; color: string }
  > = {
    ocupado: { bg: "#e8f5e9", border: "#16a34a", color: "#14532d" },
    novo: { bg: "#eff6ff", border: "#2563eb", color: "#1e40af" },
    conflito: { bg: "#fef2f2", border: "#dc2626", color: "#991b1b" },
    livre: { bg: "#fafafa", border: "#d4d4d4", color: "#999" },
  };
  const c = cores[estado];
  return (
    <div
      style={{
        minWidth: 130,
        padding: "4px 8px",
        borderRadius: 8,
        background: c.bg,
        border: `1.5px ${estado === "novo" || estado === "livre" ? "dashed" : "solid"} ${c.border}`,
        color: c.color,
        textAlign: "center",
        lineHeight: 1.2,
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 9, fontWeight: 700 }}>{texto}</div>
    </div>
  );
}

function VtrOcupacao({
  ocupantes,
  cargo,
  novoNome,
  patrimonio,
}: {
  ocupantes: Escala[];
  cargo: string;
  novoNome: string;
  patrimonio?: string;
}) {
  const grupoNovo = grupoDaFuncao(cargo);
  const nome = (e: Escala) => `${e.pg_escala} ${e.ng_escala}`;

  if (!grupoNovo) {
    if (ocupantes.length === 0) return null;
    return (
      <div style={{ fontSize: 10, color: "#555", marginTop: 8 }}>
        <strong>Já na viatura {patrimonio} neste horário:</strong>
        {ocupantes.map((e) => (
          <div key={e.id}>
            {e.funcao} — {nome(e)}
          </div>
        ))}
      </div>
    );
  }

  const porGrupo: Record<GrupoVtr, Escala[]> = {
    COMANDO: [],
    MOT: [],
    PAT: [],
  };
  ocupantes.forEach((e) => {
    const g = grupoDaFuncao(e.funcao);
    if (g) porGrupo[g].push(e);
  });

  const lotado = porGrupo[grupoNovo].length >= CAPACIDADE[grupoNovo];

  function seat(grupo: GrupoVtr, idx: number, label: string) {
    const ocupante = porGrupo[grupo][idx];
    if (ocupante) {
      const conflito = grupo === grupoNovo && lotado;
      return (
        <Seat
          label={label}
          texto={`${ocupante.funcao} ${nome(ocupante)}`}
          estado={conflito ? "conflito" : "ocupado"}
        />
      );
    }
    if (grupo === grupoNovo && !lotado && idx === porGrupo[grupo].length) {
      return (
        <Seat label={label} texto={`➜ ${novoNome} (${cargo})`} estado="novo" />
      );
    }
    return <Seat label={label} texto="Livre" estado="livre" />;
  }

  const excedentes = Math.max(
    0,
    porGrupo[grupoNovo].length - CAPACIDADE[grupoNovo],
  );

  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#444",
          marginBottom: 6,
        }}
      >
        Viatura {patrimonio} neste horário
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          gridTemplateRows: "auto auto",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px 12px",
        }}
      >
        <div style={{ gridColumn: 1, gridRow: 1 }}>
          {seat("MOT", 0, "MOT (motorista)")}
        </div>
        <div style={{ gridColumn: 2, gridRow: "1 / span 2" }}>
          <img
            src="/vtr_icon.png"
            alt="Viatura"
            style={{ width: 50, height: 80, display: "block" }}
          />
        </div>
        <div style={{ gridColumn: 3, gridRow: 1 }}>
          {seat("COMANDO", 0, "FISCAL / CMT")}
        </div>
        <div style={{ gridColumn: 1, gridRow: 2 }}>
          {seat("PAT", 0, "PAT 1")}
        </div>
        <div style={{ gridColumn: 3, gridRow: 2 }}>
          {seat("PAT", 1, "PAT 2")}
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 9,
          fontWeight: 700,
          textAlign: "center",
          color: lotado ? "#dc2626" : "#16a34a",
        }}
      >
        {lotado
          ? `⚠️ Vagas de ${NOME_GRUPO[grupoNovo]} já preenchidas nesta viatura${
              excedentes > 0 ? ` (${excedentes} acima do limite)` : ""
            }`
          : `✔ Há vaga para ${NOME_GRUPO[grupoNovo]}`}
      </div>
    </div>
  );
}

// ─── Caixinha de contagem (também usada como filtro) ─────────────────────────

function ResumoBox({
  label,
  valor,
  cor,
  ativo,
  onClick,
}: {
  label: string;
  valor: number;
  cor: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      title={ativo ? `Remover filtro "${label}"` : `Filtrar por ${label}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 8,
        border: `1.5px solid ${ativo ? cor : "#e0e0e0"}`,
        background: ativo ? `${cor}14` : "#fff",
        cursor: "pointer",
        minWidth: 65,
      }}
    >
      <span
        style={{ fontSize: 14, fontWeight: 800, color: cor, lineHeight: 1 }}
      >
        {valor}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: cor, marginTop: 2 }}>
        {label}
      </span>
    </button>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

function DiariasEscalasContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tetoId = Number(params?.get("tetoId"));
  const operacaoId = Number(params?.get("operacaoId"));
  const [editandoEscala, setEditandoEscala] = useState<Escala | null>(null);
  const { user: usuarioLogado } = useCurrentUser();

  // ─── Funções Utilitárias ─────────────────────────────────────────────────────
  const formatarData = (data: string): string => {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const formatarTelefone = (telefone: string | undefined | null): string => {
    if (!telefone) return "-";
    const tel = String(telefone).replace(/\D/g, "");
    if (tel.length === 11)
      return tel.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (tel.length === 10)
      return tel.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return telefone;
  };

  const formatarHora = (hora: string) => {
    if (!hora) return "-";
    return hora.substring(0, 5);
  };

  // ─── API ─────────────────────────────────────────────────────────────────────
  const { data: tetos } = useApi<Teto[]>(`/api/tetos?sistema=DIARIAS`, [
    tetoId,
  ]);

  const {
    data: operacao,
    loading: loadingOperacao,
    error: operacaoError,
  } = useApi<Operacao>(operacaoId ? `/api/operacao/${operacaoId}` : "", [
    operacaoId,
  ]);

  const teto = tetos?.find((t) => t.id === tetoId);
  const tetoReferencia = operacao?.evento?.teto || teto;

  // ── Compartilhamento: quem sou eu nesta operação? ──────────────────────────
  const { data: omesCompartilhadas } = useApi<
    { id: number; nomeOme: string }[]
  >(operacaoId ? `/api/operacao/${operacaoId}/compartilhamento` : "", [
    operacaoId,
  ]);
  const compartilhadas = omesCompartilhadas ?? [];

  const tipoUsuario = Number(usuarioLogado?.typeUser);
  const minhaOmeId = Number((usuarioLogado as any)?.omeId);
  const ehAdmin =
    tipoUsuario === UserType.MASTER || tipoUsuario === UserType.TECNICO;
  const omeDonaId = operacao?.evento?.ome?.id;
  const ehDono = ehAdmin || (omeDonaId != null && minhaOmeId === omeDonaId);
  const ehParticipante =
    !ehDono && compartilhadas.some((o) => o.id === minhaOmeId);
  const eventoAberto = operacao?.evento?.status_evento === "CRIADO";

  const podePreencher = (e: Escala) =>
    !!e.isVagaAberta &&
    (ehDono || (ehParticipante && e.omeDestinoId === minhaOmeId));
  const podeSubstituir = (e: Escala) =>
    !e.isVagaAberta && ehParticipante && e.omeDestinoId === minhaOmeId;

  // ─── Estados do formulário ───────────────────────────────────────────────────
  const [matricula, setMatricula] = useState("");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [buscaUsuarioError, setBuscaUsuarioError] = useState<string | null>(
    null,
  );
  const [selectedCargo, setSelectedCargo] = useState("");
  const [selectedViatura, setSelectedViatura] = useState<number | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [localApresentacao, setLocalApresentacao] = useState("");
  const [situacao, setSituacao] = useState("");
  const [anotacoes, setAnotacoes] = useState("");
  const [searchText, setSearchText] = useState("");
  const [tabelaEscalas, setTabelaEscalas] = useState<Escala[]>([]);

  // ── Vagas em aberto ────────────────────────────────────────────────────────
  const [modoVaga, setModoVaga] = useState(false);
  const [vagaOmeDestino, setVagaOmeDestino] = useState<number | "">("");
  const [vagaTipo, setVagaTipo] = useState<"O" | "P" | "">("");
  const [escalaAcao, setEscalaAcao] = useState<{
    tipo: "preencher" | "substituir";
    escala: Escala;
  } | null>(null);

  const editandoVaga = !!editandoEscala?.isVagaAberta;
  const emVaga = modoVaga || editandoVaga;
  const emAcao = !!escalaAcao;
  const formSomenteLeitura = ehParticipante && !emAcao;
  const camposTravados = emAcao || formSomenteLeitura;
  const viaturaHabilitada =
    !emVaga && !formSomenteLeitura && escalaAcao?.tipo !== "substituir";
  const podeUsarVaga =
    ehDono && compartilhadas.length > 0 && !editandoEscala && !emAcao;

  const isEditandoRef = useRef(false);
  const isLimpandoAposAdicionarRef = useRef(false);
  const localApresentacaoAtualRef = useRef("");
  useEffect(() => {
    localApresentacaoAtualRef.current = localApresentacao;
  }, [localApresentacao]);

  const [gerandoPdf, setGerandoPdf] = useState(false);

  // ── Mapa das presenças ─────────────────────────────────────────────────────
  const [mapa, setMapa] = useState<{
    titulo: string;
    pontos: PontoPresenca[];
  } | null>(null);

  function escalaParaPonto(e: Escala): PontoPresenca | null {
    if (e.presencaLatitude == null || e.presencaLongitude == null) return null;
    return {
      id: e.id,
      nome: `${e.pg_escala} ${e.ng_escala}`,
      latitude: e.presencaLatitude,
      longitude: e.presencaLongitude,
      hora: e.presencaConfirmadaEm
        ? new Date(e.presencaConfirmadaEm).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    };
  }

  function abrirMapaIndividual(e: Escala) {
    const ponto = escalaParaPonto(e);
    if (!ponto) return;
    setMapa({ titulo: "Local da presença", pontos: [ponto] });
  }

  // ── Contadores/filtros no topo da tabela ──────────────────────────────────
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>(null);
  const [filtro24h, setFiltro24h] = useState(false);

  const { data: escalasData } = useApi<EscalaOperacaoResponse>(
    operacaoId ? `/api/escala?operacaoId=${operacaoId}` : "",
    [operacaoId],
  );

  const { data: viaturas } = useApi<Viatura[]>(
    operacaoId ? `/api/viatura?operacaoId=${operacaoId}` : "",
    [operacaoId],
  );

  // ── Quem já ocupa a viatura escolhida em horário que sobrepõe o do formulário ──
  const ocupantesViatura = useMemo(() => {
    if (!selectedViatura) return null;
    const novo = intervaloEmMinutos(dataInicio, horaInicio, horaFim);
    if (!novo) return null;

    return tabelaEscalas.filter((e) => {
      if ((e.viaturaId ?? e.viatura?.id) !== selectedViatura) return false;
      if (editandoEscala && e.id === editandoEscala.id) return false;
      const iv = intervaloEmMinutos(e.dataInicio, e.horaInicio, e.horaFim);
      return !!iv && iv[0] < novo[1] && novo[0] < iv[1];
    });
  }, [
    selectedViatura,
    dataInicio,
    horaInicio,
    horaFim,
    tabelaEscalas,
    editandoEscala,
  ]);

  const patrimonioSelecionado = viaturas?.find(
    (v) => v.id === selectedViatura,
  )?.patrimonio;

  const SISTEMA = "DIARIAS";

  // Datas permitidas: período do teto de Diárias
  const formatDateToInput = (date?: string) => {
    if (!date) return "";
    if (date.includes("-")) return date.slice(0, 10);
    if (date.includes("/")) {
      const [dia, mes, ano] = date.split("/");
      if (!dia || !mes || !ano) return "";
      return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    }
    return "";
  };
  const minDate = formatDateToInput(tetoReferencia?.data_inicio);
  const maxDateStr = formatDateToInput(tetoReferencia?.data_fim);

  const totalCotasOficiais = tabelaEscalas
    .filter((e) => e.tipo_escala === "O")
    .reduce((sum, e) => sum + e.cota_escala, 0);

  const totalCotasPracas = tabelaEscalas
    .filter((e) => e.tipo_escala === "P")
    .reduce((sum, e) => sum + e.cota_escala, 0);

  useEffect(() => {
    if (escalasData) setTabelaEscalas(escalasData.escalas);
  }, [escalasData]);

  const camposObrigatoriosFaltando = (): string[] => {
    const faltando: string[] = [];
    if (modoVaga) {
      if (!vagaOmeDestino) faltando.push("OME de destino");
      if (!vagaTipo) faltando.push("Tipo da vaga (Oficial/Praça)");
    } else if (!usuario && !editandoEscala) {
      faltando.push("Matrícula");
    }
    if (!dataInicio) faltando.push("Data de Início");
    if (!horaInicio) faltando.push("Hora de Início");
    if (!horaFim) faltando.push("Hora de Término");
    if (!localApresentacao) faltando.push("Local de Apresentação");
    if (!selectedCargo) faltando.push("Função");
    return faltando;
  };

  const canAddEscala =
    (!!usuario || !!editandoEscala || modoVaga) &&
    !!dataInicio &&
    !!horaInicio &&
    !!horaFim &&
    !!localApresentacao &&
    !!selectedCargo &&
    !loadingUsuario &&
    !formSomenteLeitura;

  // ── Base da tabela: filtro "somente 24h" (hora início === hora fim) ────────
  const escalasBase = filtro24h
    ? tabelaEscalas.filter(
        (e) => !!e.horaInicio && !!e.horaFim && e.horaInicio === e.horaFim,
      )
    : tabelaEscalas;

  const preenchidasBase = escalasBase.filter((e) => !e.isVagaAberta);
  const totalVagas = escalasBase.length - preenchidasBase.length;
  const totalEscalados = preenchidasBase.length;
  const totalPresentes = preenchidasBase.filter(
    (e) => e.presencaConfirmada,
  ).length;
  const totalAusentes = totalEscalados - totalPresentes;

  const filteredEscalas = escalasBase.filter((escala) => {
    if (filtroStatus === "VAGA") {
      if (!escala.isVagaAberta) return false;
    } else if (filtroStatus && escala.isVagaAberta) {
      return false;
    }
    if (filtroStatus === "PRESENTE" && !escala.presencaConfirmada) return false;
    if (filtroStatus === "AUSENTE" && escala.presencaConfirmada) return false;

    if (!searchText.trim()) return true;
    const term = searchText.toLowerCase();
    return [
      escala.mat_escala ?? "",
      escala.pg_escala ?? "",
      escala.ng_escala ?? "",
      escala.nomeome_escala ?? "",
      escala.cpf_escala ?? "",
      escala.phone ?? "",
      escala.dataInicio,
      formatarData(escala.dataInicio),
      escala.horaInicio,
      escala.horaFim,
      escala.localApresentacao,
      escala.funcao,
      escala.situacao,
      escala.anotacoes || "",
      escala.obsVerificador1 || "",
      escala.obsVerificador2 || "",
      escala.omeDestinoNome ?? "",
      escala.isVagaAberta ? "vaga em aberto" : "",
    ]
      .map((value) => String(value).toLowerCase())
      .some((value) => value.includes(term));
  });

  const pontosDaTabela = filteredEscalas
    .map(escalaParaPonto)
    .filter((p): p is PontoPresenca => p !== null);

  function abrirMapaGeral() {
    setMapa({ titulo: "Locais das presenças", pontos: pontosDaTabela });
  }

  // Agrupa por data mantendo a ordem do backend
  const gruposPorData = Array.from(
    filteredEscalas.reduce((map, escala) => {
      const key = escala.dataInicio;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(escala);
      return map;
    }, new Map<string, Escala[]>()),
  ).map(([data, escalas]) => ({ data, escalas }));

  const totalRegistros = escalasBase.length;
  const totalFiltrado = filteredEscalas.length;

  // ─── Busca de usuário por matrícula ──────────────────────────────────────────
  useEffect(() => {
    const raw = matricula.trim();

    if (raw.length === 0) {
      setUsuario(null);
      setBuscaUsuarioError(null);
      setSituacao("");
      if (!isLimpandoAposAdicionarRef.current) {
        setLocalApresentacao("");
      }
      isLimpandoAposAdicionarRef.current = false;
      return;
    }

    if (raw.length < 6 || raw.length > 7) {
      setUsuario(null);
      setBuscaUsuarioError(null);
      setSituacao("");
      return;
    }

    const matriculaBusca = raw.length === 6 ? `0${raw}` : raw;

    const timeout = setTimeout(async () => {
      setLoadingUsuario(true);
      setBuscaUsuarioError(null);

      try {
        const response = await fetch(
          `/api/user/search?q=${encodeURIComponent(matriculaBusca)}`,
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Matricula não existe ou está errada");
        }

        const data = await response.json();
        const found = Array.isArray(data) ? data[0] : data;

        if (!found || !found.id) {
          setUsuario(null);
          setSituacao("");
          setBuscaUsuarioError("Usuário não encontrado");
          if (!localApresentacaoAtualRef.current.trim())
            setLocalApresentacao("");
          return;
        }

        setUsuario(found);

        if (!isEditandoRef.current) {
          setSituacao(found.situacao ?? "");
          if (!localApresentacaoAtualRef.current.trim()) {
            setLocalApresentacao(found.localApresentacao ?? "");
          }
        }
        isEditandoRef.current = false;
      } catch (error: any) {
        setUsuario(null);
        setSituacao("");
        setBuscaUsuarioError(
          error?.message || "Matricula não existe ou está errada",
        );
        if (!localApresentacaoAtualRef.current.trim()) setLocalApresentacao("");
      } finally {
        setLoadingUsuario(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [matricula]);

  // ─── Adicionar / editar escala ───────────────────────────────────────────────
  async function handleAddEscala() {
    if (formSomenteLeitura) {
      toast.error("Você só pode preencher vagas destinadas à sua OME");
      return;
    }
    const faltando = camposObrigatoriosFaltando();
    if (faltando.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${faltando.join(", ")}`);
      return;
    }

    if (!operacaoId || !operacao) return;
    if (escalaAcao) return handleAcaoVaga();
    if (modoVaga) return handleCriarVaga();

    const isEdicao = !!editandoEscala;
    const url = isEdicao ? `/api/escala/${editandoEscala.id}` : "/api/escala";
    const method = isEdicao ? "PATCH" : "POST";

    const body = isEdicao
      ? {
          dataInicio,
          horaInicio,
          horaFim,
          localApresentacao,
          funcao: selectedCargo,
          situacao,
          anotacoes,
          viaturaId: selectedViatura ?? null,
          ...(usuario && !editandoVaga && { usuarioId: usuario.id }),
        }
      : {
          sistema: SISTEMA,
          operacaoId,
          usuarioId: usuario!.id,
          dataInicio,
          horaInicio,
          horaFim,
          localApresentacao,
          funcao: selectedCargo,
          situacao,
          anotacoes,
          viaturaId: selectedViatura ?? undefined,
        };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Erro ao salvar escala",
        );
      }

      if (isEdicao) {
        setTabelaEscalas((prev) =>
          prev.map((e) => (e.id === editandoEscala.id ? data : e)),
        );
        toast.success("Escala atualizada com sucesso!");
        resetarFormulario();
      } else {
        setTabelaEscalas((prev) => [data, ...prev]);
        toast.success("Escala adicionada com sucesso!");
        isLimpandoAposAdicionarRef.current = true;
        setMatricula("");
      }
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível salvar a escala");
    }
  }

  function limparMatriculaPreservandoCampos() {
    if (matricula !== "") isLimpandoAposAdicionarRef.current = true;
    setMatricula("");
  }

  function resetarFormulario() {
    setEditandoEscala(null);
    setEscalaAcao(null);
    setModoVaga(false);
    setVagaOmeDestino("");
    setVagaTipo("");
    setMatricula("");
    setDataInicio("");
    setHoraInicio("");
    setHoraFim("");
    setSelectedCargo("");
    setSelectedViatura(null);
    setLocalApresentacao("");
    setSituacao("");
    setAnotacoes("");
  }

  function mensagemDeErro(data: any, padrao: string) {
    if (Array.isArray(data?.message)) return data.message.join(", ");
    return data?.message || padrao;
  }

  async function handleCriarVaga() {
    if (!operacaoId) return;

    try {
      const response = await fetch("/api/escala/vaga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sistema: SISTEMA,
          operacaoId,
          omeDestinoId: vagaOmeDestino,
          tipoEscala: vagaTipo,
          dataInicio,
          horaInicio,
          horaFim,
          localApresentacao,
          funcao: selectedCargo,
          situacao: situacao || undefined,
          anotacoes: anotacoes || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(mensagemDeErro(data, "Erro ao criar vaga"));
      }

      setTabelaEscalas((prev) => [data, ...prev]);
      toast.success("Vaga criada com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível criar a vaga");
    }
  }

  function iniciarAcaoVaga(escala: Escala, tipo: "preencher" | "substituir") {
    setEditandoEscala(null);
    setModoVaga(false);
    setEscalaAcao({ tipo, escala });

    limparMatriculaPreservandoCampos();
    setUsuario(null);

    setDataInicio(escala.dataInicio);
    setHoraInicio(escala.horaInicio);
    setHoraFim(escala.horaFim);
    setLocalApresentacao(escala.localApresentacao);
    setSituacao(escala.situacao);
    setAnotacoes(escala.anotacoes ?? "");
    setSelectedCargo(escala.funcao);
    setSelectedViatura(
      tipo === "substituir" ? (escala.viaturaId ?? null) : null,
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleAcaoVaga() {
    if (!escalaAcao || !usuario) return;
    const { tipo, escala } = escalaAcao;

    if (tipo === "substituir") {
      const ok = confirm(
        "Substituir o policial desta escala? A presença, a saída e as verificações já registradas serão zeradas.",
      );
      if (!ok) return;
    }

    const url = `/api/escala/${escala.id}/${tipo === "preencher" ? "preencher" : "substituir"}`;
    const body =
      tipo === "preencher"
        ? {
            usuarioId: usuario.id,
            ...(selectedViatura ? { viaturaId: selectedViatura } : {}),
          }
        : { usuarioId: usuario.id };

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(mensagemDeErro(data, "Erro ao salvar"));
      }

      setTabelaEscalas((prev) =>
        prev.map((e) => (e.id === escala.id ? data : e)),
      );
      toast.success(
        tipo === "preencher"
          ? "Vaga preenchida com sucesso!"
          : "Policial substituído com sucesso!",
      );
      resetarFormulario();
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível concluir a operação");
    }
  }

  async function handleExcluirEscala(id: number) {
    const ok = confirm("Deseja realmente excluir este registro?");
    if (!ok) return;

    try {
      const response = await fetch(`/api/escala/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || "Erro ao excluir");
      }

      setTabelaEscalas((prev) => prev.filter((e) => e.id !== id));
      toast.success("Escala excluída com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível excluir");
    }
  }

  function handleEditarEscala(escala: Escala) {
    setModoVaga(false);
    setEscalaAcao(null);
    if (escala.isVagaAberta) {
      if (matricula !== "") isLimpandoAposAdicionarRef.current = true;
    } else {
      isEditandoRef.current = true;
    }
    setEditandoEscala(escala);
    setMatricula(escala.mat_escala ?? "");
    setDataInicio(escala.dataInicio);
    setHoraInicio(escala.horaInicio);
    setHoraFim(escala.horaFim);
    setLocalApresentacao(escala.localApresentacao);
    setSituacao(escala.situacao);
    setAnotacoes(escala.anotacoes ?? "");
    setSelectedCargo(escala.funcao);
    setSelectedViatura(escala.viaturaId ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDownloadPdf() {
    if (!operacaoId || gerandoPdf) return;

    setGerandoPdf(true);
    const toastId = toast.loading("Gerando PDF, aguarde...");

    try {
      const response = await fetch(`/api/escala/pdf?operacaoId=${operacaoId}`);
      if (!response.ok) throw new Error("Erro ao gerar PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const disposition = response.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      a.download = match?.[1] ?? `escala_op${operacaoId}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF gerado com sucesso!", { id: toastId });
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível gerar o PDF", {
        id: toastId,
      });
    } finally {
      setGerandoPdf(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ overflowX: "hidden", overflowY: "auto" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            display: "flex",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={() => router.back()}
        >
          <FiArrowLeft size={20} />
          <span>Voltar</span>
        </span>
        <h1 className="h1PjesEscalas">
          DIARIAS |{" "}
          {teto?.data_inicio
            ? new Date(teto.data_inicio).toLocaleDateString("pt-BR")
            : ""}{" "}
          a{" "}
          {teto?.data_fim
            ? new Date(teto.data_fim).toLocaleDateString("pt-BR")
            : ""}
        </h1>
      </div>

      <div style={{ display: "flex", width: "100%" }}>
        {/* inicio Card Policial Escalado */}
        <div className="divPolicialEscalado">
          {/* ESQUERDA */}
          <div className="policialLeft">
            {formSomenteLeitura && (
              <div
                style={{
                  background: "#eef2ff",
                  color: "#3730a3",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 11,
                  marginBottom: 8,
                }}
              >
                Esta operação foi compartilhada com a sua OME. Use{" "}
                <strong>Preencher</strong> nas vagas destinadas a você ou{" "}
                <strong>Substituir</strong> nos registros da sua OME.
              </div>
            )}

            {escalaAcao && (
              <div
                style={{
                  background: "#fff7e6",
                  color: "#92400e",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 11,
                  marginBottom: 8,
                }}
              >
                {escalaAcao.tipo === "preencher" ? (
                  <>
                    <strong>Preenchendo vaga</strong> de{" "}
                    {escalaAcao.escala.tipo_escala === "O"
                      ? "Oficial"
                      : "Praça"}{" "}
                    ({escalaAcao.escala.funcao}). Informe a matrícula.
                  </>
                ) : (
                  <>
                    <strong>Substituindo</strong> {escalaAcao.escala.pg_escala}{" "}
                    {escalaAcao.escala.ng_escala}. Presença, saída e
                    verificações serão zeradas.
                  </>
                )}
              </div>
            )}

            {podeUsarVaga && (
              <button
                type="button"
                onClick={() => {
                  setModoVaga((v) => !v);
                  setVagaOmeDestino("");
                  setVagaTipo("");
                  setSelectedViatura(null);
                  limparMatriculaPreservandoCampos();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: "100%",
                  justifyContent: "center",
                  padding: "6px 8px",
                  marginBottom: 8,
                  borderRadius: 8,
                  border: "1px solid #4f46e5",
                  background: modoVaga ? "#4f46e5" : "transparent",
                  color: modoVaga ? "#fff" : "#4f46e5",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <FaLink />
                {modoVaga
                  ? "Voltar ao cadastro de policial"
                  : "Criar vaga para outra OME"}
              </button>
            )}

            {modoVaga && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                <span className="field-label">OME de destino</span>
                <select
                  className="field-input"
                  value={vagaOmeDestino}
                  onChange={(e) =>
                    setVagaOmeDestino(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                >
                  <option value="">Selecione</option>
                  {compartilhadas.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nomeOme}
                    </option>
                  ))}
                </select>

                <span className="field-label">Tipo da vaga</span>
                <select
                  className="field-input"
                  value={vagaTipo}
                  onChange={(e) =>
                    setVagaTipo(e.target.value as "O" | "P" | "")
                  }
                >
                  <option value="">Selecione</option>
                  <option value="O">Oficial</option>
                  <option value="P">Praça</option>
                </select>

                <small style={{ color: "#666" }}>
                  A vaga já reserva a cota da operação. A OME de destino informa
                  a matrícula depois.
                </small>
              </div>
            )}

            {editandoVaga && editandoEscala && (
              <div
                style={{
                  background: "#fff7e6",
                  color: "#92400e",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 11,
                }}
              >
                <strong>VAGA EM ABERTO</strong> (
                {editandoEscala.tipo_escala === "O" ? "Oficial" : "Praça"}) ·
                destino: {editandoEscala.omeDestinoNome ?? "-"}. Para escolher o
                policial use o botão <strong>Preencher</strong> na tabela.
              </div>
            )}

            {!emVaga && (
              <>
                <div className="divImgInoutMat">
                  <div className="usuarioImgEscala">
                    {!matricula || loadingUsuario || !usuario?.imagemUrl ? (
                      <FaUser className="usuarioIcon" />
                    ) : (
                      <img
                        src={usuario.imagemUrl}
                        alt="Usuário"
                        className="usuarioImgEscala"
                      />
                    )}
                  </div>
                  <div className="matpolicial">
                    <input
                      type="text"
                      className="inputDadosEscala"
                      placeholder="matricula"
                      disabled={formSomenteLeitura}
                      value={matricula}
                      maxLength={7}
                      onChange={(e) =>
                        setMatricula(e.target.value.replace(/\D/g, ""))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddEscala();
                        }
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{ fontSize: "11px", width: "100%", marginTop: "10px" }}
                >
                  {loadingUsuario && <div>Buscando usuário...</div>}
                  {!loadingUsuario && usuario && (
                    <>
                      <div>
                        <strong>
                          <FaUser /> {usuario.pg} {usuario.nomeGuerra}{" "}
                          {usuario.ome?.nomeOme ?? ""}
                        </strong>
                      </div>
                      <div>
                        <FaPhone /> {usuario.phone || "Telefone não informado"}
                      </div>
                      <div>
                        <FaBarcode /> {usuario.nunfunc} | {usuario.nunvinc}
                      </div>
                      <div>
                        <FaTriangleExclamation />{" "}
                        <strong>{usuario.situacao}</strong>
                      </div>
                    </>
                  )}
                  {!loadingUsuario && !usuario && (
                    <div style={{ color: "#555" }}>
                      Digite a matrícula para carregar o usuário.
                    </div>
                  )}
                  {buscaUsuarioError && (
                    <div style={{ color: "red", marginTop: "4px" }}>
                      {buscaUsuarioError}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* DIREITA */}
          <div className="policialRight">
            <div className="escala-form">
              <div className="escala-row">
                <div className="field-group">
                  <span className="field-label">Data de início</span>
                  <input
                    className="field-input"
                    type="date"
                    disabled={camposTravados}
                    value={dataInicio}
                    min={minDate}
                    max={maxDateStr}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        minDate &&
                        maxDateStr &&
                        (value < minDate || value > maxDateStr)
                      )
                        return;
                      setDataInicio(value);
                    }}
                  />
                </div>

                <div className="field-group">
                  <span className="field-label">Início</span>
                  <input
                    className="field-input field-input--time"
                    disabled={camposTravados}
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <span className="field-label">Término</span>
                  <input
                    className="field-input field-input--time"
                    disabled={camposTravados}
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                  />
                </div>

                <div className="field-group field-group--grow">
                  <span className="field-label">Local de apresentação</span>
                  <input
                    className="field-input"
                    type="text"
                    value={localApresentacao}
                    disabled={camposTravados}
                    onChange={(e) => setLocalApresentacao(e.target.value)}
                    placeholder="Informe o local..."
                  />
                </div>
              </div>

              <div className="escala-divider" />

              <div className="escala-row escala-row--gap">
                <div className="escala-cargo-section">
                  <p className="section-title">Função</p>
                  <div className="cargo-grid">
                    {CARGOS.map((cargo) => (
                      <button
                        key={cargo}
                        type="button"
                        disabled={camposTravados}
                        className={`cargo-btn${selectedCargo === cargo ? " cargo-btn--active" : ""}`}
                        onClick={() =>
                          setSelectedCargo(selectedCargo === cargo ? "" : cargo)
                        }
                      >
                        {cargo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="escala-viatura-section">
                  <p className="section-title">
                    <FaCar
                      style={{ verticalAlign: "-2px", marginRight: "5px" }}
                    />
                    Viatura
                  </p>
                  <select
                    className="field-input"
                    value={selectedViatura ?? ""}
                    disabled={!viaturaHabilitada}
                    onChange={(e) =>
                      setSelectedViatura(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  >
                    <option value="">— Sem viatura —</option>
                    {viaturas?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.patrimonio}{" "}
                        {v.statusVtr === "INDISPONIVEL" ? "⚠️" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="escala-divider" />

              <div className="field-group">
                <span className="field-label">Anotações</span>
                <textarea
                  className="field-input field-input--textarea"
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  placeholder="Observações ou informações adicionais..."
                  disabled={camposTravados}
                />
              </div>
            </div>
          </div>
        </div>
        {/* fim Card Policial Escalado */}

        <div className="divOperacao" style={{ display: "grid" }}>
          {/* inicio Card dados da Operação */}
          <div style={{ width: "100%" }}>
            <div className="divOperacaoSelecionado">
              {loadingOperacao && <div>Carregando operação...</div>}
              {operacaoError && (
                <div className="errorMessage">
                  Erro ao carregar operação: {operacaoError}
                </div>
              )}
              {operacao && (
                <div className="cardOperacaoSelecionado">
                  <div className="operacaoLeft">
                    {tetoReferencia?.imagemUrl && (
                      <img
                        src={tetoReferencia.imagemUrl}
                        alt={tetoReferencia.nome_verba}
                      />
                    )}
                    <div className="nomeVerba">
                      {tetoReferencia?.nome_verba || "Teto não disponível"}
                    </div>
                  </div>

                  <div className="operacaoRight">
                    <div className="nomeOperacao">
                      {operacao.ome?.nomeOme} | {operacao.evento?.nome_evento},{" "}
                      {operacao.nome_operacao} | COP: {operacao.cod_op}
                    </div>

                    {compartilhadas.length > 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#4f46e5",
                          marginTop: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <FaLink size={10} />
                        Compartilhada com:{" "}
                        {compartilhadas.map((o) => o.nomeOme).join(", ")}
                      </div>
                    )}

                    <div className="cotasOperacaoBox">
                      <div>
                        <div>
                          <div>
                            <FiStar />
                          </div>
                          <div>OFICIAIS</div>
                        </div>
                        <strong>
                          {operacao.qtd_oficiais_oper} | {totalCotasOficiais}
                        </strong>
                      </div>

                      <div>
                        <div>
                          <div>
                            <FiChevronUp />
                          </div>
                          <div>PRAÇAS</div>
                        </div>
                        <strong>
                          {operacao.qtd_pracas_oper} | {totalCotasPracas}
                        </strong>
                      </div>

                      {operacao?.evento?.status_evento !== "CRIADO" ? (
                        <div style={{ width: "100%" }}>
                          <div
                            style={{
                              padding: "4px",
                              width: "45px",
                              height: "45px",
                              borderRadius: "50px",
                              alignItems: "center",
                              marginTop: "5px",
                              background: "#db0f0f",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <FaLock size={22} color="white" />
                          </div>
                        </div>
                      ) : (
                        <div style={{ width: "50%" }}>
                          <div
                            style={{
                              padding: "4px",
                              width: "45px",
                              height: "45px",
                              borderRadius: "50px",
                              alignItems: "center",
                              marginTop: "5px",
                              background: "#11b81e",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <FaLockOpen size={22} color="white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* fim Card dados da Operação */}

          <div>
            <button
              className="botaoCriarEscala"
              type="button"
              onClick={handleAddEscala}
              style={{
                opacity: canAddEscala ? 1 : 0.5,
                cursor: canAddEscala ? "pointer" : "not-allowed",
              }}
            >
              {loadingUsuario
                ? "BUSCANDO..."
                : escalaAcao?.tipo === "preencher"
                  ? "PREENCHER VAGA"
                  : escalaAcao?.tipo === "substituir"
                    ? "SUBSTITUIR POLICIAL"
                    : modoVaga
                      ? "CRIAR VAGA"
                      : editandoEscala
                        ? "SALVAR ALTERAÇÕES"
                        : "ADICIONAR POLICIAL"}
            </button>

            {(editandoEscala || escalaAcao) && (
              <button
                className="botaoCancelarEscala"
                type="button"
                onClick={resetarFormulario}
              >
                CANCELAR
              </button>
            )}
          </div>

          {ocupantesViatura && (
            <VtrOcupacao
              ocupantes={ocupantesViatura}
              cargo={selectedCargo}
              novoNome={
                usuario
                  ? `${usuario.pg} ${usuario.nomeGuerra}`
                  : "Novo policial"
              }
              patrimonio={patrimonioSelecionado}
            />
          )}
        </div>
      </div>

      {/* inicio escalas */}
      <div className="divPjesEscalas">
        <div style={{ width: "100%" }}>
          <div className="divtitleEscalaServico">
            <div className="divCriarEscala">
              <h4>ESCALA DE SERVIÇO</h4>
            </div>
          </div>

          {/* ── Contadores + filtro 24h + busca + ações ── */}
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: 7,
              flexWrap: "nowrap",
              margin: "4px 0 5px",
            }}
          >
            <ResumoBox
              label="Total"
              valor={totalEscalados}
              cor="#16a34a"
              ativo={filtroStatus === null}
              onClick={() => setFiltroStatus(null)}
            />

            <ResumoBox
              label="Presente"
              valor={totalPresentes}
              cor="#2563eb"
              ativo={filtroStatus === "PRESENTE"}
              onClick={() =>
                setFiltroStatus((prev) =>
                  prev === "PRESENTE" ? null : "PRESENTE",
                )
              }
            />

            <ResumoBox
              label="Ausente"
              valor={totalAusentes}
              cor="#dc2626"
              ativo={filtroStatus === "AUSENTE"}
              onClick={() =>
                setFiltroStatus((prev) =>
                  prev === "AUSENTE" ? null : "AUSENTE",
                )
              }
            />

            {totalVagas > 0 && (
              <ResumoBox
                label="Vagas"
                valor={totalVagas}
                cor="#d97706"
                ativo={filtroStatus === "VAGA"}
                onClick={() =>
                  setFiltroStatus((prev) => (prev === "VAGA" ? null : "VAGA"))
                }
              />
            )}

            <button
              onClick={() => setFiltro24h((v) => !v)}
              aria-pressed={filtro24h}
              title="Mostrar só serviços de 24h (hora de início = hora de término)"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #9c71e7",
                background: filtro24h ? "#7c3aed" : "transparent",
                color: filtro24h ? "#fff" : "#7c3aed",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <FaRegClock />
              24h
            </button>

            <div
              style={{
                flex: "1 1 0",
                minWidth: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <input
                className="inputBuscarEscalaPrincipal"
                type="text"
                placeholder="Buscar"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 5,
                marginLeft: "auto",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#555",
                  whiteSpace: "nowrap",
                }}
              >
                {totalFiltrado !== totalRegistros
                  ? `${totalFiltrado} de ${totalRegistros} registro${
                      totalRegistros !== 1 ? "s" : ""
                    }`
                  : `${totalRegistros} registro${
                      totalRegistros !== 1 ? "s" : ""
                    }`}
              </span>

              <button
                onClick={handleDownloadPdf}
                disabled={gerandoPdf}
                title="Baixar PDF da escala"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  height: 32,
                  boxSizing: "border-box",
                  borderRadius: 8,
                  border: "1px solid #e53935",
                  background: gerandoPdf ? "#f5f5f5" : "#fff",
                  color: gerandoPdf ? "#aaa" : "#e53935",
                  fontWeight: 600,
                  fontSize: 10,
                  cursor: gerandoPdf ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: gerandoPdf
                    ? "none"
                    : "0 1px 4px rgba(229,57,53,0.15)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <FaFilePdf style={{ fontSize: 16 }} />
                {gerandoPdf ? "Gerando..." : "Gerar PDF"}
              </button>

              <button
                onClick={abrirMapaGeral}
                disabled={pontosDaTabela.length === 0}
                title="Ver no mapa onde cada policial deu a presença"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  height: 32,
                  boxSizing: "border-box",
                  borderRadius: 8,
                  border: "1px solid #2563eb",
                  background: "#fff",
                  color: pontosDaTabela.length === 0 ? "#aaa" : "#2563eb",
                  fontWeight: 600,
                  fontSize: 10,
                  cursor:
                    pontosDaTabela.length === 0 ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <FaMapMarkerAlt style={{ fontSize: 16 }} />
                Mapa ({pontosDaTabela.length})
              </button>

              <div
                style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
              >
                <UploadEscalaPlanilha />
              </div>
            </div>
          </div>

          <div className="tabelaEscalasWrapper">
            <table className="tabelaEscalas">
              <thead className="tabelaEscalasThead">
                <tr className="tabelaHeaderEscalas">
                  <th className="colData">DATA</th>
                  <th>IDENTIFICAÇÃO</th>
                  <th>TELEFONE</th>
                  <th>HORA</th>
                  <th>APRESENTAÇÃO</th>
                  <th>FUNÇÃO | COTA</th>
                  <th>VIATURA</th>
                  <th>ANOTAÇÕES</th>
                  <th>PRESENÇA</th>
                  <th>1º FISCAL</th>
                  <th>2º FISCAL</th>
                  <th>SAÍDA</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {gruposPorData.length > 0 ? (
                  gruposPorData.map((grupo) =>
                    grupo.escalas.map((escala, idx) => (
                      <tr
                        key={escala.id}
                        className="tabelaLinhaEscalas"
                        style={
                          escala.isVagaAberta
                            ? { background: "#fff7e6" }
                            : undefined
                        }
                      >
                        {idx === 0 && (
                          <td
                            className="colData"
                            rowSpan={grupo.escalas.length}
                          >
                            <div className="colDataConteudo">
                              <span className="colDataValor">
                                {formatarData(grupo.data)}
                              </span>
                            </div>
                          </td>
                        )}

                        <td style={{ textAlign: "left" }}>
                          {escala.isVagaAberta ? (
                            <span style={{ color: "#b45309", fontWeight: 700 }}>
                              VAGA EM ABERTO ·{" "}
                              {escala.tipo_escala === "O" ? "Oficial" : "Praça"}
                              {" · destino: "}
                              {escala.omeDestinoNome ?? "-"}
                            </span>
                          ) : (
                            <>
                              {escala.pg_escala} {escala.mat_escala}{" "}
                              {escala.ng_escala} {escala.nomeome_escala} -{" "}
                              {escala.situacao}
                              {escala.omeDestinoNome && (
                                <div style={{ fontSize: 9, color: "#4f46e5" }}>
                                  <FaLink size={8} /> escalado por{" "}
                                  {escala.omeDestinoNome}
                                </div>
                              )}
                            </>
                          )}
                        </td>

                        <td>{formatarTelefone(escala.phone)}</td>

                        <td>
                          {formatarHora(escala.horaInicio)} às{" "}
                          {formatarHora(escala.horaFim)}
                        </td>

                        <td>{escala.localApresentacao}</td>
                        <td>
                          {escala.funcao} | {escala.cota_escala} Ct
                        </td>
                        <td>
                          {escala.viatura
                            ? `${escala.viatura.patrimonio} ${escala.viatura.statusVtr === "INDISPONIVEL" ? "⚠️" : ""}`
                            : "-"}
                        </td>
                        <td>{escala.anotacoes || "-"}</td>
                        <td>
                          <StatusCell
                            confirmado={escala.presencaConfirmada}
                            nome={escala.presencaConfirmadaPorNome}
                            dataHora={escala.presencaConfirmadaEm}
                          />
                        </td>
                        <td>
                          <StatusCell
                            confirmado={escala.primeiraVerificacao}
                            nome={escala.verificador1Nome}
                            dataHora={escala.dataHoraVerificador1}
                            obs={escala.obsVerificador1}
                          />
                        </td>
                        <td>
                          <StatusCell
                            confirmado={escala.segundaVerificacao}
                            nome={escala.verificador2Nome}
                            dataHora={escala.dataHoraVerificador2}
                            obs={escala.obsVerificador2}
                          />
                        </td>
                        <td>
                          <StatusCell
                            confirmado={escala.saidaConfirmada}
                            nome={escala.saidaConfirmadaPorNome}
                            dataHora={escala.saidaConfirmadaEm}
                            extra={
                              escala.saidaAutomatica ? "automático" : undefined
                            }
                          />
                        </td>
                        <td style={{ padding: "3px" }}>
                          <FaMapMarkerAlt
                            size={15}
                            color={
                              escala.presencaLatitude != null
                                ? "#2563eb"
                                : "#ccc"
                            }
                            style={{
                              cursor:
                                escala.presencaLatitude != null
                                  ? "pointer"
                                  : "default",
                              marginRight: "3px",
                            }}
                            title={
                              escala.presencaLatitude != null
                                ? "Ver local da presença"
                                : "Sem localização registrada"
                            }
                            onClick={() => abrirMapaIndividual(escala)}
                          />
                          <FiRefreshCcw
                            size={15}
                            color={escala.isRepasse ? "blue" : "#ccc"}
                            style={{
                              cursor: escala.isRepasse ? "pointer" : "default",
                              marginRight: "3px",
                            }}
                            title={
                              escala.isRepasse
                                ? `Repasse #${escala.repasseOrigemId}`
                                : ""
                            }
                            onClick={() => {
                              if (escala.isRepasse) {
                                toast(
                                  `🔄 Codigo do Repasse (CR): ${escala.repasseOrigemId}`,
                                  { duration: 4000 },
                                );
                              }
                            }}
                          />
                          {!ehParticipante && (
                            <>
                              <FaEdit
                                size={15}
                                color="orange"
                                style={{
                                  cursor: "pointer",
                                  alignItems: "center",
                                  marginRight: "3px",
                                }}
                                onClick={() => handleEditarEscala(escala)}
                              />
                              <FaTrash
                                size={15}
                                color="red"
                                style={{
                                  cursor: "pointer",
                                  alignItems: "center",
                                  marginRight: "3px",
                                }}
                                onClick={() => handleExcluirEscala(escala.id)}
                              />
                            </>
                          )}
                          {eventoAberto && podePreencher(escala) && (
                            <FaUserPlus
                              size={15}
                              color="#16a34a"
                              title="Preencher vaga"
                              style={{ cursor: "pointer", marginRight: "3px" }}
                              onClick={() =>
                                iniciarAcaoVaga(escala, "preencher")
                              }
                            />
                          )}
                          {eventoAberto && podeSubstituir(escala) && (
                            <FaExchangeAlt
                              size={15}
                              color="#4f46e5"
                              title="Substituir policial"
                              style={{ cursor: "pointer", marginRight: "3px" }}
                              onClick={() =>
                                iniciarAcaoVaga(escala, "substituir")
                              }
                            />
                          )}
                        </td>
                      </tr>
                    )),
                  )
                ) : (
                  <tr className="tabelaLinhaEscalas">
                    <td
                      colSpan={13}
                      style={{ textAlign: "center", padding: "18px" }}
                    >
                      Nenhuma escala cadastrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <style jsx>{`
            .tabelaEscalasWrapper {
              width: 100%;
              max-height: calc(100vh - 320px);
              min-height: 300px;
              overflow: auto;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
            }

            .tabelaEscalasThead {
              position: sticky;
              top: 0;
              z-index: 2;
            }

            .colData {
              position: sticky;
              left: 0;
              z-index: 1;
              background: #08462e;
              color: #fff;
              text-align: center;
              vertical-align: middle;
              min-width: 50px;
              border-right: 2px solid #063a25;
            }

            thead .colData {
              z-index: 3;
            }

            .colDataConteudo {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
            }

            .colDataValor {
              font-weight: 700;
              font-size: 13px;
            }

            .tabelaEscalas tbody tr.tabelaLinhaEscalas:nth-child(odd) {
              background-color: #ffffff;
            }

            .tabelaEscalas tbody tr.tabelaLinhaEscalas:nth-child(even) {
              background-color: #dfd9d9;
            }
          `}</style>
        </div>
      </div>
      {/* fim escalas */}

      <MapaPresencasModal
        open={!!mapa}
        titulo={mapa?.titulo ?? ""}
        pontos={mapa?.pontos ?? []}
        onClose={() => setMapa(null)}
      />
    </div>
  );
}

export default function DiariasEscalasPage() {
  return (
    <Suspense fallback={<div className="page">Carregando...</div>}>
      <DiariasEscalasContent />
    </Suspense>
  );
}
