/* progress.js - 프로세스 진행현황 */

function pgProgress() {
  var opts = state.companies.map(function(c){
    return '<option value="' + xe(c.id) + '">' + xe(c.name) + '</option>';
  }).join('');
  gid('pg_progress').innerHTML =
    '<div class="pg-hdr">'
    + '<div class="ph"><div><h1 class="pt">📈 프로세스 진행현황</h1>'
    + '<p class="ps">기업별 프로세스 체크리스트 진행 추적</p></div>'
    + '<select class="fsel" id="prCoSel" onchange="loadProg()">'
    + '<option value="">— 기업을 선택하세요 —</option>' + opts
    + '</select></div>'
    + '<div id="prStat"></div>'
    + '<div id="prStepBar"></div>'
    + '</div>'
    + '<div class="pg-body"><div id="prBody">'
    + '<div class="empty"><div class="ei">📈</div><h3>기업을 선택하세요</h3></div>'
    + '</div></div>';
  adjustPageLayout('pg_progress');
}


function loadProg() {
  var coId = gid('prCoSel') ? gid('prCoSel').value : '';
  if (!coId) {
    gid('prStat').innerHTML = '';
    gid('prStepBar').innerHTML = '';
    gid('prBody').innerHTML = '<div class="empty"><div class="ei">📈</div><h3>기업을 선택하세요</h3></div>';
    return;
  }
  var s = state.setups[coId];
  if (!s || !s.sel || !s.sel.length) {
    gid('prStat').innerHTML = '';
    gid('prStepBar').innerHTML = '';
    gid('prBody').innerHTML = '<div class="empty"><div class="ei">⚙️</div><h3>Setup을 먼저 완료하세요</h3></div>';
    return;
  }
  if (!state.progressStep) state.progressStep = 0;
  renderProgStat(coId);
  renderProgStepBar(coId);
  renderProgItems(coId);
  adjustPageLayout('pg_progress');
}

function renderProgStat(coId) {
  var s   = state.setups[coId];
  var sel = new Set(s.sel||[]);
  var done= new Set(s.done||[]);
  var tot = sel.size, comp = done.size;
  var pct = tot ? Math.round(comp/tot*100) : 0;
  gid('prStat').innerHTML =
    '<div class="pr-stat-row">'
    + mkProgStat('📋 전체 항목', tot, 'var(--ac)')
    + mkProgStat('✅ 완료', comp, 'var(--gr)')
    + mkProgStat('⏳ 미완료', tot-comp, 'var(--or)')
    + mkProgStat('📊 전체 진행률', pct+'%', 'var(--pu)')
    + '</div>';
}

function renderProgStepBar(coId) {
  var s    = state.setups[coId];
  var sel  = new Set(s.sel||[]);
  var done = new Set(s.done||[]);
  var html = '<div class="pr-stepbar" id="prStepBarInner">';
  STEPS.forEach(function(step, i){
    var items = state.master.filter(function(r){ return r['프로세스']===step.key && sel.has(r.id); });
    var isActive = (state.progressStep||0) === i;
    if (!items.length) {
      html += '<div class="pr-step pr-step-empty" data-coId="' + xe(coId) + '" data-i="' + i + '">'
        + '<span class="pr-se">' + step.e + '</span>'
        + '<span class="pr-ss">' + step.s + '</span>'
        + '<span class="pr-sc t3">-</span>'
        + '</div>';
      return;
    }
    var sc  = items.filter(function(r){ return done.has(r.id); }).length;
    var pct = Math.round(sc/items.length*100);
    html += '<div class="pr-step' + (isActive?' pr-active':'') + '" data-coId="' + xe(coId) + '" data-i="' + i + '">'
      + '<span class="pr-se">' + step.e + '</span>'
      + '<span class="pr-ss">' + step.s + '</span>'
      + '<span class="pr-sc">' + sc + '/' + items.length + '</span>'
      + '<div class="pr-pbar"><div class="pr-pfill" style="width:' + pct + '%"></div></div>'
      + '<span class="pr-pct' + (pct===100?' pr-done':'') + '">' + pct + '%</span>'
      + '</div>';
  });
  html += '</div>';
  gid('prStepBar').innerHTML = html;
  // 이벤트 위임: 클릭 처리
  gid('prStepBar').addEventListener('click', function(e){
    var el = e.target.closest('.pr-step');
    if (!el || el.classList.contains('pr-step-empty')) return;
    var ci = el.dataset.coid || el.dataset.coId;
    var idx = parseInt(el.dataset.i);
    selProgStep(ci, idx);
  });
}


function selProgStep(coId, i) {
  state.progressStep = i;
  renderProgStepBar(coId);
  renderProgItems(coId);
}

function renderProgItems(coId) {
  var s     = state.setups[coId];
  var sel   = new Set(s.sel||[]);
  var done  = new Set(s.done||[]);
  var canE  = canEdit();
  var step  = STEPS[state.progressStep||0];
  var items = state.master.filter(function(r){ return r['프로세스']===step.key && sel.has(r.id); });

  if (!items.length) {
    gid('prBody').innerHTML = '<div class="empty" style="margin-top:30px">'
      + '<div class="ei">📭</div><h3>이 단계에 Setup된 항목이 없습니다</h3>'
      + '<p>프로세스 Setup에서 항목을 선택하세요</p></div>';
    return;
  }

  var sc  = items.filter(function(r){ return done.has(r.id); }).length;
  var pct = Math.round(sc/items.length*100);

  var html = '<div class="pr-items-hdr">'
    + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
    + '<b style="font-size:14px">' + step.e + ' ' + step.s + '</b>'
    + '<span class="t2 sm">' + sc + '/' + items.length + '개 완료</span>'
    + (pct===100 ? '<span class="b br" style="margin-left:4px">✅ 완료</span>' : '')
    + '</div>'
    + '<div class="pb" style="height:7px;margin-bottom:0">'
    + '<div class="pf" style="width:' + pct + '%"></div></div>'
    + '</div>'
    + '<div class="pr-tbl-wrap">'
    + '<table class="pr-tbl"><thead><tr>'
    + '<th style="width:50px">완료</th>'
    + '<th style="width:22%">세부 검토 항목</th>'
    + '<th style="width:30%">체크 포인트</th>'
    + '<th style="width:80px">필수여부</th>'
    + '<th style="width:13%">담당부서</th>'
    + '<th style="width:11%">필요문서</th>'
    + '<th style="width:10%">목표일정</th>'
    + '<th style="width:12%">완료일시</th>'
    + '</tr></thead><tbody>';

  items.forEach(function(r){
    var isDone = done.has(r.id);
    var c  = (s.custom||{})[r.id] || {};
    var dp = c['총괄담당부서'] !== undefined ? c['총괄담당부서'] : r['총괄담당부서']||'';
    var dc = c['필요문서']     !== undefined ? c['필요문서']     : r['필요문서']||'';
    var tg = (s.tgt||{})[r.id] || '';
    var da = (s.doneAt||{})[r.id] || '';
    var rq = c['필수여부']     !== undefined ? c['필수여부']     : r['필수여부'];
    var cp = c['체크포인트']   !== undefined ? c['체크포인트']   : r['체크포인트']||'';
    html += '<tr class="pr-row' + (isDone?' pr-done-row':'') + '">'
      + '<td style="text-align:center;vertical-align:middle">'
      + (canE
        ? '<input type="checkbox"' + (isDone?' checked':'') + ' class="pr-chk"'
          + ' data-coid="' + xe(coId) + '" data-id="' + r.id + '">'
        : (isDone ? '✅' : '⬜'))
      + '</td>'
      + '<td class="fw">' + xe(r['세부검토항목']) + '</td>'
      + '<td class="t2 sm">' + xe(cp) + '</td>'
      + '<td>' + bdg(rq) + '</td>'
      + '<td class="sm">' + xe(dp) + '</td>'
      + '<td class="t2 sm">' + xe(dc) + '</td>'
      + '<td class="t2 sm">' + xe(tg) + '</td>'
      + '<td class="t3 sm">' + xe(da) + '</td>'
      + '</tr>';
  });
  html += '</tbody></table></div></div>';
  gid('prBody').innerHTML = html;

  // 체크박스 이벤트 위임
  gid('prBody').addEventListener('change', function(e){
    var inp = e.target;
    if (!inp || !inp.classList.contains('pr-chk')) return;
    var cid = inp.dataset.coid;
    var rid = parseInt(inp.dataset.id);
    togDone(cid, rid, inp.checked);
  });
}


function renderProg() { loadProg(); }

function togDone(coId, id, checked) {
  var s = state.setups[coId];
  if (!s.done)   s.done   = [];
  if (!s.doneAt) s.doneAt = {};
  if (checked) { if (s.done.indexOf(id)<0) s.done.push(id); s.doneAt[id] = new Date().toLocaleString('ko-KR'); }
  else { s.done = s.done.filter(function(x){return x!==id;}); delete s.doneAt[id]; }
  saveAll();
  renderProgStat(coId);
  renderProgStepBar(coId);
  renderProgItems(coId);
}
