"use client";

import { useEffect, useState } from "react";
import { FiGrid } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { FiTrash2 } from "react-icons/fi";
import { FiLogIn } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/src/lib/api";
import DiariaDistribuicaoModal from "@/src/components/ui/DiariaDistribuicaoModal";

type Teto = {
  id: number;
  imagemUrl: string;
  nome_verba: string;
  cod_verba: string;
  valor_total: number;
  ttctof: number;
  ttctprc: number;
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

export default function DiariasPage() {
  const [tetos, setTetos] = useState<Teto[]>([]);
  const [tetoSelecionado, setTetoSelecionado] = useState<Teto | null>(null);
  const [distribuicoes, setDistribuicoes] = useState<Distribuicao[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState<Distribuicao | null>(null);
  const router = useRouter();

  async function carregarDistribuicoes(tetoId: number) {
    const data = await apiFetch(`/api/distribuicao?tetoId=${tetoId}`, {
      cache: "no-store",
    }).then((r) => r.json());

    setDistribuicoes(data);
  }

  useEffect(() => {
    let mounted = true;

    apiFetch("/api/tetos?sistema=DIARIAS")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setTetos(data);
        setTetoSelecionado((prev) => prev ?? data[0]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 🔁 Sempre que a lista mudar, recalcula o selecionado
  useEffect(() => {
    if (tetos.length > 0 && tetoSelecionado === null) {
      setTetoSelecionado(tetos[0]);
    }
  }, [tetos, tetoSelecionado]);

  useEffect(() => {
    if (!tetoSelecionado?.id) return;
    let mounted = true;
    carregarDistribuicoes(tetoSelecionado.id).then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
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

              const promise = apiFetch(`distribuicao/${id}`, {
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

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return "--/--/----";
    const data = new Date(dataIso + "T00:00:00");
    return data.toLocaleDateString("pt-BR");
  };

  return (
    <div className="page">
      <div className="filtros">
        <h1 className="title">DIARIAS</h1>
        <div className="selectGroup">
          <label className="labelselectGroup">Folha</label>
          <select>
            <option>Vigente</option>
          </select>
        </div>

        <div className="selectGroup">
          <label className="labelselectGroup">Ano</label>
          <select>
            <option>Vigente</option>
          </select>
        </div>

        <div className="menuGroup">
          <div style={{ fontSize: "20px" }}>
            <FiGrid />
          </div>
          <div>
            <button
              onClick={() => {
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
        <div>
          <div className="divItemPrincipal">
            {/* item 01 */}
            <div className="divItem">
              <div className="divItensConsumo">
                <div style={{ fontSize: "12px", color: "#949090" }}>
                  Valor Total
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
                <FiGrid className="icon" />
              </div>
            </div>
            {/* item 01 */}

            {/* item 02 */}
            <div className="divItem">
              <div className="divItensConsumo">
                <div style={{ fontSize: "12px", color: "#949090" }}>
                  Distribuição das cotas
                </div>

                <div style={{ fontSize: "16px", color: "#494848" }}>
                  <strong>Distribuição</strong>
                </div>

                <div style={{ display: "flex" }}>
                  <label className="labelItensConsumo">Oficiais:</label>
                  <span className="spamItensConsumo">99999</span>
                </div>

                <div style={{ display: "flex" }}>
                  <label className="labelItensConsumo">Praças:</label>
                  <span className="spamItensConsumo">99999</span>
                </div>
              </div>
              <div className="divIconeConsumo">
                <FiGrid className="icon" />
              </div>
            </div>
            {/* item 02 */}

            {/* item 03 */}
            <div className="divItem">
              <div className="divItensConsumo">
                <div style={{ fontSize: "12px", color: "#949090" }}>
                  Saldo Atual
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
                <FiGrid className="icon" />
              </div>
            </div>
            {/* item 03 */}

            {/* item 04 */}
            <div className="divItem">
              <div className="divItensConsumo">
                <div style={{ fontSize: "12px", color: "#949090" }}>
                  Gestão Financeira
                </div>

                <div style={{ fontSize: "14px", color: "#494848" }}>
                  <strong>
                    Validade: {formatarData(tetoSelecionado?.data_inicio)} a{" "}
                    {formatarData(tetoSelecionado?.data_fim)}{" "}
                  </strong>
                </div>

                <div style={{ display: "flex" }}>
                  <label className="labelItensConsumo">
                    Prev desembolso (PD):
                  </label>
                  <span className="spamItensConsumo">15%</span>
                </div>

                <div style={{ display: "flex" }}>
                  <label className="labelItensConsumo">Pagamento</label>
                  <span className="spamItensConsumo">8%</span>
                </div>
                <div style={{ display: "flex" }}>
                  <label className="labelItensConsumo">Nº Empenho:</label>
                  <span className="spamItensConsumo">
                    {tetoSelecionado.cod_verba}
                  </span>
                </div>
              </div>
              <div className="divIconeConsumo">
                <FiGrid className="icon" />
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
                    <th>Destribuição</th>
                    <th>Oficiais</th>
                    <th>Praças</th>
                    <th>#</th>
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
                              `/diaria-diretoria-select?tetoId=${tetoSelecionado?.id}&distribuicaoId=${dist.id}`
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
      <DiariaDistribuicaoModal
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
