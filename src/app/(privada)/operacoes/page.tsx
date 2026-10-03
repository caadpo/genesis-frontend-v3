"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaCheck,
  FaCommentAlt,
  FaHandPaper,
  FaInfo,
  FaMale,
  FaPhone,
  FaRegClock,
  FaSignOutAlt,
  FaUser,
  FaUserCheck,
} from "react-icons/fa";
import { FiX, FiSearch, FiCalendar, FiFilter, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";

// ─── Ajustes de layout do topo fixo ──────────────────────────────────────────
// Se o seu layout já tiver um header fixo/sticky (ex.: "GENESIS | DPO SEDE"),
// coloque aqui a altura dele em px para o topo desta página grudar logo abaixo.
const OFFSET_TOPO = 0;
// O topo fixo precisa de um fundo opaco, senão a lista aparece por baixo.
const FUNDO_PAGINA = "#fff";

// ─── Types ────────────────────────────────────────────────────────────────────

type Escala = {
  id: number;
  sistema: string;
  pg_escala: string;
  mat_escala: string;
  ng_escala: string;
  nomecompleto_escala: string;
  nomeome_escala?: string;
  phone?: string | null;
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

  // ── Presença (confirmada pelo próprio escalado) ───────────────────────
  presencaConfirmada?: boolean;
  presencaConfirmadaEm?: string | null;
  presencaLatitude?: number | null;
  presencaLongitude?: number | null;
  presencaConfirmadaPorNome?: string | null;

  // ── 1ª verificação (fiscal) ───────────────────────────────────────────
  primeiraVerificacao?: boolean;
  idVerificador1?: number | null;
  verificador1Nome?: string | null;
  dataHoraVerificador1?: string | null;
  obsVerificador1?: string | null;

  // ── 2ª verificação (fiscal) ───────────────────────────────────────────
  segundaVerificacao?: boolean;
  idVerificador2?: number | null;
  verificador2Nome?: string | null;
  dataHoraVerificador2?: string | null;
  obsVerificador2?: string | null;

  // ── Saída de serviço ──────────────────────────────────────────────────
  saidaConfirmada?: boolean;
  saidaConfirmadaEm?: string | null;
  saidaConfirmadaPorNome?: string | null;
  saidaAutomatica?: boolean;

  // ── Calculados pelo backend para o usuário logado (GET /escala/cod-op) ──
  /** Qual ronda (1 ou 2) já pertence ao usuário logado, se houver. */
  minhaVerificacao?: 1 | 2 | null;
  /** true se o usuário logado é FISCAL nesta operação/data. */
  podeVerificar?: boolean;
};

type FiltroStatus = "PRESENTE" | "AUSENTE" | null;

// ─── Modal "Filtrar por OME/Evento/Operação" ────────────────────────────────

type OmeOption = { id: number; nomeOme: string };
type EventoOption = { id: number; nome_evento: string };
type OperacaoOption = { id: number; nome_operacao: string; cod_op: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

function formatarDataHora(valor?: string | null): string {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
}

function formatarHoraCurta(valor?: string | null): string {
  if (!valor) return "-";
  return new Date(valor).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Extrai a matrícula de textos no formato "PG MAT NOME_GUERRA" (para tentar a foto). */
function matriculaDoNome(nome?: string | null): string {
  return nome?.match(/\b\d{5,}\b/)?.[0] ?? "";
}

/**
 * Qual ronda o usuário logado pode gravar nesta escala:
 * a que já é dele, senão a primeira livre. null = as duas já são de outros fiscais.
 */
function resolverNumeroVerificacao(e: Escala): 1 | 2 | null {
  if (e.minhaVerificacao) return e.minhaVerificacao;
  if (e.idVerificador1 == null) return 1;
  if (e.idVerificador2 == null) return 2;
  return null;
}

/** true se a escala ainda não tem NENHUM registro de verificação (1ª ou 2ª). */
function semNenhumaVerificacao(e: Escala): boolean {
  return (
    !e.primeiraVerificacao &&
    !e.segundaVerificacao &&
    e.idVerificador1 == null &&
    e.idVerificador2 == null &&
    !e.obsVerificador1?.trim() &&
    !e.obsVerificador2?.trim()
  );
}

const MESES_ABREV = [
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

function diaMesAbrev(data: string) {
  const [, mes, dia] = data.split("-");
  return { dia, mes: MESES_ABREV[Number(mes) - 1] };
}

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

/** Combina "AAAA-MM-DD" + "HH:mm" em um Date, no fuso local. */
function combinarDataHora(data: string, hora: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return new Date(ano, mes - 1, dia, h, m, 0, 0);
}

/**
 * Calcula o instante real de término da escala. Escalas noturnas (horaFim
 * menor ou igual à horaInicio, ex.: 21:30 às 03:00) terminam no dia seguinte
 * — sem isso, a escala parecia "encerrada" assim que virava a meia-noite
 * do próprio dataInicio, minutos depois de começar.
 */
function calcularFimEscala(
  dataInicio: string,
  horaInicio: string,
  horaFim: string,
): Date {
  const inicio = combinarDataHora(dataInicio, horaInicio);
  let fim = combinarDataHora(dataInicio, horaFim);
  if (fim <= inicio) {
    fim = new Date(fim.getTime() + 24 * 60 * 60 * 1000);
  }
  return fim;
}

/** true quando o horário real de término (já considerando virada de dia) já passou. */
const isServicoEncerrado = (
  dataInicio: string,
  horaInicio: string,
  horaFim: string,
): boolean => {
  return new Date() > calcularFimEscala(dataInicio, horaInicio, horaFim);
};

/**
 * Retorna se os campos de edição (observação do fiscal) estão bloqueados.
 * Bloqueado = o horário real de término da escala já passou (considerando
 * escalas que viram a madrugada).
 */
const isEdicaoBloqueada = (
  dataInicio: string,
  horaInicio: string,
  horaFim: string,
): boolean => {
  return isServicoEncerrado(dataInicio, horaInicio, horaFim);
};

/**
 * Cor do FaInfo — sempre clicável (nunca desabilitado) exceto para datas futuras.
 *
 * 🔵 Azul        → presença confirmada, sem observação de fiscal
 * 🟠 Laranja     → presença confirmada + observação de fiscal
 * 🔴 Vermelho    → sem presença + observação de fiscal
 * 🟢 Verde       → hoje/passada, sem nada ainda
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
  naoVerificado: boolean;
  bordaAlerta: string;
} {
  const passada = isPassada(e.dataInicio);
  const hoje = isHoje(e.dataInicio);
  const temObs = !!e.obsVerificador1?.trim() || !!e.obsVerificador2?.trim();
  const confirmado = !!e.presencaConfirmada;

  // Data futura → único caso realmente desabilitado
  if (!hoje && !passada) {
    return {
      bg: "#ccc",
      border: "#ccc",
      cursor: "not-allowed",
      disabled: true,
      title: "Disponível apenas no dia da escala",
      naoVerificado: false,
      bordaAlerta: "#ccc",
    };
  }

  // A partir daqui sempre clicável (serviço encerrado = só leitura na modal).
  // Usa o horário real de término, considerando escalas que viram a madrugada.
  const dim = isServicoEncerrado(e.dataInicio, e.horaInicio, e.horaFim); // tons claros
  const naoVerificado = semNenhumaVerificacao(e);
  const bordaAlerta = confirmado ? "#ff6a00" : "#e60000";

  if (confirmado && temObs) {
    return {
      bg: dim ? "#f5c892" : "#f97316",
      border: dim ? "#f5c892" : "#f97316",
      cursor: "pointer",
      disabled: false,
      title: dim
        ? "Ver presença confirmada com observação"
        : "Confirmado com observação",
      naoVerificado,
      bordaAlerta,
    };
  }

  if (confirmado && !temObs) {
    return {
      bg: dim ? "#93c5fd" : "#2563eb",
      border: dim ? "#93c5fd" : "#2563eb",
      cursor: "pointer",
      disabled: false,
      title: dim ? "Ver presença confirmada" : "Presença confirmada",
      naoVerificado,
      bordaAlerta,
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
      naoVerificado,
      bordaAlerta,
    };
  }

  // Neutro — sem obs, sem confirmação
  return {
    bg: dim ? "#fca5a5" : "#dc2626",
    border: dim ? "#fca5a5" : "#dc2626",
    cursor: "pointer",
    disabled: false,
    title: dim ? "Ver detalhes" : "Registrar observação",
    naoVerificado,
    bordaAlerta,
  };
}

// ─── Sub-componentes (nível de módulo, para não perder estado a cada render) ─

function AvatarPolicial({
  mat,
  nome,
  tamanho = 34,
  corFundo = "#e5e7eb",
  corIcone = "#9ca3af",
}: {
  mat: string;
  nome: string;
  tamanho?: number;
  corFundo?: string;
  corIcone?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (imgError || !mat) {
    return (
      <div
        style={{
          width: tamanho,
          height: tamanho,
          borderRadius: "50%",
          background: corFundo,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        title={nome}
      >
        <FaUser size={Math.round(tamanho * 0.47)} color={corIcone} />
      </div>
    );
  }

  return (
    <img
      src={`/avatares/${mat}.jpg`}
      alt={nome}
      title={nome}
      onError={() => setImgError(true)}
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  );
}

/** Mão levantada com um risco diagonal — ícone de "ausente". */
function IconeAusente({ size, color }: { size: number; color: string }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FaHandPaper size={size} color={color} />
      <span
        style={{
          position: "absolute",
          left: "-12%",
          top: "50%",
          width: "124%",
          height: 2,
          background: color,
          transform: "rotate(-45deg)",
          borderRadius: 1,
        }}
      />
    </span>
  );
}

/** Um dos três blocos do resumo (Total / Presente / Ausente). Também funciona como filtro. */
function CardResumo({
  icone,
  valor,
  rotulo,
  cor,
  ativo,
  onClick,
}: {
  icone: React.ReactNode;
  valor: number;
  rotulo: string;
  cor: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      title={ativo ? `Remover filtro "${rotulo}"` : `Filtrar por ${rotulo}`}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "6px 4px",
        borderRadius: 10,
        border: `1.5px solid ${ativo ? cor : "transparent"}`,
        background: ativo ? `${cor}14` : "transparent",
        color: cor,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icone}
        <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
          {valor}
        </span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{rotulo}</span>
    </button>
  );
}

/** Nó circular cinza usado na timeline para ícones genéricos (relógio, saída). */
function IconeTimeline({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "#eef2f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

/** Uma linha da timeline: ícone/avatar à esquerda, linha tracejada ligando ao próximo, conteúdo à direita. */
function LinhaTimeline({
  icone,
  linhaAbaixo,
  children,
}: {
  icone: React.ReactNode;
  linhaAbaixo: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 32,
          flexShrink: 0,
        }}
      >
        {icone}
        {linhaAbaixo && (
          <div
            style={{
              flex: 1,
              width: 0,
              borderLeft: "2px dashed #d1d5db",
              minHeight: 16,
              marginTop: 4,
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>{children}</div>
    </div>
  );
}

/** Conteúdo de uma ronda de fiscal: nome (ou "aguardando fiscal"), tag FISCAL e "observação – data/hora". */
function ConteudoVerificador({
  numero,
  nome,
  verificado,
  dataHora,
  observacao,
}: {
  numero: 1 | 2;
  nome?: string | null;
  verificado?: boolean;
  dataHora?: string | null;
  observacao?: string | null;
}) {
  const obs = observacao?.trim();
  const partes: string[] = [];
  if (obs) partes.push(obs);
  else if (verificado) partes.push("Verificado");
  if (partes.length > 0 && dataHora) partes.push(formatarDataHora(dataHora));

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 700,
          fontSize: 13,
          color: "#111827",
          marginBottom: 2,
        }}
      >
        <span>{nome || `${numero}ª verificação — aguardando fiscal`}</span>
        {verificado && (
          <span
            title="Verificação confirmada"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#16a34a",
              flexShrink: 0,
            }}
          >
            <FaCheck size={9} color="#fff" />
          </span>
        )}
      </div>
      <span
        style={{
          background: "#eef0fd",
          color: "#4f46e5",
          fontSize: 10.5,
          fontWeight: 700,
          borderRadius: 999,
          padding: "2px 8px",
        }}
      >
        FISCAL
      </span>
      {partes.length > 0 && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "#4b5563",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {partes.join(" – ")}
        </div>
      )}
    </div>
  );
}

/** Mapa (OpenStreetMap) com o local onde o policial confirmou a presença. */
function MapaPresenca({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const delta = 0.0015;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join("%2C");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const linkMapa = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div style={{ marginTop: 4 }}>
      <a
        href={linkMapa}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir no mapa"
        style={{ display: "block" }}
      >
        <iframe
          src={src}
          title="Local da confirmação de presença"
          loading="lazy"
          style={{
            width: "100%",
            height: 190,
            border: "1px solid #d1d5db",
            borderRadius: 14,
            pointerEvents: "none", // o toque abre o mapa em vez de rolar dentro do iframe
          }}
        />
      </a>
      <div
        style={{
          textAlign: "center",
          fontSize: 12.5,
          color: "#374151",
          marginTop: 4,
        }}
      >
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </div>
  );
}

/**
 * Timeline somente leitura, no mesmo formato da DetalhesEscalaModal:
 * início (presença) → 1ª verificação → 2ª verificação → saída.
 */
function TimelineServico({ escala }: { escala: Escala }) {
  const confirmada = !!escala.presencaConfirmada;
  const mostraV1 =
    confirmada ||
    !!escala.primeiraVerificacao ||
    !!escala.obsVerificador1?.trim();
  const mostraV2 =
    confirmada ||
    !!escala.segundaVerificacao ||
    !!escala.obsVerificador2?.trim();
  const mostraSaida = confirmada || !!escala.saidaConfirmada;

  const textoTimeline: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#4b5563",
  };

  return (
    <div>
      {/* Início do serviço (presença) */}
      <LinhaTimeline
        icone={
          <IconeTimeline>
            <FaRegClock size={14} color="#6b7280" />
          </IconeTimeline>
        }
        linhaAbaixo={mostraV1 || mostraV2 || mostraSaida}
      >
        {confirmada ? (
          <span style={textoTimeline}>
            Início do Serviço às{" "}
            {formatarHoraCurta(escala.presencaConfirmadaEm)}
          </span>
        ) : (
          <span style={{ ...textoTimeline, color: "#9ca3af" }}>
            Presença não confirmada
          </span>
        )}
      </LinhaTimeline>

      {/* 1ª verificação */}
      {mostraV1 && (
        <LinhaTimeline
          icone={
            <AvatarPolicial
              mat={matriculaDoNome(escala.verificador1Nome)}
              nome={escala.verificador1Nome ?? ""}
              tamanho={32}
              corFundo="#eef2ff"
              corIcone="#6366f1"
            />
          }
          linhaAbaixo={mostraV2 || mostraSaida}
        >
          <ConteudoVerificador
            numero={1}
            nome={escala.verificador1Nome}
            verificado={escala.primeiraVerificacao}
            dataHora={escala.dataHoraVerificador1}
            observacao={escala.obsVerificador1}
          />
        </LinhaTimeline>
      )}

      {/* 2ª verificação */}
      {mostraV2 && (
        <LinhaTimeline
          icone={
            <AvatarPolicial
              mat={matriculaDoNome(escala.verificador2Nome)}
              nome={escala.verificador2Nome ?? ""}
              tamanho={32}
              corFundo="#eef2ff"
              corIcone="#6366f1"
            />
          }
          linhaAbaixo={mostraSaida}
        >
          <ConteudoVerificador
            numero={2}
            nome={escala.verificador2Nome}
            verificado={escala.segundaVerificacao}
            dataHora={escala.dataHoraVerificador2}
            observacao={escala.obsVerificador2}
          />
        </LinhaTimeline>
      )}

      {/* Saída */}
      {mostraSaida && (
        <LinhaTimeline
          icone={
            <IconeTimeline>
              <FaSignOutAlt size={14} color="#6b7280" />
            </IconeTimeline>
          }
          linhaAbaixo={false}
        >
          {escala.saidaConfirmada ? (
            <span style={textoTimeline}>
              Serviço finalizado às{" "}
              {formatarHoraCurta(escala.saidaConfirmadaEm)}
              {escala.saidaAutomatica ? " (automático)" : ""}
            </span>
          ) : (
            <span style={{ ...textoTimeline, color: "#9ca3af" }}>
              Serviço em andamento
            </span>
          )}
        </LinhaTimeline>
      )}

      {/* Mapa do local da presença */}
      {escala.presencaLatitude != null && escala.presencaLongitude != null && (
        <MapaPresenca
          latitude={escala.presencaLatitude}
          longitude={escala.presencaLongitude}
        />
      )}
    </div>
  );
}

/** Modal "Presença/Observação": dados do escalado, anotações, observação do fiscal e timeline do serviço. */
function ModalEscala({
  escala,
  salvando,
  onClose,
  onSalvar,
}: {
  escala: Escala;
  salvando: boolean;
  onClose: () => void;
  onSalvar: (observacao: string, verificado: boolean) => void;
}) {
  const numeroVerificacao = resolverNumeroVerificacao(escala);

  // Se a ronda já é do usuário logado, a observação e o "verificado" atuais vêm preenchidos
  const original =
    escala.minhaVerificacao === 1
      ? (escala.obsVerificador1 ?? "")
      : escala.minhaVerificacao === 2
        ? (escala.obsVerificador2 ?? "")
        : "";
  const verificadoOriginal =
    escala.minhaVerificacao === 1
      ? !!escala.primeiraVerificacao
      : escala.minhaVerificacao === 2
        ? !!escala.segundaVerificacao
        : false;

  const [observacao, setObservacao] = useState(original);
  const [verificado, setVerificado] = useState(verificadoOriginal);
  const [mostrarInfoServico, setMostrarInfoServico] = useState(true);

  // Usa o horário real de término (considera escalas que viram a madrugada,
  // ex.: 21:30 às 03:00 — só bloqueia depois das 03:00 do dia seguinte).
  const bloqueado = isEdicaoBloqueada(
    escala.dataInicio,
    escala.horaInicio,
    escala.horaFim,
  );
  // Distingue a mensagem: escala de um dia claramente anterior vs. escala de
  // hoje/ontem que só encerrou agora há pouco.
  const dataAntiga = isPassada(escala.dataInicio);

  const podeEditar =
    !bloqueado && !!escala.podeVerificar && numeroVerificacao !== null;
  const alterou =
    observacao.trim() !== original.trim() || verificado !== verificadoOriginal;
  const confirmada = !!escala.presencaConfirmada;

  const avisoBase: React.CSSProperties = {
    borderRadius: 6,
    padding: "6px 10px",
    marginBottom: 12,
    fontSize: 11,
  };

  return (
    <div className="modalOverlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modalCard"
        style={{
          maxWidth: 420,
          width: "94%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Título */}
        <div style={{ fontSize: 13, color: "#0a66c2", marginBottom: 12 }}>
          Presença/Observação
        </div>

        {/* Escalado + status de presença */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <AvatarPolicial
            mat={escala.mat_escala}
            nome={escala.ng_escala}
            tamanho={56}
          />
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.35 }}>
            <div style={{ fontWeight: 700, color: "#111827" }}>
              {escala.pg_escala} {escala.mat_escala} {escala.ng_escala}
            </div>
            <div style={{ color: "#4b5563" }}>
              {formatarData(escala.dataInicio)}, {escala.horaInicio.slice(0, 5)}{" "}
              às {escala.horaFim.slice(0, 5)}
            </div>
            <div style={{ color: "#4b5563" }}>{escala.funcao}</div>
          </div>
          <div
            title={
              confirmada ? "Presença confirmada" : "Presença não confirmada"
            }
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              border: `3px solid ${confirmada ? "#16a34a" : "#cbd5e1"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {confirmada && <FaCheck size={20} color="#16a34a" />}
          </div>
        </div>

        {/* Anotações da escala */}
        {escala.anotacoes && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#4f46e5",
                fontWeight: 700,
                fontSize: 11,
                marginBottom: 6,
              }}
            >
              <FaCommentAlt size={11} />
              ANOTAÇÕES
            </div>
            <div
              style={{
                background: "#eef0fd",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                color: "#1f2937",
                whiteSpace: "pre-wrap",
              }}
            >
              {escala.anotacoes}
            </div>
          </div>
        )}

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #d3d6da",
            margin: "12px 0",
          }}
        />

        {/* Avisos */}
        {bloqueado && (
          <div
            style={{
              ...avisoBase,
              background: "#fff3cd",
              border: "1px solid #ffc107",
              color: "#856404",
            }}
          >
            {dataAntiga
              ? "📅 Esta escala é de uma data anterior. Somente leitura."
              : "⏰ O horário de término desta escala já passou. Somente leitura."}
          </div>
        )}
        {!bloqueado && !escala.podeVerificar && (
          <div
            style={{ ...avisoBase, background: "#f3f4f6", color: "#6b7280" }}
          >
            Somente o fiscal escalado nesta operação e data pode registrar
            observações.
          </div>
        )}
        {!bloqueado && escala.podeVerificar && numeroVerificacao === null && (
          <div
            style={{ ...avisoBase, background: "#f3f4f6", color: "#6b7280" }}
          >
            As duas verificações desta escala já foram registradas por outros
            fiscais.
          </div>
        )}

        {/* Verificação e observação do fiscal (1ª ou 2ª ronda, conforme o usuário logado) */}
        {podeEditar && (
          <div style={{ marginBottom: 8 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={verificado}
                onChange={(ev) => setVerificado(ev.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "#16a34a",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                Marcar {numeroVerificacao}ª verificação como realizada
              </span>
            </label>

            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Adicionar Observação
            </div>
            <textarea
              value={observacao}
              onChange={(ev) => setObservacao(ev.target.value)}
              rows={3}
              placeholder="Descreva alguma observação sobre esta escala..."
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        <div
          className="modalActions"
          style={{ marginTop: 4, marginBottom: 14 }}
        >
          <button className="btnCancel" onClick={onClose}>
            Fechar
          </button>
          {podeEditar && (
            <button
              className="btnSave"
              onClick={() => onSalvar(observacao, verificado)}
              disabled={salvando || !alterou}
            >
              {salvando ? "Salvando..." : "Salvar observação"}
            </button>
          )}
        </div>

        {/* Informações do Serviço */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            marginBottom: mostrarInfoServico ? 10 : 0,
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={mostrarInfoServico}
            onChange={() => setMostrarInfoServico((v) => !v)}
            style={{
              width: 16,
              height: 16,
              accentColor: "#4f46e5",
              cursor: "pointer",
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>
            Informações do Serviço
          </span>
        </label>

        {mostrarInfoServico && <TimelineServico escala={escala} />}
      </div>
    </div>
  );
}

/** Estilo padrão dos <select> da modal de filtro. */
const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 13,
  color: "#111827",
  background: "#fff",
  boxSizing: "border-box",
};

const labelFiltroStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 4,
};

/**
 * Modal "Filtrar por OME/Evento/Operação": três selects em cascata.
 * OMEs vêm todas de uma vez (lista pequena e estática); Eventos e Operações
 * só são buscados depois que o select anterior é escolhido, para não pesar
 * a navegação com listas que a pessoa talvez nem chegue a abrir.
 */
function ModalFiltro({
  onClose,
  onFiltrar,
}: {
  onClose: () => void;
  onFiltrar: (codOp: string) => void;
}) {
  const [omes, setOmes] = useState<OmeOption[]>([]);
  const [carregandoOmes, setCarregandoOmes] = useState(true);
  const [omeId, setOmeId] = useState<number | "">("");

  const [eventos, setEventos] = useState<EventoOption[]>([]);
  const [carregandoEventos, setCarregandoEventos] = useState(false);
  const [eventoId, setEventoId] = useState<number | "">("");

  const [operacoes, setOperacoes] = useState<OperacaoOption[]>([]);
  const [carregandoOperacoes, setCarregandoOperacoes] = useState(false);
  const [operacaoId, setOperacaoId] = useState<number | "">("");

  const [codOpSelecionado, setCodOpSelecionado] = useState("");

  // Carrega as OMEs uma única vez, ao abrir a modal.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch("/api/ome");
        const data = await res.json();
        if (!cancelado && res.ok) setOmes(data);
      } finally {
        if (!cancelado) setCarregandoOmes(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  async function handleSelecionarOme(valor: string) {
    const id = valor ? Number(valor) : "";
    setOmeId(id);
    setEventoId("");
    setOperacaoId("");
    setEventos([]);
    setOperacoes([]);
    setCodOpSelecionado("");
    if (!id) return;

    setCarregandoEventos(true);
    try {
      const agora = new Date();
      const mes = agora.getMonth() + 1;
      const ano = agora.getFullYear();
      const res = await fetch(`/api/evento?omeId=${id}&mes=${mes}&ano=${ano}`);
      const data = await res.json();
      if (res.ok) setEventos(data);
    } finally {
      setCarregandoEventos(false);
    }
  }

  async function handleSelecionarEvento(valor: string) {
    const id = valor ? Number(valor) : "";
    setEventoId(id);
    setOperacaoId("");
    setOperacoes([]);
    setCodOpSelecionado("");
    if (!id) return;

    setCarregandoOperacoes(true);
    try {
      const agora = new Date();
      const mes = agora.getMonth() + 1;
      const ano = agora.getFullYear();
      const res = await fetch(
        `/api/operacao?eventoId=${id}&mes=${mes}&ano=${ano}`,
      );
      const data = await res.json();
      if (res.ok) setOperacoes(data);
    } finally {
      setCarregandoOperacoes(false);
    }
  }

  function handleSelecionarOperacao(valor: string) {
    const id = valor ? Number(valor) : "";
    setOperacaoId(id);
    const op = operacoes.find((o) => o.id === id);
    setCodOpSelecionado(op?.cod_op ?? "");
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(15, 23, 42, 0.35)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "70px 12px 0 0",
      }}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 300,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>
            FILTRAR POR OPERAÇÃO
          </span>
          <FiX size={16} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelFiltroStyle}>UNIDADE</label>
          <select
            value={omeId}
            onChange={(ev) => handleSelecionarOme(ev.target.value)}
            disabled={carregandoOmes}
            style={selectStyle}
          >
            <option value="">
              {carregandoOmes ? "Carregando..." : "Selecione a OME"}
            </option>
            {omes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nomeOme}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelFiltroStyle}>Evento</label>
          <select
            value={eventoId}
            onChange={(ev) => handleSelecionarEvento(ev.target.value)}
            disabled={!omeId || carregandoEventos}
            style={selectStyle}
          >
            <option value="">
              {!omeId
                ? "Selecione a OME primeiro"
                : carregandoEventos
                  ? "Carregando..."
                  : eventos.length === 0
                    ? "Nenhum evento neste mês"
                    : "Selecione o evento"}
            </option>
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome_evento}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelFiltroStyle}>Operação</label>
          <select
            value={operacaoId}
            onChange={(ev) => handleSelecionarOperacao(ev.target.value)}
            disabled={!eventoId || carregandoOperacoes}
            style={selectStyle}
          >
            <option value="">
              {!eventoId
                ? "Selecione o evento primeiro"
                : carregandoOperacoes
                  ? "Carregando..."
                  : operacoes.length === 0
                    ? "Nenhuma operação neste mês"
                    : "Selecione a operação"}
            </option>
            {operacoes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome_operacao}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={codOpSelecionado}
          readOnly
          placeholder="COP da operação selecionada"
          style={{
            ...selectStyle,
            marginBottom: 16,
            background: "#f9fafb",
            color: "#4b5563",
            fontWeight: 700,
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => codOpSelecionado && onFiltrar(codOpSelecionado)}
            disabled={!codOpSelecionado}
            style={{
              background: codOpSelecionado ? "#16a34a" : "#9ca3af",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.03em",
              cursor: codOpSelecionado ? "pointer" : "default",
            }}
          >
            FILTRAR
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function OperacoesPage() {
  const [codOp, setCodOp] = useState("");
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const [filtroHoje, setFiltroHoje] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>(null);
  const [busca, setBusca] = useState("");

  const [escalaModal, setEscalaModal] = useState<Escala | null>(null);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Altura do bloco de busca — usada como offset do segundo bloco fixo
  const buscaRef = useRef<HTMLDivElement>(null);
  const [alturaBusca, setAlturaBusca] = useState(0);
  const [filtroHora, setFiltroHora] = useState("");

  useEffect(() => {
    const el = buscaRef.current;
    if (!el) return;
    const medir = () => setAlturaBusca(el.offsetHeight);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Base dos contadores: só respeita o filtro "Hoje" ─────────────────────
  // ── Etapa 1: filtro "Hoje" ───────────────────────────────────────────────
  const escalasHoje = escalas.filter(
    (e) => !filtroHoje || isHoje(e.dataInicio),
  );

  // ── Horários disponíveis (respeitam o filtro "Hoje") ─────────────────────
  const horariosDisponiveis = Array.from(
    new Set(escalasHoje.map((e) => e.horaInicio.slice(0, 5))),
  ).sort();

  // Se o horário escolhido deixou de existir (ex.: ligou "Hoje"), ignora-o
  const horaAtiva = horariosDisponiveis.includes(filtroHora) ? filtroHora : "";

  // ── Base dos contadores: Hoje + Horário ──────────────────────────────────
  const escalasBase = escalasHoje.filter(
    (e) => !horaAtiva || e.horaInicio.slice(0, 5) === horaAtiva,
  );
  const totalEscalados = escalasBase.length;
  const totalPresentes = escalasBase.filter((e) => e.presencaConfirmada).length;
  const totalAusentes = totalEscalados - totalPresentes;

  // ── Lista: Hoje + Presente/Ausente + busca por texto ─────────────────────
  const escalasFiltradas = escalasBase.filter((e) => {
    if (filtroStatus === "PRESENTE" && !e.presencaConfirmada) return false;
    if (filtroStatus === "AUSENTE" && e.presencaConfirmada) return false;
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

  type Grupo = {
    chave: string;
    dataInicio: string;
    horaInicio: string;
    horaFim: string;
    escalas: Escala[];
  };

  const grupos: Grupo[] = [];
  const gruposMap = new Map<string, Grupo>();
  for (const e of escalasFiltradas) {
    const chave = `${e.dataInicio}_${e.horaInicio}_${e.horaFim}`;
    if (!gruposMap.has(chave)) {
      const g: Grupo = {
        chave,
        dataInicio: e.dataInicio,
        horaInicio: e.horaInicio,
        horaFim: e.horaFim,
        escalas: [],
      };
      gruposMap.set(chave, g);
      grupos.push(g);
    }
    gruposMap.get(chave)!.escalas.push(e);
  }

  const ORDEM_FUNCAO = ["FISCAL", "MOT", "PAT", "CMT", "AUX"];

  function posicaoFuncao(funcao: string) {
    const idx = ORDEM_FUNCAO.indexOf(funcao);
    return idx === -1 ? ORDEM_FUNCAO.length : idx; // desconhecidas vão pro final
  }

  type Subgrupo = {
    patrimonio: string | null;
    escalas: Escala[];
  };

  function agruparPorViatura(escalas: Escala[]): Subgrupo[] {
    const mapa = new Map<string, Escala[]>();
    const ordemChaves: string[] = [];

    for (const e of escalas) {
      const chave = e.viatura?.patrimonio ?? "__sem_viatura__";
      if (!mapa.has(chave)) {
        mapa.set(chave, []);
        ordemChaves.push(chave);
      }
      mapa.get(chave)!.push(e);
    }

    return ordemChaves.map((chave) => ({
      patrimonio: chave === "__sem_viatura__" ? null : chave,
      escalas: mapa
        .get(chave)!
        .slice()
        .sort((a, b) => posicaoFuncao(a.funcao) - posicaoFuncao(b.funcao)),
    }));
  }

  function alternarStatus(status: Exclude<FiltroStatus, null>) {
    setFiltroStatus((prev) => (prev === status ? null : status));
  }

  async function buscarPorCodOp(codOverride?: string) {
    const cod = (codOverride ?? codOp).trim();
    if (!cod) return;
    setLoading(true);
    setErro(null);
    setEscalas([]);
    setBuscaRealizada(true);
    setBusca("");
    setFiltroHoje(false);
    setFiltroStatus(null);
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
    setFiltroStatus(null);
    setFiltroHora("");
  }

  /** Grava verificado + observação do fiscal na 1ª ou 2ª verificação (PATCH /escala/:id/verificacao1|2). */
  async function salvarObservacao(
    escala: Escala,
    observacao: string,
    verificado: boolean,
  ) {
    const numero = resolverNumeroVerificacao(escala);
    if (!numero) {
      toast.error(
        "As duas verificações já foram registradas por outros fiscais",
      );
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch(`/api/escala/${escala.id}/verificacao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero, observacao, verificado }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message;
        throw new Error(msg ?? "Erro ao salvar observação");
      }

      // A resposta do PATCH não traz operação/evento/podeVerificar,
      // então só mesclamos os campos de verificação sobre a escala atual.
      const atualizada: Escala = {
        ...escala,
        primeiraVerificacao: data.primeiraVerificacao,
        idVerificador1: data.idVerificador1,
        verificador1Nome: data.verificador1Nome,
        dataHoraVerificador1: data.dataHoraVerificador1,
        obsVerificador1: data.obsVerificador1,
        segundaVerificacao: data.segundaVerificacao,
        idVerificador2: data.idVerificador2,
        verificador2Nome: data.verificador2Nome,
        dataHoraVerificador2: data.dataHoraVerificador2,
        obsVerificador2: data.obsVerificador2,
        minhaVerificacao: numero,
      };

      setEscalas((prev) =>
        prev.map((e) => (e.id === atualizada.id ? atualizada : e)),
      );
      setEscalaModal(atualizada);
      toast.success("Observação salva ✅");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar observação");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="container" style={{ paddingBottom: 10 }}>
      {/* ── Campo de busca (fixo no topo) ────────────────────────────────── */}
      <div
        ref={buscaRef}
        className="div-itens-sistema"
        style={{
          position: "sticky",
          top: OFFSET_TOPO,
          zIndex: 31,
          background: FUNDO_PAGINA,
        }}
      >
        <div className="titulo" style={{ marginBottom: 5 }}>
          <span>OPERAÇÕES</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
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
              onClick={() => buscarPorCodOp()}
            />
          </div>

          <button
            onClick={() => setFiltroAberto(true)}
            title="Filtrar por OME / Evento / Operação"
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: 10,
              border: "none",
              background: "#16a34a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FiFilter size={17} />
          </button>
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
          {/* Cabeçalho da operação + resumo + filtros (fixo logo abaixo da busca) */}
          <div
            style={{
              position: "sticky",
              top: OFFSET_TOPO + alturaBusca,
              zIndex: 30,
              background: FUNDO_PAGINA,
              paddingBottom: 6,
            }}
          >
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

            {/* Resumo: Total / Presente / Ausente (também são filtros) */}
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 4,
                margin: "8px 0",
                padding: 4,
                background: "#fff",
                border: "1px solid #d9dee7",
                borderRadius: 12,
              }}
            >
              <CardResumo
                icone={<FaMale size={28} />}
                valor={totalEscalados}
                rotulo="Total"
                cor="#16a34a"
                ativo={filtroStatus === null}
                onClick={() => setFiltroStatus(null)}
              />
              <CardResumo
                icone={<FaUserCheck size={26} />}
                valor={totalPresentes}
                rotulo="Presente"
                cor="#2563eb"
                ativo={filtroStatus === "PRESENTE"}
                onClick={() => alternarStatus("PRESENTE")}
              />
              <CardResumo
                icone={<IconeAusente size={24} color="#dc2626" />}
                valor={totalAusentes}
                rotulo="Ausente"
                cor="#dc2626"
                ativo={filtroStatus === "AUSENTE"}
                onClick={() => alternarStatus("AUSENTE")}
              />
            </div>

            {/* Filtros */}
            <div className="divOperacaoHoje">
              <button
                onClick={() => setFiltroHoje((prev) => !prev)}
                aria-pressed={filtroHoje}
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

              <div style={{ position: "relative", flexShrink: 0 }}>
                <FiClock
                  size={12}
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                    pointerEvents: "none",
                  }}
                />
                <select
                  value={horaAtiva}
                  onChange={(e) => setFiltroHora(e.target.value)}
                  title="Filtrar por hora de início"
                  style={{
                    padding: "5px 6px 5px 26px",
                    borderRadius: 6,
                    border: `1px solid ${horaAtiva ? "#4d78da" : "#ccc"}`,
                    fontSize: 11,
                    background: "#fff",
                    color: horaAtiva ? "#4d78da" : "#374151",
                    fontWeight: horaAtiva ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  <option value="">Horário</option>
                  {horariosDisponiveis.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="Matrícula ou nome de guerra"
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
          </div>

          {/* Lista de escalas */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginTop: 5,
              maxHeight: "100%",
              overflow: "auto",
            }}
          >
            {grupos.map((grupo) => {
              const { dia, mes } = diaMesAbrev(grupo.dataInicio);
              const passadaGrupo = isServicoEncerrado(
                grupo.dataInicio,
                grupo.horaInicio,
                grupo.horaFim,
              );

              return (
                <div
                  key={grupo.chave}
                  style={{
                    display: "flex",
                    background: "#fff",
                    borderRadius: 14,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                    opacity: passadaGrupo ? 0.55 : 1,
                  }}
                >
                  {/* Badge de data/hora */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 40,
                      padding: "5px 3px",
                      background: "#f4f7fb",
                      borderRight: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#1f2937",
                        lineHeight: 1,
                      }}
                    >
                      {dia}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#4f8ed3",
                        letterSpacing: 1,
                        marginBottom: 6,
                      }}
                    >
                      {mes}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        textAlign: "center",
                        lineHeight: 1.3,
                      }}
                    >
                      {grupo.horaInicio.slice(0, 5)}
                      <br />
                      às
                      <br />
                      {grupo.horaFim.slice(0, 5)}
                    </div>
                  </div>

                  {/* Lista de policiais, agrupados por viatura */}
                  <div style={{ flex: 1, padding: "4px 4px" }}>
                    {(() => {
                      const subgrupos = agruparPorViatura(grupo.escalas);
                      const mostrarLabelViatura = subgrupos.length > 1;

                      return subgrupos.map((sub, subIdx) => (
                        <div key={sub.patrimonio ?? `sem-vtr-${subIdx}`}>
                          {mostrarLabelViatura && (
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: sub.patrimonio ? "#0a57a8" : "#9ca3af",
                                letterSpacing: 0.5,
                                marginTop: subIdx > 0 ? 10 : 4,
                                marginBottom: 4,
                              }}
                            >
                              {sub.patrimonio
                                ? `VTR ${sub.patrimonio}`
                                : "SEM VIATURA"}
                            </div>
                          )}

                          {sub.escalas.map((e, idx) => {
                            const {
                              bg,
                              border,
                              cursor,
                              disabled,
                              title,
                              naoVerificado,
                              bordaAlerta,
                            } = corBotaoInfo(e);
                            return (
                              <div
                                key={e.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "2px 0",
                                  borderBottom:
                                    idx < sub.escalas.length - 1
                                      ? "1px solid #f1f1f1"
                                      : "none",
                                }}
                              >
                                <AvatarPolicial
                                  mat={e.mat_escala}
                                  nome={e.ng_escala}
                                />

                                <div
                                  style={{
                                    flex: 1,
                                    fontSize: 11,
                                    color: "#374151",
                                    minWidth: 0,
                                  }}
                                >
                                  <div style={{ fontWeight: 600 }}>
                                    {e.pg_escala} {e.mat_escala} {e.ng_escala}
                                    {e.nomeome_escala && (
                                      <span
                                        style={{
                                          fontWeight: 500,
                                          color: "#6b7280",
                                        }}
                                      >
                                        {" "}
                                        · {e.nomeome_escala}
                                      </span>
                                    )}
                                    <br />
                                    {e.phone && (
                                      <span
                                        style={{
                                          fontWeight: 500,
                                          color: "#9ca3af",
                                        }}
                                      >
                                        {" "}
                                        <FaPhone /> {e.phone}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    style={{ fontSize: 11, color: "#6b7280" }}
                                  >
                                    {e.funcao}
                                    {!mostrarLabelViatura &&
                                    e.viatura?.patrimonio
                                      ? ` · VTR ${e.viatura.patrimonio}`
                                      : ""}
                                  </div>
                                </div>

                                {/* Status de presença */}
                                <span
                                  title={
                                    e.presencaConfirmada
                                      ? "Presente"
                                      : "Ausente"
                                  }
                                  style={{ display: "flex", flexShrink: 0 }}
                                >
                                  {e.presencaConfirmada ? (
                                    <FaUserCheck size={16} color="#2563eb" />
                                  ) : (
                                    <IconeAusente size={16} color="#dc2626" />
                                  )}
                                </span>

                                <button
                                  onClick={() => !disabled && setEscalaModal(e)}
                                  disabled={disabled}
                                  title={
                                    naoVerificado && !disabled
                                      ? `${title} — sem verificação`
                                      : title
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minWidth: 44,
                                    height: 26,
                                    padding: "0 12px",
                                    borderRadius: 999,
                                    border: naoVerificado
                                      ? `2px solid ${bordaAlerta}`
                                      : `1.5px solid ${border}`,
                                    background: "#fff",
                                    color: bg,
                                    cursor,
                                    flexShrink: 0,
                                  }}
                                >
                                  <FaInfo size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              );
            })}

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
      {escalaModal && (
        <ModalEscala
          key={escalaModal.id}
          escala={escalaModal}
          salvando={salvando}
          onClose={() => setEscalaModal(null)}
          onSalvar={(obs, verificado) =>
            salvarObservacao(escalaModal, obs, verificado)
          }
        />
      )}

      {filtroAberto && (
        <ModalFiltro
          onClose={() => setFiltroAberto(false)}
          onFiltrar={(cod) => {
            setCodOp(cod);
            setFiltroAberto(false);
            buscarPorCodOp(cod);
          }}
        />
      )}
    </div>
  );
}
