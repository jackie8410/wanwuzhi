import { labMarkup, bindLab } from './labs.js?v=2026-11-02-v4';
const VERSION = '2026-11-02-v4';
const BASE = new URL('../', import.meta.url);
const STAGES = [{ key: 'beginner', label: '入门', description: '理解概念与直觉' }, { key: 'intermediate', label: '进阶', description: '推演机制与方法' }, { key: 'advanced', label: '综合研习', description: '检验论证与完成项目' }];
const app = document.querySelector('#app');
const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const asset = path => new URL(path.replace(/^\//, ''), BASE).href;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const list = items => `<ul>${items.map(item => `<li>${h(item)}</li>`).join('')}</ul>`;
const state = { domains: [], chapters: [], curricula: new Map(), index: null };
let routeVersion = 0;
let cleanup = () => {};
let storageFailed = false;
const memory = new Map();
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { storageFailed = true; return memory.get(key) ?? null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { storageFailed = true; memory.set(key, value); } },
  remove(key) { try { localStorage.removeItem(key); } catch { memory.delete(key); } }
};
const key = (type, id, stage) => `wanwuzhi:${type}:${id}${stage ? `:${stage}` : ''}`;
const done = (id, stage) => storage.get(key('progress', id, stage)) === 'done';
const fav = id => storage.get(key('fav', id)) === '1';
const count = id => STAGES.filter(s => done(id, s.key)).length;
const getRecord = (id, stage) => { try { const raw = storage.get(key('review', id, stage)); return raw && validBackupValue(key('review', id, stage), raw) ? JSON.parse(raw) : null; } catch { return null; } };
async function json(path) {
  const response = await fetch(`${asset(path)}?v=${VERSION}`);
  if (!response.ok) throw new Error(`资料加载失败（${response.status}），请稍后重试。`);
  return response.json();
}
async function curriculum(id) {
  if (!state.curricula.has(Number(id))) {
    const data = await json(`data/curricula/${id}.json`);
    if (data.domainId !== Number(id)) throw new Error('课程与领域编号不符。');
    state.curricula.set(Number(id), data);
  }
  return state.curricula.get(Number(id));
}
function toast(message) {
  const el = $('#toast');
  if (el) { el.textContent = message; el.classList.add('visible'); setTimeout(() => el.classList.remove('visible'), 2600); }
}
function applyPreferences() {
  document.documentElement.dataset.theme = storage.get('wanwuzhi:theme') || 'light';
  document.documentElement.dataset.font = storage.get('wanwuzhi:font') || 'normal';
}
function layout(content, title = '世间万物', bind = () => {}) {
  cleanup(); cleanup = () => {};
  document.title = `${title} · 成年人的知识地图`;
  const route = location.hash.split('?')[0] || '#/';
  const philosophyLink = route === '#/' || route === '#'
    ? '<a class="topbar-link" href="https://jackie8410.github.io/philosophy-river/" target="_blank" rel="noopener" aria-label="思想长河（在新标签页打开）">思想长河</a>'
    : '';
  app.innerHTML = `<a class="skip" href="#main">跳到主要内容</a>
    <header class="topbar"><a class="brand" href="#/"><span class="brand-mark">万</span><span><b>世间万物</b><small>LEARN FOR EVERYTHING</small></span></a>
    <nav aria-label="主导航">${[['#/', '首页'], ['#/explore', '知识地图'], ['#/roadmap', '学习路径'], ['#/search', '搜索'], ['#/dashboard', '学习台']].map(([url, label]) => `<a ${route === url ? 'aria-current="page"' : ''} href="${url}">${label}</a>`).join('')}</nav>
    <button class="icon theme" aria-label="切换明暗阅读模式">◐</button>
    ${philosophyLink}</header>
    <main id="main" tabindex="-1">${content}</main>
    <footer><div><b>世间万物</b><p>从一个好问题出发，逐步理解世界。</p></div><div><a href="#/about">内容标准</a><button class="text-button qr-open">万物小店 ↗</button><span>V4 · 2026.11</span></div></footer>
    <div id="toast" role="status" aria-live="polite"></div>`;
  applyPreferences();
  $('.skip').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); $('#main').scrollIntoView(); });
  $('.theme').addEventListener('click', () => { storage.set('wanwuzhi:theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); applyPreferences(); });
  $$('.qr-open').forEach(button => button.addEventListener('click', showQr));
  $$('.favorite').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.id;
    const value = !fav(id);
    if (value) storage.set(key('fav', id), '1'); else storage.remove(key('fav', id));
    button.textContent = value ? '★' : '☆'; button.setAttribute('aria-pressed', String(value)); toast(value ? '已加入收藏' : '已取消收藏');
  }));
  bind();
  if (storageFailed) toast('浏览器限制了本地保存，本次学习记录仅在当前页面有效。');
}
function showQr() {
  if (document.querySelector('.qr-dialog')) return;
  const previousCleanup = cleanup;
  const previous = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'qr-dialog';
  dialog.innerHTML = `<button class="dialog-close icon" aria-label="关闭小店二维码">×</button><p class="eyebrow">万物小店</p><h2>把好书带回生活</h2><img src="${asset('qr/store-qr.png')}" alt="微信小店橱窗二维码" width="280" height="280"><p>请用微信扫码；手机上可保存二维码后在微信识别。</p><a class="button secondary" href="${asset('qr/store-qr.png')}" download="万物小店二维码.png">保存二维码</a><p class="muted">课程中的开放教材可直接免费阅读。店铺在售书籍以实际橱窗为准。</p>`;
  document.body.append(dialog);
  const close = () => dialog.close();
  $('.dialog-close').addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); } });
  dialog.addEventListener('close', () => { dialog.remove(); document.body.classList.remove('modal-open'); previous?.focus(); }, { once: true });
  document.body.classList.add('modal-open'); dialog.showModal();
  cleanup = () => { previousCleanup(); if (dialog.open) dialog.close(); };
}
function card(domain) {
  return `<article class="domain-card"><div class="card-meta"><span>${h(domain.chapterTitle)}</span><button class="favorite icon" data-id="${domain.id}" aria-label="收藏${h(domain.title)}" aria-pressed="${fav(domain.id)}">${fav(domain.id) ? '★' : '☆'}</button></div><h3><a href="#/domain/${domain.id}">${h(domain.title)}</a></h3><p>${h(domain.summary)}</p><div class="card-bottom"><span>${count(domain.id)}/3 已研习</span><a href="#/domain/${domain.id}/stage/beginner">开始学习 <span aria-hidden="true">↗</span></a></div></article>`;
}
function sectionHead(kicker, title, tail = '') { return `<div class="section-head"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2></div>${tail}</div>`; }
function home() {
  const last = storage.get('wanwuzhi:last');
  const ids = [3, 31, 51, 61, 91, 82];
  layout(`<section class="hero container"><div class="hero-copy"><p class="eyebrow"><span class="live-dot"></span> 为好奇心，建立一条长路</p><h1>从头开始，<br>重新认识<span>这个世界。</span></h1><p class="hero-intro">关于人性、文明、科学与生活。把零散的信息，变成可以理解、检验和运用的知识。</p><div class="actions"><a class="button primary" href="${last && /^#\/domain\/\d+\/stage\/(beginner|intermediate|advanced)$/.test(last) ? h(last) : '#/explore'}">${last ? '继续上次学习' : '打开知识地图'} <span>↗</span></a><a class="button secondary" href="#/roadmap">零基础从哪里开始</a></div><div class="hero-numbers"><span><b>10</b> 大知识篇章</span><span><b>100</b> 个探索领域</span><span><b>300</b> 节递进研习</span></div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="orbit orbit-c"></div><span class="orbit-label one">人性 · HUMANITY</span><span class="orbit-label two">科学 · SCIENCE</span><span class="orbit-label three">文明 · CIVILIZATION</span><div class="orbit-core">万<span>让知识发生连接</span></div><p>EVERYTHING IS CONNECTED</p></div></section>
    <section class="intro-strip"><div class="container"><span>01 <b>读懂原理</b> 原创讲解与关键概念</span><span>02 <b>亲手验证</b> 算例、练习与即时解析</span><span>03 <b>走向深入</b> 开放教材与独立项目</span></div></section>
    <section class="container block">${sectionHead('A PLACE TO START', '先从这些问题出发', '<a href="#/explore">查看全部领域 ↗</a>')}<div class="domain-grid">${ids.map(id => card(state.domains.find(d => d.id === id))).join('')}</div></section>
    <section class="container block">${sectionHead('THE KNOWLEDGE ATLAS', '十个入口，一张世界地图')}<div class="chapter-grid">${state.chapters.map(c => `<a class="chapter-card" href="#/explore?chapter=${c.id}"><img loading="lazy" width="320" height="170" src="${asset(`chapter-${String(c.id).padStart(2, '0')}.jpg`)}" alt=""><div><span>${String(c.id).padStart(2, '0')} / 10 个领域</span><h3>${h(c.title)}</h3><b aria-hidden="true">↗</b></div></a>`).join('')}</div></section>
    <section class="container block"><div class="learning-contract"><p class="eyebrow">好学习，需要真实的尺度</p><h2>以优秀本科毕业生的能力为方向。</h2><p>这里是通往学科的窗口。用研习课理解核心问题，沿开放教材补齐课程，再用练习、阅读和项目检验自己。阅读进度与知识掌握分开记录，长期积累才能形成扎实判断。</p><a href="#/about">阅读内容与评价标准 ↗</a></div></section>`);
}
function explore() {
  const selected = Number(new URLSearchParams(location.hash.split('?')[1]).get('chapter')) || 0;
  layout(`<section class="container block"><p class="eyebrow">THE KNOWLEDGE ATLAS</p><h1>你的世界，从这里展开。</h1><p class="lead">按兴趣选择入口，按问题连接学科。三个阶段全部开放，可随时回看与预习。</p><label class="search-label" for="domainSearch">查找领域</label><input id="domainSearch" class="search-input" type="search" placeholder="搜索领域、概念或问题"><div class="chapter-tabs" aria-label="按篇章筛选"><a ${!selected ? 'aria-current="true"' : ''} href="#/explore">全部领域</a>${state.chapters.map(c => `<a ${selected === c.id ? 'aria-current="true"' : ''} href="#/explore?chapter=${c.id}">${h(c.title)}</a>`).join('')}</div><p id="resultCount" class="muted" role="status"></p><div id="domainGrid" class="domain-grid"></div></section>`, '知识地图', () => {
    const filter = () => {
      const q = $('#domainSearch').value.trim().toLowerCase();
      const domains = state.domains.filter(d => (!selected || d.chapterId === selected) && `${d.title}${d.summary}${d.tags.join('')}`.toLowerCase().includes(q));
      $('#resultCount').textContent = `找到 ${domains.length} 个领域`;
      $('#domainGrid').innerHTML = domains.map(card).join('') || '<p class="empty">没有找到，试试更宽泛的关键词。</p>';
      $$('#domainGrid .favorite').forEach(button => button.addEventListener('click', () => { const id = button.dataset.id; if (fav(id)) storage.remove(key('fav', id)); else storage.set(key('fav', id), '1'); button.textContent = fav(id) ? '★' : '☆'; button.setAttribute('aria-pressed', String(fav(id))); }));
    };
    $('#domainSearch').addEventListener('input', filter); filter();
  });
}
function stageNav(id, active = '') { return `<nav class="stage-nav" aria-label="领域研习阶段">${STAGES.map((s, i) => `<a ${s.key === active ? 'aria-current="step"' : ''} href="#/domain/${id}/stage/${s.key}"><span>0${i + 1}</span><b>${s.label}</b><small>${done(id, s.key) ? '已研习 ✓' : s.description}</small></a>`).join('')}</nav>`; }
function sourceCards(course) { return `<div class="sources">${course.sources.map(s => `<a href="${h(s.url)}" target="_blank" rel="noopener noreferrer"><span class="source-host">${h(new URL(s.url).hostname)}</span><h3>${h(s.title)} ↗</h3><p>${h(s.note)}</p></a>`).join('')}</div><p class="muted small">外部资料有中英文版本；可配合浏览器翻译阅读，术语与公式请对照原文。资源可能随出版机构调整。</p>`; }
function store() { return `<aside class="store-callout"><div><p class="eyebrow">延伸阅读</p><h3>让阅读延续到书页之外</h3><p>开放教材可直接阅读。需要纸质书时，可以到万物小店看看，实际库存以橱窗为准。</p><button class="button secondary qr-open">打开微信小店二维码 ↗</button></div><img src="${asset('qr/store-qr.png')}" alt="微信小店二维码" width="132" height="132" loading="lazy"></aside>`; }
async function domainPage(id, token) {
  const d = state.domains.find(d => d.id === Number(id));
  if (!d) return notFound();
  const course = await curriculum(id); if (token !== routeVersion) return;
  layout(`<section class="container block"><a class="back-link" href="#/explore?chapter=${d.chapterId}">← ${h(d.chapterTitle)}</a><p class="eyebrow">DOMAIN ${String(id).padStart(3, '0')}</p><h1>${h(d.title)}</h1><p class="lead">${h(course.question)}</p>${stageNav(id)}<div class="two-col domain-overview"><div class="panel"><h2>你将学会什么</h2>${list(course.outcomes)}</div><div class="panel"><h2>先修与投入</h2>${list(course.prerequisites)}<p class="muted">建议完整研习约 ${course.hours} 小时，含教材、练习与项目。按个人基础调整。</p></div></div><div class="domain-grid">${course.stages.map((s, i) => `<article class="panel"><p class="eyebrow">0${i + 1} · ${STAGES[i].label}</p><h2>${h(s.title)}</h2><p>${h(s.lesson[0].slice(0, 110))}…</p><a class="button secondary" href="#/domain/${id}/stage/${s.key}">进入研习 ↗</a></article>`).join('')}</div></section><section class="container block">${sectionHead('READ THE ORIGINALS', '沿着教材，继续深入')}${sourceCards(course)}${store()}</section><section class="container block">${sectionHead('MAKE CONNECTIONS', '把知识连起来')}<div class="domain-grid">${course.connections.map(id => state.domains.find(d => d.id === id)).filter(Boolean).map(card).join('')}</div></section>`, d.title);
}
function quizBlock(q, index) {
  return `<fieldset class="quiz" data-index="${index}"><legend>${index + 1}. ${h(q.question)}</legend>${q.options.map((option, i) => `<label><input type="radio" name="quiz-${index}" value="${i}"><span>${h(option)}</span></label>`).join('')}<p class="quiz-feedback" role="status"></p></fieldset>`;
}
async function stagePage(id, stageKey, token) {
  const d = state.domains.find(d => d.id === Number(id));
  if (!d) return notFound();
  const course = await curriculum(id); if (token !== routeVersion) return;
  const lesson = course.stages.find(s => s.key === stageKey); if (!lesson) return notFound();
  const index = STAGES.findIndex(s => s.key === stageKey);
  const minutes = Math.max(6, Math.ceil(JSON.stringify(lesson).length / 350));
  storage.set('wanwuzhi:last', `#/domain/${id}/stage/${stageKey}`);
  const sections = [['principle', '原理讲解'], ['concepts', '关键概念'], ['example', '一起推演'], ['practice', '练习与测验'], ['project', '项目与导师'], ['sources', '教材与笔记']];
  layout(`<div class="reading-progress" aria-hidden="true"><i id="readingProgress"></i></div><section class="container reader-heading"><a class="back-link" href="#/domain/${id}">← ${h(d.title)}</a><p class="eyebrow">${h(d.chapterTitle)} / ${STAGES[index].label}</p><h1>${h(lesson.title)}</h1><p class="lead">${h(course.question)}</p><div class="reading-tools"><span>导读约 ${minutes} 分钟 · 深入学习含教材与项目</span><button id="fontBtn" class="text-button">切换大字</button><button id="printBtn" class="text-button">打印 / 存为 PDF</button></div>${stageNav(id, stageKey)}</section><div class="container reading-layout"><aside class="toc"><p class="eyebrow">本节导航</p>${sections.map(([anchor, title], i) => `<a href="#${anchor}" data-scroll="${anchor}"><span>0${i + 1}</span>${title}</a>`).join('')}<p class="muted small">先尝试作答，再展开解析。<br>每次只需向前一步。</p></aside><article class="reader">
    <section id="principle" class="lesson-section"><p class="eyebrow">01 / UNDERSTAND</p><h2>先把原理说清楚</h2>${lesson.lesson.map(p => `<p>${h(p)}</p>`).join('')}</section>
    <section id="concepts" class="lesson-section"><p class="eyebrow">02 / CONCEPTS</p><h2>抓住关键概念</h2><dl class="concepts">${lesson.concepts.map(c => `<div><dt>${h(c.term)}</dt><dd>${h(c.explanation)}</dd></div>`).join('')}</dl></section>
    <section id="example" class="lesson-section"><p class="eyebrow">03 / WORKED EXAMPLE</p><h2>一起推演一个问题</h2><div class="example panel"><h3>${h(lesson.workedExample.question)}</h3><ol>${lesson.workedExample.reasoning.map(step => `<li>${h(step)}</li>`).join('')}</ol><p class="example-answer"><b>推演结论</b><br>${h(lesson.workedExample.answer)}</p></div>${stageKey === 'beginner' ? labMarkup(id) : ''}</section>
    <section id="practice" class="lesson-section"><p class="eyebrow">04 / RETRIEVE & APPLY</p><h2>合上讲解，试着回答</h2><h3>${h(lesson.exercise.question)}</h3><label for="practiceAnswer" class="muted small">你的推理（自动保存到当前浏览器）</label><textarea id="practiceAnswer" rows="5" placeholder="先独立写下结论、依据和不确定之处…"></textarea><details><summary>展开参考答案与评分要点</summary><p>${h(lesson.exercise.answer)}</p>${list(lesson.exercise.rubric)}</details><h3 class="quiz-title">快速自测</h3><form id="quizForm">${lesson.quiz.map(quizBlock).join('')}<button class="button primary" type="submit">检查答案</button><p id="quizSummary" role="status"></p></form></section>
    <section id="project" class="lesson-section"><p class="eyebrow">05 / BUILD SOMETHING</p><h2>${h(lesson.project.title)}</h2><p>${h(lesson.project.brief)}</p><h3>交付成果</h3>${list(lesson.project.deliverables)}<h3>评价标准</h3>${list(lesson.project.rubric)}<details><summary>与 AI 导师深入讨论</summary><p class="muted small">复制到你选择的 AI 工具使用；请对照本节来源核实回答。</p>${lesson.prompts.map(prompt => `<div class="prompt"><p>${h(prompt)}</p><button class="button secondary copy-prompt" type="button">复制导师提示</button></div>`).join('')}</details><label class="check-label"><input type="checkbox" id="projectCheck" ${storage.get(key('project', id, stageKey)) === '1' ? 'checked' : ''}> 我已按评价标准完成本节项目（自评）</label></section>
    <section id="sources" class="lesson-section"><p class="eyebrow">06 / GO DEEPER</p><h2>向真正的学科课程迈进</h2>${sourceCards(course)}<h3>学习笔记</h3><label for="noteBox" class="muted small">记录今天学到了什么、还缺哪些证据，以及下一步读什么。</label><textarea id="noteBox" rows="6" placeholder="我的理解、疑问与阅读记录…"></textarea><p id="saveStatus" class="muted small" role="status">笔记保存在当前浏览器，可在学习台导出备份。</p><div class="completion panel"><h3>记录这一小步</h3><p>研习进度、测验结果与项目自评分开记录。每次完成后，1、3、7、14 天的复习间隔逐级增加；测验后仍应检验能否独立迁移。</p><button id="completeBtn" class="button primary">${done(id, stageKey) ? '已研习 · 再次复习完成' : '标记已研习，加入复习'}</button><p id="completionStatus" role="status" class="muted small"></p></div><div class="next-links"><a href="#/domain/${id}">返回领域路径</a><a href="${index < 2 ? `#/domain/${id}/stage/${STAGES[index + 1].key}` : '#/explore'}">${index < 2 ? `下一步：${STAGES[index + 1].label}` : '探索其他领域'} →</a></div>${store()}</section></article></div>`, `${d.title} · ${STAGES[index].label}`, () => bindLesson(id, stageKey, lesson));
}
function bindLesson(id, stageKey, lesson) {
  if (stageKey === 'beginner') bindLab(id);
  $$('[data-scroll]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); document.getElementById(link.dataset.scroll)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }));
  $('#fontBtn').addEventListener('click', () => { storage.set('wanwuzhi:font', document.documentElement.dataset.font === 'large' ? 'normal' : 'large'); applyPreferences(); });
  $('#printBtn').addEventListener('click', () => window.print());
  for (const [selector, type] of [['#noteBox', 'note'], ['#practiceAnswer', 'practice']]) {
    const field = $(selector); field.value = storage.get(key(type, id, stageKey)) || '';
    field.addEventListener('input', () => { storage.set(key(type, id, stageKey), field.value); $('#saveStatus').textContent = storageFailed ? '本地保存受限，请手动复制备份。' : '已自动保存到当前浏览器'; });
  }
  $('#projectCheck').addEventListener('change', event => storage.set(key('project', id, stageKey), event.target.checked ? '1' : '0'));
  $$('.copy-prompt').forEach(button => button.addEventListener('click', async () => { try { await navigator.clipboard.writeText(button.previousElementSibling.textContent); toast('导师提示已复制'); } catch { toast('复制受限，请选中文字后手动复制'); } }));
  $('#quizForm').addEventListener('submit', event => {
    event.preventDefault();
    if (lesson.quiz.some((_, i) => !$(`input[name="quiz-${i}"]:checked`))) { toast('请先回答全部自测题'); return; }
    let correct = 0;
    lesson.quiz.forEach((q, i) => { const passed = Number($(`input[name="quiz-${i}"]:checked`).value) === q.correct; if (passed) correct++; const result = $(`.quiz[data-index="${i}"] .quiz-feedback`); result.textContent = `${passed ? '✓ 正确' : '再想一想'}。正确选项：${q.options[q.correct]}。${q.explanation}`; result.className = `quiz-feedback ${passed ? 'correct' : 'incorrect'}`; });
    storage.set(key('quiz', id, stageKey), JSON.stringify({ correct, total: lesson.quiz.length, at: Date.now(), version: VERSION }));
    $('#quizSummary').textContent = `本次答对 ${correct}/${lesson.quiz.length}。${correct === lesson.quiz.length ? '尝试换一个情境解释原理，再完成项目。' : '回到讲解，找出推理差异后重试。'}`;
  });
  $('#completeBtn').addEventListener('click', () => {
    storage.set(key('progress', id, stageKey), 'done');
    const old = getRecord(id, stageKey);
    const interval = [1, 3, 7, 14, 30][Math.min(old?.round || 0, 4)];
    const record = { round: (old?.round || 0) + 1, last: Date.now(), due: Date.now() + interval * 86400000 };
    storage.set(key('review', id, stageKey), JSON.stringify(record));
    $('#completeBtn').textContent = '已记录本次研习'; $('#completeBtn').disabled = true;
    $('#completionStatus').textContent = `下次复习：${new Date(record.due).toLocaleDateString('zh-CN')}。可在学习台查看。`;
    toast('进度已保存，下一次复习见');
  });
  const updateProgress = () => { const span = document.documentElement.scrollHeight - innerHeight; $('#readingProgress')?.style.setProperty('width', `${span > 0 ? Math.min(100, scrollY / span * 100) : 100}%`); };
  window.addEventListener('scroll', updateProgress, { passive: true }); updateProgress();
  cleanup = () => window.removeEventListener('scroll', updateProgress);
}
const PATHS = [
  { title: '判断与证据', description: '先学会怎样知道，再讨论知道什么。', ids: [3, 82, 55, 63, 98] },
  { title: '理解人和社会', description: '从个人心理，走向历史与制度。', ids: [1, 2, 11, 21, 22, 94] },
  { title: '经济与组织', description: '从稀缺和选择，理解市场与商业。', ids: [31, 32, 33, 41, 45, 49] },
  { title: '自然与数字世界', description: '用模型、实验和计算理解机制。', ids: [55, 51, 52, 53, 54, 61, 62] },
  { title: '表达与日常生活', description: '让理解变成创作与生活的能力。', ids: [81, 71, 73, 79, 83, 91] }
];
function roadmap() {
  layout(`<section class="container block"><p class="eyebrow">LEARN WITH INTENTION</p><h1>学习不是收集，<br>是一步步建立理解。</h1><p class="lead">先选一条主线，每周留出 3–5 小时。建议读原理、做闭卷回忆、完成练习，再读教材，最后做项目。以下是起步顺序，可按先修能力调整。</p><div class="path-grid">${PATHS.map((p, i) => `<article class="path panel"><p class="eyebrow">PATH 0${i + 1}</p><h2>${p.title}</h2><p>${p.description}</p><ol>${p.ids.map(id => `<li><a href="#/domain/${id}">${h(state.domains.find(d => d.id === id).title)} ↗</a></li>`).join('')}</ol></article>`).join('')}</div><div class="learning-contract"><h2>怎样检验本科阶段的能力？</h2><p>逐步完成对应大学教材与课程习题，写出可复核的推导或证据链，比较竞争性解释，并完成受评价的综合项目。本站导读、自测和自评不构成学位、专业资格或能力认证。</p><ol><li>基础：能不看资料解释概念，并给出反例。</li><li>进阶：能用方法解决新问题，注明假设与限制。</li><li>综合：能检索原始资料，完成项目，并根据反馈修订。</li></ol></div></section>`, '学习路径');
}
function download(filename, content, type = 'application/json') { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function dashboard() {
  const progress = state.domains.flatMap(d => STAGES.map(s => ({ d, s, read: done(d.id, s.key), review: getRecord(d.id, s.key) })));
  const completed = progress.filter(p => p.read);
  const due = progress.filter(p => p.review && p.review.due <= Date.now());
  const favorites = state.domains.filter(d => fav(d.id));
  layout(`<section class="container block"><p class="eyebrow">YOUR LEARNING DESK</p><h1>把每次理解，留在这里。</h1><p class="lead">记录保存在当前浏览器。电脑与手机可通过导出、导入备份接续学习。</p><div class="metrics"><div><b>${completed.length}<small>/300</small></b><span>已研习阶段</span></div><div><b>${due.length}</b><span>今天可复习</span></div><div><b>${favorites.length}</b><span>收藏领域</span></div><div><b>${progress.filter(p => storage.get(key('project', p.d.id, p.s.key)) === '1').length}</b><span>项目自评完成</span></div></div><div class="actions"><button id="exportBtn" class="button secondary">导出学习备份</button><label class="button secondary" for="importFile">导入学习备份</label><input id="importFile" type="file" accept="application/json,.json" hidden><button id="notesExport" class="button secondary">导出笔记文本</button></div><p id="importStatus" role="status" class="muted small"></p></section>
    <section class="container block">${sectionHead('SPACED PRACTICE', '复习，让理解留下来')}<div class="review-list">${due.length ? due.map(p => `<a class="review-item" href="#/domain/${p.d.id}/stage/${p.s.key}"><div><b>${h(p.d.title)}</b><span>${p.s.label} · 第 ${p.review.round} 次研习后复习</span></div><span>现在回忆 →</span></a>`).join('') : '<p class="empty">今天没有到期复习。完成一节研习后，会自动安排下一次回顾。</p>'}</div></section>
    <section class="container block">${sectionHead('YOUR COLLECTION', '好奇心的书签')}<div class="domain-grid">${favorites.length ? favorites.map(card).join('') : '<p class="empty">在知识地图点击 ☆，把感兴趣的领域留在这里。</p>'}</div></section>
    <section class="container block">${sectionHead('LEARNING RECORD', '最近的学习记录')}<div class="review-list">${completed.sort((a, b) => (b.review?.last || 0) - (a.review?.last || 0)).slice(0, 30).map(p => { let q; try { q = JSON.parse(storage.get(key('quiz', p.d.id, p.s.key))); } catch {} return `<a class="review-item" href="#/domain/${p.d.id}/stage/${p.s.key}"><div><b>${h(p.d.title)} · ${p.s.label}</b><span>${q ? `最近自测 ${h(q.correct)}/${h(q.total)}` : '尚无新版自测记录'} · ${p.review ? `下次复习 ${new Date(p.review.due).toLocaleDateString('zh-CN')}` : '旧版阅读记录'}</span></div><span>继续 →</span></a>`; }).join('') || '<p class="empty">从一个领域开始，你的记录会出现在这里。</p>'}</div></section>`, '学习台', bindDashboard);
}
function validBackupKey(k) { return /^wanwuzhi:(progress|note|practice|quiz|project|review):([1-9]\d?|100):(beginner|intermediate|advanced)$/.test(k) || /^wanwuzhi:fav:([1-9]\d?|100)$/.test(k); }
function validBackupValue(k, value) {
  if (/:progress:/.test(k)) return value === 'done';
  if (/:(fav|project):/.test(k)) return value === '1' || value === '0';
  if (/:quiz:/.test(k)) { try { const q = JSON.parse(value); return q && Number.isInteger(q.correct) && Number.isInteger(q.total) && q.correct >= 0 && q.correct <= q.total && q.total > 0 && q.total < 100; } catch { return false; } }
  if (/:review:/.test(k)) { try { const r = JSON.parse(value); return r && Number.isInteger(r.round) && r.round > 0 && r.round < 10000 && Number.isFinite(r.last) && Number.isFinite(r.due) && r.last > 0 && r.due > 0 && r.due < 8e15; } catch { return false; } }
  return true;
}
function bindDashboard() {
  const importLabel = document.querySelector('label[for="importFile"]');
  importLabel.tabIndex = 0;
  importLabel.setAttribute('role', 'button');
  importLabel.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); $('#importFile').click(); } });
  const records = () => { const data = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (validBackupKey(k)) data[k] = storage.get(k); } } catch { memory.forEach((v, k) => { if (validBackupKey(k)) data[k] = v; }); } return data; };
  $('#exportBtn').addEventListener('click', () => download('世间万物-学习备份.json', JSON.stringify({ format: 'wanwuzhi-backup-v1', exportedAt: new Date().toISOString(), data: records() }, null, 2)));
  $('#notesExport').addEventListener('click', () => { const notes = Object.entries(records()).filter(([k]) => /:(note|practice):/.test(k)); download('世间万物-学习笔记.txt', notes.map(([k, v]) => { const [, type, id, s] = k.split(':'); return `${state.domains.find(d => d.id === Number(id)).title} / ${STAGES.find(stage => stage.key === s).label} / ${type === 'note' ? '笔记' : '练习'}\n${v}`; }).join('\n\n──────────\n\n'), 'text/plain;charset=utf-8'); });
  $('#importFile').addEventListener('change', async event => {
    try {
      const file = event.target.files[0]; if (!file) return;
      if (file.size > 5 * 1024 * 1024) throw new Error('备份文件须小于 5 MB。');
      const backup = JSON.parse(await file.text());
      if (backup.format !== 'wanwuzhi-backup-v1' || !backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) throw new Error('无法识别的备份格式。');
      const entries = Object.entries(backup.data);
      if (entries.some(([k, v]) => !validBackupKey(k) || typeof v !== 'string' || v.length > 100000 || !validBackupValue(k, v))) throw new Error('备份含不支持的数据。');
      // Preserve existing entries; import can be safely repeated without destroying local work.
      let imported = 0;
      for (const [k, v] of entries) if (storage.get(k) === null) { storage.set(k, v); imported++; }
      dashboard(); $('#importStatus').textContent = `已导入 ${imported} 条新记录；本机已有记录已保留。`;
    } catch (error) { $('#importStatus').textContent = error.message; }
  });
}
async function search(token) {
  state.index ||= await json('data/curriculum-index.json'); if (token !== routeVersion) return;
  layout(`<section class="container block"><p class="eyebrow">FOLLOW A QUESTION</p><h1>找到问题背后的知识。</h1><label class="search-label" for="globalSearch">全文搜索：概念、讲解、算例和练习</label><input class="search-input" id="globalSearch" type="search" placeholder="试试：机会成本、熵、证据、构图"><p id="searchCount" role="status" class="muted"></p><div id="searchResults" class="review-list"></div></section>`, '搜索', () => {
    const input = $('#globalSearch');
    const run = () => { const q = input.value.trim().toLowerCase(); const words = q.split(/\s+/).filter(Boolean); const items = words.length ? state.index.filter(item => words.every(word => `${item.title} ${item.text}`.toLowerCase().includes(word))) : []; $('#searchCount').textContent = q ? `找到 ${items.length} 节研习${items.length > 60 ? '，显示前 60 项' : ''}` : '输入一个概念，追踪它在不同领域中的联系。'; $('#searchResults').innerHTML = items.slice(0, 60).map(item => { const d = state.domains.find(d => d.id === item.domainId); const pos = item.text.toLowerCase().indexOf(words[0]); const excerpt = item.text.slice(Math.max(0, pos - 35), Math.max(0, pos - 35) + 160); return `<a class="search-result" href="#/domain/${item.domainId}/stage/${item.stageKey}"><span class="eyebrow">${h(d.title)} · ${STAGES.find(s => s.key === item.stageKey).label}</span><h2>${h(item.title)} ↗</h2><p>${h(excerpt)}…</p></a>`; }).join('') || (q ? '<p class="empty">未找到匹配内容，试试更短的关键词。</p>' : ''); };
    input.value = new URLSearchParams(location.hash.split('?')[1]).get('q') || ''; input.addEventListener('input', run); run();
  });
}
function about() {
  layout(`<section class="container block narrow"><p class="eyebrow">OUR LEARNING STANDARD</p><h1>让每一次学习，<br>经得起追问。</h1><h2>内容是什么</h2><p>100 个领域按入门、进阶、综合研习组织，提供原创导读、概念辨析、具体推演、带参考答案的练习、自测和项目。课程中的教学情境与数值案例用于练习，不视为实际研究数据。外部教材与大学课程是继续深入的主要材料。</p><h2>本科水平怎样实现</h2><p>优秀本科毕业生的能力需要系统课程、长时间练习、项目与有质量的反馈。本站提供路径与起点；阶段完成、单题自测和项目自评记录学习活动，不证明已经达到该学科毕业标准。</p><h2>来源与不确定性</h2><p>优先链接大学公开课、开放教材、学术百科和公共机构原始资源。资料多为英文，使用翻译时应核对术语、年代和公式。区分可观察事实、模型假设、理论解释与价值判断；历史与哲学的争议保留竞争性解释。本站导读由 AI 辅助编写，已作结构与内容抽检，尚未经各领域专家逐篇同行评审。</p><h2>如何使用 AI 导师</h2><p>每节课附有可复制的导师提示。要求导师一次提一个问题，先等待你的解释，再指出推理缺口，核对来源并明确未知。本站不内置在线 AI，不要求 API 密钥，也不会自动发送笔记。</p><h2>生活中的专业问题</h2><p>医学、法律、金融等内容用于一般知识学习。涉及个人治疗、合同、权益或投资决定，应结合所在地现行规则与合格专业人员的意见。</p><h2>记录与隐私</h2><p>笔记、练习、收藏和进度保存在浏览器本地，无账户与云同步。导出备份可跨设备导入；导入只补充尚不存在的记录。清理浏览器数据前请导出备份。</p><h2>开放阅读与小店</h2><p>教材入口与商业购买分开。保留原有微信小店二维码，商品与价格以橱窗为准。旧版未经核实的占位书名和 ISBN 不再作为推荐展示。</p><a class="button primary" href="#/explore">开始探索 ↗</a></section>`, '内容标准');
}
function notFound() { layout('<section class="container block"><h1>这个入口还没有知识。</h1><p>请回到知识地图选择领域。</p><a class="button primary" href="#/explore">返回知识地图</a></section>', '页面不存在'); }
async function router() {
  const token = ++routeVersion;
  cleanup(); cleanup = () => {};
  try {
    if (!state.domains.length) [state.domains, state.chapters] = await Promise.all([json('data/domains.json'), json('data/chapters.json')]);
    if (token !== routeVersion) return;
    window.scrollTo(0, 0);
    const route = location.hash.split('?')[0] || '#/';
    let match;
    if (route === '#/' || route === '#') home();
    else if (route === '#/explore') explore();
    else if (route === '#/roadmap' || route === '#/learning-path') roadmap();
    else if (route === '#/dashboard' || route === '#/my-learning') dashboard();
    else if (route === '#/search') await search(token);
    else if (route === '#/about' || route === '#/admin') about();
    else if ((match = route.match(/^#\/domain\/(\d+)$/))) await domainPage(match[1], token);
    else if ((match = route.match(/^#\/domain\/(\d+)\/stage\/(beginner|intermediate|advanced)$/))) await stagePage(match[1], match[2], token);
    else notFound();
  } catch (error) { if (token === routeVersion) layout(`<section class="container block"><h1>暂时无法打开资料</h1><p>${h(error.message)}</p><button class="button primary" id="retry">重新加载</button></section>`, '加载失败', () => $('#retry').addEventListener('click', router)); }
}
window.addEventListener('hashchange', router);
applyPreferences();
router();
