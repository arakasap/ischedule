// ==UserScript==
// @name         KMITL ตารางสอน/สอบ (ดึงจาก API ทุกคณะ)
// @namespace    local.kmitl.examtable
// @version      0.7
// @description  ดึงข้อมูลตารางสอนจาก API ของ REG KMITL แล้วแสดงเป็นตารางกระชับ ค้นหา/เรียง/โหลด CSV
// @match        https://regis.reg.kmitl.ac.th/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const API = 'https://regis.reg.kmitl.ac.th/api/';
  const DAYS = { 1: 'อาทิตย์', 2: 'จันทร์', 3: 'อังคาร', 4: 'พุธ', 5: 'พฤหัสบดี', 6: 'ศุกร์', 7: 'เสาร์' };

  let all = [];        // แถวทั้งหมดที่แปลงแล้ว
  let rawSample = null; // เก็บ record ดิบ 1 รายการไว้ debug
  let sortBy = 'code';

  const str = (v) => (v === null || v === undefined ? '' : String(v).trim());

  const stripHtml = (v) => {
    const d = document.createElement('div');
    d.innerHTML = str(v).replace(/<\/(div|p|br)>|<br\s*\/?>/gi, '\n');
    return d.textContent.split('\n').map((x) => x.trim()).filter(Boolean).join(', ');
  };
  const hm = (t) => str(t).slice(0, 5);
  // "2026-08-18 09:30:00" + "2026-08-18 12:30:00" -> "18/08/2569 09:30-12:30"
  function exam(start, end) {
    const s = str(start);
    if (!s) return '';
    const [d, t] = s.split(' ');
    const [y, m, dd] = d.split('-');
    const e = str(end).split(' ')[1];
    return `${dd}/${m}/${+y + 543} ${hm(t)}${e ? '-' + hm(e) : ''}`;
  }

  function convert(f, curr, group, rec) {
    const typeCode = str(rec.lect_or_prac);
    const day = DAYS[+rec.teach_day] || '';
    const tt = rec.teach_time ? hm(rec.teach_time) + (rec.teach_time2 ? '-' + hm(rec.teach_time2) : '') : '';
    return {
      id: str(rec.teach_table_id),
      facultyId: str(f.faculty_id),
      deptId: str(f.department_id),
      curriculumId: str(f.curriculum2_id),
      faculty: str(f.faculty_name_th) || str(f.faculty_name_en),
      dept: str(f.department_name_th) || str(f.department_name_en),
      curriculum: str(f.curriculum_name_th),
      classYear: str(f.class),
      group: group,
      code: str(rec.subject_id),
      name: str(rec.subject_name_en) || str(rec.subject_name_th),
      nameTh: str(rec.subject_name_th),
      credit: str(rec.credit_str) || str(rec.credit),
      section: str(rec.section),
      type: typeCode === 'ท' ? 'ทฤษฎี' : typeCode === 'ป' ? 'ปฏิบัติ' : typeCode,
      time: [day, tt].filter(Boolean).join(' '),
      room: [str(rec.room_name), str(rec.building_name)].filter(Boolean).join(' / '),
      teacher: stripHtml(rec.teacher_list_th) || stripHtml(rec.teacher_list_en),
      midterm: exam(rec.midterm_start_date_time, rec.midterm_end_date_time),
      final: exam(rec.final_start_date_time, rec.final_end_date_time),
      midKey: str(rec.midterm_start_date_time),
      finKey: str(rec.final_start_date_time),
      cond: stripHtml(rec.rules_th) || stripHtml(rec.rules_en),
      remark: str(rec.remark),
      seats: str(rec.limit),
      enrolled: str(rec.count),
    };
  }

  function flatten(json) {
    const out = [];
    (Array.isArray(json) ? json : []).forEach((f) => {
      (f.teachtable || []).forEach((g) => {
        (g.data || []).forEach((rec) => {
          if (!rawSample) rawSample = rec;
          out.push(convert(f, null, str(g.subject_type_name_th), rec));
        });
      });
    });
    return out;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // สร้างพารามิเตอร์: ค่าที่ไม่ระบุ (undefined) จะไม่ถูกส่งไปเลย
  function buildUrl(o, sel, all) {
    const q = {
      function: 'get-teach-table-show',
      level_id: o.level,
      mode: 'by_class',
      selected_year: o.year,
      selected_semester: o.sem,
      selected_faculty: sel.faculty,
      selected_department: sel.department,
      selected_curriculum: sel.curriculum,
      selected_class_year: sel.classYear,
      search_all_faculty: all.faculty,
      search_all_department: all.department,
      search_all_curriculum: all.curriculum,
      search_all_branch: 'true',
      search_all_class_year: all.classYear,
    };
    const p = new URLSearchParams();
    Object.keys(q).forEach((k) => { if (q[k] !== undefined) p.set(k, q[k]); });
    return API + '?' + p.toString();
  }

  async function getJson(url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 40000); // กันค้าง: รอได้ไม่เกิน 40 วินาที
    let res, body;
    try {
      console.log('[KMITL] GET', url);
      res = await fetch(url, { credentials: 'include', signal: ctl.signal });
      body = await res.text();
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'หมดเวลา (เซิร์ฟเวอร์ไม่ตอบใน 40 วินาที)' : e.message);
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + body.slice(0, 120));
    try { return JSON.parse(body); } catch (e) { throw new Error('ตอบกลับไม่ใช่ JSON: ' + body.slice(0, 120)); }
  }

  function dedupe(list) {
    const seen = new Set();
    return list.filter((r) => {
      const k = r.id || r.code + '|' + r.section + '|' + r.type + '|' + r.curriculum + '|' + r.classYear;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  async function load(opts, onStatus) {
    const T = 'true';
    const errors = [];

    // วิธี 1: ขอทุกคณะในคำขอเดียว โดยไม่ส่งค่า selected_*
    try {
      onStatus('ลองวิธี 1: ขอทุกคณะในคำขอเดียว...');
      const json = await getJson(buildUrl(opts, {}, { faculty: T, department: T, curriculum: T, classYear: T }));
      const list = flatten(json);
      if (list.length) { all = dedupe(list); return all.length; }
      errors.push('วิธี 1: ได้ข้อมูลว่าง');
    } catch (e) { errors.push('วิธี 1: ' + e.message); }

    // วิธี 2: วนทีละคณะ (รหัส 01-40) ถ้าคำขอเดียวทั้งคณะล้มเหลว (คณะใหญ่เกินไป) จะแตกเป็นทีละชั้นปี 0-7
    let acc = [];
    const failed = [];
    for (let i = 1; i <= 40; i++) {
      const fid = String(i).padStart(2, '0');
      onStatus(`วนทีละคณะ ${fid}/40 (สะสม ${acc.length} รายการ${failed.length ? ', ล้มเหลว: ' + failed.join(',') : ''})`);
      try {
        const json = await getJson(buildUrl(opts, { faculty: fid }, { faculty: 'false', department: T, curriculum: T, classYear: T }));
        acc = acc.concat(flatten(json));
      } catch (e) {
        console.warn('[KMITL] คณะ ' + fid + ' (ทั้งคณะ): ' + e.message + ' -> ลองแยกทีละชั้นปี');
        let got = 0, bad = 0;
        for (let y = 0; y <= 7; y++) {
          onStatus(`คณะ ${fid} แยกชั้นปี ${y}/7 (สะสม ${acc.length})`);
          try {
            const json = await getJson(buildUrl(opts, { faculty: fid, classYear: String(y) }, { faculty: 'false', department: T, curriculum: T, classYear: 'false' }));
            const list = flatten(json);
            acc = acc.concat(list); got += list.length;
          } catch (e2) {
            bad++;
            console.warn(`[KMITL] คณะ ${fid} ชั้นปี ${y}: ${e2.message}`);
            if (errors.length < 4) errors.push(`คณะ ${fid} ชั้นปี ${y}: ${e2.message}`);
          }
          await sleep(300);
        }
        if (!got && bad) failed.push(fid);
      }
      await sleep(300);
    }
    if (acc.length) {
      all = dedupe(acc);
      const names = [...new Set(all.map((r) => r.faculty))];
      console.log('[KMITL] คณะที่ได้ข้อมูล (' + names.length + '):', names, 'ล้มเหลว:', failed);
      return all.length;
    }
    all = [];
    throw new Error(errors.join(' | ') || 'ไม่พบข้อมูล');
  }

  const COLS = [
    ['facultyId', 'รหัสคณะ'], ['faculty', 'คณะ'], ['deptId', 'รหัสแผนก'], ['dept', 'แผนก'], ['curriculumId', 'รหัสหลักสูตร'], ['curriculum', 'หลักสูตร'], ['classYear', 'ชั้นปี'], ['code', 'รหัสวิชา'], ['name', 'ชื่อวิชา'],
    ['credit', 'หน่วยกิต'], ['section', 'กลุ่ม'], ['type', 'ประเภท'], ['time', 'วัน-เวลาเรียน'], ['room', 'ห้อง'],
    ['teacher', 'อาจารย์'], ['midterm', 'สอบกลางภาค'], ['final', 'สอบปลายภาค'],
    ['cond', 'เงื่อนไข'], ['seats', 'รับ'], ['enrolled', 'ลงแล้ว'], ['remark', 'หมายเหตุ'],
  ];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function filtered(q, fac) {
    const f = q.trim().toLowerCase();
    let list = all.filter((r) => (!fac || r.faculty === fac) && (!f || [r.code, r.name, r.nameTh, r.teacher, r.faculty, r.curriculum].join(' ').toLowerCase().includes(f)));
    list.sort((a, b) => {
      if (sortBy === 'midterm' || sortBy === 'final') {
        const k = sortBy === 'midterm' ? 'midKey' : 'finKey';
        const ka = a[k] || '9999', kb = b[k] || '9999';
        return ka.localeCompare(kb) || a.code.localeCompare(b.code);
      }
      return a.code.localeCompare(b.code) || a.section.localeCompare(b.section, undefined, { numeric: true });
    });
    return list;
  }

  function toCSV(list) {
    const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    return '\uFEFF' + [COLS.map((c) => q(c[1])).join(',')].concat(list.map((r) => COLS.map((c) => q(r[c[0]])).join(','))).join('\n');
  }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openPanel() {
    document.getElementById('kx-panel')?.remove();
    const panel = document.createElement('div');
    panel.id = 'kx-panel';
    panel.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#fff;overflow:auto;padding:12px;font:14px/1.4 system-ui,sans-serif;color:#222';
    panel.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
        ปีการศึกษา <input id="kx-year" value="2569" size="5" style="padding:5px">
        ภาค <input id="kx-sem" value="1" size="2" style="padding:5px">
        ระดับ <input id="kx-level" value="1" size="2" style="padding:5px" title="1 = ปริญญาตรี (ตามที่เห็นใน request)">
        <button id="kx-load" style="padding:6px 10px">โหลดข้อมูลทุกคณะ</button>
        <span id="kx-status" style="color:#666"></span>
        <button id="kx-close" style="padding:6px 10px;margin-left:auto">ปิด</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
        <select id="kx-fac" style="padding:6px"><option value="">ทุกคณะ</option></select>
        <input id="kx-q" placeholder="ค้นหา รหัส/ชื่อวิชา/อาจารย์" style="padding:6px;min-width:240px">
        <select id="kx-sort" style="padding:6px">
          <option value="code">เรียงตามรหัสวิชา</option>
          <option value="midterm">เรียงตามวันสอบกลางภาค</option>
          <option value="final">เรียงตามวันสอบปลายภาค</option>
        </select>
        <button id="kx-csv" style="padding:6px 10px">CSV</button>
        <button id="kx-raw" style="padding:6px 10px" title="ดู record ดิบ 1 รายการ ไว้เช็กชื่อฟิลด์">ดูข้อมูลดิบ</button>
        <b>แสดง <span id="kx-count">0</span> แถว</b>
      </div>
      <pre id="kx-rawbox" style="display:none;background:#f6f6f6;padding:8px;max-height:260px;overflow:auto;font-size:12px"></pre>
      <table style="border-collapse:collapse;width:100%"><thead><tr id="kx-head"></tr></thead><tbody id="kx-body"></tbody></table>`;
    document.body.appendChild(panel);
    const $ = (s) => panel.querySelector(s);
    const th = 'border:1px solid #ccc;padding:4px 6px;text-align:left;background:#f3f3f3;position:sticky;top:0';
    const td = 'border:1px solid #ddd;padding:4px 6px;vertical-align:top';
    $('#kx-head').innerHTML = COLS.map((c) => `<th style="${th}">${c[1]}</th>`).join('');

    const render = () => {
      const list = filtered($('#kx-q').value, $('#kx-fac').value);
      $('#kx-count').textContent = list.length;
      $('#kx-body').innerHTML = list.map((r) => '<tr>' + COLS.map((c) => `<td style="${td}">${esc(r[c[0]])}</td>`).join('') + '</tr>').join('');
    };
    const fillFaculty = () => {
      const names = [...new Set(all.map((r) => r.faculty))].sort();
      $('#kx-fac').innerHTML = '<option value="">ทุกคณะ</option>' + names.map((n) => `<option>${esc(n)}</option>`).join('');
    };

    $('#kx-load').onclick = async () => {
      $('#kx-status').textContent = 'กำลังโหลด...';
      try {
        const n = await load({ year: $('#kx-year').value, sem: $('#kx-sem').value, level: $('#kx-level').value }, (m) => { $('#kx-status').textContent = m; });
        $('#kx-status').textContent = n ? `ได้ ${n} รายการ` : 'ไม่พบข้อมูล';
        fillFaculty();
        render();
      } catch (e) {
        $('#kx-status').textContent = 'ผิดพลาด: ' + e.message;
      }
    };
    $('#kx-q').oninput = render;
    $('#kx-fac').onchange = render;
    $('#kx-sort').onchange = (e) => { sortBy = e.target.value; render(); };
    $('#kx-csv').onclick = () => download('kmitl-teach-table.csv', toCSV(filtered($('#kx-q').value, $('#kx-fac').value)), 'text/csv;charset=utf-8');
    $('#kx-raw').onclick = () => {
      const box = $('#kx-rawbox');
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
      box.textContent = rawSample ? JSON.stringify(rawSample, null, 2) : 'ยังไม่มีข้อมูล กด "โหลดข้อมูลทุกคณะ" ก่อน';
    };
    $('#kx-close').onclick = () => panel.remove();
    if (all.length) { fillFaculty(); render(); }
  }

  function addButton() {
    if (document.getElementById('kx-btn')) return;
    const b = document.createElement('button');
    b.id = 'kx-btn';
    b.textContent = 'ตารางสอบ';
    b.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483646;padding:10px 14px;border:0;border-radius:8px;background:#e8590c;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)';
    b.onclick = openPanel;
    document.body.appendChild(b);
  }
  addButton();
  setInterval(addButton, 2000);
})();
