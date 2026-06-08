"use client";

import React, { useEffect, useState } from "react";
import { FiLayers } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { FiTrash2 } from "react-icons/fi";
import { FiLogIn } from "react-icons/fi";
import DistribuicaoModal from "../../../components/ui/DistribuicaoModal";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import TetoModal from "@/src/components/ui/TetoModal";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import GraficoDistribuicao from "@/src/components/ui/GraficoDistribuicao";

type Teto = {
  id: number;
  imagemUrl: string;
  sistema: string;
  nome_verba: string;
  cod_verba: string;
  ttctof: number;
  saldo_of: number;
  totalCotasOficiais: number;
  ttctprc: number;
  saldo_prc: number;
  totalCotasPracas: number;
  data_inicio: string;
  data_fim?: string;
  tipo_periodo: string;
  status: string;
  valor_total: number;
};

type Distribuicao = {
  id: number;
  nome_dist: string;
  qtd_dist_of: number;
  totalCotasOficiais: number;
  qtd_dist_prc: number;
  totalCotasPracas: number;
  diretoria: {
    id: number;
    nomeDiretoria: string;
  };
  teto: {
    id: number;
    cod_verba: number;
  };
};

type OmeResumo = {
  omeId: number;
  nomeOme: string;
  soma_of: number; // destinado (eventos)
  soma_prc: number;
  cotas_of: number; // consumido (escalas)
  cotas_prc: number;
};

export default function PjesPage() {
  const hoje = new Date();
  const { user } = useCurrentUser();
  const typeUser = Number(user?.typeUser ?? 0);

  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [tetos, setTetos] = useState<Teto[]>([]);
  const [tetoSelecionado, setTetoSelecionado] = useState<Teto | null>(null);
  const [distribuicoes, setDistribuicoes] = useState<Distribuicao[]>([]);

  const [distExpandida, setDistExpandida] = useState<number | null>(null);
  const [omesMap, setOmesMap] = useState<Record<number, OmeResumo[]>>({});

  // Modal distribuição
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState<Distribuicao | null>(null);

  // Modal teto
  const [openTetoModal, setOpenTetoModal] = useState(false);
  const [tetoEditando, setTetoEditando] = useState<Teto | null>(null);

  // Double-click control
  const [clickTimer, setClickTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const router = useRouter();

  async function carregarTetos() {
    const data = await fetch(
      `/api/tetos?sistema=PJES&mes=${mes}&ano=${ano}`,
    ).then((r) => r.json());
    setTetos(data);
  }

  async function carregarDistribuicoes(tetoId: number) {
    const data = await fetch(`/api/distribuicao?tetoId=${tetoId}`, {
      cache: "no-store",
    }).then((r) => r.json());
    setDistribuicoes(data);
  }

  async function carregarOmes(distId: number) {
    if (omesMap[distId]) return; // já carregou
    const res = await fetch(`/api/distribuicao/${distId}/omes`);
    const data = await res.json();
    setOmesMap((prev) => ({ ...prev, [distId]: data }));
  }

  function toggleDist(distId: number) {
    if (distExpandida === distId) {
      setDistExpandida(null);
    } else {
      setDistExpandida(distId);
      carregarOmes(distId);
    }
  }

  // 🔎 Busca os tetos conforme mês/ano
  useEffect(() => {
    carregarTetos();
  }, [mes, ano]);

  useEffect(() => {
    if (tetoSelecionado && !tetos.some((t) => t.id === tetoSelecionado.id)) {
      setTetoSelecionado(null);
      setDistribuicoes([]);
    }
  }, [tetos, tetoSelecionado]);

  useEffect(() => {
    if (!tetoSelecionado?.id) return;
    carregarDistribuicoes(tetoSelecionado.id);
  }, [tetoSelecionado?.id]);

  // 🖱️ Clique simples seleciona, duplo clique abre edição
  function handleTetoClick(teto: Teto) {
    if (clickTimer) {
      // Double click
      clearTimeout(clickTimer);
      setClickTimer(null);
      setTetoEditando(teto);
      setOpenTetoModal(true);
    } else {
      // Single click — aguarda para ver se vira duplo
      const timer = setTimeout(() => {
        setTetoSelecionado(teto);
        setClickTimer(null);
      }, 250);
      setClickTimer(timer);
    }
  }

  function confirmarDelete(id: number) {
    toast((t) => (
      <div className="toastConfirmBox">
        <p>Deseja realmente excluir esta distribuição?</p>

        <div className="toastButtons">
          <button
            className="toastBtn toastBtnCancel"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>

          <button
            className="toastBtn toastBtnConfirm"
            onClick={async () => {
              toast.dismiss(t.id);

              const promise = fetch(`/api/distribuicao/${id}`, {
                method: "DELETE",
              });

              toast.promise(promise, {
                loading: "Removendo...",
                success: "Distribuição removida com sucesso ✅",
                error: "Erro ao remover ❌",
              });

              const res = await promise;

              if (res.ok && tetoSelecionado?.id) {
                await carregarDistribuicoes(tetoSelecionado.id);
              }
            }}
          >
            Confirmar exclusão
          </button>
        </div>
      </div>
    ));
  }

  function handleEdit(dist: Distribuicao) {
    setEditando(dist);
    setOpenModal(true);
  }

  // 💰 Valores unitários
  const VALOR_OFICIAL = 300;
  const VALOR_PRACA = 200;

  // 📊 Valor total da folha
  const valor_total =
    Number(tetoSelecionado?.ttctof || 0) * VALOR_OFICIAL +
    Number(tetoSelecionado?.ttctprc || 0) * VALOR_PRACA;

  // 📊 Valor total do saldo
  const valor_total_saldo =
    Number(tetoSelecionado?.saldo_of || 0) * VALOR_OFICIAL +
    Number(tetoSelecionado?.saldo_prc || 0) * VALOR_PRACA;

  // 📊 Valor total executado
  const valor_total_executado =
    Number(tetoSelecionado?.totalCotasOficiais || 0) * VALOR_OFICIAL +
    Number(tetoSelecionado?.totalCotasPracas || 0) * VALOR_PRACA;

  // 📈 Percentual Oficiais
  const percentualOficiais =
    Number(tetoSelecionado?.ttctof || 0) > 0
      ? (
          (Number(tetoSelecionado?.totalCotasOficiais || 0) /
            Number(tetoSelecionado?.ttctof || 0)) *
          100
        ).toFixed(1)
      : "0";

  // 📈 Percentual Praças
  const percentualPracas =
    Number(tetoSelecionado?.ttctprc || 0) > 0
      ? (
          (Number(tetoSelecionado?.totalCotasPracas || 0) /
            Number(tetoSelecionado?.ttctprc || 0)) *
          100
        ).toFixed(1)
      : "0";

  // 📈 Percentual total
  const percentualTotal = (
    (Number(percentualOficiais) + Number(percentualPracas)) /
    2
  ).toFixed(1);

  return (
    <div className="page">
      {/* 🔽 Filtro mês/ano */}
      <div className="filtros">
        <h1 className="title">PJES</h1>
        <div className="selectGroup">
          <label className="labelselectGroup">Mês</label>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i + 1}>
                {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        <div className="selectGroup">
          <label className="labelselectGroup">Ano</label>
          <select value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {[
              2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035,
            ].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="menuGroup">
          {/* 🔥 Clique no ícone abre modal de CRIAÇÃO de teto */}
          <div
            style={{ fontSize: "20px", cursor: "pointer" }}
            title="Novo Teto"
            onClick={() => {
              setTetoEditando(null);
              setOpenTetoModal(true);
            }}
          >
            <FiLayers />
          </div>
          <div>
            <button
              onClick={() => {
                if (!tetoSelecionado?.id) {
                  toast.error("Selecione um teto antes de distribuir.");
                  return;
                }
                setEditando(null);
                setOpenModal(true);
              }}
              style={{
                fontSize: "12px",
                borderRadius: "10px",
                padding: "5px",
                width: "100px",
                border: "solid 1px #ffffff",
                color: "#ffffff",
                background: "#0a756c",
              }}
            >
              DISTRIBUIR
            </button>
          </div>
        </div>
      </div>

      {/* 🧩 Cards dos tetos — clique simples seleciona, duplo clique edita */}
      <div className="cardsContainer">
        {tetos.map((teto) => (
          <button
            key={teto.id}
            onClick={() => handleTetoClick(teto)}
            title="Clique para selecionar · Duplo clique para editar"
            className={`card ${
              tetoSelecionado?.id === teto.id ? "cardDestaque" : ""
            }`}
          >
            <img src={teto.imagemUrl} alt={teto.nome_verba} className="logo" />
            <span className="label">{teto.nome_verba}</span>
          </button>
        ))}
      </div>

      {/* 📊 Painel do teto selecionado */}
      {tetoSelecionado && (
        <div>
          {[10, 9].includes(Number(user?.typeUser)) && (
            <div className="divItemPrincipal">
              {/* item 01 */}
              <div className="divItem">
                <div className="divItensConsumo">
                  <div style={{ fontSize: "12px", color: "#949090" }}>
                    Valor total da Folha
                  </div>

                  <div style={{ fontSize: "16px", color: "#494848" }}>
                    <strong>
                      R${" "}
                      {valor_total.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </div>

                  <div style={{ display: "flex" }}>
                    <label className="labelItensConsumo">Oficiais:</label>
                    <span className="spamItensConsumo">
                      {Number(tetoSelecionado.ttctof)} Cota(s)
                    </span>
                  </div>

                  <div style={{ display: "flex" }}>
                    <label className="labelItensConsumo">Praças:</label>
                    <span className="spamItensConsumo">
                      {Number(tetoSelecionado.ttctprc)} Cota(s)
                    </span>
                  </div>
                </div>
                <div className="divIconeConsumo">
                  <FiLayers className="icon" />
                </div>
              </div>

              {/* item 02 */}
              <div className="divItem">
                <div className="divItensConsumo">
                  <div style={{ fontSize: "12px", color: "#949090" }}>
                    Saldo de Cotas
                  </div>

                  <div style={{ fontSize: "16px", color: "#494848" }}>
                    <strong>
                      R${" "}
                      {valor_total_saldo.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </div>

                  <div style={{ display: "flex" }}>
                    <label className="labelItensConsumo">Oficiais:</label>
                    <span className="spamItensConsumo">
                      {tetoSelecionado.saldo_of} Cota(s)
                    </span>
                  </div>

                  <div style={{ display: "flex" }}>
                    <label className="labelItensConsumo">Praças:</label>
                    <span className="spamItensConsumo">
                      {tetoSelecionado.saldo_prc} Cota(s)
                    </span>
                  </div>
                </div>
                <div className="divIconeConsumo">
                  <FiLayers className="icon" />
                </div>
              </div>

              {/* item 03 */}
              <div className="divItem">
                <div className="divItensConsumo">
                  <div style={{ fontSize: "12px", color: "#949090" }}>
                    Consumo Real da Folha
                  </div>

                  <div style={{ fontSize: "16px", color: "#494848" }}>
                    <strong>
                      R${" "}
                      {valor_total_executado.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </div>

                  <div style={{ display: "flex" }}>
                    <label className="labelItensConsumo">Oficiais:</label>
                    <span className="spamItensConsumo">
                      {Number(tetoSelecionado.totalCotasOficiais)} Cota(s)
                    </span>
                  </div>

                  <div style={{ display: "flex" }}>
                    <label className="labelItensConsumo">Praças:</label>
                    <span className="spamItensConsumo">
                      {Number(tetoSelecionado.totalCotasPracas)} Cota(s)
                    </span>
                  </div>
                </div>
                <div className="divIconeConsumo">
                  <FiLayers className="icon" />
                </div>
              </div>

              {/* item 04 */}
              <div className="divItem">
                <div className="divItensConsumo">
                  <div style={{ fontSize: "12px", color: "#949090" }}>
                    Eventos Homologados
                  </div>

                  <div style={{ fontSize: "16px", color: "#494848" }}>
                    <strong>Homologação: {percentualTotal}%</strong>
                  </div>

                  <div style={{ display: "flex" }}>
                    <label className="labelItensConsumo">Oficiais:</label>
                    <span className="spamItensConsumo">
                      {percentualOficiais}% Concluído
                    </span>
                  </div>

                  <div style={{ display: "flex" }}>
                    <label className="labelItensConsumo">Praças:</label>
                    <span className="spamItensConsumo">
                      {percentualPracas}% Concluído
                    </span>
                  </div>
                </div>
                <div className="divIconeConsumo">
                  <FiLayers className="icon" />
                </div>
              </div>
            </div>
          )}

          <div className="divGraficoConsumoDiretoriaPrincipal">
            <div className="divGraficoDiretoria">
              <GraficoDistribuicao
                distribuicoes={distribuicoes}
                omesMap={omesMap}
                distExpandida={distExpandida}
              />
            </div>
            <div className="divConsumoDiretoria">
              <div className="divDistribuicaoPrincipal">
                {distribuicoes.map((dist) => (
                  <div key={dist.id} className="divDistribuicaoMap">
                    {/* HEADER DA DISTRIBUIÇÃO */}
                    <div
                      onClick={() => toggleDist(dist.id)}
                      className="divDistribuicaoToggle"
                    >
                      <div className="divDistNomeDiretoria">
                        {dist.diretoria.nomeDiretoria}

                        <span className="divDistNomeDist">
                          {dist.nome_dist}
                        </span>
                      </div>

                      <div className="divDistTotaisHeader">
                        {typeUser !== 2 && (
                          <div className="divDistTotaisOf">
                            OF:{" "}
                            {typeUser === 2
                              ? dist.totalCotasOficiais
                              : `${dist.qtd_dist_of} | ${dist.totalCotasOficiais}`}
                          </div>
                        )}

                        {typeUser !== 2 && (
                          <div className="divDistTotaisPrc">
                            PR:{" "}
                            {typeUser === 2
                              ? dist.totalCotasPracas
                              : `${dist.qtd_dist_prc} | ${dist.totalCotasPracas}`}
                          </div>
                        )}

                        {typeUser !== 2 && (
                          <div className="divDistBtnEditar">
                            {typeUser === 10 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(dist);
                                }}
                                className="btnDistEditar"
                              >
                                <FiEdit />
                              </button>
                            )}

                            {typeUser === 10 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmarDelete(dist.id);
                                }}
                                className="btnDistExcluir"
                              >
                                <FiTrash2 />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/pjes-diretoria-select?mes=${mes}&ano=${ano}&tetoId=${tetoSelecionado?.id}&distribuicaoId=${dist.id}`,
                                );
                              }}
                              className="btnDistEntrar"
                            >
                              <FiLogIn />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ACCORDION */}
                    {distExpandida === dist.id && (
                      <div className="divAreaExpandidaPrincipal">
                        {(omesMap[dist.id] ?? []).map((ome) => (
                          <div
                            key={ome.omeId}
                            className="divAreaExpandidaSecundaria"
                          >
                            <div style={{ display: "flex", width: "100%" }}>
                              <div className="divAreaExpandidaNomeOme">
                                {ome.nomeOme}
                              </div>

                              <div className="divAreaExpandidaOfPrcPrincipal">
                                <span className="divAreaExpandidaOf">
                                  OF: {ome.soma_of} | {ome.cotas_of}
                                </span>

                                <span className="divAreaExpandidaPrc">
                                  PR: {ome.soma_prc} | {ome.cotas_prc}
                                </span>
                              </div>
                            </div>

                            {typeUser === 2 && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/pjes-diretoria-select?mes=${mes}&ano=${ano}&tetoId=${tetoSelecionado?.id}&distribuicaoId=${dist.id}&omeId=${ome.omeId}`,
                                  )
                                }
                                className="divAreaExpandidaBtnEventos"
                              >
                                Eventos <FiLogIn />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de distribuição */}
      {tetoSelecionado && (
        <DistribuicaoModal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setEditando(null);
          }}
          onCreated={() => {
            if (tetoSelecionado?.id) {
              carregarDistribuicoes(tetoSelecionado.id);
            }
          }}
          tetoId={tetoSelecionado.id}
          distribuicao={editando}
        />
      )}

      {/* Modal de teto (criar / editar) */}
      <TetoModal
        open={openTetoModal}
        sistema="PJES"
        onClose={() => {
          setOpenTetoModal(false);
          setTetoEditando(null);
        }}
        onSaved={() => {
          setTetoSelecionado(null);
          carregarTetos();
        }}
        teto={tetoEditando}
      />
    </div>
  );
}
