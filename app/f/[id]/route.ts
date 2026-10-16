import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { COOKIE, tokenValido } from "@/lib/auth";
import { db } from "@/lib/db";
import { prefill, TIPOS, type Cliente, type Ficha, type TipoFicha } from "@/lib/fichas";

// campos das fichas que recebem máscara extra (o CPF já tem máscara no próprio modelo)
const MASCARAS: Partial<Record<TipoFicha, Record<string, "tel">>> = {
  anamnese_estrias: { c2: "tel" },
};

// Abre uma ficha: devolve o modelo HTML original com os dados salvos injetados
// e uma barra superior (voltar / status de salvamento). A barra some na impressão.
export async function GET(req: Request, { params }: RouteContext<"/f/[id]">) {
  if (!tokenValido((await cookies()).get(COOKIE)?.value)) {
    return Response.redirect(new URL("/login", req.url));
  }
  const { id } = await params;
  const c = await db();
  const rf = await c.execute({ sql: "SELECT * FROM fichas WHERE id = ?", args: [id] });
  const ficha = rf.rows[0] as unknown as Ficha | undefined;
  if (!ficha) return new Response("Ficha não encontrada", { status: 404 });
  const rc = await c.execute({ sql: "SELECT * FROM clientes WHERE id = ?", args: [ficha.cliente_id] });
  const cliente = rc.rows[0] as unknown as Cliente;

  const tipo = TIPOS[ficha.tipo];

  const [html, temaCss, temaJs] = await Promise.all(
    [tipo.arquivo, "_tema.css", "_tema.js"].map((f) => readFile(path.join(process.cwd(), "templates", f), "utf8")),
  );

  const estado = {
    id: ficha.id,
    dados: ficha.dados ? JSON.parse(ficha.dados) : null,
    prefill: prefill(ficha.tipo, cliente),
    mascaras: MASCARAS[ficha.tipo] ?? {},
  };
  const json = JSON.stringify(estado).replace(/</g, "\\u003c");
  const esc = (s: string) =>
    s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
  const tituloPdf = `${tipo.curto} - ${cliente.nome}`;

  const cabeca = `
<meta name="theme-color" content="#d6457a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
${temaCss}
</style>
<script>
window.FICHA = ${json};
(function(){
  var timer=null, tem=false, pendente=null, url="/api/fichas/"+FICHA.id;
  function st(txt,cls){var e=document.getElementById("th-st"); if(e){e.querySelector(".txt").textContent=txt; e.className="th-st"+(cls?" "+cls:""); e.title=txt;}}
  function put(dados){
    return fetch(url,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({dados:dados})})
      .then(function(r){ if(r.status===401){ location.href="/login"; throw 0; } if(!r.ok) throw 0; });
  }
  function enviar(){
    clearTimeout(timer); timer=null;
    if(!tem) return;
    var d=pendente; tem=false;
    st("Salvando…","salvando");
    put(d).then(function(){ if(!tem) st("Salvo às "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})); })
      .catch(function(){ st("Erro ao salvar — verifique a internet","err"); if(!tem){ pendente=d; tem=true; } timer=setTimeout(enviar,4000); });
  }
  // usadas pelas fichas no lugar do localStorage
  window.persist=function(dados){ pendente=dados; tem=true; st("Salvando…","salvando"); clearTimeout(timer); timer=setTimeout(enviar,700); };
  window.persistAgora=enviar;
  window.limparFicha=function(){ tem=false; clearTimeout(timer); put(null).then(function(){ location.reload(); }); };
  window.addEventListener("pagehide",function(){
    if(tem) navigator.sendBeacon(url,new Blob([JSON.stringify({dados:pendente})],{type:"application/json"}));
  });
  window.addEventListener("beforeprint",enviar);
})();
</script>
</head>`;
  const barra = `<body>
<header class="th-bar"><div class="th-bar-in">
  <a class="th-voltar" href="/clientes/${esc(cliente.id)}" title="Voltar para a pasta da cliente" aria-label="Voltar">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
  </a>
  <span class="th-logo">TH</span>
  <div class="th-tit"><b>${esc(cliente.nome)}</b><small>${esc(tipo.nome)}</small></div>
  <span id="th-st" class="th-st" title="Salvo automaticamente"><span class="txt">Salvo automaticamente</span></span>
  <button type="button" class="th-print" onclick="window.print()" title="Imprimir ou salvar em PDF">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>
    <span>Imprimir / PDF</span>
  </button>
</div></header>`;

  const out = html
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(tituloPdf)}</title>`)
    .replace("</head>", () => cabeca)
    .replace("<body>", () => barra)
    .replace(/<\/body>(?![\s\S]*<\/body>)/, () => `<script>\n${temaJs}\n</script>\n</body>`);

  return new Response(out, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
