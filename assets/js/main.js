/* ==========================================================================
   UNIS: bendra puslapių logika (antraštė, meniu, skirtukai, mini skaičiuoklė)
   ========================================================================== */
(function () {
  'use strict';
  var U = window.UNIS, doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var motion = root.classList.contains('js-motion');
  var params = new URLSearchParams(window.location.search);

  /* ---------- Antraštė: permatoma viršuje, balta nuslinkus ---------- */
  var header = $('.site-header'), sentinel = $('.header-sentinel');
  if (header && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { header.classList.toggle('is-stuck', !e[0].isIntersecting); }).observe(sentinel);
  }

  /* ---------- Produktų meniu ---------- */
  var megaBtn = $('[data-mega-toggle]'), mega = $('#mega'), megaTimer;
  function setMega(open) {
    if (!mega || !megaBtn) return;
    mega.hidden = !open;
    megaBtn.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-open', open || (mobileNav && !mobileNav.hidden));
  }
  if (megaBtn && mega) {
    /* pelė po užvedimo meniu neuždaro; klaviatūra nukelia tiesiai į meniu; išėjus fokusui meniu užsidaro */
    var hoverable = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    megaBtn.addEventListener('click', function (e) {
      var kb = e.detail === 0;
      setMega(hoverable && !kb ? true : mega.hidden);
      if (kb && !mega.hidden) { var first = mega.querySelector('a'); if (first) first.focus(); }
    });
    header.addEventListener('focusout', function (e) { if (!mega.hidden && e.relatedTarget && !header.contains(e.relatedTarget)) setMega(false); });
    doc.addEventListener('click', function (e) { if (!mega.hidden && !header.contains(e.target)) setMega(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mega.hidden) { setMega(false); megaBtn.focus(); } });
    if (hoverable) {
      megaBtn.addEventListener('mouseenter', function () { clearTimeout(megaTimer); setMega(true); });
      mega.addEventListener('mouseenter', function () { clearTimeout(megaTimer); });
      header.addEventListener('mouseleave', function () { megaTimer = setTimeout(function () { setMega(false); }, 220); });
      $$('.nav__link:not([data-mega-toggle])').forEach(function (a) { a.addEventListener('mouseenter', function () { megaTimer = setTimeout(function () { setMega(false); }, 120); }); });
    }
    mega.addEventListener('click', function (e) { if (e.target.closest('a')) setMega(false); });
  }

  /* ---------- Mobilusis meniu ---------- */
  var burger = $('[data-burger]'), mobileNav = $('#mobile-nav');
  function setMobile(open) {
    if (!mobileNav) return;
    if (open) mobileNav.style.top = Math.round(header.getBoundingClientRect().bottom) + 'px';
    mobileNav.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-open', open);
    doc.body.style.overflow = open ? 'hidden' : '';
    /* turinys po atidarytu meniu nepasiekiamas klaviatūra */
    [$('main'), $('.site-footer'), $('.topbar')].forEach(function (el) { if (el) el.inert = open; });
  }
  if (burger && mobileNav) {
    burger.addEventListener('click', function () { setMobile(mobileNav.hidden); });
    mobileNav.addEventListener('click', function (e) { if (e.target.closest('a')) setMobile(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mobileNav.hidden) { setMobile(false); burger.focus(); } });
    window.matchMedia('(min-width:1024px)').addEventListener('change', function (e) { if (e.matches) setMobile(false); });
  }

  /* ---------- Atsiradimas slenkant ---------- */
  var reveals = $$('[data-reveal]');
  if (motion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Hero vaizdo įrašas: įkeliamas tik kai galima ir groja tik matomas ---------- */
  var video = $('.hero__video'), hero = $('.hero'), heroBtn = $('[data-hero-toggle]'), heroPaused = false, videoOn = false;
  /* judesį (nuotraukos priartinimą ir vaizdo įrašą) lankytojas gali sustabdyti */
  if (heroBtn) heroBtn.addEventListener('click', function () {
    heroPaused = !heroPaused;
    heroBtn.setAttribute('aria-pressed', String(heroPaused));
    $('span', heroBtn).textContent = heroPaused ? 'Paleisti judesį' : 'Sustabdyti judesį';
    $('use', heroBtn).setAttribute('href', heroPaused ? '#i-play' : '#i-pause');
    hero.classList.toggle('is-paused', heroPaused);
    if (videoOn) { if (heroPaused) video.pause(); else { var pl = video.play(); if (pl && pl.catch) pl.catch(function () {}); } }
  });
  if (video && video.getAttribute('data-src-1280') && motion && !(navigator.connection && navigator.connection.saveData)) {
    videoOn = true;
    if (heroBtn) heroBtn.hidden = false;
    var big = window.innerWidth * (window.devicePixelRatio || 1) > 1500;
    video.muted = true;
    video.src = video.getAttribute(big ? 'data-src-1920' : 'data-src-1280');
    video.addEventListener('playing', function () { video.classList.add('is-playing'); }, { once: true });
    var tryPlay = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { if (e[0].isIntersecting && !heroPaused) tryPlay(); else video.pause(); }, { threshold: 0.05 }).observe(video);
    } else { tryPlay(); }
  }

  /* ---------- Asortimento skirtukai ---------- */
  $$('[data-tabs]').forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap), panels = $$('[role="tabpanel"]', wrap), photos = $$('[data-photo]', wrap);
    function select(id, focus) {
      tabs.forEach(function (t) {
        var on = t.dataset.tab === id;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach(function (p) { p.hidden = p.dataset.panel !== id; });
      photos.forEach(function (i) { i.classList.toggle('is-active', i.dataset.photo === id); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = -1;
        if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') n = 0; else if (k === 'End') n = tabs.length - 1;
        if (n > -1) { e.preventDefault(); select(tabs[n].dataset.tab, true); }
      });
    });
    /* nuorodos iš meniu ir kategorijų juostos: ?grupe=vamzdziai&g=gaminio-id */
    function go(group, lineId, scroll) {
      if (group && tabs.some(function (t) { return t.dataset.tab === group; })) select(group);
      var row = lineId && /^[\w-]+$/.test(lineId) ? $('[data-lines~="' + lineId + '"]', wrap) : null;
      if (scroll) {
        wrap.closest('section').scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
        /* fokusas keliauja kartu: į gaminio eilutę arba į pasirinktą skirtuką */
        var target = row || $('[role="tab"][aria-selected="true"]', wrap);
        if (row) row.setAttribute('tabindex', '-1');
        if (target) target.focus({ preventScroll: true });
      }
      if (row) {
        setTimeout(function () { row.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' }); row.classList.add('is-flash'); }, scroll ? 350 : 60);
        setTimeout(function () { row.classList.remove('is-flash'); }, 2600);
      }
    }
    if (params.get('grupe')) go(params.get('grupe'), params.get('g'), false);
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('[data-go-group]');
      if (!a) return;
      e.preventDefault();
      go(a.dataset.goGroup, a.dataset.goLine, true);
    });
  });

  /* ---------- Užklausos pozicijų skaičius antraštėje ---------- */
  function paintCount() {
    var n = U ? U.store.get().length : 0;
    $$('[data-rfq-count]').forEach(function (el) { el.innerHTML = '<span class="sr">Pozicijų užklausoje: </span>' + n; el.hidden = n === 0; });
  }
  paintCount();
  window.addEventListener('unis:list', paintCount);

  /* ---------- Mini skaičiuoklė pradžios puslapyje ---------- */
  var mini = $('[data-mini]');
  if (mini && U) {
    var f = { d: $('[data-mini-d]', mini), t: $('[data-mini-t]', mini), l: $('[data-mini-l]', mini), q: $('[data-mini-q]', mini) };
    var oKgm = $('[data-mini-kgm]', mini), oTot = $('[data-mini-total]', mini), err = $('[data-mini-error]', mini), drawBox = $('[data-mini-draw]', mini), link = $('[data-mini-link]', mini);
    var paint = function () {
      var D = U.num(f.d.value), t = U.num(f.t.value), L = U.num(f.l.value), q = U.num(f.q.value);
      /* tikrinama tomis pačiomis taisyklėmis kaip ir skaičiuoklėje */
      var res = U.compute('konstrukciniai-apvalus', { D: D, t: t }), valid = res.ok;
      err.hidden = !(D > 0 && t > 0 && !valid);
      if (!valid && res.err) err.textContent = res.err;
      drawBox.innerHTML = U.draw('chs', { D: D, t: t }, { title: 'Apvalaus vamzdžio pjūvis' });
      if (!valid) { oKgm.textContent = '–'; oTot.textContent = '–'; link.href = 'skaiciuokle.html'; return; }
      var w = U.w.chs(D, t);
      oKgm.textContent = U.kgm(w);
      oTot.textContent = L > 0 && q > 0 ? U.kg(w * L * q) : '–';
      link.href = 'skaiciuokle.html?f=chs&D=' + encodeURIComponent(D) + '&t=' + encodeURIComponent(t) + (L > 0 ? '&l=' + encodeURIComponent(L) : '') + (q > 0 ? '&q=' + encodeURIComponent(q) : '');
    };
    mini.addEventListener('input', paint);
    mini.addEventListener('submit', function (e) { e.preventDefault(); });
    paint();
  }
})();
