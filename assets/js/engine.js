/* ==========================================================================
   UNIS: skaičiavimo variklis ir užklausos sąrašo saugykla
   Naudoja window.UNIS_DATA (assets/js/data.js, sugeneruoja build.py iš src/data).
   Visi svoriai teoriniai: plieno tankis 7850 kg/m3 (lakštams 8000, kaip UNIS lentelėse).
   ========================================================================== */
(function () {
  'use strict';

  var DATA = window.UNIS_DATA || { lines: {}, shapes: [], cats: [] };
  DATA.lines = Object.assign(Object.create(null), DATA.lines);   /* be prototipo: ?g=constructor ir pan. nelaikomi gaminiais */
  var RHO = 7850;          // kg/m3
  var RHO_SHEET = DATA.rhoSheet || 8000;

  /* ---------- Skaičiai ---------- */
  function num(v) {
    if (typeof v === 'number') return v;
    if (v == null) return NaN;
    v = String(v).trim().replace(/\s+/g, '').replace(',', '.');
    if (!/^(\d+\.?\d*|\.\d+)$/.test(v)) return NaN;              /* „6,“ rašant „6,5“ dar yra 6, ne klaida */
    return parseFloat(v);
  }
  function fmt(n, d) {
    if (!isFinite(n)) return '–';
    return n.toLocaleString('lt-LT', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  /* be pridėtinių nulių, ne daugiau kaip maxDec ženklų po kablelio */
  function trim(n, maxDec) {
    if (!isFinite(n)) return '–';
    return n.toLocaleString('lt-LT', { maximumFractionDigits: maxDec });
  }
  /* s reikšminių skaitmenų (didesni už 1000 rodomi sveikais skaičiais) */
  function sig(n, s) {
    if (!isFinite(n)) return '–';
    if (n === 0) return '0';
    var d = Math.max(0, s - 1 - Math.floor(Math.log10(Math.abs(n))));
    return n.toLocaleString('lt-LT', { maximumFractionDigits: Math.min(d, 6) });
  }
  /* Matmuo be nereikalingų nulių: 60.3 -> „60,3“, 3 -> „3“ */
  function dim(n) {
    if (!isFinite(n)) return '';
    return String(Math.round(n * 1000) / 1000).replace('.', ',');
  }
  /* Svoris (kg): 4,24 · 25,4 · 254,4 · 1 254 */
  function kg(n) {
    if (!isFinite(n)) return '–';
    var a = Math.abs(n);
    return n.toLocaleString('lt-LT', { minimumFractionDigits: a < 1000 ? 1 : 0, maximumFractionDigits: a < 10 ? 2 : a < 1000 ? 1 : 0 });
  }
  /* Metro svoris: lentelės reikšmė rodoma tokia, kokia lentelėje; formulės rezultatas 3 reikšminiais skaitmenimis */
  function kgm(n, exact) { return exact ? trim(n, 4) : sig(n, 3); }
  function len(n) { return trim(n, 3); }

  /* ---------- Formulės (kg/m, matmenys mm) ---------- */
  function wChs(D, t) { return Math.PI * (D - t) * t * RHO / 1e6; }
  function radii(t, model) {
    if (model === 'hot') return [1.5 * t, 1.0 * t];                 // EN 10210
    if (model === 'cold') {                                          // EN 10219
      if (t <= 6) return [2.0 * t, 1.0 * t];
      if (t <= 10) return [2.5 * t, 1.5 * t];
      return [3.0 * t, 2.0 * t];
    }
    if (model === 'prec') return t > 2.5 ? [1.75 * t, 0.75 * t] : [0.5 * t, 0];   // tikslieji: modelis atkartoja UNIS lenteles
    return [0, 0];
  }
  /* kai sienelė labai stora, išorinis kampo spindulys negali viršyti pusės trumpesnės kraštinės */
  function fit(r, a, b) {
    var m = Math.min(a, b) / 2;
    return r[0] > m ? [m, Math.max(0, m - (r[0] - r[1]))] : r;
  }
  function wHollow(a, b, t, model) {
    var r = fit(radii(t, model), a, b);
    var A = 2 * t * (a + b - 2 * t) - (4 - Math.PI) * (r[0] * r[0] - r[1] * r[1]);
    return A * RHO / 1e6;
  }
  function wFlat(b, t) { return b * t * RHO / 1e6; }
  function wRound(d) { return Math.PI / 4 * d * d * RHO / 1e6; }
  function wSquare(a) { return a * a * RHO / 1e6; }
  function wAngle(a, b, t) { return t * (a + b - t) * RHO / 1e6; }   // be kampų užapvalinimo, apytiksliai
  function wSheet(t, W, L) { return t * W * L * RHO_SHEET / 1e9; }   // kg vienam lakštui

  /* Išorinis paviršiaus plotas, m2 vienam metrui */
  function areaOf(shape, d, model) {
    switch (shape) {
      case 'chs': case 'round': case 'rebar': return Math.PI * (d.D || d.d) / 1000;
      case 'shs': case 'rhs':
        var ro = fit(radii(d.t, model), d.a, d.b)[0];
        return (2 * (d.a + d.b) - (8 - 2 * Math.PI) * ro) / 1000;
      case 'square': return 4 * d.a / 1000;
      case 'flat': return 2 * (d.b + d.t) / 1000;
      case 'angle': return 2 * (d.a + d.b) / 1000;
      default: return NaN;
    }
  }

  /* ---------- Lentelių paieška ---------- */
  var near = function (x, y) { return Math.abs(x - y) < 0.011; };
  function parseAB(label) {
    var p = String(label).toLowerCase().split('x');
    return [num(p[0]), num(p[1] != null ? p[1] : p[0])];
  }
  function sameAB(label, a, b) {
    var p = parseAB(label);
    return (near(p[0], a) && near(p[1], b)) || (near(p[0], b) && near(p[1], a));
  }
  function findRow(line, pred) {
    for (var i = 0; i < line.r.length; i++) if (pred(line.r[i], i)) return i;
    return -1;
  }
  function findCol(line, t) {
    if (!line.c) return -1;
    for (var i = 0; i < line.c.length; i++) if (typeof line.c[i] === 'number' && near(line.c[i], t)) return i;
    return -1;
  }
  /* lentelės langelio reikšmė ir žyma, ar ji makete pataisyta (fx: kas buvo svetainėje) */
  function cell(L, ri, ci) {
    if (ri < 0) return { w: 0 };
    var row = L.r[ri], key, w;
    if (L.t === 'mx') {
      if (ci < 0) return { w: 0 };
      w = row[1][ci]; key = row[0] + '|' + L.c[ci];
    } else { w = row[1]; key = String(row[0]); }
    var fixed = L.fx && Object.prototype.hasOwnProperty.call(L.fx, key) ? L.fx[key] : null;
    return { w: w || 0, fixed: w ? fixed : null };
  }

  /* ---------- Pagrindinis skaičiavimas ----------
     Grąžina { ok, err, kgm | kgPc, src: 'table' | 'formula', inTable, fixedFrom, area, label } */
  var BIG = 'Per dideli matmenys. Patikrinkite, ar įvedėte milimetrais.';
  function compute(lineId, dims) {
    var L = DATA.lines[lineId];
    if (!L) return { ok: false, err: 'Pasirinkite gaminį.' };
    var s = L.s, d = dims || {}, out = { ok: false, shape: s, line: lineId };
    var ri, ci, c, f, need = function (k) { return isFinite(d[k]) && d[k] > 0; };

    if (s === 'chs') {
      if (!need('D') || !need('t')) return fail(out, 'Įveskite skersmenį ir sienelės storį.');
      if (d.t * 2 >= d.D) return fail(out, 'Sienelės storis turi būti mažesnis už pusę skersmens.');
      if (d.D > 3000 || d.t > 120) return fail(out, BIG);
      f = wChs(d.D, d.t) * (L.k || 1);
      ri = findRow(L, function (r) { return near(r[0], d.D); }); ci = findCol(L, d.t);
      out.label = dim(d.D) + ' × ' + dim(d.t) + ' mm';
      out.extra = ri > -1 && L.r[ri][2] && L.r[ri][2].dn ? 'DN ' + L.r[ri][2].dn : '';
      return done(out, cell(L, ri, ci), f, areaOf('chs', d));
    }
    if (s === 'shs' || s === 'rhs') {
      if (s === 'shs') d.b = d.a;
      if (!need('a') || !need('b') || !need('t')) return fail(out, 'Įveskite kraštines ir sienelės storį.');
      if (d.t * 2 >= Math.min(d.a, d.b)) return fail(out, 'Sienelės storis turi būti mažesnis už pusę trumpesnės kraštinės.');
      if (d.a > 1500 || d.b > 1500 || d.t > 80) return fail(out, BIG);
      f = wHollow(d.a, d.b, d.t, L.m);
      ri = findRow(L, function (r) { return sameAB(r[0], d.a, d.b); }); ci = findCol(L, d.t);
      out.label = dim(d.a) + ' × ' + dim(d.b) + ' × ' + dim(d.t) + ' mm';
      return done(out, cell(L, ri, ci), f, areaOf(s, d, L.m));
    }
    if (s === 'sheet') {
      if (!need('t') || !need('W') || !need('L')) return fail(out, 'Įveskite storį, plotį ir ilgį.');
      if (d.W < 50 || d.L < 50) return fail(out, 'Plotį ir ilgį įveskite milimetrais, pvz., 1500 × 3000.');
      if (d.t > 300 || d.W > 4000 || d.L > 16000) return fail(out, BIG);
      f = wSheet(d.t, d.W, d.L);
      ri = findRow(L, function (r) { return near(r[0], d.t); });
      ci = -1;
      for (var i = 0; i < L.c.length; i++) if (sameAB(L.c[i], d.W, d.L)) ci = i;
      c = cell(L, ri, ci);
      out.label = dim(d.t) + ' × ' + dim(d.W) + ' × ' + dim(d.L) + ' mm';
      out.perPiece = true;
      out.kgm2 = d.t * RHO_SHEET / 1000;
      out.inTable = c.w > 0; out.src = c.w > 0 ? 'table' : 'formula';
      out.kgPc = c.w > 0 ? c.w : f; out.ok = true;
      return out;
    }
    if (s === 'flat') {
      if (!need('b') || !need('t')) return fail(out, 'Įveskite plotį ir storį.');
      if (d.b > 2000 || d.t > 300) return fail(out, BIG);
      ri = findRow(L, function (r) { return near(num(r[0]), d.b); }); ci = findCol(L, d.t);
      out.label = dim(d.b) + ' × ' + dim(d.t) + ' mm';
      return done(out, cell(L, ri, ci), wFlat(d.b, d.t), areaOf('flat', d));
    }
    if (s === 'round' || s === 'rebar') {
      if (!need('d')) return fail(out, 'Įveskite skersmenį.');
      if (d.d > 1000) return fail(out, 'Per didelis skersmuo. Patikrinkite, ar įvedėte milimetrais.');
      ri = findRow(L, function (r) { return near(r[0], d.d); });
      out.label = '⌀ ' + dim(d.d) + ' mm';
      return done(out, cell(L, ri, -1), wRound(d.d), areaOf('round', d));
    }
    if (s === 'square') {
      if (!need('a')) return fail(out, 'Įveskite kraštinę.');
      if (d.a > 1000) return fail(out, 'Per didelė kraštinė. Patikrinkite, ar įvedėte milimetrais.');
      ri = findRow(L, function (r) { return near(parseAB(r[0])[0], d.a); });
      out.label = dim(d.a) + ' × ' + dim(d.a) + ' mm';
      return done(out, cell(L, ri, -1), wSquare(d.a), areaOf('square', d));
    }
    if (s === 'angle') {
      if (!need('a') || !need('b') || !need('t')) return fail(out, 'Įveskite lentynų plotį ir storį.');
      if (d.t >= Math.min(d.a, d.b)) return fail(out, 'Storis turi būti mažesnis už lentynos plotį.');
      if (d.a > 1000 || d.b > 1000 || d.t > 100) return fail(out, BIG);
      ri = findRow(L, function (r) { return sameAB(r[0], d.a, d.b); }); ci = findCol(L, d.t);
      c = cell(L, ri, ci);
      out.label = dim(d.a) + ' × ' + dim(d.b) + ' × ' + dim(d.t) + ' mm';
      out.approx = !c.w;
      return done(out, c, wAngle(d.a, d.b, d.t), areaOf('angle', d));
    }
    if (s === 'beam' || s === 'channel') {
      ri = findRow(L, function (r) { return r[0] === d.key; });
      if (ri < 0) return fail(out, 'Pasirinkite profilio numerį.');
      out.label = L.r[ri][0];
      out.geo = L.r[ri][2] || null;
      return done(out, cell(L, ri, -1), NaN, NaN);
    }
    return fail(out, 'Šiam gaminiui skaičiuoklė dar neparuošta.');
  }
  function fail(out, msg) { out.err = msg; return out; }
  function done(out, c, f, area) {
    out.inTable = c.w > 0;
    out.src = c.w > 0 ? 'table' : 'formula';
    out.fixedFrom = c.fixed != null ? c.fixed : null;      // ką rodo dabartinė svetainė, jei reikšmė makete pataisyta
    out.kgm = c.w > 0 ? c.w : f;
    out.formula = f;
    out.area = area;
    out.ok = isFinite(out.kgm) && out.kgm > 0;
    if (!out.ok) out.err = 'Nepavyko apskaičiuoti. Patikrinkite matmenis.';
    return out;
  }

  /* ---------- Užklausos sąrašas (localStorage, bendras visiems puslapiams) ---------- */
  var KEY = 'unis-uzklausa-v1', mem = [], memOnly = false;
  /* priimami tik tvarkingi įrašai: sugadinti ar senos struktūros duomenys sąrašo nesugriauna */
  function valid(list) {
    return Array.isArray(list) ? list.filter(function (x) {
      return x && typeof x === 'object' && typeof x.id === 'string' && typeof x.name === 'string' &&
        typeof x.kg === 'number' && isFinite(x.kg) && (!x.kgm || (typeof x.totalM === 'number' && isFinite(x.totalM)));
    }) : [];
  }
  var store = {
    get: function () {
      if (memOnly) return mem.slice();
      try { return valid(JSON.parse(window.localStorage.getItem(KEY))); }
      catch (e) { return mem.slice(); }
    },
    set: function (list) {
      mem = list.slice();
      try { window.localStorage.setItem(KEY, JSON.stringify(list)); memOnly = false; } catch (e) { memOnly = true; /* saugykla neprieinama: laikom atmintyje */ }
      window.dispatchEvent(new CustomEvent('unis:list', { detail: list }));
    },
    add: function (item) {
      var list = store.get();
      item.id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
      list.push(item); store.set(list); return item;
    },
    remove: function (id) { store.set(store.get().filter(function (x) { return x.id !== id; })); },
    clear: function () { store.set([]); },
    totalKg: function (list) {
      return (list || store.get()).reduce(function (s, x) { return s + (isFinite(x.kg) ? x.kg : 0); }, 0);
    }
  };
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) window.dispatchEvent(new CustomEvent('unis:list', { detail: store.get() }));
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.UNIS = {
    data: DATA, RHO: RHO, RHO_SHEET: RHO_SHEET,
    num: num, fmt: fmt, dim: dim, kg: kg, kgm: kgm, len: len, esc: esc,
    w: { chs: wChs, hollow: wHollow, flat: wFlat, round: wRound, square: wSquare, angle: wAngle, sheet: wSheet },
    radii: radii, parseAB: parseAB, near: near, compute: compute, store: store
  };
})();
