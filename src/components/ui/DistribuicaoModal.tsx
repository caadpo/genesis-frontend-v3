"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  tetoId: number;
  onCreated: () => void;
  distribuicao?: any; // 👈 novo
};

type Diretoria = {
  id: number;
  nomeDiretoria: string;
};

export default function DistribuicaoModal({
  open,
  onClose,
  tetoId,
  onCreated,
  distribuicao,
}: Props) {
  const [diretorias, setDiretorias] = useState<Diretoria[]>([]);
  const [diretoriaId, setDiretoriaId] = useState<number>();
  const [oficiais, setOficiais] = useState(0);
  const [pracas, setPracas] = useState(0);

  // 👇 AQUI
  useEffect(() => {
    if (distribuicao) {
      setDiretoriaId(distribuicao.diretoria.id);
      setOficiais(distribuicao.qtd_dist_of);
      setPracas(distribuicao.qtd_dist_prc);
    } else {
      // quando for NOVA distribuição, limpa os campos
      setDiretoriaId(undefined);
      setOficiais(0);
      setPracas(0);
    }
  }, [distribuicao, open]);

  useEffect(() => {
    if (open) {
      fetch("/api/diretoria")
        .then((r) => r.json())
        .then(setDiretorias);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit() {
    const method = distribuicao ? "PATCH" : "POST";
    const url = distribuicao
      ? `/api/distribuicao/${distribuicao.id}`
      : "/api/distribuicao";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teto_id: tetoId,
        diretoria_id: diretoriaId,
        qtd_dist_of: oficiais,
        qtd_dist_prc: pracas,
      }),
    });

    if (!res.ok) {
      alert("Erro ao salvar");
      return;
    }

    onClose();
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <h2>{distribuicao ? "Editar Distribuição" : "Nova Distribuição"}</h2>

        <label>Diretoria</label>
        <select
          value={diretoriaId ?? ""}
          onChange={(e) => setDiretoriaId(Number(e.target.value))}
        >
          <option>Selecione</option>
          {diretorias.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nomeDiretoria}
            </option>
          ))}
        </select>

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
