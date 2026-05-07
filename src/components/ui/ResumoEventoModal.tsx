"use client";

import { useEffect, useState } from "react";
import { FiStar, FiChevronUp } from "react-icons/fi";

type UsuarioResumo = {
  usuarioId: number;
  mat: number;
  pg: string;
  nomeGuerra: string;
  nomeOme: string;
  phone: string;
  cpf: string;
  nunfunc: string;
  nunvinc: string;
  banco: string;
  agencia: string;
  conta: string;
  totalCotas: number;
};

type ResumoEvento = {
  id: number;
  nome_evento: string;
  qtd_of_evento: number;
  qtd_prc_evento: number;
  status_evento: string;
  homologado_em?: string;
  pd_concluida_em?: string;
  pago_em?: string;
  ome: { id: number; nomeOme: string };
  totalCotasOficiais: number;
  totalCotasPracas: number;
  usuarios: UsuarioResumo[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  eventoId: number | null;
};

export default function ResumoEventoModal({ open, onClose, eventoId }: Props) {
  const [resumo, setResumo] = useState<ResumoEvento | null>(null);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!open || !eventoId) return;

    setLoading(true);
    fetch(`/api/evento/${eventoId}`)
      .then((r) => r.json())
      .then((data) => {
        setResumo(data);
        setBusca("");
      })
      .finally(() => setLoading(false));
  }, [open, eventoId]);

  if (!open) return null;

  const usuariosFiltrados =
    resumo?.usuarios.filter((u) => {
      if (!busca.trim()) return true;
      const term = busca.toLowerCase();
      return [u.mat, u.pg, u.nomeGuerra, u.nomeOme, u.cpf, u.nunfunc]
        .map((v) => String(v).toLowerCase())
        .some((v) => v.includes(term));
    }) ?? [];

  const formatarCPF = (cpf: string): string => {
    const s = String(cpf).replace(/\D/g, "").padStart(11, "0");
    return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div className="modalOverlayEventoResumo" onClick={onClose}>
      <div
        className="modalCardEventoResumo"
        style={{
          maxWidth: "900px",
          width: "95%",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Carregando...
          </div>
        )}

        {!loading && resumo && (
          <>
            {/* ─── Cabeçalho ─────────────────────────────────────────────── */}
            <div>
              <div style={{ textAlign: "right" }}>
                <FiChevronUp onClick={onClose} />
              </div>
              <div className="divLogoResumoEvento">
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div>
                    <img
                      src="/gov_pe.png"
                      alt="Logo da PMPE"
                      className="logoEventoResumo"
                    />
                  </div>

                  <h4 className="tituloEventoResumo">
                    Policia Militar de Pernambuco
                  </h4>
                  <h4 className="tituloEventoResumo">
                    Quartel do Comando Geral
                  </h4>
                  <h4 className="tituloEventoResumo">
                    Diretoria de Planejamento Operacional
                  </h4>
                </div>
              </div>
              <div>
                <div
                  style={{ fontSize: "13px", marginTop: "4px", color: "#555" }}
                >
                  {resumo.ome.nomeOme} | {resumo.nome_evento}
                </div>
                <div
                  style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
                >
                  Status: <strong>{resumo.status_evento}</strong>
                  {resumo.homologado_em && (
                    <span>
                      {" "}
                      | Homologado em{" "}
                      {new Date(resumo.homologado_em).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Totalizadores ─────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
              <div
                className="cotasBox"
                style={{ display: "flex", gap: "16px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                  }}
                >
                  <FiStar />
                  <span>Oficiais:</span>
                  <strong>
                    {resumo.totalCotasOficiais} / {resumo.qtd_of_evento}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                  }}
                >
                  <FiChevronUp />
                  <span>Praças:</span>
                  <strong>
                    {resumo.totalCotasPracas} / {resumo.qtd_prc_evento}
                  </strong>
                </div>
              </div>
            </div>

            {/* ─── Busca ─────────────────────────────────────────────────── */}
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", color: "#555" }}>
                  {resumo.ome.nomeOme} | {resumo.nome_evento}
                </div>

                <div
                  style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}
                >
                  <strong>Status: </strong>
                  {resumo.homologado_em && (
                    <span>
                      {resumo.status_evento}{" "}
                      {new Date(resumo.homologado_em).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Buscar por matrícula, nome, OME..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    fontSize: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* ─── Tabela ─────────────────────────────────────────────────── */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f3f4f6",
                    fontWeight: "bold",
                    color: "#374151",
                  }}
                >
                  <th style={th}>IDENTIFICAÇÃO</th>

                  <th style={th}>CPF</th>
                  <th style={th}>TELEFONE</th>
                  <th style={th}>NUFUNC</th>
                  <th style={th}>DADOS BANCÁRIOS</th>
                  <th style={th}>TOTAL COTAS</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: "16px",
                        color: "#888",
                      }}
                    >
                      Nenhum policial escalado neste evento
                    </td>
                  </tr>
                )}
                {usuariosFiltrados.map((u) => (
                  <tr
                    key={u.usuarioId}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={td}>
                      {u.pg} {u.mat} {u.nomeGuerra} {u.nomeOme}
                    </td>

                    <td style={td}>{formatarCPF(u.cpf)}</td>
                    <td style={td}>{u.phone || "-"}</td>
                    <td style={td}>
                      {u.nunfunc} | {u.nunvinc}
                    </td>

                    <td style={td}>
                      {u.banco
                        ? `${u.banco} | Ag: ${u.agencia} | Ct: ${u.conta}`
                        : "-"}
                    </td>
                    <td
                      style={{ ...td, textAlign: "center", fontWeight: "bold" }}
                    >
                      {u.totalCotas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ─── Rodapé ─────────────────────────────────────────────────── */}
            <div
              style={{
                marginTop: "12px",
                fontSize: "11px",
                color: "#888",
                textAlign: "right",
              }}
            >
              {usuariosFiltrados.length} policial(is) escalado(s)
            </div>

            <div
              style={{
                borderBottom: "1px solid #eee",
                textAlign: "right",
              }}
            >
              <div style={{ fontSize: "13px", color: "#555" }}>
                <strong>Oficiais: </strong>
                {resumo.totalCotasOficiais} cota(s){" "}
                {(resumo.totalCotasOficiais * 300).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              <div style={{ fontSize: "13px", color: "#555" }}>
                <strong>Praças: </strong>
                {resumo.totalCotasPracas} cota(s){" "}
                {(resumo.totalCotasPracas * 200).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </div>
            <div
              style={{ fontSize: "13px", color: "#555", textAlign: "right" }}
            >
              <strong>Valor total: </strong>

              {(
                resumo.totalCotasPracas * 200 +
                resumo.totalCotasOficiais * 300
              ).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </>
        )}

        <div style={{ flex: 1, textAlign: "center" }}>
          <h4 className="tituloEventoResumo">
            Coordenadoria de Planejamento Administrativo
          </h4>
          <div>
            <img
              src="/logo_dpo.webp"
              alt="Logo da PMPE"
              className="logoEventoResumoRodape"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Estilos inline reutilizáveis ─────────────────────────────────────────────
const th: React.CSSProperties = {
  padding: "6px 8px",
  textAlign: "left",
  borderBottom: "1px solid #dcdcdc",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "5px 8px",
  verticalAlign: "middle",
};
