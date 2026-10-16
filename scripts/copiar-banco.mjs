// Copia clientes e fichas de um banco Turso (ORIGEM) para outro (DESTINO), sem apagar nada.
// Registros que já existem no destino (mesmo id) ficam como estão.
//
// Uso (no terminal, dentro da pasta do projeto):
//   node scripts/copiar-banco.mjs
// O script pergunta as URLs e os tokens. Também aceita ORIGEM_URL, ORIGEM_TOKEN, BANCO_URL e BANCO_TOKEN
// como variáveis de ambiente.
import { createClient } from "@libsql/client";
import { createInterface } from "node:readline/promises";
import { SCHEMA } from "../lib/schema.mjs";

const rl = createInterface({ input: process.stdin, output: process.stdout });
async function pedir(nome, pergunta) {
  let v = process.env[nome]?.trim();
  while (!v || v.includes("...") || v.includes("seu-banco")) {
    if (v) console.log(`  "${v}" parece ser o texto de exemplo — cole o valor real.`);
    v = (await rl.question(pergunta)).trim();
  }
  return v;
}
const url = (v) => (/^(libsql|https?|wss?|file):/.test(v) ? v : `libsql://${v}`);

console.log("Cópia de dados entre bancos Turso (nada é apagado).\n");
const ORIGEM_URL = url(await pedir("ORIGEM_URL", "URL do banco ANTIGO (o que começa com dpl-): "));
const ORIGEM_TOKEN = await pedir("ORIGEM_TOKEN", "Token do banco ANTIGO: ");
const BANCO_URL = url(await pedir("BANCO_URL", "URL do banco FIXO (o mesmo do BANCO_URL no Vercel): "));
const BANCO_TOKEN = await pedir("BANCO_TOKEN", "Token do banco FIXO: ");
rl.close();

if (ORIGEM_URL === BANCO_URL) {
  console.error("Origem e destino são o mesmo banco.");
  process.exit(1);
}
console.log(`\nDe:   ${new URL(ORIGEM_URL).host}\nPara: ${new URL(BANCO_URL).host}\n`);

const origem = createClient({ url: ORIGEM_URL, authToken: ORIGEM_TOKEN });
const destino = createClient({ url: BANCO_URL, authToken: BANCO_TOKEN });
await destino.executeMultiple(SCHEMA);

for (const tabela of ["clientes", "fichas"]) {
  const { rows, columns } = await origem.execute(`SELECT * FROM ${tabela}`);
  if (!rows.length) {
    console.log(`${tabela}: nada para copiar`);
    continue;
  }
  const sql = `INSERT OR IGNORE INTO ${tabela} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
  const res = await destino.batch(rows.map((r) => ({ sql, args: columns.map((c) => r[c]) })), "write");
  const copiados = res.reduce((n, r) => n + r.rowsAffected, 0);
  console.log(`${tabela}: ${copiados} copiados, ${rows.length - copiados} já existiam`);
}
console.log("Pronto.");
