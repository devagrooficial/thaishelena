import { createHmac, timingSafeEqual } from "node:crypto";

// Credenciais vêm das variáveis de ambiente (Vercel → Settings → Environment Variables):
//   ADMIN_USER, ADMIN_PASSWORD e AUTH_SECRET (texto aleatório longo).
export const COOKIE = "th_sessao";
export const DURACAO_S = 60 * 60 * 24 * 30; // 30 dias

function segredo() {
  const s = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("Defina ADMIN_USER, ADMIN_PASSWORD e AUTH_SECRET nas variáveis de ambiente.");
  return s;
}

const assinar = (dado: string) => createHmac("sha256", segredo()).update(dado).digest("base64url");

function iguais(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function credenciaisValidas(usuario: string, senha: string) {
  const u = process.env.ADMIN_USER;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  // avalia os dois para não vazar qual campo errou
  const okU = iguais(usuario.trim().toLowerCase(), u.trim().toLowerCase());
  const okP = iguais(senha, p);
  return okU && okP;
}

export function criarToken(usuario: string) {
  const exp = Math.floor(Date.now() / 1000) + DURACAO_S;
  const corpo = `${Buffer.from(usuario).toString("base64url")}.${exp}`;
  return `${corpo}.${assinar(corpo)}`;
}

export function tokenValido(token: string | undefined): boolean {
  if (!token) return false;
  const partes = token.split(".");
  if (partes.length !== 3) return false;
  const [u, exp, sig] = partes;
  if (!iguais(sig, assinar(`${u}.${exp}`))) return false;
  return Number(exp) > Date.now() / 1000;
}
