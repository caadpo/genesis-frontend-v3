"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiLogOut,
  FiUser,
  FiLayers,
  FiGrid,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const [perfilOpen, setPerfilOpen] = useState(false);
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Deslogado com sucesso!"); // ✅ Toast de sucesso
        setTimeout(() => {
          window.location.href = "/login"; // redireciona após mostrar toast
        }, 1000); // 1s de delay
      } else {
        toast.error("Erro ao deslogar"); // ✅ Toast de erro
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro interno");
    }
  };
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
          className={`icon-btn ${isActive("/diarias") ? "active" : ""}`}
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

        <button className="icon-btn" onClick={handleLogout}>
          <FiLogOut />
          {open && <span>Sair</span>}
        </button>
      </div>

      {/* BOTTOM (usuário separado) */}
      <div className="sidebar-bottom user-btn">
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
