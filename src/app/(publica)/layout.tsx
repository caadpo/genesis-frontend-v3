import "../globals.css";
import "./layout.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-bg_login">
      {/* Círculos decorativos de fundo */}
      <div className="bg-circle-left_login" />
      <div className="bg-circle-right_login" />

      {/* Barra superior */}
      <div className="top-bar_login">
        <span>Polícia Militar de Pernambuco</span>
      </div>

      {/* Sub-barra */}
      <div className="sub-bar_login">
        <span>
          Diretoria de Planejamento e Operações&nbsp;&nbsp;|&nbsp;&nbsp;DPO
        </span>
      </div>

      {/* Conteúdo central */}
      <main className="main-container_login">
        <div className="card_login">
          {/* Cabeçalho do card */}
          <div className="card-header_login">
            <div className="logo-ring_login">
              <img
                src="/logo_dpo.png"
                alt="Logo DPO"
                className="logo-img_login"
              />
            </div>
            <h1 className="card-title_login">GÊNESIS 1.1</h1>
            <span className="card-badge_login">PMPE · DPO</span>
          </div>

          {/* Formulário (children = page.tsx) */}
          {children}
        </div>
      </main>
    </div>
  );
}
