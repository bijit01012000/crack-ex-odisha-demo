/* Crack-Ex Odisha — core shell (adapted from java-notes pattern) */
(function(){
  var PREFIX = "crk:";
  var THEMES = ["light","paper","solarized-light","dark","amoled","one-dark","tokyo-night","catppuccin","gruvbox","nord","dracula","solarized-dark"];
  var LS_THEME = PREFIX+"theme", LS_BOOK = PREFIX+"book", LS_DONE = PREFIX+"done", LS_STREAK = PREFIX+"streak", LS_GOAL = PREFIX+"goal", LS_LAST = PREFIX+"last";

  function getTheme(){ var t = document.documentElement.getAttribute('data-theme'); return THEMES.indexOf(t) !== -1 ? t : 'light'; }
  function setTheme(t){ if(THEMES.indexOf(t) === -1) t='light'; document.documentElement.setAttribute('data-theme', t); localStorage.setItem(LS_THEME, t); updateSel(); }
  function toggleTheme(){ var cur=THEMES.indexOf(getTheme()); setTheme(THEMES[(cur+1)%THEMES.length]); }

  function updateSel(){
    var sel = document.getElementById('theme-sel'); if(!sel) return;
    sel.value = getTheme();
  }

  function buildSidebar(){
    var side = document.getElementById('side'); if(!side || typeof SIDE === 'undefined') return;
    var html = ['<hr>','<select id="theme-sel" onchange="setTheme(this.value)">'];
    THEMES.forEach(function(t){ html.push('<option value="'+t+'">'+t+'</option>'); });
    html.push('</select>', '<hr>');
    var lastMod = -1;
    var store = getJSON(LS_DONE) || {};
    SIDE.forEach(function(s, i){
      if(s.mod !== lastMod){ var titles = {0:'Volume I',1:'Volume II',2:'Extras'}; html.push('<div class="mod">'+titles[s.mod]+'</div>'); lastMod = s.mod; }
      var d = store[s.href] ? ' ✔' : '';
      html.push('<a href="'+s.href+'" class="srow '+(location.pathname.indexOf(s.href)!==-1?'on':'')+'">'+(i+1)+'. '+s.t+d+'</a>');
    });
    html.push('<hr><a href="dashboard.html">Dashboard</a>');
    side.innerHTML = html.join('');
    updateSel();
  }

  function getJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }

  function initBookmarks(){
    if(!document.body.contains('btn-quiz')) {}
  }

  // persist per-chapter progress for reading pages
  function trackVisit(){
    var m = location.pathname.match(/chapter-(\d+)\.html/); if(!m) return;
    var last = localStorage.getItem(LS_LAST);
    localStorage.setItem(LS_LAST, 'chapter-'+m[1]+'.html');
  }

  document.addEventListener('DOMContentLoaded', function(){
    if (typeof setTheme === 'undefined') return; // redefined in window scope below
    setTheme(getTheme());
    buildSidebar();
    trackVisit();
    updateStreak();
  });

  window.setTheme = setTheme;
  window.toggleTheme = toggleTheme;
  window.getJSON = getJSON;

  function updateStreak(){
    var el = document.getElementById('streak'); if(!el) return;
    var s = getJSON(LS_STREAK) || {days:0, last:null};
    var today = new Date().toISOString().slice(0,10);
    if(s.last !== today){
      var y = new Date(Date.now() - 86400000).toISOString().slice(0,10);
      s.days = (s.last === y) ? s.days + 1 : 1;
      s.last = today;
      localStorage.setItem(LS_STREAK, JSON.stringify(s));
    }
    el.textContent = s.days + ' day' + (s.days===1?'':'s');
  }
  window.updateStreak = updateStreak;
})();
