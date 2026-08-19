"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaBarcode, FaUserTag, FaPhone } from "react-icons/fa";
import { FiSearch, FiChevronLeft } from "react-icons/fi";
import "./page.css";

// ─── Types ──────────────────────────────────────────────────────────────

type UsuarioEspecial = {
  id: number;
  imagemUrl?: string;
  mat: string;
  phone?: string;
  ativo?: boolean;
  typeUser: number;
  pg: string;
  nomeGuerra: string;
  ome?: { id: number; nomeOme: string };
};

// ─── Helpers ────────────────────────────────────────────────────────────

const TYPE_USER_LABEL: Record<number, string> = {
  1: "Comum",
  2: "Auxiliar",
  3: "Diretor",
  4: "Estratégico",
  5: "Financeiro",
  6: "PD",
  7: "Gestor de Verba",
  9: "Técnico",
  10: "Master",
};

function getFuncaoLabel(typeUser: number): string {
  return TYPE_USER_LABEL[typeUser] ?? "—";
}

// ─── Sub-componente ─────────────────────────────────────────────────────

function AvatarUsuario({
  imagemUrl,
  nome,
}: {
  imagemUrl?: string;
  nome: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (!imagemUrl || imgError) {
    return (
      <div className="usr-avatar usr-avatar-fallback">
        <FaUser size={22} />
      </div>
    );
  }

  return (
    <div className="usr-avatar">
      <img src={imagemUrl} alt={nome} onError={() => setImgError(true)} />
    </div>
  );
}

// ─── Página ─────────────────────────────────────────────────────────────

export default function AuxiliaresPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<UsuarioEspecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    fetch("/api/user/especiais", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false));
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;

    return usuarios.filter((u) => {
      const nomeGuerra = u.nomeGuerra?.toLowerCase() ?? "";
      const nomeOme = u.ome?.nomeOme?.toLowerCase() ?? "";
      const funcao = getFuncaoLabel(u.typeUser).toLowerCase();

      return (
        nomeGuerra.includes(termo) ||
        nomeOme.includes(termo) ||
        funcao.includes(termo)
      );
    });
  }, [busca, usuarios]);

  return (
    <div className="usr-container">
      <div className="usr-header">
        <button
          className="usr-voltar"
          onClick={() => router.back()}
          aria-label="Voltar"
        >
          <FiChevronLeft size={20} />
        </button>
        <h1 className="usr-titulo">AUXILIARES DAS OMES</h1>
      </div>

      <div className="usr-busca-wrapper">
        <FiSearch className="usr-busca-icon" size={16} />
        <input
          className="usr-busca-input"
          type="text"
          placeholder="Buscar por nome, OME ou função..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {loading && <p className="usr-loading">Carregando...</p>}

      {!loading && usuariosFiltrados.length === 0 && (
        <p className="usr-vazio">Nenhum usuário encontrado.</p>
      )}

      <div className="usr-lista">
        {usuariosFiltrados.map((u) => (
          <div key={u.id} className="usr-card">
            <AvatarUsuario imagemUrl={u.imagemUrl} nome={u.nomeGuerra} />

            <div className="usr-info">
              <div className="usr-nome">
                {u.pg} {u.nomeGuerra} {u.ome?.nomeOme}
              </div>

              <div className="usr-meta">
                <span className="usr-meta-item">
                  <FaBarcode size={12} /> {u.mat}
                </span>
                <span className="usr-meta-item">
                  <FaUserTag size={12} /> {getFuncaoLabel(u.typeUser)}
                </span>
                {u.phone && (
                  <span className="usr-meta-item">
                    <FaPhone size={12} /> {u.phone}
                  </span>
                )}
              </div>
            </div>

            <div className={`usr-status ${u.ativo ? "ativo" : "inativo"}`}>
              <span className="usr-status-dot" />
              <span className="usr-status-label">
                {u.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
