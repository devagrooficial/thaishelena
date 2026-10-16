import "server-only";
import { createClient, type Client } from "@libsql/client";
import { SCHEMA } from "./schema.mjs";

// Local: arquivo SQLite em ./data/local.db
// Vercel: banco Turso (libSQL). Ordem de prioridade:
//   1. BANCO_URL / BANCO_TOKEN  → banco FIXO escolhido por você (recomendado)
//   2. TURSO_DATABASE_URL / TURSO_AUTH_TOKEN (também com prefixo, ex.: STORAGE_TURSO_DATABASE_URL)
function lerEnv(...nomes: string[]): { nome: string; valor: string } | undefined {
  for (const n of nomes) {
    const v = process.env[n]?.trim();
    if (v) return { nome: n, valor: v };
  }
  for (const n of nomes) {
    const chave = Object.keys(process.env).find((k) => k.endsWith(`_${n}`) && process.env[k]?.trim());
    if (chave) return { nome: chave, valor: process.env[chave]!.trim() };
  }
  return undefined;
}

const envUrl = lerEnv("BANCO_URL", "TURSO_DATABASE_URL", "LIBSQL_URL", "TURSO_URL");
const url = envUrl?.valor || "file:./data/local.db";
const authToken = lerEnv("BANCO_TOKEN", "TURSO_AUTH_TOKEN", "LIBSQL_AUTH_TOKEN", "TURSO_TOKEN")?.valor;

// Em servidor (Vercel), um banco em arquivo ou em memória some a cada deploy — não pode ser usado.
const emServidor = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);
const remoto = /^(libsql|https?|wss?):\/\//i.test(url);

if (emServidor && !remoto) {
  throw new Error(
    "Banco de dados não configurado: defina BANCO_URL (libsql://…) e BANCO_TOKEN nas variáveis do Vercel e faça Redeploy. " +
      "Sem isso os dados seriam apagados a cada atualização.",
  );
}

const host = remoto ? new URL(url).host : "";
// A integração Turso do Vercel pode criar um banco por deploy (nome começando com "dpl-", o ID do deploy):
// cada atualização ganharia um banco vazio. Isso é tratado como NÃO permanente.
const porDeploy = /^dpl-/i.test(host);

// Informação exibida no menu para conferir qual banco está em uso (sem expor o token).
export const infoBanco = remoto
  ? { tipo: porDeploy ? "Turso (por deploy!)" : "Turso", local: host, variavel: envUrl?.nome ?? "", permanente: !porDeploy }
  : { tipo: "Arquivo local", local: url.replace(/^file:/, ""), variavel: envUrl?.nome ?? "", permanente: !emServidor };

const g = globalThis as unknown as { __db?: Client; __dbReady?: Promise<void> };

const client = g.__db ?? (g.__db = createClient({ url, authToken }));



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
