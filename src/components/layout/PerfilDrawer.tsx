"use client";

import { useEffect, useState } from "react";
import { getUserFromCookie } from "../../lib/getUserFromCookie";
import { FiArrowLeft, FiUser, FiKey } from "react-icons/fi";
import { AiFillCalendar } from "react-icons/ai";
import {
  FaUser,
  FaPhone,
  FaUniversity,
  FaAddressCard,
  FaMale,
  FaDollarSign,
  FaBarcode,
  FaChartLine,
} from "react-icons/fa";
import toast from "react-hot-toast";

type User = {
  imagemUrl?: string;
  loginSei: string;
  nomeGuerra: string;
  pg: string;
  mat: string;
  tipo: string;
  cpf: string;
  nunfunc: string;
  nunvinc: string;
  phone: string;

  typeUser?: number;
  ome?: {
    nomeOme: string;
  };

  conta?: {
    banco: string;
    conta: string;
    agencia: string;
    createdAt: string;
    updatedAt: string;

    createdByUser?: {
      loginSei: string;
    };

    updatedByUser?: {
      loginSei: string;
    };
  };
};

export default function PerfilDrawer() {
  const [open, setOpen] = useState(false);
  const [aba, setAba] = useState<"geral" | "senha" | "escala">("geral");
  const [user, setUser] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    const userData = getUserFromCookie();
    setUser(userData);
  }, []);

  useEffect(() => {
    const openDrawer = () => {
      setOpen(true);
      window.dispatchEvent(new Event("perfilDrawerOpened"));
    };
    window.addEventListener("openPerfilDrawer", openDrawer);
    return () => window.removeEventListener("openPerfilDrawer", openDrawer);
  }, []);

  function getUserTypeLabel(type?: number) {
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

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("Preencha as duas senhas");
      return;
    }

    try {
      setLoadingPassword(true);

      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      toast.success("Senha alterada com sucesso! 🔐");

      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha");
    } finally {
      setLoadingPassword(false);
    }
  }

  return (
    <>
      <div
        className={`modalPerfilOverlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />

      <div className={`modalPerfilDrawer ${open ? "open" : ""}`}>
        <div className="modalPerfilHeader">
          <span>
            <FiUser /> Perfil
          </span>
          <button
            style={{
              border: "none",
              background: "transparent",
              fontSize: "20px",
            }}
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event("perfilDrawerClosed"));
            }}
          >
            <FiArrowLeft />
          </button>
        </div>

        <div className="modalPerfilContent">
          <div className="perfilTabs">
            <button
              className={`perfilTabBtn ${aba === "geral" ? "active" : ""}`}
              onClick={() => setAba("geral")}
            >
              <FiUser size={20} />
              <span>Geral</span>
            </button>

            <button
              className={`perfilTabBtn ${aba === "senha" ? "active" : ""}`}
              onClick={() => setAba("senha")}
            >
              <FiKey size={20} />
              <span>Senha</span>
            </button>

            <button
              className={`perfilTabBtn ${aba === "escala" ? "active" : ""}`}
              onClick={() => setAba("escala")}
            >
              <AiFillCalendar size={20} />
              <span>Escala</span>
            </button>
          </div>

          <div className="perfilTabContent">
            {aba === "geral" && (
              <div className="perfilGeral">
                <div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaAddressCard color="blue" />{" "}
                      <div style={{ marginLeft: "5px", color: "blue" }}>
                        {" "}
                        Login
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {user?.loginSei}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaUser color="orange" />
                      <div style={{ marginLeft: "5px", color: "orange" }}>
                        Perfil
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {getUserTypeLabel(user?.typeUser)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaChartLine color="red" />
                      <div style={{ marginLeft: "5px", color: "red" }}>
                        Post/Grad
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {user?.pg}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaBarcode color="purple" />
                      <div style={{ marginLeft: "5px", color: "purple" }}>
                        Matricula
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {user?.mat}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaMale color="green" />
                      <div style={{ marginLeft: "5px", color: "green" }}>
                        Tipo
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {user?.tipo}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaBarcode color="purple" />
                      <div style={{ marginLeft: "5px", color: "purple" }}>
                        Cpf
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {user?.cpf}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaBarcode color="purple" />
                      <div style={{ marginLeft: "5px", color: "purple" }}>
                        Nunfunc/Nunvinc
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {user?.nunfunc} | {user?.nunvinc}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaPhone color="orange" />
                      <div style={{ marginLeft: "5px", color: "orange" }}>
                        Telefone
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {user?.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaUniversity color="brown" />
                      <div style={{ marginLeft: "5px", color: "brown" }}>
                        OME
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {user?.ome?.nomeOme}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <FaDollarSign color="gray" />
                      <div style={{ marginLeft: "5px", color: "gray" }}>
                        Conta
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight">
                          {user?.conta ? (
                            <>
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <div>
                                    {user.conta.banco} | Ag:{" "}
                                    {user.conta.agencia} | Conta:{" "}
                                    {user.conta.conta}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    color: "#9c9c9c",
                                    fontSize: "9px",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <div style={{ marginRight: "5px" }}>
                                    {user?.conta?.createdByUser?.loginSei ??
                                      "—"}{" "}
                                    em
                                  </div>

                                  <div>
                                    {user?.conta?.createdAt
                                      ? new Date(
                                          user.conta.createdAt
                                        ).toLocaleString()
                                      : "—"}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    color: "#9c9c9c",
                                    fontSize: "9px",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <div style={{ marginRight: "5px" }}>
                                    {user?.conta?.updatedByUser?.loginSei ??
                                      "—"}{" "}
                                    em
                                  </div>

                                  <div>
                                    {user?.conta?.updatedAt
                                      ? new Date(
                                          user.conta.updatedAt
                                        ).toLocaleString()
                                      : "—"}{" "}
                                    (Atualizada)
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <span style={{ opacity: 0.6 }}>
                              Conta não cadastrada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {aba === "senha" && (
              <div className="perfilSenha">
                <input
                  type="text"
                  placeholder="Senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <button
                  onClick={handleChangePassword}
                  disabled={loadingPassword}
                >
                  {loadingPassword ? "Atualizando..." : "Atualizar senha"}
                </button>
              </div>
            )}

            {aba === "escala" && (
              <div className="perfilEscala">
                <p>Calendário da escala aqui</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
