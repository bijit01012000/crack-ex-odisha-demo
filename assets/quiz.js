/* Crack-Ex: chapter interactions + quiz engine + dashboard + flashcards + demo bot */
(function(){
  var LS = { done:'crk:done', quiz:'crk:quiz' };

  function getJ(k, d){ try{ return JSON.parse(localStorage.getItem(k)||'null') || d; }catch(e){ return d; } }
  function setJ(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

  window.getJ = getJ; window.setJ = setJ;

  function chapterKey(){
    var m = location.pathname.match(/chapter-(\d+)\.html/);
    return m ? 'c'+parseInt(m[1]) : 'other';
  }

  // ---------- per-chapter interactions ----------
  document.addEventListener('DOMContentLoaded', function(){
    if (typeof QAB === 'undefined') return;
    var key = chapterKey();
    var done = getJ(LS.done, {});
    document.querySelectorAll('details.qq[data-ans]').forEach(function(d){
      var id = 'Q'+(d.getAttribute('data-q')||'').split(':')[1];
      d.querySelector('summary').addEventListener('click', function(){
        var obj = getJ(LS.done, {});
        if(!obj[key]) obj[key] = {};
        if(!obj[[id]]) obj[id] = 1;
        setJ(LS.done, obj);
      });
      // mark-answer button
      var btn = document.createElement('button');
      btn.className = 'mk'; btn.textContent = '○ done';
      btn.onclick = function(ev){
        ev.preventDefault();
        var o = getJ(LS.done, {}); if(!o[key]) o[key] = {};
        if(o[id]) delete o[id]; else o[id] = 1;
        setJ(LS.done, o);
        btn.textContent = o[id] ? '✔ done' : '○ done';
        updateDoneHeader();
      };
      d.querySelector('summary').after(btn);
      var obj = getJ(LS.done, {}); if (obj[key] && obj[key][id]) btn.textContent = '✔ done';
    });
    updateDoneHeader();
    // filter
    var inp = document.getElementById('filter');
    if (inp) {
      inp.oninput = function(){
        var v = inp.value.toLowerCase();
        document.querySelectorAll('details.qq').forEach(function(d){
          d.style.display = d.innerText.toLowerCase().indexOf(v) !== -1 ? '' : 'none';
        });
      };
    }
    // quiz start on chapter page
    var qbtn = document.getElementById('btn-quiz');
    if (qbtn && window.startChapterQuiz) qbtn.onclick = window.startChapterQuiz;
    renderPerChapter();
  });

  function updateDoneHeader(){
    var card = document.querySelector('.mets'); if(!card) return;
    var badge = document.getElementById('done-badge');
    if (!badge){ badge = document.createElement('strong'); badge.id = 'done-badge'; card.appendChild(badge); }
    var done = getJ(LS.done, {})[chapterKey()] || {};
    badge.textContent = ' Marked: '+Object.keys(done).length;
  }

  // ---------- QUIZ ENGINE ----------
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  function chapterPool(ci){
    var n = parseInt(ci);
    return QAB.filter(function(q){ return q.i === n && q.a; });
  }
  window.chapterPool = chapterPool;

  window.startChapterQuiz = function(){
    var m = location.pathname.match(/chapter-(\d+)\.html/); if(!m) return;
    var pool = shuffle(chapterPool(m[1])).slice(0, 10);
    runQuiz(pool, document.getElementById('quiz') || document.createElement('div'));
  };

  window.startQuiz = function(){
    var sel = document.getElementById('q-ch');
    var timed = document.getElementById('timed') && document.getElementById('timed').checked;
    var pool;
    if (sel && sel.value !== 'mixed') pool = shuffle(chapterPool(sel.value)).slice(0, 15);
    else pool = shuffle(QAB.filter(function(q){return q.a;})).slice(0, 15);
    runQuiz(pool, document.getElementById('quiz'), timed);
  };

  function runQuiz(pool, host, timed){
    host.classList.remove('hidden');
    host.classList.add('quiz');
    var idx = 0, score = 0;
    function draw(){
      var q = pool[idx];
      if (!q){
        // finished
        host.innerHTML = '<h3>Score: '+score+'/'+pool.length+'</h3><p>Answers are marked; you can revisit them in the chapter.</p><button class="btn" id="qz-restart">Try again</button>';
        document.getElementById('qz-restart').onclick = function(){ host.innerHTML=''; host.classList.add('hidden'); };
        // store
        var store = getJ(LS.quiz, {}); store['chapter-'+q_ch()] = store['chapter-'+q_ch()] ? store['chapter-'+q_ch()] : [];
        setJ(LS.quiz, store);
        return;
      }
      var opts = q.opts.map(function(t, i){
        return '<button class="opt-btn" data-i="' + i + '" data-letter="' + 'ABCD'[i] + '">' + 'ABCD'[i] + '. ' + escape(t) +'</button>';
      }).join('');
      host.innerHTML = '<div class="q-h"><b>Q'+(idx+1)+'/'+pool.length+'</b> <span>Score: '+score+'</span>'+(timed?'<span id="qz-time"></span>':'')+'</div>'+
        '<div class="qq shown"><b>'+escape(q.stem)+'</b><div class="opts">'+opts+'</div><div class="qz-x" id="qz-x"></div></div>'+
        '<button class="btn ghost" id="qz-skip">Skip</button>';
      host.querySelectorAll('.opt-btn').forEach(function(b){
        b.onclick = function(){
          var ch = b.getAttribute('data-letter');
          if (ch === q.a) { score++; b.classList.add('ok'); document.getElementById('qz-x').innerHTML = '✅ Correct.' + (q.x ? ' '+escape(q.x) : ''); }
          else { b.classList.add('bad'); var ok = host.querySelector('.opt-btn[data-letter="'+q.a+'"]'); if(ok) ok.classList.add('ok'); document.getElementById('qz-x').innerHTML = '❌ Correct answer: '+q.a+'.'+(q.x?' '+escape(q.x):''); }
          host.querySelectorAll('.opt-btn').forEach(function(x){ x.disabled = true; });
          host.shiftProceed = window.setTimeout(function(){ idx++; draw(); }, 1200);
        };
      });
      document.getElementById('qz-skip').onclick = function(){ idx++; draw(); };
      if (timed){
        var tLeft = 300, tEl = document.getElementById('qz-time');
        var iv = setInterval(function(){
          tEl.textContent = Math.floor(tLeft/60)+'s left';
          if (tLeft-- <= 0){ clearInterval(iv); idx = pool.length; draw(); }
        }, 1000);
      }
    }
    function q_ch(){ var m = location.pathname.match(/chapter-(\d+)\.html/); return m ? m[1] : 'mixed'; }
    draw();
  }

  // ---------- dashboard per chapter ----------
  function renderPerChapter(){
    var host = document.getElementById('perchap'); if(!host || typeof SIDE === 'undefined' || typeof QAB === 'undefined') return;
    var done = getJ(LS.done, {}), total = 0, marked = 0, hud = '';
    var perCh = {};
    QAB.forEach(function(q){ perCh[q.i] = (perCh[q.i] || 0) + 1; });
    SIDE.forEach(function(s, i){
      var n = i+1;
      var dcount = done['c'+n] ? Object.keys(done['c'+n]).length : 0;
      total += (perCh[n] || 0); marked += dcount;
      var pct = perCh[n] ? Math.min(100, dcount/perCh[n]*100) : 0;
      hud += '<div class="bar"><a href="'+s.href+'">'+n+'. '+s.t+'</a><span>'+dcount+'/'+(perCh[n]||0)+'</span><div class="fill" style="width:'+pct.toFixed(0)+'%"></div></div>';
    });
    host.innerHTML = hud + '<hr><b>Progress: '+marked+'/'+total+' MCQs marked done</b>';
  }

  // ---------- flashcards ----------
  window.nextCard = function(){
    var q = shuffle(QAB.filter(function(x){return x.a;})).pop();
    var fq = document.getElementById('fq');
    fq.innerHTML = '<b>Q:</b> '+escape(q.stem)+'<hr><b style="color:var(--accent)">A: '+q.a+'</b>';
  };

  // ---------- assistant (demo canned bot) ----------
  window.ask = function(q){
    var log = document.getElementById('elog');
    if (!log) return;
    log.innerHTML += '<div class="msgUser"><b>You:</b> '+escape(q)+'</div>';
    var canned = answerBot(q);
    setTimeout(function(){ log.innerHTML += '<div class="msgBot"><b>Bot:</b> '+canned+'</div>'; }, 250);
  };
  function answerBot(q){
    var lower = (q||'').toLowerCase();
    if (/356|president's rule|presidents rule/.test(lower))
      return 'Article 356 = President\'s Rule: failure of constitutional machinery in a state. Needs parliamentary approval in 2 months; limited judicial review per S.R. Bommai (1994). Ask "quiz me" for a practice round!';
    if (/word break|word_break/.test(lower)) return '';
    if (/ordinance/.test(lower))
      return 'Ordinance power (Art 123 / 213) is a legislative shortcut when Parliament isn\'t sitting: it lapses six weeks after reassembly, doesn\'t amend the Constitution, and can\'t suspend Articles 20-21 (D.C. Wadhwa: no re-promulgation).';
    if (/emergency|352/.test(lower))
      return 'National Emergency (Art 352) covers war, external aggression, armed rebellion (post-44th). Needs special majority approval within one month; Art 19 suspends automatically only during war/external aggression (Art 358); Art 20/21 can never be suspended.';
    if (/premium|praise|compliment/.test(lower))
      return 'Thank you! Suggest topics for richer transcripts — Concept note: "Rule of Law", "Doctrine of Eclipse", "Ninth Schedule".';
    if (/judicial|article 21|21a|liberty|privac/.test(lower))
      return 'Art 21 has been the biggest growth area: privacy (Puttaswamy), fast trial, shelter, assistance, life with dignity — the "right" list is a constitutional-bestiary. Art 21A: 6-14 yrs free education.';
    if (/laxmikanth|book|study|plan/.test(lower))
      return 'Plan: read one chapter/day; take 10-MCQ quiz @ chapter page; re-run answer-led flashcards; keep \'dashboard\' streak. Rule of law &gt; rules of thumb! 💪';
    return 'This demo bot answers from a canned script (call it a "BOT for Lord"). Try asking about: Ordinance, Article 356, Emergency, Puttaswamy, Judicial review, or "quiz me".';
  }

  function escape(s){ var d=document.createElement('i'); d.textContent=(s||'') + ''; return d.innerHTML; }
})();
