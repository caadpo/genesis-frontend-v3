"use client";

type CardItem = {
  nome: string;
  logo: string;
  destaque?: boolean;
};

const itens: CardItem[] = [
  { nome: "DPO", logo: "logo_dpo.webp", destaque: true },
  { nome: "P. ESCOLAR", logo: "pe_logo.png" },
  { nome: "CTM BRT", logo: "mobi_logo.png" },
  { nome: "ALEPE", logo: "alepe_logo.png" },
  { nome: "MPPE", logo: "mppe_logo.jpg" },
  { nome: "TJPE", logo: "tjpe_logo.png" },
  { nome: "CAMIL", logo: "camil_logo.jpg" },
  { nome: "FEDERAL", logo: "brasil_logo.png" },
  { nome: "SDS", logo: "sds_logo.png" },
  { nome: "TCE", logo: "tce_logo.png" },
  { nome: "CPRH", logo: "cprh_logo.jpg" },
];

export default function PjesPage() {
  return (
    <div className="page">
      <h1 className="title">PJES</h1>

      <div className="cardsContainer">
        {itens.map((item) => (
          <button
            key={item.nome}
            className={`card ${item.destaque ? "cardDestaque" : ""}`}
          >
            <img src={item.logo} alt={item.nome} className="logo" />
            <span className="label">{item.nome}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
