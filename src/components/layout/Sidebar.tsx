"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiUser,
  FiLayers,
  FiGrid,
  FiRefreshCcw,
  FiDollarSign,
  FiShare2,
} from "react-icons/fi";
import { FaUniversity } from "react-icons/fa";

import { useRepassesDisponiveisCount } from "@/src/hooks/useRepassesDisponiveisCount";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useVagasAbertasCount } from "@/src/hooks/useVagasAbertasCount";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const [perfilOpen, setPerfilOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  useEffect(() => {
    const onOpen = () => setPerfilOpen(true);
    const onClose = () => setPerfilOpen(false);

    window.addEventListener("perfilDrawerOpened", onOpen);
    window.addEventListener("perfilDrawerClosed", onClose);

    return () => {
      window.removeEventListener("perfilDrawerOpened", onOpen);
      window.removeEventListener("perfilDrawerClosed", onClose);
    };
  }, []);

  // dentro do componente Sidebar:
  const repassesDisponiveisCount = useRepassesDisponiveisCount();

  // Operações compartilhadas: só para o Auxiliar (typeUser 2), que é quem
  // preenche as vagas da própria OME.
  const { user } = useCurrentUser();
  const ehAuxiliar = Number(user?.typeUser) === 2;
  const vagasAbertasCount = useVagasAbertasCount(ehAuxiliar);

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      {/* TOPO */}
      <div className="sidebar-top">
        <button className="icon-btn menu-btn" onClick={() => setOpen(!open)}>
          <FiMenu />
          {open && <span>Menu</span>}
        </button>

        <Link
          href="/select-system"
          className={`icon-btn ${isActive("/select-system") ? "active" : ""}`}
        >
          <FiHome />
          {open && <span>Home</span>}
        </Link>

        <Link
          href="/pjes"
          className={`icon-btn ${isActive("/pjes") ? "active" : ""}`}
        >
          <FiLayers />
          {open && <span>Pjes</span>}
        </Link>

        <Link
          href="/diarias"
          className={`icon-btn ${isActive("/diaria") ? "active" : ""}`}
        >
          <FiGrid />
          {open && <span>Diárias</span>}
        </Link>

        <Link
          href="/usuarios"
          className={`icon-btn ${isActive("/usuarios") ? "active" : ""}`}
        >
          <FiUsers />
          {open && <span>Usuarios</span>}
        </Link>

        <Link
          href="/operacoes"
          className={`icon-btn ${isActive("/operacoes") ? "active" : ""}`}
        >
          <FaUniversity />
          {open && <span>Escalas</span>}
        </Link>

        {ehAuxiliar && (
          <Link
            href="/compartilhadas"
            className={`icon-btn ${isActive("/compartilhadas") ? "active" : ""}`}
          >
            <div className="icon-wrapper">
              <FiShare2 />
              {vagasAbertasCount > 0 && (
                <span className="icon-badge">
                  {vagasAbertasCount > 99 ? "99+" : vagasAbertasCount}
                </span>
              )}
            </div>
            {open && <span>Compartilhadas</span>}
          </Link>
        )}

        <Link
          href="/repasses"
          className={`icon-btn ${isActive("/repasses") ? "active" : ""}`}
        >
          <div className="icon-wrapper">
            <FiRefreshCcw />
            {repassesDisponiveisCount > 0 && (
              <span className="icon-badge">
                {repassesDisponiveisCount > 99
                  ? "99+"
                  : repassesDisponiveisCount}
              </span>
            )}
          </div>
          {open && <span>Repasse</span>}
        </Link>
      </div>

      {/* BOTTOM (usuário separado) */}
      <div className="sidebar-bottom user-btn">
        <Link
          href="/pagamentos"
          className={`icon-btn ${isActive("/pagamentos") ? "active" : ""}`}
        >
          <FiDollarSign />
          {open && <span>Pagamentos</span>}
        </Link>
        <button
          className={`icon-btn ${perfilOpen ? "active" : ""}`}
          onClick={() => window.dispatchEvent(new Event("openPerfilDrawer"))}
        >
          <FiUser />
          {open && <span>Perfil</span>}
        </button>
      </div>
    </aside>
  );
}
