"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useApi } from "@/src/hooks/useApi";
import { FiChevronUp, FiStar } from "react-icons/fi";
import {
  FaBarcode,
  FaCar,
  FaDownload,
  FaEdit,
  FaPhone,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { FaTriangleExclamation } from "react-icons/fa6";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Teto = { id: number; imagemUrl: string; nome_verba: string };
type Evento = { id: number; nome_evento: string; teto?: Teto };
type Operacao = {
  id: number;
  nome_operacao: string;
  qtd_oficiais_oper: number;
  qtd_pracas_oper: number;
  cod_op: string;
  ome: { nomeOme: string };
  evento?: Evento;
};

type Usuario = {
  id: number;
  imagemUrl: string;
  pg: string;
  nomeGuerra: string;
  phone: string;
  cpf?: string;
  nunfunc: string;
  nunvinc: string;
  situacao: string;
  tipo: string;
  ome?: { nomeOme: string };
  conta?: { banco: string; agencia: string; conta: string };
};

type Viatura = {
  id: number;
  patrimonio: string;
  statusVtr: "DISPONIVEL" | "INDISPONIVEL";
};

type Escala = {
  id: number;
  sistema: string;
  mat: string;
  pg_escala: string;
  tipo_escala: string;
  nome_escala: string;
  nomeome_escala: string;
  cpf_escala: number;
  phone_escala?: string;
  banco_escala: string;
  agencia_escala: string;
  conta_escala: string;
  dataInicio: string;
  horaInicio: string;
  horaFim: string;
  cota_escala: number;
  localApresentacao: string;
  funcao: string;
  situacao: string;
  anotacoes?: string;
  usuarioId: number;
  operacaoId: number;
  viaturaId?: number | null;
  viatura?: Viatura | null; // ✅ objeto, não string
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function PjesEscalasPage() {
  const params = useSearchParams();
  const mes = params?.get("mes") ?? "";
  const ano = params?.get("ano") ?? "";
  const tetoId = Number(params?.get("tetoId"));
  const operacaoId = Number(params?.get("operacaoId"));
  const [editandoEscala, setEditandoEscala] = useState<Escala | null>(null);

  // ─── Constantes PJES ────────────────────────────────────────────────────────
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
  // ─── Funções Utilitárias ─────────────────────────────────────────────────────
  const formatarCPF = (cpf: string | number): string => {
    const cpfStr = String(cpf).replace(/\D/g, "").padStart(11, "0");
    return cpfStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatarData = (data: string): string => {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const formatarTelefone = (telefone: string | undefined): string => {
    if (!telefone) return "-";
    const tel = String(telefone).replace(/\D/g, "");
    if (tel.length === 11) {
      return tel.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (tel.length === 10) {
      return tel.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return telefone;
  };
  // ─── API ─────────────────────────────────────────────────────────────────────
  const { data: tetos } = useApi<Teto[]>(
    mes && ano ? `/api/tetos?sistema=PJES&mes=${mes}&ano=${ano}` : "",
    [mes, ano],
  );
  const {
    data: operacao,
    loading: loadingOperacao,
    error: operacaoError,
  } = useApi<Operacao>(operacaoId ? `/api/operacao/${operacaoId}` : "", [
    operacaoId,
  ]);

  const teto = tetos?.find((t) => t.id === tetoId);
  const tetoReferencia = operacao?.evento?.teto || teto;

  const [matricula, setMatricula] = useState("");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [buscaUsuarioError, setBuscaUsuarioError] = useState<string | null>(
    null,
  );
  const [selectedCargo, setSelectedCargo] = useState("");
  const [selectedViatura, setSelectedViatura] = useState<number | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [localApresentacao, setLocalApresentacao] = useState("");
  const [situacao, setSituacao] = useState("");
  const [anotacoes, setAnotacoes] = useState("");
  const [searchText, setSearchText] = useState("");
  const [tabelaEscalas, setTabelaEscalas] = useState<Escala[]>([]);
  const isEditandoRef = useRef(false);

  const { data: escalasFromApi } = useApi<Escala[]>(
    operacaoId ? `/api/escala?operacaoId=${operacaoId}` : "",
    [operacaoId],
  );

  const { data: viaturas } = useApi<Viatura[]>("/api/viatura", []);

  const SISTEMA = "PJES";
  const minDate =
    mes && ano ? `${ano}-${String(Number(mes)).padStart(2, "0")}-01` : "";
  const maxDate = mes && ano ? new Date(Number(ano), Number(mes), 0) : null;
  const maxDateStr =
    maxDate && ano
      ? `${ano}-${String(Number(mes)).padStart(2, "0")}-${String(
          maxDate.getDate(),
        ).padStart(2, "0")}`
      : "";
  const funcao = selectedCargo ? `${selectedCargo} - ${selectedViatura}` : "";
  const cotaEscala = horaInicio && horaFim && horaInicio === horaFim ? 2 : 1;
  const cotasUsadas = tabelaEscalas
    .filter((e) => e.tipo_escala === usuario?.tipo)
    .reduce((sum, e) => sum + e.cota_escala, 0);
  const totalCotasOficiais = tabelaEscalas
    .filter((e) => e.tipo_escala === "O")
    .reduce((sum, e) => sum + e.cota_escala, 0);
  const totalCotasPracas = tabelaEscalas
    .filter((e) => e.tipo_escala === "P")
    .reduce((sum, e) => sum + e.cota_escala, 0);
  const tetoDisponivel =
    usuario?.tipo === "O"
      ? (operacao?.qtd_oficiais_oper ?? 0) - cotasUsadas
      : (operacao?.qtd_pracas_oper ?? 0) - cotasUsadas;
  const tetoPermiteAdicionar = tetoDisponivel >= cotaEscala;
  // ✅ substitua a definição atual de canAddEscala por:
  const camposObrigatoriosFaltando = (): string[] => {
    const faltando: string[] = [];
    if (!usuario && !editandoEscala) faltando.push("Matrícula");
    if (!dataInicio) faltando.push("Data de Início");
    if (!horaInicio) faltando.push("Hora de Início");
    if (!horaFim) faltando.push("Hora de Término");
    if (!localApresentacao) faltando.push("Local de Apresentação");
    if (!selectedCargo) faltando.push("Função");
    return faltando;
  };

  const canAddEscala =
    (!!usuario || !!editandoEscala) &&
    !!dataInicio &&
    !!horaInicio &&
    !!horaFim &&
    !!localApresentacao &&
    !!selectedCargo &&
    !loadingUsuario; // ✅ desabilitado enquanto busca

  const filteredEscalas = tabelaEscalas.filter((escala) => {
    if (!searchText.trim()) return true;
    const term = searchText.toLowerCase();
    return [
      escala.id,
      escala.mat,
      escala.usuarioId,
      escala.operacaoId,
      escala.pg_escala,
      escala.nome_escala,
      escala.cpf_escala,
      escala.phone_escala,
      escala.banco_escala,
      escala.agencia_escala,
      escala.conta_escala,
      escala.dataInicio,
      escala.horaInicio,
      escala.horaFim,
      escala.localApresentacao,
      escala.funcao,
      escala.situacao,
      escala.anotacoes || "",
    ]
      .map((value) => String(value).toLowerCase())
      .some((value) => value.includes(term));
  });

  useEffect(() => {
    if (escalasFromApi) {
      setTabelaEscalas(escalasFromApi);
    }
  }, [escalasFromApi]);

  useEffect(() => {
    if (matricula.trim().length === 0) {
      setUsuario(null);
      setBuscaUsuarioError(null);
      setLocalApresentacao("");
      setSituacao("");
      return;
    }

    // ✅ não busca se tiver menos de 7 dígitos
    if (matricula.trim().length < 7) {
      setUsuario(null);
      setBuscaUsuarioError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoadingUsuario(true);
      setBuscaUsuarioError(null);

      try {
        const response = await fetch(
          `/api/user/search?q=${encodeURIComponent(matricula)}`,
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Matricula não existe ou está errada");
        }

        const data = await response.json();
        const found = Array.isArray(data) ? data[0] : data;

        if (!found || !found.id) {
          setUsuario(null);
          setBuscaUsuarioError("Usuário não encontrado");
          setLocalApresentacao(""); // ✅ limpa se não encontrou
          setSituacao("");
          return;
        }

        setUsuario(found);
        if (!isEditandoRef.current) {
          // ✅ só preenche automaticamente se NÃO for edição
          setLocalApresentacao(found.localApresentacao ?? "");
          setSituacao(found.situacao ?? "");
        }
        isEditandoRef.current = false;
      } catch (error: any) {
        setUsuario(null);
        setBuscaUsuarioError(
          error?.message || "Matricula não existe ou está errada",
        );
        setLocalApresentacao("");
        setSituacao("");
      } finally {
        setLoadingUsuario(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [matricula]);
  async function handleAddEscala() {
    // ✅ validação com toast PRIMEIRO — antes de qualquer return silencioso
    const faltando = camposObrigatoriosFaltando();
    console.log("faltando:", faltando);
    console.log("usuario:", usuario);
    console.log("editandoEscala:", editandoEscala);
    console.log("dataInicio:", dataInicio);
    console.log("horaInicio:", horaInicio);
    console.log("horaFim:", horaFim);
    console.log("localApresentacao:", localApresentacao);
    console.log("selectedCargo:", selectedCargo);
    if (faltando.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${faltando.join(", ")}`);
      return;
    }

    // ✅ só depois os guards técnicos (sem toast pois não deveriam ocorrer normalmente)
    if (!operacaoId || !operacao) return;

    const isEdicao = !!editandoEscala;
    const url = isEdicao ? `/api/escala/${editandoEscala.id}` : "/api/escala";
    const method = isEdicao ? "PATCH" : "POST";

    const body = isEdicao
      ? {
          dataInicio,
          horaInicio,
          horaFim,
          localApresentacao,
          funcao: selectedCargo, // ✅ só a função, viatura vai separada
          situacao,
          anotacoes,
          viaturaId: selectedViatura ?? null, // ✅ null remove a viatura
          ...(usuario && { usuarioId: usuario.id }),
        }
      : {
          sistema: SISTEMA,
          operacaoId,
          usuarioId: usuario!.id,
          dataInicio,
          horaInicio,
          horaFim,
          localApresentacao,
          funcao: selectedCargo, // ✅ só a função
          situacao,
          anotacoes,
          viaturaId: selectedViatura ?? undefined, // ✅ sem viatura = omite
        };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Erro ao salvar escala",
        );
      }

      if (isEdicao) {
        setTabelaEscalas((prev) =>
          prev.map((e) => (e.id === editandoEscala.id ? data : e)),
        );
        toast.success("Escala atualizada com sucesso!");
        setEditandoEscala(null);
        setMatricula("");
        setDataInicio("");
        setHoraInicio("");
        setHoraFim("");
        setSelectedCargo("");
        setSelectedViatura(null);
        setLocalApresentacao("");
        setSituacao("");
        setAnotacoes("");
      } else {
        setTabelaEscalas((prev) => [data, ...prev]);
        toast.success("Escala adicionada com sucesso!");
        setMatricula("");
      }
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível salvar a escala");
    }
  }

  async function handleExcluirEscala(id: number) {
    const ok = confirm("Deseja realmente excluir este registro?");
    if (!ok) return;

    try {
      const response = await fetch(`/api/escala/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || "Erro ao excluir");
      }

      setTabelaEscalas((prev) => prev.filter((e) => e.id !== id));
      toast.success("Escala excluída com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível excluir");
    }
  }

  function handleEditarEscala(escala: Escala) {
    isEditandoRef.current = true;
    setEditandoEscala(escala);
    setMatricula(String(escala.mat));
    setDataInicio(escala.dataInicio);
    setHoraInicio(escala.horaInicio);
    setHoraFim(escala.horaFim);
    setLocalApresentacao(escala.localApresentacao);
    setSituacao(escala.situacao);
    setAnotacoes(escala.anotacoes ?? "");
    setSelectedCargo(escala.funcao);
    setSelectedViatura(escala.viaturaId ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="page" style={{ overflow: "hidden" }}>
      <div style={{ width: "70%" }}>
        <h1 className="h1PjesEscalas">
          PJES | {mesAbreviado} {ano}
        </h1>
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
        }}
      >
        {/* inicio Card Policial Escalado */}
        <div className="divPolicialEscalado">
          <div className="divPolicialSelecionado">
            <div className="cardPolicialSelecionado">
              {/* ESQUERDA */}
              <div className="policialLeft">
                <div className="divImgInoutMat">
                  <div className="usuarioImgEscala">
                    {!matricula ? (
                      <FaUser className="usuarioIcon" />
                    ) : loadingUsuario ? (
                      <FaUser className="usuarioIcon" />
                    ) : usuario?.imagemUrl ? (
                      <img
                        src={usuario.imagemUrl}
                        alt="Usuário"
                        className="usuarioImgEscala"
                      />
                    ) : (
                      <FaUser className="usuarioIcon" />
                    )}
                  </div>
                  <div className="matpolicial">
                    <input
                      type="text"
                      className="inputDadosEscala"
                      placeholder="matricula"
                      value={matricula}
                      onChange={(e) =>
                        setMatricula(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                </div>
                <div
                  style={{ fontSize: "11px", width: "100%", marginTop: "10px" }}
                >
                  {loadingUsuario && <div>Buscando usuário...</div>}
                  {!loadingUsuario && usuario && (
                    <>
                      <div>
                        <strong>
                          <FaUser /> {usuario.pg} {usuario.nomeGuerra}{" "}
                          {usuario.ome?.nomeOme ?? ""}
                        </strong>
                      </div>
                      <div>
                        <FaPhone /> {usuario.phone || "Telefone não informado"}
                      </div>
                      <div>
                        <FaBarcode /> {usuario.nunfunc} | {usuario.nunvinc}
                      </div>

                      <div>
                        <FaTriangleExclamation />{" "}
                        <strong>{usuario.situacao}</strong>
                      </div>
                      <div>
                        <strong>Banco:</strong> {usuario.conta?.banco || "-"}
                      </div>
                      <div>
                        <strong>Ag:</strong> {usuario.conta?.agencia || "-"}
                      </div>
                      <div>
                        <strong>Conta:</strong> {usuario.conta?.conta || "-"}
                      </div>
                    </>
                  )}
                  {!loadingUsuario && !usuario && (
                    <div style={{ color: "#555" }}>
                      Digite a matrícula para carregar o usuário.
                    </div>
                  )}
                  {buscaUsuarioError && (
                    <div style={{ color: "red", marginTop: "4px" }}>
                      {buscaUsuarioError}
                    </div>
                  )}
                </div>
              </div>

              {/* DIREITA */}
              <div className="policialRight">
                <div style={{ fontSize: "12px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", width: "100%" }}>
                    <div className="divDadosEscala">
                      <span className="labelDadosEscala">Data Inicio:</span>
                      <input
                        className="inputDadosEscala"
                        style={{ width: "100px", padding: "4px" }}
                        type="date"
                        value={dataInicio}
                        min={minDate}
                        max={maxDateStr}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            minDate &&
                            maxDateStr &&
                            (value < minDate || value > maxDateStr)
                          ) {
                            return;
                          }
                          setDataInicio(value);
                        }}
                      />
                    </div>
                    <div className="divDadosEscala">
                      <span className="labelDadosEscala">Inicio:</span>
                      <input
                        className="inputDadosEscala"
                        style={{ width: "80px", padding: "4px" }}
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                      />
                    </div>
                    <div className="divDadosEscala">
                      <span className="labelDadosEscala">Término:</span>
                      <input
                        className="inputDadosEscala"
                        style={{ width: "80px", padding: "4px" }}
                        type="time"
                        value={horaFim}
                        onChange={(e) => setHoraFim(e.target.value)}
                      />
                    </div>
                    <div className="divDadosEscala" style={{ width: "100%" }}>
                      <span className="labelDadosEscala">
                        Local de Apresentação:
                      </span>
                      <input
                        className="inputDadosEscala"
                        style={{ width: "100%", padding: "6px" }}
                        type="text"
                        value={localApresentacao}
                        onChange={(e) => setLocalApresentacao(e.target.value)}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "3px",
                      width: "100%",
                      textAlign: "center",
                      marginTop: "10px",
                      color: "#a8a8a8",
                      border: "solid 1px #e2dbdb",
                    }}
                  >
                    {[
                      "POG",
                      "CMT",
                      "MOT",
                      "PAT",
                      "FISCAL",
                      "MO",
                      "CMT_GD",
                      "SENT",
                      "AUX",
                      "OUTRO",
                    ].map((cargo) => (
                      <div key={cargo} className="divDadosEscala cargoItem">
                        <label style={{ cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            className="ckeckboxCargo"
                            style={{
                              transform: "scale(1.2)", // aumenta o tamanho
                              cursor: "pointer",
                            }}
                            checked={selectedCargo === cargo}
                            onChange={() =>
                              setSelectedCargo(
                                selectedCargo === cargo ? "" : cargo,
                              )
                            }
                          />
                          <br />
                          <span>{cargo}</span>
                        </label>
                      </div>
                    ))}
                    <div>
                      <select
                        style={{
                          width: "100%",
                          marginTop: "5px",
                          fontSize: "11px",
                          borderRadius: "4px",
                          border: "solid 1px #c4c0c0",
                        }}
                        value={selectedViatura ?? ""}
                        onChange={(e) =>
                          setSelectedViatura(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className="labelDadosEscala"
                      >
                        <option value="">— Sem viatura —</option>
                        {viaturas?.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.patrimonio}{" "}
                            {v.statusVtr === "INDISPONIVEL" ? "⚠️" : ""}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: "14px" }}>
                        <FaCar />
                      </span>
                    </div>
                  </div>

                  <div className="divDadosEscala" style={{ width: "100%" }}>
                    <span className="labelDadosEscala">Anotações</span>

                    <textarea
                      className="inputDadosEscala"
                      style={{
                        width: "100%",
                        padding: "6px",
                        height: "40px",
                        textAlign: "left",
                        verticalAlign: "top",
                        resize: "none",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                      }}
                      value={anotacoes}
                      onChange={(e) => setAnotacoes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* fim Card Policial Escalado */}

        <div className="divOperacao" style={{ display: "grid" }}>
          {/* inicio Card dados da Operação */}
          <div style={{ width: "100%" }}>
            <div className="divOperacaoSelecionado">
              {loadingOperacao && <div>Carregando operação...</div>}
              {operacaoError && (
                <div className="errorMessage">
                  Erro ao carregar operação: {operacaoError}
                </div>
              )}
              {operacao && (
                <div className="cardOperacaoSelecionado">
                  {/* ESQUERDA */}
                  <div className="operacaoLeft">
                    {tetoReferencia?.imagemUrl && (
                      <img
                        src={tetoReferencia.imagemUrl}
                        alt={tetoReferencia.nome_verba}
                      />
                    )}
                    <div className="nomeVerba">
                      {tetoReferencia?.nome_verba || "Teto não disponível"}
                    </div>
                  </div>

                  {/* DIREITA */}
                  <div className="operacaoRight">
                    <div className="nomeOperacao">
                      {operacao.ome?.nomeOme} | {operacao.nome_operacao} | COP:{" "}
                      {operacao.cod_op}
                    </div>

                    <div className="cotasOperacaoBox">
                      <div>
                        <div>
                          <div>
                            <FiStar />
                          </div>
                          <div>OFICIAIS</div>
                        </div>
                        <strong>
                          {operacao.qtd_oficiais_oper} | {totalCotasOficiais}
                        </strong>
                      </div>

                      <div>
                        <div>
                          <div>
                            <FiChevronUp />
                          </div>
                          <div>PRAÇAS</div>
                        </div>

                        <strong>
                          {operacao.qtd_pracas_oper} | {totalCotasPracas}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* fim Card dados da Operação */}

          {/* inicio botao adiconar policiaal */}
          <div>
            <button
              className="botaoCriarEscala"
              type="button"
              // ✅ remover disabled — a validação com toast acontece dentro do handleAddEscala
              onClick={handleAddEscala}
              style={{
                opacity: canAddEscala ? 1 : 0.5, // ✅ feedback visual de "desabilitado" sem bloquear o clique
                cursor: canAddEscala ? "pointer" : "not-allowed",
              }}
            >
              {loadingUsuario
                ? "BUSCANDO..."
                : editandoEscala
                  ? "SALVAR ALTERAÇÕES"
                  : "ADICIONAR POLICIAL"}
            </button>

            {/* ✅ Botão de cancelar edição */}
            {editandoEscala && (
              <button
                className="botaoCancelarEscala"
                type="button"
                onClick={() => {
                  setEditandoEscala(null);
                  setMatricula("");
                  setDataInicio("");
                  setHoraInicio("");
                  setHoraFim("");
                  setSelectedCargo("");
                  setSelectedViatura(null);
                  setLocalApresentacao("");
                  setSituacao("");
                  setAnotacoes("");
                }}
              >
                CANCELAR
              </button>
            )}
            <input
              className="inputBuscarEscala"
              type="text"
              placeholder="Buscar"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* fim botao adiconar policiaal */}
        </div>
      </div>

      {/* inicio escalas */}
      <div className="divPjesEscalas">
        <div
          style={{
            width: "100%",
          }}
        >
          <div className="divLogoEscalas">
            <div>
              <img
                src="/logo_pmpe.jpg"
                alt="Logo da PMPE"
                className="logoPmpeEscalas"
              />
            </div>

            <div style={{ flex: 1, textAlign: "center" }}>
              <h4 className="tituloEscala">POLICIA MILITAR DE PERNAMBUCO</h4>
              <h4 className="tituloEscala">QUARTEL DO COMANDO GERAL</h4>
              <h4 className="tituloEscala">
                DIRETORIA DE PLANEJAMENTO OPERACIONAL
              </h4>
            </div>

            <div>
              <img
                src="/logo_pe.jpg"
                alt="Logo da PMPE"
                className="logoPeEscalas"
              />
            </div>
          </div>
          <div className="divtitleEscalaServico">
            <div className="divCriarEscala">
              <h4>ESCALA DE SERVIÇO</h4>
            </div>
            <div className="divCriarEscala">
              <button style={{ padding: "3px", margin: "1px" }}>
                <FaDownload />
              </button>
              <button style={{ padding: "3px", margin: "1px" }}>
                <FaEdit />
              </button>
              <button style={{ padding: "3px", margin: "1px" }}>
                <FaTrash />
              </button>
            </div>
          </div>
          <table className="tabelaEscalas">
            <thead>
              <tr className="tabelaHeaderEscalas">
                <th>IDENTIFICAÇÃO</th>
                <th>CPF</th>
                <th>TELEFONE</th>
                <th>DADOS BANCARIOS</th>
                <th>DATA E HORA</th>
                <th>APRESENTAÇÃO</th>
                <th>FUNÇÃO</th>
                <th>VIATURA</th>
                <th>ANOTAÇÕES</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filteredEscalas.length > 0 ? (
                filteredEscalas.map((escala) => (
                  <tr key={escala.id} className="tabelaLinhaEscalas">
                    <td>
                      {escala.pg_escala} {escala.mat} {escala.nome_escala}{" "}
                      {escala.nomeome_escala} - {escala.situacao}
                    </td>
                    <td>{formatarCPF(escala.cpf_escala)}</td>
                    <td>{formatarTelefone(escala.phone_escala)}</td>
                    <td>
                      {escala.banco_escala &&
                      escala.agencia_escala &&
                      escala.conta_escala
                        ? `${escala.banco_escala}, Ag: ${escala.agencia_escala}, Conta:${escala.conta_escala}`
                        : "-"}
                    </td>
                    <td>
                      {formatarData(escala.dataInicio)} {escala.horaInicio} às{" "}
                      {escala.horaFim}
                    </td>
                    <td>{escala.localApresentacao}</td>

                    <td>{escala.funcao}</td>
                    <td>
                      {escala.viatura
                        ? `${escala.viatura.patrimonio} ${escala.viatura.statusVtr === "INDISPONIVEL" ? "⚠️" : ""}`
                        : "-"}
                    </td>
                    <td>{escala.anotacoes || "-"}</td>
                    <td className="acoesTabelaEscalas">
                      <FaEdit
                        size={16}
                        color="orange"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEditarEscala(escala)}
                      />
                      <FaTrash
                        size={16}
                        color="red"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleExcluirEscala(escala.id)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="tabelaLinhaEscalas">
                  <td
                    colSpan={10}
                    style={{ textAlign: "center", padding: "18px" }}
                  >
                    Nenhuma escala cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* fim escalas */}
    </div>
  );
}
