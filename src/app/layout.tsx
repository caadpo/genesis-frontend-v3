import ToastProvider from "../components/providers/ToastProvider";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GENESIS 3.0",
  description: "Sistema de Controle",
  icons: {
    icon: "/logo_dpo.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
