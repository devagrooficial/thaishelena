"use client";

import { useState } from "react";
import { cpfValido, digitos, mascaraCpf, mascaraRede, mascaraTelefone } from "@/lib/mascaras";

type Base = { name: string; defaultValue?: string; label: string; className?: string; dica?: string };

export function CampoCpf({ name, defaultValue = "", label, className }: Base) {
  const [v, setV] = useState(mascaraCpf(defaultValue));
  const completo = digitos(v).length === 11;
  const invalido = completo && !cpfValido(v);
  const incompleto = v !== "" && !completo;
  return (
    <label className={`campo ${className ?? ""}`}>
      <span className="rot">{label}</span>
      <input
        className={`in${invalido ? " inval" : ""}`}
        name={name}
        value={v}
        inputMode="numeric"
        autoComplete="off"
        placeholder="000.000.000-00"
        onChange={(e) => {
          const m = mascaraCpf(e.target.value);
          setV(m);
          const d = digitos(m);
          e.target.setCustomValidity(d.length === 11 && !cpfValido(m) ? "CPF inválido" : d.length && d.length < 11 ? "CPF incompleto" : "");
        }}
      />
      {invalido && <span className="msg-erro">CPF inválido — confira os números</span>}
      {incompleto && <span className="dica">{11 - digitos(v).length} dígitos faltando</span>}
      {completo && !invalido && <span className="msg-ok">CPF válido ✓</span>}
    </label>
  );
}

export function CampoTelefone({ name, defaultValue = "", label, className }: Base) {
  const [v, setV] = useState(mascaraTelefone(defaultValue));
  return (
    <label className={`campo ${className ?? ""}`}>
      <span className="rot">{label}</span>
      <input
        className="in"
        name={name}
        value={v}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(00) 00000-0000"
        onChange={(e) => {
          const m = mascaraTelefone(e.target.value);
          setV(m);
          const n = digitos(m).length;
          e.target.setCustomValidity(n && n < 10 ? "Telefone incompleto" : "");
        }}
      />
    </label>
  );
}

export function CampoRede({ name, defaultValue = "", label, className }: Base) {
  const [v, setV] = useState(defaultValue);
  return (
    <label className={`campo ${className ?? ""}`}>
      <span className="rot">{label}</span>
      <input
        className="in"
        name={name}
        value={v}
        autoComplete="off"
        autoCapitalize="none"
        placeholder="@usuario"
        onChange={(e) => setV(e.target.value)}
        onBlur={() => setV(mascaraRede(v))}
      />
    </label>
  );
}
