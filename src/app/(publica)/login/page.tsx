"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaLock, FaUser } from "react-icons/fa";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
});

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const validation = loginSchema.safeParse({ username, password });
    if (!validation.success) {
      const fieldErrors: { username?: string; password?: string } = {};
      validation.error.issues.forEach((err: z.ZodIssue) => {
        const field = err.path[0] as "username" | "password";
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mat: username,
        password: password,
      }),
    });

    if (!response.ok) {
      toast.error("Usuário ou senha inválidos");
      setLoading(false);
      return;
    }

    sessionStorage.setItem("showWelcomeToast", "1");
    router.replace("/select-system");
  };

  return (
    <>
      <div className="card-body_login">
        <p className="section-label_login">Acesso Restrito ao Sistema</p>

        <form onSubmit={handleSubmit}>
          {/* Usuário */}
          <div className="input-wrapper_login">
            <FaUser className="input-icon_login" />
            <input
              type="number"
              placeholder="Matrícula"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input_login"
            />
            {errors.username && (
              <span className="error_login">{errors.username}</span>
            )}
          </div>

          {/* Senha */}
          <div className="input-wrapper_login">
            <FaLock className="input-icon_login" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input_login"
            />
            {errors.password && (
              <span className="error_login">{errors.password}</span>
            )}
          </div>

          <button type="submit" className="btn_login" disabled={loading}>
            {loading ? "Verificando..." : "Acessar o Sistema"}
          </button>
        </form>
      </div>

      <div className="card-footer_login">
        <span>Acesso exclusivo para servidores autorizados da PMPE</span>
      </div>
    </>
  );
}
