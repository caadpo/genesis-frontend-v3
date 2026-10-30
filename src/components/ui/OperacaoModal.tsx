"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type OmeOption = { id: number; nomeOme: string };

type Props = {
  open: boolean;
  onClose: () => void;
  operacao?: any;
  onCreated: () => void;
  evento: any;
};

function mesmoConjunto(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

function mensagemDeErro(data: any, padrao: string) {
  if (Array.isArray(data?.message)) return data.message.join(", ");
  return data?.message || padrao;
}

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

  // ── Compartilhamento com outras OMEs ──────────────────────────────────────
  const [omesDisponiveis, setOmesDisponiveis] = useState<OmeOption[]>([]);
  const [compartilhadas, setCompartilhadas] = useState<number[]>([]);
  const [compartilhadasIniciais, setCompartilhadasIniciais] = useState<
    number[]
  >([]);
  // Só permite regravar a lista se ela foi carregada com sucesso (evita apagar
  // o compartilhamento por engano caso a consulta tenha falhado).
  const [compartilhamentoCarregado, setCompartilhamentoCarregado] =
    useState(false);
  const [carregandoOmes, setCarregandoOmes] = useState(false);
  const [buscaOme, setBuscaOme] = useState("");

  // ✅ Evento bloqueado = status diferente de CRIADO
  const eventoBloqueado =
    !!operacao && evento?.status_evento && evento.status_evento !== "CRIADO";

  const omeDonaId: number | undefined = evento?.ome?.id;

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

  // Carrega a lista de OMEs e, ao editar, o compartilhamento atual.
  useEffect(() => {
    if (!open) return;

    let cancelado = false;
    setBuscaOme("");
    setCompartilhadas([]);
    setCompartilhadasIniciais([]);
    setCompartilhamentoCarregado(false);

    (async () => {
      setCarregandoOmes(true);
      try {
        const [resOmes, resComp] = await Promise.all([
          fetch("/api/ome"),
          operacao
            ? fetch(`/api/operacao/${operacao.id}/compartilhamento`)
            : Promise.resolve(null),
        ]);
        if (cancelado) return;

        if (resOmes.ok) setOmesDisponiveis(await resOmes.json());

        if (!operacao) {
          setCompartilhamentoCarregado(true);
        } else if (resComp && resComp.ok) {
          const lista: OmeOption[] = await resComp.json();
          const ids = lista.map((o) => o.id);
          if (cancelado) return;
          setCompartilhadas(ids);
          setCompartilhadasIniciais(ids);
          setCompartilhamentoCarregado(true);
        }
      } catch {
        // sem rede/erro: o bloco de compartilhamento fica indisponível
      } finally {
        if (!cancelado) setCarregandoOmes(false);
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, operacao?.id]);

  if (!open) return null;

  const nomeDaOme = (id: number) =>
    omesDisponiveis.find((o) => o.id === id)?.nomeOme ?? `OME ${id}`;

  const opcoesOme = omesDisponiveis.filter(
    (o) =>
      o.id !== omeDonaId &&
      !compartilhadas.includes(o.id) &&
      o.nomeOme.toLowerCase().includes(buscaOme.trim().toLowerCase()),
  );

  function adicionarOme(valor: string) {
    const id = Number(valor);
    if (!id) return;
    setCompartilhadas((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setBuscaOme("");
  }

  function removerOme(id: number) {
    setCompartilhadas((prev) => prev.filter((x) => x !== id));
  }

  async function handleSubmit() {
    const method = operacao ? "PATCH" : "POST";
    const url = operacao ? `/api/operacao/${operacao.id}` : "/api/operacao";

    const mudouCompartilhamento =
      !!operacao &&
      !eventoBloqueado &&
      compartilhamentoCarregado &&
      !mesmoConjunto(compartilhadas, compartilhadasIniciais);

    // Remover uma OME apaga as vagas ainda abertas destinadas a ela.
    if (mudouCompartilhamento) {
      const removidas = compartilhadasIniciais.filter(
        (id) => !compartilhadas.includes(id),
      );
      if (removidas.length > 0) {
        const ok = confirm(
          `Remover o compartilhamento com ${removidas
            .map(nomeDaOme)
            .join(
              ", ",
            )}? As vagas ainda em aberto destinadas a elas serão excluídas. As escalas já preenchidas permanecem.`,
        );
        if (!ok) return;
      }
    }

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
          // Na criação o compartilhamento vai junto; na edição é um PUT à parte
          ...(!operacao && compartilhadas.length > 0
            ? { omesCompartilhadas: compartilhadas }
            : {}),
        };

    const promise = fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(mensagemDeErro(data, "Erro ao salvar"));
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

    if (mudouCompartilhamento) {
      try {
        await handleSalvarCompartilhamento();
      } catch {
        // o toast já mostrou o erro; mantém a modal aberta para tentar de novo
        onCreated();
        return;
      }
    }

    onCreated();
    onClose();
  }

  async function handleSalvarCompartilhamento() {
    if (!operacao) return;

    const promise = fetch(`/api/operacao/${operacao.id}/compartilhamento`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ omeIds: compartilhadas }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          mensagemDeErro(data, "Erro ao salvar compartilhamento"),
        );
      return data;
    });

    toast.promise(promise, {
      loading: "Atualizando compartilhamento...",
      success: "Compartilhamento atualizado ✅",
      error: (err) => err.message || "Erro ao salvar compartilhamento ❌",
    });

    await promise;
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

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#eef2ff",
    color: "#3730a3",
    borderRadius: 999,
    padding: "3px 10px",
    fontSize: 12,
    fontWeight: 600,
  };

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

        {/* ── Compartilhar com outras OMEs ─────────────────────────────── */}
        <label>Compartilhar com outras OMEs (opcional)</label>

        {!eventoBloqueado ? (
          <>
            <input
              type="text"
              placeholder="Buscar OME..."
              value={buscaOme}
              onChange={(e) => setBuscaOme(e.target.value)}
              disabled={
                carregandoOmes || (!!operacao && !compartilhamentoCarregado)
              }
            />
            <select
              value=""
              onChange={(e) => adicionarOme(e.target.value)}
              disabled={
                carregandoOmes || (!!operacao && !compartilhamentoCarregado)
              }
            >
              <option value="">
                {carregandoOmes
                  ? "Carregando..."
                  : opcoesOme.length === 0
                    ? "Nenhuma OME disponível"
                    : "Selecione uma OME para adicionar"}
              </option>
              {opcoesOme.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nomeOme}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {compartilhadas.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              margin: "8px 0",
            }}
          >
            {compartilhadas.map((id) => (
              <span key={id} style={chipStyle}>
                {nomeDaOme(id)}
                {!eventoBloqueado && (
                  <button
                    type="button"
                    onClick={() => removerOme(id)}
                    title="Remover"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#3730a3",
                      cursor: "pointer",
                      fontWeight: 800,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        <small style={{ color: "#999" }}>
          As OMEs compartilhadas veem todas as escalas da operação, mas só
          preenchem as vagas que você criar para elas.
        </small>
        {operacao && !compartilhamentoCarregado && !carregandoOmes && (
          <small style={{ color: "#b45309", display: "block" }}>
            Não foi possível carregar o compartilhamento atual; ele não será
            alterado ao salvar.
          </small>
        )}

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
