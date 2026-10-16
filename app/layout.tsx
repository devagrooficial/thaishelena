import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fonte = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--fonte" });

export const metadata: Metadata = {
  title: "Espaço Thaís Helena",
  description: "Fichas e cadastro de clientes",
  appleWebApp: { title: "Thaís Helena", capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#d6457a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={fonte.variable}>
      <body>{children}</body>
    </html>
  );
}
