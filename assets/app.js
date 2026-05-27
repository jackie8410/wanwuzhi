const scriptUrl = new URL(import.meta.url);
const BASE_PATH = scriptUrl.pathname.replace(/\/assets\/app\.js.*$/, '').replace(/\/$/, '');
const SITE_VERSION = '2026-05-27-201';

const STAGES = [
  { key: 'beginner', label: '入门阶段', short: '入门', icon: '🚀', promise: '先建立概念边界，把陌生知识讲成人话。' },
  { key: 'intermediate', label: '进阶阶段', short: '进阶', icon: '🧠', promise: '拆解机制、案例和方法，开始能解释真实问题。' },
  { key: 'advanced', label: '专家阶段', short: '专家', icon: '👑', promise: '形成独立判断，输出自己的知识作品。' }
];

const STAGE_BY_KEY = Object.fromEntries(STAGES.map((stage) => [stage.key, stage]));
const STAGE_LABEL_TO_KEY = {
  入门阶段: 'beginner',
  进阶阶段: 'intermediate',
  专家阶段: 'advanced'
};

const state = {
  chapters: [],
  domains: [],
  books: [],
  searchIndex: [],
  stageCache: new Map(),
  corePromise: null,
  booksError: null
};

const app = document.querySelector('#app');
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function asset(path = '') {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  const clean = String(path || '')
    .replace(/^\/wanwuzhi\//, '/')
    .replace(/^\.\//, '/');
  if (!clean) return BASE_PATH || '/';
  return `${BASE_PATH}${clean.startsWith('/') ? clean : `/${clean}`}`;
}

function cacheBusted(path) {
  return `${asset(path)}?v=${encodeURIComponent(SITE_VERSION)}`;
}

function h(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

async function getJson(path) {
  const response = await fetch(cacheBusted(path), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path} 加载失败：${response.status}`);
  return response.json();
}

async function loadCore() {
  if (state.corePromise) return state.corePromise;
  state.corePromise = Promise.all([
    getJson('/data/chapters.json'),
    getJson('/data/domains.json'),
    getJson('/data/books.json').catch((error) => {
      state.booksError = error;
      return [];
    })
  ]).then(([chapters, domains, books]) => {
    state.chapters = chapters;
    state.domains = domains;
    state.books = books.map(normalizeBook);
  });
  return state.corePromise;
}

async function loadStage(domainId, stageKey) {
  const cacheKey = `${domainId}:${stageKey}`;
  if (state.stageCache.has(cacheKey)) return state.stageCache.get(cacheKey);

  const content = await getJson(`/content/${domainId}/${stageKey}.json`);
  const domain = state.domains.find((item) => item.id === Number(domainId));
  if (!domain || content.domainId !== domain.id || content.domainTitle !== domain.title || content.stageKey !== stageKey) {
    throw new Error(`学习内容与领域元数据不一致：${cacheKey}`);
  }

  state.stageCache.set(cacheKey, content);
  return content;
}

function normalizeBook(book) {
  const domain = state.domains.find((item) => item.id === Number(book.domainId));
  const stageKey = book.stageKey || STAGE_LABEL_TO_KEY[book.LearningStage] || '';
  const stage = STAGE_BY_KEY[stageKey];
  const purchaseType = book.purchaseType === 'store_qrcode' ? 'qrcode' : (book.purchaseType || '');

  return {
    ...book,
    ID: book.ID || book.id || `book-${book.domainId || 'x'}-${stageKey || 'stage'}`,
    ExplorationDomain: book.ExplorationDomain || domain?.title || book.domainTitle || '',
    LearningStage: book.LearningStage || stage?.label || book.stageLabel || '',
    title: book.title || '未命名书籍',
    author: book.author || '作者待补充',
    description: book.description || book.reason || book.coverHint || '这本书适合作为本阶段学习的延伸阅读。',
    purchaseType,
    purchaseUrl: book.purchaseUrl || '',
    purchaseQrCode: book.purchaseQrCode || '/qr/store-qr.png'
  };
}

function progressKey(domainId, stageKey) {
  return `wanwuzhi:progress:${domainId}:${stageKey}`;
}

function noteKey(domainId, stageKey) {
  return `wanwuzhi:note:${domainId}:${stageKey}`;
}

function favKey(domainId) {
  return `wanwuzhi:fav:${domainId}`;
}

function isDone(domainId, stageKey) {
  return localStorage.getItem(progressKey(domainId, stageKey)) === 'done';
}

function setDone(domainId, stageKey, done) {
  if (done) localStorage.setItem(progressKey(domainId, stageKey), 'done');
  else localStorage.removeItem(progressKey(domainId, stageKey));
}

function isFav(domainId) {
  return localStorage.getItem(favKey(domainId)) === '1';
}

function isStageUnlocked(domainId, stageKey) {
  if (stageKey === 'beginner') return true;
  if (stageKey === 'intermediate') return isDone(domainId, 'beginner');
  if (stageKey === 'advanced') return isDone(domainId, 'intermediate');
  return false;
}

function completedCount(domainId) {
  return STAGES.filter((stage) => isDone(domainId, stage.key)).length;
}

function nav() {
  return `
    <header class="topbar">
      <a class="brand" href="#/" aria-label="返回首页">
        <span class="brand-mark">万</span>
        <span><b>世间万物</b><small>Wanwuzhi</small></span>
      </a>
      <nav aria-label="主导航">
        <a href="#/explore">探索</a>
        <a href="#/roadmap">路径</a>
        <a href="#/search">搜索</a>
        <a href="#/dashboard">学习台</a>
        <a href="#/admin">管理</a>
      </nav>
    </header>
  `;
}

function layout(inner, options = {}) {
  document.documentElement.dataset.theme = localStorage.getItem('wanwuzhi:theme') || 'light';
  app.classList.remove('view-enter');
  app.innerHTML = `${nav()}<main>${inner}</main><footer>探索知识的边界，从入门到精通 · 微信视频号带货书单已接入本地 JSON 数据</footer><div id="toast"></div>`;
  requestAnimationFrame(() => app.classList.add('view-enter'));
  bindGlobal();
  if (options.bind) options.bind();
}

function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 1800);
}

function bindGlobal() {
  $$('.js-theme').forEach((button) => {
    button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('wanwuzhi:theme', next);
      document.documentElement.dataset.theme = next;
    });
  });

  $$('.js-qr-open').forEach((button) => {
    button.addEventListener('click', () => {
      showQrModal({
        title: button.dataset.title || '万物小店橱窗',
        src: button.dataset.src || '/qr/store-qr.png',
        hint: button.dataset.hint || '扫码进入万物小店橱窗，探索更多好书'
      });
    });
  });
}

function showQrModal({ title, src, hint }) {
  const existing = $('.modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-panel" role="dialog" aria-modal="true" aria-label="${h(title)}">
      <button class="icon close" aria-label="关闭弹窗">×</button>
      <p class="eyebrow">微信视频号橱窗</p>
      <h2>${h(title)}</h2>
      <img src="${asset(src)}" alt="${h(title)}二维码" />
      <p class="modal-hint">${h(hint)}</p>
    </div>
  `;

  const close = () => {
    modal.classList.remove('show');
    window.setTimeout(() => modal.remove(), 180);
    document.body.classList.remove('modal-open');
  };
  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.classList.contains('close')) close();
  });
  document.addEventListener('keydown', function onEscape(event) {
    if (event.key === 'Escape' && document.body.contains(modal)) {
      close();
      document.removeEventListener('keydown', onEscape);
    }
  });

  document.body.appendChild(modal);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => modal.classList.add('show'));
}

function heroStats() {
  const done = STAGES.flatMap((stage) => state.domains.map((domain) => isDone(domain.id, stage.key))).filter(Boolean).length;
  return `
    <div class="stats" aria-label="平台数据">
      <span><b>10</b>知识篇章</span>
      <span><b>100</b>领域地图</span>
      <span><b>300</b>阶段课程</span>
      <span><b>${done}</b>已完成</span>
    </div>
  `;
}

function chapterImage(chapterId) {
  return asset(`/chapter-${String(chapterId).padStart(2, '0')}.jpg`);
}

function renderHome() {
  const todayDomain = state.domains[81] || state.domains[0];
  const beginnerDomains = state.domains.slice(0, 6);

  layout(`
    <section class="home-shell">
      <div class="hero-banner" style="--hero-image:url('${asset('/hero-bg.png')}')">
        <div class="hero-copy">
          <p class="eyebrow">今日探索</p>
          <h1>世间万物</h1>
          <p class="lead">探索知识的边界，从入门到精通。用 10 大篇章、100 个知识领域和 3 阶段路径，把复杂世界拆成普通人也能走下去的学习地图。</p>
          <div class="actions">
            <a class="primary" href="#/domain/${todayDomain.id}/stage/beginner">开始今日探索</a>
            <button class="secondary js-theme" type="button">切换阅读模式</button>
          </div>
          ${heroStats()}
        </div>
      </div>
    </section>

    <section class="section-stack">
      <div class="section-title">
        <div>
          <p class="eyebrow">Beginner First</p>
          <h2>新手必读</h2>
        </div>
        <a href="#/explore">查看全部</a>
      </div>
      <div class="starter-grid">
        ${beginnerDomains.map((domain) => domainCard(domain, true)).join('')}
      </div>
    </section>

    <section class="section-stack">
      <div class="section-title">
        <div>
          <p class="eyebrow">Knowledge Universe</p>
          <h2>十大知识宇宙</h2>
        </div>
        <span>横向滑动</span>
      </div>
      <div class="chapter-rail">
        ${state.chapters.map((chapter) => `
          <a class="chapter-card" href="#/explore?chapter=${chapter.id}" style="--chapter-image:url('${chapterImage(chapter.id)}')">
            <small>${h(chapter.number)}</small>
            <strong>${h(chapter.title)}</strong>
            <span>${chapter.domainCount || 10} 个领域</span>
          </a>
        `).join('')}
      </div>
    </section>
  `, { bind: bindExploreButtons });
}

function domainCard(domain, compact = false) {
  const count = completedCount(domain.id);
  return `
    <article class="domain-card ${compact ? 'compact' : ''}">
      <button class="fav js-fav" data-id="${domain.id}" type="button" aria-label="收藏 ${h(domain.title)}">${isFav(domain.id) ? '★' : '☆'}</button>
      <small>${h(domain.chapterTitle)}</small>
      <h3>${h(domain.title)}</h3>
      <p>${h(domain.summary)}</p>
      <div class="mini-progress" aria-label="完成进度 ${count}/3"><i style="width:${count / 3 * 100}%"></i></div>
      <div class="card-actions">
        <a href="#/domain/${domain.id}">查看路径</a>
        <a href="#/domain/${domain.id}/stage/beginner">开始学习</a>
      </div>
    </article>
  `;
}

function bindExploreButtons() {
  $$('.js-fav').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const next = !isFav(id);
      if (next) localStorage.setItem(favKey(id), '1');
      else localStorage.removeItem(favKey(id));
      button.textContent = next ? '★' : '☆';
      toast(next ? '已收藏领域' : '已取消收藏');
    });
  });
}

function renderExplore() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const chapterId = Number(params.get('chapter') || 0);
  const filtered = chapterId ? state.domains.filter((domain) => domain.chapterId === chapterId) : state.domains;

  layout(`
    <section class="page-head">
      <p class="eyebrow">Explore</p>
      <h1>100 个知识领域</h1>
      <p>按篇章筛选，或直接搜索领域标题、标签和摘要。每个领域都被拆成入门、进阶、专家三段学习路径。</p>
    </section>
    <section class="tools">
      <input id="domainSearch" type="search" placeholder="搜索领域，如 哲学、人工智能、宇宙观" />
      <div class="tabs" aria-label="篇章筛选">
        <a class="${chapterId ? '' : 'active'}" href="#/explore">全部</a>
        ${state.chapters.map((chapter) => `<a class="${chapterId === chapter.id ? 'active' : ''}" href="#/explore?chapter=${chapter.id}">${chapter.id}</a>`).join('')}
      </div>
    </section>
    <section id="domainGrid" class="domain-grid">
      ${filtered.map((domain) => domainCard(domain)).join('')}
    </section>
  `, {
    bind: () => {
      const input = $('#domainSearch');
      input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        const list = filtered.filter((domain) => `${domain.title}${domain.chapterTitle}${domain.summary}${domain.tags.join('')}`.toLowerCase().includes(query));
        $('#domainGrid').innerHTML = list.map((domain) => domainCard(domain)).join('') || '<p class="empty">没有匹配结果，换一个关键词试试。</p>';
        bindExploreButtons();
      });
      bindExploreButtons();
    }
  });
}

function stageProgressNav(domainId, activeStageKey = '') {
  return `
    <nav class="stage-progress" aria-label="渐进式学习路径">
      ${STAGES.map((stage, index) => {
        const unlocked = isStageUnlocked(domainId, stage.key);
        const done = isDone(domainId, stage.key);
        const classes = [
          activeStageKey === stage.key ? 'active' : '',
          done ? 'done' : '',
          unlocked ? '' : 'locked'
        ].filter(Boolean).join(' ');
        const href = unlocked ? `href="#/domain/${domainId}/stage/${stage.key}"` : 'aria-disabled="true"';
        return `
          <a class="${classes}" ${href}>
            <span>${stage.icon}</span>
            <b>${stage.short}</b>
            <small>${done ? '已完成' : unlocked ? (index === 0 ? '可开始' : '已解锁') : '待解锁'}</small>
          </a>
        `;
      }).join('')}
    </nav>
  `;
}

function renderDomain(id) {
  const domain = state.domains.find((item) => item.id === Number(id));
  if (!domain) return render404();

  layout(`
    <section class="page-head domain-head">
      <p class="eyebrow">${h(domain.chapterTitle)}</p>
      <h1>${h(domain.title)}</h1>
      <p>${h(domain.summary)}</p>
      ${stageProgressNav(domain.id)}
    </section>
    <section class="stage-grid">
      ${STAGES.map((stage) => {
        const unlocked = isStageUnlocked(domain.id, stage.key);
        return `
          <article class="stage-card ${unlocked ? '' : 'locked'}">
            <small>${unlocked ? '已开放' : '完成上一阶段后解锁'}</small>
            <h2><span>${stage.icon}</span>${stage.label}</h2>
            <p>${stage.promise}</p>
            ${unlocked ? `<a href="#/domain/${domain.id}/stage/${stage.key}">进入${stage.short}</a>` : '<button disabled type="button">阶段锁定</button>'}
          </article>
        `;
      }).join('')}
    </section>
    <section class="split">
      <div>
        <h2>学习目标</h2>
        <ul>${domain.objectives.map((item) => `<li>${h(item)}</li>`).join('')}</ul>
      </div>
      <div class="store">
        <h2>万物小店</h2>
        <p>推荐书籍已从学习内容中解耦，由本地 <code>data/books.json</code> 统一管理。改一本书，全站同步。</p>
        <button class="primary js-qr-open" type="button" data-title="万物小店橱窗" data-src="/qr/store-qr.png">打开店铺二维码</button>
      </div>
    </section>
  `);
}

function renderCoreConcepts(content) {
  if (Array.isArray(content.core_concepts) && content.core_concepts.length) {
    return `
      <section class="reading-section">
        <h2>核心概念</h2>
        <div class="concept-grid">
          ${content.core_concepts.map((concept, index) => `
            <article class="concept-card">
              <span>${String(index + 1).padStart(2, '0')}</span>
              <h3>${h(concept.title)}</h3>
              <p>${h(concept.description)}</p>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }

  return `
    <section class="reading-section">
      <h2>学习内容清单</h2>
      <div class="module-list">
        ${content.modules.map((module, index) => moduleBlock(module, index)).join('')}
      </div>
    </section>
  `;
}

function renderAdvancedLearningSections(content) {
  return `
    ${renderKnowledgeMap(content.knowledgeMap, content.undergraduateBenchmark)}
    ${renderFrameworks(content.frameworks)}
    ${renderMethods(content.methods)}
    ${renderCases(content.cases)}
    ${renderDebates(content.debates)}
    ${renderGlossary(content.glossary)}
    ${renderCapstone(content.capstone, content.readingPlan)}
  `;
}

function renderKnowledgeMap(map, benchmark) {
  if (!map) return '';
  return `
    <section class="reading-section knowledge-map">
      <div class="section-kicker">本科优秀毕业生基准</div>
      <h2>知识地图</h2>
      <p class="benchmark">${h(benchmark || map.outputStandard)}</p>
      <div class="wide-grid">
        <article>
          <h3>中心问题</h3>
          <p>${h(map.centralQuestion)}</p>
        </article>
        <article>
          <h3>先修能力</h3>
          <ul>${(map.prerequisites || []).map((item) => `<li>${h(item)}</li>`).join('')}</ul>
        </article>
        <article>
          <h3>学习结构</h3>
          <ul>${(map.structure || []).map((item) => `<li>${h(item)}</li>`).join('')}</ul>
        </article>
        <article>
          <h3>输出标准</h3>
          <p>${h(map.outputStandard)}</p>
        </article>
      </div>
    </section>
  `;
}

function renderFrameworks(frameworks = []) {
  if (!frameworks.length) return '';
  return `
    <section class="reading-section">
      <div class="section-kicker">Theory</div>
      <h2>理论框架</h2>
      <div class="framework-grid">
        ${frameworks.map((item) => `
          <article class="framework-card">
            <h3>${h(item.name)}</h3>
            <p>${h(item.use)}</p>
            <small>${h(item.caution)}</small>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderMethods(methods = []) {
  if (!methods.length) return '';
  return `
    <section class="reading-section">
      <div class="section-kicker">Method</div>
      <h2>研究方法</h2>
      <div class="method-list">
        ${methods.map((method) => `
          <article class="method-card">
            <h3>${h(method.name)}</h3>
            <ol>${(method.steps || []).map((step) => `<li>${h(step)}</li>`).join('')}</ol>
            <p><b>产出：</b>${h(method.deliverable)}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderCases(cases = []) {
  if (!cases.length) return '';
  return `
    <section class="reading-section">
      <div class="section-kicker">Case Lab</div>
      <h2>案例分析实验室</h2>
      <div class="case-grid">
        ${cases.map((item) => `
          <article class="case-card">
            <h3>${h(item.title)}</h3>
            <p>${h(item.scene)}</p>
            <ul>${(item.analysis || []).map((line) => `<li>${h(line)}</li>`).join('')}</ul>
            <small>${h(item.task)}</small>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderDebates(debates = []) {
  if (!debates.length) return '';
  return `
    <section class="reading-section">
      <div class="section-kicker">Debate</div>
      <h2>经典争议</h2>
      <div class="debate-list">
        ${debates.map((item) => `
          <article class="debate-card">
            <h3>${h(item.question)}</h3>
            <div class="debate-columns">
              <p><b>立场 A：</b>${h(item.positionA)}</p>
              <p><b>立场 B：</b>${h(item.positionB)}</p>
            </div>
            <small>${h(item.synthesis)}</small>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderGlossary(glossary = []) {
  if (!glossary.length) return '';
  return `
    <section class="reading-section">
      <div class="section-kicker">Glossary</div>
      <h2>术语表</h2>
      <div class="glossary-grid">
        ${glossary.map((item) => `
          <article>
            <strong>${h(item.term)}</strong>
            <p>${h(item.definition)}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderCapstone(capstone, readingPlan = []) {
  if (!capstone) return '';
  return `
    <section class="reading-section capstone">
      <div class="section-kicker">Capstone</div>
      <h2>综合任务</h2>
      <div class="capstone-layout">
        <article>
          <h3>${h(capstone.title)}</h3>
          <p>${h(capstone.brief)}</p>
          <p><b>最终产出：</b>${h(capstone.output)}</p>
          <h4>评分 Rubric</h4>
          <ul>${(capstone.rubric || []).map((item) => `<li><b>${h(item.criterion)}：</b>${h(item.standard)}</li>`).join('')}</ul>
        </article>
        <article>
          <h3>四周学习节奏</h3>
          <ol>${readingPlan.map((item) => `<li>${h(item)}</li>`).join('')}</ol>
        </article>
      </div>
    </section>
  `;
}

function moduleBlock(module, index) {
  return `
    <details class="module" ${index === 0 ? 'open' : ''}>
      <summary>
        <span>${String(index + 1).padStart(2, '0')}</span>
        <strong>${h(module.title)}</strong>
        <small>${h(module.focus)} · ${module.estimatedMinutes} 分钟</small>
      </summary>
      ${module.academicDepth ? `<p class="academic-depth">${h(module.academicDepth)}</p>` : ''}
      <ul>${module.keyPoints.map((point) => `<li>${h(point)}</li>`).join('')}</ul>
      ${module.commonMistake ? `<p class="common-mistake"><b>常见误区：</b>${h(module.commonMistake)}</p>` : ''}
      <p><b>实践：</b>${h(module.practice)}</p>
      <div class="checks">
        ${module.checklist.map((item) => `<label><input type="checkbox" /> ${h(item)}</label>`).join('')}
      </div>
    </details>
  `;
}

function exerciseBlock(exercise) {
  return `
    <article class="exercise">
      <small>${h(exercise.type)}</small>
      <h3>${h(exercise.question)}</h3>
      ${exercise.options ? `<div class="options">${exercise.options.map((option) => `<button type="button">${h(option)}</button>`).join('')}</div>` : ''}
      <button class="answer-toggle" type="button">查看参考答案</button>
      <p class="answer">${h(exercise.answer)}${exercise.explanation ? `<br />${h(exercise.explanation)}` : ''}</p>
    </article>
  `;
}

function renderLockedStage(domain, stageKey) {
  const previous = stageKey === 'intermediate' ? STAGE_BY_KEY.beginner : STAGE_BY_KEY.intermediate;
  layout(`
    <section class="page-head domain-head">
      <p class="eyebrow">${h(domain.chapterTitle)}</p>
      <h1>${h(domain.title)}</h1>
      <p>这个阶段还没有解锁。先完成${previous.label}，系统会自动记录进度并开放下一阶段。</p>
      ${stageProgressNav(domain.id, stageKey)}
    </section>
    <section class="locked-panel">
      <div>
        <span class="lock-icon">锁</span>
        <h2>阶段待解锁</h2>
        <p>渐进学习的价值在于先搭地基，再上结构。完成前置阶段后，这里会平滑切换为可阅读状态。</p>
        <a class="primary" href="#/domain/${domain.id}/stage/${previous.key}">前往${previous.label}</a>
      </div>
    </section>
  `);
}

async function renderStage(id, stageKey) {
  const domain = state.domains.find((item) => item.id === Number(id));
  const stage = STAGE_BY_KEY[stageKey];
  if (!domain || !stage) return render404();
  if (!isStageUnlocked(domain.id, stageKey)) return renderLockedStage(domain, stageKey);

  let content;
  try {
    content = await loadStage(id, stageKey);
  } catch (error) {
    layout(`<section class="page-head"><h1>内容校验失败</h1><p>${h(error.message)}</p></section>`);
    return;
  }

  const currentIndex = STAGES.findIndex((item) => item.key === stageKey);
  const next = STAGES[currentIndex + 1];
  const hook = content.hook || content.intro;

  layout(`
    <section class="reader-shell">
      <div class="reader-head">
        <p class="eyebrow">${h(content.chapterTitle)}</p>
        <h1>${h(content.domainTitle)} · ${h(content.stageLabel)}</h1>
        <p>${h(hook)}</p>
        ${stageProgressNav(domain.id, stageKey)}
        <div class="actions">
          <button id="completeBtn" class="primary" type="button">${isDone(domain.id, stageKey) ? '取消完成' : '阅读完毕，解锁下一阶段'}</button>
          <button class="secondary js-theme" type="button">切换阅读模式</button>
        </div>
      </div>
    </section>

    <section class="split reader-meta">
      <div>
        <h2>学习目标</h2>
        <ul>${content.learningGoals.map((goal) => `<li>${h(goal)}</li>`).join('')}</ul>
      </div>
      <div>
        <h2>阶段信息</h2>
        <p>适合对象：${h(content.stageAudience)}</p>
        <p>难度：${h(content.difficulty)}</p>
      </div>
    </section>

    ${renderCoreConcepts(content)}
    ${renderAdvancedLearningSections(content)}

    <section class="reading-section">
      <h2>练习巩固</h2>
      <div class="exercise-list">${content.exercises.map(exerciseBlock).join('')}</div>
    </section>

    <section class="split">
      <div>
        <h2>学习笔记</h2>
        <textarea id="noteBox" placeholder="记录你的理解、疑问和下一步行动"></textarea>
      </div>
      <div>
        <h2>下一步</h2>
        <p>${h(content.nextAction || (next ? `完成后进入${next.label}` : '你已经完成该领域三阶段学习。'))}</p>
        ${next ? `<a class="secondary" href="#/domain/${domain.id}/stage/${next.key}">查看${next.label}</a>` : '<a class="secondary" href="#/explore">继续探索其他领域</a>'}
      </div>
    </section>

    ${BookRecommendation({
      currentDomain: content.domain || content.domainTitle,
      currentStage: content.stage || content.stageLabel
    })}
  `, {
    bind: () => {
      bindStagePage(domain.id, stageKey, next);
      bindBookRecommendation();
    }
  });
}

function bindStagePage(domainId, stageKey, next) {
  $('#completeBtn')?.addEventListener('click', () => {
    const nextValue = !isDone(domainId, stageKey);
    setDone(domainId, stageKey, nextValue);
    toast(nextValue && next ? `${next.label}已解锁` : nextValue ? '该领域已完成' : '已取消完成状态');
    window.setTimeout(() => renderStage(domainId, stageKey), 220);
  });

  const noteBox = $('#noteBox');
  if (noteBox) {
    noteBox.value = localStorage.getItem(noteKey(domainId, stageKey)) || '';
    noteBox.addEventListener('input', () => localStorage.setItem(noteKey(domainId, stageKey), noteBox.value));
  }

  $$('.answer-toggle').forEach((button) => {
    button.addEventListener('click', () => button.nextElementSibling.classList.toggle('show'));
  });
}

function BookRecommendation({ currentDomain, currentStage }) {
  const matched = state.books.filter((book) => book.ExplorationDomain === currentDomain && book.LearningStage === currentStage);
  const body = state.booksError
    ? `<div class="empty commercial-empty">书籍数据暂时加载失败：${h(state.booksError.message)}</div>`
    : matched.length
      ? `<div class="book-grid">${matched.map(bookCard).join('')}</div>`
      : '<div class="empty commercial-empty">该阶段推荐书籍正在精心挑选整理中...</div>';

  return `
    <section class="book-recommendation" aria-labelledby="bookRecommendationTitle">
      <div class="recommend-head">
        <div>
          <p class="eyebrow">Book Commerce</p>
          <h2 id="bookRecommendationTitle">推荐书目</h2>
          <p>${h(currentDomain)} · ${h(currentStage)}</p>
        </div>
        <button class="store-entry js-qr-open" type="button" data-title="万物小店橱窗" data-src="/qr/store-qr.png" data-hint="扫码进入万物小店橱窗，探索更多好书">
          <img src="${asset('/qr/store-qr.png')}" alt="万物小店橱窗二维码" />
          <span>扫码进入万物小店橱窗，探索更多好书</span>
        </button>
      </div>
      ${body}
    </section>
  `;
}

function bookCard(book) {
  const cta = renderBookCta(book);
  return `
    <article class="book-card">
      <small>${h(book.ID)}</small>
      <h3>${h(book.title)}</h3>
      <p class="author">${h(book.author)}</p>
      <p>${h(book.description)}</p>
      ${cta}
    </article>
  `;
}

function renderBookCta(book) {
  if (book.purchaseType === 'url' && book.purchaseUrl) {
    return `<a class="book-cta" href="${h(book.purchaseUrl)}" target="_blank" rel="noopener noreferrer">前往购买</a>`;
  }

  if (book.purchaseType === 'qrcode' && book.purchaseQrCode) {
    return `
      <button
        class="book-cta js-book-qr"
        type="button"
        data-title="${h(book.title)}"
        data-src="${h(book.purchaseQrCode)}">
        微信扫码购买
      </button>
    `;
  }

  return '<button class="book-cta disabled" type="button" disabled>购买链接待补充</button>';
}

function bindBookRecommendation() {
  $$('.js-book-qr').forEach((button) => {
    button.addEventListener('click', () => {
      showQrModal({
        title: button.dataset.title,
        src: button.dataset.src,
        hint: '长按识别二维码，前往微信视频号橱窗购买'
      });
    });
  });
}

function renderRoadmap() {
  layout(`
    <section class="page-head">
      <p class="eyebrow">Roadmap</p>
      <h1>从入门到精通的学习路径</h1>
      <p>每个领域遵循三阶段学习：先看见问题，再拆解机制，最后形成自己的判断和作品。</p>
    </section>
    <section class="roadmap">
      ${[
        ['选择篇章', '先确定兴趣或问题所在的知识宇宙。'],
        ['完成入门', '建立概念边界和常识地图。'],
        ['进入进阶', '分析机制、案例和工具。'],
        ['挑战专家', '进行批判评估与综合应用。'],
        ['形成作品', '沉淀笔记、书单或主题作品。']
      ].map((item, index) => `
        <article>
          <span>${index + 1}</span>
          <h2>${item[0]}</h2>
          <p>${item[1]}</p>
        </article>
      `).join('')}
    </section>
    <section class="chapter-rail padded">
      ${state.chapters.map((chapter) => `
        <a class="chapter-card" href="#/explore?chapter=${chapter.id}" style="--chapter-image:url('${chapterImage(chapter.id)}')">
          <small>${h(chapter.number)}</small>
          <strong>${h(chapter.title)}</strong>
          <span>${chapter.domainCount || 10} 个领域</span>
        </a>
      `).join('')}
    </section>
  `);
}

function renderDashboard() {
  const done = STAGES.flatMap((stage) => state.domains.map((domain) => isDone(domain.id, stage.key))).filter(Boolean).length;
  const favorites = state.domains.filter((domain) => isFav(domain.id));
  const pct = Math.round(done / 300 * 100);

  layout(`
    <section class="page-head">
      <p class="eyebrow">Dashboard</p>
      <h1>我的学习台</h1>
      <p>进度、收藏和笔记保存在本机浏览器中。换设备后不会自动同步。</p>
    </section>
    <section class="dashboard">
      <div class="ring" style="--p:${pct}">
        <b>${pct}%</b>
        <span>${done}/300</span>
      </div>
      <div>
        <h2>学习徽章</h2>
        <div class="badges">
          <span>启程者</span>
          <span>${done >= 10 ? '十阶段学习者' : '待解锁'}</span>
          <span>${done >= 100 ? '百域探索者' : '待解锁'}</span>
        </div>
        <h2>我的收藏</h2>
        <div class="domain-grid small">
          ${favorites.length ? favorites.map((domain) => domainCard(domain)).join('') : '<p class="empty">尚未收藏领域</p>'}
        </div>
      </div>
    </section>
  `, { bind: bindExploreButtons });
}

async function renderSearch() {
  if (!state.searchIndex.length) state.searchIndex = await getJson('/content/search-index.json');
  layout(`
    <section class="page-head">
      <p class="eyebrow">Search</p>
      <h1>搜索知识内容</h1>
      <p>检索 300 份阶段内容中的模块标题、摘要、领域与篇章。</p>
    </section>
    <section class="tools">
      <input id="globalSearch" type="search" autofocus placeholder="输入关键词，如 哲学、宇宙、创业、AI" />
    </section>
    <section id="searchResults" class="results"></section>
  `, {
    bind: () => {
      const input = $('#globalSearch');
      const results = $('#searchResults');
      const run = () => {
        const query = input.value.trim().toLowerCase();
        if (!query) {
          results.innerHTML = '<p class="empty">请输入关键词开始搜索。</p>';
          return;
        }
        const list = state.searchIndex
          .filter((item) => `${item.title}${item.excerpt}${item.domainTitle}${item.chapterTitle}`.toLowerCase().includes(query))
          .slice(0, 60);
        results.innerHTML = list.map((item) => `
          <a class="result" href="${h(item.url)}">
            <small>${h(item.chapterTitle)} / ${h(item.stageLabel)}</small>
            <strong>${h(item.title)}</strong>
            <p>${h(item.excerpt)}</p>
          </a>
        `).join('') || '<p class="empty">没有匹配结果。</p>';
      };
      input.addEventListener('input', run);
      run();
    }
  });
}

function renderAdmin() {
  const authed = sessionStorage.getItem('wanwuzhi:admin') === '1';
  if (!authed) {
    layout(`
      <section class="admin-login">
        <h1>内容管理入口</h1>
        <input id="adminPwd" type="password" placeholder="输入管理密码" />
        <button class="primary" id="loginBtn" type="button">进入</button>
        <p>本地演示密码：wanwuzhi2024</p>
      </section>
    `, {
      bind: () => {
        $('#loginBtn').addEventListener('click', () => {
          if ($('#adminPwd').value === 'wanwuzhi2024') {
            sessionStorage.setItem('wanwuzhi:admin', '1');
            renderAdmin();
          } else {
            toast('密码错误');
          }
        });
      }
    });
    return;
  }

  layout(`
    <section class="page-head">
      <p class="eyebrow">Admin</p>
      <h1>内容完整性总览</h1>
      <p>当前版本：${state.domains.length} 个领域、300 份阶段内容、${state.books.length} 条书籍推荐。</p>
    </section>
    <section class="admin-table">
      <table>
        <thead><tr><th>ID</th><th>领域</th><th>篇章</th><th>阶段</th></tr></thead>
        <tbody>${state.domains.map((domain) => `<tr><td>${domain.id}</td><td>${h(domain.title)}</td><td>${h(domain.chapterTitle)}</td><td>入门 / 进阶 / 专家</td></tr>`).join('')}</tbody>
      </table>
    </section>
  `);
}

function render404() {
  layout(`
    <section class="page-head">
      <h1>页面不存在</h1>
      <p>请返回探索页重新选择领域。</p>
      <a class="primary" href="#/explore">返回探索</a>
    </section>
  `);
}

async function router() {
  try {
    app.innerHTML = '<main class="loading-screen"><div><span></span><h1>正在加载世间万物</h1><p>知识地图和书籍数据正在初始化...</p></div></main>';
    await loadCore();

    const hash = location.hash || '#/';
    const clean = hash.split('?')[0];
    let match;

    if (clean === '#/' || clean === '#') return renderHome();
    if (clean === '#/explore') return renderExplore();
    if (clean === '#/roadmap') return renderRoadmap();
    if (clean === '#/dashboard') return renderDashboard();
    if (clean === '#/search') return renderSearch();
    if (clean === '#/admin') return renderAdmin();
    if ((match = clean.match(/^#\/domain\/(\d+)$/))) return renderDomain(match[1]);
    if ((match = clean.match(/^#\/domain\/(\d+)\/stage\/(beginner|intermediate|advanced)$/))) return renderStage(match[1], match[2]);
    return render404();
  } catch (error) {
    console.error(error);
    layout(`<section class="page-head"><h1>加载失败</h1><p>${h(error.message)}</p></section>`);
  }
}

window.addEventListener('hashchange', router);
router();
