"use client"; // ✅ Adicione esta linha no topo

import "../globals.css";
import "./layout.css";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const show = sessionStorage.getItem("showWelcomeToast");
    if (show) {
      toast.success("Bem-vindo! 👋");
      sessionStorage.removeItem("showWelcomeToast"); // remove pra não mostrar de novo
    }
  }, []);

  return (
    <div className="private-layout">
      <Header />
      <div className="content-wrapper">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
      <Toaster /> {/* ✅ Toasts vão aparecer aqui */}
    </div>
  );
}
