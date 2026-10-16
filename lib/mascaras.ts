// Máscaras e validações brasileiras (usadas no navegador e no servidor).

export const digitos = (v: string) => v.replace(/\D/g, "");

export function mascaraCpf(v: string) {
  const d = digitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function cpfValido(v: string) {
  const d = digitos(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

export function mascaraTelefone(v: string) {
  let d = digitos(v);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraRede(v: string) {
  const t = v.trim().replace(/\s+/g, "");
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return "@" + t.replace(/^@+/, "");
}

export function linkWhatsApp(tel: string | null | undefined) {
  const d = digitos(tel ?? "");
  if (d.length < 10) return null;
  return `https://wa.me/55${d}`;
}

export function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/).filter((x) => x.length > 2 || /^[A-ZÀ-Ú]/.test(x));
  const a = p[0]?.[0] ?? "";
  const b = p.length > 1 ? p[p.length - 1][0] : "";
  return (a + b).toUpperCase();
}
