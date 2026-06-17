"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiPlusCircle,
  FiMoreVertical,
  FiAlertTriangle,
  FiUpload,
} from "react-icons/fi";
import {
  FaUser,
  FaPhone,
  FaDollarSign,
  FaUniversity,
  FaAddressCard,
  FaMale,
  FaBarcode,
  FaLock,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import UsuariosModal from "@/src/components/ui/UsuariosModal";
import ContaModal from "@/src/components/ui/ContaModal";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Usuario = {
  id: number;
  imagemUrl?: string;
  mat: string;
  nomeGuerra: string;
  pg: string;
  tipo: string;
  typeUser: number;
  ativo: boolean;
  phone: string;
  cpf: string;
  nunfunc: string;
  nunvinc: string;
  situacao: string;
  conta?: Conta;
  ome?: { nomeOme: string };
};

type Conta = {
  id: number;
  banco: string;
  agencia: string;
  conta: string;
  createdAt: string;
  updatedAt: string;
  createdByUser?: { mat: string };
  updatedByUser?: { mat: string };
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function UsuariosPage() {
  // ─── Estados ────────────────────────────────────────────────────────────────
  const [busca, setBusca] = useState("");
  const [usuarioResumo, setUsuarioResumo] = useState<Usuario | null>(null);
  const [usuarioDetalhe, setUsuarioDetalhe] = useState<Usuario | null>(null);
  const [usuarioAberto, setUsuarioAberto] = useState<number | null>(null);
  const [menuAberto, setMenuAberto] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState<Usuario | null>(null);
  const [contaModalOpen, setContaModalOpen] = useState(false);
  const [contaEdit, setContaEdit] = useState<Conta | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importandoSgp, setImportandoSgp] = useState(false);

  const [verEscalaAberto, setVerEscalaAberto] = useState(false);
  const [sistemaSelecionado, setSistemaSelecionado] = useState<
    "PJES" | "DIARIAS" | null
  >(null);
  const [escalasUsuario, setEscalasUsuario] = useState<any[]>([]);
  const [loadingEscalas, setLoadingEscalas] = useState(false);
  const [erroEscalas, setErroEscalas] = useState<string | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);

  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return { mes: hoje.getMonth(), ano: hoje.getFullYear() };
  });

  // ─── Ativa o primeiro acesso do usuario ──────────────────────────────────────────────
  async function toggleAtivo(usuario: Usuario) {
    const promise = fetch(`/api/user/${usuario.id}/ativo`, {
      method: "PATCH",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Erro ao alterar status");
      return data;
    });

    toast.promise(promise, {
      loading: "Alterando status...",
      success: (data) =>
        data.ativo ? "Usuário ativado ✅" : "Usuário inativado 🔒",
      error: (err) => err.message,
    });

    const data = await promise;
    setUsuarioResumo((prev) => (prev ? { ...prev, ativo: data.ativo } : prev));
  }

  // ─── Resetar senha do usuário ──────────────────────────────────────────────
  async function resetarSenha(usuario: Usuario) {
    const confirmar = confirm(
      `Deseja resetar a senha de ${usuario.nomeGuerra} para "genesis"?`,
    );
    if (!confirmar) return;

    const promise = fetch(`/api/user/${usuario.id}/reset-password`, {
      method: "PUT",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao resetar senha");
      return data;
    });

    toast.promise(promise, {
      loading: "Resetando senha...",
      success: "Senha resetada com sucesso! ✅",
      error: (err) => err.message,
    });
  }

  // ─── Excluir usuário ────────────────────────────────────────────────────────
  async function excluirUsuario(usuario: Usuario) {
    const confirmar = confirm(
      `Deseja realmente excluir o usuário ${usuario.nomeGuerra}?`,
    );
    if (!confirmar) return;

    const promise = fetch(`/api/user/${usuario.id}`, {
      method: "DELETE",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir usuário");
      return data;
    });

    toast.promise(promise, {
      loading: "Excluindo usuário...",
      success: "Usuário excluído com sucesso! 🗑️",
      error: (err) => err.message,
    });

    await promise;
    setUsuarioResumo(null);
    setUsuarioDetalhe(null);
    setUsuarioAberto(null);
    setBusca("");
  }

  // ─── Alternar expansão de usuário ───────────────────────────────────────────
  function toggleUsuario(id: number) {
    setUsuarioAberto(usuarioAberto === id ? null : id);
  }

  // ─── Recarregar dados do usuário selecionado ───────────────────────────────
  async function recarregarUsuario(id: number) {
    const [resResumo, resDetalhe] = await Promise.all([
      fetch(`/api/user/search?q=${busca}`),
      fetch(`/api/user/${id}`),
    ]);

    if (resResumo.ok) {
      const resumo = await resResumo.json();
      setUsuarioResumo(resumo);
    }

    if (resDetalhe.ok) {
      const detalhe = await resDetalhe.json();
      setUsuarioDetalhe(detalhe);
      setUsuarioAberto(id);
    }
  }

  // ─── Recarregar dados da conta do usuário ───────────────────────────────────
  async function recarregarConta(userId: number) {
    const res = await fetch(`/api/user/${userId}`);
    if (!res.ok) return;

    const data = await res.json();
    setUsuarioDetalhe(data);
  }

  // ─── Fechar menu ao clicar fora ──────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Carregar detalhes do usuário selecionado ──────────────────────────────
  useEffect(() => {
    if (!usuarioAberto) return;

    async function carregarUsuarioCompleto() {
      const res = await fetch(`/api/user/${usuarioAberto}`);
      const data = await res.json();
      setUsuarioDetalhe(data);
    }

    carregarUsuarioCompleto();
  }, [usuarioAberto]);

  // ─── Buscar usuários com debounce (mínimo 6 caracteres) ─────────────────────
  useEffect(() => {
    if (busca.length < 6) {
      setUsuarioResumo(null);
      setUsuarioDetalhe(null);
      setUsuarioAberto(null);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/search?q=${busca}`);
        if (!res.ok) return;

        const data = await res.json();
        setUsuarioResumo(data);
        setSistemaSelecionado(null);
        setEscalasUsuario([]);
        setDataSelecionada(null);
        setErroEscalas(null);
        setVerEscalaAberto(false);
        setUsuarioDetalhe(null);
        setUsuarioAberto(null);
      } catch {}
    }, 500);

    return () => clearTimeout(delay);
  }, [busca]);

  // ─── Mapeamento de tipo de usuário ────────────────────────────────────────────
  function getUserTypeLabel(type: number): string {
    const tipoMap: Record<number, string> = {
      1: "Comum",
      2: "Auxiliar",
      3: "Diretor",
      4: "Estrategico",
      5: "Financeiro",
      6: "PD",
      9: "Técnico",
      10: "Master",
    };
    return tipoMap[type] ?? "Usuário";
  }

  async function buscarEscalas(sistema: "PJES" | "DIARIAS") {
    if (!usuarioResumo) return;

    // toggle: clicou no mesmo sistema, fecha
    if (sistemaSelecionado === sistema) {
      setSistemaSelecionado(null);
      setEscalasUsuario([]);
      setDataSelecionada(null);
      return;
    }

    setSistemaSelecionado(sistema);
    const hoje = new Date();
    setMesAtual({ mes: hoje.getMonth(), ano: hoje.getFullYear() });
    setDataSelecionada(null);
    setDataSelecionada(null);
    setLoadingEscalas(true);
    setErroEscalas(null);

    try {
      const res = await fetch(
        `/api/escala/usuario/${usuarioResumo.id}?sistema=${sistema}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setErroEscalas(data?.message ?? "Erro ao buscar escalas");
        setEscalasUsuario([]);
        return;
      }

      setEscalasUsuario(data);
    } catch {
      setErroEscalas("Erro de conexão");
    } finally {
      setLoadingEscalas(false);
    }
  }

  async function handleUploadCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setImportandoSgp(true);

    const promise = fetch("/api/dados-sgp/importar", {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Erro ao importar arquivo",
        );
      }
      return data;
    });

    toast.promise(promise, {
      loading: "Importando dados do SGP...",
      success: (data) => `${data.total} registros importados com sucesso ✅`,
      error: (err) => err.message,
    });

    try {
      await promise;
    } finally {
      setImportandoSgp(false);
      // limpa o input para permitir selecionar o mesmo arquivo de novo
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="page">
      <h1 className="h1UsuariosTitle">USUARIOS</h1>

      <div className="divUsuarioPrincipal">
        {/* COLUNA USUÁRIOS */}
        <div className="divUsuario">
          <div className="divInputBuscarUsuarioEIcones">
            <input
              className="inputBuscarUsuario"
              type="text"
              placeholder="Buscar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <FiPlusCircle
              size={25}
              color="green"
              onClick={() => {
                setUsuarioEdit(null);
                setModalOpen(true);
              }}
            />

            {/* input oculto para upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              style={{ display: "none" }}
              onChange={handleUploadCsv}
            />

            <FiUpload
              size={25}
              color={importandoSgp ? "#999" : "black"}
              style={{ cursor: importandoSgp ? "wait" : "pointer" }}
              onClick={() => {
                if (!importandoSgp) fileInputRef.current?.click();
              }}
            />
          </div>

          <div className="usuarioCard">
            {busca.length === 0 && (
              <div className="usuarioMensagemVazia">
                Digite Matrícula ou Nome de Guerra do Usuário
              </div>
            )}

            {busca.length > 0 && busca.length < 6 && (
              <div className="usuarioMensagemVazia">Continue digitando...</div>
            )}

            {busca.length >= 6 && !usuarioResumo && (
              <div className="usuarioMensagemNaoEncontrado">
                Usuário não encontrado
              </div>
            )}

            {usuarioResumo && (
              <>
                {menuAberto === usuarioResumo.id && (
                  <div ref={menuRef} className="dropdownMenu">
                    <div
                      className="dropdownItem"
                      onClick={() => {
                        setUsuarioEdit(usuarioResumo);
                        setModalOpen(true);
                      }}
                    >
                      Editar
                    </div>
                    <div
                      className="dropdownItem"
                      onClick={() => excluirUsuario(usuarioResumo)}
                    >
                      Excluir
                    </div>
                    <div
                      className="dropdownItem"
                      onClick={() => resetarSenha(usuarioResumo)}
                    >
                      Reset Senha
                    </div>
                  </div>
                )}
                <div>
                  {usuarioResumo.imagemUrl ? (
                    <img
                      src={usuarioResumo.imagemUrl}
                      alt="Usuário"
                      className="usuarioImgBusca"
                    />
                  ) : (
                    <FaUser className="usuarioIcon" />
                  )}
                </div>

                <div
                  className="usuarioConteudo"
                  onClick={() => toggleUsuario(usuarioResumo.id)}
                >
                  <div className="usuarioTopo">
                    <div className="usuarioNome">
                      {usuarioResumo.pg} {usuarioResumo.nomeGuerra}
                    </div>

                    <FiMoreVertical
                      size={16}
                      className="usuarioMenu"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(
                          menuAberto === usuarioResumo.id
                            ? null
                            : usuarioResumo.id,
                        );
                      }}
                    />
                  </div>

                  <div className="usuarioInfos">
                    <span>
                      <FaBarcode /> {usuarioResumo.mat}
                    </span>
                    <span>
                      <FaUser /> {getUserTypeLabel(usuarioResumo.typeUser)}
                    </span>
                    <span>
                      <FaPhone /> {usuarioResumo.phone}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 2,
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (usuarioResumo) toggleAtivo(usuarioResumo);
                      }}
                    >
                      <FaLock
                        size={12}
                        color={usuarioResumo.ativo ? "green" : "red"}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: usuarioResumo.ativo ? "green" : "red",
                          fontWeight: 600,
                        }}
                      >
                        {usuarioResumo.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="usuario_detalhes_escalas">
          {usuarioAberto === usuarioDetalhe?.id && (
            <div className="usuario_detalhes_container">
              <div className="usuario_detalhes_header">
                <h3>DADOS COMPLEMENTARES</h3>
              </div>

              <div
                className="usuario_detalhes_item"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setContaEdit(usuarioDetalhe?.conta ?? null);
                  setContaModalOpen(true);
                }}
              >
                <div className="usuario_detalhes_icon">
                  <FaDollarSign />
                  <div>Conta</div>
                </div>

                <div className="usuario_detalhes_texto">
                  {usuarioDetalhe?.conta ? (
                    <>
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {usuarioDetalhe.conta.banco} | Ag:
                          {usuarioDetalhe.conta.agencia} | Conta:
                          {usuarioDetalhe.conta.conta}
                        </div>
                      </div>
                      Cadastro:{" "}
                      {usuarioDetalhe.conta.createdByUser?.mat ?? "Sistema"} em{" "}
                      {new Date(
                        usuarioDetalhe.conta.createdAt,
                      ).toLocaleString()}
                      <br />
                      Atualização:{" "}
                      {usuarioDetalhe.conta.updatedByUser?.mat ?? "—"} em{" "}
                      {new Date(
                        usuarioDetalhe.conta.updatedAt,
                      ).toLocaleString()}
                    </>
                  ) : (
                    <div style={{ color: "#1e88e5", fontWeight: 600 }}>
                      Clique aqui para cadastrar uma conta
                    </div>
                  )}
                </div>
              </div>

              {usuarioDetalhe?.ome && (
                <div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaUniversity />
                      <div style={{ marginLeft: "5px" }}>Unidade</div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {usuarioDetalhe?.ome?.nomeOme}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {usuarioResumo && (
                <div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaBarcode />{" "}
                      <div style={{ marginLeft: "5px" }}> Cpf</div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {usuarioResumo.cpf}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaAddressCard />
                      <div style={{ marginLeft: "5px" }}>Of/Prç</div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {usuarioResumo.tipo}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaMale />
                      <div style={{ marginLeft: "5px" }}>Func/Vinc</div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {usuarioResumo.nunfunc} | {usuarioResumo.nunvinc}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FiAlertTriangle />
                      <div style={{ marginLeft: "5px" }}>Situação</div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {usuarioResumo.situacao}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="usuario_detalhes_container">
            <div className="usuario_detalhes_header">
              <button
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  height: "30px",
                  backgroundColor: "#1e88e5",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  cursor: usuarioResumo ? "pointer" : "not-allowed",
                  opacity: usuarioResumo ? 1 : 0.5,
                }}
                disabled={!usuarioResumo}
                onClick={() => {
                  setVerEscalaAberto((prev) => !prev);
                  setSistemaSelecionado(null);
                  setEscalasUsuario([]);
                  setDataSelecionada(null);
                  setErroEscalas(null);
                }}
              >
                {verEscalaAberto ? "▲ FECHAR ESCALAS" : "▼ VER ESCALAS"}
              </button>
            </div>

            {verEscalaAberto && (
              <div
                style={{
                  padding: "12px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {/* Botões PJES / DIÁRIAS */}
                <div style={{ display: "flex", gap: 8 }}>
                  {(["PJES", "DIARIAS"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => buscarEscalas(s)}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        marginLeft: 10,
                        marginRight: 10,
                        cursor: "pointer",
                        fontWeight: 600,
                        background:
                          sistemaSelecionado === s ? "#1e88e5" : "#f3f4f6",
                        color: sistemaSelecionado === s ? "#fff" : "#333",
                        transition: "all 0.15s",
                      }}
                    >
                      {s === "DIARIAS" ? "DIÁRIAS" : s}
                    </button>
                  ))}
                </div>

                {/* Erro */}
                {erroEscalas && (
                  <p style={{ color: "red", fontSize: 13, margin: 0 }}>
                    {erroEscalas}
                  </p>
                )}

                {/* Loading */}
                {loadingEscalas && (
                  <p style={{ color: "#666", fontSize: 13, margin: 0 }}>
                    Carregando...
                  </p>
                )}

                {/* Calendário de datas */}
                {!loadingEscalas && !erroEscalas && sistemaSelecionado && (
                  <>
                    {escalasUsuario.length === 0 ? (
                      <p style={{ color: "#999", fontSize: 13, margin: 0 }}>
                        Nenhuma escala encontrada
                      </p>
                    ) : (
                      <>
                        {/* Navegação do mês */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 8,
                          }}
                        >
                          <button
                            onClick={() =>
                              setMesAtual((prev) => {
                                const d = new Date(prev.ano, prev.mes - 1);
                                return {
                                  mes: d.getMonth(),
                                  ano: d.getFullYear(),
                                };
                              })
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 16,
                              padding: "0 8px",
                            }}
                          >
                            ‹
                          </button>

                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {new Date(mesAtual.ano, mesAtual.mes)
                              .toLocaleString("pt-BR", {
                                month: "long",
                                year: "numeric",
                              })
                              .toUpperCase()}
                          </span>

                          <button
                            onClick={() =>
                              setMesAtual((prev) => {
                                const d = new Date(prev.ano, prev.mes + 1);
                                return {
                                  mes: d.getMonth(),
                                  ano: d.getFullYear(),
                                };
                              })
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 16,
                              padding: "0 8px",
                            }}
                          >
                            ›
                          </button>
                        </div>

                        {/* Grade do calendário */}
                        {(() => {
                          const diasSemana = [
                            "D",
                            "S",
                            "T",
                            "Q",
                            "Q",
                            "S",
                            "S",
                          ];
                          const primeiroDia = new Date(
                            mesAtual.ano,
                            mesAtual.mes,
                            1,
                          ).getDay();
                          const totalDias = new Date(
                            mesAtual.ano,
                            mesAtual.mes + 1,
                            0,
                          ).getDate();

                          // Datas com escala nesse mês
                          const datasComEscala = new Set(
                            escalasUsuario
                              .filter((e) => {
                                const [ano, mes] = e.dataInicio
                                  .split("-")
                                  .map(Number);
                                return (
                                  ano === mesAtual.ano &&
                                  mes - 1 === mesAtual.mes
                                );
                              })
                              .map((e) => e.dataInicio),
                          );

                          const celulas = [
                            ...Array(primeiroDia).fill(null),
                            ...Array.from({ length: totalDias }, (_, i) => {
                              const dia = i + 1;
                              const dateStr = `${mesAtual.ano}-${String(mesAtual.mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                              return { dia, dateStr };
                            }),
                          ];

                          return (
                            <div style={{ marginTop: 6 }}>
                              {/* Cabeçalho dias da semana */}
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(7, 1fr)",
                                  gap: 2,
                                  marginBottom: 4,
                                }}
                              >
                                {diasSemana.map((d, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      textAlign: "center",
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: "#999",
                                    }}
                                  >
                                    {d}
                                  </div>
                                ))}
                              </div>

                              {/* Dias */}
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(7, 1fr)",
                                  gap: 2,
                                }}
                              >
                                {celulas.map((celula, i) => {
                                  if (!celula) return <div key={i} />;

                                  const { dia, dateStr } = celula;
                                  const temEscala = datasComEscala.has(dateStr);
                                  const selecionado =
                                    dataSelecionada === dateStr;

                                  return (
                                    <button
                                      key={dateStr}
                                      disabled={!temEscala}
                                      onClick={() =>
                                        setDataSelecionada((prev) =>
                                          prev === dateStr ? null : dateStr,
                                        )
                                      }
                                      style={{
                                        padding: "5px 0",
                                        borderRadius: 6,
                                        border: selecionado
                                          ? "2px solid #1e88e5"
                                          : temEscala
                                            ? "1px solid #1e88e5"
                                            : "1px solid transparent",
                                        background: selecionado
                                          ? "#1e88e5"
                                          : temEscala
                                            ? "#e3f2fd"
                                            : "transparent",
                                        color: selecionado
                                          ? "#fff"
                                          : temEscala
                                            ? "#1e88e5"
                                            : "#ccc",
                                        fontWeight: temEscala ? 700 : 400,
                                        fontSize: 12,
                                        cursor: temEscala
                                          ? "pointer"
                                          : "default",
                                      }}
                                    >
                                      {dia}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Detalhes do dia selecionado */}
                        {dataSelecionada &&
                          escalasUsuario
                            .filter((e) => e.dataInicio === dataSelecionada)
                            .map((e) => (
                              <div
                                key={e.id}
                                style={{
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 8,
                                  padding: 12,
                                  fontSize: 12,
                                  display: "flex",
                                  flexDirection: "column",
                                  marginLeft: 10,
                                  marginRight: 10,
                                  gap: 3,
                                  background: "#fafafa",
                                  marginTop: 8,
                                }}
                              >
                                <div>
                                  <strong>Evento:</strong> {e.nomeEvento}
                                </div>
                                <div>
                                  <strong>Operação:</strong> {e.nomeOperacao} —{" "}
                                  {e.cod_op}
                                </div>
                                <div>
                                  <strong>OME:</strong> {e.nomeOme}
                                </div>
                                <div>
                                  <strong>Horário:</strong> {e.horaInicio} –{" "}
                                  {e.horaFim}
                                </div>
                                <div>
                                  <strong>Local:</strong> {e.localApresentacao}
                                </div>
                                <div>
                                  <strong>Função:</strong> {e.funcao}
                                </div>
                                <div>
                                  <strong>Situação:</strong> {e.situacao}
                                </div>
                                {e.viatura && (
                                  <div>
                                    <strong>Viatura:</strong>{" "}
                                    {e.viatura.patrimonio}
                                  </div>
                                )}
                                {e.anotacoes && (
                                  <div>
                                    <strong>Anotações:</strong> {e.anotacoes}
                                  </div>
                                )}
                              </div>
                            ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <UsuariosModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={usuarioEdit}
        onSuccess={async (id: number) => {
          await recarregarUsuario(id);
        }}
      />
      <ContaModal
        open={contaModalOpen}
        onClose={() => setContaModalOpen(false)}
        conta={contaEdit}
        userId={usuarioDetalhe?.id}
        onSuccess={async () => {
          if (usuarioDetalhe?.id) {
            await recarregarConta(usuarioDetalhe.id);
          }
        }}
      />
    </div>
  );
}
