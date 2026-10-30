"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { FiChevronDown } from "react-icons/fi";
import { useApi } from "@/src/hooks/useApi";

type OmeResumo = { id: number; nomeOme: string };

type OperacaoCompartilhada = {
  id: number;
  nome_operacao: string;
  cod_op: string;
  qtd_oficiais_oper: number;
  qtd_pracas_oper: number;
  totalCotasOficiais?: number;
  totalCotasPracas?: number;
  omesCompartilhadas?: OmeResumo[];
  evento: {
    id: number;
    nome_evento: string;
    status_evento: string;
    ome?: OmeResumo;
    distribuicao?: {
      teto?: {
        id: number;
        sistema?: string;
        // Ajuste se os campos de mês/ano do seu Teto tiverem outro nome
        mes?: number;
        ano?: number;
      };
    };
  };
};

type Vaga = {
  id: number;
  operacaoId?: number;
  dataInicio: string;
  horaInicio: string;
  horaFim: string;
  funcao: string;
  tipo_escala: string;
  localApresentacao: string;
};

// Ajuste aqui as rotas das páginas de escala de cada sistema.
// Se o sistema não estiver no mapa, o botão "Entrar" fica desabilitado.
const ROTA_POR_SISTEMA: Record<string, string> = {
  PJES: "/pjes-escalas",
  // DIARIAS: "/diarias-escalas",
};

const NUM_COLUNAS = 7;

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

function mesAnoDaOperacao(op: OperacaoCompartilhada, vagas: Vaga[]) {
  const teto = op.evento?.distribuicao?.teto;
  if (teto?.mes && teto?.ano) {
    return { mes: Number(teto.mes), ano: Number(teto.ano) };
  }
  if (vagas[0]?.dataInicio) {
    const [ano, mes] = vagas[0].dataInicio.split("-");
    return { mes: Number(mes), ano: Number(ano) };
  }
  const hoje = new Date();
  return { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() };
}

export default function CompartilhadasPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  // Accordion: uma operação expandida por vez
  const [expandidaId, setExpandidaId] = useState<number | null>(null);

  const {
    data: operacoes,
    loading: loadingOps,
    error: erroOps,
  } = useApi<OperacaoCompartilhada[]>(
    "/api/operacao/compartilhadas-comigo",
    [],
  );

  const { data: vagas } = useApi<Vaga[]>("/api/escala/vagas", []);

  // Vagas em aberto da minha OME, agrupadas por operação e em ordem cronológica
  const vagasPorOperacao = new Map<number, Vaga[]>();
  for (const v of vagas ?? []) {
    if (v.operacaoId == null) continue;
    if (!vagasPorOperacao.has(v.operacaoId))
      vagasPorOperacao.set(v.operacaoId, []);
    vagasPorOperacao.get(v.operacaoId)!.push(v);
  }
  vagasPorOperacao.forEach((lista) =>
    lista.sort((a, b) =>
      `${a.dataInicio} ${a.horaInicio}`.localeCompare(
        `${b.dataInicio} ${b.horaInicio}`,
      ),
    ),
  );

  const termo = busca.trim().toLowerCase();

  // Filtra pela busca e deixa no topo as operações que têm vagas para mim
  const lista = (operacoes ?? [])
    .filter((op) => {
      if (!termo) return true;
      return [
        op.evento?.ome?.nomeOme,
        op.evento?.nome_evento,
        op.nome_operacao,
        op.cod_op,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(termo));
    })
    .sort(
      (a, b) =>
        (vagasPorOperacao.get(b.id)?.length ?? 0) -
        (vagasPorOperacao.get(a.id)?.length ?? 0),
    );

  return (
    <div className="page" style={{ overflowY: "auto" }}>
      <h1 className="h1DiretoriaSelect">OPERAÇÕES COMPARTILHADAS COMIGO</h1>

      <div className="divDiretoriaOperacao" style={{ width: "100%" }}>
        <div className="operacoesMobileDentroEvento">
          <div className="divTituloOperacao">
            <h4>OPERAÇÕES</h4>
          </div>

          <div className="divInputBuscarOperacaoEIcones">
            <input
              className="inputBuscarOperacao"
              type="text"
              placeholder="Buscar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {loadingOps && (
            <p style={{ color: "#888", padding: "12px 4px" }}>Carregando...</p>
          )}
          {erroOps && (
            <p style={{ color: "#e53e3e", padding: "12px 4px" }}>
              Erro ao carregar as operações.
            </p>
          )}

          <table className="tabelaOperacoes">
            <thead>
              <tr className="tabelaHeader">
                <th>UNIDADE</th>
                <th>EVENTO</th>
                <th>OPERAÇÃO</th>
                <th>OFICIAIS</th>
                <th>PRAÇAS</th>
                <th>COD OPERAÇÃO</th>
                <th>AÇÕES</th>
              </tr>
            </thead>

            <tbody>
              {lista.map((op) => {
                const vagasOp = vagasPorOperacao.get(op.id) ?? [];
                const aberta = op.evento?.status_evento === "CRIADO";
                const expandida = expandidaId === op.id;
                const teto = op.evento?.distribuicao?.teto;
                const sistema = teto?.sistema ?? "PJES";
                const rota = ROTA_POR_SISTEMA[sistema];
                const { mes, ano } = mesAnoDaOperacao(op, vagasOp);

                return (
                  <Fragment key={op.id}>
                    <tr
                      className="tabelaLinha"
                      onClick={() =>
                        setExpandidaId((prev) =>
                          prev === op.id ? null : op.id,
                        )
                      }
                      style={{ cursor: "pointer" }}
                      title="Clique para ver as vagas em aberto"
                    >
                      <td className="colOperacao">
                        <FiChevronDown
                          size={14}
                          style={{
                            marginRight: 6,
                            verticalAlign: "middle",
                            transition: "transform 0.15s",
                            transform: expandida
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          }}
                        />
                        {op.evento?.ome?.nomeOme}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {op.evento?.nome_evento}
                      </td>
                      <td>{op.nome_operacao}</td>
                      <td>
                        {op.qtd_oficiais_oper} | {op.totalCotasOficiais ?? 0}
                      </td>
                      <td>
                        {op.qtd_pracas_oper} | {op.totalCotasPracas ?? 0}
                      </td>
                      <td>{op.cod_op}</td>
                      <td className="acoesTabela">
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textAlign: "center",
                            marginBottom: 4,
                            color: aberta ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {aberta
                            ? "aberta para lançamento"
                            : `evento ${String(op.evento?.status_evento ?? "")
                                .replace("_", " ")
                                .toLowerCase()}`}
                        </div>

                        <button
                          className="botaoAddPoliciais"
                          disabled={!rota}
                          title={
                            rota
                              ? "Abrir a escala desta operação"
                              : "Tela de escala deste sistema ainda não configurada"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!rota) return;
                            router.push(
                              `${rota}?mes=${mes}&ano=${ano}&tetoId=${teto?.id ?? ""}&operacaoId=${op.id}`,
                            );
                          }}
                        >
                          {vagasOp.length > 0
                            ? `${pad2(vagasOp.length)} Vaga | Entrar`
                            : "Entrar"}
                        </button>
                      </td>
                    </tr>

                    {/* Accordion: vagas em aberto desta operação */}
                    {expandida && (
                      <tr>
                        <td colSpan={NUM_COLUNAS} style={{ padding: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              padding: "6px 12px 12px",
                            }}
                          >
                            <div style={{ minWidth: 420, maxWidth: "100%" }}>
                              {vagasOp.length === 0 ? (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#9ca3af",
                                    padding: "6px 4px",
                                  }}
                                >
                                  Nenhuma vaga em aberto para a sua OME nesta
                                  operação.
                                </div>
                              ) : (
                                vagasOp.map((v) => (
                                  <div
                                    key={v.id}
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 10,
                                      fontSize: 12,
                                      color: "#374151",
                                      borderBottom: "1px solid #e5e7eb",
                                      padding: "5px 4px",
                                    }}
                                  >
                                    <strong>
                                      {formatarData(v.dataInicio)}
                                    </strong>
                                    <span>
                                      {v.horaInicio.slice(0, 5)} às{" "}
                                      {v.horaFim.slice(0, 5)}
                                    </span>
                                    <span>{v.funcao}</span>
                                    <span>
                                      {v.tipo_escala === "O"
                                        ? "Oficial"
                                        : "Praça"}
                                    </span>
                                    <span>{v.localApresentacao}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {!loadingOps && !erroOps && lista.length === 0 && (
                <tr>
                  <td
                    colSpan={NUM_COLUNAS}
                    style={{
                      textAlign: "center",
                      padding: 18,
                      color: "#888",
                    }}
                  >
                    {termo
                      ? "Nenhuma operação encontrada para a busca."
                      : "Nenhuma operação foi compartilhada com a sua OME."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
