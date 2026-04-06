"use client";

import "./page.css";
import { useRouter } from "next/navigation";
import { FaFileAlt, FaMoneyBillWave } from "react-icons/fa";

export default function SelectSystem() {
  const router = useRouter();

  return (
    <div className="container">
      {/* inicio escolha do sistema */}
      <div className="div-itens">
        <span style={{ color: "#a8a4a4" }}>Sistemas</span>
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
        <span style={{ color: "#a8a4a4" }}>Minhas escalas</span>
        <div className="minhaescala">
          <div onClick={() => router.push("/minhasescalas")}>
            <div className="left">
              <FaFileAlt className="icon" />
              <span>PJES</span>
            </div>
          </div>
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
