#!/usr/bin/env python3
"""Patikrina perrašytas matmenų lenteles (src/data/tables/*.json) pagal teorinio svorio formules
(plieno tankis 7850 kg/m3). Naudojimas: python3 tools/verify_tables.py [katalogas] [--all]
Išveda langelius, kurių lentelės svoris nuo formulės skiriasi daugiau nei leistina riba."""
import json, math, sys, pathlib, statistics

RHO = 7850.0
def chs(D, t): return math.pi * (D - t) * t * RHO / 1e6
def hollow(B, H, t, model):
    if model == 'hot':   ro, ri = 1.5 * t, 1.0 * t
    elif model == 'cold':
        if t <= 6:    ro, ri = 2.0 * t, 1.0 * t
        elif t <= 10: ro, ri = 2.5 * t, 1.5 * t
        else:         ro, ri = 3.0 * t, 2.0 * t
    elif model == 'prec': ro, ri = (1.75 * t, 0.75 * t) if t > 2.5 else (0.5 * t, 0.0)   # tikslieji vamzdžiai: modelis atkartoja kliento lenteles
    else: ro, ri = 0.0, 0.0
    A = 2 * t * (B + H - 2 * t) - (4 - math.pi) * (ro * ro - ri * ri)
    return A * RHO / 1e6
def num(s): return float(str(s).replace(',', '.'))

SPEC = {  # slug: (tipas, parametrai)
  'vandens-duju': ('chs', {'dcol': 1, 'first': 2}),
  'vamzdziai-cinkuoti': ('chs', {'dcol': 0, 'first': 1, 'zinc': True}),
  'magistraliniai': ('chs', {'dcol': 0, 'first': 1}),
  'preciziniai-apvalus': ('chs', {'dcol': 0, 'first': 1}),
  'konstrukciniai-apvalus': ('chs', {'dcol': 0, 'first': 1}),
  'apvalus-cinkuoti': ('chs', {'dcol': 0, 'first': 1, 'zinc': True}),
  'kvadratiniai-en10219': ('hollow', {'model': 'cold'}),
  'kvadratiniai-en10210': ('hollow', {'model': 'hot'}),
  'staciakampiai-en10219': ('hollow', {'model': 'cold'}),
  'staciakampiai-en10210': ('hollow', {'model': 'hot'}),
  'preciziniai-kvadratiniai': ('hollow', {'model': 'prec'}),
  'preciziniai-staciakampiai': ('hollow', {'model': 'prec'}),
  'lakstai-karsto': ('sheet', {}), 'lakstai-salto': ('sheet', {}), 'lakstai-cinkuoti': ('sheet', {}),
  'strypai-kvadratiniai': ('sqbar', {}), 'armatura': ('round', {}),
  'strypai-nekalibruoti': ('round', {}), 'strypai-kalibruoti': ('round', {}),
  'juostos': ('flat', {}),
}

def check(d, verbose=False):
    slug = d['slug']; kind, p = SPEC.get(slug, (None, {}))
    cols, rows = d['columns'], d['rows']
    out = []; ratios = []
    if kind == 'chs':
        for r in rows:
            D = num(r[p['dcol']])
            for ci in range(p['first'], len(cols)):
                if r[ci] == '': continue
                t = num(cols[ci]); w = num(r[ci]); f = chs(D, t)
                ratios.append(w / f); out.append((f'{r[p["dcol"]]} x {cols[ci]}', w, f))
    elif kind == 'hollow':
        models = [p['model']]
        best = None
        for m in models:
            o = []; rs = []
            for r in rows:
                a, b = [num(x) for x in r[0].lower().replace('х', 'x').split('x')]
                for ci in range(1, len(cols)):
                    if r[ci] == '': continue
                    t = num(cols[ci]); w = num(r[ci]); f = hollow(a, b, t, m)
                    rs.append(w / f); o.append((f'{r[0]} x {cols[ci]}', w, f))
            err = statistics.median(abs(x - 1) for x in rs)
            if best is None or err < best[0]: best = (err, m, o, rs)
        out, ratios = best[2], best[3]
        print(f'   modelis: {best[1]} (medianinė paklaida {best[0]*100:.2f} %)')
    elif kind == 'sheet':
        for r in rows:
            t = num(r[0])
            for ci in range(1, len(cols)):
                if r[ci] == '': continue
                W, L = [num(x) for x in cols[ci].lower().split('x')]
                w = num(r[ci]); f = W * L * t * 8000 / 1e9      # lakštams kliento lentelėse taikoma 8 kg/m2 vienam mm
                ratios.append(w / f); out.append((f'{r[0]} mm {cols[ci]}', w, f))
    elif kind == 'sqbar':
        for r in rows:
            a = num(r[0].lower().split('x')[0]); w = num(r[1]); f = a * a * RHO / 1e6
            ratios.append(w / f); out.append((r[0], w, f))
    elif kind == 'round':
        # stulpeliai gali kartotis poromis: skersmuo | svoris | skersmuo | svoris
        for r in rows:
            for ci in range(0, len(cols) - 1, 2):
                if r[ci] == '' or r[ci + 1] == '': continue
                dd = num(r[ci]); w = num(r[ci + 1]); f = math.pi / 4 * dd * dd * RHO / 1e6
                ratios.append(w / f); out.append((f'd {r[ci]}', w, f))
    elif kind == 'flat':
        for r in rows:
            for ci in range(1, len(cols)):
                if r[ci] == '': continue
                try:
                    a = num(r[0].lower().split('x')[0]) if 'x' in r[0].lower() else num(r[0]); t = num(cols[ci])
                except ValueError: continue
                w = num(r[ci]); f = a * t * RHO / 1e6
                ratios.append(w / f); out.append((f'{r[0]} x {cols[ci]}', w, f))
    else:
        return None
    if not ratios: return {'n': 0}
    med = statistics.median(ratios)
    tol = 0.015
    bad = [(k, w, f, w / f) for k, w, f in out if abs(w / f / (med if p.get('zinc') else 1) - 1) > tol and abs(w - f * (med if p.get('zinc') else 1)) > 0.015]
    return {'n': len(out), 'median': med, 'min': min(ratios), 'max': max(ratios), 'bad': bad}

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    base = pathlib.Path(args[0]) if args else pathlib.Path(__file__).resolve().parent.parent / 'src/data/tables'
    total_bad = 0
    for f in sorted(base.glob('*.json')):
        d = json.loads(f.read_text('utf-8'))
        n = len(d['columns']); assert all(len(r) == n for r in d['rows']), f'{f.name}: nevienodas stulpelių skaičius'
        print(f'== {d["slug"]}: {len(d["rows"])} eil., {n} stulp.')
        res = check(d)
        if res is None: print('   (formulės patikra netaikoma: lentelė tikrinama pagal standartą atskirai)'); continue
        if not res.get('n'): print('   nėra reikšmių'); continue
        print(f'   langelių {res["n"]}, lentelė/formulė: mediana {res["median"]:.4f}, min {res["min"]:.4f}, maks {res["max"]:.4f}, nukrypstančių {len(res["bad"])}')
        for k, w, fz, ratio in res['bad']:
            print(f'     ! {k}: lentelėje {w:g}, pagal formulę {fz:.3f} (santykis {ratio:.3f})')
        total_bad += len(res['bad'])
    print(f'\nIš viso nukrypstančių langelių: {total_bad}')
