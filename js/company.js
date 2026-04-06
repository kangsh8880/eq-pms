/* company.js - 기업 관리 */

var _coSelId = null;
var _coTab = 'company';

function _getGong(coId) {
  if (!coId) return [];
  if (!state.gongMaster[coId])
    state.gongMaster[coId] = GONG_MASTER.map(function(g){ return Object.assign({},g); });
  return state.gongMaster[coId];
}
function _getVend(coId) {
  if (!coId) return [];
  if (!state.vendorMaster[coId])
    state.vendorMaster[coId] = VENDOR_MASTER.map(function(v){ return Object.assign({},v); });
  return state.vendorMaster[coId];
}

/* ── COMPANY PAGE ── */
function pgCompany() {
  _coTab = _coTab || 'company';
  var canE = canEdit();

  // 기업 선택 드롭다운 (항상 표시)
  var coOpts = state.companies.map(function(c){
    return '<option value="' + xe(c.id) + '"' + (c.id===_coSelId?' selected':'') + '>' + xe(c.name) + '</option>';
  }).join('');
  var coPickHtml = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:0;padding:10px 14px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px 8px 0 0;border-bottom:none">'
    + '<span style="font-size:13px;color:var(--t2);white-space:nowrap;font-weight:600">📌 기업 선택</span>'
    + '<select style="padding:6px 10px;background:var(--bg3);border:1px solid var(--bd);border-radius:6px;color:var(--tx);font-size:14px;font-family:inherit;outline:none;max-width:280px" onchange="_coSelChange(this.value)">'
    + '<option value="">— 기업을 선택하세요 —</option>' + coOpts + '</select>'
    + (_coSelId ? '<span style="font-size:13px;color:var(--gr);margin-left:4px">✅ 선택됨</span>' : '<span style="font-size:13px;color:var(--t3)">공정/업체 관리 시 기업 선택 필요</span>')
    + '</div>';

  // 탭 버튼 (항상 3개 표시, 기업 미선택 시 비활성)
  var tabStyle = 'padding:8px 16px;border:none;background:transparent;cursor:pointer;font-family:inherit;font-size:14px;transition:all .15s;margin-bottom:-1px;';
  var tabs = [
    {key:'company', label:'🏢 기업 관리'},
    {key:'gong',    label:'⚙️ 공정 Master'},
    {key:'vendor',  label:'🏭 설비업체 Master'}
  ];
  var tabHtml = '<div style="display:flex;gap:4px;border-bottom:1px solid var(--bd);background:var(--bg2);border:1px solid var(--bd);border-top:none;padding:0 14px;border-radius:0 0 0 0">';
  tabs.forEach(function(t) {
    var active = _coTab === t.key;
    var disabled = (t.key !== 'company') && !_coSelId;
    tabHtml += '<button onclick="' + (disabled ? '' : "_coSwitchTab('" + t.key + "')") + '"'
      + ' style="' + tabStyle
      + 'font-weight:' + (active?'700':'500') + ';'
      + 'color:' + (active?'var(--ac)':disabled?'var(--bd)':'var(--t2)') + ';'
      + 'border-bottom:' + (active?'2px solid var(--ac)':'2px solid transparent') + ';'
      + 'cursor:' + (disabled?'not-allowed':'pointer') + '"'
      + (disabled?' title="기업을 먼저 선택하세요"':'') + '>'
      + t.label + '</button>';
  });
  tabHtml += '</div>';

  var bodyHtml = '';
  if      (_coTab === 'company') bodyHtml = _renderCoCompany(canE);
  else if (_coTab === 'gong')    bodyHtml = _renderCoGong(canE);
  else if (_coTab === 'vendor')  bodyHtml = _renderCoVendor(canE);

  gid('pg_company').innerHTML =
    '<div class="pg-hdr">'
    + '<div class="ph" style="margin-bottom:14px">'
    + '<div><h1 class="pt">🏢 기업 관리</h1><p class="ps">기업 · 공정 · 설비업체 통합 관리</p></div>'
    + '</div>'
    + coPickHtml + tabHtml
    + '</div>'
    + '<div class="pg-body" style="padding:14px 0 0">' + bodyHtml + '</div>';
}

function _coSelChange(coId) {
  _coSelId = coId || null;
  if (!_coSelId && (_coTab === 'gong' || _coTab === 'vendor')) _coTab = 'company';
  pgCompany();
}
function _coSwitchTab(key) { _coTab = key; pgCompany(); }

/* 기업 카드에서 공정/업체 탭으로 바로 진입 */
function goCoMaster(coId, tab) {
  _coSelId = coId;
  _coTab   = tab || 'gong';
  navTo('company');
}

/* ── 탭1: 기업 관리 ── */
function _renderCoCompany(canE) {
  var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:12px">'
    + (canE ? '<button class="btn bp" onclick="openAddCo()">＋ 기업 추가</button>' : '')
    + '</div><div class="cgrid">';
  state.companies.forEach(function(c) {
    var s = state.setups[c.id] || {};
    var sel = (s.sel||[]).length, done = (s.done||[]).length;
    var pct = sel ? Math.round(done/sel*100) : 0;
    var eqs = (state.equipments[c.id]||[]).length;
    html += '<div class="ccard">'
      + '<div class="flex-sb"><div style="flex:1;text-align:center"><div class="cnm">' + xe(c.name) + '</div>'
      + '<div class="cmt">' + xe(c.industry||'-') + ' · ' + (c.cd ? c.cd.replace(/\.\s*/g,'-').replace(/(\d{4})-(\d{1,2})-(\d{1,2})/,function(_,y,m,d){return y+'-'+('0'+m).slice(-2)+'-'+('0'+d).slice(-2)}) : '') + '</div></div>'
      + (canE ? '<button class="btn bxs bd" onclick="delCo(\'' + c.id + '\')">🗑️</button>' : '')
      + '</div>'
      + '<div class="cst">'
      + '<div style="text-align:center"><div class="csv" style="color:var(--pu)">' + eqs + '</div><div class="csl">설비수</div></div>'
      + '<div style="text-align:center"><div class="csv" style="color:var(--ac)">' + sel + '</div><div class="csl">총 항목수</div></div>'
      + '<div style="text-align:center"><div class="csv" style="color:var(--gr)">' + done + '</div><div class="csl">완료 항목수</div></div>'
      + '<div style="text-align:center"><div class="csv" style="color:var(--or)">' + pct + '%</div><div class="csl">진행률</div></div>'
      + '</div>'
      + '<div class="pb mt8"><div class="pf" style="width:' + pct + '%"></div></div>'
      + '<div style="margin-top:12px;display:grid;grid-template-columns:repeat(5,1fr);gap:5px">'
      + '<button class="btn bs bsm" style="justify-content:center;font-size:16px;width:100%" onclick="goSetup(\'' + c.id + '\')">⚙️ 프로세스 Setting</button>'
      + '<button class="btn bs bsm" style="justify-content:center;font-size:16px;width:100%" onclick="goProg(\'' + c.id + '\')">📈 현황</button>'
      + (canE ? '<button class="btn bs bsm" style="justify-content:center;font-size:16px;width:100%" onclick="goEquip(\'' + c.id + '\')">🏭 설비등록</button>' : '<span></span>')
      + '<button class="btn bs bsm" style="justify-content:center;font-size:16px;width:100%" onclick="goCoMaster(\'' + c.id + '\',\'gong\')">⚙️ 공정Master관리</button>'
      + '<button class="btn bs bsm" style="justify-content:center;font-size:16px;width:100%" onclick="goCoMaster(\'' + c.id + '\',\'vendor\')">🏭 업체Master관리</button>'
      + '</div>'
      + (c.note ? '<div class="cnote">' + xe(c.note) + '</div>' : '')
      + '</div>';
  });
  if (!state.companies.length) html += '<div class="empty" style="grid-column:1/-1"><div class="ei">🏢</div><h3>등록된 기업이 없습니다</h3></div>';
  html += '</div>';
  return html;
}


/* ── 탭2: 공정 Master CRUD (기업별) ── */
function _renderCoGong(canE) {
  if (!_coSelId) return '<div class="empty"><div class="ei">⚙️</div><h3>기업을 선택하세요</h3><p>위에서 기업을 선택하면 해당 기업의 공정 Master를 관리할 수 있습니다.</p></div>';
  var gongs = _getGong(_coSelId);
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    + '<span style="font-size:14px;color:var(--t2)">총 ' + gongs.length + '개 공정</span>'
    + (canE ? '<button class="btn bp bsm" onclick="_openGongModal(null)">＋ 공정 추가</button>' : '')
    + '</div>'
    + '<div class="tw dash-tbl-scroll" style="flex:1;min-height:0"><table class="tbl"><thead><tr>'
    + '<th style="width:60px">순서</th><th style="width:130px">공정코드</th><th>공정명</th>'
    + '<th style="width:130px">담당자명</th><th style="width:150px">연락처</th>'
    + (canE ? '<th style="width:80px">관리</th>' : '')
    + '</tr></thead><tbody>';
  gongs.forEach(function(g, i) {
    html += '<tr>'
      + '<td style="text-align:center;color:var(--t2);font-size:13px">' + g.seq + '</td>'
      + '<td style="font-family:monospace;font-size:13px;color:var(--ac)">' + xe(g.code) + '</td>'
      + '<td style="font-weight:500">' + xe(g.name) + '</td>'
      + '<td style="font-size:14px">' + xe(g.manager||'-') + '</td>'
      + '<td style="font-size:14px;color:var(--t2)">' + xe(g.contact||'-') + '</td>'
      + (canE ? '<td style="text-align:center"><button class="eq-btn-edit" onclick="_openGongModal(' + i + ')">✏️</button><button class="eq-btn-edit eq-btn-del" onclick="_delGong(' + i + ')">🗑️</button></td>' : '')
      + '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

function _openGongModal(idx) {
  var isEdit = idx !== null;
  var gongs = _getGong(_coSelId);
  var g = isEdit ? gongs[idx] : {};
  var roStyle = 'background:var(--bg4);color:var(--t3);cursor:not-allowed;border-color:var(--bd2)';
  var html = '<div class="mov" id="gongMdlOv" style="display:flex" onclick="if(event.target===this)_closeGongModal()">'
    + '<div class="mdl" style="width:480px"><div class="mhdr"><h3>' + (isEdit?'✏️ 공정 수정':'➕ 공정 추가') + '</h3>'
    + '<button class="mcls" onclick="_closeGongModal()">✕</button></div><div class="mbdy">'
    + '<div class="eq-modal-grid" style="margin-bottom:10px">'
    + '<div><div class="eq-flbl">공정코드' + (isEdit?' <span style="color:var(--t3);font-size:10px;text-transform:none">수정 불가</span>':'*') + '</div>'
    + '<input class="eq-finp" id="gM_code" value="' + xe(g.code||'') + '" placeholder="예: F10-0020"' + (isEdit?' readonly style="' + roStyle + '"':'') + '></div>'
    + '<div><div class="eq-flbl">순서' + (isEdit?' <span style="color:var(--t3);font-size:10px;text-transform:none">수정 불가</span>':'') + '</div>'
    + '<input class="eq-finp" id="gM_seq" type="number" value="' + xe(g.seq||'') + '" placeholder="숫자"' + (isEdit?' readonly style="' + roStyle + '"':'') + '></div>'
    + '</div>'
    + '<div style="margin-bottom:14px"><div class="eq-flbl">공정명' + (isEdit?' <span style="color:var(--t3);font-size:10px;text-transform:none">수정 불가</span>':'*') + '</div>'
    + '<input class="eq-finp" id="gM_name" value="' + xe(g.name||'') + '" placeholder="예: MS Auto Racking1"' + (isEdit?' readonly style="' + roStyle + '"':'') + '></div>'
    + (isEdit ? '<div style="background:rgba(88,166,255,.06);border:1px solid rgba(88,166,255,.15);border-radius:7px;padding:8px 12px;font-size:13px;color:var(--t2);margin-bottom:12px">✏️ 담당자 정보만 수정할 수 있습니다.</div>' : '')
    + '<div class="eq-modal-grid"><div><div class="eq-flbl">담당자명</div><input class="eq-finp" id="gM_mgr" value="' + xe(g.manager||'') + '" placeholder="담당자명"></div>'
    + '<div><div class="eq-flbl">연락처</div><input class="eq-finp" id="gM_tel" inputmode="numeric" pattern="[0-9\\-]*" value="' + xe(g.contact||'') + '" placeholder="연락처"></div></div>'
    + '</div><div class="mftr"><input type="hidden" id="gM_idx" value="' + (isEdit?idx:'null') + '">'
    + '<button class="btn bs" onclick="_closeGongModal()">취소</button>'
    + '<button class="btn bg" onclick="_saveGong()">💾 저장</button></div></div></div>';
  var w = document.createElement('div'); w.id = 'gongMdlWrap'; w.innerHTML = html;
  document.body.appendChild(w);
  isEdit ? gid('gM_mgr').focus() : gid('gM_code').focus();
}
function _closeGongModal() { var w=gid('gongMdlWrap'); if(w) w.remove(); }
function _saveGong() {
  var code = (gid('gM_code').value||'').trim(), name = (gid('gM_name').value||'').trim();
  if (!code || !name) { alert('공정코드와 공정명을 입력하세요.'); return; }
  var idx = gid('gM_idx').value, isEdit = idx !== 'null';
  var obj = { seq:parseInt(gid('gM_seq').value)||_getGong(_coSelId).length+1, code:code, name:name, manager:(gid('gM_mgr').value||'').trim(), contact:(gid('gM_tel').value||'').trim() };
  var gongs = _getGong(_coSelId);
  if (isEdit) { gongs[parseInt(idx)] = obj; } else { gongs.push(obj); gongs.sort(function(a,b){return a.seq-b.seq;}); }
  state.gongMaster[_coSelId] = gongs;
  saveAll(); _closeGongModal(); pgCompany();
  toast('저장', name + ' 공정이 저장됐습니다.', 'success');
}
function _delGong(idx) {
  var gongs = _getGong(_coSelId);
  var g = gongs[idx];
  if (!confirm('[' + g.code + '] ' + g.name + ' 공정을 삭제하시겠습니까?')) return;
  gongs.splice(idx, 1);
  state.gongMaster[_coSelId] = gongs;
  saveAll(); pgCompany();
  toast('삭제', '공정이 삭제됐습니다.', 'success');
}

/* ── 탭3: 설비업체 Master CRUD (기업별) ── */
function _renderCoVendor(canE) {
  if (!_coSelId) return '<div class="empty"><div class="ei">🏭</div><h3>기업을 선택하세요</h3><p>위에서 기업을 선택하면 해당 기업의 설비업체 Master를 관리할 수 있습니다.</p></div>';
  var vends = _getVend(_coSelId);
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    + '<span style="font-size:14px;color:var(--t2)">총 ' + vends.length + '개 업체</span>'
    + (canE ? '<button class="btn bp bsm" onclick="_openVendModal(null)">＋ 업체 추가</button>' : '')
    + '</div>'
    + '<div class="tw dash-tbl-scroll" style="flex:1;min-height:0"><table class="tbl"><thead><tr>'
    + '<th style="width:140px">업체코드</th><th style="width:160px">업체명</th>'
    + '<th style="width:140px">담당자명</th><th>연락처</th>'
    + (canE ? '<th style="width:80px">관리</th>' : '')
    + '</tr></thead><tbody>';
  vends.forEach(function(v, i) {
    html += '<tr>'
      + '<td style="font-family:monospace;font-size:13px;color:var(--ac)">' + xe(v.code) + '</td>'
      + '<td style="font-weight:600">' + xe(v.name) + '</td>'
      + '<td style="font-size:14px">' + xe(v.manager||'-') + '</td>'
      + '<td style="font-size:14px;color:var(--t2)">' + xe(v.contact||'-') + '</td>'
      + (canE ? '<td style="text-align:center"><button class="eq-btn-edit" onclick="_openVendModal(' + i + ')">✏️</button><button class="eq-btn-edit eq-btn-del" onclick="_delVend(' + i + ')">🗑️</button></td>' : '')
      + '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

function _openVendModal(idx) {
  var isEdit = idx !== null;
  var vends = _getVend(_coSelId);
  var v = isEdit ? vends[idx] : {};
  var roStyle = 'background:var(--bg4);color:var(--t3);cursor:not-allowed;border-color:var(--bd2)';
  var html = '<div class="mov" id="vendMdlOv" style="display:flex" onclick="if(event.target===this)_closeVendModal()">'
    + '<div class="mdl" style="width:480px"><div class="mhdr"><h3>' + (isEdit?'✏️ 업체 수정':'➕ 업체 추가') + '</h3>'
    + '<button class="mcls" onclick="_closeVendModal()">✕</button></div><div class="mbdy">'
    + '<div class="eq-modal-grid" style="margin-bottom:14px">'
    + '<div><div class="eq-flbl">업체코드' + (isEdit?' <span style="color:var(--t3);font-size:10px;text-transform:none">수정 불가</span>':'*') + '</div>'
    + '<input class="eq-finp" id="vM_code" value="' + xe(v.code||'') + '" placeholder="예: KR2165423"' + (isEdit?' readonly style="' + roStyle + '"':'') + '></div>'
    + '<div><div class="eq-flbl">업체명' + (isEdit?' <span style="color:var(--t3);font-size:10px;text-transform:none">수정 불가</span>':'*') + '</div>'
    + '<input class="eq-finp" id="vM_name" value="' + xe(v.name||'') + '" placeholder="업체명"' + (isEdit?' readonly style="' + roStyle + '"':'') + '></div>'
    + '</div>'
    + (isEdit ? '<div style="background:rgba(88,166,255,.06);border:1px solid rgba(88,166,255,.15);border-radius:7px;padding:8px 12px;font-size:13px;color:var(--t2);margin-bottom:12px">✏️ 담당자 정보만 수정할 수 있습니다.</div>' : '')
    + '<div class="eq-modal-grid"><div><div class="eq-flbl">담당자명</div><input class="eq-finp" id="vM_mgr" value="' + xe(v.manager||'') + '" placeholder="담당자명"></div>'
    + '<div><div class="eq-flbl">연락처</div><input class="eq-finp" id="vM_tel" inputmode="numeric" pattern="[0-9\\-]*" value="' + xe(v.contact||'') + '" placeholder="연락처"></div></div>'
    + '</div><div class="mftr"><input type="hidden" id="vM_idx" value="' + (isEdit?idx:'null') + '">'
    + '<button class="btn bs" onclick="_closeVendModal()">취소</button>'
    + '<button class="btn bg" onclick="_saveVend()">💾 저장</button></div></div></div>';
  var w = document.createElement('div'); w.id = 'vendMdlWrap'; w.innerHTML = html;
  document.body.appendChild(w);
  isEdit ? gid('vM_mgr').focus() : gid('vM_code').focus();
}
function _closeVendModal() { var w=gid('vendMdlWrap'); if(w) w.remove(); }
function _saveVend() {
  var code = (gid('vM_code').value||'').trim(), name = (gid('vM_name').value||'').trim();
  if (!code || !name) { alert('업체코드와 업체명을 입력하세요.'); return; }
  var idx = gid('vM_idx').value, isEdit = idx !== 'null';
  var obj = { code:code, name:name, manager:(gid('vM_mgr').value||'').trim(), contact:(gid('vM_tel').value||'').trim() };
  var vends = _getVend(_coSelId);
  if (isEdit) { vends[parseInt(idx)] = obj; } else { vends.push(obj); }
  state.vendorMaster[_coSelId] = vends;
  saveAll(); _closeVendModal(); pgCompany();
  toast('저장', name + ' 업체가 저장됐습니다.', 'success');
}
function _delVend(idx) {
  var vends = _getVend(_coSelId);
  var v = vends[idx];
  if (!confirm('[' + v.code + '] ' + v.name + ' 업체를 삭제하시겠습니까?')) return;
  vends.splice(idx, 1);
  state.vendorMaster[_coSelId] = vends;
  saveAll(); pgCompany();
  toast('삭제', '업체가 삭제됐습니다.', 'success');
}

function openAddCo() {
  if (!canEdit()) return;
  gid('coNm').value = ''; gid('coInd').value = ''; gid('coNote').value = '';
  gid('coModal').style.display = 'flex';
}
function addCo() {
  var nm = gid('coNm').value.trim();
  if (!nm) { toast('오류','기업명을 입력하세요.','error'); return; }
  var id = 'co' + Date.now();
  state.companies.push({ id:id, name:nm, industry:gid('coInd').value, note:gid('coNote').value, cd:new Date().toISOString().slice(0,10) });
  saveAll(); CM('coModal'); pgCompany();
  toast('등록 완료', nm + ' 기업이 등록되었습니다.', 'success');
}
function delCo(id) {
  var c = state.companies.filter(function(x){ return x.id===id; })[0];
  if (!confirm('"' + c.name + '" 기업을 삭제하시겠습니까?')) return;
  state.companies = state.companies.filter(function(x){ return x.id!==id; });
  delete state.setups[id];
  saveAll(); pgCompany();
  toast('삭제','기업이 삭제되었습니다.','info');
}
