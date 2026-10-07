"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { useApi } from "@/src/hooks/useApi";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { UserType } from "@/src/lib/userType";
import { FiArrowLeft, FiChevronUp, FiRefreshCcw, FiStar } from "react-icons/fi";
import {
  FaBarcode,
  FaCar,
  FaEdit,
  FaFilePdf,
  FaLock,
  FaMapMarkerAlt,
  FaLockOpen,
  FaPhone,
  FaRegClock,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { FaTriangleExclamation } from "react-icons/fa6";
import { UploadEscalaPlanilha } from "@/src/components/ui/UploadEscalaPlanilha";
import MapaPresencasModal, {
  PontoPresenca,
} from "@/src/components/ui/MapaPresencasModal";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Teto = { id: number; imagemUrl: string; nome_verba: string };
type Evento = {
  id: number;
  nome_evento: string;
  teto?: Teto;
  status_evento: string;
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

type FiltroStatus = "PRESENTE" | "AUSENTE" | null;

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
  isRepasse: boolean;
  repasseOrigemId?: number | null;
  usuarioId?: number;
  operacaoId?: number;
  viaturaId?: number | null;
  viatura?: Viatura | null;
  phone?: string | null;

  // ── Presença (confirmada pelo próprio escalado) ───────────────────────
  presencaConfirmada?: boolean;
  presencaConfirmadaEm?: string | null;
  presencaLatitude?: number | null;
  presencaLongitude?: number | null;
  presencaConfirmadaPorNome?: string | null;

  // ── Saída de serviço ──────────────────────────────────────────────────
  saidaConfirmada?: boolean;
  saidaConfirmadaEm?: string | null;
  saidaConfirmadaPorNome?: string | null;
  /** true quando o sistema fechou a saída automaticamente (cron) */
  saidaAutomatica?: boolean;

  // ── 1ª verificação (fiscal) ───────────────────────────────────────────
  primeiraVerificacao?: boolean;
  verificador1Nome?: string | null;
  dataHoraVerificador1?: string | null;
  obsVerificador1?: string | null;

  // ── 2ª verificação (fiscal) ───────────────────────────────────────────
  segundaVerificacao?: boolean;
  verificador2Nome?: string | null;
  dataHoraVerificador2?: string | null;
  obsVerificador2?: string | null;

  conta?: {
    banco: string;
    agencia: string;
    conta: string;
  } | null;
};

// ─── Helpers de formatação de data/hora curtas para as colunas de status ─────

function formatarDataHoraCurta(valor?: string | null): string {
  if (!valor) return "";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Célula de status (usada nas colunas Presença/Saída/1ª e 2ª verif.) ──────

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

// ─── Caixinha de contagem (Total/Presente/Ausente), também usada como filtro ─

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
        padding: "6px 16px",
        borderRadius: 8,
        border: `1.5px solid ${ativo ? cor : "#e0e0e0"}`,
        background: ativo ? `${cor}14` : "#fff",
        cursor: "pointer",
        minWidth: 74,
      }}
    >
      <span
        style={{ fontSize: 18, fontWeight: 800, color: cor, lineHeight: 1 }}
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

function PjesEscalasContent() {
  const router = useRouter();
  const params = useSearchParams();
  const mes = params?.get("mes") ?? "";
  const ano = params?.get("ano") ?? "";
  const tetoId = Number(params?.get("tetoId"));
  const operacaoId = Number(params?.get("operacaoId"));
  const [editandoEscala, setEditandoEscala] = useState<Escala | null>(null);
  const { user: usuarioLogado } = useCurrentUser();

  // ─── Constantes PJES ────────────────────────────────────────────────────────
  const MESES = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];
  const mesAbreviado = mes ? MESES[Number(mes) - 1] : "";

  // ─── Funções Utilitárias ─────────────────────────────────────────────────────
  const formatarCPF = (cpf: string | number): string => {
    const cpfStr = String(cpf).replace(/\D/g, "").padStart(11, "0");
    return cpfStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

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

  // ─── API ─────────────────────────────────────────────────────────────────────
  const { data: tetos } = useApi<Teto[]>(
    mes && ano ? `/api/tetos?sistema=PJES&mes=${mes}&ano=${ano}` : "",
    [mes, ano],
  );

  const {
    data: operacao,
    loading: loadingOperacao,
    error: operacaoError,
  } = useApi<Operacao>(operacaoId ? `/api/operacao/${operacaoId}` : "", [
    operacaoId,
  ]);

  const teto = tetos?.find((t) => t.id === tetoId);
  const tetoReferencia = operacao?.evento?.teto || teto;

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
  const isEditandoRef = useRef(false);
  const isLimpandoAposAdicionarRef = useRef(false);
  const localApresentacaoAtualRef = useRef("");
  const situacaoAtualRef = useRef("");
  useEffect(() => {
    localApresentacaoAtualRef.current = localApresentacao;
  }, [localApresentacao]);

  useEffect(() => {
    situacaoAtualRef.current = situacao;
  }, [situacao]);
  const [gerandoPdf, setGerandoPdf] = useState(false);

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

  const SISTEMA = "PJES";
  const minDate =
    mes && ano ? `${ano}-${String(Number(mes)).padStart(2, "0")}-01` : "";
  const maxDate = mes && ano ? new Date(Number(ano), Number(mes), 0) : null;
  const maxDateStr =
    maxDate && ano
      ? `${ano}-${String(Number(mes)).padStart(2, "0")}-${String(maxDate.getDate()).padStart(2, "0")}`
      : "";

  const cotaEscala = horaInicio && horaFim && horaInicio === horaFim ? 2 : 1;

  const totalCotasOficiais = tabelaEscalas
    .filter((e) => e.tipo_escala === "O")
    .reduce((sum, e) => sum + e.cota_escala, 0);

  const totalCotasPracas = tabelaEscalas
    .filter((e) => e.tipo_escala === "P")
    .reduce((sum, e) => sum + e.cota_escala, 0);

  // useEffect que popula a tabela:
  useEffect(() => {
    if (escalasData) setTabelaEscalas(escalasData.escalas);
  }, [escalasData]);

  const cotasUsadas = tabelaEscalas
    .filter((e) => e.tipo_escala === usuario?.tipo)
    .reduce((sum, e) => sum + e.cota_escala, 0);

  const tetoDisponivel =
    usuario?.tipo === "O"
      ? (operacao?.qtd_oficiais_oper ?? 0) - cotasUsadas
      : (operacao?.qtd_pracas_oper ?? 0) - cotasUsadas;

  const tetoPermiteAdicionar = tetoDisponivel >= cotaEscala;

  const camposObrigatoriosFaltando = (): string[] => {
    const faltando: string[] = [];
    if (!usuario && !editandoEscala) faltando.push("Matrícula");
    if (!dataInicio) faltando.push("Data de Início");
    if (!horaInicio) faltando.push("Hora de Início");
    if (!horaFim) faltando.push("Hora de Término");
    if (!localApresentacao) faltando.push("Local de Apresentação");
    if (!selectedCargo) faltando.push("Função");
    return faltando;
  };

  const canAddEscala =
    (!!usuario || !!editandoEscala) &&
    !!dataInicio &&
    !!horaInicio &&
    !!horaFim &&
    !!localApresentacao &&
    !!selectedCargo &&
    !loadingUsuario;

  // ── Base da tabela: aplica o filtro "somente 24h" antes de tudo ───────────
  // Uma escala é considerada de 24h quando horaInicio === horaFim (mesma
  // convenção já usada em cotaEscala, acima).
  const escalasBase = filtro24h
    ? tabelaEscalas.filter(
        (e) => !!e.horaInicio && !!e.horaFim && e.horaInicio === e.horaFim,
      )
    : tabelaEscalas;

  const totalEscalados = escalasBase.length;
  const totalPresentes = escalasBase.filter((e) => e.presencaConfirmada).length;
  const totalAusentes = totalEscalados - totalPresentes;

  // ✅ busca agora usa dadosSgp.pgSgp, dadosSgp.nomeGuerraSgp, dadosSgp.cpfSgp, phone
  // (e também as observações registradas pelo fiscal na 1ª/2ª verificação)
  const filteredEscalas = escalasBase.filter((escala) => {
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
      formatarData(escala.dataInicio), // permite buscar "31/07"
      escala.horaInicio,
      escala.horaFim,
      escala.localApresentacao,
      escala.funcao,
      escala.situacao,
      escala.anotacoes || "",
      escala.obsVerificador1 || "",
      escala.obsVerificador2 || "",
    ]
      .map((value) => String(value).toLowerCase())
      .some((value) => value.includes(term));
  });

  // Respeita os filtros ativos (Presente/Ausente, 24h e busca)
  const pontosDaTabela = filteredEscalas
    .map(escalaParaPonto)
    .filter((p): p is PontoPresenca => p !== null);

  function abrirMapaGeral() {
    setMapa({ titulo: "Locais das presenças", pontos: pontosDaTabela });
  }

  // Agrupa mantendo a ordem em que vieram do backend (Map preserva inserção)
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

  useEffect(() => {
    const raw = matricula.trim();

    if (raw.length === 0) {
      setUsuario(null);
      setBuscaUsuarioError(null);

      if (!isLimpandoAposAdicionarRef.current) {
        setLocalApresentacao("");
        setSituacao("");
      }
      isLimpandoAposAdicionarRef.current = false;
      return;
    }

    // ainda digitando, menos de 6 dígitos: não busca
    if (raw.length < 6) {
      setUsuario(null);
      setBuscaUsuarioError(null);
      return;
    }

    // mais de 7 dígitos não faz sentido: não busca
    if (raw.length > 7) {
      setUsuario(null);
      setBuscaUsuarioError(null);
      return;
    }

    // se tiver 6 dígitos, completa com 0 na frente -> sempre busca com 7
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
          setBuscaUsuarioError("Usuário não encontrado");
          if (!localApresentacaoAtualRef.current.trim())
            setLocalApresentacao("");
          if (!situacaoAtualRef.current.trim()) setSituacao("");
          return;
        }

        setUsuario(found);
        if (!isEditandoRef.current) {
          if (!localApresentacaoAtualRef.current.trim()) {
            setLocalApresentacao(found.localApresentacao ?? "");
          }
          if (!situacaoAtualRef.current.trim()) {
            setSituacao(found.situacao ?? "");
          }
        }
        isEditandoRef.current = false;
      } catch (error: any) {
        setUsuario(null);
        setBuscaUsuarioError(
          error?.message || "Matricula não existe ou está errada",
        );
        if (!localApresentacaoAtualRef.current.trim()) setLocalApresentacao("");
        if (!situacaoAtualRef.current.trim()) setSituacao("");
      } finally {
        setLoadingUsuario(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [matricula]);

  async function handleAddEscala() {
    const faltando = camposObrigatoriosFaltando();
    if (faltando.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${faltando.join(", ")}`);
      return;
    }

    if (!operacaoId || !operacao) return;

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
          ...(usuario && { usuarioId: usuario.id }),
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
        setEditandoEscala(null);
        setMatricula("");
        setDataInicio("");
        setHoraInicio("");
        setHoraFim("");
        setSelectedCargo("");
        setSelectedViatura(null);
        setLocalApresentacao("");
        setSituacao("");
        setAnotacoes("");
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
    isEditandoRef.current = true;
    setEditandoEscala(escala);
    setMatricula(String(escala.mat_escala));
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

  const formatarHora = (hora: string) => {
    if (!hora) return "-";

    return hora.substring(0, 5);
  };

  return (
    <div className="page" style={{ overflowX: "hidden", overflowY: "auto" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ display: "flex", justifyContent: "center" }}>
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
        </span>
        <h1 className="h1PjesEscalas">
          PJES | {mesAbreviado} {ano}
        </h1>
      </div>
      <div style={{ display: "flex", width: "100%" }}>
        {/* inicio Card Policial Escalado */}
        <div className="divPolicialEscalado">
          {/* ESQUERDA */}
          <div className="policialLeft">
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
            <div style={{ fontSize: "11px", width: "100%", marginTop: "10px" }}>
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
          </div>

          {/* DIREITA */}
          <div className="policialRight">
            <div className="escala-form">
              {/* ── Linha 1: datas + local ── */}
              <div className="escala-row">
                <div className="field-group">
                  <span className="field-label">Data de início</span>
                  <input
                    className="field-input"
                    type="date"
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
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <span className="field-label">Término</span>
                  <input
                    className="field-input field-input--time"
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
                    onChange={(e) => setLocalApresentacao(e.target.value)}
                    placeholder="Informe o local..."
                  />
                </div>
              </div>

              <div className="escala-divider" />

              {/* ── Linha 2: cargos + viatura ── */}
              <div className="escala-row escala-row--gap">
                <div className="escala-cargo-section">
                  <p className="section-title">Função</p>
                  <div className="cargo-grid">
                    {CARGOS.map((cargo) => (
                      <button
                        key={cargo}
                        type="button"
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

              {/* ── Linha 3: anotações ── */}
              <div className="field-group">
                <span className="field-label">Anotações</span>
                <textarea
                  className="field-input field-input--textarea"
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  placeholder="Observações ou informações adicionais..."
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
                        <>
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
                              <div>
                                <div>
                                  <FaLock size={22} color="white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
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
                              <div>
                                <div>
                                  <FaLockOpen size={22} color="white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
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
                : editandoEscala
                  ? "SALVAR ALTERAÇÕES"
                  : "ADICIONAR POLICIAL"}
            </button>

            {editandoEscala && (
              <button
                className="botaoCancelarEscala"
                type="button"
                // botão Cancelar
                onClick={() => {
                  setEditandoEscala(null);
                  setMatricula("");
                  setDataInicio("");
                  setHoraInicio("");
                  setHoraFim("");
                  setSelectedCargo("");
                  setSelectedViatura(null);
                  setLocalApresentacao("");
                  setSituacao("");
                  setAnotacoes("");
                }}
              >
                CANCELAR
              </button>
            )}
            <input
              className="inputBuscarEscala"
              type="text"
              placeholder="Buscar"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* inicio escalas */}
      <div className="divPjesEscalas">
        <div style={{ width: "100%" }}>
          <div className="divtitleEscalaServico">
            <div className="divCriarEscala">
              <h4>ESCALA DE SERVIÇO</h4>
            </div>
            <div
              className="divCriarEscala"
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#555",
                  whiteSpace: "nowrap",
                }}
              >
                {totalFiltrado !== totalRegistros
                  ? `${totalFiltrado} de ${totalRegistros} registro${totalRegistros !== 1 ? "s" : ""}`
                  : `${totalRegistros} registro${totalRegistros !== 1 ? "s" : ""}`}
              </span>
              <button
                onClick={handleDownloadPdf}
                disabled={gerandoPdf}
                title="Baixar PDF da escala"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #e53935",
                  marginBottom: "3px",
                  background: gerandoPdf ? "#f5f5f5" : "#fff",
                  color: gerandoPdf ? "#aaa" : "#e53935",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: gerandoPdf ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: gerandoPdf
                    ? "none"
                    : "0 1px 4px rgba(229,57,53,0.15)",
                }}
              >
                <FaFilePdf style={{ fontSize: "16px" }} />
                {gerandoPdf ? "Gerando..." : "Gerar PDF"}
              </button>
              <button
                onClick={abrirMapaGeral}
                disabled={pontosDaTabela.length === 0}
                title="Ver no mapa onde cada policial deu a presença"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #2563eb",
                  marginBottom: "3px",
                  background: "#fff",
                  color: pontosDaTabela.length === 0 ? "#aaa" : "#2563eb",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor:
                    pontosDaTabela.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <FaMapMarkerAlt style={{ fontSize: "16px" }} />
                Mapa ({pontosDaTabela.length})
              </button>

              {<UploadEscalaPlanilha />}

              {/* DESCOMENTAR E APAGAR O DE CIMA QUANDO TUDO ESTIVER PRONTO */}
              {/*
                
              {usuarioLogado?.typeUser === UserType.MASTER && (
                <UploadEscalaPlanilha
                  onSucesso={() => window.location.reload()}
                />
              )}

              */}
            </div>
          </div>

          {/* ── Contadores (Total/Presente/Ausente) + filtro "somente 24h" ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              margin: "4px 0 12px",
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

            <button
              onClick={() => setFiltro24h((v) => !v)}
              aria-pressed={filtro24h}
              title="Mostrar só serviços de 24h (hora de início = hora de término)"
              style={{
                display: "flex",
                alignItems: "center",
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
              }}
            >
              <FaRegClock />
              24h
            </button>
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
                      <tr key={escala.id} className="tabelaLinhaEscalas">
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

                        <td
                          style={{
                            textAlign: "left",
                          }}
                        >
                          {escala.pg_escala} {escala.mat_escala}{" "}
                          {escala.ng_escala} {escala.nomeome_escala} -{" "}
                          {escala.situacao}
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

            .colDataBadge {
              background: rgba(255, 255, 255, 0.2);
              padding: 1px 6px;
              border-radius: 10px;
              font-size: 10px;
              font-weight: 600;
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

export default function PjesEscalasPage() {
  return (
    <Suspense fallback={<div className="page">Carregando...</div>}>
      <PjesEscalasContent />
    </Suspense>
  );
}
