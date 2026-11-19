/* ==========================================================================
   UNIS: užklausos forma. Trys dalys (pozicijos, failai, žinutė), užtenka vienos.
   Demonstracinė: tikrina laukus ir parodo patvirtinimą, bet duomenų niekur nesiunčia.
   Nuorodos: ?g=<gaminio id> atidaro „Nauja pozicija“ su tuo gaminiu,
             ?tema=projektas arba ?tema=konsultacija pažymi temą.
   ========================================================================== */
(function () {
  'use strict';
  var U = window.UNIS, doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var form = $('#rfq'); if (!form || !U) return;
  var p = new URLSearchParams(window.location.search);
  var smooth = function () { return doc.documentElement.classList.contains('js-motion') ? 'smooth' : 'auto'; };
  var MAX_MB = 10, files = [];

  /* ---------- Pozicijos ---------- */
  var list = $('[data-pos-list]'), empty = $('[data-pos-empty]'), totalRow = $('[data-pos-total]'), totalKg = $('[data-pos-kg]');
  var builder = $('[data-builder]'), addBtn = $('[data-pos-add]'), closeBtn = $('[data-builder-close]'), cfg = null;
  function paintList() {
    var items = U.store.get();
    list.innerHTML = U.listHTML(items);
    empty.hidden = items.length > 0; totalRow.hidden = items.length === 0;
    totalKg.textContent = U.totalText(items);
    paintSummary();
  }
  function openBuilder(line, focus) {
    builder.hidden = false; addBtn.setAttribute('aria-expanded', 'true'); addBtn.hidden = true;
    if (!cfg) {
      cfg = new U.Configurator($('[data-builder-cfg]'), {
        compact: true, line: line,
        onAdd: function (item, c) {
          U.store.add(item);
          U.toast('Pridėta į užklausą: ' + item.name + ' ' + item.size);
          c.afterAdd();                                   /* blokas lieka atidarytas kitai pozicijai */
          $('h3', builder).focus({ preventScroll: true });
        }
      });
    } else if (line) { cfg.setLine(line, false); }
    builder.scrollIntoView({ block: 'start', behavior: smooth() });
    if (focus) $('h3', builder).focus({ preventScroll: true });
  }
  function closeBuilder(focus) {
    builder.hidden = true; addBtn.setAttribute('aria-expanded', 'false'); addBtn.hidden = false;
    if (focus) addBtn.focus({ preventScroll: true });
  }
  addBtn.addEventListener('click', function () { openBuilder(null, true); });
  closeBtn.addEventListener('click', function () {
    var left = cfg && cfg.item();                           /* paruošta, bet nepridėta pozicija: pasakom, kad ji neįtraukta */
    closeBuilder(true);
    if (left) U.toast('Pozicija ' + left.name + ' ' + left.size + ' nepridėta. Jei jos reikia, atidarykite ir spauskite „Pridėti į užklausą“.');
  });
  var way = $('[data-way="pozicijos"]');
  if (way) way.addEventListener('click', function (e) { e.preventDefault(); openBuilder(null, true); });
  /* po pašalinimo fokusas lieka sąraše (kitas mygtukas) arba grįžta prie „Pridėti poziciją“ */
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-del]'); if (!b) return;
    var i = $$('[data-del]', list).indexOf(b);
    U.store.remove(b.dataset.del);
    var rest = $$('[data-del]', list);
    (rest[Math.min(i, rest.length - 1)] || (addBtn.hidden ? closeBtn : addBtn)).focus({ preventScroll: true });
  });
  window.addEventListener('unis:list', paintList);

  /* ---------- Failai ---------- */
  var drop = $('[data-drop]'), input = $('[data-files-input]'), fileList = $('[data-files]'), fileErr = $('[data-files-error]');
  function size(n) { return n > 1048576 ? U.fmt(n / 1048576, 1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function addFiles(fl) {
    var skipped = [];
    Array.prototype.forEach.call(fl, function (f) {
      if (f.size > MAX_MB * 1048576) { skipped.push(f.name); return; }
      if (!files.some(function (x) { return x.name === f.name && x.size === f.size; })) files.push(f);
    });
    fileErr.hidden = !skipped.length;
    fileErr.textContent = skipped.length ? 'Per dideli failai (daugiau nei ' + MAX_MB + ' MB): ' + skipped.join(', ') : '';
    paintFiles();
  }
  function paintFiles() {
    fileList.innerHTML = files.map(function (f, i) {
      return '<li><svg class="ico" aria-hidden="true"><use href="#i-file-text"/></svg><span>' + U.esc(f.name) + '</span><small>' + size(f.size) + '</small>' +
        '<button type="button" data-file-del="' + i + '" aria-label="Pašalinti failą ' + U.esc(f.name) + '"><svg class="ico" aria-hidden="true"><use href="#i-x"/></svg></button></li>';
    }).join('');
    paintSummary();
  }
  input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
  fileList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-file-del]'); if (!b) return;
    var i = +b.dataset.fileDel; files.splice(i, 1); paintFiles();
    var rest = $$('[data-file-del]', fileList);
    (rest[Math.min(i, rest.length - 1)] || input).focus({ preventScroll: true });
  });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

  /* ---------- Pristatymas ir santrauka ---------- */
  var addr = $('[data-address]'), msg = $('[data-message]'), formErr = $('[data-form-error]');
  function delivery() { var r = $('input[name="pristatymas"]:checked', form); return r ? r.value : ''; }
  function paintSummary() {
    var items = U.store.get();
    $('[data-sum-pos]').textContent = items.length;
    $('[data-sum-kg]').textContent = items.length ? U.totalText(items) : '–';
    $('[data-sum-files]').textContent = files.length;
    $('[data-sum-msg]').textContent = msg.value.trim() ? 'yra' : 'nėra';
    $('[data-sum-del]').textContent = delivery();
    addr.hidden = delivery() !== 'Pristatyti adresu';             /* adreso reikia tik pasirinkus pristatymą */
    if (!formErr.hidden && hasContent()) formErr.hidden = true;
  }
  form.addEventListener('change', paintSummary);
  msg.addEventListener('input', paintSummary);
  function hasContent() { return U.store.get().length > 0 || files.length > 0 || msg.value.trim().length > 0; }

  /* ---------- Tikrinimas ir „siuntimas“ ---------- */
  function setError(inp, text) {
    var box = inp.type === 'checkbox' ? $('[data-consent-error]', form) : $('.field__error', inp.closest('.field'));
    inp.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (box) { box.hidden = !text; box.textContent = text || ''; }
  }
  function check(inp) {
    if (inp.closest('[hidden]')) { setError(inp, ''); return true; }       /* paslėpti laukai netikrinami */
    var v = inp.type === 'checkbox' ? inp.checked : inp.value.trim(), text = '';
    if (!v) text = inp.dataset.req;
    else if (inp.dataset.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) text = 'Patikrinkite el. pašto adresą, pvz., vardas@imone.lt.';
    else if (inp.dataset.type === 'tel' && v.replace(/\D/g, '').length < 8) text = 'Patikrinkite telefono numerį, pvz., +370 600 00000.';
    setError(inp, text); return !text;
  }
  var required = $$('[data-req]', form);
  required.forEach(function (inp) {
    inp.addEventListener('blur', function () { if ((inp.type !== 'checkbox' && inp.value) || inp.getAttribute('aria-invalid') === 'true') check(inp); });
    inp.addEventListener('input', function () { if (inp.getAttribute('aria-invalid') === 'true') check(inp); });
    inp.addEventListener('change', function () { if (inp.type === 'checkbox') check(inp); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    /* atidarytame bloke paruošta pozicija be „Pridėti“ tyliai nedingsta: pirma paprašom ją pridėti arba uždaryti */
    var pending = !builder.hidden && cfg && cfg.item() ? $('[data-add]', builder) : null;
    if (pending) {
      U.toast('Atidaryta pozicija dar nepridėta. Spauskite „Pridėti į užklausą“ arba „Baigti“.');
      builder.scrollIntoView({ block: 'center', behavior: smooth() });
      pending.focus({ preventScroll: true });
      return;
    }
    var firstBad = null;
    required.forEach(function (inp) { if (!check(inp) && !firstBad) firstBad = inp; });
    if (!hasContent()) {
      formErr.hidden = false;
      formErr.textContent = 'Pridėkite bent vieną poziciją, įkelkite failą arba parašykite žinutę, kad žinotume, ko reikia.';
      formErr.scrollIntoView({ block: 'start', behavior: smooth() });
      formErr.focus({ preventScroll: true });
      return;
    }
    formErr.hidden = true;
    if (firstBad) { firstBad.focus(); return; }
    done();
  });
  function done() {
    var items = U.store.get(), box = $('[data-success]'), fd = new FormData(form);
    var topics = $$('input[name="tema"]:checked', form).map(function (t) { return t.value; });
    var text = msg.value.trim(), rows = [];
    if (items.length) rows.push(['Pozicijos', items.length + ' poz., ' + U.totalText(items)]);
    if (fd.get('pakaitalai')) rows.push(['Pakaitalai', 'galima siūlyti artimiausią matmenį ar markę']);
    if (files.length) rows.push(['Failai', files.map(function (f) { return f.name; }).join(', ')]);
    if (topics.length) rows.push(['Temos', topics.join(', ')]);
    if (text) rows.push(['Žinutė', text]);
    rows.push(['Pristatymo būdas', delivery() + (fd.get('adresas') && delivery() === 'Pristatyti adresu' ? ': ' + fd.get('adresas') : '')]);
    rows.push(['Kada reikia prekių', fd.get('terminas') || 'nenurodyta']);
    rows.push(['Įmonė', fd.get('imone') + (fd.get('kodas') ? ' (' + fd.get('kodas') + ')' : '')]);
    rows.push(['Kontaktas', fd.get('vardas') + ', ' + fd.get('telefonas') + ', ' + fd.get('pastas')]);
    $('[data-success-lead]').textContent = 'Ačiū. Vadybininkas susisieks su jumis el. paštu ' + fd.get('pastas') + ' arba telefonu.';
    $('[data-success-pos]').innerHTML = U.listHTML(items);
    $('[data-success-list]').innerHTML = rows.map(function (r) { return '<li><span>' + U.esc(r[0]) + '</span><span>' + U.esc(r[1]) + '</span></li>'; }).join('');
    form.hidden = true; box.hidden = false; box.focus({ preventScroll: true }); box.scrollIntoView({ block: 'start' });
    U.store.clear(); files = [];
  }
  $('[data-success-print]').addEventListener('click', function () { window.print(); });
  $('[data-success-new]').addEventListener('click', function () {
    form.reset(); closeBuilder(false);
    /* konfigūratorius kuriamas iš naujo, kad nauja užklausa nepaveldėtų senos pozicijos matmenų ir pastabos */
    if (cfg) { var oldCfg = $('[data-builder-cfg]'); oldCfg.parentNode.replaceChild(oldCfg.cloneNode(false), oldCfg); cfg = null; }
    fileErr.hidden = true; fileErr.textContent = '';
    paintFiles(); paintList();
    required.forEach(function (inp) { setError(inp, ''); });
    $('[data-success]').hidden = true; form.hidden = false; window.scrollTo(0, 0);
    var h1 = $('h1'); h1.tabIndex = -1; h1.focus({ preventScroll: true });
  });

  /* ---------- Pradinė būsena ---------- */
  paintList(); paintFiles();
  var tema = p.get('tema');
  if (tema && /^[\w-]+$/.test(tema)) {
    var t = $('[data-topic="' + tema + '"]', form);
    if (t) { t.checked = true; $('#poreikis').scrollIntoView({ block: 'start' }); $('#need-title').focus({ preventScroll: true }); }
  }
  if (p.get('g') && U.data.lines[p.get('g')]) openBuilder(p.get('g'), false);
})();
