"use client";
import { useRouter } from "next/navigation";
import { FaUniversity } from "react-icons/fa";
import { GiSteeringWheel } from "react-icons/gi";
import { FaCar } from "react-icons/fa";
import { FiLayers, FiGrid } from "react-icons/fi";

export default function SelectSystem() {
  const router = useRouter();

  return (
    <div className="container">
      {/* inicio escolha do sistema */}
      <div className="div-itens">
        <div className="titulo">
          <span>SISTEMAS</span>
          <div className="badge">2</div>
        </div>
        <div className="topArea">
          <button
            className="select-card select-card-blue"
            onClick={() => router.push("/pjes")}
          >
            <div className="left">
              <FiLayers className="icon" />
              <span style={{ fontSize: "20px" }}>PJES</span>
            </div>
            <FiLayers
              style={{ fontSize: "60px", color: "#3a60c8" }}
              className="icon"
            />
          </button>

          <button
            className="select-card select-card-green"
            onClick={() => router.push("/diarias")}
          >
            <div className="left">
              <FiGrid className="icon" />
              <span style={{ fontSize: "20px" }}>DIÁRIAS</span>
            </div>
            <FiGrid
              style={{ fontSize: "60px", color: "#0db988" }}
              className="icon"
            />
          </button>
        </div>
      </div>
      {/* fim escolha do sistema */}

      {/* minhas escalas */}
      <div className="div-itens">
        <div className="header-escalas">
          <div className="titulo">
            <span>MINHAS ESCALAS</span>
            <div className="badge">2</div>
          </div>

          <span
            className="ver-todas"
            onClick={() => router.push("/minhas-escalas")}
          >
            Ver todas &gt;
          </span>
        </div>

        <div style={{ display: "flex" }}>
          {/* primieira escala */}
          <div
            className="card-escala"
            onClick={() => router.push("/minhas-escalas")}
          >
            <div className="top-card">
              <div className="dia-hora">🌙 Terça, 18:30</div>
              <div className="data">14 Abril</div>
            </div>

            <div className="nome-escala">ALERTA CELULAR</div>
            <div className="tempo">Sede da OME</div>

            <div className="avatares">
              <img src="/1157590.png" />
              <img src="/1157590.png" />
              <img src="/1157590.png" />
              <img src="/1157590.png" />
              <div className="mais">+3</div>
            </div>

            <div className="linha" />

            <div className="rodape-card">
              <div>
                <span>
                  <FaUniversity /> BPCHOQUE
                </span>
              </div>

              <div>
                <span style={{ paddingRight: "20px" }}>
                  <GiSteeringWheel /> MOT
                </span>
                <span>
                  <FaCar /> VTR: 1190023
                </span>
              </div>
            </div>
          </div>
          {/* primieira escala */}

          {/* segunda escala */}
          <div
            className="card-escala"
            onClick={() => router.push("/minhasescalas")}
          >
            <div className="top-card">
              <div className="dia-hora">🌙 Terça, 18:30</div>
              <div className="data">14 Abril</div>
            </div>

            <div className="nome-escala">ALERTA CELULAR</div>
            <div className="tempo">Sede da OME</div>

            <div className="avatares">
              <img src="/1157590.png" />
              <img src="/1157590.png" />
              <img src="/1157590.png" />
              <img src="/1157590.png" />
              <div className="mais">+3</div>
            </div>

            <div className="linha" />

            <div className="rodape-card">
              <div>
                <span>
                  <FaUniversity /> BPCHOQUE
                </span>
              </div>

              <div>
                <span style={{ paddingRight: "20px" }}>
                  <GiSteeringWheel /> MOT
                </span>
                <span>
                  <FaCar /> VTR: 1190023
                </span>
              </div>
            </div>
          </div>
          {/* segunda escala */}
        </div>
      </div>
      {/* minhas escalas */}

      {/* inicio pagamentos */}
      <div
        style={{
          width: "100%",
          border: "solid 1px #d3d0d0",
          borderRadius: "5px",
          padding: "5px",
          height: "400px",
          overflow: "scroll",
        }}
      >
        <div className="div-itens">
          <div className="titulo">
            <span>PAGAMENTOS</span>
          </div>

          {/* primeira parte */}
          <div className="pagamentos">
            <div
              className="pay-item"
              onClick={() => router.push("/pagamentos")}
            >
              <div className="pay-left">
                <div className="pay-icon-diaria">
                  <FiGrid />
                </div>

                <div className="pay-texts">
                  <span className="pay-title">1º BIESP</span>
                  <span className="pay-sub">DIARIA | Op Magrugada Segura</span>
                </div>
              </div>

              <div className="pay-right">
                <span className="pay-badge">11:20 04/05</span>
              </div>
            </div>
          </div>

          {/* segunda parte */}
          <div className="pagamentos">
            <div
              className="pay-item"
              onClick={() => router.push("/pagamentos")}
            >
              <div className="pay-left">
                <div className="pay-icon-pjes">
                  <FiLayers />
                </div>

                <div className="pay-texts">
                  <span className="pay-title">GOVERNO</span>
                  <span className="pay-sub">PJES | Folha de Pagamento</span>
                </div>
              </div>

              <div className="pay-right">
                <span className="pay-badge">11:20 04/05</span>
              </div>
            </div>
          </div>
          {/* segunda parte */}
        </div>
      </div>
      {/* fim paramentos */}
    </div>
  );
}
