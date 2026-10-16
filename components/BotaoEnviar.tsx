"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

// Botão de salvar que avisa claramente quando algum campo impede o envio
// (ex.: CPF inválido), em vez de depender só do balão do navegador.
export function BotaoEnviar({ children, className = "btn" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const [aviso, setAviso] = useState<string | null>(null);
  return (
    <>
      {aviso && <div className="faixa erro form-aviso" role="alert">{aviso}</div>}
      <button
        className={className}
        disabled={pending}
        onClick={(e) => {
          const form = e.currentTarget.form;
          if (!form) return;
          const invalido = form.querySelector<HTMLInputElement>(":invalid");
          if (invalido) {
            const rotulo = invalido.closest(".campo")?.querySelector(".rot")?.textContent?.replace("*", "").trim();
            setAviso(`Não foi salvo: ${invalido.validationMessage || "campo inválido"}${rotulo ? ` (${rotulo})` : ""}.`);
            invalido.scrollIntoView({ block: "center", behavior: "smooth" });
          } else {
            setAviso(null);
          }
        }}
      >
        {pending ? "Salvando…" : children}
      </button>
    </>
  );
}
