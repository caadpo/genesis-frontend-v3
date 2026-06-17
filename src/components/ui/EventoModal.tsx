"use client";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/src/lib/api"; // se já usa em outros lugares

type Props = {
  open: boolean;
  onClose: () => void;
  evento?: any;
  onCreated: () => void;
  distribuicao: any;
  sistema?: string;
};

type Ome = {
  id: number;
  nomeOme: string;
};

export default function EventoModal({
  open,
  onClose,
  onCreated,
  evento,
  distribuicao,
  sistema,
}: Props) {
  const { user } = useCurrentUser();
  const [omes, setOmes] = useState<Ome[]>([]);
  const [omeId, setOmeId] = useState<number>();
  const [nomeEvento, setNomeEvento] = useState("");
  const [ne, setNe] = useState("");
  const [oficiais, setOficiais] = useState(0);
  const [pracas, setPracas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false); // 👈

  const isAdmin = [9, 10].includes(Number(user?.typeUser));

  useEffect(() => {
    if (!open) return;

    if (evento) {
      setNomeEvento(evento.nome_evento);
      setNe(evento.ne);
      setOmeId(evento.ome.id);
      setOficiais(evento.qtd_of_evento);
      setPracas(evento.qtd_prc_evento);
      setBloqueado(evento.bloqueado ?? false); // 👈
    } else {
      setNomeEvento("");
      setNe("");
      setOmeId(undefined);
      setOficiais(0);
      setPracas(0);
      setBloqueado(false); // 👈
    }
  }, [evento, open]);

  useEffect(() => {
    if (!open) return;

    const isDiretor = Number(user?.typeUser) === 3;
    const diretoriaId = user?.diretoriaId;

    const url =
      isDiretor && diretoriaId
        ? `/api/ome?diretoriaId=${diretoriaId}`
        : `/api/ome`;

    fetch(url)
      .then((r) => r.json())
      .then(setOmes);
  }, [open, user]);

  if (!open) return null;

  async function handleSubmit() {
    const method = evento ? "PATCH" : "POST";
    const url = evento ? `/api/evento/${evento.id}` : "/api/evento";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome_evento: nomeEvento,
        ne: ne,
        ome_id: omeId,
        qtd_of_evento: oficiais,
        qtd_prc_evento: pracas,
        distribuicao_id: distribuicao.id,
      }),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar ❌");
      return;
    }

    toast.success(
      evento
        ? "Evento atualizado com sucesso ✅"
        : "Evento criado com sucesso ✅",
    );

    onCreated();
    onClose();
  }

  // ✅ toggle de bloqueio — chama endpoint dedicado
  async function handleToggleBloqueio() {
    if (!evento) return;

    const res = await apiFetch(`/api/evento/${evento.id}/bloqueio`, {
      method: "PATCH",
    });

    if (!res.ok) {
      toast.error("Erro ao alterar bloqueio");
      return;
    }

    const data = await res.json();
    setBloqueado(data.bloqueado);
    toast.success(
      data.bloqueado ? "Evento bloqueado 🔒" : "Evento desbloqueado 🔓",
    );
    onCreated();
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <h2>{evento ? "Editar Evento" : "Novo Evento"}</h2>

        {/* ✅ Toggle de bloqueio — só na edição e para Técnico/Master */}
        {evento && isAdmin && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: bloqueado ? "#fdecea" : "#eafaf1",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {bloqueado
                ? "🔒 Evento bloqueado para edição"
                : "🔓 Evento liberado para edição"}
            </span>

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={bloqueado}
                onChange={handleToggleBloqueio}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
            </label>
          </div>
        )}

        <label>OME</label>
        <select
          value={omeId ?? ""}
          onChange={(e) => setOmeId(Number(e.target.value))}
          disabled={bloqueado && !isAdmin}
        >
          <option>Selecione</option>
          {omes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nomeOme}
            </option>
          ))}
        </select>

        <label>Nome do Evento</label>
        <input
          type="text"
          value={nomeEvento}
          onChange={(e) => setNomeEvento(e.target.value.toUpperCase())}
          maxLength={22}
          disabled={bloqueado && !isAdmin}
        />
        <small style={{ color: nomeEvento.length >= 22 ? "red" : "#999" }}>
          {nomeEvento.length}/22
        </small>

        {sistema !== "PJES" && (
          <>
            <label>Nota de Empenho</label>
            <input
              placeholder="Ignore se não souber"
              type="text"
              value={ne}
              onChange={(e) => setNe(e.target.value)}
              disabled={bloqueado && !isAdmin}
            />
          </>
        )}

        <label>Cotas Oficiais</label>
        <input
          type="number"
          value={oficiais}
          onChange={(e) => setOficiais(Number(e.target.value))}
          disabled={bloqueado && !isAdmin}
        />

        <label>Cotas Praças</label>
        <input
          type="number"
          value={pracas}
          onChange={(e) => setPracas(Number(e.target.value))}
          disabled={bloqueado && !isAdmin}
        />

        <div className="modalActions">
          <button onClick={onClose} className="btnCancel">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="btnSave"
            disabled={bloqueado && !isAdmin}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
