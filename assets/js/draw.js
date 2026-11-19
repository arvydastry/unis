/* ==========================================================================
   UNIS: profilio pjūvio brėžinys (SVG) su matmenų linijomis.
   UNIS.draw(shape, dims, { model, geo, title }) grąžina SVG tekstą.
   Brėžinys proporcingas įvestiems matmenims; labai plonos sienelės pastorinamos,
   kad būtų matomos.
   ========================================================================== */
(function () {
  'use strict';
  var U = window.UNIS, uid = 0;
  var W = 360, H = 280;
  function r(n) { return Math.round(n * 100) / 100; }
  function ln(x1, y1, x2, y2, cls) { return '<line x1="' + r(x1) + '" y1="' + r(y1) + '" x2="' + r(x2) + '" y2="' + r(y2) + '" class="' + cls + '"/>'; }
  function txt(x, y, s, extra) { return '<text x="' + r(x) + '" y="' + r(y) + '" class="d-label" ' + (extra || 'text-anchor="middle"') + '>' + U.esc(s) + '</text>'; }
  function circle(cx, cy, R) { return 'M' + r(cx - R) + ' ' + r(cy) + 'a' + r(R) + ' ' + r(R) + ' 0 1 0 ' + r(2 * R) + ' 0a' + r(R) + ' ' + r(R) + ' 0 1 0 ' + r(-2 * R) + ' 0Z'; }
  function rrect(x, y, w, h, q) {
    q = Math.max(0, Math.min(q, w / 2, h / 2));
    if (q < 0.3) return 'M' + r(x) + ' ' + r(y) + 'h' + r(w) + 'v' + r(h) + 'h' + r(-w) + 'Z';
    return 'M' + r(x + q) + ' ' + r(y) + 'H' + r(x + w - q) + 'A' + r(q) + ' ' + r(q) + ' 0 0 1 ' + r(x + w) + ' ' + r(y + q) +
      'V' + r(y + h - q) + 'A' + r(q) + ' ' + r(q) + ' 0 0 1 ' + r(x + w - q) + ' ' + r(y + h) +
      'H' + r(x + q) + 'A' + r(q) + ' ' + r(q) + ' 0 0 1 ' + r(x) + ' ' + r(y + h - q) +
      'V' + r(y + q) + 'A' + r(q) + ' ' + r(q) + ' 0 0 1 ' + r(x + q) + ' ' + r(y) + 'Z';
  }

  U.draw = function (shape, d, o) {
    o = o || {}; d = d || {};
    var id = 'dr' + (++uid), body = '';
    var cx = 172, cy = 124;
    var ok = function (k) { return isFinite(d[k]) && d[k] > 0; };
    var lab = function (letter, k) { return ok(k) ? letter + ' ' + U.dim(d[k]) : letter; };

    /* matmens linija tarp dviejų taškų; užrašas ties viduriu */
    function dimLine(x1, y1, x2, y2, label) {
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      return '<line x1="' + r(x1) + '" y1="' + r(y1) + '" x2="' + r(x2) + '" y2="' + r(y2) + '" class="d-dim" marker-start="url(#' + id + 'a)" marker-end="url(#' + id + 'a)"/>' +
        '<text x="' + r(mx) + '" y="' + r(my) + '" dy="-6" text-anchor="middle" class="d-label" transform="rotate(' + r(ang) + ' ' + r(mx) + ' ' + r(my) + ')">' + U.esc(label) + '</text>';
    }
    function dimBelow(x1, x2, yObj, y, label) { return ln(x1, yObj, x1, y + 5, 'd-ext') + ln(x2, yObj, x2, y + 5, 'd-ext') + dimLine(x1, y, x2, y, label); }
    function dimLeft(y1, y2, xObj, x, label) { return ln(xObj, y1, x - 5, y1, 'd-ext') + ln(xObj, y2, x - 5, y2, 'd-ext') + dimLine(x, y2, x, y1, label); }
    /* išnaša: taškas ant sienelės, lūžis ir horizontali lentynėlė su užrašu */
    function leader(px, py, ex, ey, label, dir) {
      var len = Math.max(34, label.length * 7.4 + 8) * (dir || 1);
      return '<circle cx="' + r(px) + '" cy="' + r(py) + '" r="2.2" class="d-arrow"/>' + ln(px, py, ex, ey, 'd-dim') + ln(ex, ey, ex + len, ey, 'd-dim') +
        txt(ex + len / 2, ey - 6, label);
    }

    if (shape === 'chs') {
      var D = ok('D') ? d.D : 60, t = ok('t') && ok('D') && d.t * 2 < d.D ? d.t : D * 0.09;
      var R = 84, ri = Math.max(3, Math.min(R - 2.5, R * (1 - 2 * t / D)));
      body += ln(cx - R - 14, cy, cx + R + 14, cy, 'd-axis') + ln(cx, cy - R - 14, cx, cy + R + 14, 'd-axis');
      body += '<path class="d-fill" fill-rule="evenodd" d="' + circle(cx, cy, R) + circle(cx, cy, ri) + '"/>';
      body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" class="d-edge"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r(ri) + '" class="d-edge"/>';
      body += dimBelow(cx - R, cx + R, cy, cy + R + 30, lab('⌀', 'D'));
      var rm = (R + ri) / 2, c = Math.SQRT1_2;
      body += leader(cx + rm * c, cy - rm * c, cx + R * c + 20, cy - R * c - 20, lab('t', 't'));
    }
    else if (shape === 'shs' || shape === 'rhs') {
      var a = ok('a') ? d.a : 100, b = shape === 'shs' ? a : (ok('b') ? d.b : 60);
      var tt = ok('t') && d.t * 2 < Math.min(a, b) ? d.t : Math.min(a, b) * 0.08;
      var s = Math.min(196 / a, 150 / b), w = a * s, h = b * s, x0 = cx - w / 2, y0 = cy - h / 2;
      var tw = Math.max(2.5, Math.min(tt * s, Math.min(w, h) / 2 - 2));
      var rad = U.radii(tt, o.model), ro = o.model === 'prec' || !o.model ? tw * 1.2 : rad[0] * s;
      ro = Math.max(tw * 0.9, Math.min(ro, Math.min(w, h) / 2));
      body += '<path class="d-fill" fill-rule="evenodd" d="' + rrect(x0, y0, w, h, ro) + rrect(x0 + tw, y0 + tw, w - 2 * tw, h - 2 * tw, Math.max(0, ro - tw)) + '"/>';
      body += '<path class="d-edge" d="' + rrect(x0, y0, w, h, ro) + '"/><path class="d-edge" d="' + rrect(x0 + tw, y0 + tw, w - 2 * tw, h - 2 * tw, Math.max(0, ro - tw)) + '"/>';
      body += dimBelow(x0, x0 + w, y0 + h - ro, y0 + h + 28, lab('a', 'a'));
      body += dimLeft(y0, y0 + h, x0 + ro, x0 - 26, shape === 'shs' ? lab('a', 'a') : lab('b', 'b'));
      body += leader(x0 + w * 0.7, y0 + tw / 2, x0 + w * 0.7 + 16, y0 - 22, lab('t', 't'));
    }
    else if (shape === 'flat') {
      var fb = ok('b') ? d.b : 50, ft = ok('t') ? d.t : 6;
      var fs = Math.min(210 / fb, 110 / ft), fw = fb * fs, fh = Math.max(7, ft * fs), fx = cx - fw / 2, fy = cy - fh / 2;
      body += '<rect x="' + r(fx) + '" y="' + r(fy) + '" width="' + r(fw) + '" height="' + r(fh) + '" class="d-fill"/><rect x="' + r(fx) + '" y="' + r(fy) + '" width="' + r(fw) + '" height="' + r(fh) + '" class="d-edge"/>';
      body += dimBelow(fx, fx + fw, fy + fh, fy + fh + 28, lab('b', 'b'));
      body += fh >= 26 ? dimLeft(fy, fy + fh, fx, fx - 24, lab('t', 't')) : leader(fx + fw * 0.75, fy + fh / 2, fx + fw * 0.75 + 16, fy - 24, lab('t', 't'));
    }
    else if (shape === 'round' || shape === 'rebar') {
      var RR = 72;
      body += ln(cx - RR - 14, cy, cx + RR + 14, cy, 'd-axis') + ln(cx, cy - RR - 14, cx, cy + RR + 14, 'd-axis');
      body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + RR + '" class="d-fill"/><circle cx="' + cx + '" cy="' + cy + '" r="' + RR + '" class="d-edge"/>';
      if (shape === 'rebar') body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (RR + 6) + '" class="d-edge" stroke-dasharray="10 12" stroke-width="5" opacity=".55"/>';
      body += dimBelow(cx - RR, cx + RR, cy, cy + RR + 32, lab('⌀', 'd'));
    }
    else if (shape === 'square') {
      var S = 144, sx = cx - S / 2, sy = cy - S / 2;
      body += '<rect x="' + sx + '" y="' + sy + '" width="' + S + '" height="' + S + '" class="d-fill"/><rect x="' + sx + '" y="' + sy + '" width="' + S + '" height="' + S + '" class="d-edge"/>';
      body += dimBelow(sx, sx + S, sy + S, sy + S + 28, lab('a', 'a')) + dimLeft(sy, sy + S, sx, sx - 26, lab('a', 'a'));
    }
    else if (shape === 'angle') {
      var aa = ok('a') ? d.a : 60, ab = ok('b') ? d.b : 60, at = ok('t') && d.t < Math.min(aa, ab) ? d.t : Math.min(aa, ab) * 0.12;
      var as = Math.min(170 / ab, 160 / aa), ah = aa * as, aw = ab * as, ax = cx - aw / 2, ay = cy - ah / 2, atw = Math.max(3, at * as);
      var p = 'M' + r(ax) + ' ' + r(ay) + 'h' + r(atw) + 'V' + r(ay + ah - atw - atw * 0.8) + 'q0 ' + r(atw * 0.8) + ' ' + r(atw * 0.8) + ' ' + r(atw * 0.8) + 'H' + r(ax + aw) + 'v' + r(atw) + 'H' + r(ax) + 'Z';
      body += '<path class="d-fill" d="' + p + '"/><path class="d-edge" d="' + p + '"/>';
      body += dimBelow(ax, ax + aw, ay + ah, ay + ah + 28, lab('b', 'b')) + dimLeft(ay, ay + ah, ax, ax - 26, lab('a', 'a'));
      body += leader(ax + atw / 2, ay + ah * 0.3, ax + atw + 26, ay + ah * 0.3 - 18, lab('t', 't'));
    }
    else if (shape === 'beam' || shape === 'channel') {
      var g = o.geo || {}, gh = g.h > 0 ? g.h : 200, gb = g.b > 0 ? g.b : (shape === 'beam' ? 100 : 75), gs = g.s > 0 ? g.s : gh * 0.035, gt = g.t > 0 ? g.t : gh * 0.05;
      var bs = Math.min(170 / gb, 164 / gh), bh = gh * bs, bw = gb * bs, bx = cx - bw / 2, by = cy - bh / 2;
      var tf = Math.max(3, gt * bs), twb = Math.max(2.5, gs * bs), bp;
      if (shape === 'beam') {
        bp = 'M' + r(bx) + ' ' + r(by) + 'h' + r(bw) + 'v' + r(tf) + 'H' + r(cx + twb / 2) + 'V' + r(by + bh - tf) + 'H' + r(bx + bw) + 'v' + r(tf) + 'H' + r(bx) + 'v' + r(-tf) + 'H' + r(cx - twb / 2) + 'V' + r(by + tf) + 'H' + r(bx) + 'Z';
      } else {
        bp = 'M' + r(bx) + ' ' + r(by) + 'h' + r(bw) + 'v' + r(tf) + 'H' + r(bx + twb) + 'V' + r(by + bh - tf) + 'H' + r(bx + bw) + 'v' + r(tf) + 'H' + r(bx) + 'Z';
      }
      body += '<path class="d-fill" d="' + bp + '"/><path class="d-edge" d="' + bp + '"/>';
      body += dimBelow(bx, bx + bw, by + bh, by + bh + 28, g.b > 0 ? 'b ' + U.dim(g.b) : 'b');
      body += dimLeft(by, by + bh, bx, bx - 26, g.h > 0 ? 'h ' + U.dim(g.h) : 'h');
      var wx = shape === 'beam' ? cx : bx + twb / 2;
      if (g.s > 0) body += leader(wx, cy + bh * 0.08, bx + bw + 14, cy + bh * 0.08 - 16, 's ' + U.dim(g.s));
      if (g.t > 0) body += leader(bx + bw * 0.8, by + tf / 2, bx + bw + 14, by - 18, 't ' + U.dim(g.t));
    }
    else if (shape === 'sheet') {
      var sw = ok('W') ? d.W : 1000, sl = ok('L') ? d.L : 2000, st = ok('t') ? d.t : 3;
      var ux = 0.866, uy = 0.5, sc = Math.min(250 / ((sl + sw) * ux), 128 / ((sl + sw) * uy));
      var Lx = sl * sc * ux, Ly = sl * sc * uy, Wx = sw * sc * ux, Wy = sw * sc * uy, th = Math.max(4, Math.min(16, st * 1.4));
      var ox = cx - (Lx - Wx) / 2, oy = cy - (Ly + Wy) / 2 - th / 2 + 4;
      var A = [ox, oy], B = [ox + Lx, oy + Ly], C = [ox + Lx - Wx, oy + Ly + Wy], Dp = [ox - Wx, oy + Wy];
      var pt = function (q, dy) { return r(q[0]) + ' ' + r(q[1] + (dy || 0)); };
      body += '<path class="d-solid" d="M' + pt(Dp) + 'L' + pt(C) + 'L' + pt(C, th) + 'L' + pt(Dp, th) + 'Z"/>';
      body += '<path class="d-fill" d="M' + pt(C) + 'L' + pt(B) + 'L' + pt(B, th) + 'L' + pt(C, th) + 'Z"/>';
      body += '<path d="M' + pt(A) + 'L' + pt(B) + 'L' + pt(C) + 'L' + pt(Dp) + 'Z" fill="#fff"/>';
      body += '<path class="d-edge" d="M' + pt(A) + 'L' + pt(B) + 'L' + pt(C) + 'L' + pt(Dp) + 'ZM' + pt(Dp) + 'L' + pt(Dp, th) + 'L' + pt(C, th) + 'L' + pt(B, th) + 'L' + pt(B) + 'M' + pt(C) + 'L' + pt(C, th) + '"/>';
      var off = 16;
      body += dimLine(A[0] + off * uy, A[1] - off * ux, B[0] + off * uy, B[1] - off * ux, lab('L', 'L'));
      body += dimLine(Dp[0] - off * uy, Dp[1] - off * ux, A[0] - off * uy, A[1] - off * ux, lab('W', 'W'));
      body += leader(C[0], C[1] + th / 2, C[0] - 22, C[1] + th + 22, lab('t', 't'), -1);
    }

    return '<svg class="draw" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + U.esc(o.title || 'Profilio pjūvio brėžinys') + '">' +
      '<defs><pattern id="' + id + 'h" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="#D9E5F2"/><line x1="0" y1="0" x2="0" y2="6" stroke="#00305E" stroke-width="1.1" opacity=".5"/></pattern>' +
      '<marker id="' + id + 'a" viewBox="0 0 10 10" refX="9.6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1.6 10 5 0 8.4z" class="d-arrow"/></marker></defs>' +
      body.replace(/class="d-fill"/g, 'fill="url(#' + id + 'h)"') + '</svg>';
  };
})();
