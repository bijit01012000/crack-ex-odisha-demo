/* Crack-Ex v2 shell — drawer, topbar theme popover, ⌘K, reveal-on-scroll, count-up */
(function () {
  var THEMES = ["light","paper","solarized-light","dark","amoled","one-dark","tokyo-night","catppuccin","gruvbox","nord","dracula","solarized-dark"];

  function $(s){ return document.querySelector(s); }
  function $$(s){ return Array.from(document.querySelectorAll(s)); }

  function currentTheme(){ var t = document.documentElement.getAttribute('data-theme'); return THEMES.indexOf(t) !== -1 ? t : 'light'; }

  document.addEventListener('DOMContentLoaded', function(){
    // 1. drawer
    var drawer = $('#cx-drawer'), backdrop = $('#cx-backdrop'), burger = $('#cx-burger'), dx = $('#cx-drawer-x');
    function openDrawer(e){ if(e) e.preventDefault(); document.body.classList.add('cx-drawer-open'); drawer.setAttribute('aria-hidden','false'); }
    function closeDrawer(){ document.body.classList.remove('cx-drawer-open'); }
    if (burger) { burger.onclick = openDrawer; }
    if (dx) { dx.onclick = closeDrawer; }
    if (backdrop) { backdrop.onclick = closeDrawer; }
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') { closeDrawer(); hidePop(); } });

    // 2. theme popover
    var thbtn = $('#cx-thbtn'), thpop = $('#cx-thpop');
    function hidePop(){ if (thpop) thpop.classList.add('hidden'); }
    function togglePop(){ if (!thpop) return; thpop.classList.toggle('hidden'); }
    if (thbtn) {
      thbtn.onclick = togglePop;
      thpop.querySelectorAll('.cx-th').forEach(function(b){
        b.onclick = function(){ setThemeTokens(b.dataset.th); thpop.classList.add('hidden'); };
      });
    }
    ['#cx-darkq','#cx-darkq2'].forEach(function(sel){
      var el = $(sel); if (!el) return;
      el.onclick = function(){ setThemeTokens(currentTheme().indexOf('dark') !== -1 || currentTheme() === 'amoled' ? 'light' : 'dark'); hidePop(); };
    });

    // 3. ⌘K → focus global search; enter → go to search page with query
    var qs = $('#cx-qs-in');
    document.addEventListener('keydown', function(e){
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); if (qs) qs.focus(); }
    });
    if (qs) {
      qs.closest('form').onsubmit = function(ev){
        ev.preventDefault();
        location.href = 'search.html' + (qs.value ? '?q=' + encodeURIComponent(qs.value) : '');
      };
    }
    // prefill q on search page
    var q = new URLSearchParams(location.search).get('q');
    var sb = $('#sbox'); if (sb && q) { sb.value = q; sb.dispatchEvent(new Event('input')); }

    // 4. scroll reveal
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    $$('.cx-reveal').forEach(function(el, i){ el.style.transitionDelay = (i * 40) + 'ms'; io.observe(el); });

    // 5. count-up stats
    $$('.cx-count').forEach(function(el){
      var target = parseFloat(el.dataset.n || '0'); var t0 = null;
      function tick(t){ if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 900);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
        if (p < 1) requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
    });

    // 6. streak chip in drawer
    var st = $('#cx-streak'); if (st) {
      var s = JSON.parse(localStorage.getItem('crk:streak') || 'null') || { days: 1, last: null };
      var today = new Date().toISOString().slice(0,10);
      if (s.last !== today) { s.days = 1; s.last = today; localStorage.setItem('crk:streak', JSON.stringify(s)); }
      st.textContent = s.days + '-day';
      var sd = document.getElementById('streak-day'); if (sd) sd.textContent = s.days + (s.days === 1 ? ' day' : ' days');
    }

    // 7. dashboard ring + goal stepper
    updateRing();
    var gVal = $('#g-val'), gp = document.getElementById('g-plus'), gm = document.getElementById('g-minus');
    function goal(){ return parseFloat(localStorage.getItem('crk:goal') || '10'); }
    function setGoal(v){ v = Math.max(1, Math.min(50, v)); localStorage.setItem('crk:goal', v); if (gVal) gVal.textContent = v; }
    if (gVal) gVal.textContent = goal();
    if (gp) gp.onclick = function(){ setGoal(goal() + 5); };
    if (gm) gm.onclick = function(){ setGoal(goal() - 5); };
    // 8. consult book visual
    var book = $('#conf'); window.cx_book = function(){
      var conf = $('#conf'); if (!conf) return;
      conf.innerHTML = '<div class="cx-ans" style="margin-top:.8rem">🎉 Booked! This demo stops here — no backend integration.</div>';
    };
  });

  function setThemeTokens(t){ if (THEMES.indexOf(t) === -1) t = 'light';
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('crk:theme', t); } catch(e) {}
  }

  function updateRing(){
    var ring = $('#ring-fg'); if (!ring || typeof QAB === 'undefined') return;
    var done = JSON.parse(localStorage.getItem('crk:done') || '{}');
    var marked = 0;
    var perCh = {}; QAB.forEach(function(q){ perCh[q.i] = (perCh[q.i]||0)+1; });
    Object.keys(perCh).forEach(function(i){
      var d = done['c'+i] || {}; marked += Object.keys(d).length;
    });
    var total = QAB.length;
    var pct = total ? Math.round(marked / total * 100) : 0;
    var off = 327 - (327 * pct / 100);
    $('#ring-num').textContent = pct + '%';
    ring.style.strokeDashoffset = off;
  }
})();
