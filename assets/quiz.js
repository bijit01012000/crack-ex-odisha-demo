/* Crack-Ex v2 — chapter interactions, quiz engine, notes, flashcards, bot (canned) */
(function(){
  var LS = { done:'crk:done', notes:'crk:notes' };

  function getJ(k, d){ try{ return JSON.parse(localStorage.getItem(k)||'null') || d; }catch(e){ return d; } }
  function setJ(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  window.getJ = getJ; window.setJ = setJ;

  function chapterKey(){ var m = location.pathname.match(/chapter-(\d+)\.html/); return m ? 'c'+parseInt(m[1]) : 'other'; }

  // ---------- chapter page interactions ----------
  document.addEventListener('DOMContentLoaded', function(){
    if (typeof QAB === 'undefined') return;
    if (location.pathname.match(/chapter-/)) {
      var key = chapterKey();
      var obj = getJ(LS.done, {});
      $$('.cx-q[data-ans]').forEach(function(d){
        var id = 'Q' + (d.getAttribute('data-q') || '').split(':').pop();
        var btn = document.createElement('button');
        btn.className = 'mk' + ((obj[key] || {})[id] ? ' m' : '');
        btn.textContent = (obj[key] || {})[id] ? '✔ done' : '○ done';
        d.querySelector('summary').after(btn);
        btn.onclick = function(ev){
          ev.preventDefault();
          var o = getJ(LS.done, {}); if (!o[key]) o[key] = {};
          if (o[id]) delete o[id]; else o[id] = 1;
          setJ(LS.done, o);
          btn.classList.toggle('m', !!o[id]);
          btn.textContent = o[id] ? '✔ done' : '○ done';
          updateDone();
        };
      });
      updateDone();

      var inp = document.getElementById('filter');
      if (inp) { inp.oninput = function(){
        var v = inp.value.toLowerCase();
        $$('.cx-q').forEach(function(d){
          d.style.display = (d.innerText.toLowerCase().indexOf(v) !== -1 || !v) ? '' : 'none';
        });
      }; }

      var nt = document.getElementById('notes');
      if (nt){
        var nk = 'crk:notes:' + location.pathname.match(/chapter-(\d+)\.html/)[1];
        var store = getJ(LS.notes, {}); nt.value = store[nk] || '';
        nt.oninput = function(){ var o = getJ(LS.notes, {}); o[nk] = nt.value; setJ(LS.notes, o); };
      }

      var qbtn = document.getElementById('btn-quiz');
      if (qbtn && window.startChapterQuiz) qbtn.onclick = window.startChapterQuiz;
    }
    renderPerChap();
  });

  function updateDone(){
    var bag = document.getElementById('done-badge'); if (!bag) return;
    var done = getJ(LS.done, {})[chapterKey()] || {};
    bag.textContent = ' marked ' + Object.keys(done).length + ' ✔';
  }
  function escX(s){ var d = document.createElement('i'); d.textContent = s || ''; return d.innerHTML; }

  // ---------- quiz engine ----------
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  function chapterPool(ci){ var n = parseInt(ci); return QAB.filter(function(q){ return q.i === n && q.a; }); }

  window.startChapterQuiz = function(){
    var m = location.pathname.match(/chapter-(\d+)\.html/); if (!m) return;
    runQuiz(shuffle(chapterPool(m[1])).slice(0, 10));
  };

  window.startQuiz = function(){
    var sel = document.getElementById('q-ch');
    var timed = document.getElementById('timed').checked;
    var pool = (sel.value !== 'mixed') ? shuffle(chapterPool(sel.value)).slice(0, 18)
                                       : shuffle(QAB.filter(function(q){ return q.a; })).slice(0, 18);
    if (!pool.length) return;
    runQuiz(pool, timed);
  };

  function runQuiz(pool, timed){
    var host = document.getElementById('quiz');
    host.classList.remove('hidden');
    var idx = 0, score = 0, tLeft = timed ? 300 : null;

    function tick(){
      if (tLeft === null) return;
      var t = document.getElementById('qz-num'); if (t) t.textContent = Math.floor(tLeft/60) + ':' + ('0'+(tLeft%60)).slice(-2);
      if (tLeft-- <= 0) { finish(); return; }
    }

    function finish(){
      clearInterval(iv);
      var wrong = [];
      for (var i = 0; i < idx; i++) if (pool[i]._res === 'w') wrong.push(pool[i]);
      host.innerHTML = '<div class="cx-qz"><h2>' + score + '/' + pool.length + ' ✅</h2>' +
        '<p class="cx-muted">Score saved locally. ' + (wrong.length ? wrong.length + ' to review.' : 'Perfect run!') + '</p>' +
        (wrong.length ? '<h3>Review:</h3>' + wrong.map(function(q){ return '<div class="cx-q" style="padding:.6rem .9rem"><b>' + escX(q.stem.slice(0,140)) + '</b><div class="cx-ans">Answer ' + q.a + '</div></div>'; }).join('') : '') +
        '<button class="cx-btn cx-primary" onclick="this.closest(\'#quiz\').classList.add(\'hidden\');this.closest(\'#quiz\').innerHTML=\'\'">Close</button></div>';
    }

    function draw(){
      var q = pool[idx];
      if (!q){ finish(); return; }
      var before = idx;
      var opts = q.opts.map(function(t, i){
        return '<button class="cx-opt-btn" data-letter="' + 'ABCD'[i] + '">' + 'ABCD'[i] + '. ' + escX(t) + '</button>';
      }).join('');
      host.innerHTML = '<div class="cx-qz"><div class="cx-qz-h"><span>Q' + (idx+1) + '/' + pool.length + '</span><span id="qz-num">' + (timed ? '--:--' : '') +'</span><span>⭐ ' + score + '</span></div>' +
        '<b class="cx-qz-stem">' + escX(q.stem) + '</b>' + opts + '<div id="qz-x" class="cx-qz-x"></div>' +
        '<div style="display:flex;gap:.6rem;margin-top:.9rem"><button class="cx-btn ghost" id="qz-skip">Skip</button>' +
        '<button class="cx-btn ghost" id="qz-close">Close</button></div></div>';
      host.querySelectorAll('.cx-opt-btn').forEach(function(b){
        b.onclick = function(){
          var ch = b.getAttribute('data-letter');
          if (ch === q.a){ score++; q._res = 'r'; b.classList.add('ok'); document.getElementById('qz-x').innerHTML = '✅ Correct.' + (q.x ? ' <span>'+ escX(q.x) +'</span>' : ''); }
          else { q._res = 'w'; b.classList.add('bad');
            var ok = host.querySelector('.cx-opt-btn[data-letter="' + q.a + '"]'); if (ok) ok.classList.add('ok');
            document.getElementById('qz-x').innerHTML = '❌ Correct: ' + q.a + '.' + (q.x ? ' ' + escX(q.x) : ''); }
          host.querySelectorAll('.cx-opt-btn').forEach(function(x){ x.disabled = true; });
          setTimeout(function(){ if (before !== idx) return; idx++; draw(); }, 1300);
        };
      });
      document.getElementById('qz-skip').onclick = function(){ if (before !== idx) return; q._res = 's'; idx++; draw(); };
      document.getElementById('qz-close').onclick = function(){ idx = pool.length; finish(); };
      var iv = window.__cx_iv;
      if (timed && iv){ clearInterval(iv); }
      if (timed){
        window.__cx_iv = setInterval(tick, 1000);
      }
    }
    draw();
  }

  // ---------- dashboard bars ----------
  function renderPerChap(){
    var host = document.getElementById('perchap'); if (!host || typeof SIDE === 'undefined' || typeof QAB === 'undefined') return;
    var done = getJ(LS.done, {}), html = '', marked = 0, total = 0;
    var perCh = {}; QAB.forEach(function(q){ perCh[q.i] = (perCh[q.i] || 0) + 1; });
    SIDE.forEach(function(s, i){
      var n = i + 1;
      var dcount = done['c'+n] ? Object.keys(done['c'+n]).length : 0;
      total += perCh[n] || 0; marked += dcount;
      var pct = perCh[n] ? dcount/perCh[n]*100 : 0;
      html += '<div class="cx-bar"><a href="' + s.href + '">' + (i+1) + '. ' + s.t + '</a><span>' + dcount + '/' + (perCh[n] || 0) + '</span>' +
              '<div class="fill" data-w="' + pct.toFixed(0) + '"></div></div>';
    });
    host.innerHTML = '<div class="cx-muted" style="margin-bottom:.4rem"><b>' + marked + '/' + total + '</b> questions marked done</div>' + html;
    setTimeout(function(){
      host.querySelectorAll('.fill').forEach(function(b){ b.style.width = b.dataset.w + '%'; });
    }, 50);
  }

  // ---------- flashcards ----------
  window.flipCard = function(){
    var c = document.getElementById('fcard'); if (c) c.classList.toggle('flipped');
  };
  window.nextCard = function(){
    var pool = QAB.filter(function(x){ return x.a; });
    var q = shuffle(pool)[0];
    var fq = document.getElementById('fq');
    fq.innerHTML = '<b>Q:</b> ' + escX(q.stem.slice(0, 260)) +
      '<hr style="opacity:.3"><p class="cx-ans">Answer ' + q.a + (q.x ? ' — ' + escX(q.x) : '') + '</p>';
  };

  // ---------- assistant (canned bot) ----------
  window.ask = function(q){
    var log = document.getElementById('elog'); if (!log) return;
    log.insertAdjacentHTML('beforeend', '<div class="msgUser"><b>You:</b> ' + escX(q) + '</div>');
    setTimeout(function(){ log.insertAdjacentHTML('beforeend', '<div class="msgBot"><b>Bot:</b> ' + answerBot(q) + '</div>'); }, 260);
  };

  function answerBot(q){
    var l = (q || '').toLowerCase();
    if (/356|president's rule|presidents rule/.test(l))
      return 'Article 356 is President’s Rule: failure of constitutional machinery in a state. Needs parliamentary approval in 2 months and limited judicial review (S.R. Bommai 1994).';
    if (/ordinance/.test(l))
      return 'Ordinance power (Art 123 / 213): a legislative shortcut when Parliament isn’t seated — lapses six weeks after reassembly, can’t amend the Constitution, and re-promulgation draws criticism (D.C. Wadhwa).';
    if (/emergency|352/.test(l))
      return 'National Emergency (Art 352) covers war, external aggression, armed rebellion (post-44th). Needs special majority approval within a month; Art 19 auto-suspends only during war/external aggression (358); Art 20/21 are never suspendable.';
    if (/pocket|veto|1986/.test(l))
      return 'Pocket veto — President takes indefinite no-action (no time limit in Art 111); famously used by President Zail Singh in 1986 on the Indian Postal Bill.';
    if (/21|libert|privac|life/.test(l))
      return 'Art 21 is the constitution’s growth profession: privacy (Puttaswamy 2017), speedy trial, shelter, livelihood, legal aid, dignity in death (Common Cause 2018). Art 21A = 6-14 yrs free & compulsory education.';
    if (/laxmikanth|study|plan|book/.test(l))
      return 'Suggested routine: 1 chapter/day → 10-question quiz at the chapter page → flashcards for 10 min → mark dashboard. Hit the day goal for a streak!';
    return 'This demo bot scripts a few canned intents — ask about: Art 356, ordinances, emergency, pocket veto, Art 21, or a quiz plan. Everything inline is demo-only.';
  }
})();
