
const BASE = '/wanwuzhi';
const SITE_VERSION = '2026-05-27-100';
const STAGES = [
  { key: 'beginner', label: '入门阶段' },
  { key: 'intermediate', label: '进阶阶段' },
  { key: 'advanced', label: '专家阶段' }
];
const state = { chapters: [], domains: [], books: [], searchIndex: [], stageCache: new Map() };
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const app = $('#app');
const asset = (p) => BASE + p;
function h(str) { return String(str ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
async function getJson(url) { const res = await fetch(asset(url) + '?v=' + SITE_VERSION, { cache: 'no-store' }); if (!res.ok) throw new Error(url + ' ' + res.status); return res.json(); }
async function loadCore() {
  if (state.domains.length) return;
  const [chapters, domains, books] = await Promise.all([getJson('/data/chapters.json'), getJson('/data/domains.json'), getJson('/data/books.json')]);
  state.chapters = chapters; state.domains = domains; state.books = books;
}
async function loadStage(domainId, stageKey) {
  const cacheKey = domainId + ':' + stageKey;
  if (state.stageCache.has(cacheKey)) return state.stageCache.get(cacheKey);
  const content = await getJson('/content/' + domainId + '/' + stageKey + '.json');
  const domain = state.domains.find(d => d.id === Number(domainId));
  if (!domain || content.domainId !== domain.id || content.domainTitle !== domain.title || content.stageKey !== stageKey) {
    throw new Error('学习内容与领域元数据不一致：' + cacheKey);
  }
  state.stageCache.set(cacheKey, content);
  return content;
}
function progressKey(id, stage) { return 'wanwuzhi:progress:' + id + ':' + stage; }
function favKey(id) { return 'wanwuzhi:fav:' + id; }
function noteKey(id, stage) { return 'wanwuzhi:note:' + id + ':' + stage; }
function isDone(id, stage) { return localStorage.getItem(progressKey(id, stage)) === 'done'; }
function isFav(id) { return localStorage.getItem(favKey(id)) === '1'; }
function nav() {
  return '<header class="topbar"><a class="brand" href="#/"><span class="brand-mark">万</span><span><b>世间万物</b><small>Wanwuzhi</small></span></a><nav><a href="#/explore">探索</a><a href="#/roadmap">路径</a><a href="#/search">搜索</a><a href="#/dashboard">学习台</a><a href="#/admin">管理</a></nav></header>';
}
function layout(inner) { app.innerHTML = nav() + '<main>' + inner + '</main><footer>探索知识的边界，从入门到精通 · 微信视频号橱窗二维码购买闭环已接入</footer><div id="toast"></div>'; bindGlobal(); }
function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1500); }
function bindGlobal() {
  $$('.qr-open').forEach(btn => btn.addEventListener('click', () => showQr(btn.dataset.title || '微信视频号橱窗')));
}
function showQr(title) {
  const old = $('.modal'); if (old) old.remove();
  const modal = document.createElement('div'); modal.className = 'modal';
  modal.innerHTML = '<div class="modal-panel"><button class="icon close" aria-label="关闭">×</button><h2>' + h(title) + '</h2><img src="' + asset('/qr/store-qr.png') + '" alt="微信视频号橱窗二维码"><p>扫码进入微信视频号带货橱窗，完成对应书籍购买。</p></div>';
  modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('close')) modal.remove(); });
  document.body.appendChild(modal);
}
function heroStats() {
  const done = STAGES.flatMap(s => state.domains.map(d => isDone(d.id, s.key))).filter(Boolean).length;
  return '<div class="stats"><span><b>10</b>篇章</span><span><b>100</b>领域</span><span><b>300</b>阶段内容</span><span><b>' + done + '</b>已完成</span></div>';
}
async function renderHome() {
  await loadCore();
  layout('<section class="hero"><div><p class="eyebrow">Wanwuzhi Knowledge Atlas</p><h1>世间万物</h1><p class="lead">探索知识的边界，从入门到精通。以10大篇章统摄100个知识领域，每个领域提供入门、进阶、专家三阶段学习内容，并连接书籍购买二维码。</p><div class="actions"><a class="primary" href="#/explore">开始探索</a><a class="secondary" href="#/search">搜索知识</a></div>' + heroStats() + '</div><img src="' + asset('/hero-bg.png') + '" alt="世间万物知识探索"></section><section class="chapter-band">' + state.chapters.map(c => '<a href="#/explore?chapter=' + c.id + '"><small>' + c.number + '</small><strong>' + h(c.title) + '</strong><span>10个领域</span></a>').join('') + '</section>');
}
function domainCard(d) {
  const completed = STAGES.filter(s => isDone(d.id, s.key)).length;
  return '<article class="domain-card"><button class="fav" data-id="' + d.id + '" aria-label="收藏">' + (isFav(d.id) ? '★' : '☆') + '</button><small>' + h(d.chapterTitle) + '</small><h3>' + h(d.title) + '</h3><p>' + h(d.summary) + '</p><div class="mini-progress"><i style="width:' + (completed / 3 * 100) + '%"></i></div><div class="card-actions"><a href="#/domain/' + d.id + '">详情</a><a href="#/domain/' + d.id + '/stage/beginner">学习</a></div></article>';
}
async function renderExplore() {
  await loadCore();
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const chapter = Number(params.get('chapter') || 0);
  const filtered = chapter ? state.domains.filter(d => d.chapterId === chapter) : state.domains;
  layout('<section class="page-head"><p class="eyebrow">Explore</p><h1>100个知识领域</h1><p>按篇章筛选，或直接搜索领域标题、篇章与关键词。</p></section><section class="tools"><input id="domainSearch" placeholder="搜索领域，如 哲学、人工智能、宇宙观"/><div class="tabs"><a class="' + (!chapter ? 'active' : '') + '" href="#/explore">全部</a>' + state.chapters.map(c => '<a class="' + (chapter === c.id ? 'active' : '') + '" href="#/explore?chapter=' + c.id + '">' + c.id + '</a>').join('') + '</div></section><section id="domainGrid" class="domain-grid">' + filtered.map(domainCard).join('') + '</section>');
  $('#domainSearch').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    const list = filtered.filter(d => (d.title + d.chapterTitle + d.summary + d.tags.join('')).toLowerCase().includes(q));
    $('#domainGrid').innerHTML = list.map(domainCard).join('') || '<p class="empty">没有匹配结果</p>';
    bindExploreButtons();
  });
  bindExploreButtons();
}
function bindExploreButtons() {
  $$('.fav').forEach(btn => btn.addEventListener('click', () => { const id = btn.dataset.id; const next = localStorage.getItem(favKey(id)) === '1' ? '0' : '1'; if (next === '1') localStorage.setItem(favKey(id), '1'); else localStorage.removeItem(favKey(id)); btn.textContent = next === '1' ? '★' : '☆'; toast(next === '1' ? '已收藏' : '已取消收藏'); }));
}
async function renderDomain(id) {
  await loadCore();
  const d = state.domains.find(x => x.id === Number(id));
  if (!d) return render404();
  const books = state.books.filter(b => b.domainId === d.id).slice(0, 6);
  layout('<section class="page-head domain-head"><p class="eyebrow">' + h(d.chapterTitle) + '</p><h1>' + h(d.title) + '</h1><p>' + h(d.summary) + '</p></section><section class="stage-grid">' + STAGES.map(s => '<article class="stage-card"><small>' + (isDone(d.id, s.key) ? '已完成' : '待学习') + '</small><h2>' + s.label + '</h2><p>' + (s.key === 'beginner' ? '建立基础概念与问题意识。' : s.key === 'intermediate' ? '拆解机制、案例与方法。' : '形成综合判断与作品输出。') + '</p><a href="#/domain/' + d.id + '/stage/' + s.key + '">进入' + s.label + '</a></article>').join('') + '</section><section class="split"><div><h2>学习目标</h2><ul>' + d.objectives.map(o => '<li>' + h(o) + '</li>').join('') + '</ul></div><div class="store"><h2>书籍购买</h2><p>所有推荐书通过统一微信视频号带货橱窗二维码进入购买。</p><button class="primary qr-open" data-title="' + h(d.title) + ' 推荐书单">显示二维码</button></div></section><section><h2>推荐书单预览</h2><div class="book-grid">' + books.map(bookCard).join('') + '</div></section>');
}
function bookCard(b) { return '<article class="book-card"><small>' + h(b.coverHint) + '</small><h3>' + h(b.title) + '</h3><p>' + h(b.reason) + '</p><button class="qr-open" data-title="' + h(b.title) + '">扫码购买</button></article>'; }
async function renderStage(id, stageKey) {
  await loadCore();
  const d = state.domains.find(x => x.id === Number(id));
  const stage = STAGES.find(s => s.key === stageKey);
  if (!d || !stage) return render404();
  let c;
  try { c = await loadStage(id, stageKey); } catch (err) { layout('<section class="page-head"><h1>内容校验失败</h1><p>' + h(err.message) + '</p></section>'); return; }
  const books = c.recommendedBooks.map(id => state.books.find(b => b.id === id)).filter(Boolean);
  const currentIndex = STAGES.findIndex(s => s.key === stageKey);
  const prev = currentIndex > 0 ? STAGES[currentIndex - 1] : null;
  const next = currentIndex < 2 ? STAGES[currentIndex + 1] : null;
  layout('<section class="page-head stage-head"><p class="eyebrow">' + h(c.chapterTitle) + '</p><h1>' + h(c.domainTitle) + ' · ' + h(c.stageLabel) + '</h1><p>' + h(c.intro) + '</p><div class="actions"><button id="completeBtn" class="primary">' + (isDone(d.id, stageKey) ? '已完成，点击取消' : '标记完成') + '</button><button class="secondary qr-open" data-title="' + h(c.domainTitle) + ' ' + h(c.stageLabel) + '书单">书籍二维码</button></div></section><section class="split"><div><h2>学习目标</h2><ul>' + c.learningGoals.map(x => '<li>' + h(x) + '</li>').join('') + '</ul></div><div><h2>阶段信息</h2><p>适合对象：' + h(c.stageAudience) + '</p><p>难度：' + h(c.difficulty) + '</p></div></section><section><h2>学习内容清单</h2><div class="module-list">' + c.modules.map((m, i) => moduleBlock(m, i)).join('') + '</div></section><section><h2>练习巩固</h2><div class="exercise-list">' + c.exercises.map(exerciseBlock).join('') + '</div></section><section class="split"><div><h2>学习笔记</h2><textarea id="noteBox" placeholder="记录你的理解、疑问和行动计划"></textarea></div><div><h2>推荐书单</h2><div class="book-grid compact">' + books.map(bookCard).join('') + '</div></div></section><section class="stage-nav">' + (prev ? '<a href="#/domain/' + d.id + '/stage/' + prev.key + '">← ' + prev.label + '</a>' : '<a href="#/domain/' + d.id + '">← 返回领域</a>') + (next ? '<a href="#/domain/' + d.id + '/stage/' + next.key + '">' + next.label + ' →</a>' : '<a href="#/explore">继续探索 →</a>') + '</section>');
  $('#completeBtn').addEventListener('click', () => { if (isDone(d.id, stageKey)) { localStorage.removeItem(progressKey(d.id, stageKey)); toast('已取消完成'); } else { localStorage.setItem(progressKey(d.id, stageKey), 'done'); toast('学习进度已保存'); } renderStage(id, stageKey); });
  const note = $('#noteBox'); note.value = localStorage.getItem(noteKey(d.id, stageKey)) || ''; note.addEventListener('input', () => localStorage.setItem(noteKey(d.id, stageKey), note.value));
  $$('.answer-toggle').forEach(btn => btn.addEventListener('click', () => btn.nextElementSibling.classList.toggle('show')));
}
function moduleBlock(m, i) { return '<details class="module" ' + (i === 0 ? 'open' : '') + '><summary><span>' + String(i + 1).padStart(2, '0') + '</span><strong>' + h(m.title) + '</strong><small>' + h(m.focus) + ' · ' + m.estimatedMinutes + '分钟</small></summary><ul>' + m.keyPoints.map(k => '<li>' + h(k) + '</li>').join('') + '</ul><p><b>实践：</b>' + h(m.practice) + '</p><div class="checks">' + m.checklist.map(x => '<label><input type="checkbox"> ' + h(x) + '</label>').join('') + '</div></details>'; }
function exerciseBlock(e) { return '<article class="exercise"><small>' + h(e.type) + '</small><h3>' + h(e.question) + '</h3>' + (e.options ? '<div class="options">' + e.options.map(o => '<button>' + h(o) + '</button>').join('') + '</div>' : '') + '<button class="answer-toggle">查看参考答案</button><p class="answer">' + h(e.answer) + (e.explanation ? '<br>' + h(e.explanation) : '') + '</p></article>'; }
async function renderRoadmap() {
  await loadCore();
  layout('<section class="page-head"><p class="eyebrow">Roadmap</p><h1>从入门到精通的学习路径</h1><p>每个领域遵循三阶段学习，跨领域按篇章形成长期知识地图。</p></section><section class="roadmap">' + ['选择篇章','完成入门','进入进阶','挑战专家','形成作品'].map((x,i) => '<article><span>' + (i+1) + '</span><h2>' + x + '</h2><p>' + ['先确定兴趣或问题所在的篇章。','建立概念框架和关键术语。','分析机制、案例和工具。','进行批判评估与综合应用。','沉淀笔记、书单或主题作品。'][i] + '</p></article>').join('') + '</section><section class="chapter-band">' + state.chapters.map(c => '<a href="#/explore?chapter=' + c.id + '"><small>' + c.number + '</small><strong>' + h(c.title) + '</strong><span>10个领域</span></a>').join('') + '</section>');
}
async function renderDashboard() {
  await loadCore();
  const done = STAGES.flatMap(s => state.domains.map(d => isDone(d.id, s.key))).filter(Boolean).length;
  const favs = state.domains.filter(d => isFav(d.id));
  const pct = Math.round(done / 300 * 100);
  layout('<section class="page-head"><p class="eyebrow">Dashboard</p><h1>我的学习台</h1><p>进度、收藏和继续学习入口保存在本机浏览器中。</p></section><section class="dashboard"><div class="ring" style="--p:' + pct + '"><b>' + pct + '%</b><span>' + done + '/300</span></div><div><h2>学习徽章</h2><div class="badges"><span>启程者</span><span>' + (done >= 10 ? '十阶学习者' : '待解锁') + '</span><span>' + (done >= 100 ? '百域探索者' : '待解锁') + '</span></div><h2>我的收藏</h2><div class="domain-grid small">' + (favs.length ? favs.map(domainCard).join('') : '<p class="empty">尚未收藏领域</p>') + '</div></div></section>'); bindExploreButtons();
}
async function renderSearch() {
  await loadCore();
  if (!state.searchIndex.length) state.searchIndex = await getJson('/content/search-index.json');
  layout('<section class="page-head"><p class="eyebrow">Search</p><h1>搜索知识内容</h1><p>检索300份阶段内容中的模块标题、摘要、领域与篇章。</p></section><section class="tools"><input id="globalSearch" autofocus placeholder="输入关键词，如 哲学、宇宙、创业、AI"/></section><section id="searchResults" class="results"></section>');
  const box = $('#globalSearch'), results = $('#searchResults');
  const run = () => { const q = box.value.trim().toLowerCase(); if (!q) { results.innerHTML = '<p class="empty">请输入关键词开始搜索</p>'; return; } const list = state.searchIndex.filter(x => (x.title + x.excerpt + x.domainTitle + x.chapterTitle).toLowerCase().includes(q)).slice(0, 60); results.innerHTML = list.map(x => '<a class="result" href="' + x.url + '"><small>' + h(x.chapterTitle) + ' / ' + h(x.stageLabel) + '</small><strong>' + h(x.title) + '</strong><p>' + h(x.excerpt) + '</p></a>').join('') || '<p class="empty">没有匹配结果</p>'; };
  box.addEventListener('input', run); run();
}
async function renderAdmin() {
  await loadCore();
  const authed = sessionStorage.getItem('wanwuzhi:admin') === '1';
  if (!authed) { layout('<section class="admin-login"><h1>内容管理入口</h1><input id="adminPwd" type="password" placeholder="输入管理密码"><button class="primary" id="loginBtn">进入</button><p>管理密码用于本地演示：wanwuzhi2024</p></section>'); $('#loginBtn').addEventListener('click', () => { if ($('#adminPwd').value === 'wanwuzhi2024') { sessionStorage.setItem('wanwuzhi:admin', '1'); renderAdmin(); } else toast('密码错误'); }); return; }
  layout('<section class="page-head"><p class="eyebrow">Admin</p><h1>内容完整性总览</h1><p>当前版本：100个领域、300份阶段内容、900条书籍推荐、600条搜索索引。</p></section><section class="admin-table"><table><thead><tr><th>ID</th><th>领域</th><th>篇章</th><th>阶段</th></tr></thead><tbody>' + state.domains.map(d => '<tr><td>' + d.id + '</td><td>' + h(d.title) + '</td><td>' + h(d.chapterTitle) + '</td><td>入门 / 进阶 / 专家</td></tr>').join('') + '</tbody></table></section>');
}
function render404() { layout('<section class="page-head"><h1>页面不存在</h1><p>请返回探索页重新选择领域。</p><a class="primary" href="#/explore">返回探索</a></section>'); }
async function router() {
  try {
    const hash = location.hash || '#/';
    const clean = hash.split('?')[0];
    let m;
    if (clean === '#/' || clean === '#') return renderHome();
    if (clean === '#/explore') return renderExplore();
    if (clean === '#/roadmap') return renderRoadmap();
    if (clean === '#/dashboard') return renderDashboard();
    if (clean === '#/search') return renderSearch();
    if (clean === '#/admin') return renderAdmin();
    if ((m = clean.match(/^#\/domain\/(\d+)$/))) return renderDomain(m[1]);
    if ((m = clean.match(/^#\/domain\/(\d+)\/stage\/(beginner|intermediate|advanced)$/))) return renderStage(m[1], m[2]);
    return render404();
  } catch (err) { console.error(err); layout('<section class="page-head"><h1>加载失败</h1><p>' + h(err.message) + '</p></section>'); }
}
window.addEventListener('hashchange', router);
router();
