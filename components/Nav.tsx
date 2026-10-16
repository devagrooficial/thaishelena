"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "./Icone";

const ITENS = [
  { href: "/", rot: "Início", ic: "inicio" },
  { href: "/clientes", rot: "Clientes", ic: "clientes" },
  { href: "/clientes/nova", rot: "Nova cliente", ic: "novo" },
];

function ativo(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/clientes") return path.startsWith("/clientes") && path !== "/clientes/nova";
  return path === href;
}

export function Nav({ tipo }: { tipo: "lateral" | "inferior" }) {
  const path = usePathname();
  return (
    <nav className={tipo === "lateral" ? "nav-lat" : "tabbar"} aria-label="Menu principal">
      {ITENS.map((i) => (
        <Link key={i.href} href={i.href} className={ativo(path, i.href) ? "ativo" : undefined}
          aria-current={ativo(path, i.href) ? "page" : undefined}>
          <Icone n={i.ic} s={tipo === "lateral" ? 19 : 22} />
          <span>{tipo === "inferior" && i.href === "/clientes/nova" ? "Nova" : i.rot}</span>
        </Link>
      ))}
    </nav>
  );
}
