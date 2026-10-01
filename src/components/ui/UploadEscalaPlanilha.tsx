"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaFileExcel, FaSpinner } from "react-icons/fa";

type ErroLinha = { linha: number; mensagens: string[] };

export function UploadEscalaPlanilha({
  onSucesso,
}: {
  onSucesso?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<ErroLinha[] | null>(null);

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const ok = confirm(
      `Importar "${arquivo.name}"? Se houver qualquer erro em qualquer linha, nada será importado.`,
    );
    if (!ok) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setEnviando(true);
    setErros(null);
    const toastId = toast.loading("Validando e importando planilha...");

    try {
      const formData = new FormData();
      formData.append("file", arquivo);

      const response = await fetch("/api/escala/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data?.erros)) {
          setErros(data.erros);
          toast.error(
            `${data.totalErros} linha(s) com erro. Nada foi importado.`,
            {
              id: toastId,
              duration: 6000,
            },
          );
        } else {
          toast.error(data?.message || "Erro ao importar planilha", {
            id: toastId,
          });
        }
        return;
      }

      toast.success(data.mensagem, { id: toastId });
      onSucesso?.();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao importar planilha", {
        id: toastId,
      });
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={{ display: "inline-block" }}>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleArquivo}
      />
      <button
        type="button"
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          height: "32px",
          borderRadius: "8px",
          border: "1px solid #1f7a3f",
          background: enviando ? "#f5f5f5" : "#fff",
          color: enviando ? "#aaa" : "#1f7a3f",
          fontWeight: 600,
          fontSize: "13px",
          cursor: enviando ? "not-allowed" : "pointer",
        }}
      >
        {enviando ? <FaSpinner /> : <FaFileExcel />}
        {enviando ? "Importando..." : "Importar Planilha"}
      </button>

      {erros && erros.length > 0 && (
        <div
          style={{
            marginTop: 10,
            maxHeight: 260,
            overflowY: "auto",
            border: "1px solid #e53935",
            borderRadius: 8,
            padding: 10,
            background: "#fff5f5",
            fontSize: 12,
          }}
        >
          <strong>Erros encontrados (nada foi importado):</strong>
          <ul style={{ marginTop: 6, paddingLeft: 18 }}>
            {erros.map((e) => (
              <li key={e.linha}>
                Linha {e.linha}: {e.mensagens.join("; ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
