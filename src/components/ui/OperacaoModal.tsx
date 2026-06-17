"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  operacao?: any;
  onCreated: () => void;
  evento: any;
};

export default function OperacaoModal({
  open,
  onClose,
  onCreated,
  operacao,
  evento,
}: Props) {
  const [nomeOperacao, setNomeOperacao] = useState("");
  const [oficiais, setOficiais] = useState(0);
  const [pracas, setPracas] = useState(0);

  // ✅ Removido: useState de codVerba

  useEffect(() => {
    if (!open) return;

    if (operacao) {
      setNomeOperacao(operacao.nome_operacao);
      setOficiais(operacao.qtd_oficiais_oper);
      setPracas(operacao.qtd_pracas_oper);
      // ✅ Removido: setCodVerba
    } else {
      setNomeOperacao("");
      setOficiais(0);
      setPracas(0);
    }
  }, [operacao, open]);

  if (!open) return null;

  async function handleSubmit() {
    const method = operacao ? "PATCH" : "POST";
    const url = operacao ? `/api/operacao/${operacao.id}` : "/api/operacao";

    const body = {
      nome_operacao: nomeOperacao,
      ome_id: evento?.ome?.id,
      evento_id: evento?.id,
      qtd_oficiais_oper: oficiais,
      qtd_pracas_oper: pracas,
      // ✅ Removido: cod_verba — gerado pelo backend
    };

    const promise = fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao salvar");
      return data;
    });

    toast.promise(promise, {
      loading: operacao ? "Atualizando operação..." : "Criando operação...",
      success: operacao ? "Operação atualizada ✅" : "Operação criada ✅",
      error: (err) => err.message || "Erro ao salvar ❌",
    });

    await promise;
    onCreated();
    onClose();
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <h2>{operacao ? "Editar Operação" : "Nova Operação"}</h2>

        <label>OME</label>
        <input type="text" value={evento?.ome?.nomeOme ?? ""} disabled />

        <label>Nome da Operação</label>
        <input
          type="text"
          value={nomeOperacao}
          onChange={(e) => setNomeOperacao(e.target.value.toUpperCase())}
          maxLength={22}
        />
        <small style={{ color: nomeOperacao.length >= 22 ? "red" : "#999" }}>
          {nomeOperacao.length}/22
        </small>

        {/* ✅ Removido: campo Código Verba */}

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
