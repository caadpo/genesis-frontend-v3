"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Sistema = "PJES" | "DIARIAS";
type TipoPeriodo = "MENSAL" | "OPERACAO";
type StatusTeto = "ABERTO" | "ENCERRADO";

type TetoForm = {
  sistema: Sistema;
  nome_verba: string;
  cod_verba: string;
  valor_total: number | "";
  ttctof: number | "";
  ttctprc: number | "";
  data_inicio: string;
  data_fim: string;
  tipo_periodo: TipoPeriodo;
  status: StatusTeto;
  imagemUrl: string;
};

type TetoModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  sistema?: Sistema;
  teto?: {
    id: number;
    sistema: string;
    nome_verba: string;
    cod_verba: string;
    valor_total: number;
    ttctof: number;
    ttctprc: number;
    data_inicio: string;
    data_fim?: string;
    tipo_periodo: string;
    status: string;
    imagemUrl: string;
  } | null;
};

function makeEmptyForm(sistema: Sistema): TetoForm {
  return {
    sistema,
    nome_verba: "",
    cod_verba: "",
    valor_total: "",
    ttctof: "",
    ttctprc: "",
    data_inicio: "",
    data_fim: "",
    tipo_periodo: sistema === "DIARIAS" ? "OPERACAO" : "MENSAL",
    status: "ABERTO",
    imagemUrl: "",
  };
}

function formatDateForInput(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TetoModal({
  open,
  onClose,
  onSaved,
  teto,
  sistema,
}: TetoModalProps) {
  const [form, setForm] = useState<TetoForm>(() =>
    makeEmptyForm(sistema ?? "PJES"),
  );
  const [loading, setLoading] = useState(false);

  const isEditing = !!teto;

  useEffect(() => {
    if (teto) {
      setForm({
        sistema: teto.sistema as Sistema,
        nome_verba: teto.nome_verba,
        cod_verba: teto.cod_verba,
        valor_total: teto.valor_total,
        ttctof: teto.ttctof,
        ttctprc: teto.ttctprc,
        data_inicio: formatDateForInput(teto.data_inicio),
        data_fim: formatDateForInput(teto.data_fim),
        tipo_periodo: teto.tipo_periodo as TipoPeriodo,
        status: teto.status as StatusTeto,
        imagemUrl: teto.imagemUrl ?? "",
      });
    } else {
      setForm(makeEmptyForm(sistema ?? "PJES"));
    }
  }, [teto, open]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    // Validações básicas
    if (
      !form.sistema ||
      !form.nome_verba ||
      !form.cod_verba ||
      !form.data_inicio ||
      !form.tipo_periodo
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (form.data_fim && form.data_inicio && form.data_fim < form.data_inicio) {
      toast.error("A data fim não pode ser anterior à data início.");
      return;
    }

    const payload = {
      ...form,
      valor_total: Number(form.valor_total),
      ttctof: Number(form.ttctof),
      ttctprc: Number(form.ttctprc),
      data_fim: form.data_fim || undefined,
    };

    setLoading(true);
    try {
      const url = isEditing ? `/api/tetos/${teto!.id}` : `/api/tetos`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message || "Erro ao salvar teto");
      }

      toast.success(isEditing ? "Teto atualizado ✅" : "Teto criado ✅");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleEncerrar() {
    if (!teto) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tetos/${teto.id}/encerrar`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Erro ao encerrar teto");
      toast.success("Teto encerrado 🔒");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!teto) return;
    toast((t) => (
      <div className="toastConfirmBox">
        <p>Deseja realmente excluir este teto?</p>
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
              const promise = fetch(`/api/tetos/${teto.id}`, {
                method: "DELETE",
              });
              toast.promise(promise, {
                loading: "Excluindo...",
                success: "Teto excluído ✅",
                error: "Erro ao excluir ❌",
              });
              const res = await promise;
              if (res.ok) {
                onSaved();
                onClose();
              }
            }}
          >
            Confirmar exclusão
          </button>
        </div>
      </div>
    ));
  }

  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modalCard"
        style={{ maxWidth: 560, width: "95%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modalHeader">
          <h2 style={{ margin: 0, fontSize: 16 }}>
            {isEditing ? "✏️ Editar Teto" : "➕ Novo Teto"}
          </h2>
          <button className="modalClose" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            padding: "16px",
          }}
        >
          {/* Sistema */}
          <div className="formGroup">
            <label className="formLabel">Sistema *</label>
            <select
              name="sistema"
              value={form.sistema}
              onChange={handleChange}
              className="formInput"
            >
              <option value="PJES">PJES</option>
              <option value="DIARIAS">DIÁRIAS</option>
            </select>
          </div>

          {/* Tipo Período */}
          <div className="formGroup">
            <label className="formLabel">Tipo Período *</label>
            <select
              name="tipo_periodo"
              value={form.tipo_periodo}
              onChange={handleChange}
              className="formInput"
            >
              <option value="MENSAL">MENSAL</option>
              <option value="OPERACAO">OPERAÇÃO</option>
            </select>
          </div>

          {/* Nome Verba */}
          <div className="formGroup" style={{ gridColumn: "1 / -1" }}>
            <label className="formLabel">Nome da Verba *</label>
            <input
              name="nome_verba"
              value={form.nome_verba}
              onChange={handleChange}
              className="formInput"
              placeholder="Ex: PJES - Janeiro 2025"
            />
          </div>

          {/* Cod Verba */}
          <div className="formGroup">
            <label className="formLabel">Código da Verba *</label>
            <input
              name="cod_verba"
              value={form.cod_verba}
              onChange={handleChange}
              className="formInput"
              placeholder="Ex: 001"
            />
          </div>

          {/* Valor Total */}
          <div className="formGroup">
            <label className="formLabel">Valor Total (R$)</label>
            <input
              name="valor_total"
              type="number"
              value={form.valor_total}
              onChange={handleChange}
              className="formInput"
              placeholder="0.00"
            />
          </div>

          {/* TTCT Oficiais */}
          <div className="formGroup">
            <label className="formLabel">Cotas Oficiais (ttctof)</label>
            <input
              name="ttctof"
              type="number"
              value={form.ttctof}
              onChange={handleChange}
              className="formInput"
              placeholder="0"
            />
          </div>

          {/* TTCT Praças */}
          <div className="formGroup">
            <label className="formLabel">Cotas Praças (ttctprc)</label>
            <input
              name="ttctprc"
              type="number"
              value={form.ttctprc}
              onChange={handleChange}
              className="formInput"
              placeholder="0"
            />
          </div>

          {/* Data Início */}
          <div className="formGroup">
            <label className="formLabel">Data Início *</label>
            <input
              name="data_inicio"
              type="date"
              value={form.data_inicio}
              onChange={handleChange}
              className="formInput"
            />
          </div>

          {/* Data Fim */}
          <div className="formGroup">
            <label className="formLabel">Data Fim</label>
            <input
              name="data_fim"
              type="date"
              value={form.data_fim}
              onChange={handleChange}
              className="formInput"
            />
          </div>

          {/* Imagem URL */}
          <div className="formGroup" style={{ gridColumn: "1 / -1" }}>
            <label className="formLabel">URL da Imagem</label>
            <input
              name="imagemUrl"
              value={form.imagemUrl}
              onChange={handleChange}
              className="formInput"
              placeholder="Ex: /alepe_logo.png"
            />
            {form.imagemUrl && (
              <div style={{ marginTop: 6 }}>
                <img
                  src={form.imagemUrl}
                  alt="Preview"
                  style={{
                    height: 40,
                    objectFit: "contain",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    padding: 2,
                  }}
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              </div>
            )}
          </div>

          {/* Status — só aparece na edição */}
          {isEditing && (
            <div className="formGroup">
              <label className="formLabel">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="formInput"
              >
                <option value="ABERTO">ABERTO</option>
                <option value="ENCERRADO">ENCERRADO</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderTop: "1px solid #e0e0e0",
            gap: 8,
          }}
        >
          {/* Ações destrutivas só na edição */}
          <div style={{ display: "flex", gap: 8 }}>
            {isEditing && (
              <>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  style={{
                    fontSize: 12,
                    borderRadius: 8,
                    padding: "5px 10px",
                    border: "solid 1px #e53935",
                    color: "#e53935",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Excluir
                </button>
                {form.status === "ABERTO" && (
                  <button
                    onClick={handleEncerrar}
                    disabled={loading}
                    style={{
                      fontSize: 12,
                      borderRadius: 8,
                      padding: "5px 10px",
                      border: "solid 1px #f57c00",
                      color: "#f57c00",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    🔒 Encerrar
                  </button>
                )}
              </>
            )}
          </div>

          {/* Salvar / Cancelar */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                fontSize: 12,
                borderRadius: 8,
                padding: "5px 14px",
                border: "solid 1px #999",
                color: "#555",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                fontSize: 12,
                borderRadius: 8,
                padding: "5px 14px",
                border: "solid 1px #0a756c",
                color: "#ffffff",
                background: "#0a756c",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Salvando..." : isEditing ? "Salvar" : "Criar Teto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
