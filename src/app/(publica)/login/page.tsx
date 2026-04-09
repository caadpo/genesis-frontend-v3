"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginSei: username, password }),
        credentials: "include", // IMPORTANTE para cookies
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Usuário ou senha inválidos");
        return;
      }

      // Redireciona para a página privada
      sessionStorage.setItem("showWelcomeToast", "true"); //grava pra mostrar o toast
      window.location.href = "/select-system";
    } catch (err) {
      console.error(err);
      alert("Erro interno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="input-wrapper">
        <FaUser className="input-icon" />
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input with-icon"
        />
      </div>

      <div className="input-wrapper">
        <FaLock className="input-icon" />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input with-icon"
        />
      </div>

      <button type="submit" className="button" disabled={loading}>
        {loading ? "Carregando..." : "ACESSAR"}
      </button>
    </form>
  );
}
