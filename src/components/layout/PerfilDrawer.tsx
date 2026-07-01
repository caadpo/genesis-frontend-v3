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
  FaEdit,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

type Aba = "geral" | "senha" | "conta";

type ContaForm = {
  banco: string;
  cod_banco: string;
  agencia: string;
  conta: string;
  dig_conta: string;
};

export default function PerfilDrawer() {
  const { user } = useCurrentUser();

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

  // ─── Estado da conta bancária ────────────────────────────────────────────
  const [editingConta, setEditingConta] = useState(false);
  const [loadingConta, setLoadingConta] = useState(false);
  const [contaForm, setContaForm] = useState<ContaForm>({
    banco: "",
    cod_banco: "",
    agencia: "",
    conta: "",
    dig_conta: "",
  });

  useEffect(() => {
    const openDrawer = () => {
      setOpen(true);
      window.dispatchEvent(new Event("perfilDrawerOpened"));
    };
    window.addEventListener("openPerfilDrawer", openDrawer);
    return () => window.removeEventListener("openPerfilDrawer", openDrawer);
  }, []);

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    if (user?.imagemUrl) setImagemUrl(user.imagemUrl);
  }, [user]);

  // Preenche o form de conta quando o user carrega
  useEffect(() => {
    if (user?.conta) {
      setContaForm({
        banco: user.conta.banco ?? "",
        cod_banco: user.conta.cod_banco ?? "",
        agencia: user.conta.agencia ?? "",
        conta: user.conta.conta ?? "",
        dig_conta: user.conta.dig_conta ?? "",
      });
    }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) throw new Error();
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
        toast.success("Deslogado com sucesso!");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      } else {
        toast.error("Erro ao deslogar");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro interno");
    }
  };

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
      setImagemUrl(`${novaUrl}?t=${Date.now()}`);
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro ao atualizar foto");
    } finally {
      setLoadingImagem(false);
      e.target.value = "";
    }
  }

  // ─── Salvar conta bancária própria ───────────────────────────────────────
  async function handleSalvarConta() {
    const { banco, cod_banco, agencia, conta, dig_conta } = contaForm;
    if (!banco || !agencia || !conta || !dig_conta) {
      toast.error("Preencha todos os campos da conta");
      return;
    }
    try {
      setLoadingConta(true);
      const response = await fetch("/api/conta/me/propria", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banco, cod_banco, agencia, conta, dig_conta }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || "Erro ao atualizar conta");
      }
      toast.success(
        "Conta atualizada! Aguarde a confirmação do Financeiro no e-Fisco.",
        { duration: 4000 },
      );
      setEditingConta(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar conta");
    } finally {
      setLoadingConta(false);
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
              className={`perfilTabBtn ${aba === "conta" ? "active" : ""}`}
              onClick={() => setAba("conta")}
            >
              <FaDollarSign size={20} />
              <span>Conta</span>
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
            {/* ─── ABA GERAL ────────────────────────────────────────────── */}
            {aba === "geral" && (
              <div className="perfilGeral">
                <div>
                  {/* Foto */}
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
                        <div className="divUsuarioDetalhesRight" />
                      </div>
                    </div>
                  </div>

                  {/* Perfil */}
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

                  {/* PG */}
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

                  {/* Matrícula */}
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

                  {/* Tipo */}
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

                  {/* CPF */}
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

                  {/* Nunfunc/Nunvinc */}
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

                  {/* Telefone */}
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

                  {/* OME */}
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

                  {/* Desconectar */}
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

            {/* ─── ABA CONTA BANCÁRIA ───────────────────────────────────── */}
            {aba === "conta" && (
              <div className="perfilGeral">
                {/* Status e-Fisco */}
                {user?.conta && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 10,
                      marginBottom: 14,
                      background:
                        user.conta.isEfisco === false ? "#fff3cd" : "#d4edda",
                      border: `1px solid ${user.conta.isEfisco === false ? "#ffc107" : "#28a745"}`,
                      fontSize: 12,
                    }}
                  >
                    {user.conta.isEfisco === false ? (
                      <>
                        <FaExclamationTriangle color="#e6a800" />
                        <span style={{ color: "#856404" }}>
                          Atualização pendente de confirmação pelo Financeiro no
                          e-Fisco
                        </span>
                      </>
                    ) : (
                      <>
                        <FaCheckCircle color="#28a745" />
                        <span style={{ color: "#155724" }}>
                          Conta confirmada no e-Fisco
                        </span>
                      </>
                    )}
                  </div>
                )}

                {!user?.conta && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#888",
                      marginBottom: 12,
                      padding: "8px 12px",
                      background: "#f8f9fa",
                      borderRadius: 8,
                    }}
                  >
                    Você ainda não possui conta cadastrada. Solicite o cadastro
                    a um Auxiliar ou ao Financeiro.
                  </div>
                )}

                {/* Dados atuais da conta */}
                {user?.conta && !editingConta && (
                  <div>
                    {[
                      { label: "Banco", value: user.conta.banco },
                      { label: "Cód. Banco", value: user.conta.cod_banco },
                      { label: "Agência", value: user.conta.agencia },
                      {
                        label: "Conta",
                        value: `${user.conta.conta}-${user.conta.dig_conta}`,
                      },
                    ].map(({ label, value }) => (
                      <div className="usuario_detalhes_item" key={label}>
                        <div className="usuario_detalhes_icon">
                          <FaDollarSign color="gray" />
                          <div style={{ marginLeft: "5px", color: "gray" }}>
                            {label}
                          </div>
                        </div>
                        <div className="usuario_detalhes_texto">
                          <div className="usuario_detalhes_titulo_item">
                            <div className="divUsuarioDetalhesRight">
                              {value}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div style={{ marginTop: 16 }}>
                      <button
                        onClick={() => setEditingConta(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#f7b80d",
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 16px",
                          cursor: "pointer",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <FaEdit /> Atualizar minha conta
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulário de edição */}
                {user?.conta && editingConta && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                      Ao salvar, o Financeiro será notificado para atualizar no
                      e-Fisco.
                    </p>

                    {(
                      [
                        {
                          key: "banco",
                          label: "Nome do Banco",
                          placeholder: "Ex: Banco do Brasil",
                        },
                        {
                          key: "cod_banco",
                          label: "Código do Banco",
                          placeholder: "Ex: 001",
                        },
                        {
                          key: "agencia",
                          label: "Agência",
                          placeholder: "Ex: 1234",
                        },
                        {
                          key: "conta",
                          label: "Conta",
                          placeholder: "Ex: 12345",
                        },
                        {
                          key: "dig_conta",
                          label: "Dígito",
                          placeholder: "Ex: 6",
                        },
                      ] as {
                        key: keyof ContaForm;
                        label: string;
                        placeholder: string;
                      }[]
                    ).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label
                          style={{
                            fontSize: 11,
                            color: "#888",
                            display: "block",
                            marginBottom: 3,
                          }}
                        >
                          {label}
                        </label>
                        <input
                          type="text"
                          value={contaForm[key]}
                          placeholder={placeholder}
                          onChange={(e) =>
                            setContaForm((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                            padding: "7px 10px",
                            outline: "none",
                            fontSize: 13,
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    ))}

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={handleSalvarConta}
                        disabled={loadingConta}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#28a745",
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 16px",
                          cursor: "pointer",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 13,
                          flex: 1,
                          justifyContent: "center",
                        }}
                      >
                        {loadingConta ? (
                          "Salvando..."
                        ) : (
                          <>
                            <FaSave /> Salvar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingConta(false);
                          // restaura valores originais
                          if (user?.conta) {
                            setContaForm({
                              banco: user.conta.banco ?? "",
                              cod_banco: user.conta.cod_banco ?? "",
                              agencia: user.conta.agencia ?? "",
                              conta: user.conta.conta ?? "",
                              dig_conta: user.conta.dig_conta ?? "",
                            });
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#ddd",
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 16px",
                          cursor: "pointer",
                          color: "#444",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <FaTimes /> Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── ABA SENHA ───────────────────────────────────────────── */}
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
