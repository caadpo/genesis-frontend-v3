"use client";

import "../globals.css";
import "./layout.css";
import "./select-system/page.css";
import "./pjes/page.css";

import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast"; // 👈 aqui

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const show = sessionStorage.getItem("showWelcomeToast");

    if (show) {
      setTimeout(() => {
        toast.success("Bem-vindo! 👋");
        sessionStorage.removeItem("showWelcomeToast");
      }, 0); // 👈 ESSENCIAL
    }
  }, []);

  return (
    <div className="private-layout">
      {/* 👇 ISSO AQUI É O QUE FALTAVA */}
      <Toaster position="top-right" />

      <Header />
      <div className="content-wrapper">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
