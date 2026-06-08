"use client";

import { useEffect, useState, useRef } from "react";
import { FiArrowLeft, FiKey, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

import {
  FaUser,
  FaPhone,
  FaUniversity,
  FaMale,
  FaDollarSign,
  FaBarcode,
  FaChartLine,
  FaHandPointUp,
} from "react-icons/fa";

type Aba = "geral" | "senha" | "escala";

export default function PerfilDrawer() {
  const { user } = useCurrentUser(); // ✅ HOOK NO TOPO

  const [open, setOpen] = useState(false);
  const [aba, setAba] = useState<Aba>("geral");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [loadingImagem, setLoadingImagem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagemUrl, setImagemUrl] = useState(user?.imagemUrl || "");

  useEffect(() => {
    const openDrawer = () => {
      setOpen(true);
      window.dispatchEvent(new Event("perfilDrawerOpened"));
    };
    window.addEventListener("openPerfilDrawer", openDrawer);
    return () => window.removeEventListener("openPerfilDrawer", openDrawer);
  }, []);

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (user?.imagemUrl) setImagemUrl(user.imagemUrl);
  }, [user]);

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
      case 7:
        return "Gestor";
      case 9:
        return "Técnico";
      case 10:
        return "Master";
      default:
        return "Usuário";
    }
  }

  async function handleUpdatePhone() {
    try {
      setLoadingPhone(true);

      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
        }),
      });

      if (!response.ok) {
        throw new Error();
      }

      toast.success("Telefone atualizado com sucesso");
      setEditingPhone(false);
    } catch {
      toast.error("Erro ao atualizar telefone");
    } finally {
      setLoadingPhone(false);
    }
  }

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    }

    return numbers
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("Preencha as duas senhas");
      return;
    }

    try {
      setLoadingPassword(true);

      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || "Erro ao alterar senha");
      }

      toast.success("Senha alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao alterar senha");
    } finally {
      setLoadingPassword(false);
    }
  }

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Deslogado com sucesso!"); // ✅ Toast de sucesso
        setTimeout(() => {
          window.location.href = "/login"; // redireciona após mostrar toast
        }, 1000); // 1s de delay
      } else {
        toast.error("Erro ao deslogar"); // ✅ Toast de erro
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro interno");
    }
  };

  // Sincroniza quando user carrega
  async function handleImagemUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.mat) return;

    try {
      setLoadingImagem(true);
      const formData = new FormData();
      formData.append("imagem", file);
      formData.append("mat", user.mat);

      const response = await fetch("/api/user/upload-imagem", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error();

      const { imagemUrl: novaUrl } = await response.json();
      // Força recarregar quebrando o cache do browser
      setImagemUrl(`${novaUrl}?t=${Date.now()}`);
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro ao atualizar foto");
    } finally {
      setLoadingImagem(false);
      e.target.value = ""; // limpa o input para permitir reenvio da mesma imagem
    }
  }

  if (!open) return null;

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
          </div>

          <div className="perfilTabContent">
            {aba === "geral" && (
              <div className="perfilGeral">
                <div>
                  <div className="usuario_detalhes_item">
                    <div className="usuario_detalhes_icon">
                      <div
                        style={{
                          marginLeft: "5px",
                          color: "blue",
                          position: "relative",
                          cursor: "pointer",
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        title="Clique para trocar a foto"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleImagemUpload}
                        />

                        {loadingImagem ? (
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span>...</span>
                          </div>
                        ) : imagemUrl ? (
                          <img
                            src={imagemUrl}
                            alt="Usuário"
                            className="usuarioImgPerfilDrawer"
                            style={{ opacity: 0.85 }}
                          />
                        ) : (
                          <FaUser className="usuarioIcon" />
                        )}

                        {/* Ícone de câmera sobreposto */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            background: "#f7b80d",
                            borderRadius: "50%",
                            padding: "3px",
                            fontSize: "10px",
                            color: "#fff",
                            lineHeight: 1,
                          }}
                        >
                          📷
                        </div>
                      </div>
                    </div>
                    <div className="usuario_detalhes_texto">
                      <div className="usuario_detalhes_titulo_item">
                        <div className="divUsuarioDetalhesRight"></div>
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
                        {editingPhone ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "5px",
                              alignItems: "center",
                            }}
                          >
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) =>
                                setPhone(formatPhone(e.target.value))
                              }
                              maxLength={15}
                              placeholder="(81) 99999-9999"
                              style={{
                                borderRadius: "10px",
                                border: "1px solid #f7b80d",
                                padding: "5px 10px",
                                width: "130px",
                                outline: "none",
                              }}
                            />

                            <button
                              onClick={handleUpdatePhone}
                              disabled={loadingPhone}
                              style={{
                                background: "#f7b80d",
                                border: "none",
                                borderRadius: "8px",
                                padding: "5px 10px",
                                cursor: "pointer",
                                color: "#fff",
                              }}
                            >
                              {loadingPhone ? "..." : "Salvar"}
                            </button>

                            <button
                              onClick={() => {
                                setEditingPhone(false);
                                setPhone(user?.phone || "");
                              }}
                              style={{
                                background: "#ddd",
                                border: "none",
                                borderRadius: "8px",
                                padding: "5px 10px",
                                cursor: "pointer",
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div
                            className="divUsuarioDetalhesRight"
                            onClick={() => setEditingPhone(true)}
                            style={{
                              borderRadius: "15px",
                              border: "solid 1px #f7b80d",
                              padding: "5px",
                              color: "#f88f06",
                              cursor: "pointer",
                              transition: "0.2s",
                            }}
                          >
                            {phone}

                            <span style={{ marginLeft: "5px" }}>
                              <FaHandPointUp />
                            </span>
                          </div>
                        )}
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
                                    {user?.conta?.createdByUser?.mat ?? "—"} em
                                  </div>

                                  <div>
                                    {user?.conta?.createdAt
                                      ? new Date(
                                          user.conta.createdAt,
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
                                    {user?.conta?.updatedByUser?.mat ?? "—"} em
                                  </div>

                                  <div>
                                    {user?.conta?.updatedAt
                                      ? new Date(
                                          user.conta.updatedAt,
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
                  <div className="usuario_detalhes_texto">
                    <div className="usuario_detalhes_titulo_item">
                      <button
                        className="botaoCriarEvento"
                        onClick={handleLogout}
                      >
                        DESCONECTAR
                      </button>
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
          </div>
        </div>
      </div>
    </>
  );
}
