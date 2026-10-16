import "server-only";
import { createClient, type Client } from "@libsql/client";

// Local: arquivo SQLite em ./data/local.db
// Vercel: banco Turso (libSQL). Aceita TURSO_DATABASE_URL / TURSO_AUTH_TOKEN e também os mesmos
// nomes com prefixo (ex.: STORAGE_TURSO_DATABASE_URL), como algumas integrações do Vercel criam.
function lerEnv(...nomes: string[]): string | undefined {
  for (const n of nomes) {
    const v = process.env[n]?.trim();
    if (v) return v;
  }
  for (const n of nomes) {
    const chave = Object.keys(process.env).find((k) => k.endsWith(`_${n}`) && process.env[k]?.trim());
    if (chave) return process.env[chave]!.trim();
  }
  return undefined;
}

const url = lerEnv("TURSO_DATABASE_URL", "LIBSQL_URL", "TURSO_URL") || "file:./data/local.db";
const authToken = lerEnv("TURSO_AUTH_TOKEN", "LIBSQL_AUTH_TOKEN", "TURSO_TOKEN");

// Em servidor (Vercel), um banco em arquivo ou em memória some a cada deploy — não pode ser usado.
const emServidor = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);
const remoto = /^(libsql|https?|wss?):\/\//i.test(url);

if (emServidor && !remoto) {
  throw new Error(
    "Banco de dados não configurado: defina TURSO_DATABASE_URL (libsql://…) e TURSO_AUTH_TOKEN nas variáveis do Vercel e faça Redeploy. " +
      "Sem isso os dados seriam apagados a cada atualização.",
  );
}

// Informação exibida no menu para conferir qual banco está em uso (sem expor o token).
export const infoBanco = remoto
  ? { tipo: "Turso", local: new URL(url).host, permanente: true }
  : { tipo: "Arquivo local", local: url.replace(/^file:/, ""), permanente: !emServidor };

const g = globalThis as unknown as { __db?: Client; __dbReady?: Promise<void> };

const client = g.__db ?? (g.__db = createClient({ url, authToken }));

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
