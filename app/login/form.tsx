"use client";

import { useActionState } from "react";
import { entrar } from "../actions";

export function LoginForm() {
  const [erro, acao, enviando] = useActionState(entrar, null);
  return (
    <form action={acao}>
      <label className="campo">
        Usuário
        <input className="in" name="usuario" autoComplete="username" required autoFocus />
      </label>
      <label className="campo">
        Senha
        <input className="in" name="senha" type="password" autoComplete="current-password" required />
      </label>
      {erro && <div className="erro">{erro}</div>}
      <button className="btn" style={{ justifyContent: "center" }} disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
