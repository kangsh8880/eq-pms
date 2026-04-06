/* detail.js - 설비별 실적 현황 */

/* ═══════════════════════════════════════════════════════
   📊 설비별 실적 현황 페이지
   설비(호기) 단위 투자 프로세스 목표일/실적일 + 완료 체크
═══════════════════════════════════════════════════════ */
var _dtCoId   = null;
var _dtEqIdx  = null;
var _dtStepIdx = 0;

function pgDetail() {
  var coOpts = state.companies.map(function(c){
    return '<option value="' + xe(c.id) + '"' + (c.id===_dtCoId?' selected':'') + '>' + xe(c.name) + '</option>';
  }).join('');

  gid('pg_detail').innerHTML =
    // 상단 고정 헤더 (필터바 + 설비정보 + 스텝바)
    '<div id="dtStickyHeader" class="pg-hdr" style="z-index:10;background:var(--bg2);border-bottom:2px solid var(--bd);padding-bottom:0">'    + '<div style="background:var(--bg);border-bottom:1px solid var(--bd);padding:8px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    + '<h1 style="font-size:18px;font-weight:700;margin:0;white-space:nowrap">📊 설비별 실적 현황</h1>'
    + '<span style="font-size:14px;color:var(--t2)">기업</span>'
    + '<select id="dtCoSel" onchange="_dtLoadCo()" style="padding:5px 10px;background:var(--bg3);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-size:14px;font-family:inherit;outline:none">'
    + '<option value="">— 선택 —</option>' + coOpts
    + '</select>'
    + '<span style="font-size:14px;color:var(--t2)">설비</span>'
    + '<select id="dtEqSel" onchange="_dtLoadEq()" style="padding:5px 10px;background:var(--bg3);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-size:14px;font-family:inherit;outline:none"><option value="">— 선택 —</option></select>'
    + '<div id="dtEqInfoBar" style="display:none;margin-left:auto;align-items:center;gap:16px;flex-wrap:wrap">'
    // 설비명
    + '<span id="dtEqNameLbl" style="display:none"></span>'
    // ① 공정명
    + '<span style="font-size:14px;color:var(--t2)">공정</span>'
    + '<span id="dtGongLbl" style="font-size:16px;font-weight:600;color:var(--ac)"></span>'
    // ② PO No
    + '<span style="color:var(--bd);font-size:14px">|</span>'
    + '<span style="font-size:14px;color:var(--t2)">PO No</span>'
    + '<span id="dtPoLbl" style="font-size:16px;font-weight:600"></span>'
    // ③ EQ_ID
    + '<span style="color:var(--bd);font-size:14px">|</span>'
    + '<span style="font-size:14px;color:var(--t2)">EQ_ID</span>'
    + '<span id="dtEqIdLbl" style="font-size:16px;font-weight:600"></span>'
    // ④ 담당자
    + '<span style="color:var(--bd);font-size:14px">|</span>'
    + '<span style="font-size:14px;color:var(--t2)">담당자</span>'
    + '<span id="dtMgrLbl" style="font-size:16px;font-weight:600;color:var(--gr)"></span>'
    // 진행률
    + '<span style="color:var(--bd);font-size:14px">|</span>'
    + '<span id="dtPctLbl" style="font-size:16px;font-weight:700;color:var(--ac)"></span>'
    + '<span style="font-size:13px;color:var(--t2)">진행률</span>'
    + '</div>'
    + '</div>'
    // 스텝바
    + '<div id="dtStepBar" style="overflow-x:auto;background:var(--bg2)"></div>'
    + '</div>'
    // 본문 (스크롤 영역)
    + '<div id="dtBody" class="pg-body" style="padding:12px 14px">'
    + '<div class="empty"><div class="ei">📊</div><h3>기업과 설비를 선택하세요</h3></div>'
    + '</div>';

  if (_dtCoId) {
    setTimeout(function(){
      var coSel = document.getElementById('dtCoSel');
      if (coSel) { coSel.value = _dtCoId; _dtLoadCo(true); }
    }, 50);
  }
}


function _dtLoadCo(keepEq) {
  var coId = document.getElementById('dtCoSel') ? document.getElementById('dtCoSel').value : '';
  _dtCoId  = coId || null;
  var eqSel = document.getElementById('dtEqSel');
  if (!eqSel) return;
  eqSel.innerHTML = '<option value="">— 설비 선택 —</option>';
  if (!coId) { _dtClear(); return; }
  var eqs = state.equipments[coId] || [];
  eqs.forEach(function(eq, i) {
    var opt = document.createElement('option');
    opt.value = i;
    opt.textContent = (i+1) + '호기. ' + eq.name;
    eqSel.appendChild(opt);
  });
  if (keepEq && _dtEqIdx !== null) {
    eqSel.value = _dtEqIdx;
    _dtLoadEq();
  } else {
    // 기업 변경 시 본문 완전 초기화
    _dtEqIdx = null;
    _dtStepIdx = 0;
    var sb2 = document.getElementById('dtStepBar');
    if (sb2) sb2.innerHTML = '';
    var bd2 = document.getElementById('dtBody');
    if (bd2) bd2.innerHTML = '<div class="empty"><div class="ei">📊</div><h3>설비를 선택하세요</h3></div>';
    var infoBar2 = document.getElementById('dtEqInfoBar');
    if (infoBar2) infoBar2.style.display = 'none';
  }
}

function _dtLoadEq() {
  var coId = document.getElementById('dtCoSel') ? document.getElementById('dtCoSel').value : '';
  var eqSelEl = document.getElementById('dtEqSel');
  var eqIdx = eqSelEl ? parseInt(eqSelEl.value) : NaN;
  if (!coId || isNaN(eqIdx)) { _dtClear(); return; }
  _dtCoId  = coId;
  _dtEqIdx = eqIdx;
  _dtStepIdx = 0;
  _dtRenderStepBar();
  _dtRenderBody();
  _dtUpdateDateCard();
}

function _dtClear() {
  _dtEqIdx   = null;
  _dtStepIdx = 0;

  // 스텝바 초기화
  var sb = document.getElementById('dtStepBar');
  if (sb) sb.innerHTML = '';

  // 본문 초기화
  var bd = document.getElementById('dtBody');
  if (bd) bd.innerHTML = '<div class="empty"><div class="ei">📊</div><h3>기업과 설비를 선택하세요</h3></div>';

  // 설비정보바 숨기기
  var infoBar = document.getElementById('dtEqInfoBar');
  if (infoBar) {
    infoBar.style.display = 'none';
    var nameLbl = document.getElementById('dtEqNameLbl');
    var pctLbl  = document.getElementById('dtPctLbl');
    var gongLbl = document.getElementById('dtGongLbl');
    var poLbl   = document.getElementById('dtPoLbl');
    var eqIdLbl = document.getElementById('dtEqIdLbl');
    var mgrLbl  = document.getElementById('dtMgrLbl');
    if (nameLbl) nameLbl.textContent = '';
    if (pctLbl)  pctLbl.innerHTML   = '';
    if (gongLbl) gongLbl.textContent = '';
    if (poLbl)   poLbl.textContent   = '';
    if (eqIdLbl) eqIdLbl.textContent = '';
    if (mgrLbl)  mgrLbl.textContent  = '';
  }

  // 설비 드롭다운 초기화
  var eqSel = document.getElementById('dtEqSel');
  if (eqSel) eqSel.innerHTML = '<option value="">— 설비 선택 —</option>';
}

function _dtRenderStepBar() {
  var sb = document.getElementById('dtStepBar');
  if (!sb) return;
  var coId = _dtCoId;
  var eq   = (state.equipments[coId]||[])[_dtEqIdx];
  if (!eq) return;
  var today = new Date().toISOString().slice(0,10);

  // ① 각 프로세스 칸에 목표일 + 실적일 모두 표시
  var html = '<div style="display:flex;gap:0;background:var(--bg2);border:1px solid var(--bd);border-bottom:none">';
  INVEST_STEPS.forEach(function(stepNm, si) {
    var tgt = (eq.target||{})[si] || '';
    var act = (eq.actual||{})[si] || '';
    var isActive = _dtStepIdx === si;
    var isDelaySt = act && tgt && act > tgt;  // 실적일 > 목표일 = 지연
    var icon = act ? (isDelaySt ? '🔴' : '✅') : (tgt && today > tgt) ? '⚠️' : tgt ? '📅' : '⬜';
    var tgtColor = tgt ? ((!act && tgt < today) ? 'var(--re)' : isDelaySt ? 'var(--re)' : 'var(--ac)') : 'var(--t3)';
    var actColor = act ? (isDelaySt ? 'var(--re)' : 'var(--gr)') : 'var(--t3)';

    var sInfo = _dtCalcStepInfo(si);
    var sPct  = sInfo.pct;
    var sPctColor = sPct===100 ? 'var(--gr)' : sPct>0 ? 'var(--ac)' : 'var(--t3)';
    html += '<div onclick="_dtSelStep(' + si + ')"'
      + ' style="flex:1;min-width:60px;padding:8px 4px 6px;text-align:center;cursor:pointer;border-right:1px solid var(--bd);box-sizing:border-box;'
      + 'background:' + (isActive ? 'rgba(88,166,255,.13)' : 'transparent') + ';'
      + 'border-bottom:' + (isActive ? '3px solid var(--ac)' : isDelaySt ? '3px solid var(--re)' : '3px solid transparent') + ';'
      + 'transition:background .12s">'
      // 아이콘
      + '<div style="font-size:16px;margin-bottom:2px">' + icon + '</div>'
      // 단계명
      + '<div style="font-size:16px;font-weight:' + (isActive?'700':'500') + ';color:' + (isActive?'var(--ac)':isDelaySt?'var(--re)':'var(--t2)') + ';line-height:1.2;margin-bottom:3px;word-break:keep-all">' + xe(stepNm) + '</div>'
      // 목표일/실적일
      + '<div style="font-size:15px;font-family:monospace;color:' + tgtColor + ';margin-bottom:1px">' + (tgt || '—') + '</div>'
      + '<div style="font-size:15px;font-family:monospace;color:' + actColor + ';margin-bottom:4px">' + (act || '—') + '</div>'
      // 진행률 바 + 숫자
      + (sInfo.total > 0
        ? '<div style="margin:0 4px 1px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden"><div style="width:' + sPct + '%;height:100%;background:' + sPctColor + ';border-radius:2px"></div></div>'
          + '<div style="font-size:14px;color:' + sPctColor + '">' + sInfo.done + '/' + sInfo.total + '</div>'
        : '')
      + '</div>';
  });
  html += '</div>';
  sb.innerHTML = html;

  // 설비정보 바 갱신
  var infoBar = document.getElementById('dtEqInfoBar');
  var nameLbl = document.getElementById('dtEqNameLbl');
  var pctLbl  = document.getElementById('dtPctLbl');
  var gongLbl = document.getElementById('dtGongLbl');
  var poLbl   = document.getElementById('dtPoLbl');
  var eqIdLbl = document.getElementById('dtEqIdLbl');
  var mgrLbl  = document.getElementById('dtMgrLbl');

  if (infoBar) infoBar.style.display = 'flex';
  if (nameLbl) nameLbl.textContent = (_dtEqIdx+1) + '호기. ' + eq.name;

  // ① 공정명: gongCode로 gongMaster에서 조회
  var gongList = state.gongMaster[coId] || [];
  var gongObj  = gongList.find(function(g){ return g.code === eq.gongCode; }) || {};
  if (gongLbl) gongLbl.textContent = gongObj.name ? '[' + eq.gongCode + '] ' + gongObj.name : (eq.gongCode || '—');

  // ② PO No
  if (poLbl) poLbl.textContent = eq.poNo || '—';

  // ③ EQ_ID
  if (eqIdLbl) eqIdLbl.textContent = eq.eqId || '—';

  // ④ 담당자: gongMaster의 manager 필드
  if (mgrLbl) mgrLbl.textContent = gongObj.manager ? gongObj.manager + (gongObj.contact ? ' (' + gongObj.contact + ')' : '') : (eq.utiMgr || '—');

  // 진행률
  var _info1 = _dtCalcInfo(eq);
  if (pctLbl) pctLbl.innerHTML = '<span style="font-size:14px;color:var(--t2);font-weight:500">' + _info1.done + '/' + _info1.total + '&nbsp;</span><span>' + _info1.pct + '%</span>';
}

/* ③ 선택 단계 목표일/실적일 카드 갱신 (dtDateCard 제거됨 - noop) */
function _dtUpdateDateCard() {
  var card = document.getElementById('dtDateCard');
  var inner = document.getElementById('dtDateCardInner');
  if (!card || !inner) return; // 카드 없으면 종료
  var coId = _dtCoId;
  var eq   = (state.equipments[coId]||[])[_dtEqIdx];
  if (!eq) { card.style.display='none'; return; }
  var canE = canEdit();
  var si   = _dtStepIdx;
  var stepNm = INVEST_STEPS[si];
  var tgt  = (eq.target||{})[si] || '';
  var act  = (eq.actual||{})[si] || '';
  var today = new Date().toISOString().slice(0,10);
  var isDelay   = tgt && act && act > tgt;
  var isOverdue = tgt && !act && today > tgt;
  var statusColor = act ? 'var(--gr)' : isOverdue ? 'var(--re)' : tgt ? 'var(--ac)' : 'var(--t3)';
  var statusLabel = act ? '✅ 실적 완료' : isOverdue ? '⚠️ 지연' : tgt ? '📅 진행중' : '미등록';

  inner.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">'
    + '<span id="dtStepTitle" style="font-size:14px;font-weight:700;color:var(--ac)">' + (si+1) + '. ' + xe(stepNm) + '</span>'
    + '<span style="font-size:13px;padding:2px 9px;border-radius:7px;background:rgba(0,0,0,.2);color:' + statusColor + ';border:1px solid ' + statusColor + '">' + statusLabel + '</span>'
    + (isDelay ? '<span style="font-size:13px;color:var(--re)">지연 ' + _dtDayDiff(tgt,act) + '일</span>' : '')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    + '<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:10px 14px">'
    + '<div style="font-size:16px;font-weight:600;color:var(--ac);margin-bottom:6px">📅 목표일</div>'
    + (canE ? '<input type="date" id="dtTgtInp" value="' + xe(tgt) + '" onchange="_dtSaveDate(\'target\',this.value)" style="width:100%;padding:6px 8px;background:var(--bg2);border:1px solid var(--bd);border-radius:6px;color:var(--ac);font-family:monospace;font-size:15px;outline:none">'
           : '<div style="font-size:14px;font-family:monospace;color:var(--ac)">' + (tgt||'-') + '</div>')
    + '</div>'
    + '<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:10px 14px">'
    + '<div style="font-size:16px;font-weight:600;color:var(--gr);margin-bottom:6px">✅ 실적일</div>'
    + (canE ? '<input type="date" id="dtActInp" value="' + xe(act) + '" onchange="_dtSaveDate(\'actual\',this.value)" style="width:100%;padding:6px 8px;background:var(--bg2);border:1px solid var(--bd);border-radius:6px;color:var(--gr);font-family:monospace;font-size:15px;outline:none">'
           : '<div style="font-size:14px;font-family:monospace;color:var(--gr)">' + (act||'-') + '</div>')
    + '</div>'
    + '</div>';
  card.style.display = '';
}


function _dtSelStep(si) {
  _dtStepIdx = si;
  _dtRenderStepBar();
  // 왼쪽 테이블 행 강조만 변경
  var rows = document.querySelectorAll('#dtBody table tbody tr');
  rows.forEach(function(tr, i) {
    tr.style.background = (i === si) ? 'rgba(88,166,255,.1)' : 'transparent';
    var td2 = tr.querySelectorAll('td')[1];
    if (td2) { td2.style.fontWeight = (i===si)?'700':'400'; td2.style.color = (i===si)?'var(--ac)':'var(--tx)'; }
  });
  // 상단 목표일/실적일 카드 갱신
  var coId = _dtCoId;
  var eq   = (state.equipments[coId]||[])[_dtEqIdx];
  if (!eq) return;
  var stepNm = INVEST_STEPS[si];
  var tgt  = (eq.target||{})[si] || '';
  var act  = (eq.actual||{})[si] || '';
  var today = new Date().toISOString().slice(0,10);
  var isDelay   = tgt && act && act > tgt;
  var isOverdue = tgt && !act && today > tgt;
  var statusColor = act ? 'var(--gr)' : isOverdue ? 'var(--re)' : tgt ? 'var(--ac)' : 'var(--t3)';
  var statusLabel = act ? '✅ 실적 완료' : isOverdue ? '⚠️ 지연' : tgt ? '📅 진행중' : '미등록';
  var canE = canEdit();
  // 단계명/상태 업데이트
  var stepTitle = document.getElementById('dtStepTitle');
  if (stepTitle) {
    stepTitle.innerHTML = '<span id="dtStepTitle" style="font-size:14px;font-weight:700;color:var(--ac)">' + (si+1) + '. ' + xe(stepNm) + '</span>'
      + ' <span style="font-size:13px;padding:3px 10px;border-radius:8px;background:rgba(0,0,0,.2);color:' + statusColor + ';border:1px solid ' + statusColor + '">' + statusLabel + '</span>'
      + (isDelay ? ' <span style="font-size:13px;color:var(--re)">지연 ' + _dtDayDiff(tgt,act) + '일</span>' : '');
  }
  // 오른쪽 상세 패널 교체
  var panel = document.getElementById('dtDetailPanel');
  if (panel) panel.innerHTML = _dtDetailHtml(eq, si, canE);
  // (날짜카드 제거됨)
}

function _dtRenderBody() {
  var bd = document.getElementById('dtBody');
  if (!bd) return;
  var coId = _dtCoId;
  var eq   = (state.equipments[coId]||[])[_dtEqIdx];
  if (!eq) return;
  var canE = canEdit();
  var si   = _dtStepIdx;
  var today = new Date().toISOString().slice(0,10);

  // ── 좌우 flex 레이아웃 ──
  // 왼쪽(프로세스 요약): 고정폭 / 오른쪽(체크리스트): 남은 공간
  var html = '<div id="dtSplitWrap" style="display:flex;gap:0;width:100%;box-sizing:border-box;align-items:flex-start">'

  // ── 왼쪽: 프로세스 요약 테이블 ──
  + '<div id="dtLeftPanel" style="flex:0 0 auto;width:500px;min-width:280px;background:var(--bg2);border:1px solid var(--bd);border-radius:10px;overflow:hidden">'
  + '<div style="padding:10px 14px;border-bottom:1px solid var(--bd);font-size:15px;font-weight:700">📋 프로세스 요약</div>'
  + '<table style="width:100%;border-collapse:collapse">'
  + '<thead><tr style="background:var(--bg3)">'
  + '<th style="padding:7px 8px;text-align:left;color:var(--t2);font-size:15px;border-bottom:1px solid var(--bd)">#</th>'
  + '<th style="padding:7px 8px;text-align:left;color:var(--t2);font-size:15px;border-bottom:1px solid var(--bd)">프로세스</th>'
  + '<th style="padding:7px 8px;text-align:center;color:var(--ac);font-size:15px;border-bottom:1px solid var(--bd)">목표일</th>'
  + '<th style="padding:7px 8px;text-align:center;color:var(--t2);font-size:15px;border-bottom:1px solid var(--bd)">상태</th>'
  + (canE ? '<th style="padding:7px 8px;text-align:center;color:var(--gr);font-size:15px;border-bottom:1px solid var(--bd)">실적일</th>' : '')
  + '</tr></thead><tbody>';

  INVEST_STEPS.forEach(function(stepName, i) {
    var t = (eq.target||{})[i] || '';
    var a = (eq.actual||{})[i] || '';
    var isCur = i === si;
    var isDelay = t && a && a > t;
    var overdue = t && !a && today > t;
    var stIcon = a ? (isDelay ? '🔴' : '✅') : overdue ? '⚠️' : t ? '📅' : '⬜';
    var rowBg = isCur ? 'rgba(88,166,255,.1)' : 'transparent';
    html += '<tr style="cursor:pointer;background:' + rowBg + ';border-bottom:1px solid var(--bd2)" onclick="_dtSelStep(' + i + ')">'
      + '<td style="padding:8px 10px;color:var(--t3);font-size:16px;white-space:nowrap">' + (i+1) + '</td>'
      + '<td style="padding:8px 10px;font-size:17px;font-weight:' + (isCur?'700':'400') + ';color:' + (isCur?'var(--ac)':'var(--tx)') + ';white-space:nowrap">' + xe(stepName) + '</td>'
      + '<td style="padding:8px 10px;text-align:center;font-family:monospace;font-size:16px;color:' + (isDelay?'var(--re)':'var(--ac)') + ';white-space:nowrap">' + (t||'-') + '</td>'
      + '<td style="padding:8px 10px;text-align:center;font-size:14px;white-space:nowrap;color:' + (isDelay?'var(--re)':'') + '">' + stIcon + '</td>';
    if (canE) {
      html += '<td style="padding:4px 6px;text-align:center">'
        + '<input type="date" value="' + xe(a) + '" data-si="' + i + '" onchange="_dtSaveDateRow(this)"'
        + ' onclick="event.stopPropagation()"'
        + ' style="padding:4px 6px;background:var(--bg3);border:1px solid ' + (isDelay?'rgba(248,81,73,.5)':'var(--bd)') + ';border-radius:5px;color:' + (isDelay?'var(--re)':'var(--gr)') + ';font-size:14px;font-family:monospace;outline:none;width:150px">'
        + '</td>';
    }
    html += '</tr>';
  });
  html += '</tbody></table></div>'

  // ── 오른쪽: 상세 체크리스트 컨테이너만 먼저 생성 ──
  + '<div id="dtResizer" style="flex:0 0 8px;cursor:col-resize;background:transparent;border-left:2px solid var(--bd);border-right:2px solid var(--bd);margin:0 3px;align-self:stretch" onmouseenter="this.style.background=\'rgba(88,166,255,.3)\'" onmouseleave="this.style.background=\'transparent\'"></div>'
  + '<div id="dtDetailPanel" style="flex:1 1 0;min-width:200px;background:var(--bg2);border:1px solid var(--bd);border-radius:10px;overflow:hidden">'
  + '</div>'
  + '</div>';

  // innerHTML 먼저 삽입
  bd.innerHTML = html;

  // 상세 체크리스트는 별도로 삽입 (문자열 연결 문제 방지)
  var panel = document.getElementById('dtDetailPanel');
  if (panel) panel.innerHTML = _dtDetailHtml(eq, si, canE);

  // ── 드래그 리사이저 이벤트 ──
  requestAnimationFrame(function() {
    var resizer = document.getElementById('dtResizer');
    var leftPanel = document.getElementById('dtLeftPanel');
    var wrap = document.getElementById('dtSplitWrap');
    if (!resizer || !leftPanel || !wrap) return;
    var startX, startW;
    resizer.addEventListener('mousedown', function(e) {
      startX = e.clientX;
      startW = leftPanel.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      function onMove(e2) {
        var newW = Math.max(280, Math.min(startW + e2.clientX - startX, wrap.offsetWidth - 220));
        leftPanel.style.width = newW + 'px';
      }
      function onUp() {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
  });
}

/* ── 선택 단계: 기업 Setup 연계 상세 체크리스트 ── */
function _dtDetailHtml(eq, si, canE) {
  var coId = _dtCoId;
  var setup  = state.setups[coId] || {};
  var selIds = setup.sel || [];       // 기업이 선택한 MASTER_DB id 목록
  // 완료 여부: 설비별 eq.chkActual[si][id] 기준
  var chkSi  = (eq && eq.chkActual && eq.chkActual[si]) ? eq.chkActual[si] : {};
  var doneIds = Object.keys(chkSi).map(Number);
  var doneAt  = chkSi;  // {id: date}

  // INVEST_STEPS → MASTER_DB 프로세스명 매핑
  var stepKeywords = [
    '설비투자기획','설비 사양정의','투자심의','발주','제작',
    'FAT','출하(물류/통관)','설치','시운전/SAT','Qual(검증)','양산'
  ];
  var kw = stepKeywords[si] || '';

  // 기업이 선택한 항목 중 이 단계에 해당하는 것만
  var allItems = MASTER_DB.filter(function(r){
    return r['프로세스'] && r['프로세스'].indexOf(kw) === 0;
  });
  var items = allItems.filter(function(r){ return selIds.indexOf(r['id']) >= 0; });

  // 선택 항목 없으면 전체 표시 (fallback)
  if (!items.length && allItems.length) items = allItems;

  var doneCnt  = items.filter(function(r){ return chkSi[r['id']]; }).length;
  var totalCnt = items.length;
  var pct      = totalCnt ? Math.round(doneCnt/totalCnt*100) : 0;

  var html = '<div style="padding:12px 18px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;background:var(--bg2)">'
    + '<div>'
    + '<span style="font-size:15px;font-weight:700">📝 ' + xe(INVEST_STEPS[si]) + ' 상세 체크리스트</span>'
    + (selIds.length ? '' : '<span style="font-size:13px;color:var(--or);margin-left:8px">(Setup 미설정 — 전체 표시)</span>')
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:12px">'
    + '<span style="font-size:14px;color:var(--t2)" class="dt-cnt-lbl">' + doneCnt + '/' + totalCnt + '개 완료</span>'
    + '<div style="width:120px;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden">'
    + '<div class="pg-bar-fill" style="width:' + pct + '%;height:100%;background:var(--gr);border-radius:4px;transition:width .3s"></div>'
    + '</div>'
    + '<span class="dt-pct-lbl" style="font-size:15px;font-weight:700;color:' + (pct===100?'var(--gr)':'var(--ac)') + '">' + pct + '%</span>'
    + '</div>'
    + '</div>';

  if (!items.length) {
    return html + '<div style="padding:32px;text-align:center;color:var(--t2);font-size:15px">해당 단계에 선택된 상세 항목이 없습니다.<br><span style="font-size:13px">프로세스 Setup에서 항목을 추가하세요.</span></div>';
  }

  // 테이블 헤더
  html += '<div style="overflow-x:auto;overflow-y:auto;max-height:calc(100vh - 370px)">'
    + '<table style="width:100%;border-collapse:collapse;font-size:15px;table-layout:fixed">'
    + '<colgroup>'    + '<col style="width:40px">'   // 완료
    + '<col style="width:160px">'  // 세부검토항목
    + '<col>'                       // 체크포인트
    + '<col style="width:66px">'   // 필수여부
    + '<col style="width:110px">'  // 담당부서
    + '<col style="width:130px">'  // 필요문서
    + '<col style="width:70px">'   // 목표일정
    + '<col style="width:140px">'  // 완료일시
    + '</colgroup>'
    + '<thead><tr style="background:var(--bg3);position:sticky;top:0;z-index:1">'
    + '<th style="padding:6px 8px;text-align:center;color:var(--t2);font-size:16px;border-bottom:1px solid var(--bd)">완료</th>'
    + '<th style="padding:6px 8px;text-align:left;color:var(--t2);font-size:16px;border-bottom:1px solid var(--bd)">세부 검토 항목</th>'
    + '<th style="padding:6px 8px;text-align:left;color:var(--t2);font-size:16px;border-bottom:1px solid var(--bd)">체크 포인트</th>'
    + '<th style="padding:6px 8px;text-align:center;color:var(--t2);font-size:16px;border-bottom:1px solid var(--bd)">필수여부</th>'
    + '<th style="padding:6px 8px;text-align:left;color:var(--t2);font-size:16px;border-bottom:1px solid var(--bd)">담당부서</th>'
    + '<th style="padding:6px 8px;text-align:left;color:var(--t2);font-size:16px;border-bottom:1px solid var(--bd)">필요문서</th>'
    + '<th style="padding:6px 8px;text-align:center;color:var(--t2);font-size:16px;border-bottom:1px solid var(--bd)">목표일정</th>'
    + '<th style="padding:6px 8px;text-align:left;color:var(--t2);font-size:16px;border-bottom:1px solid var(--bd)">완료일시</th>'
    + '</tr></thead><tbody>';

  items.forEach(function(r) {
    var id   = r['id'];
    var done = !!chkSi[id];
    var at   = chkSi[id] || '';
    var isMust = r['필수여부'] === '필수';
    var rowBg = done ? 'rgba(63,185,80,.05)' : 'transparent';

    html += '<tr style="border-bottom:1px solid var(--bd2);background:' + rowBg + ';vertical-align:middle">'
      // 완료 체크박스
      + '<td style="padding:5px 8px;text-align:center;vertical-align:middle">'
      + (canE
        ? '<input type="checkbox" data-id="' + id + '" data-si="' + si + '" ' + (done?'checked':'') + ' onchange="_dtChkToggle(this)" style="width:18px;height:18px;cursor:pointer;accent-color:var(--gr)">'
        : '<span style="font-size:14px">' + (done?'✅':'⬜') + '</span>')
      + '</td>'
      // 세부검토항목
      + '<td style="padding:5px 8px;vertical-align:middle">'
      + '<div style="font-size:14px;font-weight:600;color:' + (done?'var(--gr)':'var(--tx)') + ';text-decoration:' + (done?'line-through':'none') + '">' + xe(r['세부검토항목']||'-') + '</div>'
      + '</td>'
      // 체크포인트
      + '<td style="padding:5px 8px;vertical-align:middle;font-size:16px;color:var(--t2)">' + xe(r['체크포인트']||'-') + '</td>'
      // 필수여부
      + '<td style="padding:5px 8px;text-align:center;vertical-align:middle">'
      + (isMust
        ? '<span style="font-size:13px;padding:2px 7px;border-radius:5px;background:rgba(248,81,73,.15);color:var(--re);border:1px solid rgba(248,81,73,.3)">필수</span>'
        : '<span style="font-size:13px;color:var(--t3)">' + xe(r['필수여부']||'선택') + '</span>')
      + '</td>'
      // 담당부서
      + '<td style="padding:5px 8px;vertical-align:middle;font-size:16px;font-weight:600">' + xe(r['총괄담당부서']||'-') + '</td>'
      // 필요문서
      + '<td style="padding:5px 8px;vertical-align:middle;font-size:14px;color:var(--t2)">' + xe(r['필요문서']||'-') + '</td>'
      // 목표일정
      + '<td style="padding:5px 8px;text-align:center;vertical-align:middle;font-size:14px;color:var(--t2)">' + xe(r['표준일정']||'-') + '</td>'
      // 완료일시
      + '<td style="padding:5px 8px;vertical-align:middle">'
      + (canE
        ? '<input type="date" value="' + xe(at) + '" data-id="' + id + '" data-si="' + si + '" onchange="_dtChkDateChange(this)" style="padding:3px 6px;background:var(--bg3);border:1px solid var(--bd);border-radius:5px;color:var(--gr);font-size:15px;font-family:monospace;outline:none;width:145px">'
        : '<span style="font-size:13px;color:var(--gr)">' + (at||'—') + '</span>')
      + '</td>'
      + '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}


/* ── 체크박스 토글: Setup done/doneAt 구조와 연계 ── */
function _dtChkToggle(inp) {
  var id      = parseInt(inp.dataset.id);
  var si      = parseInt(inp.dataset.si);
  var checked = inp.checked;
  var coId    = _dtCoId;
  var eq      = (state.equipments[coId]||[])[_dtEqIdx];
  if (!eq) return;
  if (!eq.chkActual)     eq.chkActual     = {};
  if (!eq.chkActual[si]) eq.chkActual[si] = {};

  var today = new Date().toISOString().slice(0,10);
  if (checked) {
    eq.chkActual[si][id] = today;
  } else {
    delete eq.chkActual[si][id];
  }
  saveAll();

  // 해당 행 UI 즉시 업데이트
  var tr = inp.closest('tr');
  if (tr) {
    tr.style.background = checked ? 'rgba(63,185,80,.05)' : 'transparent';
    var nameCell = tr.querySelectorAll('td')[1];
    if (nameCell) {
      var span = nameCell.querySelector('div');
      if (span) {
        span.style.color = checked ? 'var(--gr)' : 'var(--tx)';
        span.style.textDecoration = checked ? 'line-through' : 'none';
      }
    }
    // 완료일 셀 업데이트
    var atCell = tr.querySelectorAll('td')[7];
    if (atCell) {
      var atVal = checked ? today : '';
      atCell.innerHTML = checked
        ? '<input type="date" value="' + atVal + '" data-id="' + id + '" data-si="' + si + '" onchange="_dtChkDateChange(this)" style="padding:3px 6px;background:var(--bg3);border:1px solid var(--bd);border-radius:5px;color:var(--gr);font-size:15px;font-family:monospace;outline:none;width:145px">'
        : '<span style="font-size:13px;color:var(--t3)">—</span>';
    }
  }

  // 단계 진행률 갱신 (패널 헤더)
  var setup  = state.setups[coId] || {};
  var selIds = setup.sel || [];
  var stepKeywords = ['설비투자기획','설비 사양정의','투자심의','발주','제작','FAT','출하(물류/통관)','설치','시운전/SAT','Qual(검증)','양산'];
  var kw = stepKeywords[si] || '';
  var allItems = MASTER_DB.filter(function(r){ return r['프로세스'] && r['프로세스'].indexOf(kw)===0; });
  var items = selIds.length>0 ? allItems.filter(function(r){ return selIds.indexOf(r['id'])>=0; }) : allItems;
  var chkSi = eq.chkActual[si] || {};
  var doneCnt = items.filter(function(r){ return chkSi[r['id']]; }).length;
  var pct = items.length ? Math.round(doneCnt/items.length*100) : 0;

  var bar = document.querySelector('#dtDetailPanel .pg-bar-fill');
  if (bar) bar.style.width = pct + '%';
  var pctSpans = document.querySelectorAll('#dtDetailPanel .dt-pct-lbl');
  pctSpans.forEach(function(sp){ sp.textContent = pct + '%'; sp.style.color = pct===100?'var(--gr)':'var(--ac)'; });
  var cntSpan = document.querySelector('#dtDetailPanel .dt-cnt-lbl');
  if (cntSpan) cntSpan.textContent = doneCnt + '/' + items.length + '개 완료';

  // 상단 전체 진행률 갱신
  var pctLbl2 = document.getElementById('dtPctLbl');
  if (pctLbl2) { var _i3=_dtCalcInfo(eq); pctLbl2.innerHTML='<span style="font-size:14px;color:var(--t2);font-weight:500">'+_i3.done+'/'+_i3.total+'&nbsp;</span><span>'+_i3.pct+'%</span>'; }

  // 스텝바 갱신
  _dtRenderStepBar();
}

/* ── 체크 완료일 날짜 직접 변경 ── */
function _dtChkDateChange(inp) {
  var id  = parseInt(inp.dataset.id);
  var si  = parseInt(inp.dataset.si || '0');
  var val = inp.value;
  var coId = _dtCoId;
  var eq   = (state.equipments[coId]||[])[_dtEqIdx];
  if (!eq) return;
  if (!eq.chkActual)     eq.chkActual     = {};
  if (!eq.chkActual[si]) eq.chkActual[si] = {};
  if (val) { eq.chkActual[si][id] = val; }
  else     { delete eq.chkActual[si][id]; }
  saveAll();
}

/* ── 체크 날짜 입력 (구버전 호환) ── */
function _dtChkDate(inp) {
  var si  = parseInt(inp.dataset.si);
  var id  = parseInt(inp.dataset.id);
  var val = inp.value;
  var coId = _dtCoId;
  var eq   = (state.equipments[coId]||[])[_dtEqIdx];
  if (!eq) return;
  if (!eq.chkActual) eq.chkActual = {};
  if (!eq.chkActual[si]) eq.chkActual[si] = {};
  if (val) { eq.chkActual[si][id] = val; }
  else     { delete eq.chkActual[si][id]; }
  saveAll();
}


function _dtCalcPct(eq) {
  var done  = INVEST_STEPS.filter(function(s,i){ return !!(eq.actual||{})[i]; }).length;
  var total = INVEST_STEPS.length;
  return Math.round(done / total * 100);
}
function _dtCalcInfo(eq) {
  // 설비별 상세항목 진행률 (eq.chkActual 기준)
  var coId   = _dtCoId;
  var setup  = state.setups[coId] || {};
  var selIds = setup.sel || [];   // 기업이 선택한 MASTER_DB id 목록

  if (selIds.length === 0) {
    return { done: 0, total: 0, pct: 0 };
  }

  // 설비별 완료된 항목: eq.chkActual[si][id] 에 날짜가 있으면 완료
  var chkActual = eq.chkActual || {};
  var doneIds = [];
  Object.keys(chkActual).forEach(function(si) {
    Object.keys(chkActual[si]).forEach(function(id) {
      if (chkActual[si][id]) doneIds.push(parseInt(id));
    });
  });

  var total = selIds.length;
  var done  = selIds.filter(function(id){ return doneIds.indexOf(id) >= 0; }).length;
  return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
}

/* 특정 단계의 기업 선택항목 진행률 계산 */
function _dtCalcStepInfo(si) {
  // 설비별 단계 진행률 (eq.chkActual[si] 기준)
  var coId   = _dtCoId;
  var setup  = state.setups[coId] || {};
  var selIds = setup.sel || [];
  var eq     = (state.equipments[coId]||[])[_dtEqIdx];
  var stepKeywords = [
    '설비투자기획','설비 사양정의','투자심의','발주','제작',
    'FAT','출하(물류/통관)','설치','시운전/SAT','Qual(검증)','양산'
  ];
  var kw = stepKeywords[si] || '';
  var allItems = MASTER_DB.filter(function(r){ return r['프로세스'] && r['프로세스'].indexOf(kw) === 0; });
  var items = selIds.length > 0
    ? allItems.filter(function(r){ return selIds.indexOf(r['id']) >= 0; })
    : allItems;

  // 설비별 완료 항목
  var chkSi = (eq && eq.chkActual && eq.chkActual[si]) ? eq.chkActual[si] : {};
  var total = items.length;
  var done  = items.filter(function(r){ return chkSi[r['id']]; }).length;
  return { done: done, total: total, pct: total ? Math.round(done/total*100) : 0 };
}

function _dtDayDiff(d1, d2) {
  try { return Math.round((new Date(d2)-new Date(d1))/(1000*60*60*24)); } catch(e){ return 0; }
}

function _dtSaveDate(type, val) {
  var coId = _dtCoId;
  var eq   = (state.equipments[coId]||[])[_dtEqIdx];
  if (!eq) return;
  if (type === 'target') { if (!eq.target) eq.target={}; eq.target[_dtStepIdx] = val; }
  else                   { if (!eq.actual) eq.actual={}; eq.actual[_dtStepIdx] = val; }
  saveAll();
  _dtRenderStepBar();  // 스텝바 갱신 (날짜카드도 내부에서 갱신)
  // 요약 테이블 해당 행 직접 업데이트
  var rows = document.querySelectorAll('#dtBody table tbody tr');
  var si = _dtStepIdx;
  if (rows[si]) {
    var t = (eq.target||{})[si]||'', a = (eq.actual||{})[si]||'';
    var today2 = new Date().toISOString().slice(0,10);
    var delay2 = t&&a&&a>t, overdue2 = t&&!a&&today2>t;
    var stIcon2 = a?'✅':overdue2?'⚠️':t?'📅':'⬜';
    var cells = rows[si].querySelectorAll('td');
    if (cells[2]) cells[2].textContent = t||'-';
    if (cells[3]) cells[3].textContent = stIcon2;
    if (cells[4] && type==='actual') cells[4].querySelector('input') && (cells[4].querySelector('input').value = a);
  }
  // 상단 진행률 갱신
  var pctLbl = document.getElementById('dtPctLbl');
  if (pctLbl) { var _i2=_dtCalcInfo(eq); pctLbl.innerHTML='<span style="font-size:14px;color:var(--t2);font-weight:500">'+_i2.done+'/'+_i2.total+'&nbsp;</span><span>'+_i2.pct+'%</span>'; }
  toast('저장', INVEST_STEPS[_dtStepIdx] + ' ' + (type==='target'?'목표일':'실적일') + ' 저장됐습니다.', 'success');
}

function _dtSaveDateRow(inp) {
  var si  = parseInt(inp.dataset.si);
  var val = inp.value;
  var coId = _dtCoId;
  var eq   = (state.equipments[coId]||[])[_dtEqIdx];
  if (!eq) return;
  if (!eq.actual) eq.actual = {};
  eq.actual[si] = val;
  saveAll();

  // 스텝바 해당 칸 아이콘만 업데이트 (전체 재렌더 금지 → 레이아웃 안깨짐)
  var tgt2 = (eq.target||{})[si]||'';
  var today2 = new Date().toISOString().slice(0,10);
  var icon2 = val ? '✅' : (tgt2&&today2>tgt2) ? '⚠️' : tgt2 ? '📅' : '⬜';
  var stepCells = document.querySelectorAll('#dtStepBar > div > div');
  if (stepCells[si]) {
    var iconEl = stepCells[si].querySelector('div:first-child');
    if (iconEl) iconEl.textContent = icon2;
  }
  // 테이블 상태 아이콘만 업데이트
  var rows = document.querySelectorAll('#dtBody table tbody tr');
  if (rows[si]) {
    var cells = rows[si].querySelectorAll('td');
    var delay2 = tgt2&&val&&val>tgt2, overdue2 = tgt2&&!val&&today2>tgt2;
    if (cells[3]) cells[3].textContent = val?'✅':overdue2?'⚠️':tgt2?'📅':'⬜';
  }
}
