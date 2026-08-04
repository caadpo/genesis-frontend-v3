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
  const [codOp, setCodOp] = useState("");
  const [salvandoCodOp, setSalvandoCodOp] = useState(false);

  // ✅ Evento bloqueado = status diferente de CRIADO
  const eventoBloqueado =
    !!operacao && evento?.status_evento && evento.status_evento !== "CRIADO";

  useEffect(() => {
    if (!open) return;

    if (operacao) {
      setNomeOperacao(operacao.nome_operacao);
      setOficiais(operacao.qtd_oficiais_oper);
      setPracas(operacao.qtd_pracas_oper);
      setCodOp(operacao.cod_op ?? "");
    } else {
      setNomeOperacao("");
      setOficiais(0);
      setPracas(0);
      setCodOp("");
    }
  }, [operacao, open]);

  if (!open) return null;

  async function handleSubmit() {
    const method = operacao ? "PATCH" : "POST";
    const url = operacao ? `/api/operacao/${operacao.id}` : "/api/operacao";

    // ✅ Quando o evento está bloqueado, envia só as cotas.
    // Caso contrário, envia o payload completo normalmente.
    const body = eventoBloqueado
      ? {
          qtd_oficiais_oper: oficiais,
          qtd_pracas_oper: pracas,
        }
      : {
          nome_operacao: nomeOperacao,
          ome_id: evento?.ome?.id,
          evento_id: evento?.id,
          qtd_oficiais_oper: oficiais,
          qtd_pracas_oper: pracas,
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

    // ✅ Código só pode ser trocado quando o evento não está bloqueado
    if (!eventoBloqueado && operacao && codOp !== operacao.cod_op) {
      await handleSalvarCodOp();
    }

    onCreated();
    onClose();
  }

  async function handleSalvarCodOp() {
    if (!operacao) return;

    if (!/^\d{1,10}$/.test(codOp)) {
      toast.error("O código da operação deve ter até 10 dígitos");
      return;
    }

    setSalvandoCodOp(true);
    const promise = fetch(`/api/operacao/${operacao.id}/cod-op`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cod_op: codOp }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao alterar código");
      return data;
    });

    toast.promise(promise, {
      loading: "Alterando código da operação...",
      success: "Código atualizado ✅",
      error: (err) => err.message || "Erro ao alterar código ❌",
    });

    try {
      await promise;
    } finally {
      setSalvandoCodOp(false);
    }
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <h2>{operacao ? "Editar Operação" : "Nova Operação"}</h2>

        {eventoBloqueado && (
          <div
            style={{
              background: "#fff3cd",
              color: "#856404",
              border: "1px solid #ffeeba",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "12px",
              marginBottom: "10px",
            }}
          >
            Evento com status <strong>{evento?.status_evento}</strong>. Só é
            possível ajustar as cotas de oficiais e praças (para liberar cotas
            não utilizadas).
          </div>
        )}

        <label>OME</label>
        <input type="text" value={evento?.ome?.nomeOme ?? ""} disabled />

        <label>Nome da Operação</label>
        <input
          type="text"
          value={nomeOperacao}
          onChange={(e) => setNomeOperacao(e.target.value.toUpperCase())}
          maxLength={22}
          disabled={eventoBloqueado}
        />
        <small style={{ color: nomeOperacao.length >= 22 ? "red" : "#999" }}>
          {nomeOperacao.length}/22
        </small>

        {operacao && (
          <>
            <label>Código da Operação (COP)</label>
            <input
              type="text"
              value={codOp}
              onChange={(e) =>
                setCodOp(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              maxLength={10}
              placeholder="até 10 dígitos"
              disabled={eventoBloqueado}
            />
            <small
              style={{
                color: codOp.length > 0 && codOp.length > 10 ? "red" : "#999",
              }}
            >
              {codOp.length}/10 — código atual: {operacao.cod_op}
            </small>
          </>
        )}

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
          <button
            onClick={handleSubmit}
            className="btnSave"
            disabled={salvandoCodOp}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
