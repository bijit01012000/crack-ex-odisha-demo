/* Crack-Ex search */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    if (typeof QAB === 'undefined') return;
    var box = document.getElementById('sbox'), host = document.getElementById('sres');
    if (!box) return;
    box.focus();
    var t0;
    box.oninput = function(){
      clearTimeout(t0);
      t0 = setTimeout(function(){
        var v = box.value.trim();
        if (v.length < 2){ host.innerHTML = '<p class="mets">Type at least 2 characters.</p>'; return; }
        var lv = v.toLowerCase();
        var hits = QAB.filter(function(q){
          var s = (q.stem + ' ' + q.opts.join(' ')).toLowerCase();
          return s.indexOf(lv) !== -1;
        }).slice(0, 25);
        if (!hits.length){ host.innerHTML = '<p class="mets">No matches for "'+escape_(v)+'".</p>'; return; }
        host.innerHTML = hits.map(function(q){
            return '<details class="qq"><summary>'+esc_(q.stem, 180)+' <small class="mets">ch'+q.i+' · '+esc_(q.t,24)+'</small></summary>'+
                   '<ul class="opts">'+ q.opts.map(function(o,i){return '<li class="opt"><b>'+'ABCD'[i]+'.</b> '+esc_(o,200)+'</li>';}).join('')+'</ul>'+
                   '<div class="q-answer">Answer: '+q.a+'</div>'+
                   '<a href="chapter-' + String(q.i).padStart(2,'0') + '.html">Open chapter '+q.i+'</a></details>';
        }).join('');
      }, 120);
    };
  });
  function esc_(s, n){ var d=document.createElement('i'); d.textContent=(s||'').slice(0, n||400); return d.innerHTML; }
})();
