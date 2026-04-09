"use client";

// Incluir os CSS das subpastas. Cuidado com conflito de classes
import "../globals.css";
import "./layout.css";
import "./select-system/page.css";
import "./pjes/page.css";
// Incluir os CSS das subpastas. Cuidado com conflito de classes

import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
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
      sessionStorage.removeItem("showWelcomeToast");
    }
  }, []);

  return (
    <div className="private-layout">
      <Header />
      <div className="content-wrapper">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
