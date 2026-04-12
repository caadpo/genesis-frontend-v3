"use client";

import { useEffect, useState } from "react";
import { FiLayers } from "react-icons/fi";
import DistribuicaoModal from "../../../components/ui/DistribuicaoModal";
import { toast } from "react-hot-toast";

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
    if (tetos.length > 0) {
      setTetoSelecionado(tetos[0]); // sempre recalcula quando o mês muda
    } else {
      setTetoSelecionado(null);
    }
  }, [tetos]);

  useEffect(() => {
    if (!tetoSelecionado) return;

    const controller = new AbortController();

    fetch(`/api/distribuicao?tetoId=${tetoSelecionado.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro na distribuição");
        return res.json();
      })
      .then((data) => {
        setDistribuicoes(data);
      })
      .catch(console.error);

    return () => controller.abort();
  }, [tetoSelecionado]);

  async function handleDelete(id: number) {
    if (!confirm("Deseja remover esta distribuição?")) return;

    await fetch(`/api/distribuicao/${id}`, {
      method: "DELETE",
    });

    fetch(`/api/distribuicao?tetoId=${tetoSelecionado?.id}`)
      .then((r) => r.json())
      .then(setDistribuicoes);
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
            <FiLayers onClick={() => toast.success("Teste")} />
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
              ENTRAR
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
                    <th>Diretoria</th>
                    <th>Verba</th>
                    <th>Cotas Oficiais</th>
                    <th>Cotas Praças</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {distribuicoes.map((dist) => (
                    <tr key={dist.id}>
                      <td>{dist.diretoria.nomeDiretoria}</td>
                      <td>{dist.teto.cod_verba}</td>
                      <td>{dist.qtd_dist_of}</td>
                      <td>{dist.qtd_dist_prc}</td>
                      <td>
                        <button
                          onClick={() => handleEdit(dist)}
                          className="btnEdit"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => handleDelete(dist.id)}
                          className="btnDelete"
                        >
                          🗑️
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

          // 👇 AGORA SIM, na página viva
          fetch(`/api/distribuicao?tetoId=${tetoSelecionado?.id}`)
            .then((r) => r.json())
            .then((data) => {
              setDistribuicoes(data);
              toast.success("Distribuição atualizada com sucesso ✅");
            });
        }}
        tetoId={tetoSelecionado?.id!}
        distribuicao={editando}
      />
    </div>
  );
}
