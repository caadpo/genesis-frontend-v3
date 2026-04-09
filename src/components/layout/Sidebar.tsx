"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiLogOut,
  FiSearch,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

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

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      {/* TOPO */}
      <div className="sidebar-top">
        <button className="icon-btn menu-btn" onClick={() => setOpen(!open)}>
          <FiMenu />
          {open && <span>Menu</span>}
        </button>

        <Link href="/home" className="icon-btn">
          <FiHome />
          {open && <span>Home</span>}
        </Link>

        <Link href="/usuarios" className="icon-btn">
          <FiUsers />
          {open && <span>Usuários</span>}
        </Link>

        <Link href="/usuarios" className="icon-btn">
          <FiUsers />
          {open && <span>Usuários</span>}
        </Link>

        <Link href="/buscar" className="icon-btn">
          <FiSearch />
          {open && <span>Pesquisar</span>}
        </Link>

        <Link onClick={handleLogout} href="/handleLogout" className="icon-btn">
          <FiLogOut />
          {open && <span>Sair</span>}
        </Link>
      </div>

      {/* BOTTOM (usuário separado) */}
      <div className="sidebar-bottom user-btn">
        <Link href="/perfil" className="icon-btn">
          <FiUser />
          {open && <span>Perfil</span>}
        </Link>
      </div>
    </aside>
  );
}
