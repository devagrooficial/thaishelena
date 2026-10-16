import "server-only";
import { createClient, type Client } from "@libsql/client";

// Local: arquivo SQLite em ./data/local.db
// Vercel: banco Turso (libSQL) via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
const url = process.env.TURSO_DATABASE_URL || "file:./data/local.db";

if (process.env.VERCEL && url.startsWith("file:")) {
  throw new Error(
    "Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no Vercel — o disco do Vercel não guarda arquivos.",
  );
}

const g = globalThis as unknown as { __db?: Client; __dbReady?: Promise<void> };

const client =
  g.__db ??
  (g.__db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }));

const SCHEMA = `
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT, nascimento TEXT, telefone TEXT, email TEXT,
  endereco TEXT, rede_social TEXT, sexo TEXT, observacoes TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fichas (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT,
  dados TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS fichas_cliente ON fichas(cliente_id);
CREATE INDEX IF NOT EXISTS clientes_nome ON clientes(nome);
`;

export async function db(): Promise<Client> {
  if (!g.__dbReady) {
    g.__dbReady = (async () => {
      if (url.startsWith("file:")) {
        const fs = await import("node:fs");
        fs.mkdirSync("./data", { recursive: true });
      }
      await client.executeMultiple(SCHEMA);
    })().catch((e) => {
      g.__dbReady = undefined;
      throw e;
    });
  }
  await g.__dbReady;
  return client;
}

export const agora = () => new Date().toISOString();
export const novoId = () => crypto.randomUUID();
