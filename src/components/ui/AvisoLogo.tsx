"use client";

import { useState } from "react";
import { FaComment } from "react-icons/fa";

export interface Aviso {
  id: number;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  dataHora: string; // ISO
}

// "06/10/2026 às 16:40"
export function formatarDataHoraAviso(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR");
  const hora = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${data} às ${hora}`;
}

// Mostra a imagem do aviso; sem imagem (ou se falhar) mostra FaComment
export function AvisoLogo({
  src,
  nome,
  size = 36,
}: {
  src?: string | null;
  nome: string;
  size?: number;
}) {
  const [erro, setErro] = useState(false);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: "#f4f6f4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {!src || erro ? (
        <FaComment size={Math.round(size * 0.5)} color="#8a8f8a" />
      ) : (
        <img
          src={src}
          alt={nome}
          onError={() => setErro(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: 4,
          }}
        />
      )}
    </div>
  );
}
