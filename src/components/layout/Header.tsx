"use client";

import { useEffect, useState } from "react";
import { getUserFromCookie } from "../../lib/getUserFromCookie";
import { FaUser } from "react-icons/fa";

type User = {
  imagemUrl?: string;
  nomeGuerra: string;
  pg: string;
  typeUser: number;
  ome?: {
    nomeOme: string;
  };
};

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = getUserFromCookie();
    setUser(userData);
  }, []);

  function getUserTypeLabel(type?: number) {
    switch (type) {
      case 1:
        return "Comum";
      case 2:
        return "Auxiliar";
      case 3:
        return "Diretor";
      case 4:
        return "Estrategico";
      case 5:
        return "Financeiro";
      case 6:
        return "PD";
      case 9:
        return "Técnico";
      case 10:
        return "Master";
      default:
        return "Usuário";
    }
  }

  return (
    <header className="header">
      <img src="/logo_dpo.webp" alt="Logo do Sistema" className="logo_layout" />

      <h1 className="header-title">
        GENESIS {user?.ome?.nomeOme ? `| ${user.ome.nomeOme}` : "| ..."}
      </h1>

      {user && (
        <div
          onClick={() => window.dispatchEvent(new Event("openPerfilDrawer"))}
          className="user-info"
        >
          {user.imagemUrl ? (
            <img src={user.imagemUrl} alt="Usuário" className="user-avatar" />
          ) : (
            <div className="user-avatar user-avatar-icon">
              <FaUser />
            </div>
          )}

          <div className="user-text">
            <strong>
              {user.pg} {user.nomeGuerra}
            </strong>
            <span>{getUserTypeLabel(user.typeUser)}</span>
          </div>
        </div>
      )}
    </header>
  );
}
