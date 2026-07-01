"use client";

// ─── Imports ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUniversity, FaUser, FaCar, FaMapMarkerAlt } from "react-icons/fa";
import { FiLayers, FiGrid, FiSearch } from "react-icons/fi";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import BuscaCopModal from "@/src/components/ui/BuscaCopModal";

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
            e.viaturaId === escala.viaturaId, // ← agrupa pela mesma viatura
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
        <div
          className={`badge-sistema ${
            escala.sistema === "PJES" ? "badge-pjes" : "badge-diaria"
          }`}
        >
          {escala.sistema}
        </div>
      </div>

      <div className="nome-escala">{escala.nomeEvento}</div>

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

  useEffect(() => {
    fetch("/api/pagamento/evento?limit=10", { cache: "no-store" })
      .then((r) => r.json())
      .then(setEventosPagos)
      .catch(() => {})
      .finally(() => setLoadingPagamentos(false));
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="container">
      {/* ── Escolha do sistema ───────────────────────────────────────────── */}
      <div className="div-itens-sistema">
        <div className="titulo">
          <span>SISTEMAS</span>
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
            <FiLayers style={{ fontSize: "60px", color: "#3a60c8" }} />
          </button>
          <button
            className="select-card select-card-green"
            onClick={() => router.push("/diarias")}
          >
            <div className="left">
              <FiGrid className="icon" />
              <span style={{ fontSize: "20px" }}>DIÁRIAS</span>
            </div>
            <FiGrid style={{ fontSize: "60px", color: "#0db988" }} />
          </button>
        </div>
      </div>

      {/* ── Avisos ───────────────────────────────────────────────── */}
      <div className="div-itens-sistema">
        <div>
          <div className="header-escalas">
            <div className="titulo">
              <span>AVISOS</span>
              <div className="badge">{totalFuturas}</div>
            </div>
            <span
              className="ver-todas"
              onClick={() => router.push("/minhas-escalas")}
            >
              Ver todos &gt;
            </span>
          </div>
          <span className="tituloProximas">Em destaque</span>
        </div>

        <div
          style={{
            color: "#888",
            fontSize: 14,
            backgroundColor: "#dad4d4",
            borderRadius: "6px",
            padding: "12px",
            marginTop: "5px",
            marginBottom: "10px",
          }}
        >
          Lista Vazia.
        </div>
      </div>

      {/* ── Minhas Escalas ───────────────────────────────────────────────── */}
      <div className="div-itens-sistema">
        <div>
          <div className="header-escalas">
            <div className="titulo">
              <span>MINHAS ESCALAS</span>
              <div className="badge">{totalFuturas}</div>
            </div>
            <span
              className="ver-todas"
              onClick={() => router.push("/minhas-escalas")}
            >
              Ver todas &gt;
            </span>
          </div>
          <span className="tituloProximas">Proximas</span>
        </div>

        {loading && (
          <p style={{ color: "#888", fontSize: 14 }}>Carregando escalas...</p>
        )}
        {errorEscalas && (
          <p style={{ color: "#e53e3e", fontSize: 14 }}>{errorEscalas}</p>
        )}
        {!loading && !errorEscalas && proximas.length === 0 && (
          <div
            style={{
              color: "#888",
              fontSize: 14,
              backgroundColor: "#dad4d4",
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

      {/* ── Últimos Pagamentos ───────────────────────────────────────────── */}
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
              <span>ULTIMOS PAGAMENTOS</span>
              {eventosPagos.length > 0 && (
                <div className="badge">{eventosPagos.length}</div>
              )}
            </div>
            <span
              className="ver-todas"
              onClick={() => router.push("/pagamentos")}
            >
              Ver todas &gt;
            </span>
          </div>

          <div style={{ overflow: "auto" }}>
            {loadingPagamentos && (
              <p style={{ color: "#888", fontSize: 14 }}>
                Carregando pagamentos...
              </p>
            )}

            {!loadingPagamentos && eventosPagos.length === 0 && (
              <p style={{ color: "#888", fontSize: 14 }}>
                Nenhum pagamento confirmado.
              </p>
            )}

            {eventosPagos.map((ev) => {
              const isPjes = ev.sistema === "PJES";
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
                          {ev.sistema} | {ev.nome_evento}
                        </span>
                      </div>
                    </div>
                    <div className="pay-right">
                      <span className="pay-badge">
                        {new Date(ev.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
