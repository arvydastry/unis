/* ==========================================================================
   UNIS: skaičiuoklės puslapis (konfigūratorius + užklausos sąrašas + mobili juosta)
   Nuorodos: ?g=<gaminio id>  arba  ?f=chs&D=60.3&t=3&l=6&q=10 (iš pradžios puslapio)
   ========================================================================== */
(function () {
  'use strict';
  var U = window.UNIS, $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var host = $('#cfg'); if (!host || !U || !U.Configurator) return;
  var p = new URLSearchParams(window.location.search);

  var bar = $('[data-calcbar]'), barVal = $('[data-calcbar-val]'), barAdd = $('[data-calcbar-add]');
  var opts = {
    onAdd: function (item) {
      U.store.add(item);
      U.toast('Pridėta į užklausą: ' + item.name + ' ' + item.size, 'uzklausa.html', 'Pateikti užklausą');
    },
    onChange: function (res) {
      if (!bar) return;
      barVal.textContent = res.ok && isFinite(res.totalKg) ? U.kg(res.totalKg) + ' kg' : '–';
      barAdd.disabled = !res.canAdd;
    }
  };
  var dims = {}, any = false;
  ['D', 't', 'a', 'b', 'd', 'W', 'L'].forEach(function (k) { var v = U.num(p.get(k)); if (v > 0) { dims[k] = v; any = true; } });
  if (any) opts.dims = dims;
  if (p.get('g') && U.data.lines[p.get('g')]) opts.line = p.get('g');
  else if (any) {
    /* matmenys atėjo be gaminio (iš mini skaičiuoklės): parenkamas gaminys, kurio lentelėje toks matmuo yra */
    var shape = { chs: 'chs', shs: 'shs', rhs: 'rhs' }[p.get('f')] || (dims.D ? 'chs' : null);
    if (shape) {
      var ids = U.linesOf(shape), pref = { chs: 'konstrukciniai-apvalus', shs: 'kvadratiniai-en10219', rhs: 'staciakampiai-en10219' }[shape];
      var hit = [pref].concat(ids).filter(function (id) { return U.compute(id, Object.assign({}, dims)).inTable; })[0];
      opts.line = hit || pref;
    }
  }
  if (U.num(p.get('l')) > 0) opts.len = U.num(p.get('l'));
  if (U.num(p.get('q')) > 0) opts.qty = U.num(p.get('q'));

  var cfg = new U.Configurator(host, opts);
  if (barAdd) barAdd.addEventListener('click', function () { cfg.add(); });

  /* ---------- Užklausos sąrašas ---------- */
  var list = $('[data-bom-list]'), empty = $('[data-bom-empty]'), foot = $('[data-bom-foot]'), total = $('[data-bom-total]'), count = $('[data-bom-count]'), title = $('#bom-title');
  function paint() {
    var items = U.store.get();
    list.innerHTML = U.listHTML(items);
    empty.hidden = items.length > 0; foot.hidden = items.length === 0;
    total.textContent = U.totalText(items);
    count.textContent = 'Pozicijų: ' + items.length;
  }
  function focusTitle() { title.tabIndex = -1; title.focus({ preventScroll: true }); }
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-del]'); if (!b) return;
    var i = $$('[data-del]', list).indexOf(b);
    U.store.remove(b.dataset.del);
    var rest = $$('[data-del]', list);
    if (rest.length) rest[Math.min(i, rest.length - 1)].focus({ preventScroll: true }); else focusTitle();
  });
  $('[data-bom-clear]').addEventListener('click', function () { if (window.confirm('Pašalinti visas pozicijas iš sąrašo?')) { U.store.clear(); focusTitle(); } });
  $('[data-bom-print]').addEventListener('click', function () { window.print(); });
  $('[data-bom-copy]').addEventListener('click', function () {
    U.copy(U.listTSV(U.store.get()), 'Sąrašas nukopijuotas. Jį galima įklijuoti į „Excel“.');
  });
  window.addEventListener('unis:list', paint);
  paint();
})();
