"use client";

import { usePathname } from "next/navigation";
import { FaDesktop, FaLongArrowAltRight } from "react-icons/fa";

const SECOES = [
  "DIM",
  "DIRESP",
  "DINTER I",
  "DINTER II",
  "ACG",
  "AG",
  "CREED",
  "DAS",
  "DASDH",
  "DS",
];

export default function CardHeader() {
  const pathname = usePathname();
  const isSolicitacao = pathname?.startsWith("/solicitar-acesso") ?? false;

  const brand = (
    <>
      <div
        className={`logo-ring_login ${isSolicitacao ? "hs-logo-ring_login" : ""}`}
      >
        <img src="/logo_dpo.png" alt="Logo DPO" className="logo-img_login" />
      </div>
      <h1
        className={`card-title_login ${isSolicitacao ? "hs-title_login" : ""}`}
      >
        GÊNESIS 1.1
      </h1>
      <span
        className={`card-badge_login ${isSolicitacao ? "hs-badge_login" : ""}`}
      >
        PMPE · DPO
      </span>
    </>
  );

  // Cabeçalho padrão (login)
  if (!isSolicitacao) {
    return <div className="card-header_login">{brand}</div>;
  }

  // Cabeçalho da tela de solicitação de acesso ou redefinição de senha
  return (
    <div className="card-header_login hs-header_login">
      <div className="hs-brand_login">{brand}</div>

      <div className="hs-divider_login" />

      <ul className="hs-list_login">
        {SECOES.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <FaLongArrowAltRight className="hs-arrow_login" />

      <div className="hs-target_login">
        <strong>SJES</strong>
        <FaDesktop className="hs-target-icon_login" />
        <span>
          Sua seção
          <br />
          de PJES
        </span>
      </div>
    </div>
  );
}
