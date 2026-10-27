/* ===== 心晴日记 · 情绪与自我关怀 ===== */
const MOODS = [
  { key: 'happy',   emoji: '😄', label: '开心', score: 5 },
  { key: 'calm',    emoji: '😌', label: '平静', score: 4 },
  { key: 'anxious', emoji: '😰', label: '焦虑', score: 2 },
  { key: 'tired',   emoji: '😫', label: '疲惫', score: 2 },
  { key: 'sad',     emoji: '😔', label: '低落', score: 1 },
  { key: 'angry',   emoji: '😠', label: '生气', score: 2 },
];
const TAGS = ['工作', '学业', '社交', '家庭', '健康', '关系', '金钱', '睡眠', '其他'];
const NEGATIVE = new Set(['anxious', 'tired', 'sad', 'angry']);

const INTENSITY_LABELS = { 1: '很轻', 2: '较轻', 3: '中等', 4: '较强', 5: '很强' };

const MUSIC = [
  { ico: '🌊', title: '海浪白噪音 · 助眠', sub: '适合睡前放松', link: 'https://music.163.com/#/search/m/?s=白噪音+助眠' },
  { ico: '🎹', title: '轻钢琴 · 专注', sub: '平复思绪，专注当下', link: 'https://music.163.com/#/search/m/?s=轻音乐+钢琴' },
  { ico: '🧘', title: '冥想钵音 · 静心', sub: '跟随音波进入平静', link: 'https://music.163.com/#/search/m/?s=冥想+钵音' },
  { ico: '🍃', title: '自然之声 · 森林', sub: '鸟鸣与溪流，放松神经', link: 'https://music.163.com/#/search/m/?s=自然声+森林' },
];

const EXERCISES = [
  { ico: '🚶', title: '散步 15 分钟', sub: '走出房间，让身体动起来' },
  { ico: '🙆', title: '肩颈拉伸', sub: '缓解久坐带来的紧绷' },
  { ico: '🧎', title: '睡前瑜伽 5 式', sub: '舒展肌肉，安抚神经' },
  { ico: '💃', title: '随音乐摆动', sub: '哪怕 3 分钟，释放情绪' },
];

let entries = load();
let state = { mood: null, tags: [] };

/* ===== 存储 ===== */
function load() {
  try { return JSON.parse(localStorage.getItem('xinqing_entries') || '[]'); }
  catch (e) { return []; }
}
function save() { localStorage.setItem('xinqing_entries', JSON.stringify(entries)); }

/* ===== 工具 ===== */
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function fmtDate(s) { const [y, m, dd] = s.split('-'); return m + '/' + dd; }
function moodByKey(k) { return MOODS.find(m => m.key === k); }
function $ (sel) { return document.querySelector(sel); }
function $$ (sel) { return document.querySelectorAll(sel); }

/* ===== 导航 ===== */
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
});
function switchView(id) {
  $$('.view').forEach(v => v.classList.remove('active'));
  $$('.tab').forEach(t => t.classList.remove('active'));
  $('#' + id).classList.add('active');
  $('.tab[data-view="' + id + '"]').classList.add('active');
  window.scrollTo({ top: 0 });
  if (id === 'view-insight') renderInsight();
  if (id === 'view-care') renderCare();
}

/* ===== 视图1：今日打卡 ===== */
function initCheckin() {
  // 日期 & 问候
  const now = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'];
  $('#dateLine').textContent = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 · 星期' + week[now.getDay()];
  const h = now.getHours();
  $('#greeting').textContent = h < 6 ? '夜深了 🌙' : h < 12 ? '早上好 🌅' : h < 18 ? '下午好 ☀️' : '晚上好 🌆';
  $('#topbarSub').textContent = h < 6 ? '辛苦了，早点休息' : h < 12 ? '新的一天，从觉察情绪开始' : h < 18 ? '记得给自己留点呼吸的时间' : '把今天的疲惫交给纸笔';

  // 情绪
  $('#moodGrid').innerHTML = MOODS.map(m =>
    '<div class="mood-item" data-mood="' + m.key + '"><span class="emoji">' + m.emoji + '</span><span class="label">' + m.label + '</span></div>'
  ).join('');
  $$('.mood-item').forEach(el => el.addEventListener('click', () => {
    state.mood = el.dataset.mood;
    $$('.mood-item').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
  }));

  // 强度
  $('#intensity').addEventListener('input', e => {
    $('#intensityValue').textContent = INTENSITY_LABELS[e.target.value];
  });

  // 标签
  $('#tagList').innerHTML = TAGS.map(t => '<div class="tag" data-tag="' + t + '">' + t + '</div>').join('');
  $$('.tag').forEach(el => el.addEventListener('click', () => {
    const t = el.dataset.tag;
    if (state.tags.includes(t)) state.tags = state.tags.filter(x => x !== t);
    else state.tags.push(t);
    el.classList.toggle('selected');
  }));

  $('#saveBtn').addEventListener('click', saveToday);

  // 若今天已记录，回填
  const today = entries.find(e => e.date === todayStr());
  if (today) {
    state.mood = today.mood; state.tags = today.tags.slice();
    $('#note').value = today.note || '';
    $('#intensity').value = today.intensity;
    $('#intensityValue').textContent = INTENSITY_LABELS[today.intensity];
    $$('.mood-item').forEach(x => x.classList.toggle('selected', x.dataset.mood === today.mood));
    $$('.tag').forEach(x => x.classList.toggle('selected', today.tags.includes(x.dataset.tag)));
  }
}

function saveToday() {
  if (!state.mood) { showToast('先选一个情绪吧 😊'); return; }
  const date = todayStr();
  const entry = {
    id: Date.now(), date,
    mood: state.mood,
    intensity: Number($('#intensity').value),
    tags: state.tags.slice(),
    note: $('#note').value.trim(),
    ts: Date.now(),
  };
  const idx = entries.findIndex(e => e.date === date);
  if (idx >= 0) entries[idx] = entry; else entries.push(entry);
  save();
  showToast('已保存，你今天很棒 🌿');
  setTimeout(() => switchView('view-insight'), 700);
}

function showToast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2000);
}

/* ===== 视图2：情绪洞察 ===== */
function renderInsight() {
  if (!entries.length) {
    $('#streakNum').textContent = '0'; $('#totalNum').textContent = '0'; $('#avgMood').textContent = '—';
    $('#trendChart').innerHTML = '<p class="muted">还没有记录，先去打卡吧～</p>';
    $('#distRow').innerHTML = ''; $('#triggerAnalysis').innerHTML = ''; $('#aiInsight').textContent = '记录几天的情绪后，这里会生成属于你的洞察。';
    return;
  }
  const sorted = entries.slice().sort((a, b) => a.ts - b.ts);
  const n = entries.length;
  const sum = entries.reduce((s, e) => s + moodByKey(e.mood).score, 0);
  const avg = sum / n;
  $('#totalNum').textContent = n;
  $('#streakNum').textContent = calcStreak();
  $('#avgMood').textContent = avg.toFixed(1);

  // 趋势图
  renderTrend(sorted);

  // 情绪分布
  const counts = {};
  MOODS.forEach(m => counts[m.key] = 0);
  entries.forEach(e => counts[e.mood]++);
  $('#distRow').innerHTML = MOODS.filter(m => counts[m.key] > 0).map(m =>
    '<div class="dist-item"><span>' + m.emoji + '</span>' + m.label + ' <span class="bar">' + counts[m.key] + '</span></div>'
  ).join('') || '<p class="muted">暂无数据</p>';

  // 触发分析
  const negTags = {};
  entries.forEach(e => { if (NEGATIVE.has(e.mood)) e.tags.forEach(t => negTags[t] = (negTags[t] || 0) + 1); });
  const top = Object.entries(negTags).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = top.length ? top[0][1] : 1;
  $('#triggerAnalysis').innerHTML = top.length
    ? top.map(([t, c]) =>
        '<div class="trigger-item"><span class="t-name">' + t + '</span><div class="t-bar-bg"><div class="t-bar" style="width:' + (c / max * 100) + '%"></div></div><span class="t-count">' + c + '次</span></div>'
      ).join('')
    : '<p class="muted">负面情绪记录还不多，再记几次就能看出规律。</p>';

  // AI 洞察
  $('#aiInsight').textContent = aiInsight(sorted);
}

function calcStreak() {
  const set = new Set(entries.map(e => e.date));
  let streak = 0;
  let d = new Date();
  // 今天没记录则从昨天起算
  if (!set.has(todayStr())) d.setDate(d.getDate() - 1);
  while (set.has(fmtDateObj(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
function fmtDateObj(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

function renderTrend(sorted) {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const s = fmtDateObj(d);
    const e = sorted.find(x => x.date === s);
    days.push({ s, score: e ? moodByKey(e.mood).score : null, mood: e ? e.mood : null });
  }
  const W = 340, H = 150, pad = 18;
  const pts = days.map((d, i) => ({
    x: pad + i * ((W - pad * 2) / (days.length - 1)),
    y: H - pad - (d.score == null ? 0 : (d.score - 1) / 4 * (H - pad * 2)),
    d,
  }));
  const valid = pts.filter(p => p.d.score != null);
  const path = valid.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
  const area = valid.length ? path + ' L' + valid[valid.length - 1].x.toFixed(1) + ' ' + (H - pad) + ' L' + valid[0].x.toFixed(1) + ' ' + (H - pad) + ' Z' : '';
  const dots = valid.map(p => {
    const m = moodByKey(p.d.mood);
    return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4" fill="#8b7cf6"><title>' + fmtDate(p.d.s) + ' ' + m.emoji + m.label + '</title></circle>';
  }).join('');
  $('#trendChart').innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '">' +
    '<defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b39df8" stop-opacity="0.5"/><stop offset="100%" stop-color="#b39df8" stop-opacity="0"/></linearGradient></defs>' +
    (area ? '<path d="' + area + '" fill="url(#tg)"/>' : '') +
    (valid.length ? '<path d="' + path + '" fill="none" stroke="#8b7cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' : '') +
    dots +
    '</svg>';
}

function aiInsight(sorted) {
  const last = sorted[sorted.length - 1];
  const m = moodByKey(last.mood);
  const recent = sorted.slice(-3).map(e => moodByKey(e.mood).label).join('、');
  const negTags = {};
  entries.forEach(e => { if (NEGATIVE.has(e.mood)) e.tags.forEach(t => negTags[t] = (negTags[t] || 0) + 1); });
  const top = Object.entries(negTags).sort((a, b) => b[1] - a[1])[0];
  let s = '最近记录显示你的情绪以「' + recent + '」为主。';
  if (top) s += '负面情绪里，「' + top[0] + '」是最常见的触发因素（出现 ' + top[1] + ' 次）。';
  if (NEGATIVE.has(last.mood)) s += '今天状态有点累，试试 2 分钟呼吸练习，或到「关怀」页挑一首音乐放松一下。';
  else s += '整体状态不错，继续保持觉察与自我关怀～';
  return s;
}

/* ===== 视图3：自我关怀 ===== */
function renderCare() {
  const last = entries.length ? entries[entries.length - 1] : null;
  const m = last ? moodByKey(last.mood) : null;
  if (m && NEGATIVE.has(m.key)) {
    $('#careGreeting').textContent = m.emoji + ' 需要一点温柔';
    $('#careHint').textContent = '你最近是「' + m.label + '」的状态，为你准备了这几份礼物。';
  } else {
    $('#careGreeting').textContent = '给自己一点温柔';
    $('#careHint').textContent = '无论状态如何，都值得被好好照顾。';
  }
  $('#musicList').innerHTML = MUSIC.map(x =>
    '<a class="music-item" href="' + x.link + '" target="_blank" rel="noopener"><span class="ico">' + x.ico + '</span><span><div class="mi-title">' + x.title + '</div><div class="mi-sub">' + x.sub + '</div></span></a>'
  ).join('');
  $('#exerciseList').innerHTML = EXERCISES.map(x =>
    '<div class="exercise-item"><span class="ico">' + x.ico + '</span><span><div class="mi-title">' + x.title + '</div><div class="mi-sub">' + x.sub + '</div></span></div>'
  ).join('');
}

/* ===== 视图4：呼吸练习 ===== */
let breatheTimer = null;
const PHASES = [
  { label: '吸气', dur: 4, from: 0.55, to: 1 },
  { label: '屏息', dur: 7, from: 1, to: 1 },
  { label: '呼气', dur: 8, from: 1, to: 0.55 },
];

function initBreathe() {
  $('#goBreathe').addEventListener('click', () => switchView('view-breathe'));
  $('#breatheBack').addEventListener('click', stopBreathe);
  $('#breatheStart').addEventListener('click', () => {
    if (breatheTimer) { stopBreathe(); return; }
    startBreathe();
  });
}
function startBreathe() {
  let phase = 0, cycleStart = performance.now();
  const startBtn = $('#breatheStart');
  startBtn.textContent = '停止';
  $('#breatheTip').textContent = '跟随圆圈的节奏呼吸';
  function tick(now) {
    const p = PHASES[phase];
    const elapsed = (now - cycleStart) / 1000;
    if (elapsed >= p.dur) {
      phase = (phase + 1) % PHASES.length;
      cycleStart = now;
    }
    const pp = PHASES[phase];
    const t = (now - cycleStart) / 1000 / pp.dur;
    const scale = pp.from + (pp.to - pp.from) * Math.min(1, t);
    const ring = $('#breatheRing');
    ring.style.transform = 'scale(' + scale + ')';
    $('#breathePhase').textContent = pp.label;
    $('#breatheCount').textContent = Math.max(1, Math.ceil(pp.dur - (now - cycleStart) / 1000));
    breatheTimer = requestAnimationFrame(tick);
  }
  breatheTimer = requestAnimationFrame(tick);
}
function stopBreathe() {
  if (breatheTimer) cancelAnimationFrame(breatheTimer);
  breatheTimer = null;
  $('#breatheStart').textContent = '开始';
  $('#breathePhase').textContent = '准备';
  $('#breatheCount').textContent = '4';
  $('#breatheRing').style.transform = 'scale(1)';
  $('#breatheTip').textContent = '找个舒服的姿势，点击开始';
  switchView('view-care');
}

/* ===== 启动 ===== */
initCheckin();
initBreathe();
