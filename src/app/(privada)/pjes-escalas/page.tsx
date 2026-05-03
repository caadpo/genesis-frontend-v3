"use client";

import { useSearchParams } from "next/navigation";

import { useApi } from "@/src/hooks/useApi";
import { FiChevronUp, FiStar } from "react-icons/fi";
import { FaDownload, FaEdit, FaTrash, FaUser } from "react-icons/fa";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Teto = { id: number; imagemUrl: string; nome_verba: string };
type Evento = { id: number; nome_evento: string; teto?: Teto };
type Operacao = {
  id: number;
  nome_operacao: string;
  qtd_oficiais_oper: number;
  qtd_pracas_oper: number;
  cod_op: string;
  ome: { nomeOme: string };
  evento?: Evento;
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function PjesEscalasPage() {
  const params = useSearchParams();
  const mes = params?.get("mes") ?? "";
  const ano = params?.get("ano") ?? "";
  const tetoId = Number(params?.get("tetoId"));
  const operacaoId = Number(params?.get("operacaoId"));

  // ─── Constantes PJES ────────────────────────────────────────────────────────
  const MESES = [
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
  const mesAbreviado = mes ? MESES[Number(mes) - 1] : "";

  // ─── API ─────────────────────────────────────────────────────────────────────
  const { data: tetos } = useApi<Teto[]>(
    mes && ano ? `/api/tetos?sistema=PJES&mes=${mes}&ano=${ano}` : "",
    [mes, ano],
  );
  const {
    data: operacao,
    loading: loadingOperacao,
    error: operacaoError,
  } = useApi<Operacao>(operacaoId ? `/api/operacao/${operacaoId}` : "", [
    operacaoId,
  ]);

  const teto = tetos?.find((t) => t.id === tetoId);
  const tetoReferencia = operacao?.evento?.teto || teto;

  return (
    <div className="page" style={{ overflow: "hidden" }}>
      <div style={{ width: "70%" }}>
        <h1 className="h1PjesEscalas">
          PJES | {mesAbreviado} {ano}
        </h1>
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          borderBottom: "solid 1px #c4c0c0",
        }}
      >
        {/* inicio Card Policial Escalado */}
        <div className="divPolicialEscalado">
          <div className="divPolicialSelecionado">
            <div className="cardPolicialSelecionado">
              {/* ESQUERDA */}
              <div className="policialLeft">
                <FaUser size={60} color="#13944d" />
                <div className="matpolicial">
                  <input type="text" placeholder="matricula" />
                </div>
              </div>

              {/* DIREITA */}
              <div className="policialRight">
                <div style={{ fontSize: "11px", width: "30%" }}>
                  <div>
                    <strong>CB FRANCISCO DPO</strong>
                  </div>
                  <div>EMERSON FRANCISCO DA SILVA</div>
                  <div>(81) 99999-9999</div>

                  <div>Nunfunc | Nuvinc : 1234567 | 1</div>
                  <div>
                    Situação: <strong>IMPEDIDO - FÉRIAS [01/04 a 30/04]</strong>
                  </div>
                  <div>
                    <strong>Banco:</strong> SANTANDER
                  </div>
                  <div>
                    <strong>Ag:</strong>1234
                  </div>
                  <div>
                    <strong>Conta:</strong> 12345-6
                  </div>
                </div>
                <div style={{ fontSize: "12px", width: "70%" }}>
                  <div style={{ display: "flex", gap: "3px", width: "100%" }}>
                    <div className="divDadosEscala">
                      <span>
                        <strong>Data Inicio:</strong>
                      </span>
                      <input
                        className="inputDadosEscala"
                        style={{ width: "100px", padding: "4px" }}
                        type="date"
                      />
                    </div>
                    <div className="divDadosEscala">
                      <span>
                        <strong>Inicio:</strong>
                      </span>
                      <input
                        className="inputDadosEscala"
                        style={{ width: "80px", padding: "4px" }}
                        type="time"
                      />
                    </div>
                    <div className="divDadosEscala">
                      <span>
                        <strong>Término:</strong>
                      </span>
                      <input
                        className="inputDadosEscala"
                        style={{ width: "80px", padding: "4px" }}
                        type="time"
                      />
                    </div>
                    <div className="divDadosEscala" style={{ width: "270px" }}>
                      <span>
                        <strong>Local de Apresentação:</strong>
                      </span>
                      <input
                        className="inputDadosEscala"
                        style={{ width: "270px", padding: "6px" }}
                        type="text"
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "3px",
                      width: "100%",
                      textAlign: "center",
                      marginTop: "10px",
                      border: "solid 1px #e2dbdb",
                    }}
                  >
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>POG</span>
                    </div>
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>CMT</span>
                    </div>
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>MOT</span>
                    </div>
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>PAT</span>
                    </div>
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>FISCAL</span>
                    </div>
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>MO</span>
                    </div>
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>CMT GD</span>
                    </div>
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>SENT</span>
                    </div>
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>AUX</span>
                    </div>
                    <div className="divDadosEscala" style={{ padding: "8px" }}>
                      <input type="checkbox" style={{ fontSize: "8px" }} />
                      <span style={{ fontSize: "8px" }}>OUTRO</span>
                    </div>
                    <div style={{ marginLeft: "4%" }}>
                      <select
                        style={{
                          width: "100%",
                          marginTop: "5px",
                          fontSize: "12px",
                          borderRadius: "4px",
                          border: "solid 1px #c4c0c0",
                        }}
                      >
                        <option>Vtr001</option>
                        <option>Vtr001</option>
                        <option>Vtr001</option>
                        <option>Vtr001</option>
                        <option>Vtr001</option>
                        <option>Vtr001</option>
                      </select>
                      <span style={{ fontSize: "10px" }}>
                        Escolha a viatura
                      </span>
                    </div>
                  </div>

                  <div className="divDadosEscala" style={{ width: "100%" }}>
                    <span>
                      <strong>Anotações:</strong>
                    </span>
                    <input
                      className="inputDadosEscala"
                      style={{ width: "270px", padding: "6px" }}
                      type="text"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* fim Card Policial Escalado */}

        <div className="divOperacao" style={{ display: "grid" }}>
          {/* inicio Card dados da Operação */}
          <div style={{ width: "100%" }}>
            <div className="divOperacaoSelecionado">
              {loadingOperacao && <div>Carregando operação...</div>}
              {operacaoError && (
                <div className="errorMessage">
                  Erro ao carregar operação: {operacaoError}
                </div>
              )}
              {operacao && (
                <div className="cardOperacaoSelecionado">
                  {/* ESQUERDA */}
                  <div className="operacaoLeft">
                    {tetoReferencia?.imagemUrl && (
                      <img
                        src={tetoReferencia.imagemUrl}
                        alt={tetoReferencia.nome_verba}
                      />
                    )}
                    <div className="nomeVerba">
                      {tetoReferencia?.nome_verba || "Teto não disponível"}
                    </div>
                  </div>

                  {/* DIREITA */}
                  <div className="operacaoRight">
                    <div className="nomeOperacao">
                      {operacao.ome?.nomeOme} | {operacao.nome_operacao} |{" "}
                      {operacao.cod_op}
                    </div>

                    <div className="cotasOperacaoBox">
                      <div>
                        <div>
                          <div>
                            <FiStar />
                          </div>
                          <div>OFICIAIS</div>
                        </div>
                        <strong>{operacao.qtd_oficiais_oper} | 1900</strong>
                      </div>

                      <div>
                        <div>
                          <div>
                            <FiChevronUp />
                          </div>
                          <div>PRAÇAS</div>
                        </div>

                        <strong>{operacao.qtd_pracas_oper} | 18302</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* fim Card dados da Operação */}

          {/* inicio botao adiconar policiaal */}
          <div style={{ padding: "5px" }}>
            <button className="botaoCriarEscala">ADICIONAR POLICIAL</button>
            <input
              className="inputBuscarEscala"
              type="text"
              placeholder="Buscar"
            />
          </div>

          {/* fim botao adiconar policiaal */}
        </div>
      </div>

      {/* inicio escalas */}
      <div className="divPjesEscalas">
        <div style={{ width: "100%" }}>
          <div className="divLogoEscalas">
            <div>
              <img
                src="/logo_pmpe.jpg"
                alt="Logo da PMPE"
                className="logoPmpeEscalas"
              />
            </div>

            <div style={{ flex: 1, textAlign: "center" }}>
              <h4 className="tituloEscala">POLICIA MILITAR DE PERNAMBUCO</h4>
              <h4 className="tituloEscala">QUARTEL DO COMANDO GERAL</h4>
              <h4 className="tituloEscala">
                DIRETORIA DE PLANEJAMENTO OPERACIONAL
              </h4>
            </div>

            <div>
              <img
                src="/logo_pe.jpg"
                alt="Logo da PMPE"
                className="logoPeEscalas"
              />
            </div>
          </div>
          <div className="divtitleEscalaServico">
            <div className="divCriarEscala">
              <h4>ESCALA DE SERVIÇO</h4>
            </div>
            <div className="divCriarEscala">
              <button style={{ padding: "3px", margin: "1px" }}>
                <FaDownload />
              </button>
              <button style={{ padding: "3px", margin: "1px" }}>
                <FaEdit />
              </button>
              <button style={{ padding: "3px", margin: "1px" }}>
                <FaTrash />
              </button>
            </div>
          </div>
          <table className="tabelaEscalas">
            <thead>
              <tr className="tabelaHeaderEscalas">
                <th>IDENTIFICAÇÃO</th>
                <th>CPF</th>
                <th>TELEFONE</th>
                <th>DADOS BANCARIOS</th>
                <th>DATA E HORA</th>
                <th>APRESENTAÇÃO</th>
                <th>FUNÇÃO</th>
                <th>SITUAÇÃO</th>
                <th>ANOTAÇÕES</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>REGULAR</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
              <tr className="tabelaLinhaEscalas">
                <td>CB 1157590 FRANCISCO BPCHOQUE</td>
                <td>123.456.789-00</td>
                <td>(81) 91234-5678</td>
                <td>SANTANDER, AG: 1234, CONTA:12345-6</td>
                <td>02/05/2026 14:30 às 15:30</td>
                <td>SEDE DA OME</td>
                <td>MOT - VTR001</td>
                <td>IMPEDIDO - FÉRIAS [01/04 a 30/04]</td>
                <td>Nenhuma Anotação</td>
                <td className="acoesTabelaEscalas">
                  <FaEdit size={16} color="orange" />
                  <FaTrash size={16} color="red" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* fim escalas */}
    </div>
  );
}
