/* equip.js - 설비 투자 진척 */

/* ─────────────────────────────────────────────────────
   pgEquip: 메인 진입점
───────────────────────────────────────────────────── */
function pgEquip() {
  var canE = canEdit();
  gid('pg_equip').innerHTML =
    '<div class="pg-hdr">'
    + '<div class="ph" style="margin-bottom:10px">'
    + '<div><h1 class="pt">🏭 설비 투자 진척 현황</h1>'
    + '<p class="ps">공정별 · 설비(호기)별 투자 프로세스 목표일/실적일 관리</p></div>'
    + '<div class="flex-g" style="align-items:center;gap:8px">'
    + eqBuildFilterBar()
    + (canEdit() ? '<button class="btn bp bsm" id="eqAddBtn" onclick="_openEqFromPage()" style="display:none">＋ 설비 추가</button>' : '')
    + '</div></div>'
    + '<div id="eqStatRow" class="eq-stat-row"></div>'
    + '</div>'
    + '<div class="pg-body"><div id="eqBody" class="eq-tbl-wrap">'
    + '<div class="empty"><div class="ei">🏭</div><h3>기업을 선택하세요</h3></div>'
    + '</div></div>';
  adjustPageLayout('pg_equip');
  // 기업 선택 이벤트
  var sel = gid('eqCoSel2');
  if (sel) sel.addEventListener('change', loadEquipTbl);
}

function eqBuildFilterBar() {
  var coOpts = state.companies.map(function(c){
    return '<option value="' + xe(c.id) + '">' + xe(c.name) + '</option>';
  }).join('');
  var canE = canEdit();
  return '<div class="eq-filterbar">'
    + '<span class="eq-filter-label">기업</span>'
    + '<select id="eqCoSel2">'
    + '<option value="">— 기업 선택 —</option>' + coOpts
    + '</select>'
    + '<span class="eq-filter-label">설비업체</span>'
    + '<select id="eqVendSel" onchange="renderEquipTbl()"><option value="">전체 업체</option></select>'
    + '<span class="eq-filter-label">공정</span>'
    + '<select id="eqGongSel" onchange="renderEquipTbl()"><option value="">전체 공정</option></select>'
    + '</div>';
}

/* ─────────────────────────────────────────────────────
   데이터 로드 & 렌더링
───────────────────────────────────────────────────── */
function loadEquipTbl() {
  var coId = gid('eqCoSel2') ? gid('eqCoSel2').value : '';
  if (!coId) {
    gid('eqStatRow').innerHTML = '';
    gid('eqBody').innerHTML = '<div class="empty"><div class="ei">🏭</div><h3>기업을 선택하세요</h3></div>';
    return;
  }
  if (!state.equipments[coId]) state.equipments[coId] = [];
  // 기업별 필터 옵션 갱신
  var vendSel = gid('eqVendSel');
  if (vendSel) {
    var vends = _getVend(coId);
    vendSel.innerHTML = '<option value="">전체 업체</option>'
      + vends.map(function(v){ return '<option value="' + xe(v.code) + '">' + xe(v.name) + '</option>'; }).join('');
  }
  var gongSel = gid('eqGongSel');
  if (gongSel) {
    var gongs = _getGong(coId);
    gongSel.innerHTML = '<option value="">전체 공정</option>'
      + gongs.map(function(g){ return '<option value="' + xe(g.code) + '">[' + xe(g.code) + '] ' + xe(g.name) + '</option>'; }).join('');
  }
  // 설비 추가 버튼 표시
  var addBtn = gid('eqAddBtn');
  if (addBtn) addBtn.style.display = '';
  renderEquipStat2(coId);
  renderEquipTbl();
  adjustPageLayout('pg_equip');
}

function renderEquipStat2(coId) {
  var eqs = state.equipments[coId] || [];
  var tot = eqs.length;
  var done100 = eqs.filter(function(eq){ return calcEqPct2(eq) === 100; }).length;
  var avgPct = tot ? Math.round(eqs.reduce(function(a,eq){ return a + calcEqPct2(eq); }, 0) / tot) : 0;
  var totalAmt = eqs.reduce(function(a,eq){ return a + (parseFloat((eq.amt||'').replace(/,/g,''))||0); }, 0);
  gid('eqStatRow').innerHTML =
    '<div class="eq-stat-card"><span class="eq-stat-lbl">🏭 총 설비</span><span class="eq-stat-val" style="color:var(--ac)">' + tot + '대</span></div>'
    + '<div class="eq-stat-card"><span class="eq-stat-lbl">✅ 양산 완료</span><span class="eq-stat-val" style="color:var(--gr)">' + done100 + '대</span></div>'
    + '<div class="eq-stat-card"><span class="eq-stat-lbl">📊 평균 진행률</span><span class="eq-stat-val" style="color:var(--pu)">' + avgPct + '%</span></div>'
    + '<div class="eq-stat-card"><span class="eq-stat-lbl">💰 투자금액</span><span class="eq-stat-val" style="color:var(--or);font-size:15px">' + (totalAmt ? fmtAmt(totalAmt) : '-') + '</span></div>';
}

function fmtAmt(v) {
  if (v >= 1e8) return (v/1e8).toFixed(1) + '억원';
  if (v >= 1e4) return (v/1e4).toFixed(0) + '만원';
  return v.toLocaleString() + '원';
}

function calcEqPct2(eq) {
  var done = 0, tot = INVEST_STEPS.length;
  INVEST_STEPS.forEach(function(s, i) {
    if ((eq.actual||{})[i]) done++;
  });
  return Math.round(done / tot * 100);
}

function getStepStatus(eq, si) {
  var actual = (eq.actual||{})[si] || '';
  var target = (eq.target||{})[si] || '';
  if (actual) {
    if (target && actual > target) return 'delay';
    return 'done';
  }
  if (target) {
    var today = new Date().toISOString().slice(0,10);
    if (today > target) return 'delay';
    return 'wip';
  }
  return '';
}

/* ─────────────────────────────────────────────────────
   테이블 렌더링 (메인 진척 표)
───────────────────────────────────────────────────── */
function renderEquipTbl() {
  var coId = gid('eqCoSel2') ? gid('eqCoSel2').value : '';
  if (!coId) return;
  var vendF = gid('eqVendSel') ? gid('eqVendSel').value : '';
  var gongF = gid('eqGongSel') ? gid('eqGongSel').value : '';
  var eqs   = (state.equipments[coId] || []);
  var canE  = canEdit();

  // 필터 적용
  var filtered = eqs.filter(function(eq) {
    if (vendF && eq.vendCode !== vendF) return false;
    if (gongF && eq.gongCode !== gongF) return false;
    return true;
  });

  if (!filtered.length) {
    gid('eqBody').innerHTML = '<div class="empty"><div class="ei">📭</div><h3>등록된 설비가 없습니다</h3>'
      + (canE ? '<p>상단 "+ 설비 추가" 버튼을 눌러 설비를 등록하세요</p>' : '') + '</div>';
    return;
  }

  // 헤더 컬럼폭 정의
  var stepCW = 118; // 날짜셀 너비

  var html = '<table class="eq-tbl">';
  // 헤더 1행 (colspan 그룹)
  html += '<thead><tr>'
    + '<th class="th-fix" style="width:90px" rowspan="2">PO No<br>/ EQ_ID</th>'
    + '<th class="th-fix2" style="width:130px" rowspan="2">공정코드 · 공정명</th>'
    + '<th class="th-fix3" style="width:140px" rowspan="2">설비명<br><span style="font-weight:400;color:var(--t3)">모델 / 설비업체</span></th>'
    + '<th style="width:50px" rowspan="2">구분</th>'
    + '<th colspan="' + INVEST_STEPS.length + '" style="background:rgba(88,166,255,.08);color:var(--ac)">설비 투자 프로세스</th>'
    + '<th style="width:80px" rowspan="2">설비업체<br>담당자</th>'
    + '<th style="width:80px" rowspan="2">UTI<br>담당자</th>'
    + '<th style="width:50px" rowspan="2">진행률</th>';
  if (canE) html += '<th style="width:60px" rowspan="2">관리</th>';
  html += '</tr><tr>';
  INVEST_STEPS.forEach(function(s) {
    html += '<th style="width:' + stepCW + 'px;background:rgba(88,166,255,.05)">' + xe(s) + '</th>';
  });
  html += '</tr></thead><tbody>';

  // 공정별 그룹핑
  var gongMap = {};
  filtered.forEach(function(eq) {
    var k = eq.gongCode || '_none';
    if (!gongMap[k]) gongMap[k] = [];
    gongMap[k].push(eq);
  });

  Object.keys(gongMap).forEach(function(gCode) {
    var gong = GONG_MASTER.find(function(g){ return g.code === gCode; }) || {code: gCode, name: '미지정'};
    var rows = gongMap[gCode];

    rows.forEach(function(eq, ri) {
      var idx = eqs.indexOf(eq);
      var pct = calcEqPct2(eq);
      var pctColor = pct === 100 ? 'var(--gr)' : pct >= 50 ? 'var(--ac)' : 'var(--or)';
      var vend = VENDOR_MASTER.find(function(v){ return v.code === eq.vendCode; });
      var vendNm = vend ? vend.name : (eq.vendNm || '-');

      html += '<tr class="eq-row-eq">';

      // PO No / EQ_ID (sticky)
      html += '<td class="td-fix" style="font-size:11px;font-family:monospace">'
        + '<div style="color:var(--ac)">' + xe(eq.poNo || '-') + '</div>'
        + '<div style="color:var(--t3)">' + xe(eq.eqId || '-') + '</div>'
        + '</td>';

      // 공정 (sticky)
      html += '<td class="td-fix2">'
        + '<div style="font-size:11px;color:var(--t3)">' + xe(gong.code) + '</div>'
        + '<div style="font-size:12px;font-weight:500">' + xe(gong.name) + '</div>'
        + '</td>';

      // 설비명 / 모델 / 업체 (sticky)
      html += '<td class="td-fix3">'
        + '<div style="font-weight:600;font-size:12px">' + xe(eq.name) + '</div>'
        + '<div style="font-size:11px;color:var(--t2)">' + xe(eq.model || '') + '</div>'
        + '<div><span class="eq-chip">' + xe(vendNm) + '</span></div>'
        + '</td>';

      // 구분: 목표/실적 행
      html += '<td style="padding:0">'
        + '<div class="eq-date-row" style="padding:3px 6px;border-bottom:1px solid var(--bd2)">'
        + '<span class="eq-date-lbl" style="background:rgba(88,166,255,.15);color:var(--ac)">목표</span>'
        + '</div>'
        + '<div class="eq-date-row" style="padding:3px 6px">'
        + '<span class="eq-date-lbl" style="background:rgba(63,185,80,.15);color:var(--gr)">실적</span>'
        + '</div>'
        + '</td>';

      // 투자 단계 날짜
      INVEST_STEPS.forEach(function(s, si) {
        var tgt = (eq.target || {})[si] || '';
        var act = (eq.actual || {})[si] || '';
        var status = getStepStatus(eq, si);
        var bgClass = status === 'done' ? 'eq-step-done' : status === 'delay' ? 'eq-step-delay' : status === 'wip' ? 'eq-step-wip' : '';
        html += '<td class="' + bgClass + '" style="padding:0;min-width:' + stepCW + 'px">';
        if (canE) {
          html += '<div style="border-bottom:1px solid var(--bd2)">'
            + '<input type="date" class="eq-date-input eq-date-target" value="' + xe(tgt) + '"'
            + ' data-coid="' + xe(coId) + '" data-idx="' + idx + '" data-si="' + si + '" data-type="target"'
            + ' onchange="eqSaveDate(this)" title="목표일">'
            + '</div>'
            + '<div>'
            + '<input type="date" class="eq-date-input eq-date-actual" value="' + xe(act) + '"'
            + ' data-coid="' + xe(coId) + '" data-idx="' + idx + '" data-si="' + si + '" data-type="actual"'
            + ' onchange="eqSaveDate(this)" title="실적일">'
            + '</div>';
        } else {
          html += '<div style="border-bottom:1px solid var(--bd2);padding:3px 5px;font-size:11px;color:var(--ac);font-family:monospace">' + (tgt||'-') + '</div>'
            + '<div style="padding:3px 5px;font-size:11px;color:var(--gr);font-family:monospace">' + (act||'-') + '</div>';
        }
        html += '</td>';
      });

      // 설비업체 담당자
      html += '<td style="font-size:11px;padding:4px 6px">'
        + '<div>' + xe(eq.vendMgr || '') + '</div>'
        + '<div style="color:var(--t3)">' + xe(eq.vendTel || '') + '</div>'
        + '</td>';

      // UTI 담당자
      html += '<td style="font-size:11px;padding:4px 6px">'
        + '<div>' + xe(eq.utiMgr || '') + '</div>'
        + '<div style="color:var(--t3)">' + xe(eq.utiTel || '') + '</div>'
        + '</td>';

      // 진행률
      html += '<td class="eq-pct-cell">'
        + '<div class="eq-pct-val" style="color:' + pctColor + '">' + pct + '%</div>'
        + '<div class="eq-mini-bar"><div class="eq-mini-fill" style="width:' + pct + '%;background:' + pctColor + '"></div></div>'
        + '</td>';

      // 관리 버튼
      if (canE) {
        html += '<td>'
          + '<button class="eq-btn-edit" data-co="' + xe(coId) + '" data-idx="' + idx + '" onclick="openEqEditModal(this.dataset.co,parseInt(this.dataset.idx))" title="수정">✏️</button>'
          + '<button class="eq-btn-edit eq-btn-del" data-co="' + xe(coId) + '" data-idx="' + idx + '" onclick="eqDel(this.dataset.co,parseInt(this.dataset.idx))" title="삭제">🗑️</button>'
          + '</td>';
      }

      html += '</tr>';
    });
  });

  html += '</tbody></table>';
  gid('eqBody').innerHTML = html;
  renderEquipStat2(coId);
}

/* ─────────────────────────────────────────────────────
   날짜 저장
───────────────────────────────────────────────────── */
function eqSaveDate(inp) {
  var coId = inp.dataset.coid;
  var idx  = parseInt(inp.dataset.idx);
  var si   = parseInt(inp.dataset.si);
  var type = inp.dataset.type; // 'target' or 'actual'
  var val  = inp.value;

  var eq = state.equipments[coId][idx];
  if (!eq.target) eq.target = {};
  if (!eq.actual) eq.actual = {};
  if (type === 'target') eq.target[si] = val;
  else eq.actual[si] = val;

  saveAll();

  // 실적일 지연 색상 처리
  if (type === 'actual') {
    var tgtVal = (eq.target||{})[si]||'';
    var actVal = val;
    inp.classList.remove('eq-date-delay');
    if (actVal && tgtVal && actVal > tgtVal) {
      inp.classList.add('eq-date-delay');
    }
  }
  // 목표일 변경 시: 해당 단계 실적 input도 지연 재계산
  if (type === 'target') {
    var actInp = inp.closest('tr') ? inp.closest('tr').querySelector('input[data-si="' + si + '"][data-type="actual"]') : null;
    if (actInp) {
      var actVal2 = actInp.value;
      actInp.classList.remove('eq-date-delay');
      if (actVal2 && val && actVal2 > val) actInp.classList.add('eq-date-delay');
    }
  }

  // 셀 배경색 갱신 (부분)
  var status = getStepStatus(eq, si);
  var td = inp.closest('td');
  if (td) {
    td.classList.remove('eq-step-done','eq-step-delay','eq-step-wip');
    if (status) td.classList.add('eq-step-' + status);
  }

  // 진행률 칸 갱신
  renderEquipStat2(coId);
  var row = inp.closest('tr');
  if (row) {
    var pctCell = row.querySelector('.eq-pct-cell');
    if (pctCell) {
      var pct = calcEqPct2(eq);
      var pctColor = pct === 100 ? 'var(--gr)' : pct >= 50 ? 'var(--ac)' : 'var(--or)';
      pctCell.innerHTML = '<div class="eq-pct-val" style="color:' + pctColor + '">' + pct + '%</div>'
        + '<div class="eq-mini-bar"><div class="eq-mini-fill" style="width:' + pct + '%;background:' + pctColor + '"></div></div>';
    }
  }
}

/* ─────────────────────────────────────────────────────
   설비 추가/수정 모달
───────────────────────────────────────────────────── */

function _openEqFromPage() {
  var coId = gid('eqCoSel2') ? gid('eqCoSel2').value : '';
  if (!coId) { toast('오류','기업을 먼저 선택하세요.','error'); return; }
  _openEqModal(coId, null, null);
}
function openEqAddModal() {
  var coId = gid('eqCoSel2') ? gid('eqCoSel2').value : '';
  if (!coId) return;
  _openEqModal(coId, null, null);
}
function openEqEditModal(coId, idx) {
  var eq = (state.equipments[coId]||[])[idx];
  _openEqModal(coId, idx, eq||null);
}

/* ═══════════════════════════════════════════════════
   📅 커스텀 캘린더 피커
═══════════════════════════════════════════════════ */
var _calState = { targetId: null, year: 0, month: 0 };

function _showCal(inputId, stepIdx) {
  // 이미 열린 캘린더 닫기 (토글)
  var existing = gid('eqCal');
  var wasOpen  = _calState.targetId === inputId;
  if (existing) existing.remove();
  _calState.targetId = null;
  if (wasOpen) return; // 같은 버튼 재클릭 → 닫기

  // ② 순차 검증: 중간 빈 단계를 건너뛰고 가장 가까운 이전/이후 날짜 탐색
  _calState.stepIdx = (stepIdx !== undefined) ? stepIdx : -1;
  _calState.minDate = null;
  _calState.maxDate = null;

  if (_calState.stepIdx >= 0) {
    // 직전 방향으로 값이 있는 가장 가까운 단계 찾기
    for (var pi = _calState.stepIdx - 1; pi >= 0; pi--) {
      var prevInp = gid('eqM_tgt_' + pi);
      if (prevInp && prevInp.value) {
        _calState.minDate = prevInp.value;
        break;
      }
    }
    // 직후 방향으로 값이 있는 가장 가까운 단계 찾기
    for (var ni = _calState.stepIdx + 1; ni < INVEST_STEPS.length; ni++) {
      var nextInp = gid('eqM_tgt_' + ni);
      if (nextInp && nextInp.value) {
        _calState.maxDate = nextInp.value;
        break;
      }
    }
  }

  var inp = gid(inputId);
  if (!inp) return;
  _calState.targetId = inputId;

  var today = new Date();
  var cur   = inp.value ? new Date(inp.value + 'T00:00:00') : today;
  _calState.year  = cur.getFullYear();
  _calState.month = cur.getMonth();

  _renderCal();
}

function _renderCal(anchorInp) {
  var old = gid('eqCal');
  if (old) old.remove();

  var y = _calState.year, m = _calState.month;
  var inp = gid(_calState.targetId);
  var selVal = inp ? inp.value : '';

  var MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  var DAYS   = ['일','월','화','수','목','금','토'];

  var first  = new Date(y, m, 1).getDay();
  var lastD  = new Date(y, m+1, 0).getDate();
  var today  = new Date(); today.setHours(0,0,0,0);

  var grid = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:6px">';
  DAYS.forEach(function(d, i) {
    grid += '<div style="text-align:center;font-size:11px;font-weight:600;color:'+(i===0?'var(--re)':i===6?'var(--ac)':'var(--t2)')+'padding:3px 0">' + d + '</div>';
  });
  for (var bi = 0; bi < first; bi++) grid += '<div></div>';
  for (var d = 1; d <= lastD; d++) {
    var dt   = new Date(y, m, d);
    var dStr = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var dow  = dt.getDay();
    var isToday = dt.getTime() === today.getTime();
    var isSel   = dStr === selVal;
    // ② 순차 검증: min/max 날짜 범위 외 비활성
    var disabled = false;
    if (_calState.minDate && dStr < _calState.minDate) disabled = true;
    if (_calState.maxDate && dStr > _calState.maxDate) disabled = true;
    var bg   = isSel ? 'var(--ac)' : isToday ? 'rgba(88,166,255,.18)' : 'transparent';
    var col  = disabled ? 'var(--bd)' : isSel ? '#fff' : dow===0 ? 'var(--re)' : dow===6 ? 'var(--ac)' : 'var(--tx)';
    var fw   = isSel||isToday ? '700' : '400';
    if (disabled) {
      grid += '<div style="text-align:center;padding:5px 2px;border-radius:5px;font-size:13px;color:' + col + ';cursor:not-allowed;opacity:.4">' + d + '</div>';
    } else {
      grid += '<div onclick="_pickDate(\'' + dStr + '\')" style="text-align:center;padding:5px 2px;border-radius:5px;font-size:13px;cursor:pointer;background:' + bg + ';color:' + col + ';font-weight:' + fw + ';transition:background .12s" onmouseover="this.style.opacity=.75" onmouseout="this.style.opacity=1">' + d + '</div>';
    }
  }
  grid += '</div>';

  var cal = document.createElement('div');
  cal.id = 'eqCal';
  cal.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'
    + '<button onclick="_calMove(-1)" style="background:var(--bg3);border:1px solid var(--bd);border-radius:5px;color:var(--tx);cursor:pointer;width:26px;height:26px;font-size:15px;display:flex;align-items:center;justify-content:center">‹</button>'
    + '<span style="font-size:14px;font-weight:700">' + y + '년 ' + MONTHS[m] + '</span>'
    + '<button onclick="_calMove(1)"  style="background:var(--bg3);border:1px solid var(--bd);border-radius:5px;color:var(--tx);cursor:pointer;width:26px;height:26px;font-size:15px;display:flex;align-items:center;justify-content:center">›</button>'
    + '</div>'
    + '<div onclick="_calClear()" style="text-align:center;font-size:11px;color:var(--re);cursor:pointer;margin-bottom:4px;padding:2px">✕ 날짜 지우기</div>'
    + grid;

  cal.style.cssText = 'position:fixed;background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:12px 10px;width:240px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.6)';

  // 위치 계산 - 버튼 바로 아래에 표시 (fixed 기준)
  var btnEl = gid(_calState.targetId + '_btn') || gid(_calState.targetId);
  if (btnEl) {
    var rect = btnEl.getBoundingClientRect();
    var calW = 240, calH = 280;
    var left = rect.left;
    var top  = rect.bottom + 4;
    // 화면 오른쪽 넘침 방지
    if (left + calW > window.innerWidth - 8) left = window.innerWidth - calW - 8;
    // 화면 아래 넘침 방지 → 위로 표시
    if (top + calH > window.innerHeight - 8) top = rect.top - calH - 4;
    if (left < 4) left = 4;
    cal.style.left = left + 'px';
    cal.style.top  = top  + 'px';
  }
  document.body.appendChild(cal);
}

function _calMove(dir) {
  _calState.month += dir;
  if (_calState.month > 11) { _calState.month = 0;  _calState.year++; }
  if (_calState.month < 0)  { _calState.month = 11; _calState.year--; }
  _renderCal();
}

function _pickDate(dStr) {
  var inp = gid(_calState.targetId);
  if (inp) {
    inp.value = dStr;
    // 버튼 라벨 및 색상 업데이트
    var btn = gid(_calState.targetId + '_btn');
    var lbl = gid(_calState.targetId + '_lbl');
    if (btn) btn.style.color = 'var(--ac)';
    if (lbl) lbl.textContent = dStr;

    // 선택한 날짜가 이후 단계보다 크거나 같으면 이후 단계 날짜 초기화
    var si = _calState.stepIdx;
    if (si >= 0) {
      for (var ni = si + 1; ni < INVEST_STEPS.length; ni++) {
        var nInp = gid('eqM_tgt_' + ni);
        if (nInp && nInp.value && nInp.value < dStr) {
          nInp.value = '';
          var nBtn = gid('eqM_tgt_' + ni + '_btn');
          var nLbl = gid('eqM_tgt_' + ni + '_lbl');
          if (nBtn) nBtn.style.color = 'var(--t3)';
          if (nLbl) nLbl.textContent = '날짜 선택';
        } else { break; }
      }
      // 선택한 날짜가 이전 단계보다 작거나 같으면 이전 단계 날짜 초기화
      for (var pi = si - 1; pi >= 0; pi--) {
        var pInp = gid('eqM_tgt_' + pi);
        if (pInp && pInp.value && pInp.value > dStr) {
          pInp.value = '';
          var pBtn = gid('eqM_tgt_' + pi + '_btn');
          var pLbl = gid('eqM_tgt_' + pi + '_lbl');
          if (pBtn) pBtn.style.color = 'var(--t3)';
          if (pLbl) pLbl.textContent = '날짜 선택';
        } else { break; }
      }
    }
  }
  var cal = gid('eqCal');
  if (cal) cal.remove();
  _calState.targetId = null;
}

function _calClear() {
  var inp = gid(_calState.targetId);
  if (inp) {
    inp.value = '';
    var btn = gid(_calState.targetId + '_btn');
    var lbl = gid(_calState.targetId + '_lbl');
    if (btn) btn.style.color = 'var(--t3)';
    if (lbl) lbl.textContent = '날짜 선택';
  }
  var cal = gid('eqCal');
  if (cal) cal.remove();
  _calState.targetId = null;
}

/* ═══════════════════════════════════════════════════
   설비 추가/수정 모달
═══════════════════════════════════════════════════ */
function _openEqModal(coId, idx, eq) {
  var isEdit = idx !== null && idx !== undefined;

  // ① 기업명 (상단 대형 표시)
  var co = state.companies.find(function(c){ return c.id === coId; }) || {};
  var coNm = co.name || coId;

  // 공정/업체 옵션
  var coGongs = _getGong(coId);
  var coVends = _getVend(coId);
  var gOpts = coGongs.map(function(g){
    var sel = eq && eq.gongCode === g.code ? ' selected' : '';
    return '<option value="' + xe(g.code) + '"' + sel + '>[' + xe(g.code) + '] ' + xe(g.name) + '</option>';
  }).join('');
  var vOpts = '<option value="">— 업체 선택 —</option>' +
    coVends.map(function(v){
      var sel = eq && eq.vendCode === v.code ? ' selected' : '';
      return '<option value="' + xe(v.code) + '"' + sel + '>' + xe(v.name) + '</option>';
    }).join('');

  // 담당자 초기값 (기업별 Master에서)
  var initGong = eq ? (coGongs.find(function(g){return g.code===eq.gongCode;})||{}) : {};
  var initVend = eq ? (coVends.find(function(v){return v.code===eq.vendCode;})||{}) : {};
  var initVmgr = eq ? (eq.vendMgr||initVend.manager||'') : '';
  var initVtel = eq ? (eq.vendTel||initVend.contact||'') : '';
  var initUmgr = eq ? (eq.utiMgr||initGong.manager||'') : '';
  var initUtel = eq ? (eq.utiTel||initGong.contact||'') : '';

  // ② 프로세스 목표일 행 - 순차 검증 포함
  var stepRows = '';
  INVEST_STEPS.forEach(function(s, si) {
    var tval = eq && eq.target ? (eq.target[si]||'') : '';
    var inputId = 'eqM_tgt_' + si;
    stepRows += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      + '<div style="width:120px;font-size:13px;font-weight:500;color:var(--t2);flex-shrink:0">'
      + '<span style="display:inline-block;width:18px;text-align:right;margin-right:5px;font-size:12px;color:var(--t3)">' + (si+1) + '.</span>'
      + xe(s) + '</div>'
      + '<input type="hidden" id="' + inputId + '" value="' + xe(tval) + '">'
      + '<button type="button" id="' + inputId + '_btn"'
      + ' data-inpid="' + inputId + '" data-si="' + si + '" onclick="_showCal(this.dataset.inpid, parseInt(this.dataset.si))"'
      + ' style="flex:1;display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:var(--bg3);border:1px solid var(--bd);border-radius:7px;color:' + (tval?'var(--ac)':'var(--t3)') + ';font-size:13px;font-family:inherit;cursor:pointer;transition:border-color .15s">'
      + '<span id="' + inputId + '_lbl">' + xe(tval||'날짜 선택') + '</span>'
      + '<span style="font-size:15px;color:var(--t2);flex-shrink:0">📅</span>'
      + '</button>'
      + '</div>';
  });

  // ③ 모달 오버레이: 배경 클릭 무시 (e.stopPropagation 활용)
  var html = '<div id="eqMdlWrapOv" style="position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)">'
    + '<div id="eqMdlBox" style="background:var(--bg2);border:1px solid var(--bd);border-radius:13px;width:640px;max-width:96vw;max-height:92vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.5)" onclick="event.stopPropagation()">'
    // ① 기업명 헤더
    + '<div style="padding:14px 20px 10px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--bg2);z-index:1">'
    + '<div>'
    + '<div style="font-size:11px;color:var(--t3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px">' + (isEdit?'✏️ 설비 수정':'➕ 설비 추가') + '</div>'
    + '<div style="font-size:22px;font-weight:800;color:var(--ac)">' + xe(coNm) + '</div>'
    + '</div>'
    + '<button onclick="_closeEqModal()" style="width:30px;height:30px;border-radius:6px;border:1px solid var(--bd);background:transparent;color:var(--t2);cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center">✕</button>'
    + '</div>'
    + '<div style="padding:18px 20px">'

    // 기본 정보
    + '<div style="font-size:11px;font-weight:700;color:var(--t3);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--bd)">📋 기본 정보</div>'
    + '<div class="eq-modal-grid" style="margin-bottom:10px">'
    + '<div><div class="eq-flbl">공정 *</div><select class="eq-fsel" id="eqM_gong" onchange="_eqAutoFillGong()"><option value="">— 선택 —</option>' + gOpts + '</select></div>'
    + '<div><div class="eq-flbl">설비업체 *</div><select class="eq-fsel" id="eqM_vend" onchange="_eqAutoFillVend()">' + vOpts + '</select></div>'
    + '</div>'
    + '<div class="eq-modal-grid" style="margin-bottom:10px">'
    + '<div><div class="eq-flbl">PO No</div><input class="eq-finp" id="eqM_po" placeholder="예: AMM0100002" value="' + xe(eq?eq.poNo||'':'') + '"></div>'
    + '<div><div class="eq-flbl">EQ_ID (호기)</div><input class="eq-finp" id="eqM_eqid" placeholder="예: 1A1R001" value="' + xe(eq?eq.eqId||'':'') + '"></div>'
    + '</div>'
    + '<div class="eq-modal-grid" style="margin-bottom:10px">'
    + '<div><div class="eq-flbl">설비명 *</div><input class="eq-finp" id="eqM_nm" placeholder="예: MS Auto Racking #1" value="' + xe(eq?eq.name||'':'') + '"></div>'
    + '<div><div class="eq-flbl">모델명</div><input class="eq-finp" id="eqM_md" placeholder="예: ATK-AR-2024" value="' + xe(eq?eq.model||'':'') + '"></div>'
    + '</div>'
    + '<div style="margin-bottom:12px"><div class="eq-flbl">수량</div>'
    + '<div style="padding:7px 12px;background:var(--bg3);border:1px solid var(--bd);border-radius:7px;font-size:14px;color:var(--t2)">1대 (고정)</div>'
    + '<input type="hidden" id="eqM_qty" value="1"></div>'

    // 담당자
    + '<div style="font-size:11px;font-weight:700;color:var(--t3);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--bd);margin-top:4px">👤 담당자 <span style="font-size:11px;font-weight:400;color:var(--ac);text-transform:none;letter-spacing:0">공정/업체 선택 시 자동 입력</span></div>'
    + '<div class="eq-modal-grid" style="margin-bottom:10px">'
    + '<div><div class="eq-flbl">설비업체 담당자명 <span style="color:var(--ac);font-size:10px">← 업체 Master</span></div>'
    + '<input class="eq-finp" id="eqM_vmgr" placeholder="업체 선택 시 자동입력" value="' + xe(initVmgr) + '"></div>'
    + '<div><div class="eq-flbl">설비업체 연락처</div>'
    + '<input class="eq-finp" id="eqM_vtel" inputmode="numeric" pattern="[0-9\-]*" placeholder="업체 선택 시 자동입력" value="' + xe(initVtel) + '"></div>'
    + '</div>'
    + '<div class="eq-modal-grid" style="margin-bottom:12px">'
    + '<div><div class="eq-flbl">' + xe(coNm) + ' 담당자명 <span style="color:var(--gr);font-size:10px">← 공정 Master</span></div>'
    + '<input class="eq-finp" id="eqM_umgr" placeholder="공정 선택 시 자동입력" value="' + xe(initUmgr) + '"></div>'
    + '<div><div class="eq-flbl">' + xe(coNm) + ' 연락처</div>'
    + '<input class="eq-finp" id="eqM_utel" inputmode="numeric" pattern="[0-9\-]*" placeholder="공정 선택 시 자동입력" value="' + xe(initUtel) + '"></div>'
    + '</div>'

    // ② 투자 프로세스 목표일
    + '<div style="font-size:11px;font-weight:700;color:var(--t3);letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid var(--bd)">📅 투자 프로세스 목표일 <span style="font-size:11px;font-weight:400;color:var(--t3);text-transform:none;letter-spacing:0">순차 입력 필수</span></div>'
    + stepRows

    // 비고
    + '<div style="margin-top:10px"><div class="eq-flbl">비고</div>'
    + '<textarea class="eq-finp" id="eqM_note" style="resize:vertical;min-height:48px">' + xe(eq?eq.note||'':'') + '</textarea>'
    + '</div>'
    + '</div>'

    // 푸터
    + '<div style="padding:13px 20px;border-top:1px solid var(--bd);display:flex;justify-content:flex-end;gap:7px;position:sticky;bottom:0;background:var(--bg2)">'
    + '<input type="hidden" id="eqM_coId" value="' + xe(coId) + '">'
    + '<input type="hidden" id="eqM_idx" value="' + (isEdit?idx:'null') + '">'
    + '<button class="btn bs" onclick="_closeEqModal()">취소</button>'
    + '<button class="btn bg" onclick="_saveEqModal(document.getElementById(\'eqM_coId\').value, document.getElementById(\'eqM_idx\').value)">💾 저장</button>'
    + '</div>'
    + '</div></div>';

  // ③ 배경 클릭 무시 - 오버레이 자체 클릭 이벤트 제거
  var wrap = document.createElement('div');
  wrap.id = 'eqMdlWrap';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  // 오버레이 배경 클릭해도 닫히지 않음 (✗ 버튼으로만 닫기)
  gid('eqMdlWrapOv').addEventListener('click', function(e) {
    // 배경 클릭 시 캘린더만 닫기 (모달은 닫지 않음)
    var cal = gid('eqCal');
    if (cal && !cal.contains(e.target)) { cal.remove(); _calState.targetId = null; }
  });
  setTimeout(function(){ var n = gid('eqM_nm'); if(n) n.focus(); }, 50);
}


/* 공정 선택 시 기업 담당자 자동입력 */
function _eqAutoFillGong() {
  var coId = gid('eqM_coId') ? gid('eqM_coId').value : null;
  var code = gid('eqM_gong').value;
  var g = _getGong(coId).find(function(x){ return x.code === code; });
  var mgr = gid('eqM_umgr'), tel = gid('eqM_utel');
  if (g) {
    if (mgr) { mgr.value = g.manager || ''; mgr.style.color = g.manager ? 'var(--gr)' : ''; }
    if (tel) { tel.value = g.contact  || ''; tel.style.color = g.contact  ? 'var(--gr)' : ''; }
  } else {
    if (mgr && !code) { mgr.value = ''; mgr.style.color = ''; }
    if (tel && !code) { tel.value = ''; tel.style.color = ''; }
  }
}

/* 업체 선택 시 설비업체 담당자 자동입력 */
function _eqAutoFillVend() {
  var coId = gid('eqM_coId') ? gid('eqM_coId').value : null;
  var code = gid('eqM_vend').value;
  var v = _getVend(coId).find(function(x){ return x.code === code; });
  var mgr = gid('eqM_vmgr'), tel = gid('eqM_vtel');
  if (v) {
    if (mgr) { mgr.value = v.manager || ''; mgr.style.color = v.manager ? 'var(--gr)' : ''; }
    if (tel) { tel.value = v.contact  || ''; tel.style.color = v.contact  ? 'var(--gr)' : ''; }
  } else {
    if (mgr && !code) { mgr.value = ''; mgr.style.color = ''; }
    if (tel && !code) { tel.value = ''; tel.style.color = ''; }
  }
}

function _closeEqModal() {
  var w = gid('eqMdlWrap');
  if (w) w.remove();
}

function _saveEqModal(coId, idx) {
  var nm   = (gid('eqM_nm').value||'').trim();
  var gong = gid('eqM_gong').value;
  var vend = gid('eqM_vend').value;
  if (!nm) { alert('설비명을 입력하세요.'); return; }

  var isEdit = idx !== null && idx !== 'null' && idx !== '';
  var oldEq  = isEdit ? ((state.equipments[coId]||[])[parseInt(idx)] || {}) : {};

  var vObj = _getVend(coId).find(function(v){ return v.code === vend; }) || {};
  var gObj = _getGong(coId).find(function(g){ return g.code === gong; }) || {};

  // ── 목표일/실적일 처리 ──
  // 신규: 모달 입력값 사용 (비어있으면 빈 문자열), actual 완전 초기화
  // 수정: 기존 target 유지 + 모달 수정값 반영, actual 유지
  var newTarget = {};
  INVEST_STEPS.forEach(function(s, si) {
    var inp = gid('eqM_tgt_' + si);
    if (isEdit) {
      // 수정: 기존값 우선, 모달 입력값으로 덮어씀
      newTarget[si] = inp ? (inp.value || '') : ((oldEq.target||{})[si] || '');
    } else {
      // 신규: 모달 입력값만 (빈 값이면 빈 문자열)
      newTarget[si] = inp ? (inp.value || '') : '';
    }
  });

  var eq = {
    name:     nm,
    gongCode: gong,
    vendCode: vend,
    vendNm:   vObj.name || '',
    poNo:     (gid('eqM_po').value||'').trim(),
    eqId:     (gid('eqM_eqid').value||'').trim(),
    model:    (gid('eqM_md').value||'').trim(),
    qty:      '1',
    vendMgr:  (gid('eqM_vmgr').value||'').trim() || vObj.manager || '',
    vendTel:  (gid('eqM_vtel').value||'').trim() || vObj.contact || '',
    utiMgr:   (gid('eqM_umgr').value||'').trim() || gObj.manager || '',
    utiTel:   (gid('eqM_utel').value||'').trim() || gObj.contact || '',
    note:     (gid('eqM_note').value||'').trim(),
    target:   newTarget,
    // 신규: actual 완전 초기화 / 수정: 기존 actual 유지
    actual:   isEdit ? (oldEq.actual || {}) : {},
    // 신규: chkActual(상세 체크리스트 완료일) 초기화 / 수정: 유지
    chkActual: isEdit ? (oldEq.chkActual || {}) : {},
    regDate:  oldEq.regDate || new Date().toLocaleDateString('ko-KR')
  };

  if (!state.equipments[coId]) state.equipments[coId] = [];
  if (isEdit) {
    state.equipments[coId][parseInt(idx)] = eq;
  } else {
    state.equipments[coId].push(eq);
  }
  saveAll();
  _closeEqModal();
  // ① 신규 등록: 기업관리 / ② 수정: 설비투자진척 으로 분기
  if (isEdit) {
    navTo('equip');
    setTimeout(function(){
      var sel = document.getElementById('eqCoSel2');
      if (sel && sel.value !== coId) { sel.value = coId; loadEquipTbl(); }
    }, 80);
  } else {
    _coTab = 'company';
    navTo('company');
  }
  toast('저장 완료', nm + ' 설비가 저장됐습니다.', 'success');
}

function eqDel(coId, idx) {
  var eq = (state.equipments[coId]||[])[idx];
  if (!eq) return;
  if (!confirm('[' + eq.name + '] 설비를 삭제하시겠습니까?\n(모든 날짜 데이터가 삭제됩니다)')) return;
  state.equipments[coId].splice(idx, 1);
  saveAll();
  renderEquipTbl();
  toast('삭제 완료', eq.name + ' 삭제됐습니다.', 'success');
}
