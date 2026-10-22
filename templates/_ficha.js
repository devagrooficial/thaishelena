// Motor comum das fichas no padrão atual (anamneses e orçamentos).
// Cada modelo traz só a marcação; aqui ficam carregar/salvar, tabelas com linhas e os cálculos.
//
// Dados salvos: { campos: {id: valor}, checks: {id: marcado}, <id da tabela>: [[valores da linha]] }
// Valores iniciais do modelo: bloco JSON id="padrao" no fim do modelo, com { "campos": {}, "tabelas": {} }
// Tabela com linhas: <table class="dyn" id="X"> + <template id="linha-X"> + <button class="btn add" data-tabela="X">
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var todos = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };
  var padrao = {};
  try { padrao = JSON.parse(($("padrao") || {}).textContent || "{}"); } catch (e) {}
  var tabelasPadrao = padrao.tabelas || {};

  function numBR(s) {
    s = String(s || "").replace(/[^\d,.-]/g, "");
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if (/\.\d{3}$/.test(s)) s = s.replace(/\./g, "");
    return parseFloat(s) || 0;
  }
  var brl = function (x) { return x.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  var valor = function (id) { var el = $(id); return el ? el.value : ""; };
  var definir = function (id, v) { var el = $(id); if (el) el.value = v; };

  // ---------- tabelas com linhas ----------
  function addLinha(tab, d) {
    var tpl = $("linha-" + tab.id);
    if (!tpl) return;
    var r = tab.insertRow();
    r.innerHTML = tpl.innerHTML;
    var del = r.querySelector(".del");
    if (del) del.addEventListener("click", function () { r.remove(); salvar(); });
    if (d) todos("input,select", r).forEach(function (el, n) { if (d[n] !== undefined && d[n] !== null) el.value = d[n]; });
  }
  function linhas(tab) { return todos("tr", tab).filter(function (tr) { return !tr.querySelector("th"); }); }
  todos(".add[data-tabela]").forEach(function (b) {
    b.addEventListener("click", function () { addLinha($(b.dataset.tabela)); salvar(); });
  });

  // ---------- cálculos ----------
  function calcIdade() {
    var n = valor("nascimento"), el = $("idade");
    if (!el) return;
    if (!n) { el.value = ""; return; }
    var hoje = new Date(), nasc = new Date(n + "T00:00:00");
    var i = hoje.getFullYear() - nasc.getFullYear(), m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) i--;
    el.value = i >= 0 ? i + " anos" : "";
  }
  // textos que repetem um campo (nome no termo, meses de manutenção…)
  function espelhos() {
    todos("[data-espelho]").forEach(function (el) {
      var v = valor(el.dataset.espelho).trim();
      el.textContent = v || el.dataset.vazio || "________________";
    });
  }
  // orçamento: qtd × valor unitário, total, à vista com desconto e parcela no cartão
  function calcOrc() {
    var tab = $("orc");
    if (!tab) return;
    var tot = 0;
    linhas(tab).forEach(function (tr) {
      var q = tr.querySelector(".q"), v = tr.querySelector(".v"), t = tr.querySelector(".t");
      if (!q || !v) return;
      // sem quantidade conta 1 (ex.: reavaliação final)
      var x = (q.value.trim() ? numBR(q.value) : 1) * numBR(v.value);
      tot += x;
      if (t) t.value = x ? brl(x) : "";
    });
    definir("orc_total", tot ? brl(tot) : "");
    var desc = numBR(valor("desconto")) || 0;
    definir("orc_avista", tot ? brl(tot * (1 - desc / 100)) : "");
    var p = Math.round(numBR(valor("parcelas")));
    definir("orc_parcela", tot && p > 0 ? p + "x de " + brl(tot / p) : "");
  }
  // anamnese: total pago e saldo = valor do protocolo − pago (sem valor, soma dos pendentes)
  function calcPag() {
    var tab = $("pagamentos");
    if (!tab) return;
    var pago = 0, pend = 0;
    linhas(tab).forEach(function (tr) {
      var v = numBR((tr.querySelector(".val") || {}).value), st = (tr.querySelector(".st") || {}).value;
      if (st === "Pago") pago += v; else if (st === "Pendente") pend += v;
    });
    var total = numBR(valor("valor_total"));
    var falta = total > 0 ? Math.max(total - pago, 0) : pend;
    var quitado = total > 0 && falta === 0 && pago > 0;
    definir("total_pago", pago ? brl(pago) : "");
    var s = $("saldo");
    if (s) { s.value = quitado ? "Quitado ✓" : (falta || total ? brl(falta) : ""); s.classList.toggle("quitado", quitado); }
  }

  // ---------- salvar / carregar ----------
  function coletar() {
    var v = { campos: {}, checks: {} };
    todos(".in[id]").forEach(function (i) { v.campos[i.id] = i.value; });
    todos("input[type=checkbox][id],input[type=radio][id]").forEach(function (i) { v.checks[i.id] = i.checked; });
    todos("table.dyn").forEach(function (tab) {
      v[tab.id] = linhas(tab).map(function (tr) { return todos("input,select", tr).map(function (i) { return i.value; }); });
    });
    return v;
  }
  // datas e listas vazias somem na impressão (em vez de "dd/mm/aaaa" e "—")
  function marcarVazios() { todos("input[type=date],select").forEach(function (el) { el.classList.toggle("vazio", !el.value); }); }
  function recalcular() { calcIdade(); espelhos(); calcOrc(); calcPag(); marcarVazios(); }
  window.salvar = function () { recalcular(); persist(coletar()); };
  window.limpar = function () { if (confirm("Apagar todos os dados preenchidos?")) limparFicha(); };

  function aplicar(campos, checks) {
    Object.keys(campos || {}).forEach(function (k) { var el = $(k); if (el && el.type !== "checkbox" && el.type !== "radio") el.value = campos[k]; });
    Object.keys(checks || {}).forEach(function (k) { var el = $(k); if (el) el.checked = !!checks[k]; });
  }
  var salvo = FICHA.dados;
  if (salvo) {
    aplicar(salvo.campos, salvo.checks);
  } else {
    var ini = Object.assign({}, padrao.campos || {}, FICHA.prefill || {});
    var campos = {}, checks = {};
    Object.keys(ini).forEach(function (k) { (typeof ini[k] === "boolean" ? checks : campos)[k] = ini[k]; });
    aplicar(campos, checks);
  }
  todos("table.dyn").forEach(function (tab) {
    var d = salvo && salvo[tab.id] && salvo[tab.id].length ? salvo[tab.id] : tabelasPadrao[tab.id] || [[], [], []];
    d.forEach(function (l) { addLinha(tab, l); });
  });
  recalcular();

  var cpf = $("cpf");
  if (cpf) cpf.addEventListener("input", function () {
    var v = cpf.value.replace(/\D/g, "").slice(0, 11);
    cpf.value = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });
  document.body.addEventListener("input", salvar);
  document.body.addEventListener("change", function (e) {
    var t = e.target;
    if (t.type === "checkbox" || t.type === "radio" || t.type === "date" || t.tagName === "SELECT") salvar();
  });
})();
