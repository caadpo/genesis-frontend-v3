"use client";

import { useEffect, useState } from "react";
import { FiLayers } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { FiTrash2 } from "react-icons/fi";
import { FiLogIn } from "react-icons/fi";
import DistribuicaoModal from "../../../components/ui/DistribuicaoModal";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

type Teto = {
  id: number;
  imagemUrl: string;
  sistema: string;
  nome_verba: string;
  cod_verba: string;
  valor_total: string;
  ttctof: string;
  ttctprc: string;
  data_inicio: string;
  data_fim: string;
};

type Distribuicao = {
  id: number;
  nome_dist: string;
  qtd_dist_of: number;
  qtd_dist_prc: number;
  diretoria: {
    id: number;
    nomeDiretoria: string;
  };
  teto: {
    id: number;
    cod_verba: number;
  };
};

export default function PjesPage() {
  const hoje = new Date();

  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [tetos, setTetos] = useState<Teto[]>([]);
  const [tetoSelecionado, setTetoSelecionado] = useState<Teto | null>(null);
  const [distribuicoes, setDistribuicoes] = useState<Distribuicao[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState<Distribuicao | null>(null);
  const router = useRouter();

  async function carregarDistribuicoes(tetoId: number) {
    const data = await fetch(`/api/distribuicao?tetoId=${tetoId}`, {
      cache: "no-store",
    }).then((r) => r.json());

    setDistribuicoes(data);
  }

  // 🔎 Busca os tetos conforme mês/ano
  useEffect(() => {
    fetch(`/api/tetos?sistema=PJES&mes=${mes}&ano=${ano}`)
      .then((res) => res.json())
      .then((data) => {
        setTetos(data);
      });
  }, [mes, ano]);

  // 🔁 Sempre que a lista mudar, recalcula o selecionado
  useEffect(() => {
    if (tetos.length > 0 && !tetoSelecionado) {
      setTetoSelecionado(tetos[0]);
    }
  }, [tetos, tetoSelecionado]);

  useEffect(() => {
    if (!tetoSelecionado?.id) return;
    carregarDistribuicoes(tetoSelecionado.id);
  }, [tetoSelecionado?.id]);

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
          <div style={{ fontSize: "20px" }}>
            <FiLayers />
          </div>
          <div>
            <button
              onClick={() => {
                setEditando(null); // 👈 isso aqui
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

      {/* 🧩 Cards dos tetos */}
      <div className="cardsContainer">
        {tetos.map((teto) => (
          <button
            key={teto.id}
            onClick={() => setTetoSelecionado(teto)}
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
          <div className="divItemPrincipal">
            {/* item 01 */}
            <div className="divItem">
              <div className="divItensConsumo">
                <div style={{ fontSize: "12px", color: "#949090" }}>
                  Previsto Mês / Anual (até mês atual)
                </div>

                <div style={{ fontSize: "16px", color: "#494848" }}>
                  <strong>R$ {tetoSelecionado.valor_total}</strong>
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
            {/* item 01 */}

            {/* item 02 */}
            <div className="divItem">
              <div className="divItensConsumo">
                <div style={{ fontSize: "12px", color: "#949090" }}>
                  Previsto Mês / Anual (até mês atual)
                </div>

                <div style={{ fontSize: "16px", color: "#494848" }}>
                  <strong>R$ {tetoSelecionado.valor_total}</strong>
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

            {/* item 03 */}
            <div className="divItem">
              <div className="divItensConsumo">
                <div style={{ fontSize: "12px", color: "#949090" }}>
                  Previsto Mês / Anual (até mês atual)
                </div>

                <div style={{ fontSize: "16px", color: "#494848" }}>
                  <strong>R$ {tetoSelecionado.valor_total}</strong>
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
            {/* item 03 */}

            {/* item 04 */}
            <div className="divItem">
              <div className="divItensConsumo">
                <div style={{ fontSize: "12px", color: "#949090" }}>
                  Previsto Mês / Anual (até mês atual)
                </div>

                <div style={{ fontSize: "16px", color: "#494848" }}>
                  <strong>R$ {tetoSelecionado.valor_total}</strong>
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
            {/* item 04 */}
          </div>
          <div className="divGraficoConsumoDiretoriaPrincipal">
            <div className="divGraficoDiretoria">grafico da dist x consumo</div>
            <div className="divConsumoDiretoria">
              <table className="tabelaDistribuicao">
                <thead>
                  <tr>
                    <th>Dir</th>
                    <th>Distribuição</th>
                    <th>Oficiais</th>
                    <th>Praças</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {distribuicoes.map((dist) => (
                    <tr key={dist.id}>
                      <td>{dist.diretoria.nomeDiretoria}</td>
                      <td>{dist.nome_dist}</td>
                      <td>{dist.qtd_dist_of} | 2510</td>
                      <td>{dist.qtd_dist_prc} | 19340</td>
                      <td>
                        <button
                          onClick={() => handleEdit(dist)}
                          className="btnEdit"
                        >
                          <FiEdit />
                        </button>

                        <button
                          onClick={() => confirmarDelete(dist.id)}
                          className="btnDelete"
                        >
                          <FiTrash2 />
                        </button>

                        <button
                          onClick={() => {
                            router.push(
                              `/pjes-diretoria-select?mes=${mes}&ano=${ano}&tetoId=${tetoSelecionado?.id}&distribuicaoId=${dist.id}`,
                            );
                          }}
                          className="btnEntrarDist"
                        >
                          <FiLogIn />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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
        tetoId={tetoSelecionado?.id!}
        distribuicao={editando}
      />
    </div>
  );
}
