"use client";

import Image from "next/image";
import { FiCheck, FiX } from "react-icons/fi";

type Escala = {
  id: number;
  sistema: string;
  pg_escala: string;
  mat_escala: string;
  ng_escala: string;
  nomecompleto_escala: string;
  tipo_escala: string;
  dataInicio: string;
  horaInicio: string;
  horaFim: string;
  cota_escala: number;
  localApresentacao: string;
  funcao: string;
  situacao: string;
  anotacoes?: string;
  nomeOperacao?: string;
  cod_op?: string;
  nomeEvento?: string;
  nomeOme?: string;
  viatura?: { patrimonio: string } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  escalas: Escala[];
  codOp: string;
  loading: boolean;
  erro: string | null;
};

export default function BuscaCopModal({
  open,
  onClose,
  escalas,
  codOp,
  loading,
  erro,
}: Props) {
  if (!open) return null;

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}`;
  };

  // 👇 verifica se a data já passou (compara só a data, sem hora)
  const isPassada = (data: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEscala = new Date(data + "T00:00:00");
    return dataEscala < hoje;
  };

  return (
    <div
      className="modalOverlay"
      onClick={onClose}
      style={{
        alignItems: "flex-start",
        paddingTop: "20px",
      }}
    >
      <div
        className="modalCardCodOP"
        style={{
          width: "98%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          overflowY: "auto",
          paddingBottom: "10px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* BOTÃO FECHAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "10px 15px",
          }}
        >
          <FiX size={12} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        {/* CABEÇALHO */}
        <div style={{ padding: "0 5px 5px 5px" }}>
          {/* LOGO */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 5,
            }}
          >
            <Image
              src="/gov_pe.png"
              alt="Logo DPO"
              width={60}
              height={30}
              priority
            />
          </div>

          {/* TEXTO INSTITUCIONAL */}
          <div
            style={{
              textAlign: "center",
              lineHeight: 1.4,
              fontSize: 10,
              marginBottom: 5,
            }}
          >
            <div>SECRETARIA DE DEFESA SOCIAL</div>
            <div>QUARTEL DO COMANDO GERAL</div>
            <div>DIRETORIA DE PLANEJAMENTO OPERACIONAL</div>
          </div>

          {/* OME + AVISO */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 5,
            }}
          >
            <div
              style={{
                color: "#8a8a8a",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {escalas[0]?.nomeOme}
            </div>
          </div>

          {/* EVENTO */}
          <div
            style={{
              fontSize: 11,
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              {escalas[0]?.nomeEvento}
              {" | "}
              {escalas[0]?.nomeOperacao}
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#4d78da",
              }}
            >
              COP: {codOp}
            </div>
          </div>

          {/* COP */}

          {/* FAIXA AZUL */}
          <div
            style={{
              background: "#0a4d92",
              color: "#fff",
              textAlign: "center",
              padding: "8px",
              marginTop: 10,
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            ESCALA DE SERVIÇO | {escalas[0]?.sistema}
          </div>

          {/* TABELA */}
          {!loading && !erro && (
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #d1d5db",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#4f8ed3",
                      color: "#fff",
                    }}
                  >
                    <th style={th}>DATA/HORA</th>
                    <th style={th}>IDENTIFICAÇÃO</th>
                    <th style={th}>FUNÇÃO</th>
                    <th style={th}>VTR</th>
                  </tr>
                </thead>

                <tbody>
                  {escalas.map((e) => {
                    const passada = isPassada(e.dataInicio);
                    return (
                      <tr
                        key={e.id}
                        style={{
                          color: passada ? "#b0b0b0" : "inherit",
                          background: passada ? "#fafafa" : "transparent",
                        }}
                      >
                        <td style={td}>
                          {formatarData(e.dataInicio)},{" "}
                          {e.horaInicio.slice(0, 5)} a {e.horaFim.slice(0, 5)}
                        </td>

                        <td style={td}>
                          {e.pg_escala} {e.mat_escala} {e.ng_escala} {e.nomeOme}
                        </td>

                        <td style={td}>{e.funcao}</td>

                        <td style={td}>{e.viatura?.patrimonio ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {escalas.length === 0 && (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  Nenhuma escala encontrada.
                </div>
              )}
            </div>
          )}

          {loading && <div style={{ padding: 20 }}>Carregando...</div>}

          {erro && (
            <div
              style={{
                color: "red",
                padding: 20,
              }}
            >
              {erro}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "4px 6px",
  border: "1px solid #d1d5db",
  fontSize: 11,
  textAlign: "center",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: "3px 2px",
  border: "1px solid #d1d5db",
  fontSize: 10,
  textAlign: "center",
  lineHeight: 1.1,
};
