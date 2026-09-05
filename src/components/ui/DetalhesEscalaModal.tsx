"use client";

import {
  FaArrowLeft,
  FaExchangeAlt,
  FaBan,
  FaUser,
  FaCalendarAlt,
  FaCheckCircle,
  FaDesktop,
  FaShieldAlt,
  FaUserFriends,
  FaMapMarkerAlt,
  FaUsers,
  FaClipboardList,
  FaCommentAlt,
  FaPhoneAlt,
  FaInfoCircle,
  FaWhatsapp,
} from "react-icons/fa";
import { useState } from "react";
import toast from "react-hot-toast";

// ─── Tipos ──────────────────────────────────────────────────────────────────
// Reaproveite os mesmos tipos do page.tsx. Se preferir, mova `Escala` e
// `Repasse` para um arquivo compartilhado (ex: src/types/escala.ts) e importe
// dos dois lugares em vez de duplicar.

type Viatura = {
  id: number;
  patrimonio: string;
  statusVtr: "DISPONIVEL" | "INDISPONIVEL";
};

type Escala = {
  id: number;
  sistema: string;
  mat_escala: string;
  pg_escala: string;
  ng_escala: string;
  cpf_escala: string;
  tipo_escala: string;
  nomeome_escala: string;
  dataInicio: string;
  horaInicio: string;
  horaFim: string;
  cota_escala: number;
  localApresentacao: string;
  funcao: string;
  situacao: string;
  anotacoes?: string;
  viaturaId?: number | null;
  viatura?: Viatura | null;
  operacaoId?: number;
  nomeOperacao?: string;
  cod_op?: string;
  nomeEvento?: string;
  nomeOme?: string;
  status_teto?: string;
  somacota_escala: number;
  somaCotaFinal: number;
  pagamento: string;
  phone?: string | null;
  presencaConfirmada?: boolean;
  presencaObservacao?: string | null;
  presencaConfirmadaEm?: string | null;
  presencaConfirmadaPorNome?: string | null;
  comentario_pagamento: string | null;
  valorIndividual?: number;
  conta?: {
    banco: string;
    agencia: string;
    conta: string;
  } | null;
};

type Repasse = {
  id: number;
  escalaId: number;
  statusRepasse: "ABERTO" | "ACEITO" | "CANCELADO";
  dataInicioRepasse: string;
  horaInicioRepasse: string;
  motivo?: string | null;
};

type DetalhesEscalaModalProps = {
  escala: Escala;
  colegas: Escala[];
  carregandoColegas: boolean;
  repasseAtivo: Repasse | null;
  expirado: boolean;
  loadingCancelar: boolean;
  onClose: () => void;
  onRepassar: () => void;
  onCancelarRepasse: () => void;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatarHora(hora: string): string {
  return hora?.slice(0, 5) ?? "-";
}

function formatarData(data: string): string {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Monta um link do WhatsApp a partir do telefone salvo no cadastro.
// Assume DDI 55 (Brasil) quando o número não vier com o código do país.
function linkWhatsApp(phone?: string | null): string | null {
  if (!phone) return null;
  const digitos = phone.replace(/\D/g, "");
  if (digitos.length < 8) return null;
  const comDDI = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${comDDI}`;
}

function situacaoCor(situacao: string): { cor: string; bg: string } {
  const s = situacao?.toUpperCase() ?? "";
  if (s.includes("REGULAR") || s.includes("CONFIRMAD"))
    return { cor: "#16a34a", bg: "#dcfce7" };
  if (s.includes("CANCEL") || s.includes("IRREGULAR"))
    return { cor: "#dc2626", bg: "#fee2e2" };
  return { cor: "#92400e", bg: "#fef3c7" };
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function Avatar({ mat, nome }: { mat: string; nome: string }) {
  const [erro, setErro] = useState(false);
  if (erro || !mat)
    return (
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#eef2ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FaUser size={18} color="#6366f1" />
      </div>
    );
  return (
    <img
      src={`/avatares/${mat}.jpg`}
      alt={nome}
      onError={() => setErro(true)}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1 }}
    >
      <div style={{ color: "#4f46e5", marginTop: 2 }}>{icon}</div>
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#4f46e5",
            letterSpacing: "0.04em",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "10px 15px",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      {children}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function DetalhesEscalaModal({
  escala,
  colegas,
  carregandoColegas,
  repasseAtivo,
  expirado,
  loadingCancelar,
  onClose,
  onRepassar,
  onCancelarRepasse,
}: DetalhesEscalaModalProps) {
  const situacao = situacaoCor(escala.situacao);
  const colegasVisiveis = colegas.slice(0, 3);
  const colegasOcultos = colegas.length - colegasVisiveis.length;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes slideUpDetalhes {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          height: "88vh",
          maxHeight: "calc(100vh - 24px)",
          backgroundColor: "#f4f5f7",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUpDetalhes 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* ─── Alça de puxar ─── */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#d1d5db",
            margin: "10px auto 0 auto",
            flexShrink: 0,
          }}
        />

        {/* ─── Cabeçalho ─── */}
        <div
          style={{
            background: "#482cad",
            borderRadius: "16px 16px 0 0",
            margin: "5px 12px 0 5px",
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 5,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={onClose}
              aria-label="Voltar"
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: 2,
                display: "flex",
              }}
            >
              <FaArrowLeft size={20} />
            </button>
            <div
              onClick={() => {
                if (!escala.cod_op) return;
                navigator.clipboard.writeText(escala.cod_op);
                toast.success("Código da Operação Copiado");
              }}
              title="Clique para copiar o código da operação"
              style={{ cursor: escala.cod_op ? "pointer" : "default" }}
            >
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
                {escala.nomeEvento || escala.nomeOperacao || "SERVIÇO"}
              </div>
              <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 600 }}>
                {escala.nomeOme} - COP {escala.cod_op ?? "-"}
              </div>
            </div>
          </div>

          {repasseAtivo ? (
            <button
              onClick={onCancelarRepasse}
              disabled={loadingCancelar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 700,
                fontSize: 12,
                cursor: loadingCancelar ? "not-allowed" : "pointer",
                opacity: loadingCancelar ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              <FaBan />
              {loadingCancelar ? "CANCELANDO..." : "CANCELAR"}
            </button>
          ) : (
            <button
              onClick={onRepassar}
              disabled={expirado}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: expirado ? "#9ca3af" : "#f97316",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 700,
                fontSize: 12,
                cursor: expirado ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <FaExchangeAlt />
              {expirado ? "PRAZO ENCERRADO" : "REPASSAR"}
            </button>
          )}
        </div>

        {/* ─── Conteúdo com scroll ─── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "5px 5px 5px 5px",
            margin: "0 8px 8px 8px",
            background: "#fff",
            borderRadius: "0 0 16px 16px",
          }}
        >
          {/* Data / Situação */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              marginBottom: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <InfoRow>
              <InfoItem
                icon={<FaCalendarAlt size={18} />}
                label=""
                value={
                  <div>
                    <div style={{ fontSize: 18 }}>
                      {formatarData(escala.dataInicio)}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#4f46e5",
                      }}
                    >
                      {formatarHora(escala.horaInicio)} às{" "}
                      {formatarHora(escala.horaFim)}
                    </div>
                  </div>
                }
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#4f46e5",
                    letterSpacing: "0.04em",
                    marginBottom: 6,
                  }}
                >
                  SITUAÇÃO
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: situacao.cor,
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  <FaCheckCircle size={14} />
                  {escala.situacao?.toUpperCase() || "—"}
                </div>
              </div>
            </InfoRow>
          </div>

          {/* Sistema / Operação / Função / Local / Cota / Detalhes */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              marginBottom: 14,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            <InfoRow>
              <InfoItem
                icon={<FaDesktop size={16} />}
                label="SISTEMA"
                value={escala.sistema}
              />
              <InfoItem
                icon={<FaShieldAlt size={16} />}
                label="OPERAÇÃO"
                value={escala.nomeOperacao}
              />
            </InfoRow>
            <InfoRow>
              <InfoItem
                icon={<FaUserFriends size={16} />}
                label="FUNÇÃO"
                value={escala.funcao}
              />
              <InfoItem
                icon={<FaMapMarkerAlt size={16} />}
                label="LOCAL"
                value={escala.localApresentacao}
              />
            </InfoRow>
            <InfoRow>
              <InfoItem
                icon={<FaUsers size={16} />}
                label="TOTAL DE COTA"
                value={escala.cota_escala}
              />
              <InfoItem
                icon={<FaClipboardList size={16} />}
                label="DETALHES"
                value={escala.presencaObservacao}
              />
            </InfoRow>
          </div>

          {/* Anotações */}
          {escala.anotacoes && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#4f46e5",
                  fontWeight: 700,
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                <FaCommentAlt size={13} />
                ANOTAÇÕES
              </div>
              <div
                style={{
                  background: "#eef0fd",
                  borderRadius: 14,
                  padding: "16px",
                  fontSize: 14,
                  color: "#1f2937",
                }}
              >
                {escala.anotacoes}
              </div>
            </div>
          )}

          {escala.comentario_pagamento && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#b90f09",
                color: "#fff",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              <FaInfoCircle />
              {escala.comentario_pagamento}
            </div>
          )}

          {/* Equipe de serviço */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#4f46e5",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <FaUsers size={14} />
                EQUIPE DE SERVIÇO
              </div>
              <span
                style={{
                  background: "#eef0fd",
                  color: "#4f46e5",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "3px 10px",
                }}
              >
                {colegas.length} integrante{colegas.length === 1 ? "" : "s"}
              </span>
            </div>

            {carregandoColegas ? (
              <div style={{ fontSize: 12, color: "#94a3b8", padding: 8 }}>
                Carregando equipe...
              </div>
            ) : colegas.length === 0 ? (
              <div style={{ fontSize: 12, color: "#94a3b8", padding: 8 }}>
                Nenhum outro integrante escalado com você.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {colegasVisiveis.map((c) => {
                  const wa = linkWhatsApp(c.phone);
                  return (
                    <div
                      key={c.id}
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: "8px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <Avatar mat={c.mat_escala} nome={c.nomeome_escala} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#111827",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.pg_escala} {c.mat_escala} {c.ng_escala}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 2,
                          }}
                        >
                          {c.phone && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12.5,
                                color: "#6b7280",
                              }}
                            >
                              <FaPhoneAlt size={10} />
                              {c.phone}
                            </span>
                          )}
                          <span
                            style={{
                              background: "#eef0fd",
                              color: "#4f46e5",
                              fontSize: 10.5,
                              fontWeight: 700,
                              borderRadius: 999,
                              padding: "2px 8px",
                            }}
                          >
                            {c.funcao}
                          </span>
                        </div>
                      </div>

                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Chamar no WhatsApp"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "#f4fdee",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FaWhatsapp size={25} color="#429229" />
                        </a>
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            opacity: 0.4,
                          }}
                        >
                          <FaWhatsapp size={25} color="#429229" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {colegasOcultos > 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#94a3b8",
                      textAlign: "center",
                      marginTop: 2,
                    }}
                  >
                    +{colegasOcultos} outro{colegasOcultos === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
