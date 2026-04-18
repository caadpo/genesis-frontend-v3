"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  evento?: any;
  onCreated: () => void;
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
}: Props) {
  const [omes, setOmes] = useState<Ome[]>([]);
  const [omeId, setOmeId] = useState<number>();
  const [oficiais, setOficiais] = useState(0);
  const [pracas, setPracas] = useState(0);

  useEffect(() => {
    if (evento) {
      setOmeId(evento.ome.id);
      setOficiais(evento.qtd_dist_of);
      setPracas(evento.qtd_dist_prc);
    } else {
      setOmeId(undefined);
      setOficiais(0);
      setPracas(0);
    }
  }, [evento, open]);

  useEffect(() => {
    if (open) {
      fetch("/api/ome")
        .then((r) => r.json())
        .then(setOmes);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit() {
    const method = evento ? "PATCH" : "POST";
    const url = evento ? `/api/evento/${evento.id}` : "/api/evento";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar ❌");
      return;
    }

    toast.success(
      evento
        ? "Evento atualizado com sucesso ✅"
        : "Evento criado com sucesso ✅"
    );

    onCreated(); // atualiza a tabela
    onClose(); // fecha a modal
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <h2>{evento ? "Editar Evento" : "Novo Evento"}</h2>

        <label>OME</label>
        <select
          value={omeId ?? ""}
          onChange={(e) => setOmeId(Number(e.target.value))}
        >
          <option>Selecione</option>
          {omes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nomeOme}
            </option>
          ))}
        </select>

        <label>Cotas Oficiais</label>
        <input type="number" />

        <label>Cotas Praças</label>
        <input />

        <div className="modalActions">
          <button onClick={onClose} className="btnCancel">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btnSave">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
