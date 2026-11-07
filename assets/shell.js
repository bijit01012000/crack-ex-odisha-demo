/* Crack-Ex v2 shell — drawer, topbar theme popover, ⌘K, reveal-on-scroll, count-up */
(function () {
  var THEMES = ["light","paper","solarized-light","dark","amoled","one-dark","tokyo-night","catppuccin","gruvbox","nord","dracula","solarized-dark"];

  function $(s){ return document.querySelector(s); }
  function $$(s){ return Array.from(document.querySelectorAll(s)); }

  function currentTheme(){ var t = document.documentElement.getAttribute('data-theme'); return THEMES.indexOf(t) !== -1 ? t : 'paper'; }

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
      el.onclick = function(){ setThemeTokens(currentTheme().indexOf('dark') !== -1 || currentTheme() === 'amoled' ? 'paper' : 'dark'); hidePop(); };
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

    // 7. dashboard: ring, goal stepper, charts
    updateRing();
    buildCharts();
    // 8. scroll progress bar
    var sp = $('#cx-sprog');
    if (sp) { var onS = function(){ var h = document.documentElement; var max = (h.scrollHeight - h.clientHeight) || 1; sp.style.width = (h.scrollTop/max*100).toFixed(2) + '%'; };
      document.addEventListener('scroll', onS, { passive: true }); onS(); }
    // assistant action cards + clear chat
    $$('.cx-aci .cx-chip[data-act]').forEach(function(c){
      c.onclick = function(){
        var k = c.dataset.act;
        var q = ({ q42: '42nd Amendment', qbommai: 'Bommai essentials', qemg: 'National Emergency flow', qpocket: 'Pocket veto story', quizthree: 'Test me!' })[k];
        if (window.ask) window.ask(q || k);
      };
    });
    var cc = document.getElementById('cx-clearch');
    if (cc) cc.onclick = function(){ try { localStorage.removeItem('crk:chat'); } catch(e){} var el = document.getElementById('elog'); if (el) el.innerHTML = ''; window.ask && renderHistorySafe(); };
    function renderHistorySafe(){ if (document.getElementById('elog')) { var e = document.getElementById('elog'); e.innerHTML = "<div class='msgBot'>👋 cleared. Ask away — canned demo.</div>"; } }

    // 9. bottom tab active
    $$('#cx-tabbar .cx-tab').forEach(function(t){ if (location.pathname.endsWith(t.getAttribute('href'))) t.classList.add('cx-on'); });
    // 10. drawer cascade when opened
    $$('.cx-drawer .cx-nav').forEach(function(n, i){ n.style.transitionDelay = (i * 22) + 'ms'; });
    if (burger) { var origOpen = burger.onclick; burger.onclick = function(e){
      document.body.classList.add('cx-drawer-drawn');
      setTimeout(function(){ document.body.classList.remove('cx-drawer-drawn'); }, 700);
      if (origOpen) origOpen(e); };
    }
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

  function setThemeTokens(t){ if (THEMES.indexOf(t) === -1) t = 'paper';
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

/* ---------- M3: dashboard charts (SVG, demo data) ---------- */
function seedRand(seed){ return function(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }

function buildCharts(){
  if (!document.getElementById('chart-week')) return;
  renderWeek(); renderDonut(); renderGauge(); renderHeat(); renderLB();
  var ring = document.getElementById('ring-fg');
  var clamp = function(v, a, b){ return Math.max(a, Math.min(b, v)); };

  // weekly bars
  function renderWeek(){
    var rnd = seedRand(42); var host = document.getElementById('chart-week'); if (!host) return;
    var days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var vals = days.map(function(d, i){ return { d: d, v: i === 6 ? 18 : (6 + Math.floor(rnd() * 26)) }; });
    var max = Math.max.apply(null, vals.map(function(x){ return x.v; }));
    host.innerHTML = '<div class="cx-barchart">' + vals.map(function(x){
      var h = Math.round(x.v / max * 100);
      var today = x.d === 'Sun';
      return '<div class="cx-bcol"><div class="cx-bar3' + (today ? ' cx-today' : '') + '" style="height:' + h + '%" title="' + x.v + ' Qs on ' + x.d + '"><span>' + x.v + '</span></div><small>' + x.d + '</small></div>';
    }).join('') + '</div>';
    requestAnimationFrame(function(){ host.querySelectorAll('.cx-bar3').forEach(function(b, i){ setTimeout(function(){ b.classList.add('cx-grow'); }, 80 * i); }); });
  }

  // donut
  function renderDonut(){
    var host = document.getElementById('chart-donut'); if (!host) return;
    var data = [{ l: 'Volume I', v: 46, c: 'var(--accent)' }, { l: 'Volume II', v: 39, c: 'var(--accent-2)' }, { l: 'Extras', v: 15, c: '#e5a50a' }];
    var C = 2 * Math.PI * 40; var off = 0;
    var arcs = data.map(function(d){
      var seg = C * d.v / 100; var el = '<circle r="40" cx="50" cy="50" fill="none" stroke="' + d.c + '" stroke-width="14" stroke-dasharray="' + seg.toFixed(1) + ' ' + (C - seg).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 50 50)"/>';
      off += seg; return el;
    }).join('');
    host.innerHTML = '<div class="cx-donutwrap"><svg viewBox="0 0 100 100" class="cx-donut">' + arcs + '<text x="50" y="52" text-anchor="middle" font-size="17" font-weight="800" fill="currentColor">29</text><text x="50" y="63" text-anchor="middle" font-size="8" font-weight="600" fill="currentColor" opacity=".65">chapters</text></svg>' +
      '<div class="cx-legend">' + data.map(function(d){ return '<span><i style="background:' + d.c + '"></i>' + d.l + ' ' + d.v + '%</span>'; }).join('') + '</div></div>';
  }

  // gauge
  function renderGauge(){
    var host = document.getElementById('chart-gauge'); if (!host) return;
    var store = JSON.parse(localStorage.getItem('crk:quizlog') || 'null');
    var pct = store && store.total ? Math.round(100 * store.right / store.total) : 72;
    host.innerHTML = '<div class="cx-gauge"><svg viewBox="0 0 120 70"><path d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke="var(--border)" stroke-width="12" stroke-linecap="round"/>' +
      '<path class="cx-gauge-fg" d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>' +
      '<text x="60" y="55" text-anchor="middle" font-size="20" font-weight="800" fill="currentColor">' + pct + '%</text></svg>' +
      '<p class="cx-muted">quiz accuracy so far</p></div>';
    var fg = host.querySelector('.cx-gauge-fg');
    if (fg) requestAnimationFrame(function(){ fg.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.3,1)'; fg.style.strokeDashoffset = String(100 - pct); });
  }

  // heat map
  function renderHeat(){
    var host = document.getElementById('chart-heat'); if (!host) return;
    var rnd = seedRand(7);
    var streak = (JSON.parse(localStorage.getItem('crk:streak') || 'null') || {}).days || 0;
    var cells = [];
    for (var i = 29; i >= 0; i--){ var v = rnd(); if (i === 0) v = .75; var lvl = v < .25 ? 0 : (v < .55 ? 1 : (v < .85 ? 2 : 3)); cells.push({ l: lvl }); }
    host.innerHTML = '<div class="cx-heat">' + cells.map(function(c){ return '<i class="cx-h' + c.l + '"></i>'; }).join('') + '</div>' +
      '<div class="cx-muted" style="font-size:.78rem;margin-top:.4rem"> your streak: ' + streak + ' day' + (streak === 1 ? '' : 's') + ' · squares = Qs done</div>';
    requestAnimationFrame(function(){ host.querySelectorAll('.cx-heat i').forEach(function(c, i){ setTimeout(function(){ c.style.opacity = 1; c.style.transform = 'scale(1)'; }, 12 * i); }); });
  }

  // leaderboard
  function renderLB(){
    var host = document.getElementById('chart-lb'); if (!host) return;
    var rows = [
      { n: 'Subhasmita R. (Cuttack)', e: 96, s: 640 },
      { n: 'Prakash M. (Bhubaneswar)', e: 92, s: 612 },
      { n: 'Debasish P. (Sambalpur)', e: 88, s: 588 },
      { n: 'Lipsa K. (Berhampur)', e: 85, s: 570 },
      { n: 'Ritu S. (Balasore)', e: 81, s: 544 }
    ];
    var medal = ['🥇', '🥈', '🥉', '', ''];
    host.innerHTML = rows.map(function(r, i){
      return '<div class="cx-lbrow"><span class="cx-lbn">' + (medal[i] || (i + 1)) + '</span><b>' + r.n + '</b>' +
        '<span class="cx-lbs">' + r.s + ' pts</span><div class="cx-bar" style="min-width:90px;flex:1"><div class="fill" style="width:' + r.e + '%"></div></div></div>';
    }).join('');
    requestAnimationFrame(function(){ host.querySelectorAll('.fill').forEach(function(b){ b.style.width = b.style.width; }); });
  }

  window.dispatchEvent(new Event('cx-charts'));
}

/* confetti */
window.cx_confetti = function(){
  var wrap = document.createElement('div'); wrap.className = 'cx-conf';
  var colors = ['#ff7b72','#e5a50a','#3fb950','#39c5cf','#bd93f9','#ff79c6'];
  for (var i = 0; i < 46; i++){
    var s = document.createElement('i');
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.background = colors[i % colors.length];
    s.style.animationDelay = (Math.random() * .5) + 's';
    s.style.setProperty('--cx-fall', (1.8 + Math.random() * 1.2) + 's');
    s.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
    wrap.appendChild(s);
  }
  document.body.appendChild(wrap);
  setTimeout(function(){ wrap.remove(); }, 3200);
};
