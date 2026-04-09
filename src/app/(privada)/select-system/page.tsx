"use client";

import "./page.css";
import { useRouter } from "next/navigation";
import { FaFileAlt, FaMoneyBillWave } from "react-icons/fa";
import { useEffect, useState } from "react";
import { FaUniversity } from "react-icons/fa";
import { GiSteeringWheel } from "react-icons/gi";
import { MdLocationOn } from "react-icons/md";
import { FaCar } from "react-icons/fa";

export default function SelectSystem() {
  const router = useRouter();
  const [user, setUser] = useState<{ nomeGuerra: string } | null>(null);

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userData="));

    if (cookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(cookie.split("=")[1]));
        setUser(userData);
      } catch (err) {
        console.error("Erro ao decodificar userData:", err);
      }
    }
  }, []);

  return (
    <div className="container">
      {/* <h2>Bem-vindo{user ? `, ${user.nomeGuerra}` : ""}!</h2> */}
      {/* inicio escolha do sistema */}
      <div className="div-itens">
        <div className="titulo">
          <span>SISTEMAS</span>
          <div className="badge">2</div>
        </div>
        <div className="topArea">
          <button
            className="card card-blue"
            onClick={() => router.push("/pjes")}
          >
            <div className="left">
              <FaFileAlt className="icon" />
              <span>PJES</span>
            </div>
          </button>

          <button
            className="card card-green"
            onClick={() => router.push("/diarias")}
          >
            <div className="left">
              <FaMoneyBillWave className="icon" />
              <span>DIARIAS</span>
            </div>
          </button>
        </div>
      </div>
      {/* fim escolha do sistema */}

      {/* minhas escalas */}
      <div className="div-itens">
        <div className="header-escalas">
          <div className="titulo">
            <span>MINHAS ESCALAS</span>
            <div className="badge">1</div>
          </div>

          <span
            className="ver-todas"
            onClick={() => router.push("/minhasescalas")}
          >
            Ver todas &gt;
          </span>
        </div>

        <div style={{ display: "flex" }}>
          {/* primieira escala */}
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
              <span>
                <FaUniversity /> 1º BPM
              </span>
              <span>
                <GiSteeringWheel /> MOT
              </span>
              <span>
                <FaCar /> VTR: 1190023
              </span>
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
              <span>
                <FaUniversity /> 1º BPM
              </span>
              <span>
                <GiSteeringWheel /> MOT
              </span>
              <span>
                <FaCar /> VTR: 1190023
              </span>
            </div>
          </div>
          {/* segunda escala */}
        </div>
      </div>
      {/* minhas escalas */}

      {/* pagamentos */}
      <div className="div-itens">
        <span style={{ color: "#a8a4a4" }}>Pagamentos</span>
        <div className="pagamentos">
          <div onClick={() => router.push("/pagamentos")}>
            <div className="left">
              <FaFileAlt className="icon" />
              <span>PJES</span>
            </div>
          </div>
        </div>
      </div>
      {/* paramentos */}
    </div>
  );
}
