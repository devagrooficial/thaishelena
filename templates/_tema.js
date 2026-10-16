// Comportamentos extras das fichas (carregado depois do script original de cada ficha).
(function () {
  // --- rótulos das colunas nas células (no celular as tabelas viram cartões) ---
  function rotular(tabela) {
    var linhas = tabela.rows;
    var cab = null;
    for (var i = 0; i < linhas.length; i++) if (linhas[i].querySelector("th")) { cab = linhas[i]; break; }
    if (!cab) return;
    var nomes = [];
    Array.prototype.forEach.call(cab.cells, function (th) {
      for (var k = 0; k < (th.colSpan || 1); k++) nomes.push(th.textContent.trim());
    });
    Array.prototype.forEach.call(linhas, function (tr) {
      if (tr === cab || tr.classList.contains("total")) return;
      var col = 0;
      Array.prototype.forEach.call(tr.cells, function (td) {
        if (td.tagName === "TD" && nomes[col] && !td.hasAttribute("data-label")) td.setAttribute("data-label", nomes[col]);
        col += td.colSpan || 1;
      });
    });
  }
  document.querySelectorAll("table").forEach(function (t) {
    rotular(t);
    new MutationObserver(function () { rotular(t); }).observe(t, { childList: true, subtree: true });
  });

  // --- Sim / Não: marcar um desmarca o outro (antes do salvamento da ficha) ---
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.type !== "checkbox" || !el.checked) return;
    var grupo = el.closest(".perg .chk");
    if (!grupo) return;
    grupo.querySelectorAll("input[type=checkbox]").forEach(function (o) { if (o !== el) o.checked = false; });
  }, true);

  // --- máscara de telefone ---
  function tel(v) {
    var d = v.replace(/\D/g, "");
    if (d.length > 11 && d.indexOf("55") === 0) d = d.slice(2);
    d = d.slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }
  // --- validação de CPF (só sinaliza; não bloqueia o salvamento) ---
  function cpfOk(v) {
    var d = v.replace(/\D/g, "");
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    function dv(n) { var s = 0; for (var i = 0; i < n; i++) s += +d[i] * (n + 1 - i); var r = (s * 10) % 11; return r === 10 ? 0 : r; }
    return dv(9) === +d[9] && dv(10) === +d[10];
  }
  var mascaras = (window.FICHA && FICHA.mascaras) || {};
  Object.keys(mascaras).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (mascaras[id] === "tel") {
      el.setAttribute("inputmode", "tel");
      el.setAttribute("placeholder", "(00) 00000-0000");
      el.value = tel(el.value);
      // fase de captura: formata antes do salvamento automático da ficha
      document.addEventListener("input", function (e) { if (e.target === el) el.value = tel(el.value); }, true);
    }
  });
  var cpf = document.getElementById("cpf");
  if (cpf) {
    cpf.setAttribute("inputmode", "numeric");
    var marcar = function () {
      var n = cpf.value.replace(/\D/g, "").length;
      cpf.classList.toggle("inval", n === 11 && !cpfOk(cpf.value));
      cpf.title = cpf.classList.contains("inval") ? "CPF inválido — confira os números" : "";
    };
    cpf.addEventListener("input", marcar);
    marcar();
  }
  // teclado numérico nos valores e quantidades
  document.addEventListener("focusin", function (e) {
    var el = e.target;
    if (el.matches && el.matches(".q, .v, .val")) el.setAttribute("inputmode", "decimal");
  });
})();
