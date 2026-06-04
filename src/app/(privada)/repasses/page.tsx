"use client";

import { useState, useEffect, useCallback } from "react";
import { FaUser, FaMapMarkerAlt, FaInfo, FaPhone } from "react-icons/fa";
import { FaTriangleExclamation } from "react-icons/fa6";
import { FiGrid, FiLayers } from "react-icons/fi";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Repasse = {
  id: number;
  escalaId: number;
  ofertanteId: number;
  receptorId: number | null;
  statusRepasse: "ABERTO" | "ACEITO" | "CANCELADO";
  sistemaRepasse: string;
  tipoEscalaRepasse: string;
  dataInicioRepasse: string;
  horaInicioRepasse: string;
  horaFimRepasse: string;
  matOfertante: string;
  motivo: string | null;
  createdAt: string;
  updatedAt: string;
  // campos enriquecidos do backend
  nome_evento?: string;
  nome_ome?: string;
  nome_operacao?: string;
  funcao?: string;
  localApresentacao?: string;
  ofertante_img?: string;
  ofertante_pg?: string;
  ofertante_nome_guerra?: string;
  ofertante_situacao?: string;
  ofertante_funcao?: string;
  ofertante_local_apresentacao?: string;
  receptor_mat?: string;
  receptor_img?: string;
  receptor_pg?: string | null;
  receptor_nome_guerra?: string | null;
  receptor_situacao?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-");
  const meses = [
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
  return `${dia} ${meses[Number(mes) - 1]}`;
}

function formatarHora(hora: string): string {
  return hora.slice(0, 5); // "HH:MM"
}

// ─── Badge de Status ──────────────────────────────────────────────────────────

function BadgeStatus({
  status,
  updatedAt,
}: {
  status: string;
  updatedAt: string;
}) {
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    ABERTO: { bg: "#819aeb", text: "white", label: "Aberto" },
    ACEITO: { bg: "#49d655", text: "white", label: "Aceito" },
    CANCELADO: { bg: "#f5a1a1", text: "white", label: "Cancelado" },
  };

  const config = statusConfig[status] || {
    bg: "#6b7280",
    text: "white",
    label: status,
  };

  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: config.bg,
        color: config.text,
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "0.75rem",
        fontWeight: 600,
        marginLeft: "8px",
      }}
    >
      {config.label} em {new Date(updatedAt).toLocaleString("pt-BR")}
    </span>
  );
}

// ─── Componente de Confirmação ────────────────────────────────────────────────

type ModalConfirmacaoProps = {
  repasse: Repasse;
  onConfirmar: () => void;
  onCancelar: () => void;
  loading: boolean;
};

function ModalConfirmacao({
  repasse,
  onConfirmar,
  onCancelar,
  loading,
}: ModalConfirmacaoProps) {
  return (
    <div className="modalOverlayRepasse">
      <div className="modalCardRepasse">
        <h2>Tranferência de Serviço</h2>

        <p className="modalTexto">
          Deseja aceitar o serviço de{" "}
          <strong>
            {formatarData(repasse.dataInicioRepasse)} —{" "}
            {formatarHora(repasse.horaInicioRepasse)} às{" "}
            {formatarHora(repasse.horaFimRepasse)}
          </strong>{" "}
          no sistema <strong>{repasse.sistemaRepasse}</strong>?
        </p>

        {repasse.motivo && (
          <p className="modalMotivo">Motivo do repasse: {repasse.motivo}</p>
        )}

        <div className="modalBotoes">
          <button
            className="btnCancelRepasse"
            onClick={onCancelar}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btnSaveRepasse"
            onClick={onConfirmar}
            disabled={loading}
          >
            {loading ? "Aceitando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente de Cartão de Repasse ──────────────────────────────────────────

type CardRepasseProps = {
  repasse: Repasse;
  mostrarReceptor?: boolean;
  onAbrir: (repasse: Repasse) => void;
};

function CardRepasse({
  repasse,
  mostrarReceptor = false,
  onAbrir,
}: CardRepasseProps) {
  const podeAbrir = repasse.statusRepasse === "ABERTO";
  return (
    <div style={{ width: "100%", marginBottom: "15px" }}>
      <div
        className="repasse-title"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1px",
        }}
      >
        CR:{repasse.id} - {formatarData(repasse.dataInicioRepasse)} |{" "}
        {repasse.nome_ome ? ` ${repasse.nome_ome}` : ""}
        <BadgeStatus
          status={repasse.statusRepasse}
          updatedAt={repasse.updatedAt}
        />
      </div>

      <div className="divCardMeuRepasse">
        <div className="divRepasseDadosBasicos">
          {repasse.nome_evento ? ` ${repasse.nome_evento}` : ""}
          {repasse.nome_operacao ? `, ${repasse.nome_operacao}` : ""} -
          {formatarHora(repasse.horaInicioRepasse)} às{" "}
          {formatarHora(repasse.horaFimRepasse)}
        </div>
        <div className="divRepasseSecundaria">
          {/* Hora */}
          {/* Dados do ofertante */}
          <div className="divConteudoMeioRepasse">
            <div className="repasse-texts">
              <div>
                <div style={{ display: "flex" }}>
                  {repasse.ofertante_img ? (
                    <img src={repasse.ofertante_img} className="user-avatar" />
                  ) : (
                    <div className="user-avatar user-avatar-icon">
                      <FaUser className="userRepasseIcon" />
                    </div>
                  )}

                  <div style={{ marginLeft: "8px" }}>
                    <span className="dadosOfertanteRepasse">
                      {repasse.ofertante_pg && `${repasse.ofertante_pg} `}
                      {repasse.matOfertante}{" "}
                      {repasse.ofertante_nome_guerra ?? ""}
                      {repasse.nome_ome ? ` - ${repasse.nome_ome}` : ""}
                    </span>

                    <div style={{ display: "flex" }}>
                      <div style={{ paddingRight: "3px" }}>
                        <FaTriangleExclamation size={12} color="gray" />
                      </div>
                      <span className="repasse-sub">{repasse.funcao}</span>
                    </div>
                    <div style={{ display: "flex" }}>
                      <div style={{ paddingRight: "3px" }}>
                        <FaMapMarkerAlt size={12} color="gray" />
                      </div>
                      <span className="repasse-sub">
                        {repasse.localApresentacao}
                      </span>
                    </div>
                    <div style={{ display: "flex" }}>
                      <div style={{ paddingRight: "3px" }}>
                        <FaInfo size={12} color="gray" />
                      </div>
                      <span className="repasse-sub">{repasse.motivo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* RECEPTOR (se aplicável) */}
          <div
            style={{
              width: "20%",
              textAlign: "center",
            }}
          >
            {mostrarReceptor && repasse.receptorId && repasse.receptor_pg && (
              <div>
                {repasse.receptor_img ? (
                  <img src={repasse.receptor_img} className="user-avatar" />
                ) : (
                  <div className="user-avatar user-avatar-icon">
                    <FaUser className="userReceptorIcon" />
                  </div>
                )}

                <div style={{ textAlign: "center" }}>
                  <div className="dadosReceptorRepasse">
                    {repasse.receptor_pg && `${repasse.receptor_pg} `}
                    {repasse.receptor_nome_guerra ?? ""} <br></br>
                    {repasse.receptor_mat ?? ""}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Botão sistema — abre o modal de confirmação (apenas para disponíveis) */}

          <div
            className="repasse-right"
            role="button"
            tabIndex={podeAbrir ? 0 : -1}
            aria-label={`Aceitar repasse no sistema ${repasse.sistemaRepasse}`}
            onClick={() => {
              if (podeAbrir) {
                onAbrir(repasse);
              }
            }}
            onKeyDown={(e) => {
              if (podeAbrir && e.key === "Enter") {
                onAbrir(repasse);
              }
            }}
            style={{
              cursor: podeAbrir ? "pointer" : "not-allowed",
            }}
          >
            <div className="iconeSistemaRepasse">
              {repasse.sistemaRepasse === "PJES" ? <FiLayers /> : <FiGrid />}
            </div>

            <div>{repasse.sistemaRepasse}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function RepassesPage() {
  const [repassesMeus, setRepassesMeus] = useState<Repasse[]>([]);
  const [repassesDisponiveis, setRepassesDisponiveis] = useState<Repasse[]>([]);
  const [repassesTodos, setRepassesTodos] = useState<Repasse[]>([]);
  const [filtro, setFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"meus-disponiveis" | "historico">(
    "meus-disponiveis",
  );

  // ─── Modal de confirmação ────────────────────────────────────────────────────
  const [repasseSelecionado, setRepasseSelecionado] = useState<Repasse | null>(
    null,
  );
  const [aceitando, setAceitando] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    texto: string;
    tipo: "sucesso" | "erro";
  } | null>(null);

  // ─── Buscar todas as listas em paralelo ──────────────────────────────────────
  const buscarRepasses = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [resMeus, resDisponiveis, resTodos] = await Promise.all([
        fetch("/api/repasse?tipo=meus", { cache: "no-store" }),
        fetch("/api/repasse?tipo=disponiveis", { cache: "no-store" }),
        fetch("/api/repasse", { cache: "no-store" }),
      ]);

      if (!resMeus.ok || !resDisponiveis.ok || !resTodos.ok) {
        throw new Error("Erro ao buscar repasses");
      }

      const dataMeus: Repasse[] = await resMeus.json();
      const dataDisponiveis: Repasse[] = await resDisponiveis.json();
      const dataTodos: Repasse[] = await resTodos.json();

      setRepassesMeus(
        dataMeus.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
      setRepassesDisponiveis(
        dataDisponiveis.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
      setRepassesTodos(
        dataTodos.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (e: any) {
      setErro(e.message ?? "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarRepasses();
  }, [buscarRepasses]);

  // ─── Aceitar repasse ─────────────────────────────────────────────────────────
  async function handleAceitar() {
    if (!repasseSelecionado) return;
    setAceitando(true);
    try {
      const res = await fetch(
        `/api/repasse/${repasseSelecionado.id}?acao=aceitar`,
        { method: "PATCH" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Erro ao aceitar repasse");
      }
      setFeedbackMsg({ texto: "Serviço aceito com sucesso!", tipo: "sucesso" });
      setRepasseSelecionado(null);
      buscarRepasses(); // atualiza a lista
    } catch (e: any) {
      setFeedbackMsg({ texto: e.message, tipo: "erro" });
      setRepasseSelecionado(null);
    } finally {
      setAceitando(false);
    }
  }

  // ─── Função auxiliar de filtro ─────────────────────────────────────────────────
  const filtrarRepasses = (lista: Repasse[]) => {
    const termo = filtro.toLowerCase();
    return lista.filter((r) => {
      return (
        r.matOfertante.toLowerCase().includes(termo) ||
        r.sistemaRepasse.toLowerCase().includes(termo) ||
        (r.ofertante_nome_guerra ?? "").toLowerCase().includes(termo) ||
        (r.nome_ome ?? "").toLowerCase().includes(termo) ||
        (r.nome_evento ?? "").toLowerCase().includes(termo) ||
        (r.nome_operacao ?? "").toLowerCase().includes(termo) ||
        r.dataInicioRepasse.includes(termo)
      );
    });
  };

  const repassesMeusFiltrados = filtrarRepasses(repassesMeus).filter(
    (r) => r.statusRepasse === "ABERTO",
  );
  const repassesDisponiveisFiltrados = filtrarRepasses(repassesDisponiveis);
  const repassesTodosFiltrados = filtrarRepasses(repassesTodos);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <h1 className="h1RepasseTitle">SERVIÇOS</h1>

      {/* Feedback de sucesso/erro */}
      {feedbackMsg && (
        <div
          className={`feedbackBanner ${feedbackMsg.tipo}`}
          onClick={() => setFeedbackMsg(null)}
        >
          {feedbackMsg.texto}
        </div>
      )}

      <div className="divInputBuscarRepasses">
        <input
          className="inputBuscarRepasses"
          type="text"
          placeholder="Buscar"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="divBotaoAbasRepasses">
        <button
          onClick={() => setAbaAtiva("meus-disponiveis")}
          style={{
            width: "50%",
            height: "25px",
            fontSize: "10px",
            borderRadius: "10px",
            padding: "1px",
            border: "solid 1px #ffffff",
            color: "#ffffff",
            background: abaAtiva === "meus-disponiveis" ? "#1660a5" : "#ccc",
          }}
        >
          Meus Repasses e Disponiveis
        </button>
        <button
          onClick={() => setAbaAtiva("historico")}
          style={{
            width: "50%",
            height: "25px",
            fontSize: "10px",
            borderRadius: "10px",
            padding: "1px",
            border: "solid 1px #ffffff",
            color: "#ffffff",
            background: abaAtiva === "historico" ? "#6a17ad" : "#ccc",
          }}
        >
          Historico de Repasses
        </button>
      </div>

      {carregando && (
        <p style={{ textAlign: "center", color: "gray", marginTop: "2rem" }}>
          Carregando...
        </p>
      )}

      {!carregando && erro && (
        <p style={{ textAlign: "center", color: "red", marginTop: "2rem" }}>
          {erro}
        </p>
      )}

      {!carregando &&
        !erro &&
        repassesMeusFiltrados.length === 0 &&
        repassesDisponiveisFiltrados.length === 0 &&
        repassesTodosFiltrados.length === 0 && (
          <p style={{ textAlign: "center", color: "gray", marginTop: "2rem" }}>
            Nenhum repasse disponível no momento.
          </p>
        )}

      <div className="divRepassePrincipal">
        {abaAtiva === "meus-disponiveis" ? (
          <>
            {/* ─── SEÇÃO 1: Repasses que o usuário logado disponibilizou ─── */}
            {repassesMeusFiltrados.length > 0 && (
              <>
                <h2
                  style={{
                    marginTop: "10px",
                    marginBottom: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Meus Serviços
                </h2>
                {repassesMeusFiltrados.map((repasse) => (
                  <CardRepasse
                    key={repasse.id}
                    repasse={repasse}
                    mostrarReceptor={false}
                    onAbrir={() => {}}
                  />
                ))}
                <hr style={{ margin: "2rem 0", borderColor: "#ccc" }} />
              </>
            )}

            {/* ─── SEÇÃO 2: Demais repasses disponíveis ─── */}
            <>
              <h2
                style={{
                  marginTop: "10px",
                  marginBottom: "10px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Serviços Disponíveis
              </h2>
              {repassesDisponiveisFiltrados.length > 0 ? (
                <>
                  {repassesDisponiveisFiltrados.map((repasse) => (
                    <CardRepasse
                      key={repasse.id}
                      repasse={repasse}
                      mostrarReceptor={false}
                      onAbrir={setRepasseSelecionado}
                    />
                  ))}
                  <hr style={{ margin: "2rem 0", borderColor: "#ccc" }} />
                </>
              ) : (
                <p
                  style={{
                    color: "#6b7280",
                    fontStyle: "italic",
                    marginBottom: "2rem",
                  }}
                >
                  Não há serviço disponível
                </p>
              )}
            </>
          </>
        ) : (
          /* ─── SEÇÃO 3: Todos os repasses (com ofertante e receptor) ─── */
          <>
            <h2
              style={{
                marginTop: "10px",
                marginBottom: "10px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Histórico de Serviços
            </h2>
            {repassesTodosFiltrados.length > 0 ? (
              repassesTodosFiltrados.map((repasse) => (
                <CardRepasse
                  key={repasse.id}
                  repasse={repasse}
                  mostrarReceptor={true}
                  onAbrir={setRepasseSelecionado}
                />
              ))
            ) : (
              <p
                style={{
                  color: "#6b7280",
                  fontStyle: "italic",
                  marginBottom: "2rem",
                }}
              >
                Nenhum histórico disponível
              </p>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmação */}
      {repasseSelecionado && (
        <ModalConfirmacao
          repasse={repasseSelecionado}
          onConfirmar={handleAceitar}
          onCancelar={() => setRepasseSelecionado(null)}
          loading={aceitando}
        />
      )}
    </div>
  );
}
