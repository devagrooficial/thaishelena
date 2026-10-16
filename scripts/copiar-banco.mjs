// Copia clientes e fichas de um banco Turso (ORIGEM) para outro (DESTINO), sem apagar nada.
// Registros que já existem no destino (mesmo id) ficam como estão.
//
// Uso (no terminal, dentro da pasta do projeto):
//   ORIGEM_URL=libsql://dpl-....turso.io ORIGEM_TOKEN=... \
//   BANCO_URL=libsql://thaishelena-....turso.io BANCO_TOKEN=... \
//   node scripts/copiar-banco.mjs
import { createClient } from "@libsql/client";
import { SCHEMA } from "../lib/schema.mjs";

const { ORIGEM_URL, ORIGEM_TOKEN, BANCO_URL, BANCO_TOKEN } = process.env;
if (!ORIGEM_URL || !BANCO_URL) {
  console.error("Defina ORIGEM_URL (e ORIGEM_TOKEN) e BANCO_URL (e BANCO_TOKEN).");
  process.exit(1);
}
if (ORIGEM_URL === BANCO_URL) {
  console.error("Origem e destino são o mesmo banco.");
  process.exit(1);
}

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
