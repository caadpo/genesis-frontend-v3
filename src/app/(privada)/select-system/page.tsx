"use client";

// ─── Imports ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUniversity, FaUser, FaCar, FaMapMarkerAlt } from "react-icons/fa";
import { FiLayers, FiGrid, FiSearch } from "react-icons/fi";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

// ─── Interfaces & Types ───────────────────────────────────────────────────────

interface Viatura {
  id: number;
  patrimonio: string;
  statusVtr: string;
}

interface Escala {
  id: number;
  sistema: string;
  mat_escala: string;
  pg_escala: string;
  ng_escala: string;
  nomeome_escala: string;
  dataInicio: string;
  horaInicio: string;
  horaFim: string;
  cota_escala: number;
  localApresentacao: string;
  funcao: string;
  situacao: string;
  anotacoes: string;
  viaturaId: number | null;
  viatura: Viatura | null;
  nomeOperacao: string;
  nomeEvento: string;
  nomeOme: string;
  operacaoId?: number;
  status_teto: string;
  somacota_escala: number;
  somaCotaFinal: number;
  pagamento: string;
}

type EventoPago = {
  eventoId: number;
  nome_evento: string;
  nome_ome: string;
  sistema: string;
  nome_verba: string;
  total_policiais: number;
  valor_total_evento: number;
  createdAt: string;
  data_prestacao_contas?: string | null;
};

// tipo pra resposta
type UsuarioEspecial = {
  mat: string;
  id: number;
  imagemUrl?: string;
  pg: string;
  nomeGuerra: string;
  ome?: { id: number; nomeOme: string };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function proximasEscalas(escalas: Escala[]): Escala[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return escalas
    .filter((e) => new Date(e.dataInicio) >= hoje)
    .sort(
      (a, b) =>
        new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime(),
    )
    .slice(0, 2);
}

function totalEscalasFuturas(escalas: Escala[]): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return escalas.filter((e) => new Date(e.dataInicio) >= hoje).length;
}

function formatarData(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatarHora(hora: string): string {
  return hora.slice(0, 5);
}

function emojiTurno(hora: string): string {
  const h = parseInt(hora.split(":")[0], 10);
  if (h >= 5 && h < 15) return "☀️";
  return "🌙";
}

function extrairDataPagamento(pagamento: string): string {
  const match = pagamento.match(/(\d{2}\/\d{2}\/\d{4}),?\s*(\d{2}:\d{2})/);
  if (match) return `${match[1]} ${match[2]}`;
  return "Pago";
}

function formatarPrestacaoContas(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const ano = date.getUTCFullYear();
  const hora = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `Prestação de Contas concluida em ${dia}/${mes}/${ano}`;
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function AvatarItem({ mat, nome }: { mat: string; nome: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="avatar-fallback" title={nome}>
        <FaUser size={23} />
      </div>
    );
  }

  return (
    <img
      src={`/avatares/${mat}.jpg`}
      alt={nome}
      title={nome}
      onError={() => setImgError(true)}
    />
  );
}

function Avatares({ membros }: { membros: Escala[] }) {
  if (membros.length === 0) return null;

  const extras = membros.length - 3;

  if (membros.length <= 4) {
    return (
      <div className="avatares">
        {membros.slice(0, 4).map((m) => (
          <AvatarItem key={m.id} mat={m.mat_escala} nome={m.ng_escala} />
        ))}
      </div>
    );
  }

  return (
    <div className="avatares">
      {membros.slice(0, 3).map((m) => (
        <AvatarItem key={m.id} mat={m.mat_escala} nome={m.ng_escala} />
      ))}
      <div className="mais">+{extras}</div>
    </div>
  );
}

function CardEscala({ escala }: { escala: Escala }) {
  const router = useRouter();
  const [membros, setMembros] = useState<Escala[]>([]);

  useEffect(() => {
    if (!escala.operacaoId) return;

    fetch(`/api/escala?operacaoId=${escala.operacaoId}`)
      .then((r) => r.json())
      .then((data) => {
        const todas: Escala[] = data.escalas ?? data;
        const grupo = todas.filter(
          (e) =>
            e.dataInicio === escala.dataInicio &&
            e.horaInicio === escala.horaInicio &&
            e.horaFim === escala.horaFim &&
            e.viaturaId === escala.viaturaId,
        );
        setMembros(grupo);
      })
      .catch(() => setMembros([]));
  }, [escala.operacaoId, escala.dataInicio, escala.horaInicio, escala.horaFim]);

  return (
    <div className="card-escala" onClick={() => router.push("/minhas-escalas")}>
      <div className="top-card">
        <div className="dia-hora">
          {emojiTurno(escala.horaInicio)} {formatarData(escala.dataInicio)},{" "}
          {formatarHora(escala.horaInicio)} às {formatarHora(escala.horaFim)}
        </div>
      </div>

      <div className="nome-escala">
        {escala.nomeEvento} | {escala.sistema}
      </div>

      <div className="tempo">
        <FaMapMarkerAlt style={{ marginRight: 4 }} />
        {escala.localApresentacao}
      </div>

      <Avatares membros={membros} />

      <div className="linha" />

      <div className="rodape-card">
        <div>
          <span>
            <FaUniversity /> {escala.nomeOme}
          </span>
        </div>
        <div>
          <span style={{ paddingRight: "16px" }}>
            <FaUser /> {escala.funcao}
          </span>
          {escala.viatura && (
            <span>
              <FaCar /> {escala.viatura.patrimonio}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PagamentoItem({ escala }: { escala: Escala }) {
  const router = useRouter();
  const isPjes = escala.sistema === "PJES";

  return (
    <div className="pagamentos">
      <div
        className="pay-item"
        onClick={() => router.push("/pagamentos")}
        style={{ cursor: "pointer" }}
      >
        <div className="pay-left">
          <div className={isPjes ? "pay-icon-pjes" : "pay-icon-diaria"}>
            {isPjes ? <FiLayers /> : <FiGrid />}
          </div>
          <div className="pay-texts">
            <span className="pay-title">{escala.nomeOme}</span>
            <span className="pay-sub">
              {escala.sistema} | {escala.nomeEvento}
            </span>
          </div>
        </div>
        <div className="pay-right">
          <span className="pay-badge">
            {extrairDataPagamento(escala.pagamento)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function SelectSystem() {
  const router = useRouter();
  const { user } = useCurrentUser();

  // ─── State ─────────────────────────────────────────────────────────────

  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorEscalas, setErrorEscalas] = useState<string | null>(null);

  const [eventosPagos, setEventosPagos] = useState<EventoPago[]>([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(true);

  // state
  const [usuariosEspeciais, setUsuariosEspeciais] = useState<UsuarioEspecial[]>(
    [],
  );
  const [loadingEspeciais, setLoadingEspeciais] = useState(true);

  // ─── Derivados ─────────────────────────────────────────────────────────

  const typeUser = user?.typeUser;
  const podePjes = typeUser !== 1 && typeUser !== 5 && typeUser !== 6;
  const podeDiarias = typeUser !== 1;
  const proximas = proximasEscalas(escalas);
  const totalFuturas = totalEscalasFuturas(escalas);

  // ─── Effects ───────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchEscalas() {
      try {
        const res = await fetch("/api/escala/minhas", { cache: "no-store" });
        if (!res.ok) throw new Error();
        setEscalas(await res.json());
      } catch {
        setErrorEscalas("Não foi possível carregar as escalas.");
      } finally {
        setLoading(false);
      }
    }
    fetchEscalas();
  }, []);

  // Lista dos Auxiliares (Usuarios Especiais)
  useEffect(() => {
    fetch("/api/user/especiais?limit=4", { cache: "no-store" })
      .then((r) => r.json())
      .then(setUsuariosEspeciais)
      .catch(() => setUsuariosEspeciais([]))
      .finally(() => setLoadingEspeciais(false));
  }, []);

  useEffect(() => {
    fetch("/api/pagamento/evento?limit=10", { cache: "no-store" })
      .then((r) => r.json())
      .then(setEventosPagos)
      .catch(() => {})
      .finally(() => setLoadingPagamentos(false));
  }, []);

  {
    /* ATENÇÃO AJUSTAR APENAS OS DADOS MOKADOS */
  }

  const prestacoesMock = [
    {
      id: 1,
      logo: "/logo_dpo.png",
      nome: "AGO | PJES PMPE",
      dataHora: "04/09/2026 às 19:30",
    },
    {
      id: 2,
      logo: "/pe_logo.png",
      nome: "AGO | PJES PE",
      dataHora: "04/09/2026 às 19:30",
    },
    {
      id: 3,
      logo: "/mobi_logo.png",
      nome: "AGO | PJES CTM(BRT)",
      dataHora: "04/09/2026 às 19:30",
    },
  ];

  function PrestacaoContasList() {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          marginBottom: " 20px",
        }}
      >
        {prestacoesMock.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              backgroundColor: "#ffffff",
              border: "1px solid #e6e8e6",
              borderRadius: 10,
              padding: "5px 8px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#f4f6f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <img
                src={item.logo}
                alt={item.nome}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: 4,
                }}
              />
            </div>

            {/* Texto */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                }}
              >
                {item.nome}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                }}
              >
                Prestação de contas concluída
              </span>
            </div>

            {/* Badge de status */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#0c832f",
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}
              >
                ✓ Concluída
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#374151",
                  backgroundColor: "#eef1ee",
                  borderRadius: 6,
                  padding: "2px 8px",
                }}
              >
                {item.dataHora}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  {
    /* ATENÇÃO AJUSTAR APENAS OS DADOS MOKADOS */
  }

  // ─── Novo sub-componente (avatar com fallback) ────────────────────────────

  function AvatarEspecial({ mat, nome }: { mat?: string; nome: string }) {
    const [imgError, setImgError] = useState(false);

    const boxStyle: React.CSSProperties = {
      width: "48px",
      height: "48px",
      borderRadius: "10px",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#eef1ee",
      flexShrink: 0,
    };

    if (!mat || imgError) {
      return (
        <div style={boxStyle} title={nome}>
          <FaUser size={20} color="#8a8f8a" />
        </div>
      );
    }

    return (
      <div style={boxStyle}>
        <img
          src={`/avatares/${mat}.jpg`}
          alt={nome}
          title={nome}
          onError={() => setImgError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="container">
      {/* ── Escolha do sistema ───────────────────────────────────────────── */}
      <div className="div-itens-sistema">
        <div className="titulo">
          <span
            style={{
              fontSize: 14,
            }}
          >
            SISTEMAS
          </span>
          <div className="badge">2</div>
        </div>

        <div className="topArea">
          <button
            className="select-card select-card-blue"
            onClick={() => router.push("/pjes")}
          >
            <div className="left">
              <FiLayers className="icon" />
              <span style={{ fontSize: "20px" }}>PJES</span>
            </div>
            <FiLayers style={{ fontSize: "30px", color: "#3a60c8" }} />
          </button>
          <button
            className="select-card select-card-green"
            onClick={() => router.push("/diarias")}
          >
            <div className="left">
              <FiGrid className="icon" />
              <span style={{ fontSize: "20px" }}>DIÁRIAS</span>
            </div>
            <FiGrid style={{ fontSize: "30px", color: "#0db988" }} />
          </button>
        </div>
      </div>

      {/* ── Avisos ───────────────────────────────────────────────── */}
      <div className="div-itens-sistema">
        <div>
          <div className="header-escalas">
            <div className="titulo">
              <span
                style={{
                  fontSize: 14,
                }}
              >
                AVISOS
              </span>
              <div className="badge">1</div>
            </div>
            <div
              onClick={() => router.push("/minhas-escalas")}
              className="verTodas-badge"
            >
              Ver todos
            </div>
          </div>
          <span className="tituloProximas">Em destaque</span>
        </div>

        <PrestacaoContasList />
      </div>

      {/* ── Minhas Escalas ───────────────────────────────────────────────── */}
      <div className="div-itens-sistema">
        <div>
          <div className="header-escalas">
            <div className="titulo">
              <span
                style={{
                  fontSize: 14,
                }}
              >
                MINHAS ESCALAS
              </span>
              <div className="badge">{totalFuturas}</div>
            </div>

            <div
              onClick={() => router.push("/minhas-escalas")}
              className="verTodas-badge"
            >
              Ver todas
            </div>
          </div>
          <span className="tituloProximas">Proximas</span>
        </div>

        {loading && (
          <p style={{ color: "#888", fontSize: 12 }}>Carregando escalas...</p>
        )}
        {errorEscalas && (
          <p style={{ color: "#e53e3e", fontSize: 12 }}>{errorEscalas}</p>
        )}
        {!loading && !errorEscalas && proximas.length === 0 && (
          <div
            style={{
              color: "#888",
              fontSize: 12,
              backgroundColor: "#cfecf17a",
              borderRadius: "6px",
              padding: "12px",
              marginTop: "5px",
              marginBottom: "10px",
            }}
          >
            Nenhuma escala próxima encontrada.
          </div>
        )}

        <div style={{ display: "flex", gap: "1px" }}>
          {proximas.map((escala) => (
            <CardEscala key={escala.id} escala={escala} />
          ))}
        </div>
      </div>

      {/* ── Inicio Usuarios Especiais ───────────────────────────────────────────── */}
      <div style={{ width: "100%" }}>
        <div className="header-escalas">
          <div className="titulo">
            <span style={{ fontSize: 14 }}>AUXILIARES</span>
            {usuariosEspeciais.length > 0 && (
              <div className="badge">{usuariosEspeciais.length}</div>
            )}
          </div>
          <div
            onClick={() => router.push("/auxiliares")}
            className="verTodas-badge"
          >
            Ver todos
          </div>
        </div>

        {loadingEspeciais && (
          <p style={{ color: "#888", fontSize: 12 }}>Carregando...</p>
        )}

        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "10px",
          }}
        >
          {usuariosEspeciais.map((u) => (
            <div
              key={u.id}
              style={{
                border: "solid 1px #eee9e9",
                borderRadius: "5px",
                padding: "8px 4px",
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                backgroundColor: "#faf7f7",
              }}
            >
              <AvatarEspecial mat={u.mat} nome={u.nomeGuerra} />

              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginTop: 6,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                }}
              >
                {u.pg} {u.nomeGuerra}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                }}
              >
                {u.ome?.nomeOme}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ── Fim Usuarios Especiais ───────────────────────────────────────────── */}

      {/* ── Inicio Últimos Pagamentos ───────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          border: "solid 1px #d3d0d0",
          borderRadius: "5px",
          padding: "5px",
          maxHeight: "400px",
          marginBottom: "40px",
        }}
      >
        <div className="div-itens">
          <div className="header-escalas">
            <div className="titulo">
              <span
                style={{
                  fontSize: 14,
                }}
              >
                ULTIMOS PAGAMENTOS
              </span>
              {eventosPagos.length > 0 && (
                <div className="badge">{eventosPagos.length}</div>
              )}
            </div>
          </div>

          <div style={{ overflow: "auto" }}>
            {loadingPagamentos && (
              <p style={{ color: "#888", fontSize: 12 }}>
                Carregando pagamentos...
              </p>
            )}

            {!loadingPagamentos && eventosPagos.length === 0 && (
              <p style={{ color: "#888", fontSize: 12 }}>
                Nenhum pagamento confirmado.
              </p>
            )}

            {eventosPagos.map((ev) => {
              const isPjes = ev.sistema === "PJES";
              const prestacaoTexto = formatarPrestacaoContas(
                ev.data_prestacao_contas,
              );

              return (
                <div
                  key={`${ev.sistema}-${ev.eventoId}`}
                  className="pagamentos"
                  onClick={() => router.push("/pagamentos")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="pay-item">
                    <div className="pay-left">
                      <div
                        className={isPjes ? "pay-icon-pjes" : "pay-icon-diaria"}
                      >
                        {isPjes ? <FiLayers size={18} /> : <FiGrid size={18} />}
                      </div>
                      <div className="pay-texts">
                        {!isPjes && (
                          <span className="pay-title">{ev.nome_ome}</span>
                        )}
                        <span className="pay-sub">
                          {ev.sistema} |{" "}
                          {isPjes ? ev.nome_verba : ev.nome_evento}
                        </span>
                        {prestacaoTexto && (
                          <span
                            className="pay-sub"
                            style={{ color: "#1976d2", fontSize: 11 }}
                          >
                            {prestacaoTexto}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pay-right">
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          textAlign: "left",
                          marginBottom: 2,
                          color: "#8e9092",
                        }}
                      >
                        Pago em
                      </div>
                      <div className="pay-badge">
                        {new Date(ev.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* ── Fim Últimos Pagamentos ───────────────────────────────────────────── */}
    </div>
  );
}
