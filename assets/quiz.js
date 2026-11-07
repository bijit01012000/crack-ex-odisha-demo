/* Crack-Ex v2 — chapter interactions, quiz engine, notes, flashcards, bot (canned) */
(function(){
  var LS = { done:'crk:done', notes:'crk:notes' };

  function $(s){ return document.querySelector(s); }
  function $$(s){ return Array.from(document.querySelectorAll(s)); }

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
      // accumulate accuracy log for dashboard gauge
      var attempted = idx >= pool.length ? pool.filter(function(q){ return q._res && q._res !== 's'; }).length : 0;
      if (attempted){
        var log = getJ('crk:quizlog', { right: 0, total: 0 });
        var rightNow = attempted - wrong.length;
        log.right += rightNow; log.total += attempted;
        setJ('crk:quizlog', log);
      }
      host.innerHTML = '<div class="cx-qz"><h2>' + score + '/' + pool.length + ' ✅</h2>' +
        '<p class="cx-muted">Score + accuracy saved locally. ' + (wrong.length ? wrong.length + ' to review.' : 'Perfect run!') + '</p>' +
        (wrong.length ? '<h3>Review:</h3>' + wrong.map(function(q){ return '<div class="cx-q" style="padding:.6rem .9rem"><b>' + escX(q.stem.slice(0,140)) + '</b><div class="cx-ans">Answer ' + q.a + '</div></div>'; }).join('') : '') +
        '</div>';
      if (window.cx_confetti) window.cx_confetti();
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
  var CHKEY = 'crk:chat';
  function pushLog(html){ var log = document.getElementById('elog'); if (!log) return; log.insertAdjacentHTML('beforeend', html); log.scrollTop = log.scrollHeight; }

  function renderHistory(){
    var msgs = getJ(CHKEY, []);
    if (msgs.length) msgs.forEach(function(m){ pushLog('<div class="' + m[0] + '">' + m[1] + '</div>'); });
    if (!msgs.length) pushLog('<div class="msgBot">👋 I answer from a canned script — try "Explain Article 356", ask about ordinances, or hit <b>Test me!</b></div>');
  }
  document.addEventListener('DOMContentLoaded', renderHistory);

  window.ask = function(q, opts){
    q = (q || '').trim(); if (!q) return;
    var msgs = getJ(CHKEY, []);
    msgs.push(['msgUser', escX(q)]); setJ(CHKEY, msgs);
    pushLog('<div class="msgUser"><b>' + escX(q) + '</b></div>');
    var im = document.createElement('div'); im.className = 'cx-typing'; im.innerHTML = '<i>​</i><i>​</i><i>​</i>';
    document.getElementById('elog').appendChild(im);
    setTimeout(function(){
      im.remove();
      var a = answerBot(q);
      var html = a.replace(/\n/g, '<br>');
      var rel = related(q); if (rel) html += rel;
      var msgs2 = getJ(CHKEY, []); msgs2.push(['msgBot', html]); setJ(CHKEY, msgs2);
      pushLog('<div class="msgBot">' + html + '</div>');
    }, 620);
  };

  function related(q){
    var l = (q || '').toLowerCase();
    var words = l.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function(w){ return w.length > 3 &&
      ['text','about','explain','briefly','question','questions','answer','article','what','when','how','does','with','this','that','story','used','which','tell','more','test'].indexOf(w) === -1; });
    if (!words.length) return '';
    var hits = [];
    QAB.forEach(function(qq){
      var s = (qq.stem + ' ' + qq.opts.join(' ')).toLowerCase();
      var sc = 0; words.forEach(function(w){ if (s.indexOf(w) !== -1) sc++; });
      if (sc > 0 && qq.a) hits.push({ s: sc, q: qq });
    });
    if (!hits.length) return '';
    hits.sort(function(a, b){ return b.s - a.s; });
    var top = hits.slice(0, 3);
    return '<div style="margin-top:.45rem">🔗 Also study: ' + top.map(function(t){
      return '<a href="chapter-' + String(t.q.i).padStart(2,'0') + '.html#q' + t.q.n + '">Q' + t.q.n + ' · ' + escX(t.q.t.slice(0, 22)) + '</a>';
    }).join(' · ') + '</div>';
  }

  function answerBot(q){
    var l = (q || '').toLowerCase();
    var A = function(t){ return '🏛 ' + t; };
    if (/42nd|amendment/.test(l)) return A('The 42nd Amendment (1976) —:\n• Preamble words: Socialist, Secular, Integrity\n• DPSP additions: 39A (legal aid), 43A (worker participation), 48A (environment)\n• Art 38(2): minimise inequalities\n• Tried to extend Art 31C to all DPSPs — struck down in Minerva Mills (1980).');
    if (/bommai/.test(l)) return A('S.R. Bommai (1994):\n• President\'s Rule (Art 356) is judicially reviewable\n• Floor test is the preferred test of majority\n• Secularism = part of the basic structure\n• Dissolution before parliamentary approval needs review.');
    if (/emergency|352/.test(l)) return A('National Emergency flow (Art 352):\n1. Grounds: war, external aggression, armed rebellion (post-44th)\n2. Written Cabinet advice → President proclaims\n3. Approval by special majority within 1 month\n4. Continuation every 6 months\n5. Revoke: President anytime; Lok Sabha by simple majority\nArt 19 auto-suspends only for war/external aggression (358); Art 20-21 never.');
    if (/pocket/.test(l)) return A('Pocket veto = President keeps a bill pending indefinitely — Art 111 sets no time limit, and President\'s returning-power doesn\'t apply to Money Bills. President Zail Singh famously pocket-vetoed the Indian Postal Bill in 1986.');
    if (/quizmerazil|test me|quiz/.test(l)) return A('Quick drill:\n1. Which Article deals with Financial Emergency? (360)\n2. Can Art 21 be suspended during Emergency? (Never, post-44th)\n3. Who can remove the Vice-President? (Rajya Sabha resolution + Lok Sabha agreement)\nOpen the chapter pages for the full 2,067-Q bank!');
    if (/356|president/.test(l)) return A('Art 356 essentials:\n• Report of Governor OR otherwise → President satisfied\n• State executive dismissed, assembly suspended/dissolved\n• Approval: both houses in 2 months; initially 6 months\n• Beyond 1 year: needs emergency OR EC certification\n• Bommai: judicial review + floor test.');
    if (/ordinance/.test(l)) return A('Ordinance (Art 123 / Governor 213):\n• Co-extensive with law-making power\n• Only when legislature isn\'t in session\n• Lapses 6 weeks after reassembly\n• Cannot amend the Constitution\n• Re-promulgation is a fraud on the Constitution (D.C. Wadhwa).');
    if (/21|libert|privac/.test(l)) return A('Art 21 — the growth franchise:\n• Privacy — Puttaswamy (2017, 9 judges)\n• Speedy trial — Hussainara\n• Legal aid — Khatri\n• Shelter, livelihood, clean environment, dignity in dying (Common Cause 2018)\n• Handbook methodology: just, fair and reasonable procedure (Maneka Gandhi).');
    if (/know|book|study|plan|laxmikanth/.test(l)) return A('Demo study plan:\n1. One chapter per day (29 total)\n2. Chapter quiz (10 Q) right after reading\n3. Flashcards: 10 minutes\n4. Dashboard streak ✅\nThat gives you three full revision rounds before OPSC Prelims.');
    return A('This demo bot replies to a fixed script: try asking about \"42nd amendment\", \"Bommai\", \"emergency\", \"pocket veto\", \"ordinance\", \"Art 21\", or \"test me\". Features (persistence, related-Question links) are hooked already — plug a real LLM here later.');
  }
})();
