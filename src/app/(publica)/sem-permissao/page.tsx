"use client";

import { useRouter } from "next/navigation";

export default function SemPermissao() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "40vh",
        gap: "16px",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <span style={{ fontSize: "48px" }}>🚫</span>
      <h2 style={{ fontSize: "22px", fontWeight: "bold" }}>Acesso negado</h2>
      <p style={{ color: "#666", maxWidth: "320px" }}>
        Você não tem permissão para acessar essa área. Entre em contato com o
        administrador caso acredite que isso é um erro.
      </p>
      <button
        onClick={() => router.push("/select-system")}
        style={{
          padding: "10px 24px",
          borderRadius: "8px",
          background: "#0a756c",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Voltar ao início
      </button>
    </div>
  );
}
