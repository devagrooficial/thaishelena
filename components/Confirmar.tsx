"use client";

// Botão de envio que pede confirmação antes (para exclusões).
export function Confirmar({
  msg, children, className = "btn perigo peq", titulo,
}: { msg: string; children: React.ReactNode; className?: string; titulo?: string }) {
  return (
    <button
      className={className}
      title={titulo}
      aria-label={titulo}
      onClick={(e) => {
        if (!confirm(msg)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
