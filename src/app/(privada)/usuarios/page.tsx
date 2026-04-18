"use client";
import { useEffect, useRef, useState } from "react";
import { FiPlusCircle, FiMoreVertical } from "react-icons/fi";
import { FaUser, FaPhone } from "react-icons/fa";
import { FaBarcode } from "react-icons/fa6";

export default function UsuariosPage() {
  const [menuAberto, setMenuAberto] = useState<number | null>(null);
  const [usuarioAberto, setUsuarioAberto] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [busca, setBusca] = useState("");
  const [usuario, setUsuario] = useState<any | null>(null);

  function toggleUsuario(id: number) {
    setUsuarioAberto(usuarioAberto === id ? null : id);
  }

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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    handleResize(); // roda na carga
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!usuarioAberto) return;

    async function carregarUsuarioCompleto() {
      const res = await fetch(`/api/user/${usuarioAberto}`);
      const data = await res.json();
      setUsuario(data); // 🔥 agora vem ome + conta
    }

    carregarUsuarioCompleto();
  }, [usuarioAberto]);

  async function buscarUsuario(valor: string) {
    if (valor.length < 3) return;

    const res = await fetch(`/api/user/search?q=${valor}`);
    const data = await res.json();
    console.log("RETORNO DA API:", data);
    setUsuario(data);
  }

  useEffect(() => {
    if (busca.length < 6) {
      // 👈 matrícula tem tamanho mínimo
      setUsuario(null);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/search?q=${busca}`);

        if (!res.ok) return;

        const text = await res.text();
        if (!text) return;

        setUsuario(JSON.parse(text));
      } catch {
        setUsuario(null);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [busca]);

  function getUserTypeLabel(type: number) {
    switch (type) {
      case 1:
        return "Comum";
      case 2:
        return "Auxiliar";
      case 3:
        return "Diretor";
      case 4:
        return "Estrategico";
      case 5:
        return "Financeiro";
      case 6:
        return "PD";
      case 9:
        return "Técnico";
      case 10:
        return "Master";
      default:
        return "Usuário";
    }
  }

  return (
    <div className="page">
      <h1 className="h1UsuariosTitle">USUARIOS</h1>

      <div className="divDiretoriaUsuarioPrincipal">
        {/* COLUNA USUÁRIOS */}
        <div className="divDiretoriaUsuario">
          <div className="divInputBuscarUsuarioEIcones">
            <input
              className="inputBuscarUsuario"
              type="text"
              placeholder="Buscar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <FiPlusCircle size={25} color="green" />
          </div>

          {/* CARD USUÁRIO */}
          <div className="usuarioCard">
            {/* 🟡 NADA DIGITADO */}
            {busca.length === 0 && (
              <div className="usuarioMensagemVazia">
                Digite Matrícula ou Nome de Guerra do Usuário
              </div>
            )}

            {/* 🔵 DIGITANDO */}
            {busca.length > 0 && busca.length < 6 && (
              <div className="usuarioMensagemVazia">Continue digitando...</div>
            )}

            {/* 🔴 NÃO ENCONTRADO */}
            {busca.length >= 6 && !usuario && (
              <div className="usuarioMensagemNaoEncontrado">
                Usuário não encontrado
              </div>
            )}

            {/* 🟢 ENCONTRADO */}
            {usuario && (
              <>
                <div className="usuarioAvatar">
                  {usuario.imagemUrl ? (
                    <img
                      src={usuario.imagemUrl}
                      alt="Usuário"
                      className="usuarioAvatarImg"
                    />
                  ) : (
                    <FaUser />
                  )}
                </div>

                <div
                  className="usuarioConteudo"
                  onClick={() => toggleUsuario(usuario.id)}
                >
                  <div className="usuarioTopo">
                    <div className="usuarioNome">
                      {usuario.pg?.toUpperCase()}{" "}
                      {usuario.nomeGuerra?.toUpperCase()}
                    </div>

                    <FiMoreVertical
                      size={16}
                      className="usuarioMenu"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(
                          menuAberto === usuario.id ? null : usuario.id
                        );
                      }}
                    />

                    {menuAberto === usuario.id && (
                      <div ref={menuRef} className="dropdownMenu">
                        <div
                          className="dropdownItem"
                          onClick={() => acao("Editar")}
                        >
                          Editar
                        </div>
                        <div
                          className="dropdownItem"
                          onClick={() => acao("Excluir")}
                        >
                          Excluir
                        </div>
                        <div
                          className="dropdownItem"
                          onClick={() => acao("ResetSenha")}
                        >
                          Reset Senha
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="usuarioLogin">{usuario.loginSei}</div>

                  <div className="usuarioInfos">
                    <span>
                      <FaBarcode /> {usuario.mat}
                    </span>
                    <span>
                      <FaUser /> {getUserTypeLabel(usuario.typeUser)}
                    </span>
                    <span>
                      <FaPhone /> {usuario.phone}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 👇 DETALHES NO MOBILE */}
          {isMobile && usuarioAberto === usuario?.id && (
            <div className="detalhesMobile">
              <div className="divTituloDetalhesUsuario">
                <h4>Detalhes do Usuário</h4>
              </div>

              {usuario?.conta && (
                <div className="cardConta">
                  <p>
                    <strong>Banco:</strong> {usuario.conta.banco}
                  </p>
                  <p>
                    <strong>Agência:</strong> {usuario.conta.agencia}
                  </p>
                  <p>
                    <strong>Conta:</strong> {usuario.conta.conta}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUNA DETALHES DESKTOP */}
        {!isMobile && usuarioAberto === usuario?.id && (
          <div className="divDetalhesUsuario">
            <div className="divTituloDetalhesUsuario">
              <h4>Detalhes do Usuário</h4>
            </div>

            {usuario?.conta && (
              <div className="cardConta">
                <p>
                  <strong>Banco:</strong> {usuario.conta.banco}
                </p>
                <p>
                  <strong>Agência:</strong> {usuario.conta.agencia}
                </p>
                <p>
                  <strong>Conta:</strong> {usuario.conta.conta}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
