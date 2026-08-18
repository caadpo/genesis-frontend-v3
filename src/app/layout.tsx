import ToastProvider from "../components/providers/ToastProvider";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "GENESIS 1.1",
  description: "Sistema de Controle",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo_dpo.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // ou "default"
    title: "GENESIS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
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
