"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useApi } from "@/src/hooks/useApi";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { apiFetch } from "@/src/lib/api";
import {
  FiStar,
  FiChevronUp,
  FiUnlock,
  FiSettings,
  FiMoreVertical,
} from "react-icons/fi";
import { FaFilePdf, FaEdit, FaTrash } from "react-icons/fa";
import { BsCurrencyDollar } from "react-icons/bs";
import { toast } from "react-hot-toast";
import EventoModal from "@/src/components/ui/EventoModal";
import ResumoEventoModal from "@/src/components/ui/ResumoEventoModal";
import OperacaoModal from "@/src/components/ui/OperacaoModal";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Teto = {
  id: number;
  imagemUrl: string;
  nome_verba: string;
  data_inicio: string;
  data_fim: string;
};
type Distribuicao = {
  id: number;
  nome_dist: string;
  qtd_dist_of: number;
  totalCotasOficiais: number;
  saldo_of: number;
  qtd_dist_prc: number;
  totalCotasPracas: number;
  saldo_prc: number;
  diretoria: { nomeDiretoria: string };
};
type Evento = {
  id: number;
  nome_evento: string;
  ne: string;
  qtd_of_evento: number;
  totalCotasOficiais: number;
  qtd_prc_evento: number;
  totalCotasPracas: number;
  status_evento: string;
  updated_at: string;
  homologado_em: string;
  ome: { id: number; nomeOme: string; diretoria: { nomeDiretoria: string } };
  user: {
    pg: string;
    nomeGuerra: string;
    ome: { diretoria: { nomeDiretoria: string } };
  };
};
type Operacao = {
  id: number;
  nome_operacao: string;
  qtd_oficiais_oper: number;
  totalCotasOficiais: number;
  qtd_pracas_oper: number;
  totalCotasPracas: number;
  cod_op: string;
  ome: { nomeOme: string };
};

// ─── Enum de Status ───────────────────────────────────────────────────────────

enum STATUS_EVENTO {
  CRIADO = "CRIADO",
  HOMOLOGADO = "HOMOLOGADO",
  PD_CONCLUIDA = "PD_CONCLUIDA",
  PAGO = "PAGO",
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function DiariasDiretoriaSelectPage() {
  const params = useSearchParams();
  const tetoId = Number(params?.get("tetoId"));
  const distribuicaoId = Number(params?.get("distribuicaoId"));
  // ─── Estados ────────────────────────────────────────────────────────────────
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(
    null,
  );
  const [resumoEventoId, setResumoEventoId] = useState<number | null>(null);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [openModalOperacao, setOpenModalOperacao] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [editandoOperacao, setEditandoOperacao] = useState<Operacao | null>(
    null,
  );
  const [menuAberto, setMenuAberto] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);

  // ─── Dados do usuário autenticado ────
  const { user, loading: loadingUser } = useCurrentUser();
  const router = useRouter();

  // ─── API ─────────────────────────────────────────────────────────────────────
  const { data: tetos } = useApi<Teto[]>(`/api/tetos?sistema=DIARIAS`, [
    tetoId,
  ]);

  //Atualiza o saldo sem precisar atualizar a pagina
  const [distribuicao, setDistribuicao] = useState<Distribuicao | null>(null);
  async function carregarDistribuicao() {
    if (!distribuicaoId) return;
    const res = await fetch(`/api/distribuicao/${distribuicaoId}`);
    const data = await res.json();
    setDistribuicao(data);
  }

  useEffect(() => {
    carregarDistribuicao();
  }, [distribuicaoId]);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);

  const teto = tetos?.find((t) => t.id === tetoId);
  const outrosTetos = tetos?.filter((t) => t.id !== tetoId) || [];

  // ─── Recarregar eventos manualmente ─────────────────────────────────────────
  async function carregarEventos() {
    if (!distribuicaoId) return;
    setLoadingEventos(true);
    const res = await fetch(`/api/evento?distribuicaoId=${distribuicaoId}`);
    const data = await res.json();
    setEventos(data);
    setLoadingEventos(false);
  }

  useEffect(() => {
    carregarEventos();
  }, [distribuicaoId]);

  // ─── Carregar operações do evento selecionado ────────────────────────────────
  async function carregarOperacoes(evento: Evento) {
    const res = await fetch(`/api/operacao?eventoId=${evento.id}`);
    const data = await res.json();
    setOperacoes(data);
  }

  useEffect(() => {
    if (!eventoSelecionado) return;
    carregarOperacoes(eventoSelecionado);
  }, [eventoSelecionado]);

  // ─── Fechar menu ao clicar fora ──────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Excluir evento ──────────────────────────────────────────────────────────
  async function excluirEvento(id: number) {
    const ok = confirm("Deseja realmente excluir este evento?");
    if (!ok) return;

    const promise = apiFetch(`/api/evento/${id}`, {
      method: "DELETE",
    }).then(async (res) => {
      if (!res.ok) {
        const erro = await res.text();
        throw new Error(erro || "Erro ao excluir evento");
      }
      return res;
    });

    toast.promise(promise, {
      loading: "Excluindo evento...",
      success: "Evento excluído com sucesso ✅",
      error: (err) => err.message || "Erro ao excluir ❌",
    });

    await promise;
    carregarEventos();
  }

  // ─── Alterar status do evento ────────────────────────────────────────────────
  async function alterarStatus(id: number, status: STATUS_EVENTO) {
    const res = await apiFetch(`/api/evento/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) throw new Error("Erro ao alterar status");

    const data = await res.json();

    setEventos((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status_evento: data.status_evento,
              updated_at: data.updated_at,
            }
          : e,
      ),
    );

    setMenuAberto(null);
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

  // ─── Cores dos ícones por status ─────────────────────────────────────────────
  function getCoresStatus(status: string) {
    switch (status) {
      case STATUS_EVENTO.CRIADO:
        return { unlock: "green", settings: "gray", money: "gray" };
      case STATUS_EVENTO.HOMOLOGADO:
        return { unlock: "red", settings: "orange", money: "gray" };
      case STATUS_EVENTO.PD_CONCLUIDA:
        return { unlock: "red", settings: "red", money: "green" };
      case STATUS_EVENTO.PAGO:
        return { unlock: "red", settings: "red", money: "red" };
      default:
        return { unlock: "gray", settings: "gray", money: "gray" };
    }
  }

  // ─── Excluir Operacao ──────────────────────────────────────────────────────────
  async function excluirOperacao(id: number) {
    const ok = confirm("Deseja realmente excluir esta operacao?");
    if (!ok) return;

    const promise = apiFetch(`/api/operacao/${id}`, {
      method: "DELETE",
    }).then(async (res) => {
      if (!res.ok) {
        const erro = await res.text();
        throw new Error(erro || "Erro ao excluir operacao");
      }
      return res;
    });

    toast.promise(promise, {
      loading: "Excluindo operacao...",
      success: "Operacao excluída com sucesso ✅",
      error: (err) => err.message || "Erro ao excluir ❌",
    });

    await promise;

    // ✅ Recarrega operações do evento atual, não os eventos
    if (eventoSelecionado) carregarOperacoes(eventoSelecionado);
  }

  async function recarregarTudo() {
    await Promise.all([carregarEventos(), carregarDistribuicao()]);
  }

  const eventosFiltrados = eventos.filter((e) => {
    const term = searchText.toLowerCase();
    const matchTexto =
      !term ||
      e.nome_evento.toLowerCase().includes(term) ||
      e.ome.nomeOme.toLowerCase().includes(term) ||
      (e.ne ?? "").toLowerCase().includes(term);

    const matchStatus = !filtroStatus || e.status_evento === filtroStatus;

    return matchTexto && matchStatus;
  });

  const isAuxiliar = Number(user?.typeUser) === 2;

  // Somas dos eventos visíveis (para o AUXILIAR)
  const somaQtdOf = eventos.reduce((acc, e) => acc + e.qtd_of_evento, 0);
  const somaQtdPrc = eventos.reduce((acc, e) => acc + e.qtd_prc_evento, 0);
  const somaCotasOf = eventos.reduce((acc, e) => acc + e.totalCotasOficiais, 0);
  const somaCotasPrc = eventos.reduce((acc, e) => acc + e.totalCotasPracas, 0);
  const saldoOf = somaQtdOf - somaCotasOf;
  const saldoPrc = somaQtdPrc - somaCotasPrc;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center" }}>
        <h1 className="h1DiretoriaSelect">
          DIARIAS |{" "}
          {teto?.data_inicio
            ? new Date(teto.data_inicio).toLocaleDateString("pt-BR")
            : ""}{" "}
          a{" "}
          {teto?.data_fim
            ? new Date(teto.data_fim).toLocaleDateString("pt-BR")
            : ""}
        </h1>

        {[10, 9, 7, 3].includes(Number(user?.typeUser)) && (
          <button
            onClick={() => {
              setEditando(null);
              setOpenModal(true);
            }}
            className="botaoCriarEvento"
          >
            CRIAR EVENTO
          </button>
        )}
      </div>

      <div className="divDiretoriaTeto">
        {/* 🔷 Card principal */}
        <div className="divDiretoriaTetoSelecionado">
          {teto && distribuicao && (
            <div className="cardTetoSelecionado">
              {/* ESQUERDA */}
              <div className="tetoLeft">
                <img src={teto.imagemUrl} alt={teto.nome_verba} />
                <div className="nomeVerba">{teto.nome_verba}</div>
              </div>

              {/* DIREITA */}
              {distribuicao && (
                <div className="tetoRight">
                  <div className="nomeDiretoria">
                    {distribuicao.diretoria.nomeDiretoria} |{" "}
                    {distribuicao.nome_dist}
                  </div>

                  <div className="cotasBox">
                    <div>
                      <div>
                        <div>
                          <FiStar />
                        </div>
                        <div>OFICIAIS</div>
                      </div>
                      <strong>
                        {isAuxiliar ? somaQtdOf : distribuicao.qtd_dist_of} |{" "}
                        {isAuxiliar
                          ? somaCotasOf
                          : distribuicao.totalCotasOficiais}
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
                        {isAuxiliar ? somaQtdPrc : distribuicao.qtd_dist_prc} |{" "}
                        {isAuxiliar
                          ? somaCotasPrc
                          : distribuicao.totalCotasPracas}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="saldoDiretoria">
                <span>Saldo</span>
                <div className="saldoDiretoriaiconeValor">
                  <div>
                    <FiStar />
                  </div>
                  <div className="saldoDiretoriaValor">
                    {isAuxiliar ? saldoOf : distribuicao.saldo_of}
                  </div>
                </div>
                <div className="saldoDiretoriaIconePrc">
                  <div>
                    <FiChevronUp />
                  </div>
                  <div className="saldoDiretoriaValor">
                    {isAuxiliar ? saldoPrc : distribuicao.saldo_prc}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🔷 Outros tetos */}
        <div className="divDiretoriaOutrosWrapper">
          {outrosTetos.map((teto) => (
            <div key={teto.id} className="cardTetoSecundario">
              <img src={teto.imagemUrl} alt={teto.nome_verba} />
            </div>
          ))}
        </div>
      </div>

      {/* 🔻 Próxima etapa: Eventos e Operações */}
      <div className="divDiretoriaEventoOperacaoPrincipal">
        <div className="divDiretoriaEvento">
          <div className="divTituloEvento">
            <h4>EVENTOS</h4>
          </div>
          <div className="divInputBuscarEventoEIcones">
            <div style={{ width: "50%" }}>
              <input
                className="inputBuscarEvento"
                type="text"
                placeholder="Buscar por OME, evento ou NE"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {(() => {
              const qtdCriado = eventos.filter(
                (e) => e.status_evento === STATUS_EVENTO.CRIADO,
              ).length;
              const qtdHomologado = eventos.filter(
                (e) => e.status_evento === STATUS_EVENTO.HOMOLOGADO,
              ).length;
              const qtdPdConcluida = eventos.filter(
                (e) => e.status_evento === STATUS_EVENTO.PD_CONCLUIDA,
              ).length;

              const toggle = (status: string) =>
                setFiltroStatus((prev) => (prev === status ? null : status));

              return (
                <div className="divIconeCadeadoCatracaDolar">
                  <div
                    style={{
                      marginRight: "5px",
                      cursor: "pointer",
                      opacity: filtroStatus === STATUS_EVENTO.CRIADO ? 1 : 0.4,
                    }}
                    onClick={() => toggle(STATUS_EVENTO.CRIADO)}
                  >
                    <FiUnlock size={15} color="green" />
                  </div>
                  <div className="divTtEventoAberto">{qtdCriado}</div>

                  <div
                    style={{
                      marginLeft: "15px",
                      marginRight: "5px",
                      cursor: "pointer",
                      opacity:
                        filtroStatus === STATUS_EVENTO.HOMOLOGADO ? 1 : 0.4,
                    }}
                    onClick={() => toggle(STATUS_EVENTO.HOMOLOGADO)}
                  >
                    <FiSettings size={15} color="orange" />
                  </div>
                  <div style={{ textAlign: "right", color: "orange" }}>
                    {qtdHomologado}
                  </div>

                  <div
                    style={{
                      marginLeft: "15px",
                      marginRight: "5px",
                      cursor: "pointer",
                      opacity:
                        filtroStatus === STATUS_EVENTO.PD_CONCLUIDA ? 1 : 0.4,
                    }}
                    onClick={() => toggle(STATUS_EVENTO.PD_CONCLUIDA)}
                  >
                    <BsCurrencyDollar size={15} color="purple" />
                  </div>
                  <div style={{ textAlign: "right", color: "purple" }}>
                    {qtdPdConcluida}
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      paddingLeft: "10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <button
                      className="botaoFiltrarStatusEventoPago"
                      style={{
                        opacity: filtroStatus === STATUS_EVENTO.PAGO ? 1 : 0.4,
                      }}
                      onClick={() => toggle(STATUS_EVENTO.PAGO)}
                    >
                      Pago
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {eventosFiltrados.map((evento) => {
            const cores = getCoresStatus(evento.status_evento);
            const permissoes = user
              ? getPermissoesEvento(evento.status_evento, user.typeUser)
              : {
                  podeHomologar: false,
                  podeDeHomologar: false,
                  podePD: false,
                  podePago: false,
                };

            return (
              <div
                key={evento.id}
                className={`divEventoIconeItemPrincipal ${
                  eventoSelecionado?.id === evento.id
                    ? "divEventoSelecionado"
                    : ""
                }`}
                onClick={() =>
                  setEventoSelecionado((prev) =>
                    prev?.id === evento.id ? prev : evento,
                  )
                }
              >
                <div className="divEventoIconeTitleItem">
                  <div>
                    <img
                      style={{ width: "40px", height: "40px" }}
                      src={teto?.imagemUrl}
                    />
                  </div>

                  <div className="divEventoTitleItem">
                    {evento.user.ome.diretoria.nomeDiretoria}
                  </div>
                </div>

                <div className="divEventoDireitaItemPrincipal">
                  <div>
                    <div className="divEventoDireitaItemSecundario">
                      <div style={{ width: "100%" }}>{evento.ome.nomeOme}</div>

                      <div className="divEventoDireitaIconesSuperior">
                        <div className="divEventoDireitaIcones">
                          {/* 🔥 ÍCONES DINÂMICOS POR STATUS */}
                          <FiUnlock size={15} color={cores.unlock} />
                          <button
                            className="botaoResumoEvento"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResumoEventoId(evento.id);
                            }}
                          >
                            Resumo
                          </button>
                          <FiSettings size={15} color={cores.settings} />
                          <BsCurrencyDollar size={15} color={cores.money} />
                          {evento.status_evento === STATUS_EVENTO.PAGO && (
                            <span
                              style={{
                                background: "#11b81e",
                                color: "white",
                                borderRadius: "4px",
                                padding: "1px 7px",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              PAGO
                            </span>
                          )}

                          <FiMoreVertical
                            size={15}
                            color="black"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              setMenuAberto(
                                menuAberto === evento.id ? null : evento.id,
                              )
                            }
                          />

                          {menuAberto === evento.id && (
                            <div ref={menuRef} className="dropdownMenu">
                              <div
                                className={`dropdownItem ${
                                  !permissoes.podeDeHomologar ? "disabled" : ""
                                }`}
                                onClick={() => {
                                  if (!permissoes.podeDeHomologar) return;

                                  alterarStatus(
                                    evento.id,
                                    STATUS_EVENTO.CRIADO,
                                  );
                                }}
                              >
                                Des-homologar
                              </div>

                              <div
                                className={`dropdownItem ${
                                  !permissoes.podePago ? "disabled" : ""
                                }`}
                                onClick={() => {
                                  if (!permissoes.podePago) return;

                                  alterarStatus(evento.id, STATUS_EVENTO.PAGO);
                                }}
                              >
                                Pago
                              </div>

                              <div
                                className="dropdownItem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuAberto(null);
                                  setEditando(evento);
                                  setOpenModal(true);
                                }}
                              >
                                Editar
                              </div>

                              <div
                                className="dropdownItem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuAberto(null);
                                  excluirEvento(evento.id);
                                }}
                              >
                                Excluir
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="divEventoDireitaNomeEvento">
                      {evento.nome_evento}
                    </div>

                    <div className="linhaOficiaisPracas">
                      <div className="itemOficiaisPracas">
                        Oficiais: {evento.qtd_of_evento} |{" "}
                        {evento.totalCotasOficiais}
                      </div>

                      <div className="itemOficiaisPracas direita">
                        Praças: {evento.qtd_prc_evento} |{" "}
                        {evento.totalCotasPracas}
                      </div>
                    </div>
                    <div className="itemOficiaisPracas direita">
                      <span style={{ fontSize: "15px" }}>
                        NE: {evento.ne} |{" "}
                        {(
                          (evento.totalCotasOficiais +
                            evento.totalCotasPracas) *
                          180
                        ).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="divDiretoriaOperacao">
          {eventoSelecionado ? (
            <div className="operacoesMobileDentroEvento">
              <div className="divTituloOperacao">
                <h4>OPERAÇÕES</h4>
              </div>
              <div className="divInputBuscarOperacaoEIcones">
                <input
                  className="inputBuscarOperacao"
                  type="text"
                  placeholder="Buscar"
                />
                <div className="divCriarOperacao">
                  <button
                    onClick={() => {
                      setEditandoOperacao(null);
                      setOpenModalOperacao(true);
                    }}
                    className="botaoCriarOperacao"
                  >
                    CRIAR OPERAÇÃO
                  </button>
                </div>
              </div>
              <table className="tabelaOperacoes">
                <thead>
                  <tr className="tabelaHeader">
                    <th>UNIDADE</th>
                    <th>OPERAÇÃO</th>
                    <th>OFICIAIS</th>
                    <th>PRAÇAS</th>
                    <th>COD OPERAÇÃO</th>
                    <th>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {operacoes.map((op) => (
                    <tr key={op.id} className="tabelaLinha">
                      <td className="colOperacao">{op.ome.nomeOme}</td>
                      <td>{op.nome_operacao}</td>
                      <td>
                        {" "}
                        {op.qtd_oficiais_oper} | {op.totalCotasOficiais}
                      </td>
                      <td>
                        {op.qtd_pracas_oper} | {op.totalCotasPracas}
                      </td>
                      <td>{op.cod_op}</td>
                      <td className="acoesTabela">
                        <button
                          className="botaoAddPoliciais"
                          onClick={() => {
                            router.push(
                              `/diarias-escalas?&tetoId=${tetoId}&operacaoId=${op.id}`,
                            );
                          }}
                        >
                          Adicionar Policiais
                        </button>

                        <FaEdit
                          size={16}
                          color="orange"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuAberto(null);
                            setEditandoOperacao(op);
                            setOpenModalOperacao(true);
                          }}
                        />
                        <FaTrash
                          size={16}
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuAberto(null);
                            excluirOperacao(op.id);
                          }}
                        />
                        <FaFilePdf size={16} color="blue" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.2,
                  marginTop: "50px",
                }}
              >
                <img
                  src="/logo_pmpe.jpg"
                  alt=""
                  style={{ width: "20%", height: "20%" }}
                />
                <img
                  src="/logo_dpo.png"
                  alt=""
                  style={{ width: "22%", height: "22%" }}
                />
              </div>

              <div
                style={{
                  fontSize: "18px",
                  color: "#b6b5b5",
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                DIRETORIA DE PLANEJAMENTO
              </div>
            </div>
          )}
        </div>
      </div>
      <EventoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditando(null);
        }}
        onCreated={recarregarTudo}
        evento={editando}
        distribuicao={distribuicao}
      />

      <ResumoEventoModal
        open={resumoEventoId !== null}
        onClose={() => {
          setResumoEventoId(null);
          recarregarTudo();
        }}
        eventoId={resumoEventoId}
      />

      <OperacaoModal
        open={openModalOperacao}
        onClose={() => {
          setOpenModalOperacao(false);
          setEditandoOperacao(null);
        }}
        onCreated={() => {
          // ✅ wrapper sem argumento
          if (eventoSelecionado) carregarOperacoes(eventoSelecionado);
        }}
        operacao={editandoOperacao}
        evento={eventoSelecionado}
      />
    </div>
  );
}
