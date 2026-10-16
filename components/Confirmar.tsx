"use client";

// Botão de envio que pede confirmação antes (para exclusões).
export function Confirmar({ msg, children, className = "btn perigo peq" }: { msg: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!confirm(msg)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
