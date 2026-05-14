"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  user?: any;
  onSuccess: (id: number) => void;
};

type Ome = {
  id: number;
  nomeOme: string;
};

const USER_TYPES = [
  { value: 1, label: "Comum" },
  { value: 2, label: "Auxiliar" },
  { value: 3, label: "Diretor" },
  { value: 4, label: "Estratégico" },
  { value: 5, label: "Financeiro" },
  { value: 6, label: "PD" },
  { value: 9, label: "Técnico" },
  { value: 10, label: "Master" },
];

function formatPhone(value: string) {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 3)}.${n.slice(3, 7)}-${n.slice(7)}`;
}

export default function UsuariosModal({
  open,
  onClose,
  user,
  onSuccess,
}: Props) {
  const [omes, setOmes] = useState<Ome[]>([]);
  const [mat, setMat] = useState("");
  const [phone, setPhone] = useState("");
  const [typeUser, setTypeUser] = useState<number>(1);
  const [omeId, setOmeId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  // ─── Reset / preenchimento ao abrir ──────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setMat(user.mat ?? "");
      setPhone(user.phone ?? "");
      setTypeUser(user.typeUser ?? 1);
      setOmeId(user.ome?.id ?? "");
    } else {
      setMat("");
      setPhone("");
      setTypeUser(1);
      setOmeId("");
    }
  }, [user, open]);

  // ─── Carregar OMEs ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      fetch("/api/ome")
        .then((r) => r.json())
        .then(setOmes)
        .catch(() => toast.error("Erro ao carregar OMEs"));
    }
  }, [open]);

  if (!open) return null;

  // ─── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!mat.trim()) return toast.error("Informe a matrícula");
    if (!omeId) return toast.error("Selecione a OME");

    setLoading(true);
    try {
      const isEdit = !!user;
      const url = isEdit ? `/api/user/${user.id}` : `/api/user`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        mat: mat.trim(),
        phone,
        typeUser,
        omeId: Number(omeId),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Erro ao salvar usuário");
        return;
      }

      const data = await res.json();
      toast.success(isEdit ? "Usuário atualizado ✅" : "Usuário criado ✅");
      onSuccess(data.id);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modalUsuarioOverlay">
      <div className="modalUsuarioCard">
        <h2>{user ? "Editar Usuário" : "Novo Usuário"}</h2>

        <div className="modalUsuarioForm">
          {/* Matrícula */}
          <div className="modalUsuarioCampo">
            <label>Matrícula</label>
            <input
              value={mat}
              placeholder="Ex: 1000005"
              disabled={!!user} // matrícula não é editável após criação
              onChange={(e) => setMat(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          {/* OME */}
          <div className="modalUsuarioCampo">
            <label>Organização Militar (OME)</label>
            <select
              value={omeId}
              onChange={(e) => setOmeId(Number(e.target.value))}
            >
              <option value="">Selecione</option>
              {omes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nomeOme}
                </option>
              ))}
            </select>
          </div>

          {/* Telefone */}
          <div className="modalUsuarioCampo">
            <label>Telefone</label>
            <input
              value={phone}
              placeholder="(81) 9.9999-9999"
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
          </div>

          {/* Tipo de usuário */}
          <div className="modalUsuarioCampo">
            <label>Nível de acesso</label>
            <select
              value={typeUser}
              onChange={(e) => setTypeUser(Number(e.target.value))}
            >
              {USER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modalUsuarioActions">
          <button
            onClick={onClose}
            className="btnUsuarioCancel"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="btnUsuarioSave"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
