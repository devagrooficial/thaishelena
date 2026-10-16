"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COOKIE, DURACAO_S, credenciaisValidas, criarToken } from "@/lib/auth";
import { exigirLogin } from "@/lib/sessao";
import { agora, db, novoId } from "@/lib/db";
import { isTipo, TIPOS } from "@/lib/fichas";

// ---------------- login ----------------

export async function entrar(_: string | null, form: FormData): Promise<string | null> {
  const usuario = String(form.get("usuario") ?? "");
  const senha = String(form.get("senha") ?? "");
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    return "Sistema sem usuário configurado (ADMIN_USER / ADMIN_PASSWORD).";
  }
  if (!credenciaisValidas(usuario, senha)) {
    await new Promise((r) => setTimeout(r, 600));
    return "Usuário ou senha incorretos.";
  }
  (await cookies()).set(COOKIE, criarToken(usuario), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_S,
  });
  redirect("/");
}

export async function sair() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

// ---------------- clientes ----------------

const CAMPOS = ["nome", "cpf", "nascimento", "telefone", "email", "endereco", "rede_social", "sexo", "observacoes"] as const;

function lerCliente(form: FormData) {
  const v: Record<string, string | null> = {};
  for (const c of CAMPOS) {
    const x = String(form.get(c) ?? "").trim();
    v[c] = x || null;
  }
  return v;
}

export async function criarCliente(form: FormData) {
  await exigirLogin();
  const v = lerCliente(form);
  if (!v.nome) throw new Error("Nome é obrigatório");
  const id = novoId();
  const t = agora();
  const c = await db();
  await c.execute({
    sql: `INSERT INTO clientes (id, ${CAMPOS.join(", ")}, created_at, updated_at)
          VALUES (?, ${CAMPOS.map(() => "?").join(", ")}, ?, ?)`,
    args: [id, ...CAMPOS.map((k) => v[k]), t, t],
  });
  revalidatePath("/", "layout");
  redirect(`/clientes/${id}`);
}

export async function atualizarCliente(id: string, form: FormData) {
  await exigirLogin();
  const v = lerCliente(form);
  if (!v.nome) throw new Error("Nome é obrigatório");
  const c = await db();
  await c.execute({
    sql: `UPDATE clientes SET ${CAMPOS.map((k) => `${k} = ?`).join(", ")}, updated_at = ? WHERE id = ?`,
    args: [...CAMPOS.map((k) => v[k]), agora(), id],
  });
  revalidatePath("/", "layout");
  redirect(`/clientes/${id}?salvo=1`);
}

export async function excluirCliente(id: string) {
  await exigirLogin();
  const c = await db();
  await c.batch(
    [
      { sql: "DELETE FROM fichas WHERE cliente_id = ?", args: [id] },
      { sql: "DELETE FROM clientes WHERE id = ?", args: [id] },
    ],
    "write",
  );
  revalidatePath("/", "layout");
  redirect("/clientes");
}

// ---------------- fichas ----------------

export async function criarFicha(clienteId: string, tipo: string) {
  await exigirLogin();
  if (!isTipo(tipo)) throw new Error("Tipo de ficha inválido");
  const id = novoId();
  const t = agora();
  const c = await db();
  await c.execute({
    sql: "INSERT INTO fichas (id, cliente_id, tipo, titulo, dados, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?)",
    args: [id, clienteId, tipo, TIPOS[tipo].nome, t, t],
  });
  revalidatePath("/", "layout");
  redirect(`/f/${id}`);
}

export async function duplicarFicha(fichaId: string) {
  await exigirLogin();
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM fichas WHERE id = ?", args: [fichaId] });
  const f = r.rows[0];
  if (!f) throw new Error("Ficha não encontrada");
  const id = novoId();
  const t = agora();
  await c.execute({
    sql: "INSERT INTO fichas (id, cliente_id, tipo, titulo, dados, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, f.cliente_id, f.tipo, `${f.titulo ?? ""} (cópia)`, f.dados, t, t],
  });
  revalidatePath("/", "layout");
  redirect(`/clientes/${f.cliente_id}`);
}

export async function excluirFicha(fichaId: string, clienteId: string) {
  await exigirLogin();
  const c = await db();
  await c.execute({ sql: "DELETE FROM fichas WHERE id = ?", args: [fichaId] });
  revalidatePath("/", "layout");
  redirect(`/clientes/${clienteId}`);
}
