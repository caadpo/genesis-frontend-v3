"use client";

import "../globals.css";
import "./layout.css";
import "./select-system/page.css";
import "./pjes/page.css";
import "./pjes-diretoria-select/page.css";
import "./pjes-escalas/page.css";
import "./usuarios/page.css";

import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import { useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import PerfilDrawer from "@/src/components/layout/PerfilDrawer";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current) return;

    const show = sessionStorage.getItem("showWelcomeToast");
    if (show) {
      toastShown.current = true;
      sessionStorage.removeItem("showWelcomeToast");
      setTimeout(() => {
        toast.success("Bem-vindo! 👋");
      }, 100);
    }
  }, []);

  return (
    <div className="private-layout">
      <Toaster position="top-right" />

      <Header />
      <div className="content-wrapper">
        <Sidebar />
        <PerfilDrawer />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
