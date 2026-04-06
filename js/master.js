/* master.js - Master DB 관리 */

function pgMaster() {
  var canE = canEdit();
  var cats = [];
  state.master.forEach(function(r){ if(r['구분'] && cats.indexOf(r['구분'])<0) cats.push(r['구분']); });
  cats.sort();

  var stepBar = '<div class="psbar">';
  STEPS.forEach(function(s, i){
    var c = state.master.filter(function(r){return r['프로세스']===s.key;}).length;
    var cls = (state.masterStep===i) ? ' active' : '';
    stepBar += '<div class="ps' + cls + '" onclick="selMS(' + i + ')">'
      + '<span class="pse">' + s.e + '</span><span class="pss">' + s.s + '</span>'
      + '<span class="psn">' + c + '</span></div>';
  });
  stepBar += '</div>';

  var catOpts = cats.map(function(c){ return '<option value="' + xe(c) + '">' + xe(c) + '</option>'; }).join('');
  var html = '<div class="pg-hdr">'
    + '<div class="ph"><div><h1 class="pt">📋 Master DB</h1>'
    + '<p class="ps">전체 ' + state.master.length + '개 항목</p></div>'
    + '<div class="flex-g">'
    + (canE ? '<button class="btn bp" onclick="openAddItem()">+ 항목 추가</button>' : '')
    + '<button class="btn bs" onclick="exportMaster()">📥 CSV</button></div></div>'
    + stepBar
    + '<div class="flt">'
    + '<input class="si" id="mSrch" placeholder="🔍 검색..." oninput="renderMTbl()">'
    + '<select class="fsel" id="mCatF" onchange="renderMTbl()"><option value="">전체 구분</option>' + catOpts + '</select>'
    + '<select class="fsel" id="mReqF" onchange="renderMTbl()"><option value="">전체 필수여부</option>'
    + '<option>필수</option><option>조건부 필수</option><option>선택</option><option>권장</option></select>'
    + '<span id="mCnt" style="font-size:16px;color:var(--t2)"></span></div>'
    + '</div>'
    + '<div class="pg-body"><div id="mTbl" class="mTblWrap"></div></div>';
  gid('pg_master').innerHTML = html;
  renderMTbl();
  adjustPageLayout('pg_master');
}

function selMS(i) { state.masterStep = i; pgMaster(); }

function renderMTbl() {
  var q   = (gid('mSrch') ? gid('mSrch').value : '').toLowerCase();
  var cF  = gid('mCatF') ? gid('mCatF').value : '';
  var rF  = gid('mReqF') ? gid('mReqF').value : '';
  var canE = canEdit();
  var key = STEPS[state.masterStep].key;
  var items = state.master.filter(function(r){ return r['프로세스'] === key; });
  if (cF) items = items.filter(function(r){ return r['구분'] === cF; });
  if (rF) items = items.filter(function(r){ return r['필수여부'] === rF; });
  if (q)  items = items.filter(function(r){
    return (r['세부검토항목']||'').toLowerCase().indexOf(q) >= 0
        || (r['체크포인트']||'').toLowerCase().indexOf(q) >= 0
        || (r['총괄담당부서']||'').toLowerCase().indexOf(q) >= 0;
  });
  if (gid('mCnt')) gid('mCnt').textContent = items.length + '개 표시';
  if (!items.length) { gid('mTbl').innerHTML = '<div class="empty"><div class="ei">🔍</div><h3>검색 결과 없음</h3></div>'; return; }

  var tbl = '<div class="tw"><table class="tbl"><thead><tr>'
    + '<th style="width:36px">#</th><th style="width:120px">구분</th><th style="width:17%">세부 검토 항목</th><th style="width:27%">체크 포인트</th>'
    + '<th style="width:82px">필수여부</th><th style="width:15%">필요문서</th><th style="width:9%">총괄담당</th><th style="width:8%">합의</th><th style="width:8%">승인</th><th style="width:64px">일정</th>'
    + (canE ? '<th style="width:60px;text-align:center">편집</th>' : '') + '</tr></thead><tbody>';
  items.forEach(function(r){
    tbl += '<tr>'
      + '<td class="mono t3" style="white-space:nowrap;vertical-align:middle;text-align:center">' + r.id + '</td>'
      + '<td><span class="chip">' + xe(r['구분']||'') + '</span></td>'
      + '<td class="fw">' + hlQ(r['세부검토항목'], q) + '</td>'
      + '<td class="t2 sm">' + hlQ(r['체크포인트'], q) + '</td>'
      + '<td>' + bdg(r['필수여부']) + '</td>'
      + '<td class="t2 sm">' + xe(r['필요문서']||'') + '</td>'
      + '<td class="sm">' + xe(r['총괄담당부서']||'') + '</td>'
      + '<td class="t2 sm">' + xe(r['합의부서']||'') + '</td>'
      + '<td class="t2 sm">' + xe(r['승인부서']||'') + '</td>'
      + '<td class="mono t2 sm">' + xe(r['표준일정']||'') + '</td>'
      + (canE ? '<td style="text-align:center;vertical-align:middle;padding:0"><button class="editBtn" onclick="openEditItem(' + r.id + ')">✏️</button></td>' : '')
      + '</tr>';
  });
  tbl += '</tbody></table></div>';
  gid('mTbl').innerHTML = tbl;
}

/* ── ITEM MODAL ─────────────────────────────────────── */
function openEditItem(id) {
  if (!canEdit()) { toast('권한 없음','수정 권한이 없습니다.','error'); return; }
  var item = state.master.filter(function(r){ return r.id === id; })[0];
  if (!item) return;
  gid('mT').textContent = '항목 수정';
  gid('mId').value = id;
  gid('btnDel').style.display = 'inline-flex';
  fillItemModal(item);
  gid('itemModal').style.display = 'flex';
}
function openAddItem() {
  if (!canEdit()) return;
  gid('mT').textContent = '항목 추가';
  gid('mId').value = '';
  gid('btnDel').style.display = 'none';
  fillItemModal({ '프로세스': STEPS[state.masterStep].key,'구분':'','세부검토항목':'','체크포인트':'','필수여부':'필수','필요문서':'','총괄담당부서':'','합의부서':'','승인부서':'','표준일정':'' });
  gid('itemModal').style.display = 'flex';
}
function fillItemModal(r) {
  gid('mProc').innerHTML = STEPS.map(function(s){
    return '<option value="' + xe(s.key) + '"' + (r['프로세스']===s.key?' selected':'') + '>' + s.s + ' (' + xe(s.key.slice(0,18)) + '...)</option>';
  }).join('');
  gid('mCat').value  = r['구분']||'';        gid('mTtl').value  = r['세부검토항목']||'';
  gid('mChk').value  = r['체크포인트']||'';   gid('mReq').value  = r['필수여부']||'필수';
  gid('mSch').value  = r['표준일정']||'';     gid('mDoc').value  = r['필요문서']||'';
  gid('mD1').value   = r['총괄담당부서']||''; gid('mD2').value   = r['합의부서']||'';
  gid('mD3').value   = r['승인부서']||'';
}
function saveItem() {
  var id = gid('mId').value;
  var u = {
    '프로세스': gid('mProc').value, '구분': gid('mCat').value,
    '세부검토항목': gid('mTtl').value, '체크포인트': gid('mChk').value,
    '필수여부': gid('mReq').value,  '표준일정': gid('mSch').value,
    '필요문서': gid('mDoc').value,  '총괄담당부서': gid('mD1').value,
    '합의부서': gid('mD2').value,   '승인부서': gid('mD3').value
  };
  if (!u['세부검토항목']) { toast('오류','항목명은 필수입니다.','error'); return; }
  if (id) {
    var idx = -1;
    state.master.forEach(function(r,i){ if(r.id===parseInt(id)) idx=i; });
    if (idx >= 0) state.master[idx] = Object.assign({}, state.master[idx], u);
    toast('저장','항목이 수정되었습니다.','success');
  } else {
    var mx = 0; state.master.forEach(function(r){ if(r.id>mx) mx=r.id; });
    state.master.push(Object.assign({}, u, { id: mx+1 }));
    toast('추가','새 항목이 추가되었습니다.','success');
  }
  saveAll(); CM('itemModal'); renderMTbl();
}
function delItem() {
  if (!confirm('이 항목을 삭제하시겠습니까?')) return;
  var id = parseInt(gid('mId').value);
  state.master = state.master.filter(function(r){ return r.id !== id; });
  saveAll(); CM('itemModal'); renderMTbl();
  toast('삭제','항목이 삭제되었습니다.','info');
}
