"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiClock,
  FiX,
} from "react-icons/fi";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import {
  Aviso,
  AvisoLogo,
  formatarDataHoraAviso,
} from "@/src/components/ui/AvisoLogo";

// ⚠️ OBRIGATÓRIO AJUSTAR: coloque aqui o número de UserType.MASTER.
// Veja no backend: src/user/enum/user-type.enum.ts  (valor de MASTER).
// Enquanto estiver errado, os botões de criar/editar/excluir não aparecem.
const TYPE_MASTER = 10;

// Imagens que já existem em /public. Adicione novas aqui.
const IMAGENS_DISPONIVEIS = [
  { label: "DPO", value: "/logo_dpo.png" },
  { label: "PE", value: "/pe_logo.png" },
  { label: "Mobi (BRT)", value: "/mobi_logo.png" },
  { label: "Brasil", value: "/brasil_logo.png" },
];

const COR = "#0a756c";

interface FormState {
  nome: string;
  descricao: string;
  imagemUrl: string; // "" = sem imagem (FaComment)
  dataHora: string; // <input type="datetime-local">
}

const FORM_VAZIO: FormState = {
  nome: "",
  descricao: "",
  imagemUrl: "",
  dataHora: "",
};

function isoParaInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function agoraParaInput(): string {
  return isoParaInput(new Date().toISOString());
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #dfe3e1",
  borderRadius: 8,
  fontSize: 13,
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  backgroundColor: "#fff",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
  display: "block",
};

const iconBtn = (cor: string, bg: string): React.CSSProperties => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "none",
  backgroundColor: bg,
  color: cor,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
});

export default function AvisosPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const isMaster = user?.typeUser === TYPE_MASTER;

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Mais recentes primeiro
  const ordenados = useMemo(
    () =>
      [...avisos].sort(
        (a, b) =>
          new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
      ),
    [avisos],
  );

  async function carregar() {
    try {
      const res = await fetch("/api/aviso", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvisos(Array.isArray(data) ? data : []);
      setErro(null);
    } catch {
      setErro("Não foi possível carregar os avisos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirCriar() {
    setEditandoId(null);
    setForm({ ...FORM_VAZIO, dataHora: agoraParaInput() });
    setErroForm(null);
    setFormAberto(true);
  }

  function abrirEditar(a: Aviso) {
    setEditandoId(a.id);
    setForm({
      nome: a.nome,
      descricao: a.descricao ?? "",
      imagemUrl: a.imagemUrl ?? "",
      dataHora: isoParaInput(a.dataHora),
    });
    setErroForm(null);
    setFormAberto(true);
  }

  async function salvar() {
    if (!form.nome.trim() || !form.dataHora) {
      setErroForm("Informe o nome e a data/hora do aviso.");
      return;
    }

    setSalvando(true);
    setErroForm(null);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        imagemUrl: form.imagemUrl || null,
        dataHora: new Date(form.dataHora).toISOString(),
      };

      const res = await fetch(
        editandoId ? `/api/aviso/${editandoId}` : "/api/aviso",
        {
          method: editandoId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : (data?.message ?? "Erro ao salvar aviso"),
        );
      }

      setFormAberto(false);
      await carregar();
    } catch (e: any) {
      setErroForm(e.message ?? "Erro ao salvar aviso");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(a: Aviso) {
    if (!confirm(`Excluir o aviso "${a.nome}"?`)) return;
    const res = await fetch(`/api/aviso/${a.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Erro ao excluir aviso");
      return;
    }
    setAvisos((prev) => prev.filter((x) => x.id !== a.id));
  }

  return (
    <div className="container">
      <style>{`
        .aviso-card { transition: box-shadow .15s, transform .15s; }
        .aviso-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .aviso-tile { transition: border-color .15s, background-color .15s; }
      `}</style>

      <div style={{ width: "100%", boxSizing: "border-box" }}>
        {/* ── Cabeçalho ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 16,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <button
              onClick={() => router.push("/select-system")}
              aria-label="Voltar"
              style={{
                ...iconBtn("#374151", "#eef1ee"),
                width: 36,
                height: 36,
                borderRadius: 10,
              }}
            >
              <FiArrowLeft size={18} />
            </button>
            <div
              style={{ display: "flex", flexDirection: "column", minWidth: 0 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}
                >
                  Avisos
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    backgroundColor: COR,
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  {ordenados.length}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                Comunicados e novidades
              </span>
            </div>
          </div>

          {isMaster && (
            <button
              onClick={abrirCriar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 10,
                border: "none",
                backgroundColor: COR,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <FiPlus size={16} /> Novo aviso
            </button>
          )}
        </div>

        {/* ── Estados ───────────────────────────────────────────── */}
        {loading && (
          <p style={{ color: "#888", fontSize: 12 }}>Carregando...</p>
        )}
        {erro && <p style={{ color: "#e53e3e", fontSize: 12 }}>{erro}</p>}

        {!loading && !erro && ordenados.length === 0 && (
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              textAlign: "center",
              padding: "40px 16px",
              border: "1px dashed #d3d0d0",
              borderRadius: 12,
              color: "#6b7280",
              fontSize: 13,
              backgroundColor: "#fafafa",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <AvisoLogo src={null} nome="vazio" size={56} />
            </div>
            Nenhum aviso cadastrado.
          </div>
        )}

        {/* ── Lista ─────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
          }}
        >
          {ordenados.map((a, i) => (
            <div
              key={a.id}
              className="aviso-card"
              style={{
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                backgroundColor: "#fff",
                border: "1px solid #e6e8e6",
                borderLeft: `4px solid ${i === 0 ? COR : "#d9dedb"}`,
                borderRadius: 12,
                padding: "12px 12px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <AvisoLogo src={a.imagemUrl} nome={a.nome} size={46} />

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}
                  >
                    {a.nome}
                  </span>
                  {i === 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: COR,
                        backgroundColor: "#e3f3f1",
                        borderRadius: 999,
                        padding: "2px 7px",
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                      }}
                    >
                      Mais recente
                    </span>
                  )}
                </div>

                {a.descricao && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#4b5563",
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}
                  >
                    {a.descricao}
                  </span>
                )}

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  <FiClock size={12} /> {formatarDataHoraAviso(a.dataHora)}
                </span>
              </div>

              {isMaster && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => abrirEditar(a)}
                    title="Editar"
                    aria-label="Editar aviso"
                    style={iconBtn("#3a60c8", "#e9efff")}
                  >
                    <FiEdit2 size={15} />
                  </button>
                  <button
                    onClick={() => remover(a)}
                    title="Excluir"
                    aria-label="Excluir aviso"
                    style={iconBtn("#e53e3e", "#fdecec")}
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal criar/editar ──────────────────────────────────── */}
      {isMaster && formAberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => !salvando && setFormAberto(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 18,
              width: "100%",
              maxWidth: 440,
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong style={{ fontSize: 16 }}>
                {editandoId ? "Editar aviso" : "Novo aviso"}
              </strong>
              <button
                onClick={() => setFormAberto(false)}
                disabled={salvando}
                aria-label="Fechar"
                style={iconBtn("#6b7280", "#f1f3f2")}
              >
                <FiX size={16} />
              </button>
            </div>

            <div>
              <label style={labelStyle}>Nome</label>
              <input
                style={inputStyle}
                maxLength={150}
                placeholder="Ex: SET | PJES PMPE"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Descrição</label>
              <textarea
                style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                placeholder="Escreva o texto do aviso"
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
              />
            </div>

            <div>
              <label style={labelStyle}>Imagem</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
                  gap: 8,
                }}
              >
                {[
                  { label: "Sem imagem", value: "" },
                  ...IMAGENS_DISPONIVEIS,
                ].map((img) => {
                  const ativo = form.imagemUrl === img.value;
                  return (
                    <button
                      key={img.value || "none"}
                      type="button"
                      className="aviso-tile"
                      onClick={() => setForm({ ...form, imagemUrl: img.value })}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 4px",
                        borderRadius: 10,
                        border: `2px solid ${ativo ? COR : "#e6e8e6"}`,
                        backgroundColor: ativo ? "#f0f9f8" : "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <AvisoLogo
                        src={img.value || null}
                        nome={img.label}
                        size={40}
                      />
                      <span
                        style={{
                          fontSize: 10,
                          color: "#374151",
                          fontWeight: 600,
                        }}
                      >
                        {img.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Data e hora</label>
              <input
                type="datetime-local"
                style={inputStyle}
                value={form.dataHora}
                onChange={(e) => setForm({ ...form, dataHora: e.target.value })}
              />
            </div>

            {erroForm && (
              <span style={{ color: "#e53e3e", fontSize: 12 }}>{erroForm}</span>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 4,
              }}
            >
              <button
                onClick={() => setFormAberto(false)}
                disabled={salvando}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid #dfe3e1",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: COR,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: salvando ? 0.7 : 1,
                }}
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
