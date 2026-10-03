"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaBuilding,
  FaIdCard,
  FaKey,
  FaPaperPlane,
  FaUser,
  FaWhatsapp,
} from "react-icons/fa";
import { z } from "zod";

const WHATSAPP_NUMBER = "5581986854814"; // 55 + (81) 98685-4814

const UNIDADES = [
  "AECI",
  "APMP",
  "C.FARM",
  "C.ODONT",
  "CEFD",
  "CFAP",
  "CIMUS",
  "CMH",
  "CPM",
  "CPO",
  "CPP",
  "CRESEP",
  "CSMINT",
  "CSMMOTO",
  "CTT",
  "DAL",
  "DASIS",
  "DEAJA",
  "DEIP",
  "DF",
  "DGA",
  "DGP",
  "DVP",
  "DPJM",
  "DTEC",
  "EMG",
] as const;

const TIPOS = ["PRIMEIRO ACESSO", "REDEFINIR SENHA"] as const;

const schema = z.object({
  matricula: z.string().min(1, "Matrícula obrigatória"),
  nome: z
    .string()
    .trim()
    .min(1, "Nome de guerra obrigatório")
    .max(20, "Máximo de 20 caracteres"),
  unidade: z.enum(UNIDADES, { message: "Selecione a unidade" }),
  tipo: z.enum(TIPOS, { message: "Selecione o tipo de solicitação" }),
  whatsapp: z
    .string()
    .refine((v) => v.replace(/\D/g, "").length === 11, "WhatsApp inválido"),
});

type FieldName = "matricula" | "nome" | "unidade" | "tipo" | "whatsapp";

// Máscara: (81) 9.8685-4814
function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)}.${d.slice(3)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)}.${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function SolicitarAcessoPage() {
  const router = useRouter();
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [tipo, setTipo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = schema.safeParse({
      matricula,
      nome,
      unidade,
      tipo,
      whatsapp,
    });
    if (!validation.success) {
      const fieldErrors: Partial<Record<FieldName, string>> = {};
      validation.error.issues.forEach((err) => {
        const field = err.path[0] as FieldName;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const mensagem = [
      "*Solicitação de Acesso / Redefinição de Senha*",
      "",
      `*Matrícula:* ${matricula}`,
      `*Nome de Guerra:* ${nome.trim()}`,
      `*Unidade QCG:* ${unidade}`,
      `*Solicitação:* ${tipo}`,
      `*WhatsApp:* ${whatsapp}`,
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    // Limpa os campos e volta para o login
    setMatricula("");
    setNome("");
    setUnidade("");
    setTipo("");
    setWhatsapp("");
    toast.success("Solicitação preparada! Conclua o envio no WhatsApp.");
    router.replace("/login");
  };

  return (
    <>
      <div className="card-body_login">
        <p className="section-label_login">
          Solicitação de Acesso ou Redefinição de Senha
        </p>

        <p className="info-text_login">
          Se você não pertence a nenhuma acima, então preencha os dados abaixo.
          Após verificação, em breve você receberá uma mensagem.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Matrícula */}
          <div className="input-wrapper_login">
            <FaIdCard className="input-icon_login" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Matrícula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
              className="input_login"
            />
            {errors.matricula && (
              <span className="error_login">{errors.matricula}</span>
            )}
          </div>

          {/* Nome de guerra */}
          <div className="input-wrapper_login">
            <FaUser className="input-icon_login" />
            <input
              type="text"
              placeholder="Nome de Guerra"
              maxLength={20}
              value={nome}
              onChange={(e) => setNome(e.target.value.toUpperCase())}
              className="input_login"
            />
            {errors.nome && <span className="error_login">{errors.nome}</span>}
          </div>

          {/* Unidade QCG */}
          <div className="input-wrapper_login">
            <FaBuilding className="input-icon_login" />
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="input_login select_login"
              style={{ color: unidade ? undefined : "#aab4cc" }}
            >
              <option value="" disabled>
                Unidade QCG
              </option>
              {UNIDADES.map((u) => (
                <option key={u} value={u} style={{ color: "#1a2a4a" }}>
                  {u}
                </option>
              ))}
            </select>
            {errors.unidade && (
              <span className="error_login">{errors.unidade}</span>
            )}
          </div>

          {/* Tipo de solicitação */}
          <div className="input-wrapper_login">
            <FaKey className="input-icon_login" />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="input_login select_login"
              style={{ color: tipo ? undefined : "#aab4cc" }}
            >
              <option value="" disabled>
                Tipo de solicitação
              </option>
              {TIPOS.map((t) => (
                <option key={t} value={t} style={{ color: "#1a2a4a" }}>
                  {t}
                </option>
              ))}
            </select>
            {errors.tipo && <span className="error_login">{errors.tipo}</span>}
          </div>

          {/* WhatsApp */}
          <div className="input-wrapper_login">
            <FaWhatsapp className="input-icon_login" />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="WhatsApp (81) 9.9999-9999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
              className="input_login"
            />
            {errors.whatsapp && (
              <span className="error_login">{errors.whatsapp}</span>
            )}
          </div>

          <div className="btn-row_login">
            <button
              type="button"
              className="btn_login btn-secondary_login"
              onClick={() => router.push("/login")}
            >
              <FaArrowLeft style={{ marginRight: 8, verticalAlign: "-2px" }} />
              Voltar
            </button>
            <button type="submit" className="btn_login">
              <FaPaperPlane style={{ marginRight: 8, verticalAlign: "-2px" }} />
              Enviar
            </button>
          </div>
        </form>
      </div>

      <div className="card-footer_login">
        <span>Acesso exclusivo para servidores autorizados da PMPE</span>
      </div>
    </>
  );
}
