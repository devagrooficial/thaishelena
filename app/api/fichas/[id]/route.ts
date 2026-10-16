import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, tokenValido } from "@/lib/auth";
import { agora, db } from "@/lib/db";

// Salvamento automático das fichas. POST também é aceito por causa do sendBeacon (ao fechar a aba).
async function salvar(req: Request, { params }: RouteContext<"/api/fichas/[id]">) {
  if (!tokenValido((await cookies()).get(COOKIE)?.value)) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
  }
  const { id } = await params;
  const corpo = (await req.json().catch(() => undefined)) as { dados?: unknown; titulo?: string } | undefined;
  if (!corpo || !("dados" in corpo)) {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }
  const dados = corpo.dados === null ? null : JSON.stringify(corpo.dados);
  if (dados && dados.length > 2_000_000) {
    return NextResponse.json({ erro: "ficha grande demais" }, { status: 413 });
  }
  const t = agora();
  const c = await db();
  const r = await c.execute({
    sql: "UPDATE fichas SET dados = ?, updated_at = ? WHERE id = ? RETURNING cliente_id",
    args: [dados, t, id],
  });
  if (!r.rows.length) return NextResponse.json({ erro: "ficha não encontrada" }, { status: 404 });
  await c.execute({
    sql: "UPDATE clientes SET updated_at = ? WHERE id = ?",
    args: [t, r.rows[0].cliente_id],
  });
  return NextResponse.json({ ok: true, updated_at: t });
}

export const PUT = salvar;
export const POST = salvar;
