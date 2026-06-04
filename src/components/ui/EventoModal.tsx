"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  evento?: any;
  onCreated: () => void;
  distribuicao: any;
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
}: Props) {
  const [omes, setOmes] = useState<Ome[]>([]);
  const [omeId, setOmeId] = useState<number>();
  const [nomeEvento, setNomeEvento] = useState("");
  const [ne, setNe] = useState("");
  const [oficiais, setOficiais] = useState(0);
  const [pracas, setPracas] = useState(0);

  useEffect(() => {
    if (!open) return;

    if (evento) {
      setNomeEvento(evento.nome_evento);
      setNe(evento.ne);
      setOmeId(evento.ome.id);
      setOficiais(evento.qtd_of_evento);
      setPracas(evento.qtd_prc_evento);
    } else {
      setNomeEvento("");
      setNe("");
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

        <label>Nome do Evento</label>
        <input
          type="text"
          value={nomeEvento}
          onChange={(e) => setNomeEvento(e.target.value)}
        />

        <label>Nota de Empenho</label>
        <input
          placeholder="Ignore se não souber"
          type="text"
          value={ne}
          onChange={(e) => setNe(e.target.value)}
        />

        <label>Cotas Oficiais</label>
        <input
          type="number"
          value={oficiais}
          onChange={(e) => setOficiais(Number(e.target.value))}
        />

        <label>Cotas Praças</label>
        <input
          type="number"
          value={pracas}
          onChange={(e) => setPracas(Number(e.target.value))}
        />

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
