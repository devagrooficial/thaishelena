"use client";

import { useFormStatus } from "react-dom";

export function BotaoEnviar({ children, className = "btn" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? "Salvando…" : children}
    </button>
  );
}
