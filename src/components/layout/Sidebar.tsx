"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiMap,
  FiSearch,
  FiUser,
} from "react-icons/fi";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

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

        <Link href="/sitemap" className="icon-btn">
          <FiMap />
          {open && <span>Sitemap</span>}
        </Link>

        <Link href="/buscar" className="icon-btn">
          <FiSearch />
          {open && <span>Pesquisar</span>}
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
