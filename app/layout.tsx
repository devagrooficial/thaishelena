import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Espaço Thaís Helena",
  description: "Fichas e cadastro de clientes",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
