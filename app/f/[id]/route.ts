import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { COOKIE, tokenValido } from "@/lib/auth";
import { db } from "@/lib/db";
import { prefill, TIPOS, type Cliente, type Ficha } from "@/lib/fichas";

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
  const html = await readFile(path.join(process.cwd(), "templates", tipo.arquivo), "utf8");

  const estado = {
    id: ficha.id,
    dados: ficha.dados ? JSON.parse(ficha.dados) : null,
    prefill: prefill(ficha.tipo, cliente),
  };
  const json = JSON.stringify(estado).replace(/</g, "\\u003c");
  const esc = (s: string) =>
    s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
  const tituloPdf = `${tipo.curto} - ${cliente.nome}`;

  const cabeca = `
<style>
.th-bar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:12px;flex-wrap:wrap;
  max-width:780px;margin:0 auto 12px;padding:10px 14px;background:#fff;border:1px solid #F1A8C4;border-radius:12px;
  box-shadow:0 2px 10px rgba(232,93,138,.12);font-size:14px}
.th-bar a{color:#B03A66;text-decoration:none;font-weight:600}
.th-bar .th-nome{flex:1;color:#7a2e4e;min-width:140px}
.th-bar .th-st{font-size:12.5px;color:#2e7d32}
.th-bar .th-st.err{color:#c62828}
.th-bar button{border:1px solid #E85D8A;background:#E85D8A;color:#fff;border-radius:10px;padding:7px 14px;font-size:14px;cursor:pointer}
@media print{.th-bar{display:none!important}}
</style>
<script>
window.FICHA = ${json};
(function(){
  var timer=null, tem=false, pendente=null, url="/api/fichas/"+FICHA.id;
  function st(txt,err){var e=document.getElementById("th-st"); if(e){e.textContent=txt; e.className="th-st"+(err?" err":"");}}
  function put(dados){
    return fetch(url,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({dados:dados})})
      .then(function(r){ if(r.status===401){ location.href="/login"; throw 0; } if(!r.ok) throw 0; });
  }
  function enviar(){
    clearTimeout(timer); timer=null;
    if(!tem) return;
    var d=pendente; tem=false;
    st("Salvando…");
    put(d).then(function(){ if(!tem) st("Salvo ✓ "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})); })
      .catch(function(){ st("Erro ao salvar — verifique a internet",true); if(!tem){ pendente=d; tem=true; } timer=setTimeout(enviar,4000); });
  }
  // usadas pelas fichas no lugar do localStorage
  window.persist=function(dados){ pendente=dados; tem=true; st("Salvando…"); clearTimeout(timer); timer=setTimeout(enviar,700); };
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
<div class="th-bar">
  <a href="/clientes/${esc(cliente.id)}">← Voltar</a>
  <span class="th-nome"><b>${esc(cliente.nome)}</b> · ${esc(tipo.nome)}</span>
  <span id="th-st" class="th-st">Salvo automaticamente</span>
  <button type="button" onclick="window.print()">Imprimir / PDF</button>
</div>`;

  const out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(tituloPdf)}</title>`)
    .replace("</head>", cabeca)
    .replace("<body>", barra);

  return new Response(out, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
