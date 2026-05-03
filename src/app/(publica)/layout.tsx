import "../globals.css";
import "./layout.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Barra superior */}
      <div className="top-bar">
        <span>POLICIA MILITAR DE PERNAMBUCO</span>
      </div>

      {/* Sub-barra */}
      <div className="sub-bar">
        <span>DIRETORIA DE PLANEJAMENTO E OPERAÇÕES | DPO</span>
      </div>

      {/* Conteúdo */}
      <main className="main-container">
        <div className="cardLogin">
          <img
            src="/logo_dpo.webp"
            alt="Logo do Sistema"
            className="logoLogin"
          />
          {children}
        </div>
      </main>
    </>
  );
}
