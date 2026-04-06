/* dashboard.js - 대시보드 */

/* ── DASHBOARD ──────────────────────────────────────── */
function pgDash() {
  var today = new Date().toISOString().slice(0,10);
  var STEPS = INVEST_STEPS;
  // 기업 필터
  var dashSel = document.getElementById('dashCoFilter');
  var dashCoId = dashSel ? dashSel.value : '';
  var filteredCos = dashCoId
    ? state.companies.filter(function(c){ return c.id === dashCoId; })
    : state.companies;

  // ── 기업별 설비 투자 진척 집계 ──
  function calcEqInfo(coId, eq) {
    var t = eq.target || {}, a = eq.actual || {};
    var stepDone   = STEPS.filter(function(_,i){ return !!a[i]; }).length;
    var stepTotal  = STEPS.length;
    // 11단계 중 지연 (실적>목표 or 목표지났는데 실적없음)
    var delayed = STEPS.filter(function(_,i){
      var tgt=t[i]||'', act=a[i]||'';
      return (act && tgt && act>tgt) || (tgt && !act && today>tgt);
    }).length;
    return { stepDone:stepDone, stepTotal:stepTotal, delayed:delayed, pct:Math.round(stepDone/stepTotal*100) };
  }

  // ── 전체 KPI ──
  var totalCo  = filteredCos.length;
  var totalEq  = 0, doneEq=0, delayEq=0;
  filteredCos.forEach(function(c){
    var eqs = state.equipments[c.id]||[];
    totalEq += eqs.length;
    eqs.forEach(function(eq){
      var inf = calcEqInfo(c.id, eq);
      if(inf.pct===100) doneEq++;
      if(inf.delayed>0) delayEq++;
    });
  });

  var html = ''
  // ── 기업별 진척 현황 ──
  + '<div class="dash-section">'  + '<div class="dash-section-title">🏢 기업별 설비 투자 진척 현황</div>'  + '<div class="dash-tbl-scroll">'  + '<table style="width:100%;border-collapse:collapse;font-size:14px">'  + '<thead><tr style="background:var(--bg3)">'  + '<th style="padding:9px 12px;text-align:left;border-bottom:1px solid var(--bd);white-space:nowrap">기업명</th>'  + '<th style="padding:9px 12px;text-align:center;border-bottom:1px solid var(--bd)">설비수</th>';
  STEPS.forEach(function(s){ html += '<th style="padding:9px 8px;text-align:center;border-bottom:1px solid var(--bd);white-space:nowrap;font-size:13px">'+xe(s)+'</th>'; });
  html += '<th style="padding:9px 12px;text-align:center;border-bottom:1px solid var(--bd)">완료율</th>'  + '</tr></thead><tbody>';

  filteredCos.forEach(function(co){
    var eqs = state.equipments[co.id]||[];
    if(!eqs.length){ return; }
    // 단계별 완료 설비 수
    var stepCnts = STEPS.map(function(_,si){
      return eqs.filter(function(eq){ return !!(eq.actual||{})[si]; }).length;
    });
    var totalPct = eqs.length ? Math.round(eqs.reduce(function(sum,eq){ return sum+calcEqInfo(co.id,eq).pct; },0)/eqs.length) : 0;
    var hasDelay = eqs.some(function(eq){ return calcEqInfo(co.id,eq).delayed>0; });

    html += '<tr style="border-bottom:1px solid var(--bd2);background:'+(hasDelay?'rgba(248,81,73,.04)':'transparent')+'">'      + '<td style="padding:9px 12px;font-weight:700;color:var(--tx)">' + xe(co.name) + '</td>'      + '<td style="padding:9px 12px;text-align:center;color:var(--t2)">' + eqs.length + '</td>';
    stepCnts.forEach(function(cnt){
      var pct = eqs.length ? Math.round(cnt/eqs.length*100) : 0;
      var col = pct===100?'var(--gr)':pct>0?'var(--ac)':'var(--t3)';
      html += '<td style="padding:6px 8px;text-align:center">'        + '<div style="font-size:14px;font-weight:700;color:'+col+'">'+cnt+'/'+eqs.length+'</div>'        + '<div style="height:4px;background:var(--bg3);border-radius:2px;margin-top:2px;overflow:hidden">'        + '<div style="width:'+pct+'%;height:100%;background:'+col+';border-radius:2px"></div>'        + '</div>'        + '</td>';
    });
    var pCol = totalPct===100?'var(--gr)':totalPct>=50?'var(--ac)':'var(--or)';
    html += '<td style="padding:9px 12px;text-align:center;font-size:16px;font-weight:700;color:'+pCol+'">'+totalPct+'%</td>'      + '</tr>';
  });
  html += '</tbody></table></div></div>'
  // ── 공정별 + 설비업체별 ──
  + '<div class="dash-grid-row">'
  // 공정별
  + '<div class="dash-section">'  + '<div class="dash-section-title">⚙️ 공정별 설비 진척 현황</div>'  + '<div class="dash-tbl-scroll">'  + '<table style="width:100%;border-collapse:collapse;font-size:14px">'  + '<thead><tr style="background:var(--bg3)">'  + '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid var(--bd)">공정명</th>'  + '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid var(--bd)">설비</th>'  + '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid var(--bd)">완료</th>'  + '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid var(--bd)">지연</th>'  + '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid var(--bd)">진척률</th>'  + '</tr></thead><tbody>';

  // 공정별 집계
  var gongMap = {};
  filteredCos.forEach(function(co){
    var gongs = state.gongMaster[co.id]||[];
    var eqs   = state.equipments[co.id]||[];
    eqs.forEach(function(eq){
      var key = eq.gongCode||'미지정';
      var gObj = gongs.find(function(g){ return g.code===eq.gongCode; })||{};
      var nm   = gObj.name ? '['+key+'] '+gObj.name : key;
      if(!gongMap[key]) gongMap[key] = { name:nm, eqs:[], done:0, delayed:0 };
      gongMap[key].eqs.push(eq);
      var inf = calcEqInfo(co.id, eq);
      if(inf.pct===100) gongMap[key].done++;
      if(inf.delayed>0) gongMap[key].delayed++;
    });
  });
  Object.keys(gongMap).sort().forEach(function(k){
    var g = gongMap[k], total=g.eqs.length;
    var avgPct = total ? Math.round(g.eqs.reduce(function(s,eq){ return s+( (Object.keys(eq.actual||{}).length/STEPS.length)*100 ); },0)/total) : 0;
    var col = avgPct===100?'var(--gr)':avgPct>0?'var(--ac)':'var(--t3)';
    html += '<tr style="border-bottom:1px solid var(--bd2)">'      + '<td style="padding:8px 12px;font-size:14px">'+xe(g.name)+'</td>'      + '<td style="padding:8px 10px;text-align:center;color:var(--t2)">'+total+'</td>'      + '<td style="padding:8px 10px;text-align:center;color:var(--gr)">'+g.done+'</td>'      + '<td style="padding:8px 10px;text-align:center;color:'+(g.delayed?'var(--re)':'var(--t3)')+'">'+g.delayed+'</td>'      + '<td style="padding:8px 12px">'      + '<div style="display:flex;align-items:center;gap:6px">'      + '<div style="flex:1;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden">'      + '<div style="width:'+avgPct+'%;height:100%;background:'+col+';border-radius:3px"></div>'      + '</div>'      + '<span style="font-size:13px;color:'+col+';width:32px;text-align:right">'+avgPct+'%</span>'      + '</div></td>'      + '</tr>';
  });
  html += '</tbody></table></div></div>'
  // 설비업체별
  + '<div class="dash-section">'  + '<div class="dash-section-title">🏭 설비업체별 진척 현황</div>'  + '<div class="dash-tbl-scroll">'  + '<table style="width:100%;border-collapse:collapse;font-size:14px">'  + '<thead><tr style="background:var(--bg3)">'  + '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid var(--bd)">업체명</th>'  + '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid var(--bd)">설비</th>'  + '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid var(--bd)">완료</th>'  + '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid var(--bd)">지연</th>'  + '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid var(--bd)">진척률</th>'  + '</tr></thead><tbody>';

  var vendMap = {};
  filteredCos.forEach(function(co){
    var vends = state.vendorMaster[co.id]||[];
    var eqs   = state.equipments[co.id]||[];
    eqs.forEach(function(eq){
      var key = eq.vendCode||'미지정';
      var vObj= vends.find(function(v){ return v.code===eq.vendCode; })||{};
      var nm  = vObj.name||eq.vendNm||key;
      if(!vendMap[key]) vendMap[key] = { name:nm, eqs:[], done:0, delayed:0 };
      vendMap[key].eqs.push(eq);
      var inf = calcEqInfo(co.id, eq);
      if(inf.pct===100) vendMap[key].done++;
      if(inf.delayed>0) vendMap[key].delayed++;
    });
  });
  Object.keys(vendMap).sort().forEach(function(k){
    var v=vendMap[k], total=v.eqs.length;
    var avgPct = total ? Math.round(v.eqs.reduce(function(s,eq){ return s+(Object.keys(eq.actual||{}).length/STEPS.length*100); },0)/total) : 0;
    var col = avgPct===100?'var(--gr)':avgPct>0?'var(--ac)':'var(--t3)';
    html += '<tr style="border-bottom:1px solid var(--bd2)">'      + '<td style="padding:8px 12px;font-size:14px">'+xe(v.name)+'</td>'      + '<td style="padding:8px 10px;text-align:center;color:var(--t2)">'+total+'</td>'      + '<td style="padding:8px 10px;text-align:center;color:var(--gr)">'+v.done+'</td>'      + '<td style="padding:8px 10px;text-align:center;color:'+(v.delayed?'var(--re)':'var(--t3)')+'">'+v.delayed+'</td>'      + '<td style="padding:8px 12px">'      + '<div style="display:flex;align-items:center;gap:6px">'      + '<div style="flex:1;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden">'      + '<div style="width:'+avgPct+'%;height:100%;background:'+col+';border-radius:3px"></div>'      + '</div>'      + '<span style="font-size:13px;color:'+col+';width:32px;text-align:right">'+avgPct+'%</span>'      + '</div></td>'      + '</tr>';
  });
  html += '</tbody></table></div></div>'  + '</div>'
  // ── 설비별 11단계 진척 상세 ──
  + '<div class="dash-section">'  + '<div class="dash-section-title">🔧 설비별 11단계 투자 진척 현황</div>'  + '<div class="dash-tbl-scroll">'  + '<table style="width:100%;border-collapse:collapse;font-size:14px">'  + '<thead><tr style="background:var(--bg3)">'  + '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid var(--bd);white-space:nowrap">기업</th>'  + '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid var(--bd);white-space:nowrap">호기/설비명</th>';
  STEPS.forEach(function(s,si){
    html += '<th style="padding:8px 6px;text-align:center;border-bottom:1px solid var(--bd);white-space:nowrap;font-size:13px;color:var(--t2)">'+(si+1)+'.'+xe(s)+'</th>';
  });
  html += '<th style="padding:8px 12px;text-align:center;border-bottom:1px solid var(--bd);white-space:nowrap">진척률</th>'  + '</tr></thead><tbody>';

  filteredCos.forEach(function(co){
    var eqs = state.equipments[co.id]||[];
    eqs.forEach(function(eq, ei){
      var t=eq.target||{}, a=eq.actual||{};
      var info = calcEqInfo(co.id, eq);
      var rowBg = info.delayed>0 ? 'rgba(248,81,73,.04)' : 'transparent';
      html += '<tr style="border-bottom:1px solid var(--bd2);background:'+rowBg+'">'        + '<td style="padding:7px 12px;font-size:14px;white-space:nowrap">'+xe(co.name)+'</td>'        + '<td style="padding:7px 12px;font-weight:600;white-space:nowrap">'+(ei+1)+'호기. '+xe(eq.name)+'</td>';
      STEPS.forEach(function(_,si){
        var tgt=t[si]||'', act=a[si]||'';
        var isDelay = (act&&tgt&&act>tgt)||(tgt&&!act&&today>tgt);
        var icon = act ? (isDelay?'🔴':'✅') : (tgt&&today>tgt?'⚠️': tgt?'📅':'⬜');
        var cell = act ? act : (tgt?tgt:'');
        var col  = act ? (isDelay?'var(--re)':'var(--gr)') : (tgt&&today>tgt?'var(--re)':tgt?'var(--ac)':'var(--t3)');
        html += '<td style="padding:6px 6px;text-align:center;border-left:1px solid var(--bd2)">'          + '<div style="font-size:14px">'+icon+'</div>'          + (cell?'<div style="font-size:14px;color:'+col+';font-family:monospace">'+cell+'</div>':'')          + '</td>';
      });
      var pCol = info.pct===100?'var(--gr)':info.pct>=50?'var(--ac)':'var(--or)';
      html += '<td style="padding:7px 12px;text-align:center">'        + '<div style="font-size:14px;font-weight:700;color:'+pCol+'">'+info.pct+'%</div>'        + '<div style="height:4px;background:var(--bg3);border-radius:2px;margin-top:2px;overflow:hidden">'        + '<div style="width:'+info.pct+'%;height:100%;background:'+pCol+';border-radius:2px"></div>'        + '</div>'        + '</td>'        + '</tr>';
    });
  });
  html += '</tbody></table></div></div>';

  gid('pg_dashboard').innerHTML = '<div style="display:flex;flex-direction:column;height:100%;overflow:hidden">'    + '<div class="dash-hdr" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 18px;border-bottom:1px solid var(--bd)">'    + '<div><h1 style="font-size:18px;font-weight:700;margin:0">📊 대시보드</h1><p style="font-size:13px;color:var(--t2);margin:2px 0 0">기업·공정·설비업체·설비별 투자 프로세스 11단계 진척 현황</p></div>'    + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    + '<select id="dashCoFilter" onchange="pgDash()" style="padding:5px 10px;background:var(--bg3);border:1px solid var(--bd);border-radius:7px;color:var(--tx);font-size:13px;font-family:inherit;outline:none;cursor:pointer">'
    + '<option value="">🏢 전체 기업</option>'
    + state.companies.map(function(c){ return '<option value="' + xe(c.id) + '"' + (dashCoId===c.id?' selected':'') + '>' + xe(c.name) + '</option>'; }).join('')
    + '</select>'    + '<div style="display:flex;align-items:center;gap:5px;padding:5px 12px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;white-space:nowrap">'    + '<span style="font-size:14px">🏢</span><span style="font-size:13px;color:var(--t2)">등록 기업</span>'    + '<span style="font-size:16px;font-weight:700;color:var(--ac);margin-left:5px">' + totalCo + '개</span></div>'    + '<div style="display:flex;align-items:center;gap:5px;padding:5px 12px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;white-space:nowrap">'    + '<span style="font-size:14px">🏭</span><span style="font-size:13px;color:var(--t2)">등록 설비</span>'    + '<span style="font-size:16px;font-weight:700;color:var(--pu);margin-left:5px">' + totalEq + '대</span></div>'    + '<div style="display:flex;align-items:center;gap:5px;padding:5px 12px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;white-space:nowrap">'    + '<span style="font-size:14px">✅</span><span style="font-size:13px;color:var(--t2)">완료 설비</span>'    + '<span style="font-size:16px;font-weight:700;color:var(--gr);margin-left:5px">' + doneEq + '대</span></div>'    + '<div style="display:flex;align-items:center;gap:5px;padding:5px 12px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;white-space:nowrap">'    + '<span style="font-size:14px">⚠️</span><span style="font-size:13px;color:var(--t2)">지연 설비</span>'    + '<span style="font-size:16px;font-weight:700;color:var(--re);margin-left:5px">' + delayEq + '대</span></div>'    + '<button class="btn bs bsm" onclick="pgDash()" style="font-size:14px">🔄 새로고침</button>'    + '</div>'    + '</div>'    + '<div class="dash-body">' + html + '</div>'    + '</div>';
}

function mkDashStat(label, val, sub, color) {
  return '<div style="background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:16px 18px">'    + '<div style="font-size:14px;color:var(--t2);margin-bottom:6px">'+label+'</div>'    + '<div style="font-size:22px;font-weight:700;color:'+color+';margin-bottom:4px">'+val+'</div>'    + '<div style="font-size:13px;color:var(--t3)">'+sub+'</div>'    + '</div>';
}


function mkProgStat(lbl, val, color) {
  return '<div class="pr-stat-card">'
    + '<div class="pr-stat-lbl">' + lbl + '</div>'
    + '<div class="pr-stat-val" style="color:' + color + '">' + val + '</div>'
    + '</div>';
}

function mkStat(lbl, val, sub, color) {
  return '<div class="sc"><div class="sl">' + lbl + '</div><div class="sv" style="color:' + color + '">' + val + '</div><div class="ss">' + sub + '</div></div>';
}

function mkStepBars() {
  var max = 1;
  STEPS.forEach(function(s){ var c=state.master.filter(function(r){return r['프로세스']===s.key;}).length; if(c>max)max=c; });
  return STEPS.map(function(s){
    var c = state.master.filter(function(r){return r['프로세스']===s.key;}).length;
    var w = Math.round(c/max*100);
    return '<div class="brow"><span class="blbl">' + s.e + ' ' + s.s + '</span>'
      + '<div class="btrack"><div class="bfill" style="width:' + w + '%"></div>'
      + '<span class="bval">' + c + '</span></div></div>';
  }).join('');
}

function mkCoBars(tot) {
  if (!state.companies.length) return '<p style="color:var(--t2);padding:10px">등록된 기업이 없습니다</p>';
  return state.companies.map(function(c){
    var sel = ((state.setups[c.id]||{}).sel||[]).length;
    var pct = Math.round(sel/tot*100);
    return '<div style="margin-bottom:10px"><div class="flex-sb" style="margin-bottom:3px">'
      + '<span style="font-size:14px;font-weight:500">' + xe(c.name) + '</span>'
      + '<span style="font-size:16px;color:var(--t2)">' + sel + '개 (' + pct + '%)</span></div>'
      + '<div class="pb"><div class="pf" style="width:' + pct + '%"></div></div></div>';
  }).join('');
}

function mkReqBars(tot) {
  var types = ['필수','조건부 필수','선택','권장'];
  var colors = ['var(--gr)','var(--or)','var(--ac)','var(--pu)'];
  return types.map(function(t, i){
    var c = state.master.filter(function(r){return r['필수여부']===t;}).length;
    var pct = Math.round(c/tot*100);
    return '<div style="flex:1;min-width:140px"><div class="flex-sb" style="margin-bottom:3px">'
      + '<span style="font-size:14px;font-weight:500;color:' + colors[i] + '">' + t + '</span>'
      + '<span style="font-size:16px;color:var(--t2)">' + c + ' (' + pct + '%)</span></div>'
      + '<div class="pb"><div class="pf" style="width:' + pct + '%;background:' + colors[i] + '"></div></div></div>';
  }).join('');
}
