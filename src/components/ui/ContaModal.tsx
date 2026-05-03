"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  conta: any;
  userId?: number; // 👈 torna opcional
  onSuccess: () => void;
};

export default function ContaModal({
  open,
  onClose,
  conta,
  userId,
  onSuccess,
}: Props) {
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [numeroConta, setNumeroConta] = useState("");

  useEffect(() => {
    if (conta) {
      setBanco(conta.banco ?? "");
      setAgencia(conta.agencia ?? "");
      setNumeroConta(conta.conta ?? "");
    } else {
      // 👇 modo criação
      setBanco("");
      setAgencia("");
      setNumeroConta("");
    }
  }, [conta]);

  if (!open) return null;

  async function salvar() {
    const isEdicao = !!conta;
    if (!isEdicao && !userId) return;

    const url = isEdicao ? `/api/conta/${conta.id}` : `/api/conta`;
    const method = isEdicao ? "PATCH" : "POST";

    const body = isEdicao
      ? {
          banco,
          agencia,
          conta: numeroConta, // ✅ sem usuarioId
        }
      : {
          usuarioId: userId, // ✅ só no POST
          banco,
          agencia,
          conta: numeroConta,
        };

    const promise = fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    });

    toast.promise(promise, {
      loading: isEdicao ? "Atualizando conta..." : "Cadastrando conta...",
      success: isEdicao ? "Conta atualizada ✅" : "Conta cadastrada ✅",
      error: (err) => err.message,
    });

    await promise;
    onSuccess();
    onClose();
  }

  return (
    <div className="modalUsuarioOverlay">
      <div className="modalUsuarioCard">
        <h2>{conta ? "Editar Conta Bancária" : "Cadastrar Conta Bancária"}</h2>

        <label>Banco</label>
        <select value={banco} onChange={(e) => setBanco(e.target.value)}>
          <option value="">Selecione o banco</option>

          {/* Bancos tradicionais e digitais (A-Z) */}
          <option value="Banco BMG">Banco BMG</option>
          <option value="Banco Bradesco">Banco Bradesco</option>
          <option value="Banco BTG">Banco BTG</option>
          <option value="Banco C6">Banco C6</option>
          <option value="Banco do Brasil">Banco do Brasil</option>
          <option value="Banco Inter">Banco Inter</option>
          <option value="Banco PAN">Banco PAN</option>
          <option value="Banco Safra">Banco Safra</option>
          <option value="Banco Santander">Banco Santander</option>
          <option value="Banco Sicredi">Banco Sicredi</option>
          <option value="Banco Sicoob">Banco Sicoob</option>
          <option value="Banco Votorantim">Banco Votorantim</option>
          <option value="Banese">Banese</option>
          <option value="Banrisul">Banrisul</option>
          <option value="Itaú Unibanco">Itaú Unibanco</option>
          <option value="Nubank">Nubank</option>
          <option value="Next">Next</option>
          <option value="Original">Banco Original</option>
          <option value="PagBank (PagSeguro)">PagBank (PagSeguro)</option>
          <option value="PICPAY">PicPay</option>
          <option value="Stone">Stone</option>
          <option value="Tangerino">Tangerino</option>
          <option value="Safra">Safra</option>
        </select>

        <label>Agência</label>
        <input value={agencia} onChange={(e) => setAgencia(e.target.value)} />

        <label>Conta</label>
        <input
          value={numeroConta}
          onChange={(e) => setNumeroConta(e.target.value)}
        />

        <div className="modalUsuarioActions">
          <button onClick={onClose} className="btnUsuarioCancel">
            Cancelar
          </button>
          <button onClick={salvar} className="btnUsuarioSave">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
