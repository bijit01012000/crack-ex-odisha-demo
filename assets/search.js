/* Crack-Ex search v2 — live results with keyword highlight + chips */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    if (typeof QAB === 'undefined') return;
    var box = document.getElementById('sbox'), host = document.getElementById('sres'), jump = document.getElementById('sjump');
    if (!box || !host) return;
    var mods = ['All', 'Vol I', 'Vol II', 'Extras'];
    jump.innerHTML = mods.map(function(m, i){ return '<button class="cx-chip" data-f="'+i+'">' + m + '</button>'; }).join('');
    var filter = 0;
    jump.querySelectorAll('.cx-chip').forEach(function(c){
      c.onclick = function(){ filter = parseInt(c.dataset.f); jump.querySelectorAll('.cx-chip').forEach(function(x){ x.style.borderColor=''; }); c.style.borderColor = 'var(--accent)'; doSearch(); };
    });

    var t0; box.oninput = function(){ clearTimeout(t0); t0 = setTimeout(doSearch, 130); };

    function doSearch(){
      var v = box.value.trim().toLowerCase();
      if (v.length < 2){ host.innerHTML = "<p class='cx-muted'>Type at least 2 characters — try \"pardon\", \"31C\", \"collegium\"…</p>"; return; }
      var hits = QAB.filter(function(q){
        if (filter !== 0){ if (filter === 1 && q.mod !== 0) return false; if (filter === 2 && q.mod !== 1) return false; if (filter === 3 && q.mod !== 2) return false; }
        return (q.stem + ' ' + q.opts.join(' ')).toLowerCase().indexOf(v) !== -1;
      }).slice(0, 30);
      if (!hits.length){ host.innerHTML = "<p class='cx-muted'>No matches for \"<b>" + escX(v) + "</b>\" in " + QAB.length + " items.</p>"; return; }
      host.innerHTML = "<p class='cx-muted' style='margin:.5rem 0'>" + hits.length + " match" + (hits.length===1?'':'es') + "</p>" +
        hits.map(function(q){
          var stem = escX(q.stem.slice(0, 170));
          var re = new RegExp('(' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i');
          var m = new RegExp(re.source, 'gi');
          stem = stem.replace(m, '<mark class="cx-mark">$1</mark>');
          return '<details class="cx-q hit"><summary><b>' + stem + '</b> <small class="cx-muted">— ch' + q.i + ', ' + escX(q.t.slice(0,26)) + '</small></summary>' +
            '<ul class="cx-opts">' + q.opts.map(function(o,i){ return '<li class="cx-opt">' + 'ABCD'[i] + '. ' + escX(o) + '</li>'; }).join('') + '</ul>' +
            '<div class="cx-ans">Answer ' + q.a + '</div>' +
            '<a class="cx-link" href="chapter-' + String(q.i).padStart(2,'0') + '.html">Open chapter ' + q.i + ' →</a></details>';
        }).join('');
    }
    function escX(s){ var d = document.createElement('i'); d.textContent = s || ''; return d.innerHTML; }
  });
})();
