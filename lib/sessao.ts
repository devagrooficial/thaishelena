import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, tokenValido } from "./auth";

// Checagem completa no servidor (além da do proxy.ts).
export async function exigirLogin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!tokenValido(token)) redirect("/login");
}
