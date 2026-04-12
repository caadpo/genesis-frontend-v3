"use client";

import { useEffect, useState } from "react";
import { FiLayers } from "react-icons/fi";

type Teto = {
  id: number;
  imagemUrl: string;
  sistema: string;
  nome_verba: string;
  cod_verba: string;
  valor_total: string;
  valor_oficial: string;
  valor_praca: string;
  data_inicio: string;
  data_fim: string;
};

export default function DiariasPage() {
  const [tetos, setTetos] = useState<Teto[]>([]);
  const [tetoSelecionado, setTetoSelecionado] = useState<Teto | null>(null);

  useEffect(() => {
    fetch("/api/tetos?sistema=DIARIAS")
      .then((res) => res.json())
      .then((data) => {
        setTetos(data);
        setTetoSelecionado(data[0]);
      });
  }, []);

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return "--/--/----";
    const data = new Date(dataIso + "T00:00:00");
    return data.toLocaleDateString("pt-BR");
  };

  return (
    <div className="page">
      <div className="filtros">
        <h1 className="title">DIÁRIAS</h1>
      </div>

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

      {/* INICIO DIV ITEM PRINCIPAL */}
      {tetoSelecionado && (
        <div className="divItemPrincipal">
          <div className="divItem">
            <div className="divItensConsumo">
              <div style={{ fontSize: "12px", color: "#949090" }}>
                Previsto Mes / Anual (até mês atual)
              </div>

              <div style={{ fontSize: "16px", color: "#494848" }}>
                <strong>R$ {tetoSelecionado.valor_total}</strong>
              </div>

              <div style={{ display: "flex" }}>
                <label className="labelItensConsumo">Oficiais:</label>
                <span className="spamItensConsumo">
                  {Number(tetoSelecionado.valor_oficial) / 300} Cota(s)
                </span>
              </div>

              <div style={{ display: "flex" }}>
                <label className="labelItensConsumo">Praças:</label>
                <span className="spamItensConsumo">
                  {Number(tetoSelecionado.valor_praca) / 200} Cota(s)
                </span>
              </div>
            </div>

            <div className="divIconeConsumo">
              <FiLayers className="icon" />
            </div>
          </div>
          <div className="divItem">
            <div className="divItensConsumo">
              <div style={{ fontSize: "12px", color: "#949090" }}>
                Validade da folha de pagamento
              </div>

              <div style={{ fontSize: "16px", color: "#494848" }}>
                <strong>Validade</strong>
              </div>

              <div style={{ display: "flex" }}>
                <label className="labelItensConsumo">Data Inicial:</label>
                <span className="spamItensConsumo">
                  {formatarData(tetoSelecionado?.data_inicio)}
                </span>
              </div>

              <div style={{ display: "flex" }}>
                <label className="labelItensConsumo">Data Inicial:</label>
                <span className="spamItensConsumo">
                  {formatarData(tetoSelecionado?.data_fim)}
                </span>
              </div>
            </div>

            <div className="divIconeConsumo">
              <FiLayers className="icon" />
            </div>
          </div>
        </div>
      )}
      {/* FIM DIV ITEM PRINCIPAL */}
    </div>
  );
}
