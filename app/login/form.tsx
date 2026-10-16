"use client";

import { useActionState, useState } from "react";
import { entrar } from "../actions";

export function LoginForm() {
  const [erro, acao, enviando] = useActionState(entrar, null);
  const [usuario, setUsuario] = useState("");
  const [ver, setVer] = useState(false);
  return (
    <form action={acao}>
      <label className="campo">
        <span className="rot">Usuário</span>
        <input className="in" name="usuario" autoComplete="username" autoCapitalize="none" required autoFocus
          value={usuario} onChange={(e) => setUsuario(e.target.value)} />
      </label>
      <label className="campo">
        <span className="rot">Senha</span>
        <span style={{ position: "relative", display: "block" }}>
          <input className="in" name="senha" type={ver ? "text" : "password"} autoComplete="current-password" required style={{ paddingRight: 70 }} />
          <button type="button" className="btn fant peq" onClick={() => setVer(!ver)}
            style={{ position: "absolute", right: 5, top: 5, minHeight: 34 }}>
            {ver ? "Ocultar" : "Mostrar"}
          </button>
        </span>
      </label>
      {erro && <div className="faixa erro" style={{ margin: 0 }}>{erro}</div>}
      <button className="btn bloco" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
