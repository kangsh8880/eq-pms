/* app.js - 코어 유틸리티, 인증, 네비게이션 */

/* ── THEME ─────────────────────────────────────────── */
function toggleTheme() {
  var html = document.documentElement;
  var cur = html.getAttribute('data-theme') || 'dark';
  var next = cur === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('eqpms_theme', next);
  // Update toggle button icon
  var btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}
function loadTheme() {
  var saved = localStorage.getItem('eqpms_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  var btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

/* ── UTILS ─────────────────────────────────────────── */
function gid(id) { return document.getElementById(id); }

function lsGet(k) {
  try { var v = localStorage.getItem('epms_' + k); return v ? JSON.parse(v) : null; } catch(e) { return null; }
}
function lsSet(k, v) {
  try { localStorage.setItem('epms_' + k, JSON.stringify(v)); } catch(e) {}
}
function saveAll() {
  lsSet('companies',    state.companies);
  lsSet('setups',       state.setups);
  lsSet('master',       state.master);
  lsSet('equipments',   state.equipments);
  lsSet('gongMaster',   state.gongMaster);
  lsSet('vendorMaster', state.vendorMaster);
}

function xe(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function hlQ(txt, q) {
  var s = xe(txt);
  if (!q) return s;
  return s.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')','gi'), '<mark class="hl">$1</mark>');
}

function bdg(req) {
  var cls = { '필수':'br', '선택':'bo', '조건부 필수':'bc', '권장':'bw' };
  return '<span class="b ' + (cls[req] || 'bo') + '">' + xe(req || '-') + '</span>';
}

function toast(title, msg, type) {
  var icons = { success:'✅', error:'❌', info:'ℹ️' };
  var el = document.createElement('div');
  el.className = 'toast ' + (type || 'info');
  el.innerHTML = '<span style="font-size:19px">' + (icons[type] || 'ℹ️') + '</span>'
    + '<div><b style="font-size:14px">' + xe(title) + '</b>'
    + '<div style="font-size:14px;color:var(--t2)">' + xe(msg) + '</div></div>';
  gid('tw').appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}

function canEdit() { return state.curUser && state.curUser.role !== 'VIEWER'; }

/* ── AUTH ───────────────────────────────────────────── */
function doLogin() {
  var id = gid('loginId').value.trim();
  var pw = gid('loginPw').value;
  if (USERS[id] && USERS[id].pw === pw) {
    state.curUser = { id: id, name: USERS[id].name, role: USERS[id].role };
    gid('loginScreen').style.display = 'none';
    gid('app').style.display = 'flex';
    gid('uNm').textContent = state.curUser.name;
    gid('uRl').textContent = state.curUser.role;
    var mn = gid('mobUNm'); if (mn) mn.textContent = state.curUser.name;
    var mr = gid('mobURl'); if (mr) mr.textContent = state.curUser.role;
    gid('loginErr').style.display = 'none';
    appInit();
    toast('로그인 성공', state.curUser.name + '님 환영합니다!', 'success');
  } else {
    gid('loginErr').style.display = 'block';
  }
}

function doLogout() {
  state.curUser = null;
  gid('app').style.display = 'none';
  gid('loginScreen').style.display = 'flex';
  gid('loginId').value = '';
  gid('loginPw').value = '';
}

/* ── INIT ───────────────────────────────────────────── */
function appInit() {
  loadTheme();
  var saved = lsGet('master');
  if (saved && saved.length) {
    state.master = saved;
  } else {
    state.master = MASTER_DB.map(function(r, i) {
      return Object.assign({}, r, { id: r.id || (i + 1) });
    });
  }
  state.companies = lsGet('companies') || [
    { id:'co1', name:'UTI (유티아이)',  industry:'디스플레이', note:'파일럿 기업', cd:'2026-04-01' },
    { id:'co2', name:'테스트기업 A',    industry:'반도체',     note:'',           cd:'2026-04-03' }
  ];
  state.setups = lsGet('setups') || {};
  if (!state.setups['co1']) {
    var ids = state.master.slice(0, 107).map(function(r){ return r.id; });
    state.setups['co1'] = { sel:ids, custom:{}, done:[], doneAt:{}, tgt:{} };
  }
  state.equipments = lsGet('equipments') || {};
  // 공정/설비업체 Master (localStorage → 없으면 초기 데이터)
  state.gongMaster   = lsGet('gongMaster')   || {};
  state.vendorMaster = lsGet('vendorMaster') || {};
  // 현재 선택 기업 탭 초기화
  _coTab = 'company';
  _coSelId = null;
  navTo('dashboard');
}

/* ── NAV ────────────────────────────────────────────── */
function adjustPageLayout(pgId) {
  // pg-hdr 실제 높이 측정 후 pg-body height 동적 조정
  requestAnimationFrame(function() {
    var pg   = gid(pgId);
    var hdr  = pg ? pg.querySelector('.pg-hdr') : null;
    var body = pg ? pg.querySelector('.pg-body') : null;
    if (!hdr || !body) return;
    var pgH  = pg.offsetHeight;
    var hdrH = hdr.offsetHeight;
    body.style.height = (pgH - hdrH - 8) + 'px';
  });
}

function navTo(p) {
  ['dashboard','master','setup','progress','equip','detail','company'].forEach(function(pg) {
    gid('pg_' + pg).style.display = (pg === p) ? 'block' : 'none';
  });
  document.querySelectorAll('.nb').forEach(function(b) { b.classList.remove('active'); });
  var btn = document.querySelector('.nb[data-p="' + p + '"]');
  if (btn) btn.classList.add('active');
  // 모바일 드로어 active 동기화
  document.querySelectorAll('.mob-nb').forEach(function(b) { b.classList.remove('active'); });
  var mb = document.querySelector('.mob-nb[data-mp="' + p + '"]');
  if (mb) mb.classList.add('active');
  if      (p === 'dashboard') pgDash();
  else if (p === 'master')    pgMaster();
  else if (p === 'setup')     pgSetup();
  else if (p === 'progress')  pgProgress();
  else if (p === 'equip')     pgEquip();
  else if (p === 'detail')    pgDetail();
  else if (p === 'company')   pgCompany();
}

/* ── QUICK NAV (기업관리 → 페이지 이동) ────────────── */
function goSetup(coId) {
  navTo('setup');
  setTimeout(function(){ if(gid('coSel')){ gid('coSel').value = coId; loadCo(); } }, 60);
}
function goProg(coId) {
  navTo('progress');
  setTimeout(function(){ if(gid('prCoSel')){ gid('prCoSel').value = coId; state.progressStep=0; loadProg(); } }, 60);
}
/* ③ 설비관리 버튼 → 설비투자진척 페이지로 이동 + 설비추가 모달 바로 오픈 */
function goEquip(coId) {
  navTo('equip');
  setTimeout(function(){
    var sel = gid('eqCoSel2');
    if (sel) {
      sel.value = coId;
      loadEquipTbl();
      // 기업 선택 후 설비추가 모달 자동 오픈 (관리자만)
      if (canEdit()) {
        setTimeout(function(){ _openEqModal(coId, null, null); }, 150);
      }
    }
  }, 80);
}

/* ── EXPORT ─────────────────────────────────────────── */
function exportMaster() {
  var cols = ['id','프로세스','구분','세부검토항목','체크포인트','필수여부','필요문서','총괄담당부서','합의부서','승인부서','표준일정'];
  var rows = [cols.join(',')];
  state.master.forEach(function(r){
    rows.push(cols.map(function(k){ return '"' + String(r[k]||'').replace(/"/g,'""') + '"'; }).join(','));
  });
  dlCSV(rows.join('\n'), 'master_' + new Date().toISOString().slice(0,10) + '.csv');
}
function expSetup() {
  var coId = gid('coSel') ? gid('coSel').value : '';
  if (!coId) { toast('오류','기업을 먼저 선택하세요.','error'); return; }
  var co = state.companies.filter(function(c){ return c.id===coId; })[0];
  var s  = state.setups[coId] || {};
  if (!(s.sel||[]).length) { toast('오류','선택된 항목이 없습니다.','error'); return; }
  var cols = ['프로세스','구분','세부검토항목','체크포인트','필수여부','필요문서','총괄담당부서','합의부서','승인부서','표준일정','목표일정'];
  var rows = [cols.join(',')];
  state.master.filter(function(r){ return (s.sel||[]).indexOf(r.id)>=0; }).forEach(function(r){
    var c = (s.custom||{})[r.id] || {};
    function cv(f){ return c[f]!==undefined ? c[f] : r[f]||''; }
    var vals = [r['프로세스'],r['구분'],r['세부검토항목'],cv('체크포인트'),cv('필수여부'),cv('필요문서'),cv('총괄담당부서'),cv('합의부서'),cv('승인부서'),r['표준일정']||'',(s.tgt||{})[r.id]||''];
    rows.push(vals.map(function(v){ return '"' + String(v||'').replace(/"/g,'""') + '"'; }).join(','));
  });
  dlCSV(rows.join('\n'), 'setup_' + co.name + '_' + new Date().toISOString().slice(0,10) + '.csv');
}
function dlCSV(data, fname) {
  var blob = new Blob(['\uFEFF' + data], { type:'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  a.click();
  toast('내보내기','CSV 파일 다운로드 중','success');
}

/* ── MODAL ──────────────────────────────────────────── */
function CM(id) { gid(id).style.display = 'none'; }

/* ── 모바일 드로어 ───────────────────────────────────── */
function toggleDrawer() {
  var drawer = gid('mobDrawer');
  var overlay = gid('mobOverlay');
  var btn = gid('hbgBtn');
  var isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
    btn.classList.remove('open');
  } else {
    drawer.classList.add('open');
    overlay.classList.add('show');
    btn.classList.add('open');
  }
}
function closeDrawer() {
  var drawer = gid('mobDrawer');
  var overlay = gid('mobOverlay');
  var btn = gid('hbgBtn');
  drawer.classList.remove('open');
  overlay.classList.remove('show');
  if (btn) btn.classList.remove('open');
}
function mobNavTo(p) {
  closeDrawer();
  navTo(p);
  // 모바일 드로어 메뉴 active 상태 업데이트
  document.querySelectorAll('.mob-nb').forEach(function(b) { b.classList.remove('active'); });
  var mb = document.querySelector('.mob-nb[data-mp="' + p + '"]');
  if (mb) mb.classList.add('active');
}

/* ── EVENTS ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function(){
  // 창 크기 변경 시 레이아웃 재계산 + 드로어 닫기
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) closeDrawer();
    ['pg_master','pg_setup','pg_progress'].forEach(function(id) {
      var pg = document.getElementById(id);
      if (pg && pg.style.display !== 'none') adjustPageLayout(id);
    });
  });
  // ESC 키로 드로어 닫기
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeDrawer();
  });
  // 연락처 입력 숫자/하이픈만 허용 (동적 생성 포함)
  document.addEventListener('input', function(e) {
    var el = e.target;
    if (el && (el.id === 'gM_tel' || el.id === 'vM_tel' || el.id === 'eqM_vtel' || el.id === 'eqM_utel')) {
      var v = el.value.replace(/[^0-9\-]/g, '');
      if (el.value !== v) el.value = v;
    }
  });
  gid('btnLogin').addEventListener('click', doLogin);
  gid('loginPw').addEventListener('keydown', function(e){ if(e.key==='Enter') doLogin(); });
  gid('loginId').addEventListener('keydown', function(e){ if(e.key==='Enter') gid('loginPw').focus(); });
  gid('itemModal').addEventListener('click', function(e){ if(e.target===this) CM('itemModal'); });
  gid('coModal').addEventListener('click',   function(e){ if(e.target===this) CM('coModal');   });
});
