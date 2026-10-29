/* ============================================================
   蔡腾宇 · 作品集  —  site.js
   无依赖：主题切换 / 移动端菜单 / 滚动出现 / 图片灯箱 / 目录高亮 /
          复制提取码 / 图纸筛选 / 返回顶部
   ============================================================ */
(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 主题 ---------- */
  var KEY = 'cy-theme';
  function applyTheme(t) {
    if (t === 'dark' || t === 'light') {
      root.setAttribute('data-theme', t);
    } else {
      root.removeAttribute('data-theme');
    }
    var btn = d.querySelector('[data-theme-toggle]');
    if (btn) {
      var isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
      btn.setAttribute('aria-label', isDark ? '切换到浅色' : '切换到深色');
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      var use = btn.querySelector('use');
      if (use) use.setAttribute('href', isDark ? '#i-sun' : '#i-moon');
      var ic = btn.querySelector('.ic-t');
      if (ic) ic.textContent = isDark ? '浅色' : '深色';
    }
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  applyTheme(saved);
  d.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var cur = root.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : (cur === 'light' ? 'dark' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark'));
    applyTheme(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
  });

  /* ---------- 移动端菜单 ---------- */
  var menuBtn = d.querySelector('[data-menu]');
  var drawer = d.querySelector('.drawer');
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------- 滚动出现 ---------- */
  var revs = d.querySelectorAll('.reveal');
  if (revs.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(revs, function (el) { el.classList.add('in'); });
    } else {
      root.classList.add('js-anim');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      Array.prototype.forEach.call(revs, function (el) { io.observe(el); });
    }
  }

  /* ---------- 灯箱（可缩放 / 拖动 / 双指缩放） ---------- */
  var lb = d.querySelector('.lb');
  var items = Array.prototype.slice.call(d.querySelectorAll('[data-zoom]'));
  if (lb && items.length) {
    var lbImg = lb.querySelector('img');
    var lbNo = lb.querySelector('.nn');
    var lbTt = lb.querySelector('.tt');
    var lbFull = lb.querySelector('[data-full-link]');
    var stage = lb.querySelector('.stage');
    var cur = 0, zoom = 1, baseW = 0, dragging = false;
    var dragFrom = null, points = new Map(), pinch = null;

    function fitBase() {
      var w = lbImg.naturalWidth, h = lbImg.naturalHeight;
      if (!w || !h) return;
      var availW = Math.max(80, stage.clientWidth - 12);
      var availH = Math.max(80, stage.clientHeight - 12);
      baseW = Math.min(availW, availH * w / h) || availW;
    }
    function paint() {
      lbImg.style.width = Math.round(baseW * zoom) + 'px';
      lbImg.style.maxWidth = 'none';
      lbImg.style.maxHeight = 'none';
      lbImg.style.height = 'auto';
      stage.classList.toggle('zoomed', zoom > 1.01);
    }
    function setZoom(z, anchorX, anchorY) {
      var next = Math.max(1, Math.min(5, z));
      if (Math.abs(next - zoom) < 0.01) return;
      var cw = stage.clientWidth, ch = stage.clientHeight;
      var cx = anchorX == null ? stage.scrollLeft + cw / 2 : anchorX;
      var cy = anchorY == null ? stage.scrollTop + ch / 2 : anchorY;
      var ratio = next / zoom;
      zoom = next;
      paint();
      stage.scrollLeft = cx * ratio - cw / 2;
      stage.scrollTop = cy * ratio - ch / 2;
    }
    function reset() {
      zoom = 1;
      fitBase();
      paint();
      stage.scrollLeft = 0;
      stage.scrollTop = 0;
    }
    function show(i) {
      if (i < 0) i = items.length - 1;
      if (i >= items.length) i = 0;
      cur = i;
      var el = items[i];
      var full = el.getAttribute('data-full') || el.getAttribute('src') || (el.querySelector('img') && el.querySelector('img').getAttribute('src'));
      lbImg.alt = el.getAttribute('data-title') || '';
      lbImg.onload = function () { reset(); };
      lbImg.src = full;
      if (lbImg.complete) setTimeout(reset, 30);
      if (lbFull) lbFull.setAttribute('href', full);
      if (lbNo) lbNo.textContent = (i + 1 < 10 ? '0' : '') + (i + 1) + ' / ' + items.length;
      if (lbTt) lbTt.textContent = el.getAttribute('data-title') || '';
      lb.classList.add('on');
      lb.setAttribute('aria-hidden', 'false');
      d.body.style.overflow = 'hidden';
      var cb = lb.querySelector('[data-lb-close]');
      if (cb) cb.focus({ preventScroll: true });
    }
    function hide() {
      lb.classList.remove('on');
      lb.setAttribute('aria-hidden', 'true');
      d.body.style.overflow = '';
      zoom = 1;
    }

    d.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-zoom]');
      if (t) {
        e.preventDefault();
        show(items.indexOf(t));
        return;
      }
      if (e.target.closest && e.target.closest('[data-lb-close],[data-lb-nav],[data-zc]')) return;
      if (lb.classList.contains('on') && (e.target === lb || e.target.classList.contains('stage'))) hide();
    });
    lb.addEventListener('click', function (e) {
      if (e.target.closest('[data-lb-close]')) { hide(); return; }
      var nav = e.target.closest('[data-lb-nav]');
      if (nav) { show(cur + (nav.getAttribute('data-lb-nav') === 'next' ? 1 : -1)); return; }
      var zc = e.target.closest('[data-zc]');
      if (zc) {
        var k = zc.getAttribute('data-zc');
        if (k === 'in') setZoom(zoom * 1.5);
        else if (k === 'out') setZoom(zoom / 1.5);
        else reset();
      }
    });

    /* 滚轮缩放 */
    stage.addEventListener('wheel', function (e) {
      if (!lb.classList.contains('on')) return;
      e.preventDefault();
      var r = stage.getBoundingClientRect();
      setZoom(zoom * (e.deltaY < 0 ? 1.18 : 1 / 1.18), e.clientX - r.left + stage.scrollLeft, e.clientY - r.top + stage.scrollTop);
    }, { passive: false });

    /* 拖动 + 双指缩放 */
    function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
    stage.addEventListener('pointerdown', function (e) {
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (points.size === 2) {
        var p = Array.from(points.values());
        pinch = { d: dist(p[0], p[1]), z: zoom };
        dragging = false;
        stage.classList.remove('dragging');
      } else if (points.size === 1 && zoom > 1.01) {
        dragging = true;
        dragFrom = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop };
        stage.classList.add('dragging');
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!points.has(e.pointerId)) return;
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && points.size === 2) {
        var p = Array.from(points.values());
        var d = dist(p[0], p[1]);
        if (pinch.d > 0) setZoom(pinch.z * d / pinch.d);
        return;
      }
      if (dragging && dragFrom) {
        stage.scrollLeft = dragFrom.l - (e.clientX - dragFrom.x);
        stage.scrollTop = dragFrom.t - (e.clientY - dragFrom.y);
      }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      stage.addEventListener(ev, function (e) {
        points.delete(e.pointerId);
        if (points.size < 2) pinch = null;
        if (points.size === 0) { dragging = false; dragFrom = null; stage.classList.remove('dragging'); }
      });
    });
    stage.addEventListener('dblclick', function (e) {
      e.preventDefault();
      if (zoom > 1.01) reset();
      else {
        var r = stage.getBoundingClientRect();
        setZoom(2.5, e.clientX - r.left + stage.scrollLeft, e.clientY - r.top + stage.scrollTop);
      }
    });

    d.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === '+' || e.key === '=') setZoom(zoom * 1.5);
      if (e.key === '-' || e.key === '_') setZoom(zoom / 1.5);
      if (e.key === '0') reset();
    });
  }

  /* ---------- 图纸筛选 ---------- */
  var fbar = d.querySelector('[data-filters]');
  if (fbar) {
    var cells = Array.prototype.slice.call(d.querySelectorAll('[data-cat]'));
    fbar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]');
      if (!b) return;
      var f = b.getAttribute('data-filter');
      Array.prototype.forEach.call(fbar.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      cells.forEach(function (c) {
        var on = f === 'all' || c.getAttribute('data-cat') === f;
        c.style.display = on ? '' : 'none';
      });
    });
  }

  /* ---------- 目录高亮 ---------- */
  var tocLinks = d.querySelectorAll('.doc .side a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    Array.prototype.forEach.call(tocLinks, function (a) {
      map[a.getAttribute('href').slice(1)] = a;
    });
    var secs = Array.prototype.slice.call(d.querySelectorAll('.article h2[id]'));
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Array.prototype.forEach.call(tocLinks, function (a) { a.classList.remove('active'); });
        var a = map[en.target.id];
        if (a) a.classList.add('active');
      });
    }, { rootMargin: '-' + 80 + 'px 0px -70% 0px', threshold: 0 });
    secs.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 复制 ---------- */
  function flash(el) {
    var old = el.getAttribute('data-old') || el.textContent;
    el.setAttribute('data-old', old);
    el.textContent = '已复制';
    setTimeout(function () { el.textContent = el.getAttribute('data-old'); }, 1600);
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (!b) return;
    var v = b.getAttribute('data-copy');
    function done() { flash(b); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).then(done, function () { fallback(v, done); });
    } else {
      fallback(v, done);
    }
  });
  function fallback(v, done) {
    var ta = d.createElement('textarea');
    ta.value = v;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    d.body.appendChild(ta);
    ta.select();
    try { d.execCommand('copy'); done(); } catch (err) {}
    d.body.removeChild(ta);
  }

  /* ---------- 链接分享 ---------- */
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-share]');
    if (!b) return;
    e.preventDefault();
    var url = location.href.split('#')[0];
    if (navigator.share) {
      navigator.share({ title: d.title, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { flash(b); }, function () {});
    }
  });

  /* ---------- 返回顶部 ---------- */
  var top = d.querySelector('.totop');
  if (top) {
    var onScroll = function () {
      top.classList.toggle('on', window.scrollY > 640);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 当前年份 ---------- */
  Array.prototype.forEach.call(d.querySelectorAll('[data-year]'), function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
