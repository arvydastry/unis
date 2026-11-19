/* ==========================================================================
   UNIS: gaminio konfigūratorius. Tas pats komponentas naudojamas skaičiuoklėje
   ir užklausos formoje („Pridėti poziciją“).
   new UNIS.Configurator(elementas, { compact, line, dims, len, qty, onAdd, onChange })
   compact: true  -> užklausos formos režimas: be pavyzdinių matmenų, be kainos, su pastaba pozicijai.
   ========================================================================== */
(function () {
  'use strict';
  var U = window.UNIS, DATA = U.data;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var esc = U.esc, dim = U.dim, uid = 0;
  var ico = function (n, cls) { return '<svg class="' + (cls || 'ico') + '" aria-hidden="true"><use href="#' + (/^[\w-]+$/.test(n) ? n : 'p-chs') + '"/></svg>'; };

  var DEFAULT_LINE = { chs: 'konstrukciniai-apvalus', shs: 'kvadratiniai-en10219', rhs: 'staciakampiai-en10219', sheet: 'lakstai-karsto', beam: 'ipe', channel: 'upn', angle: 'kampuociai-lygiasoniai' };
  /* Pavyzdžiai skaičiuoklei (jei tokio matmens lentelėje nebūtų, imamas matmuo iš lentelės pradžios) */
  var PREF = { 'konstrukciniai-apvalus': { D: 60.3, t: 3 }, 'kvadratiniai-en10219': { a: 40, b: 40, t: 2 }, 'staciakampiai-en10219': { a: 60, b: 40, t: 2 }, 'lakstai-karsto': { t: 5, W: 1500, L: 3000 }, 'ipe': { key: 'IPE 200' }, 'heb': { key: 'HEB 200' }, 'hea': { key: 'HEA 200' }, 'upn': { key: 'UPN 120' }, 'armatura': { d: 12 }, 'kampuociai-lygiasoniai': { a: 50, b: 50, t: 5 } };
  var CFG = {
    chs:     { size: 'Išorinis skersmuo D, mm', th: 'Sienelės storis t, mm', fields: [['D', 'Skersmuo D'], ['t', 'Sienelės storis t']] },
    shs:     { size: 'Kraštinė a × a, mm', th: 'Sienelės storis t, mm', fields: [['a', 'Kraštinė a'], ['t', 'Sienelės storis t']] },
    rhs:     { size: 'Kraštinės a × b, mm', th: 'Sienelės storis t, mm', fields: [['a', 'Kraštinė a'], ['b', 'Kraštinė b'], ['t', 'Sienelės storis t']] },
    sheet:   { size: 'Storis t, mm', th: 'Lakšto formatas (plotis × ilgis), mm', fields: [['t', 'Storis t'], ['W', 'Plotis W'], ['L', 'Ilgis L']], piece: true },
    flat:    { size: 'Plotis b, mm', th: 'Storis t, mm', fields: [['b', 'Plotis b'], ['t', 'Storis t']] },
    round:   { size: 'Skersmuo ⌀, mm', fields: [['d', 'Skersmuo ⌀']] },
    rebar:   { size: 'Skersmuo ⌀, mm', fields: [['d', 'Skersmuo ⌀']] },
    square:  { size: 'Kraštinė a, mm', fields: [['a', 'Kraštinė a']] },
    angle:   { size: 'Lentynos a × b, mm', th: 'Storis t, mm', fields: [['a', 'Lentyna a'], ['b', 'Lentyna b'], ['t', 'Storis t']] },
    beam:    { size: 'Profilio numeris', fields: [] },
    channel: { size: 'Profilio numeris', fields: [] }
  };

  function linesOf(shape) { return Object.keys(DATA.lines).filter(function (id) { return DATA.lines[id].s === shape; }); }
  function rowDims(shape, row) {
    var p;
    switch (shape) {
      case 'chs': return { D: row[0] };
      case 'shs': case 'square': p = U.parseAB(row[0]); return { a: p[0] };
      case 'rhs': case 'angle': p = U.parseAB(row[0]); return { a: p[0], b: p[1] };
      case 'sheet': return { t: row[0] };
      case 'flat': return { b: row[0] };
      case 'round': case 'rebar': return { d: row[0] };
      default: return { key: row[0] };
    }
  }
  function colDims(shape, col) {
    if (shape === 'sheet') { var p = U.parseAB(col); return { W: p[0], L: p[1] }; }
    return { t: col };
  }
  function same(a, b) {
    for (var k in a) { if (typeof a[k] === 'string' ? a[k] !== b[k] : !U.near(a[k], b[k])) return false; }
    return true;
  }
  function rowText(row) {
    var v = row[0];
    return typeof v === 'number' ? dim(v) : String(v).replace(/x/i, '×');
  }
  function plain(html) { return String(html).replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); }
  function up(x) { return isFinite(x) ? Math.ceil(x - 1e-9) : NaN; }

  /* ---------- Komponentas ---------- */
  function Configurator(root, opts) {
    var self = this;
    self.root = root; self.o = opts || {}; self.id = 'cf' + (++uid);
    var c = !!self.o.compact;
    var line = self.o.line && DATA.lines[self.o.line] ? self.o.line : DEFAULT_LINE.chs;
    self.s = { shape: DATA.lines[line].s, line: line, dims: {}, grade: '', filter: '', note: '', qunit: 'pc',
      len: self.o.len > 0 ? self.o.len : 6, qty: self.o.qty > 0 ? self.o.qty : (c ? NaN : 1), pT: NaN, pU: NaN };
    /* skaičiuoklėje pradinis vaizdas yra pavyzdys: į užklausą jo pridėti negalima, kol lankytojas nieko nepakeitė */
    self.touched = c || !!(self.o.line || self.o.dims);
    root.innerHTML = self.skeleton();
    self.el = {};
    ['shapes', 'lines', 'note', 'grade', 'dims', 'qty', 'price', 'result', 'live'].forEach(function (k) { self.el[k] = $('[data-c="' + k + '"]', root); });
    self.renderShapes(); self.renderLines(); self.renderDims(true); self.renderQty(); self.renderPrice();
    if (self.o.dims) { self.s.dims = Object.assign({}, self.o.dims); if (self.s.shape === 'shs') self.s.dims.b = self.s.dims.a; self.fillFields(); }
    self.sync();
    self.bind();
    self.ready = true;
  }
  var P = Configurator.prototype;

  P.skeleton = function () {
    var c = this.o.compact, H = c ? 'h4' : 'h2';
    function step(n, title, body) { return '<section class="step"><' + H + ' class="step__title"><span class="step__n">' + n + '</span> ' + title + '</' + H + '>' + body + '</section>'; }
    return '<div class="cfg__main">' +
      step(1, 'Profilis', '<div class="shapes" data-c="shapes"></div>') +
      step(2, 'Gaminys', '<div class="lines" data-c="lines" role="radiogroup" aria-label="Gaminys"></div><p class="step__note" data-c="note"></p><div data-c="grade"></div>') +
      step(3, 'Matmenys', '<div data-c="dims"></div>') +
      step(4, 'Kiekis', '<div data-c="qty"></div>') +
      (c ? '<div data-c="price" hidden></div>' :
        '<details class="step fold"><summary><span>Kainos perskaičiavimas<small>Nebūtina. Iš tonos kainos gausite vieneto kainą ir atvirkščiai.</small></span>' + ico('i-caret-down') + '</summary><div class="fold__body" data-c="price"></div></details>') +
      '</div><aside class="cfg__side" aria-label="Rezultatas"><div class="result" data-c="result"></div><p class="sr" role="status" data-c="live"></p></aside>';
  };

  P.renderShapes = function () {
    var s = this.s, groups = [], seen = {};
    DATA.shapes.forEach(function (sh) { if (!seen[sh.group]) { seen[sh.group] = []; groups.push(sh.group); } seen[sh.group].push(sh); });
    this.el.shapes.innerHTML = groups.map(function (g, gi) {
      return '<div class="shapes__group' + (gi === 0 ? ' shapes__group--main' : '') + '"><p class="shapes__label">' + esc(g) + '</p><div class="shapes__list">' +
        seen[g].map(function (sh) {
          return '<button type="button" class="shape" data-shape="' + sh.id + '" aria-pressed="' + (sh.id === s.shape) + '">' + ico(sh.icon, 'pico') + '<span>' + esc(sh.name) + '</span></button>';
        }).join('') + '</div></div>';
    }).join('');
  };

  P.renderLines = function () {
    var s = this.s, ids = linesOf(s.shape), name = this.id + '-line';
    this.el.lines.innerHTML = ids.map(function (id) {
      var L = DATA.lines[id];
      return '<label class="line"><input type="radio" name="' + name + '" value="' + id + '"' + (id === s.line ? ' checked' : '') + '><span class="line__box"><span class="line__name">' + esc(L.sn) + '</span><span class="line__std">' + esc(L.std) + '</span></span></label>';
    }).join('');
    this.renderLineInfo();
  };
  P.renderLineInfo = function () {
    var L = DATA.lines[this.s.line];
    this.el.note.innerHTML = esc(L.d) + ' <b>' + (L.g.length > 1 ? 'Plieno markės:' : 'Plieno markė:') + '</b> ' + esc(L.g.join(', ')) + '.';
    if (this.s.grade && L.g.indexOf(this.s.grade) < 0) this.s.grade = '';
    var gs = this.s.grade;
    this.el.grade.innerHTML = '<label class="field" style="margin-top:14px;max-width:320px"><span class="field__label">Plieno markė <em>(nebūtina)</em></span><select class="select" data-grade>' +
      '<option value="">Nesvarbu, pasiūlykite</option>' + L.g.map(function (g) { return '<option' + (g === gs ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select></label>';
  };

  /* Matmenų žingsnis: žymos iš asortimento + laukai saviems matmenims */
  P.renderDims = function (applyDefault) {
    var s = this.s, L = DATA.lines[s.line], c = CFG[s.shape], h = '', id = this.id;
    if (applyDefault) this.defaultDims();
    if (!L.r.length) {
      h = '<p class="pick__empty">Šio gaminio matmenų lentelė dar ruošiama. Įveskite matmenis žemiau.</p>';
    } else {
      var many = L.r.length > 14;
      h += '<div class="pick' + (L.t === 'mx' ? '' : ' pick--single') + '"><div class="pick__col"><div class="pick__head"><span class="pick__label" id="' + id + '-size">' + esc(c.size) + '</span>' +
        (many ? '<input class="input input--sm pick__filter" type="search" inputmode="decimal" placeholder="Ieškoti" aria-label="Ieškoti matmens" data-filter>' : '') + '</div>' +
        '<div class="chips' + (many ? ' chips--scroll' : '') + '" data-pick="size" role="group" aria-labelledby="' + id + '-size">' +
        L.r.map(function (row, i) {
          var g = row[2] || {}, cls = 'chip' + (typeof row[0] === 'string' && row[0].length > 6 ? ' chip--wide' : '') + (g.st === 0 ? ' chip--order' : '');
          var title = g.dn ? ' title="DN ' + esc(g.dn) + '"' : g.st === 0 ? ' title="Tiekiama pagal užsakymą"' : g.st === 1 ? ' title="Laikoma sandėlyje"' : '';
          return '<button type="button" class="' + cls + '" data-size="' + i + '" aria-pressed="false" tabindex="-1"' + title + '>' + esc(rowText(row)) + '</button>';
        }).join('') + '</div>' +
        (L.r[0][2] && L.r[0][2].st != null ? '<p class="legend"><span class="legend__a"></span>Laikoma sandėlyje<span class="legend__b"></span>Tiekiama pagal užsakymą</p>' : '') +
        '</div>';
      if (L.t === 'mx') {
        h += '<div class="pick__col"><div class="pick__head"><span class="pick__label" id="' + id + '-th">' + esc(c.th) + '</span></div><div class="chips" data-pick="th" role="group" aria-labelledby="' + id + '-th">' +
          L.c.map(function (col, i) {
            return '<button type="button" class="chip' + (typeof col === 'string' ? ' chip--wide' : '') + '" data-th="' + i + '" aria-pressed="false" tabindex="-1">' + esc(typeof col === 'number' ? dim(col) : String(col).replace(/x/i, ' × ')) + '</button>';
          }).join('') + '</div></div>';
      }
      h += '</div>';
    }
    if (c.fields.length) {
      h += '<div class="manual"><p class="manual__label">' + (L.r.length ? 'Reikia kitokio matmens? Įveskite savo:' : 'Matmenys:') + '</p><div class="manual__fields">' +
        c.fields.map(function (f) {
          return '<label class="field"><span class="field__label">' + esc(f[1]) + '</span><span class="unit"><input class="input" type="text" inputmode="decimal" autocomplete="off" data-dim="' + f[0] + '"><i>mm</i></span></label>';
        }).join('') + '</div></div>';
    }
    h += '<p class="status" data-status hidden></p>';
    this.el.dims.innerHTML = h;
    this.fillFields();
  };

  P.defaultDims = function () {
    var s = this.s, L = DATA.lines[s.line];
    s.dims = {}; s.filter = '';
    if (this.o.compact || !L.r.length) return;                 // užklausos formoje nieko neparenkame už pirkėją
    if (PREF[s.line]) { var pr = U.compute(s.line, Object.assign({}, PREF[s.line])); if (pr.ok && pr.inTable) { s.dims = Object.assign({}, PREF[s.line]); return; } }
    var row = L.r[Math.min(L.r.length - 1, Math.floor(L.r.length / 3))];
    Object.assign(s.dims, rowDims(s.shape, row));
    if (s.shape === 'shs') s.dims.b = s.dims.a;
    if (L.t === 'mx') {
      for (var i = 0; i < L.c.length; i++) if (row[1][i]) { Object.assign(s.dims, colDims(s.shape, L.c[i])); break; }
    }
  };
  P.fillFields = function () {
    var d = this.s.dims;
    $$('[data-dim]', this.el.dims).forEach(function (inp) { var v = d[inp.dataset.dim]; inp.value = isFinite(v) ? dim(v) : ''; });
  };

  P.renderQty = function () {
    var s = this.s, piece = CFG[s.shape].piece, h = '<div class="qty">';
    if (piece && s.qunit === 'm') s.qunit = 'pc';
    if (!piece) {
      h += '<div><label class="field"><span class="field__label">Vieno vieneto ilgis</span><span class="unit"><input class="input" type="text" inputmode="decimal" autocomplete="off" value="' + dim(s.len) + '" data-len><i>m</i></span></label>' +
        '<div class="qty__quick" role="group" aria-label="Standartiniai ilgiai"><button type="button" class="chip" data-len-quick="6">6 m</button><button type="button" class="chip" data-len-quick="12">12 m</button></div></div>';
    }
    var units = piece ? [['pc', 'vnt.'], ['t', 't']] : [['pc', 'vnt.'], ['m', 'm'], ['t', 't']];
    h += '<div><label class="field"><span class="field__label">Kiekis</span><span class="unit"><input class="input" type="text" inputmode="decimal" autocomplete="off" placeholder="pvz., 10" value="' + dim(s.qty) + '" data-qty><i data-qty-unit></i></span></label>' +
      '<div class="qunit" role="group" aria-label="Kiekio vienetai">' + units.map(function (u) { return '<button type="button" class="chip" data-qunit="' + u[0] + '">' + u[1] + '</button>'; }).join('') + '</div></div></div>';
    if (this.o.compact) h += '<label class="field note-field"><span class="field__label">Pastaba šiai pozicijai <em>(nebūtina)</em></span><input class="input" type="text" autocomplete="off" maxlength="200" placeholder="Pvz., tikslus ilgis, reikalingi dokumentai, tinka ir kita markė" value="' + esc(s.note) + '" data-note></label>';
    h += '<p class="status" data-qty-status hidden></p>';
    this.el.qty.innerHTML = h;
  };

  P.renderPrice = function () {
    if (this.o.compact) return;
    var piece = CFG[this.s.shape].piece;
    this.el.price.innerHTML = '<div class="price"><label class="field"><span class="field__label">Tonos kaina</span><span class="unit"><input class="input" type="text" inputmode="decimal" autocomplete="off" data-price="t"><i>€/t</i></span></label>' +
      '<span class="price__swap">' + ico('i-arrows-left-right') + '</span>' +
      '<label class="field"><span class="field__label">' + (piece ? 'Lakšto kaina' : 'Metro kaina') + '</span><span class="unit"><input class="input" type="text" inputmode="decimal" autocomplete="off" data-price="u"><i>' + (piece ? '€/vnt.' : '€/m') + '</i></span></label></div>' +
      '<p class="step__note">Įveskite vieną kainą, kitą apskaičiuosime. Kainos be PVM, orientacinės: tikslią kainą pateiksime atsakydami į užklausą.</p>';
    /* tonos kaina nuo profilio nepriklauso, todėl keičiant profilį ji išlieka */
    var st = this.s;
    if (!(st.pT > 0) && this.res && isFinite(this.res.pT)) st.pT = Math.round(this.res.pT * 100) / 100;
    st.pU = NaN;
    if (st.pT > 0) $('[data-price="t"]', this.el.price).value = dim(st.pT);
  };

  /* ---------- Skaičiavimas ---------- */
  P.compute = function () {
    var s = this.s, res = U.compute(s.line, Object.assign({}, s.dims)), piece = CFG[s.shape].piece;
    var len = s.len > 0 && s.len <= 100 ? s.len : NaN, raw = s.qty > 0 ? s.qty : NaN, per = piece ? res.kgPc : res.kgm, pcs = NaN;
    if (s.qunit === 'pc') pcs = raw % 1 === 0 ? raw : NaN;
    else if (s.qunit === 'm') pcs = up(raw / len);
    else if (res.ok) pcs = up(raw * 1000 / (piece ? per : per * len));
    if (!(pcs <= 1e6)) pcs = NaN;
    res.len = piece ? NaN : len; res.pcs = pcs;
    res.ask = isFinite(pcs) && s.qunit !== 'pc' ? dim(raw) + (s.qunit === 'm' ? ' m' : ' t') : '';
    res.qtyErr = !piece && !(len > 0) && isFinite(s.len) ? (s.len > 100 ? 'Ilgis įvedamas metrais. Vieno vieneto ilgis negali viršyti 100 m.' : 'Įveskite vieno vieneto ilgį metrais.')
      : isFinite(s.qty) && !(s.qty > 0) ? 'Kiekis turi būti teigiamas skaičius.'
      : isFinite(s.qty) && s.qunit === 'pc' && !(pcs > 0) ? 'Vienetų skaičius turi būti sveikasis, pvz., 10. Kiekį galite nurodyti ir metrais arba tonomis.' : '';
    res.qtyWarn = !piece && len > 24 ? 'Ilgis įvedamas metrais. Patikrinkite, ar tikrai reikia ' + dim(len) + ' m ilgio vienetų.' : '';
    if (res.ok) {
      if (piece) { res.unitKg = res.kgPc; res.totalKg = res.kgPc * pcs; }
      else { res.unitKg = res.kgm * len; res.totalM = len * pcs; res.totalKg = res.kgm * len * pcs; }
      if (isFinite(s.pT) && s.pT > 0) { res.pT = s.pT; res.pU = s.pT * per / 1000; }
      else if (isFinite(s.pU) && s.pU > 0) { res.pU = s.pU; res.pT = s.pU / per * 1000; }
      if (isFinite(res.pT) && isFinite(res.totalKg)) res.sum = res.pT * res.totalKg / 1000;
    }
    res.canAdd = !!(res.ok && isFinite(res.totalKg) && res.totalKg > 0 && this.touched);
    return res;
  };

  P.sync = function () {
    var self = this, s = self.s, L = DATA.lines[s.line], d = s.dims, res = self.compute();
    self.res = res;
    /* žymų būsena pagal matmenis */
    var ri = -1, ci = -1;
    L.r.forEach(function (row, i) { if (same(rowDims(s.shape, row), d)) ri = i; });
    if (L.t === 'mx') L.c.forEach(function (col, i) { if (same(colDims(s.shape, col), d)) ci = i; });
    self.ri = ri;
    /* paieška supranta „80x40“, „80×40“, „80 40“, „ipe300“, „60,3“ */
    var isAB = L.r.length && typeof L.r[0][0] === 'string' && /\dx\d/i.test(L.r[0][0]);
    var norm = function (v) { return String(v).toLowerCase().replace(',', '.').replace(/[×*\/]/g, 'x').replace(/\s+/g, ''); };
    var q = norm(isAB ? s.filter.trim().replace(/(\d)\s+(?=\d)/g, '$1x') : s.filter);
    $$('[data-size]', self.el.dims).forEach(function (b) {
      var i = +b.dataset.size; b.setAttribute('aria-pressed', String(i === ri));
      b.hidden = !!q && i !== ri && norm(L.r[i][0]).indexOf(q) < 0;
    });
    $$('[data-th]', self.el.dims).forEach(function (b) {
      var i = +b.dataset.th; b.setAttribute('aria-pressed', String(i === ci));
      b.disabled = ri > -1 && !L.r[ri][1][i];
    });
    /* klaviatūra: viena Tab stotelė žymų grupei, viduje judama rodyklėmis */
    ['size', 'th'].forEach(function (k) {
      var all = $$('[data-pick="' + k + '"] .chip', self.el.dims), ok = all.filter(function (b) { return !b.hidden && !b.disabled; });
      var cur = ok.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] || ok[0];
      all.forEach(function (b) { b.tabIndex = b === cur ? 0 : -1; });
    });
    $$('[data-len-quick]', self.el.qty).forEach(function (b) { b.setAttribute('aria-pressed', String(U.near(+b.dataset.lenQuick, s.len))); });
    $$('[data-qunit]', self.el.qty).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.qunit === s.qunit)); });
    var qu = $('[data-qty-unit]', self.el.qty); if (qu) qu.textContent = s.qunit === 'pc' ? 'vnt.' : s.qunit;

    /* būsenos eilutė */
    var st = $('[data-status]', self.el.dims), cls, msg, ic;
    var blank = CFG[s.shape].fields.some(function (f) { return !(d[f[0]] > 0); }) || (!CFG[s.shape].fields.length && !d.key);
    if (res.ok && res.inTable && res.fixedFrom != null) {
      cls = 'info'; ic = 'i-info';
      msg = 'Šis matmuo yra mūsų asortimente. ' + (res.fixedFrom === '' ? 'Dabartinėje svetainės lentelėje šis langelis tuščias' : 'Dabartinėje svetainės lentelėje nurodyta ' + esc(String(res.fixedFrom).replace('.', ',')) + ' kg/m') +
        ', pagal standartą turi būti ' + U.kgm(res.kgm, true) + ' kg/m. Rodome patikslintą reikšmę.';
    } else if (res.ok && res.inTable) {
      var g = ri > -1 && L.r[ri][2] ? L.r[ri][2] : {};
      if (g.st === 0) { cls = 'warn'; ic = 'i-clock'; msg = 'Šis profilis tiekiamas pagal užsakymą. Terminą patvirtinsime atsakydami į užklausą.'; }
      else if (g.st === 1) { cls = 'ok'; ic = 'i-check-circle'; msg = 'Šis profilis laikomas sandėlyje.'; }
      else { cls = 'ok'; ic = 'i-check-circle'; msg = 'Šis matmuo yra mūsų asortimente' + (res.extra ? ' (' + esc(res.extra) + ')' : '') + '. Likutį sandėlyje ir terminą patvirtinsime atsakydami į užklausą.'; }
    } else if (res.ok) {
      cls = 'info'; ic = 'i-info';
      var alt = linesOf(s.shape).filter(function (id) { return id !== s.line && U.compute(id, Object.assign({}, d)).inTable; });
      if (alt.length) {
        msg = 'Gaminio „' + esc(L.sn) + '“ (' + esc(L.std) + ') lentelėje tokio matmens nėra, bet jis yra kituose mūsų gaminiuose: ' +
          alt.map(function (id) { return '<button type="button" data-alt="' + id + '">' + esc(DATA.lines[id].sn) + ' (' + esc(DATA.lines[id].std) + ')</button>'; }).join(', ') + '. Kol kas svoris apskaičiuotas pagal formulę.';
      } else {
        msg = 'Tokio matmens mūsų asortimento lentelėse nėra, todėl svoris apskaičiuotas pagal formulę' + (L.k ? ' (cinko danga įvertinta koeficientu ' + U.fmt(L.k, 2) + ')' : '') + (res.approx ? ', neįvertinus kampų užapvalinimo' : '') + '. Dėl tiekimo pasiteiraukite užklausoje.';
      }
    } else if (blank) {
      cls = 'info'; ic = 'i-info'; msg = L.r.length ? 'Pasirinkite matmenis iš asortimento arba įveskite savo.' : 'Įveskite matmenis.';
    } else { cls = 'err'; ic = 'i-warning-circle'; msg = esc(res.err); }
    if (res.ok && !self.touched) { cls = 'info'; ic = 'i-info'; msg = 'Tai pavyzdys. Pasirinkite profilį, gaminį ir matmenis, kurių reikia jums.'; }
    if (st) { st.hidden = false; st.className = 'status status--' + cls; st.innerHTML = ico(ic) + '<span>' + msg + '</span>'; }
    var qs = $('[data-qty-status]', self.el.qty);
    if (qs) {
      var qm = res.qtyErr || res.qtyWarn;
      qs.hidden = !qm; qs.className = 'status status--' + (res.qtyErr ? 'err' : 'warn');
      qs.innerHTML = qm ? ico(res.qtyErr ? 'i-warning-circle' : 'i-info') + '<span>' + esc(qm) + '</span>' : '';
    }
    /* išvestinis kainos laukas visada atitinka dabartinį svorį */
    var pt = $('[data-price="t"]', self.root), pu = $('[data-price="u"]', self.root);
    if (pt && pu) {
      if (isFinite(s.pT)) { if (document.activeElement !== pu) pu.value = res.ok && isFinite(res.pU) ? U.fmt(res.pU, res.pU < 10 ? 3 : 2) : ''; }
      else if (isFinite(s.pU)) { if (document.activeElement !== pt) pt.value = res.ok && isFinite(res.pT) ? U.fmt(res.pT, 2) : ''; }
    }
    self.renderResult(res);
    /* ekrano skaitytuvams: trumpas pranešimas, kai rezultatas nusistovi */
    if (self.ready && self.el.live) {
      var piece = CFG[s.shape].piece;
      var say = (res.ok ? res.label + ': ' + (piece ? U.kg(res.kgPc) + ' kg vienam lakštui' : U.kgm(res.kgm, res.src === 'table') + ' kg/m') + (isFinite(res.totalKg) ? ', bendras svoris ' + U.kg(res.totalKg) + ' kg. ' : '. ') : '') + plain(msg) + (res.qtyErr ? ' ' + res.qtyErr : '');
      clearTimeout(self.liveT);
      self.liveT = setTimeout(function () { if (self.el.live.textContent !== say) self.el.live.textContent = say; }, 900);
    }
    if (self.o.onChange) self.o.onChange(res, s);
  };

  P.renderResult = function (res) {
    var s = this.s, L = DATA.lines[s.line], piece = CFG[s.shape].piece, h;
    h = '<div class="result__draw">' + U.draw(s.shape, s.dims, { model: L.m, geo: res.geo || null, title: 'Pjūvio brėžinys: ' + L.n }) + '</div><div class="result__body">';
    h += '<p class="result__name">' + esc(L.n) + (res.ok ? '<br>' + esc(res.label) : '') + '</p>';
    h += '<p class="result__meta">' + esc(L.std) + (s.grade ? ' · ' + esc(s.grade) : '') + (res.ok && res.extra ? ' · ' + esc(res.extra) : '') + '</p>';
    h += '<div class="result__big"><span>' + (res.ok ? (piece ? U.kg(res.kgPc) : U.kgm(res.kgm, res.src === 'table')) : '–') + '</span><small>' + (piece ? 'kg vienam lakštui' : 'kg/m') + '</small></div>';
    if (res.ok) {
      var rows = '';
      if (!piece) {
        rows += row('Vieno vieneto svoris' + (isFinite(res.len) ? ' (' + U.len(res.len) + ' m)' : ''), isFinite(res.unitKg) ? U.kg(res.unitKg) + ' kg' : '–');
        if (res.ask) rows += row('Vienetų' + (isFinite(res.len) ? ' po ' + U.len(res.len) + ' m' : ''), dim(res.pcs) + ' vnt.');
        rows += row('Bendras ilgis', isFinite(res.totalM) ? U.len(res.totalM) + ' m' : '–');
      } else {
        rows += row('Lakšto plotas', U.fmt(s.dims.W * s.dims.L / 1e6, 2) + ' m²');
        rows += row('1 m² svoris', U.fmt(res.kgm2, 2) + ' kg');
        if (res.ask) rows += row('Lakštų', dim(res.pcs) + ' vnt.');
      }
      rows += '<div class="result__total"><dt>Bendras svoris</dt><dd>' + (isFinite(res.totalKg) ? U.kg(res.totalKg) + ' kg' + (res.totalKg >= 1000 ? ' (' + U.fmt(res.totalKg / 1000, 3) + ' t)' : '') : '–') + '</dd></div>';
      if (!piece) rows += row('Metrų vienoje tonoje', U.fmt(1000 / res.kgm, 1) + ' m');
      if (!piece && isFinite(res.area)) rows += row('Išorinio paviršiaus plotas', U.fmt(res.area, 3) + ' m²/m' + (isFinite(res.totalM) ? ' · ' + U.fmt(res.area * res.totalM, 1) + ' m²' : ''));
      if (isFinite(res.pT)) {
        rows += row('Tonos kaina', U.fmt(res.pT, 2) + ' €/t') + row(piece ? 'Lakšto kaina' : 'Metro kaina', U.fmt(res.pU, res.pU < 10 ? 3 : 2) + (piece ? ' €/vnt.' : ' €/m'));
        if (isFinite(res.sum)) rows += row('Suma be PVM', U.fmt(res.sum, 2) + ' €');
      }
      h += '<dl class="result__list">' + rows + '</dl>';
      h += '<p class="result__src">' + (res.src === 'table' ? 'Teorinis svoris iš asortimento lentelės.' : 'Teorinis svoris pagal formulę.') + ' ' +
        (piece ? 'Lakštams taikoma 8 kg/m² vienam storio milimetrui.' : 'Plieno tankis 7850 kg/m³.' + (L.k ? ' Į svorį įskaičiuota cinko danga (+' + U.fmt((L.k - 1) * 100, 0) + ' %), kaip mūsų lentelėse.' : '')) + ' Tikslų svorį parodo tik svėrimas.</p>';
    } else {
      h += '<p class="result__src">Pasirinkite arba įveskite matmenis, ir čia matysite svorį.</p>';
    }
    h += '<div class="result__actions"><button type="button" class="btn btn--accent btn--lg btn--block" data-add' + (res.canAdd ? '' : ' disabled') + '>' + ico('i-plus') + 'Pridėti į užklausą</button>' +
      (this.o.compact ? '' : '<button type="button" class="btn btn--text" data-copy' + (res.ok ? '' : ' disabled') + '>' + ico('i-copy') + 'Kopijuoti rezultatą</button>') + '</div></div>';
    this.el.result.className = 'result' + (res.ok ? '' : ' result--empty');
    this.el.result.innerHTML = h;
    function row(a, b) { return '<div><dt>' + a + '</dt><dd>' + b + '</dd></div>'; }
  };

  /* Užklausos sąrašo įrašas iš dabartinės būsenos */
  P.item = function (preview) {
    var s = this.s, L = DATA.lines[s.line], res = this.res, piece = CFG[s.shape].piece;
    if (!res || !res.ok || (!preview && !res.canAdd)) return null;
    var g = this.ri > -1 && L.r[this.ri][2] ? L.r[this.ri][2] : {};
    return { line: s.line, shape: s.shape, icon: L.i, name: L.n, size: res.label, std: L.std, grade: s.grade, extra: res.extra || '',
      len: piece ? null : res.len, qty: res.pcs, ask: res.ask, totalM: piece ? null : res.totalM, kgm: piece ? null : res.kgm, kgPc: piece ? res.kgPc : null,
      kg: res.totalKg, src: res.src, note: s.note.trim(), tag: res.src === 'formula' ? 'nestandartinis matmuo' : g.st === 0 ? 'pagal užsakymą' : '' };
  };
  function qtyText(it) {
    return (it.kgm ? dim(it.qty) + ' vnt. × ' + dim(it.len) + ' m = ' + U.len(it.totalM) + ' m' : dim(it.qty) + ' vnt.') + (it.ask ? ' (prašyta ' + it.ask + ')' : '');
  }
  P.summary = function () {
    var it = this.item(true); if (!it) return '';
    return it.name + ' ' + it.size + ', ' + it.std + (it.grade ? ', ' + it.grade : '') + ': ' +
      (it.kgm ? U.kgm(it.kgm, it.src === 'table') + ' kg/m' : U.kg(it.kgPc) + ' kg/vnt.') + (isFinite(it.kg) ? '; ' + qtyText(it) + '; ' + U.kg(it.kg) + ' kg' : '');
  };
  /* po pridėjimo užklausos formoje konfigūratorius lieka atidarytas kitai pozicijai: išvalomas kiekis ir pastaba */
  P.afterAdd = function () {
    if (!this.o.compact) return;
    this.s.qty = NaN; this.s.note = ''; this.renderQty(); this.sync();
  };

  P.setShape = function (shape) {
    var s = this.s; if (!CFG[shape] || shape === s.shape) return;
    s.shape = shape; s.line = DEFAULT_LINE[shape] || linesOf(shape)[0]; s.grade = '';
    $$('[data-shape]', this.el.shapes).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.shape === shape)); });
    this.renderLines(); this.renderDims(true); this.renderQty(); this.renderPrice(); this.sync();
  };
  P.setLine = function (id, keepDims) {
    var s = this.s; if (!DATA.lines[id]) return;
    if (DATA.lines[id].s !== s.shape) {
      s.shape = DATA.lines[id].s; s.line = id; s.grade = '';
      $$('[data-shape]', this.el.shapes).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.shape === s.shape)); });
      this.renderLines(); this.renderDims(true); this.renderQty(); this.renderPrice(); this.sync(); return;
    }
    var old = Object.assign({}, s.dims);
    s.line = id; s.filter = ''; this.renderLines(); this.renderDims(!keepDims);
    if (keepDims) { s.dims = old; this.fillFields(); }
    this.sync();
  };
  P.add = function () { var it = this.item(); if (it && this.o.onAdd) this.o.onAdd(it, this); };

  P.bind = function () {
    var self = this, s = self.s, root = self.root;
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
      var L = DATA.lines[s.line];
      if (b.dataset.shape) { self.touched = true; self.setShape(b.dataset.shape); }
      else if (b.dataset.size != null) {
        self.touched = true;
        var row = L.r[+b.dataset.size];
        /* storis (ar lakšto formatas) parenkamas tik tada, jei jis jau buvo pasirinktas, bet šiam matmeniui tokio nėra */
        var had = L.t === 'mx' && Object.keys(colDims(s.shape, L.c[0])).every(function (k) { return s.dims[k] > 0; });
        Object.assign(s.dims, rowDims(s.shape, row));
        if (s.shape === 'shs') s.dims.b = s.dims.a;
        if (had) {
          var cur = -1, best = -1, bd = Infinity;
          L.c.forEach(function (col, i) { if (same(colDims(s.shape, col), s.dims)) cur = i; });
          if (cur < 0 || !row[1][cur]) {
            L.c.forEach(function (col, i) {
              if (!row[1][i]) return;
              var dd = typeof col === 'number' && isFinite(s.dims.t) ? Math.abs(col - s.dims.t) : i;
              if (dd < bd) { bd = dd; best = i; }
            });
            if (best > -1) Object.assign(s.dims, colDims(s.shape, L.c[best]));
          }
        }
        self.fillFields(); self.sync();
      }
      else if (b.dataset.th != null) { self.touched = true; Object.assign(s.dims, colDims(s.shape, L.c[+b.dataset.th])); self.fillFields(); self.sync(); }
      else if (b.dataset.alt) { self.touched = true; self.setLine(b.dataset.alt, true); var r = $('input[type="radio"]:checked', self.el.lines); if (r) r.focus({ preventScroll: true }); }
      else if (b.dataset.lenQuick) { self.touched = true; s.len = +b.dataset.lenQuick; var li = $('[data-len]', root); if (li) li.value = dim(s.len); self.sync(); }
      else if (b.dataset.qunit) { self.touched = true; s.qunit = b.dataset.qunit; self.sync(); }
      else if (b.hasAttribute('data-add')) { self.add(); }
      else if (b.hasAttribute('data-copy')) {
        U.copy(self.summary(), 'Rezultatas nukopijuotas');
      }
    });
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'radio' && t.closest('[data-c="lines"]')) {
        self.touched = true; self.setLine(t.value, false);
        var r = $('input[type="radio"]:checked', self.el.lines); if (r) r.focus({ preventScroll: true });
      }
      else if (t.hasAttribute('data-grade')) { s.grade = t.value; self.sync(); }
    });
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.dim) {
        self.touched = true;
        s.dims[t.dataset.dim] = U.num(t.value);
        if (s.shape === 'shs' && t.dataset.dim === 'a') s.dims.b = s.dims.a;
        self.sync();
      }
      else if (t.hasAttribute('data-len')) { self.touched = true; s.len = t.value.trim() === '' ? NaN : (isFinite(U.num(t.value)) ? U.num(t.value) : 0); self.sync(); }
      else if (t.hasAttribute('data-qty')) { self.touched = true; s.qty = t.value.trim() === '' ? NaN : (isFinite(U.num(t.value)) ? U.num(t.value) : 0); self.sync(); }
      else if (t.hasAttribute('data-note')) { s.note = t.value; }
      else if (t.hasAttribute('data-filter')) { s.filter = t.value; self.sync(); }
      else if (t.dataset.price) {
        var v = U.num(t.value), other = $('[data-price="' + (t.dataset.price === 't' ? 'u' : 't') + '"]', root);
        if (t.dataset.price === 't') { s.pT = v > 0 ? v : NaN; s.pU = NaN; } else { s.pU = v > 0 ? v : NaN; s.pT = NaN; }
        if (!(v > 0)) other.value = '';
        self.sync();
      }
    });
    root.addEventListener('keydown', function (e) {
      var t = e.target;
      /* Enter laukuose niekada nesiunčia aplinkinės formos; kiekio ir pastabos lauke prideda poziciją */
      if (e.key === 'Enter' && t.tagName === 'INPUT') {
        e.preventDefault();
        if (!e.repeat && (t.hasAttribute('data-qty') || t.hasAttribute('data-note'))) self.add();
        return;
      }
      /* rodyklės žymų grupėse */
      var chip = t.closest ? t.closest('[data-pick] .chip') : null; if (!chip) return;
      var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step && e.key !== 'Home' && e.key !== 'End') return;
      var list = $$('.chip', chip.parentNode).filter(function (x) { return !x.hidden && !x.disabled; }), i = list.indexOf(chip);
      if (!list.length) return;
      e.preventDefault();
      list[e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : (i + step + list.length) % list.length].focus();
    });
  };

  /* ---------- Užklausos pozicijų sąrašo HTML (skaičiuoklei ir užklausos formai) ---------- */
  U.listHTML = function (items) {
    return items.map(function (it) {
      return '<li class="bom__row">' + ico(it.icon || 'p-chs', 'pico') +
        '<div class="bom__what"><strong>' + esc(it.name) + (it.tag ? '<span class="tag">' + esc(it.tag) + '</span>' : '') + '</strong><span>' + esc(it.size) + ' · ' + esc(it.std) + (it.grade ? ' · ' + esc(it.grade) : '') + (it.extra ? ' · ' + esc(it.extra) : '') + '</span>' +
        (it.note ? '<span class="bom__note">Pastaba: ' + esc(it.note) + '</span>' : '') + '</div>' +
        '<div class="bom__qty">' + esc(qtyText(it)) + '</div><div class="bom__kg">' + U.kg(it.kg) + ' kg</div>' +
        '<button type="button" class="bom__del" data-del="' + esc(it.id) + '" aria-label="Pašalinti poziciją: ' + esc(it.name) + ' ' + esc(it.size) + '">' + ico('i-trash') + '</button></li>';
    }).join('');
  };
  U.totalText = function (items) {
    var kgs = U.store.totalKg(items);
    return U.kg(kgs) + ' kg' + (kgs >= 1000 ? ' (' + U.fmt(kgs / 1000, 3) + ' t)' : '');
  };
  /* sąrašas lentelės pavidalu: įsiklijuoja tiesiai į „Excel“ */
  U.listTSV = function (items) {
    return ['Gaminys\tMatmenys\tStandartas\tMarkė\tVnt.\tIlgis, m\tSvoris, kg\tPastaba'].concat(items.map(function (it) {
      return [it.name, it.size, it.std, it.grade || '', dim(it.qty), it.len ? dim(it.len) : '', isFinite(it.kg) ? String(Math.round(it.kg * 100) / 100).replace('.', ',') : '', it.note || ''].join('\t');
    })).join('\n');
  };

  /* ---------- Trumpas pranešimas (sritis sukuriama iš karto, kad ekrano skaitytuvai ją girdėtų) ---------- */
  var toastEl = document.createElement('div'), toastTimer;
  toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
  document.body.appendChild(toastEl);
  U.toast = function (msg, href, linkText) {
    toastEl.innerHTML = ico('i-check-circle') + '<span>' + esc(msg) + '</span>' + (href ? '<a href="' + esc(href) + '">' + esc(linkText) + '</a>' : '');
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); var a = toastEl.querySelector('a'); if (a) a.remove(); }, 4200);
  };

  /* kopijavimas į iškarpinę; kai naršyklė to neleidžia (pvz., ne https), lankytojui apie tai pasakoma */
  U.copy = function (text, okMsg) {
    var no = function () { U.toast('Nepavyko nukopijuoti automatiškai. Pažymėkite tekstą ir nukopijuokite ranka.'); };
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { U.toast(okMsg); }, no); else no();
  };

  U.linesOf = linesOf;
  U.Configurator = Configurator;
})();
