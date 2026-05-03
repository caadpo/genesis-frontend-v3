"use client";

import { useEffect, useRef, useState } from "react";
import { FiPlusCircle, FiMoreVertical, FiAlertTriangle } from "react-icons/fi";
import {
  FaUser,
  FaPhone,
  FaDollarSign,
  FaUniversity,
  FaAddressCard,
  FaMale,
  FaBarcode,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import UsuariosModal from "@/src/components/ui/UsuariosModal";
import ContaModal from "@/src/components/ui/ContaModal";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Usuario = {
  id: number;
  imagemUrl?: string;
  loginSei: string;
  nomeGuerra: string;
  pg: string;
  mat: string;
  tipo: string;
  typeUser: number;
  phone: string;
  cpf: string;
  nunfunc: string;
  nunvinc: string;
  situacaoSgp: string;
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
  createdByUser?: { loginSei: string };
  updatedByUser?: { loginSei: string };
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
                <div className="usuarioAvatar">
                  {usuarioResumo.imagemUrl ? (
                    <img
                      src={usuarioResumo.imagemUrl}
                      alt="Usuário"
                      className="usuarioAvatarImg"
                    />
                  ) : (
                    <FaUser />
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
                  </div>

                  <div className="usuarioLogin">{usuarioResumo.loginSei}</div>

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
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {usuarioAberto === usuarioDetalhe?.id && (
          <div className="usuario_detalhes_container">
            <div className="usuario_detalhes_header">
              <h3>DADOS COMPLEMENTARES</h3>
            </div>

            <div
              className="usuario_detalhes_item"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setContaEdit(usuarioDetalhe?.conta ?? null); // se não existir, vai null
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
                    {usuarioDetalhe.conta.createdByUser?.loginSei ?? "Sistema"}{" "}
                    em{" "}
                    {new Date(usuarioDetalhe.conta.createdAt).toLocaleString()}
                    <br />
                    Atualização:{" "}
                    {usuarioDetalhe.conta.updatedByUser?.loginSei ??
                      "—"} em{" "}
                    {new Date(usuarioDetalhe.conta.updatedAt).toLocaleString()}
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
                    <FaBarcode /> <div style={{ marginLeft: "5px" }}> Cpf</div>
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
                        {usuarioResumo.situacaoSgp}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
