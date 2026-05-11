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
    <form onSubmit={handleSubmit} className="formLogin">
      <div className="input-wrapperLogin">
        <FaUser className="input-iconLogin" />
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="inputLogin with-icon"
        />
        {errors.username && <span className="error">{errors.username}</span>}
      </div>

      <div className="input-wrapperLogin">
        <FaLock className="input-iconLogin" />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="inputLogin with-icon"
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <button type="submit" className="buttonLogin" disabled={loading}>
        {loading ? "Carregando..." : "ACESSAR"}
      </button>
    </form>
  );
}
