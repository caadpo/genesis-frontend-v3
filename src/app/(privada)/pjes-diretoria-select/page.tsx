"use client";

import EventoModal from "@/src/components/ui/EventoModal";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FiStar,
  FiChevronUp,
  FiUnlock,
  FiSettings,
  FiMoreVertical,
  FiPlusCircle,
} from "react-icons/fi";
import { BsCurrencyDollar } from "react-icons/bs";

type Teto = {
  id: number;
  imagemUrl: string;
  nome_verba: string;
};

type Distribuicao = {
  nome_dist: string;
  qtd_dist_of: number;
  qtd_dist_prc: number;
  diretoria: {
    nomeDiretoria: string;
  };
};

type Evento = {};

export default function PjesDiretoriaSelectPage() {
  const params = useSearchParams();

  const mes = params?.get("mes") ?? "";
  const ano = params?.get("ano") ?? "";
  const tetoId = params?.get("tetoId") ?? "";
  const diretoriaId = params?.get("diretoriaId") ?? "";

  const [tetos, setTetos] = useState<Teto[]>([]);
  const [menuAberto, setMenuAberto] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [distribuicao, setDistribuicao] = useState<Distribuicao | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [eventoAberto, setEventoAberto] = useState<number | null>(null);
  const toggleEvento = (id: number) => {
    setEventoAberto(eventoAberto === id ? null : id);
  };

  // 🔎 Busca os tetos
  useEffect(() => {
    if (!mes || !ano) return;

    fetch(`/api/tetos?sistema=PJES&mes=${mes}&ano=${ano}`)
      .then((res) => res.json())
      .then(setTetos);
  }, [mes, ano]);

  // 🔎 Busca a distribuição já filtrada
  useEffect(() => {
    if (!tetoId || !diretoriaId) return;
    fetch(`/api/distribuicao?tetoId=${tetoId}&diretoriaId=${diretoriaId}`)
      .then((r) => r.json())
      .then((data) => setDistribuicao(data[0] ?? null));
  }, [tetoId, diretoriaId]);

  // ✅ DERIVADOS (sem state!)
  const tetoSelecionado = tetos.find((t) => t.id === Number(tetoId)) ?? null;

  const outrosTetos = tetos.filter((t) => t.id !== Number(tetoId));

  const MESES = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];

  const mesAbreviado = mes ? MESES[Number(mes) - 1] : "";

  const item: React.CSSProperties = {
    padding: "10px",
    cursor: "pointer",
    fontSize: "13px",
  };

  function acao(tipo: string) {
    console.log("Ação:", tipo);
    setMenuAberto(null);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center" }}>
        <h1 className="h1DiretoriaSelect">
          PJES | {mesAbreviado} {ano}
        </h1>

        <button
          onClick={() => {
            setEditando(null); // 👈 isso aqui
            setOpenModal(true);
          }}
          className="botaoCriarEvento"
        >
          CRIAR EVENTO
        </button>
      </div>

      <div className="divDiretoriaTeto">
        {/* 🔷 Card principal */}
        <div className="divDiretoriaTetoSelecionado">
          {tetoSelecionado && (
            <div className="cardTetoSelecionado">
              {/* ESQUERDA */}
              <div className="tetoLeft">
                <img
                  src={tetoSelecionado.imagemUrl}
                  alt={tetoSelecionado.nome_verba}
                />
                <div className="nomeVerba">{tetoSelecionado.nome_verba}</div>
              </div>

              {/* DIREITA */}
              {distribuicao && (
                <div className="tetoRight">
                  <div className="nomeDiretoria">
                    {distribuicao.diretoria.nomeDiretoria} |{" "}
                    {distribuicao.nome_dist}
                  </div>

                  <div className="cotasBox">
                    <div>
                      <div>
                        <div>
                          <FiStar />
                        </div>
                        <div>OFICIAIS</div>
                      </div>
                      <strong>{distribuicao.qtd_dist_of} | 1900</strong>
                    </div>

                    <div>
                      <div>
                        <div>
                          <FiChevronUp />
                        </div>
                        <div>PRAÇAS</div>
                      </div>

                      <strong>{distribuicao.qtd_dist_prc} | 18302</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="saldoDiretoria">
                <span>Saldo</span>
                <div className="saldoDiretoriaiconeValor">
                  <div>
                    <FiStar />
                  </div>
                  <div className="saldoDiretoriaValor">2510</div>
                </div>
                <div className="saldoDiretoriaIconePrc">
                  <div>
                    <FiChevronUp />
                  </div>
                  <div className="saldoDiretoriaValor">19340</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🔷 Outros tetos */}
        <div className="divDiretoriaOutrosWrapper">
          {outrosTetos.map((teto) => (
            <div key={teto.id} className="cardTetoSecundario">
              <img src={teto.imagemUrl} alt={teto.nome_verba} />
            </div>
          ))}
        </div>
      </div>

      {/* 🔻 Próxima etapa: Eventos e Operações */}
      <div className="divDiretoriaEventoOperacaoPrincipal">
        <div className="divDiretoriaEvento">
          <div className="divTituloEvento">
            <h4>EVENTOS</h4>
          </div>
          <div className="divInputBuscarEventoEIcones">
            <div style={{ width: "50%" }}>
              <input
                className="inputBuscarEvento"
                type="text"
                placeholder="Buscar"
              />
            </div>

            <div className="divIconeCadeadoCatracaDolar">
              <div style={{ marginRight: "5px" }}>
                <FiUnlock size={15} color="green" />
              </div>
              <div className="divTtEventoAberto">250</div>

              <div style={{ marginLeft: "15px" }}>
                <FiSettings size={15} color="orange" />
              </div>
              <div style={{ textAlign: "right", color: "orange" }}>250</div>

              <div style={{ marginLeft: "15px" }}>
                <BsCurrencyDollar size={15} color="purple" />
              </div>
              <div style={{ textAlign: "right", color: "purple" }}>250</div>
            </div>
          </div>
          <div
            className="divEventoIconeItemPrincipal"
            onClick={() => toggleEvento(1)} // id fake do evento
            style={{ cursor: "pointer" }}
          >
            <div className="divEventoIconeTitleItem">
              <div>
                <BsCurrencyDollar size={30} color="purple" />
              </div>
              <div className="divEventoTitleItem">DIRESP</div>
            </div>
            <div className="divEventoDireitaItemPrincipal">
              <div>
                <div className="divEventoDireitaItemSecundario">
                  <div>BPCHOQUE</div>
                  <div className="divEventoDireitaIconesSuperior">
                    <div className="divEventoDireitaIcones">
                      <FiUnlock size={15} color="green" />
                      <FiSettings size={15} color="orange" />
                      <BsCurrencyDollar size={15} color="purple" />
                      <FiMoreVertical
                        size={15}
                        color="black"
                        style={{ cursor: "pointer" }}
                        onClick={
                          () => setMenuAberto(menuAberto === 1 ? null : 1) // 1 = id fake desse card
                        }
                      />
                      {menuAberto === 1 && (
                        <div ref={menuRef} className="dropdownMenu">
                          <div
                            className="dropdownItem"
                            onClick={() => acao("Homologar")}
                          >
                            Homologar
                          </div>
                          <div
                            className="dropdownItem"
                            onClick={() => acao("PD Concluída")}
                          >
                            PD Concluída
                          </div>
                          <div
                            className="dropdownItem"
                            onClick={() => acao("Pago")}
                          >
                            Pago
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="divEventoDireitaNomeEvento">
                  OPERAÇÃO MADRUGADA SEGURA | 1/4
                </div>
                <div className="linhaOficiaisPracas">
                  <div className="itemOficiaisPracas">Oficiais: 999 | 999</div>
                  <div className="itemOficiaisPracas direita">
                    Praças: 9999 | 9999
                  </div>
                </div>
                <div className="divEventoDireitaStatusEvento">
                  Aguardando preenchimento da escala 15/04/2026 às 18:13
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="divDiretoriaOperacao">
          {eventoAberto === 1 && (
            <div className="operacoesMobileDentroEvento">
              <div className="divTituloOperacao">
                <h4>OPERAÇÕES</h4>
              </div>
              <div className="divInputBuscarOperacaoEIcones">
                <input
                  className="inputBuscarOperacao"
                  type="text"
                  placeholder="Buscar"
                />
                <div className="divCriarOperacao">
                  <button className="botaoCriarOperacao">CRIAR OPERAÇÃO</button>
                </div>
              </div>
              <div className="tabelaOperacoes">
                <div className="tabelaHeader">
                  <div>Unidade</div>
                  <div>Operação</div>
                  <div className="acoesTabela">Of</div>
                  <div className="acoesTabela">Prç</div>
                  <div className="acoesTabela">Status</div>
                  <div>Cod Operação</div>
                  <div className="acoesTabela">Ações</div>
                </div>

                {[1, 2, 3].map((op) => (
                  <div key={op} className="tabelaLinha">
                    <div className="colOperacao">BPCHOQUE</div>
                    <div>MADRUGADA SEGURA</div>
                    <div className="acoesTabela">999 | 999</div>
                    <div className="acoesTabela">999 | 999</div>
                    <div className="statusPendente">Pendente</div>
                    <div>1234567892026</div>
                    <div className="acoesTabela">
                      <FiUnlock size={14} color="green" />
                      <FiSettings size={14} color="orange" />
                      <BsCurrencyDollar size={14} color="purple" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <EventoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditando(null);
        }}
        evento={editando}
      />
    </div>
  );
}
