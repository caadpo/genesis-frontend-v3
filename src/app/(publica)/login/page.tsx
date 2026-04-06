"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === "admin" && password === "123") {
      document.cookie = "auth_token=123; path=/";
      router.push("/dashboard");
    } else {
      alert("Usuário ou senha inválidos");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      {/* Input usuário */}
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

      {/* Input senha */}
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

      <button type="submit" className="button">
        ACESSAR
      </button>
    </form>
  );
}