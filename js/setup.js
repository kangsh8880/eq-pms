/* setup.js - 프로세스 Setup */

function pgSetup() {
  var coOpts = state.companies.map(function(c){
    return '<option value="' + xe(c.id) + '">' + xe(c.name) + ' (' + xe(c.industry||'-') + ')</option>';
  }).join('');
  gid('pg_setup').innerHTML =
    '<div class="pg-hdr">'
    + '<div class="ph"><h1 class="pt">⚙️ 프로세스 Setup</h1>'
    + '<p class="ps">Master DB에서 항목을 선택 → 기업별 커스터마이징</p></div>'
    + '<div class="topbar">'
    +   '<b style="font-size:23px">🏢 기업 선택</b>'
    +   '<div class="flex-g">'
    +     '<select id="coSel" onchange="loadCo()">'
    +       '<option value="">— 기업을 선택하세요 —</option>' + coOpts
    +     '</select>'
    +     '<button class="btn bp bsm" onclick="navTo(\'company\')">+ 기업 추가</button>'
    +   '</div>'
    +   '<span id="siBadge"></span>'
    +   '<div class="flex-g ml-auto">'
    +     '<button class="btn bs bsm" onclick="expSetup()">📥 CSV</button>'
    +     '<button class="btn bg bsm" onclick="saveStp()">💾 저장</button>'
    +   '</div>'
    + '</div>'
    + '</div>'
    + '<div class="pg-body">'
    + '<div class="s3col" id="s3col">'
    +   '<div class="spanel" id="sProcPanel">'
    +     '<div class="shdr"><span>프로세스 단계</span><span id="siTot" class="t2 sm">0개</span></div>'
    +     '<div id="sProcList"><div class="sempty"><p>기업을 선택하세요</p></div></div>'
    +   '</div>'
    +   '<div class="spanel" id="sMastPanel">'
    +     '<div class="shdr"><span id="sMastTitle">Master DB</span>'
    +       '<div class="flex-g" id="sMastBtns"></div></div>'
    +     '<div class="ssearch"><input id="sMSrch" placeholder="🔍 검색..." oninput="renderSMast()" disabled></div>'
    +     '<div id="sMastBody"><div class="sempty"><div class="ei">📋</div><p>단계를 선택하세요</p></div></div>'
    +   '</div>'
    +   '<div class="spanel" id="sSelPanel">'
    +     '<div class="shdr"><span>✏️ 선택 항목 (편집)</span><span id="sSelCnt" class="t2 sm">0개</span></div>'
    +     '<div id="sSelBody"><div class="sempty"><div class="ei">⚙️</div><p>항목을 체크하면 여기서 편집</p></div></div>'
    +   '</div>'
    + '</div>'
    + '<div class="savebar" id="savebar" style="display:none">'
    +   '<div class="flex-g" id="saveStats"></div>'
    +   '<div class="flex-g">'
    +     '<button class="btn bs bsm" onclick="selAll(false)">이 단계 해제</button>'
    +     '<button class="btn bw bsm" onclick="selReq()">필수만</button>'
    +     '<button class="btn bg bsm" onclick="saveStp()">💾 저장</button>'
    +   '</div>'
    + '</div>'
    + '</div>';
  adjustPageLayout('pg_setup');
}

function loadCo() {
  var coId = gid('coSel') ? gid('coSel').value : '';
  if (!coId) {
    gid('sProcList').innerHTML = '<div class="sempty"><p>기업을 선택하세요</p></div>';
    gid('siBadge').innerHTML = '';
    if (gid('savebar')) gid('savebar').style.display = 'none';
    return;
  }
  if (!state.setups[coId]) state.setups[coId] = { sel:[], custom:{}, done:[], doneAt:{}, tgt:{} };
  state.setupStep = 0;
  gid('savebar').style.display = 'flex';
  renderSProc(coId);
  renderSMast();
  renderSSel();
  updBadge(coId);
}

function updBadge(coId) {
  var s   = state.setups[coId] || {};
  var cnt = (s.sel||[]).length;
  gid('siBadge').innerHTML = cnt ? '<span class="info-badge">✅ ' + cnt + '개 선택됨</span>' : '';
  if (gid('siTot')) gid('siTot').textContent = cnt + '개';
  if (gid('sSelCnt')) gid('sSelCnt').textContent = cnt + '개';
}

function renderSProc(coId) {
  var sel = {};
  ((state.setups[coId]||{}).sel||[]).forEach(function(id){ sel[id] = true; });
  gid('sProcList').innerHTML = STEPS.map(function(s, i){
    var items = state.master.filter(function(r){ return r['프로세스'] === s.key; });
    var sc    = items.filter(function(r){ return sel[r.id]; }).length;
    var cls   = state.setupStep === i ? ' active' : '';
    return '<div class="pi' + cls + '" onclick="selSStep(\'' + coId + '\',' + i + ')">'
      + '<div><div class="pnm">' + s.e + ' ' + s.s + '</div>'
      + '<div class="psb">' + items.length + '개 항목</div></div>'
      + '<div class="pst"><div class="psc">' + sc + '</div>'
      + '<div class="pstot">/ ' + items.length + '</div></div>'
      + '</div>';
  }).join('');
}

function selSStep(coId, i) {
  state.setupStep = i;
  renderSProc(coId);
  renderSMast();
  renderSSel();
}

function renderSMast() {
  var coId = gid('coSel') ? gid('coSel').value : '';
  if (!coId) return;
  var sel  = {};
  ((state.setups[coId]||{}).sel||[]).forEach(function(id){ sel[id] = true; });
  var q    = gid('sMSrch') ? gid('sMSrch').value.toLowerCase() : '';
  var step = STEPS[state.setupStep];
  if (gid('sMastTitle')) gid('sMastTitle').textContent = step.e + ' ' + step.key;
  var all   = state.master.filter(function(r){ return r['프로세스'] === step.key; });
  var selC  = all.filter(function(r){ return sel[r.id]; }).length;
  var items = q ? all.filter(function(r){
    return (r['세부검토항목']||'').toLowerCase().indexOf(q)>=0 || (r['체크포인트']||'').toLowerCase().indexOf(q)>=0;
  }) : all;

  if (gid('sMSrch')) gid('sMSrch').disabled = false;
  if (gid('sMastBtns')) gid('sMastBtns').innerHTML =
    '<button class="btn bxs bs" onclick="selAll(true)">전체</button>'
    + '<button class="btn bxs bs" onclick="selAll(false)">해제</button>'
    + '<button class="btn bxs bw" onclick="selReq()">필수만</button>';

  // 그룹별
  var groups = {}, gOrder = [];
  items.forEach(function(r){
    var g = r['구분'] || '기타';
    if (!groups[g]) { groups[g] = []; gOrder.push(g); }
    groups[g].push(r);
  });

  if (!items.length) { gid('sMastBody').innerHTML = '<div class="sempty"><div class="ei">🔍</div><p>검색 결과 없음</p></div>'; return; }

  var html = '';
  gOrder.forEach(function(g){
    var gi  = groups[g];
    var gsc = gi.filter(function(r){ return sel[r.id]; }).length;
    var chk = gsc === gi.length ? ' checked' : '';
    html += '<div class="mgrp">'
      + '<span class="mgn">' + xe(g) + '</span>'
      + '<label class="mgc"><input type="checkbox"' + chk
      + ' onchange="grpChk(this,\'' + coId + '\',\'' + g.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\')"'
      + '> <span>' + gsc + '/' + gi.length + '</span></label></div>';
    gi.forEach(function(r){
      var isSel = !!sel[r.id];
      html += '<div class="mcard' + (isSel?' msel':'') + '" id="mc' + r.id + '">'
        + '<input type="checkbox" class="mchk"' + (isSel?' checked':'')
        + ' onchange="togItem(\'' + coId + '\',' + r.id + ',this.checked)">'
        + '<div class="mb">'
        + '<div class="mt">' + hlQ(r['세부검토항목'], q) + '</div>'
        + '<div class="mc2">' + hlQ(r['체크포인트'], q) + '</div>'
        + '<div class="mm">' + bdg(r['필수여부']) + (r['표준일정']?'<span class="chip">⏱ '+xe(r['표준일정'])+'</span>':'') + '</div>'
        + '</div></div>';
    });
  });
  gid('sMastBody').innerHTML = html;
  updStats(coId);
}

function renderSSel() {
  var coId = gid('coSel') ? gid('coSel').value : '';
  if (!coId) return;
  var s    = state.setups[coId] || {};
  var sel  = new Set(s.sel || []);
  var cust = s.custom || {};
  var tgt  = s.tgt || {};
  var key  = STEPS[state.setupStep].key;
  var items = state.master.filter(function(r){ return r['프로세스']===key && sel.has(r.id); });

  if (gid('sSelCnt')) gid('sSelCnt').textContent = (s.sel||[]).length + '개 (이 단계:' + items.length + ')';
  if (!items.length) {
    gid('sSelBody').innerHTML = '<div class="sempty"><div class="ei">📝</div><p>가운데에서 항목을 체크하세요</p></div>';
    return;
  }

  gid('sSelBody').innerHTML = items.map(function(r, idx){
    var c  = cust[r.id] || {};
    var d1 = c['총괄담당부서'] !== undefined ? c['총괄담당부서'] : r['총괄담당부서']||'';
    var d2 = c['합의부서']     !== undefined ? c['합의부서']     : r['합의부서']||'';
    var d3 = c['승인부서']     !== undefined ? c['승인부서']     : r['승인부서']||'';
    var cp = c['체크포인트']   !== undefined ? c['체크포인트']   : r['체크포인트']||'';
    var dc = c['필요문서']     !== undefined ? c['필요문서']     : r['필요문서']||'';
    var rq = c['필수여부']     !== undefined ? c['필수여부']     : r['필수여부']||'필수';
    var tg = tgt[r.id] || '';

    return '<div class="sitem">'
      + '<div class="sih" onclick="togSEl(' + r.id + ')">'
      + '<span class="sin">' + (idx+1) + '</span>'
      + '<span class="sit">' + xe(r['세부검토항목']) + '</span>'
      + '<div class="flex-g">' + bdg(rq) + '<span class="stog" id="stog' + r.id + '">▶</span></div>'
      + '</div>'
      + '<div class="sib" id="sib' + r.id + '" style="display:none">'
      + '<div class="sf"><div class="sfl">체크 포인트 <span class="edit-hint">(수정가능)</span></div>'
      + '<textarea class="sfta" onchange="updC(\'' + coId + '\',' + r.id + ',\'체크포인트\',this.value)">' + xe(cp) + '</textarea></div>'
      + '<div class="sfrow">'
      + '<div class="sf"><div class="sfl">필수여부</div>'
      + '<select class="sfin" onchange="updC(\'' + coId + '\',' + r.id + ',\'필수여부\',this.value)">'
      + ['필수','조건부 필수','선택','권장'].map(function(v){ return '<option' + (rq===v?' selected':'') + '>' + v + '</option>'; }).join('')
      + '</select></div>'
      + '<div class="sf"><div class="sfl">목표일정</div>'
      + '<input class="sfin" placeholder="2026-05-01" value="' + xe(tg) + '" onchange="updT(\'' + coId + '\',' + r.id + ',this.value)"></div>'
      + '</div>'
      + '<div class="sf"><div class="sfl">필요문서 <span class="edit-hint">(수정가능)</span></div>'
      + '<input class="sfin" value="' + xe(dc) + '" onchange="updC(\'' + coId + '\',' + r.id + ',\'필요문서\',this.value)"></div>'
      + '<div class="sf"><div class="sfl">📌 담당 부서 <span class="edit-hint" style="color:var(--or)">(기업 맞춤 수정)</span></div>'
      + '<div class="drow">'
      + '<div><div class="dl">총괄담당</div><input class="sfin" value="' + xe(d1) + '" onchange="updC(\'' + coId + '\',' + r.id + ',\'총괄담당부서\',this.value)"></div>'
      + '<div><div class="dl">합의부서</div><input class="sfin" value="' + xe(d2) + '" onchange="updC(\'' + coId + '\',' + r.id + ',\'합의부서\',this.value)"></div>'
      + '<div><div class="dl">승인부서</div><input class="sfin" value="' + xe(d3) + '" onchange="updC(\'' + coId + '\',' + r.id + ',\'승인부서\',this.value)"></div>'
      + '</div></div>'
      + '<div style="margin-top:8px;text-align:right">'
      + '<button class="rmv" onclick="rmvItem(\'' + coId + '\',' + r.id + ')">✕ 선택 해제</button>'
      + '</div></div></div>';
  }).join('');
}

function togSEl(id) {
  var b = gid('sib' + id), t = gid('stog' + id);
  if (!b) return;
  var open = b.style.display !== 'none';
  b.style.display = open ? 'none' : 'block';
  if (t) t.style.transform = open ? '' : 'rotate(90deg)';
}

function updC(coId, id, field, val) {
  var s = state.setups[coId];
  if (!s.custom) s.custom = {};
  if (!s.custom[id]) s.custom[id] = {};
  s.custom[id][field] = val;
}
function updT(coId, id, val) {
  var s = state.setups[coId];
  if (!s.tgt) s.tgt = {};
  s.tgt[id] = val;
}

function rmvItem(coId, id) {
  var s = state.setups[coId];
  s.sel = s.sel.filter(function(x){ return x !== id; });
  if (s.custom) delete s.custom[id];
  updBadge(coId); renderSProc(coId); renderSMast(); renderSSel(); updStats(coId);
}

function togItem(coId, id, checked) {
  var s = state.setups[coId];
  if (checked) { if (s.sel.indexOf(id) < 0) s.sel.push(id); }
  else { s.sel = s.sel.filter(function(x){ return x !== id; }); if(s.custom) delete s.custom[id]; }
  var card = gid('mc' + id);
  if (card) { checked ? card.classList.add('msel') : card.classList.remove('msel'); }
  updBadge(coId); renderSProc(coId); renderSSel(); updStats(coId);
}

function grpChk(input, coId, g) {
  var items = state.master.filter(function(r){ return r['프로세스']===STEPS[state.setupStep].key && (r['구분']||'기타')===g; });
  var s = state.setups[coId];
  items.forEach(function(r){
    if (input.checked) { if (s.sel.indexOf(r.id)<0) s.sel.push(r.id); }
    else { s.sel = s.sel.filter(function(x){return x!==r.id;}); if(s.custom) delete s.custom[r.id]; }
  });
  updBadge(coId); renderSProc(coId); renderSMast(); renderSSel(); updStats(coId);
}

function selAll(checked) {
  var coId = gid('coSel') ? gid('coSel').value : '';
  if (!coId) return;
  var items = state.master.filter(function(r){ return r['프로세스']===STEPS[state.setupStep].key; });
  var s = state.setups[coId];
  if (checked) { items.forEach(function(r){ if(s.sel.indexOf(r.id)<0) s.sel.push(r.id); }); }
  else {
    var ids = {}; items.forEach(function(r){ ids[r.id]=true; });
    s.sel = s.sel.filter(function(x){ return !ids[x]; });
    if (s.custom) items.forEach(function(r){ delete s.custom[r.id]; });
  }
  updBadge(coId); renderSProc(coId); renderSMast(); renderSSel(); updStats(coId);
}

function selReq() {
  var coId = gid('coSel') ? gid('coSel').value : '';
  if (!coId) return;
  var items = state.master.filter(function(r){ return r['프로세스']===STEPS[state.setupStep].key; });
  var s = state.setups[coId];
  var ids = {}; items.forEach(function(r){ ids[r.id]=true; });
  s.sel = s.sel.filter(function(x){ return !ids[x]; });
  items.filter(function(r){ return r['필수여부']==='필수'; }).forEach(function(r){ s.sel.push(r.id); });
  updBadge(coId); renderSProc(coId); renderSMast(); renderSSel(); updStats(coId);
}

function updStats(coId) {
  var s = state.setups[coId] || {};
  var tot = (s.sel||[]).length;
  var req = state.master.filter(function(r){ return (s.sel||[]).indexOf(r.id)>=0 && r['필수여부']==='필수'; }).length;
  var si  = state.master.filter(function(r){ return r['프로세스']===STEPS[state.setupStep].key; });
  var siS = si.filter(function(r){ return (s.sel||[]).indexOf(r.id)>=0; }).length;
  if (gid('saveStats')) gid('saveStats').innerHTML =
    '<span>이 단계: <b>' + siS + '/' + si.length + '</b></span>'
    + '<span>전체: <b>' + tot + '개</b></span>'
    + '<span>필수: <b>' + req + '개</b></span>';
}

function saveStp() {
  saveAll();
  toast('저장 완료','프로세스 Setup이 저장되었습니다.','success');
  var coId = gid('coSel') ? gid('coSel').value : '';
  if (coId) { renderSProc(coId); updBadge(coId); updStats(coId); }
}
