#!/usr/bin/env python3
"""UNIS Steel Baltija demo: surinkimas.   Naudojimas: python3 build.py

1) src/data/catalog.json + src/data/tables/*.json + src/data/fixes.json
       -> assets/js/data.js (asortimentas skaičiuoklei ir užklausos formai)
       -> src/data/table-issues.json (lentelių neatitikimai, rasti tikrinant pagal formules)
2) src/pages/*.html + src/partials/*.html -> *.html projekto šaknyje
Tik standartinė Python biblioteka.
"""
import html, json, math, pathlib, re, statistics

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'
CAT = json.loads((SRC / 'data/catalog.json').read_text('utf-8'))
FIX = json.loads((SRC / 'data/fixes.json').read_text('utf-8'))
RHO = 7850.0
TOL = 0.015          # leistinas lentelės ir formulės skirtumas (1,5 %)
ISSUES = []

# ---------------------------------------------------------------- formulės
def num(s): return float(str(s).replace(',', '.'))
def clean(x):
    x = round(float(x), 4)
    return int(x) if x == int(x) else x
def w_chs(D, t): return math.pi * (D - t) * t * RHO / 1e6
def radii(t, model):
    if model == 'hot': return 1.5 * t, 1.0 * t
    if model == 'cold':
        if t <= 6: return 2.0 * t, 1.0 * t
        if t <= 10: return 2.5 * t, 1.5 * t
        return 3.0 * t, 2.0 * t
    if model == 'prec':  # tikslieji vamzdžiai: toks modelis atkartoja kliento lenteles
        return (1.75 * t, 0.75 * t) if t > 2.5 else (0.5 * t, 0.0)
    return 0.0, 0.0
def w_hollow(a, b, t, model):
    ro, ri = radii(t, model)
    return (2 * t * (a + b - 2 * t) - (4 - math.pi) * (ro * ro - ri * ri)) * RHO / 1e6
def ab(label):
    p = str(label).lower().replace('х', 'x').split('x')
    return num(p[0]), num(p[1] if len(p) > 1 else p[0])

def issue(table, where, printed, used, why):
    ISSUES.append({'lentele': table, 'vieta': where, 'svetaineje': printed, 'naudojama': used, 'pastaba': why})

# ---------------------------------------------------------------- lentelės -> data.js
def load_table(slug):
    p = SRC / 'data/tables' / f'{slug}.json'
    if not p.exists(): return None
    t = json.loads(p.read_text('utf-8'))
    n = len(t['columns'])
    assert all(len(r) == n for r in t['rows']), f'{slug}: nevienodas stulpelių skaičius'
    return t

def matrix(slug, t, first, label_of, formula=None, zinc=False):
    """Matricos tipo lentelė: eilutė = matmuo, stulpelis = storis, langelis = kg/m."""
    fx = FIX.get('tables', {}).get(slug, {})
    lab_fix, cell_fix = fx.get('labels', {}), fx.get('cells', {})
    cols = t['columns']; tcols = [num(c) for c in cols[first:]]
    k = 1.0
    if formula and zinc:
        rs = [num(c) / formula(label_of(r), tcols[i]) for r in t['rows'] for i, c in enumerate(r[first:]) if c != '']
        k = round(statistics.median(rs), 3)
    rows = []; fxmap = {}; used = set()
    for r in t['rows']:
        raw = r[first - 1]
        if raw in lab_fix:
            issue(slug, f'eilutės žymė „{raw}“', raw, lab_fix[raw], fx.get('why', {}).get(raw, 'žymė neatitinka eilutės svorių'))
            r = list(r); r[first - 1] = lab_fix[raw]
        key = label_of(r)
        rowlab = r[first - 1] if isinstance(key, tuple) else clean(key)
        vals = []
        for i, c in enumerate(r[first:]):
            ck = f'{raw}|{cols[first + i]}'; fk = f'{rowlab}|{clean(tcols[i])}'
            if ck in cell_fix:                      # rankinis pataisymas: gali ir išvalyti, ir užpildyti langelį
                used.add(ck)
                issue(slug, f'{raw} × {cols[first + i]}', c or '(tuščia)', cell_fix[ck] or '(pašalinta)', fx.get('why', {}).get(ck, 'spausdinimo klaida šaltinyje'))
                if cell_fix[ck] == '': vals.append(0); continue
                fxmap[fk] = c or ''
                w = num(cell_fix[ck])
            elif c == '':
                vals.append(0); continue
            else:
                w = num(c)
                if formula and ck not in fx.get('keep', []):
                    f = formula(key, tcols[i]) * k
                    if abs(w / f - 1) > TOL and abs(w - f) > 0.015:
                        nw = float(f'{f:.3g}')
                        issue(slug, f'{raw} × {cols[first + i]}', c, f'{nw:g}', f'pagal formulę {f:.2f} kg/m (skirtumas {100 * (w / f - 1):+.0f} %)')
                        fxmap[fk] = c; w = nw
            vals.append(clean(w))
        rows.append([rowlab, vals])
    assert used == set(cell_fix), f'{slug}: fixes.json langeliai nerasti lentelėje: {set(cell_fix) - used}'
    out = {'t': 'mx', 'c': [clean(x) for x in tcols], 'r': rows}
    if k != 1.0: out['k'] = k
    if fxmap: out['fx'] = fxmap
    return out

def build_line(lid, meta):
    t = load_table(lid)
    out = {'n': meta['name'], 'sn': meta['short'], 's': meta['shape'], 'i': meta['icon'], 'std': meta['std'], 'g': meta['grades'], 'd': meta['desc']}
    if meta.get('model'): out['m'] = meta['model']
    if t is None:
        out.update({'t': 'none', 'c': [], 'r': []}); print(f'  ! nėra lentelės: {lid}'); return out
    cols, rows, sh = t['columns'], t['rows'], meta['shape']
    if sh == 'chs':
        has_dn = cols[0].strip().upper() == 'DN'
        first = 2 if has_dn else 1
        m = matrix(lid, t, first, lambda r: num(FIX.get('tables', {}).get(lid, {}).get('labels', {}).get(r[first - 1], r[first - 1])),
                   formula=w_chs, zinc='cinkuot' in meta['name'].lower())
        if has_dn:
            for src, row in zip(rows, m['r']): row.append({'dn': src[0]})
        out.update(m)
    elif sh in ('shs', 'rhs'):
        model = meta.get('model', 'cold')
        m = matrix(lid, t, 1, lambda r: ab(r[0]), formula=lambda k, tt: w_hollow(k[0], k[1], tt, model))
        out.update(m)
    elif sh == 'sheet':
        out.update({'t': 'mx', 'c': cols[1:], 'r': [[clean(num(r[0])), [clean(num(c)) if c != '' else 0 for c in r[1:]]] for r in rows]})
    elif sh == 'flat':
        out.update(matrix(lid, t, 1, lambda r: num(r[0]), formula=lambda b, tt: b * tt * RHO / 1e6))
    elif sh == 'angle':
        out.update(matrix(lid, t, 1, lambda r: ab(r[0]), formula=None))
    elif sh in ('beam', 'channel'):
        stock = FIX.get('stock_rows', {}).get(lid, 0)
        idx = {c.strip(): i for i, c in enumerate(cols)}
        r2 = []
        cf = FIX.get('tables', {}).get(lid, {}); fxmap = {}
        for i, r in enumerate(rows):
            geo = {k: clean(num(r[idx[k]])) for k in ('h', 'b', 's', 't') if k in idx and r[idx[k]] != ''}
            if stock: geo['st'] = 1 if i < stock else 0
            w = r[1]
            if r[0] in cf.get('cells', {}):
                issue(lid, r[0], r[1], cf['cells'][r[0]], cf.get('why', {}).get(r[0], 'neatitinka standarto'))
                fxmap[r[0]] = r[1]; w = cf['cells'][r[0]]
            r2.append([r[0], clean(num(w)), geo])
        out.update({'t': 'ls', 'r': r2})
        if fxmap: out['fx'] = fxmap
    else:  # round, rebar, square: sąrašas (gali būti keli stulpelių poros šalia)
        r2 = []; fxmap = {}
        pairs = range(0, len(cols) - 1, 2)
        for p in pairs:
            for r in rows:
                if r[p] == '' or r[p + 1] == '': continue
                lab = r[p]; key = lab if 'x' in lab.lower() else clean(num(lab)); w = num(r[p + 1])
                if sh in ('round', 'square'):     # strypų lentelės suapvalintos iki 0,01: mažiems skersmenims imama formulė
                    a0 = ab(lab)[0]
                    f = a0 * a0 * RHO / 1e6 if sh == 'square' else math.pi / 4 * a0 * a0 * RHO / 1e6
                    if abs(w / f - 1) > TOL and abs(w - f) > 0.004:
                        nw = float(f'{f:.3g}')
                        issue(lid, f'{lab} mm', r[p + 1], f'{nw:g}', f'lentelėje suapvalinta; pagal formulę {f:.4f} kg/m')
                        fxmap[str(key)] = r[p + 1]; w = nw
                r2.append([key, clean(w)])
        if sh != 'square': r2.sort(key=lambda x: x[0])
        out.update({'t': 'ls', 'r': r2})
        if fxmap: out['fx'] = fxmap
    return out

def build_data():
    lines = {lid: build_line(lid, meta) for lid, meta in CAT['lines'].items()}
    cat_of = {}
    for c in CAT['categories']:
        for g in c['groups']:
            for it in g['items']:
                for lid in it['lines']: cat_of[lid] = c['id']
    for lid, l in lines.items(): l['cat'] = cat_of.get(lid, '')
    data = {'rho': 7850, 'rhoSheet': 8000, 'shapes': CAT['shapes'],
            'cats': [{'id': c['id'], 'name': c['name']} for c in CAT['categories']], 'lines': lines}
    js = ('/* Sugeneruota build.py iš src/data (nekeisti ranka). Asortimentas perrašytas iš unis-steel.lt matmenų lentelių. */\n'
          'window.UNIS_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    (ROOT / 'assets/js/data.js').write_text(js, 'utf-8')
    (SRC / 'data/table-issues.json').write_text(json.dumps(ISSUES, ensure_ascii=False, indent=1) + '\n', 'utf-8')
    cells = sum(sum(1 for v in r[1] if v) if l['t'] == 'mx' else 1 for l in lines.values() for r in l['r'])
    print(f'data.js: {len(lines)} gaminių linijos, {cells} matmenų, {len(js) // 1024} KB; lentelių neatitikimų: {len(ISSUES)}')
    return lines

# ---------------------------------------------------------------- HTML fragmentai iš katalogo
E = html.escape
def ico(name, cls='ico'): return f'<svg class="{cls}" aria-hidden="true"><use href="#{name}"/></svg>'
def uniq(seq):
    seen = []
    for x in seq:
        if x not in seen: seen.append(x)
    return seen

def lt(x):
    return (f'{x:g}' if isinstance(x, (int, float)) else str(x)).replace('.', ',')

def size_range(built):
    """Trumpas matmenų intervalas asortimento eilutei (iš lentelių duomenų)."""
    sh = built[0]['s']; rows = [r for b in built for r in b['r']]
    if not rows: return ''
    if sh in ('beam', 'channel'):
        txt = f'{rows[0][0]}–{rows[-1][0]}'
        if any('st' in r[2] for r in rows): txt += f', {sum(1 for r in rows if r[2].get("st") == 1)} iš {len(rows)} laikoma sandėlyje'
        return txt
    cols = sorted({c for b in built for c in b.get('c', []) if isinstance(c, (int, float))})
    th = f', {"sienelė" if sh in ("chs", "shs", "rhs") else "storis"} {lt(cols[0])}–{lt(cols[-1])} mm' if cols else ''
    if sh in ('chs', 'round', 'rebar'):
        v = sorted(r[0] for r in rows); return f'⌀ {lt(v[0])}–{lt(v[-1])} mm{th}'
    if sh in ('shs', 'rhs', 'angle', 'square'):
        v = sorted((ab(r[0]) for r in rows), key=lambda p: (p[0] * p[1], p[0])); f2 = lambda p: f'{lt(p[0])} × {lt(p[1])}'
        return f'nuo {f2(v[0])} iki {f2(v[-1])} mm{th}'
    if sh == 'sheet':
        v = sorted(r[0] for r in rows); fm = built[0]['c']
        return f'storis {lt(v[0])}–{lt(v[-1])} mm, formatai nuo {fm[0].replace("x", " × ")} iki {fm[-1].replace("x", " × ")} mm'
    if sh == 'flat':
        v = sorted(r[0] for r in rows); return f'plotis {lt(v[0])}–{lt(v[-1])} mm{th}'
    return ''

def fragments(built):
    L = CAT['lines']; f = {}
    mega, mob, foot, rail, tabs, photos, panels = [], [], [], [], [], [], []
    for ci, c in enumerate(CAT['categories']):
        n_items = sum(len(g['items']) for g in c['groups'])
        href = f'index.html?grupe={c["id"]}#asortimentas'
        # produktų meniu
        groups = ''
        for g in c['groups']:
            links = ''.join(f'<a class="mega__link" href="index.html?grupe={c["id"]}&amp;g={it["lines"][0]}#asortimentas" data-go-group="{c["id"]}" data-go-line="{it["lines"][0]}"><span class="sr">{E(c["name"])}: </span>{E(it["name"])}</a>' for it in g['items'])
            groups += f'<div class="mega__group"><p class="mega__group-name">{E(g["name"])}</p>{links}</div>'
        wide = ' mega__col--wide' if n_items > 6 else ''
        mega.append(f'      <div class="mega__col{wide}"><a class="mega__title" href="{href}" data-go-group="{c["id"]}">{ico(c["icon"], "pico")}{E(c["name"])}</a><div class="mega__groups">{groups}</div></div>')
        # mobilusis meniu
        mob.append(f'        <p class="mobile-nav__cat">{E(c["name"])}</p>' + ''.join(
            f'<a href="index.html?grupe={c["id"]}&amp;g={it["lines"][0]}#asortimentas" data-go-group="{c["id"]}" data-go-line="{it["lines"][0]}"><span class="sr">{E(c["name"])}: </span>{E(it["name"])}</a>' for g in c['groups'] for it in g['items']))
        foot.append(f'        <li><a href="{href}" data-go-group="{c["id"]}">{E(c["name"])}</a></li>')
        rail.append(f'    <a class="catrail__item" href="{href}" data-go-group="{c["id"]}">{ico(c["icon"], "pico")}<span class="catrail__name">{E(c["name"])}</span><span class="catrail__sub">{E(c["sub"])}</span>{ico("i-arrow-right")}</a>')
        sel = 'true' if ci == 0 else 'false'
        tabs.append(f'          <button class="catalog__tab" type="button" role="tab" id="tab-{c["id"]}" aria-controls="panel-{c["id"]}" aria-selected="{sel}" tabindex="{0 if ci == 0 else -1}" data-tab="{c["id"]}">{ico(c["icon"], "pico")}{E(c["name"])} <small><span class="sr">gaminių: </span>{n_items}</small></button>')
        active = ' class="is-active"' if ci == 0 else ''
        photos.append(f'          <img src="assets/img/foto/{c["photo"]}" alt="{E(c["photo_alt"])}" loading="lazy" data-photo="{c["id"]}"{active}>')
        rows = ''
        for g in c['groups']:
            if len(c['groups']) > 1: rows += f'\n          <p class="catalog__group">{E(g["name"])}</p>'
            for it in g['items']:
                ls = [L[x] for x in it['lines']]; first = ls[0]
                stds = ', '.join(uniq([s.strip() for l in ls for s in l['std'].split(',')]))
                rng = size_range([built[x] for x in it['lines']])
                desc = first['desc'] if len(ls) == 1 else 'Tiekiami šaltai formuoti (EN 10219) ir karštai formuoti (EN 10210) tuščiaviduriai statybiniai profiliai.'
                rows += f'''
          <article class="prow" data-lines="{' '.join(it['lines'])}">
            {ico(first['icon'], 'pico prow__ico')}
            <div class="prow__main">
              <h3 class="prow__name">{E(it['name'])}</h3>
              <p class="prow__desc">{E(desc)}</p>
            </div>
            <dl class="prow__spec">
              <div><dt>{'Standartai' if ',' in stds else 'Standartas'}</dt><dd>{E(stds).replace('EN ', 'EN&nbsp;')}</dd></div>
              <div><dt>{'Markės' if len(first['grades']) > 1 else 'Markė'}</dt><dd>{E(', '.join(first['grades']))}</dd></div>
              <div class="prow__range"><dt>Matmenys</dt><dd>{E(rng)}</dd></div>
            </dl>
            <div class="prow__actions">
              <a class="btn btn--outline btn--sm" href="skaiciuokle.html?g={it['lines'][0]}">Matmenys ir svoris<span class="sr">: {E(it['name'])}</span></a>
              <a class="btn btn--primary btn--sm" href="uzklausa.html?g={it['lines'][0]}">Pateikti užklausą<span class="sr">: {E(it['name'])}</span></a>
            </div>
          </article>'''
        hidden = '' if ci == 0 else ' hidden'
        panels.append(f'        <div class="catalog__panel" role="tabpanel" id="panel-{c["id"]}" aria-labelledby="tab-{c["id"]}" data-panel="{c["id"]}" tabindex="0"{hidden}>{rows}\n        </div>')
    f.update(mega='\n'.join(mega), mobile_products='\n'.join(mob), footer_products='\n'.join(foot), catrail='\n'.join(rail),
             catalog_tabs='\n'.join(tabs), catalog_photos='\n'.join(photos), catalog_panels='\n'.join(panels))
    return f

# ---------------------------------------------------------------- puslapiai
PART = {p.stem: p.read_text('utf-8') for p in (SRC / 'partials').glob('*.html')}
def render(text, ctx, depth=0):
    assert depth < 6
    text = re.sub(r'\{\{>\s*([\w-]+)\s*\}\}', lambda m: render(PART[m.group(1)], ctx, depth + 1), text)
    return re.sub(r'\{\{\s*([\w-]+)\s*\}\}', lambda m: ctx.get(m.group(1), ''), text)

def build_pages(frags):
    for page in sorted((SRC / 'pages').glob('*.html')):
        raw = page.read_text('utf-8')
        meta = dict(re.findall(r'^<!--\s*(\w+):\s*(.*?)\s*-->\s*$', raw, flags=re.M))
        body = re.sub(r'^<!--\s*\w+:.*?-->\s*\n', '', raw, flags=re.M).strip('\n')
        scripts = ''.join(f'<script src="assets/js/{s.strip()}" defer></script>\n' for s in meta.get('scripts', '').split(',') if s.strip())
        ctx = {**frags, **meta, 'script_tags': scripts.rstrip('\n'), f'nav_{page.stem}': ' aria-current="page"'}
        ctx['content'] = render(body, ctx)
        out = render(PART['layout'], ctx)
        left = re.findall(r'\{\{[^}]*\}\}', out)
        assert not left, f'{page.name}: liko neužpildytų žymų {left[:3]}'
        (ROOT / page.name).write_text(out, 'utf-8')
        print(f'{page.name}: {len(out) // 1024} KB')

# ---------------------------------------------------------------- kontrastų patikra (WCAG)
def lum(hexc):
    v = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    v = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in v]
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)
def check_contrast():
    css = (ROOT / 'assets/css/style.css').read_text('utf-8')
    tok = dict(re.findall(r'--([\w-]+):\s*(#[0-9A-Fa-f]{6})', css))
    pairs = [('ink', 'bg', 4.5), ('ink-2', 'bg', 4.5), ('ink-3', 'bg', 4.5), ('ink-3', 'bg-2', 4.5), ('ink-3', 'blue-50', 4.5), ('ink-2', 'blue-100', 4.5),
             ('navy-950', 'accent', 4.5), ('navy-950', 'accent-2', 4.5), ('bg', 'navy-800', 4.5), ('bg', 'navy-700', 4.5), ('blue-600', 'bg', 4.5),
             ('blue-600', 'bg-2', 4.5), ('blue-600', 'blue-50', 4.5), ('field', 'bg', 3.0), ('ok', 'ok-bg', 4.5), ('warn', 'warn-bg', 4.5), ('err', 'err-bg', 4.5), ('err', 'bg', 4.5)]
    bad = [(a, b, contrast(tok[a], tok[b]), need) for a, b, need in pairs if contrast(tok[a], tok[b]) < need]
    for a, b, c, need in bad: print(f'  ! kontrastas {a} / {b}: {c:.2f} (reikia {need})')
    print(f'kontrastai: patikrinta {len(pairs)} porų, neatitinka {len(bad)}')

if __name__ == '__main__':
    build_pages(fragments(build_data()))
    check_contrast()
