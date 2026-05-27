import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const stages = [
  {
    key: 'beginner',
    label: '入门阶段',
    audience: '准备把兴趣转化为系统知识的学习者',
    difficulty: '本科低年级核心通识',
    depth: '能够准确复述基本概念、画出问题地图，并用一个现实例子解释概念边界。',
    action: '建立概念地图、完成术语卡片，并进入进阶阶段。',
    verbs: ['界定', '区分', '复述', '举例', '提出问题'],
    moduleFocus: ['问题域与学科边界', '核心概念与基本模型', '历史脉络与代表人物', '现实案例与解释路径', '常见误区与证据意识', '学习迁移与行动清单']
  },
  {
    key: 'intermediate',
    label: '进阶阶段',
    audience: '已经完成基础概念学习，想要具备分析能力的学习者',
    difficulty: '本科高年级专业基础',
    depth: '能够比较主要理论、识别方法差异，并对复杂案例提出有证据的解释。',
    action: '完成一份结构化案例分析，并进入专家阶段。',
    verbs: ['比较', '建模', '分析', '评估', '论证'],
    moduleFocus: ['理论谱系与解释模型', '研究方法与证据质量', '典型案例的多层拆解', '制度、技术与文化变量', '争议问题与反方观点', '综合分析与表达训练']
  },
  {
    key: 'advanced',
    label: '专家阶段',
    audience: '希望形成独立判断和主题作品的学习者',
    difficulty: '优秀本科毕业论文准备水平',
    depth: '能够提出研究问题、组织文献与证据，完成一份可被讨论和改进的主题作品。',
    action: '完成一份小型研究报告、书评、课程设计或公开表达作品。',
    verbs: ['批判', '综合', '设计', '检验', '输出'],
    moduleFocus: ['前沿问题与研究议程', '跨学科解释与系统框架', '文献阅读与观点评估', '复杂案例与反事实推演', '原创问题与研究设计', '毕业作品级输出']
  }
];

const chapterProfiles = {
  1: {
    discipline: '心理学、认知科学与人文思想',
    question: '人如何理解自我、情绪、关系与成长',
    evidence: '实验研究、临床观察、访谈材料、量表数据与个人叙事',
    methods: ['概念辨析', '案例访谈', '行为观察', '量表与变量分析'],
    canons: ['弗洛伊德', '荣格', '马斯洛', '卡尼曼'],
    cases: ['亲密关系冲突', '职业倦怠与自我调节', '社群身份与心理边界'],
    debates: ['天性与环境的相对作用', '主观体验能否被科学测量', '心理解释与道德评价的边界']
  },
  2: {
    discipline: '历史学、文明史与全球史',
    question: '文明如何形成、扩张、冲突、转型并留下制度遗产',
    evidence: '史料文本、考古材料、制度档案、人口与贸易数据',
    methods: ['时间线重建', '因果链分析', '史料互证', '比较文明研究'],
    canons: ['希罗多德', '汤因比', '布罗代尔', '斯塔夫里阿诺斯'],
    cases: ['轴心时代思想转向', '帝国治理与边疆整合', '全球贸易网络重组'],
    debates: ['英雄人物与结构条件谁更关键', '现代化是否只有单一路径', '历史叙事中的中心与边缘']
  },
  3: {
    discipline: '社会学、政治学、法学与传播研究',
    question: '社会如何组织权力、分配资源并塑造共同生活',
    evidence: '制度文本、调查数据、媒体材料、政策案例与组织档案',
    methods: ['利益相关者分析', '制度分析', '话语分析', '政策评估'],
    canons: ['韦伯', '涂尔干', '福柯', '罗尔斯'],
    cases: ['公共政策争议', '平台舆论扩散', '社会组织的集体行动'],
    debates: ['秩序与自由的张力', '制度设计与文化习惯的关系', '公共利益如何被定义']
  },
  4: {
    discipline: '经济学、金融学与财富管理',
    question: '资源如何配置，价格、激励与风险如何改变人的选择',
    evidence: '市场数据、财务报表、政策变量、实验经济学结果',
    methods: ['供需分析', '边际分析', '财务建模', '风险收益评估'],
    canons: ['亚当·斯密', '凯恩斯', '哈耶克', '弗里德曼'],
    cases: ['通胀与资产配置', '平台定价策略', '家庭财务决策'],
    debates: ['市场效率与政府干预', '增长与公平的权衡', '理性人假设的适用范围']
  },
  5: {
    discipline: '商业管理、创业学与组织战略',
    question: '组织如何发现需求、创造价值、配置资源并持续增长',
    evidence: '商业案例、用户数据、运营指标、财务结果与组织访谈',
    methods: ['商业模式画布', '用户研究', '单位经济模型', '战略定位分析'],
    canons: ['德鲁克', '波特', '克莱顿·克里斯坦森', '里斯'],
    cases: ['新消费品牌增长', 'SaaS 留存优化', '组织变革与激励设计'],
    debates: ['规模优先还是利润优先', '创新来自技术还是需求', '管理制度与企业文化谁更底层']
  },
  6: {
    discipline: '自然科学、工程科学与系统建模',
    question: '自然规律如何被发现、验证并转化为工程能力',
    evidence: '实验数据、数学模型、工程测试、观测记录与仿真结果',
    methods: ['变量控制', '模型抽象', '实验设计', '系统优化'],
    canons: ['牛顿', '达尔文', '麦克斯韦', '费曼'],
    cases: ['能源转换效率', '生态系统变化', '材料失效分析'],
    debates: ['模型简化与现实复杂性的边界', '科学发现与工程应用的距离', '技术收益与环境代价']
  },
  7: {
    discipline: '计算机科学、人工智能与数字系统',
    question: '信息如何被表示、计算、连接并塑造新的社会基础设施',
    evidence: '算法性能、系统日志、用户行为、代码实现与安全事件',
    methods: ['抽象建模', '算法复杂度分析', '系统架构设计', 'A/B 测试'],
    canons: ['图灵', '香农', '冯·诺依曼', '诺伯特·维纳'],
    cases: ['推荐系统偏差', '云服务架构演进', 'AI 产品落地评估'],
    debates: ['效率与隐私的取舍', '自动化是否削弱人的判断', '技术中立是否成立']
  },
  8: {
    discipline: '美学、艺术史、设计学与创作研究',
    question: '形式、媒介、感知与文化意义如何共同生成审美经验',
    evidence: '作品分析、观众反馈、媒介材料、创作过程与历史语境',
    methods: ['形式分析', '符号解读', '媒介比较', '创作实验'],
    canons: ['康德', '贡布里希', '本雅明', '苏珊·朗格'],
    cases: ['电影叙事结构', '品牌视觉系统', '公共空间设计'],
    debates: ['审美判断是否有客观标准', '技术复制如何改变艺术价值', '商业设计与艺术表达的边界']
  },
  9: {
    discipline: '学习科学、生活技能与实践智慧',
    question: '个人如何把知识、习惯、资源与行动整合成更好的生活能力',
    evidence: '行为记录、健康指标、财务数据、学习反馈与实践复盘',
    methods: ['目标拆解', '反馈循环', '习惯设计', '复盘日志'],
    canons: ['杜威', '彼得·德鲁克', '赫伯特·西蒙', '卡罗尔·德韦克'],
    cases: ['学习计划失败复盘', '家庭预算优化', '健康行为改变'],
    debates: ['效率工具与长期意义的关系', '自律与环境设计谁更有效', '经验知识能否被系统化']
  },
  10: {
    discipline: '哲学、逻辑学、科学哲学与宇宙观',
    question: '人如何追问存在、知识、价值、语言与世界整体图景',
    evidence: '经典文本、论证结构、思想实验、科学理论与概念史',
    methods: ['概念分析', '逻辑重构', '思想实验', '文本精读'],
    canons: ['柏拉图', '亚里士多德', '康德', '维特根斯坦'],
    cases: ['自由意志论证', '科学解释边界', '人工智能的主体性问题'],
    debates: ['知识是否必须有确定基础', '价值判断能否客观化', '语言是否限制思想']
  }
};

const readJson = async (file) => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const writeJson = async (file, value) => fs.writeFile(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');

function splitDomain(title, tags) {
  const parts = title.split(/[与和及、]/).map((part) => part.trim()).filter(Boolean);
  const keywords = [...new Set([...(tags || []), ...parts, title].filter(Boolean))];
  return {
    primary: keywords[0] || title,
    secondary: keywords[1] || title,
    tertiary: keywords[2] || keywords[0] || title,
    keywords
  };
}

function conceptSet(domain, profile, stage, parts) {
  const stageVerb = stage.verbs[0];
  return [
    {
      title: `${domain.title}的对象边界`,
      description: `${stage.label}首先要${stageVerb}“${domain.title}”究竟讨论什么：它不是零散常识，而是${profile.discipline}中围绕“${profile.question}”形成的问题域。优秀学习者需要能说明哪些现象属于该领域，哪些只是相邻问题。`
    },
    {
      title: `${parts.primary}与${parts.secondary}的关系`,
      description: `把“${parts.primary}”看作核心变量，把“${parts.secondary}”看作解释路径或应用场景。两者之间的张力，通常决定了该领域最值得追问的问题。`
    },
    {
      title: '证据与解释',
      description: `本科水平的学习不能停留在观点表达，必须追问证据从哪里来。该领域常用证据包括${profile.evidence}，不同证据的可靠性和适用边界并不相同。`
    },
    {
      title: '模型思维',
      description: `模型不是答案，而是把复杂问题压缩成可讨论结构的方法。学习${domain.title}时，应明确模型保留了什么、牺牲了什么、适合解释什么。`
    },
    {
      title: '现实迁移',
      description: `能把概念迁移到${profile.cases[0]}、${profile.cases[1]}等场景，是从“看懂”走向“会用”的标志。`
    },
    {
      title: '批判性限制',
      description: `任何理论都有解释边界。面对${domain.title}，要主动寻找反例、替代理论和未被解释的剩余问题。`
    }
  ];
}

function knowledgeMap(domain, profile, parts) {
  return {
    centralQuestion: `当我们研究“${domain.title}”时，真正追问的是：${profile.question}？`,
    prerequisites: [
      `理解${profile.discipline}的基本问题意识`,
      `能区分事实描述、因果解释、价值判断和行动建议`,
      `能把${parts.primary}与${parts.secondary}放入具体案例中观察`
    ],
    structure: [
      `对象层：${domain.title}讨论的现象、主体和边界`,
      `机制层：变量之间如何相互作用并产生结果`,
      `证据层：用${profile.evidence}验证或修正判断`,
      `应用层：在${profile.cases.join('、')}中进行迁移`
    ],
    outputStandard: '优秀本科毕业生应能提出清晰问题、解释主要理论、比较证据质量，并完成一份有结构、有反方、有结论的分析作品。'
  };
}

function frameworks(domain, profile, stage, parts) {
  return [
    {
      name: '结构-行动框架',
      use: `分析${domain.title}时，同时观察外部结构如何限制选择，以及个体或组织如何反过来改变结构。`,
      caution: '不要把所有结果都归因于单一主体，也不要把人当成完全被环境决定。'
    },
    {
      name: '历史脉络框架',
      use: `追踪${parts.primary}概念如何形成、扩散和改变，避免把今天的判断投射到过去。`,
      caution: '概念的现代含义和历史含义经常不同，需要回到语境。'
    },
    {
      name: '证据等级框架',
      use: `把${profile.evidence}按可靠性、代表性和可复核性排序，再决定结论强度。`,
      caution: '高质量证据也可能只回答局部问题，不能无限外推。'
    },
    {
      name: `${stage.label}综合框架`,
      use: `用“概念界定-机制解释-案例检验-反方修正”四步完成${stage.label}学习。`,
      caution: '综合不是堆材料，而是让每一段材料服务于同一个问题。'
    }
  ];
}

function methods(domain, profile) {
  return profile.methods.map((method) => ({
    name: method,
    steps: [
      `确定与${domain.title}相关的具体问题`,
      '列出关键变量、主体和约束条件',
      `收集能够支持或反驳判断的${profile.evidence}`,
      '写出可被别人检查的推理链'
    ],
    deliverable: `用${method}完成一页分析卡片，包含问题、证据、结论和局限。`
  }));
}

function modules(domain, profile, stage, parts) {
  return stage.moduleFocus.map((focus, index) => ({
    id: `${domain.id}-${stage.key}-${index + 1}`,
    title: `${focus}：${domain.title}`,
    focus,
    estimatedMinutes: 35 + index * 8 + (stage.key === 'advanced' ? 18 : stage.key === 'intermediate' ? 10 : 0),
    academicDepth: `${stage.depth}本模块要求把“${domain.title}”放入${profile.discipline}的学科语境中，而不是停留在百科式介绍。`,
    keyPoints: [
      `从问题出发：${domain.title}的核心不是记住名词，而是回答“${profile.question}”。`,
      `从概念出发：说明${parts.primary}、${parts.secondary}与${parts.tertiary}之间的差异、联系和适用边界。`,
      `从理论出发：至少能引用${profile.canons.slice(0, 2).join('、')}等代表性思想，并说明它们能解释什么。`,
      `从证据出发：使用${profile.evidence}时，要区分样本、语境、因果和价值判断。`,
      `从应用出发：把本模块迁移到${profile.cases[index % profile.cases.length]}，写出一个可以被反驳或修正的结论。`
    ],
    commonMistake: `把${domain.title}当成单一答案，忽略理论之间的竞争和证据边界。`,
    practice: `围绕“${profile.cases[index % profile.cases.length]}”写一段 250 字分析：先给出问题，再列出两个概念、一个证据来源和一个可能反例。`,
    checklist: [
      `能用自己的话解释${focus}`,
      '能指出至少一个反方观点',
      '能说明结论依赖哪些证据',
      '能把概念迁移到一个新案例'
    ]
  }));
}

function cases(domain, profile, stage) {
  return profile.cases.map((caseName, index) => ({
    title: caseName,
    scene: `把${caseName}视为${domain.title}的观察窗口，先描述事实，再解释机制，最后讨论行动选择。`,
    analysis: [
      `识别相关主体：谁在行动，谁受影响，谁拥有资源或解释权。`,
      `定位关键机制：${domain.title}中的概念如何解释该案例的变化。`,
      `检查证据质量：现有材料是否足以支持强结论，是否存在替代解释。`
    ],
    task: `${stage.label}学习者需要写出一个“主张-证据-限制”的三段式判断。`
  }));
}

function debates(profile) {
  return profile.debates.map((debate) => ({
    question: debate,
    positionA: '强调结构、制度、模型或可测量证据，认为稳定规律比个别经验更可靠。',
    positionB: '强调主体经验、历史语境、文化差异或复杂系统，提醒我们警惕过度简化。',
    synthesis: '优秀答案不急于站队，而是说明两种立场分别在什么条件下成立。'
  }));
}

function glossary(domain, parts) {
  return [
    ['问题意识', `知道${domain.title}要回答什么，而不只是收集相关信息。`],
    ['概念边界', `说明${parts.primary}与相邻概念的差别，避免讨论失焦。`],
    ['解释机制', '连接原因与结果的中间过程，是高质量分析的核心。'],
    ['证据质量', '判断材料是否可靠、代表性是否足够、能否支持因果推断。'],
    ['反方观点', '主动寻找不同解释，用来检验自己结论的强度。'],
    ['迁移应用', `把${domain.title}用于新案例，并说明哪些条件发生了变化。`]
  ].map(([term, definition]) => ({ term, definition }));
}

function exercises(domain, profile, stage, parts) {
  return [
    {
      type: '概念辨析',
      question: `请区分“${parts.primary}”与“${parts.secondary}”，并说明它们在${domain.title}中的关系。`,
      answer: `优秀答案应包含定义、差异、联系、案例和边界条件，而不是只给出同义词解释。`
    },
    {
      type: '理论比较',
      question: `选择${profile.canons.slice(0, 2).join('与')}的任一相关思想，比较它们如何解释${domain.title}。`,
      answer: '答案应说明两种理论的基本假设、解释优势、局限，以及一个能检验差异的案例。'
    },
    {
      type: '案例应用',
      question: `用${domain.title}解释“${profile.cases[0]}”，写出主张、证据和可能反例。`,
      answer: `主张必须具体，证据需来自${profile.evidence}之一，反例要能真正挑战原结论。`
    },
    {
      type: '研究设计',
      question: `如果要继续研究${domain.title}，你会提出什么问题？如何收集材料？`,
      answer: `优秀答案要包含研究问题、对象范围、资料来源、分析方法和伦理或偏差风险。`
    }
  ];
}

function capstone(domain, profile, stage) {
  const output = stage.key === 'beginner'
    ? '一张概念地图和一份 800 字入门说明'
    : stage.key === 'intermediate'
      ? '一份 1500 字案例分析报告'
      : '一份 3000 字小型研究论文或公开讲稿';
  return {
    title: `${domain.title}${stage.label}综合任务`,
    output,
    brief: `围绕${profile.question}，选择一个真实案例，完成“问题-理论-证据-反方-结论”的完整表达。`,
    rubric: [
      { criterion: '问题清晰度', standard: '问题具体，范围适中，能引出分析而不是只描述现象。' },
      { criterion: '理论准确度', standard: '核心概念使用准确，能说明理论适用边界。' },
      { criterion: '证据质量', standard: `能使用${profile.evidence}，并主动说明材料限制。` },
      { criterion: '论证结构', standard: '主张、理由、反方和结论之间有清晰关系。' },
      { criterion: '表达完成度', standard: '语言清楚，结构可读，有可执行的下一步问题。' }
    ]
  };
}

function readingPlan(domain, profile, stage) {
  return [
    `第 1 周：阅读${domain.title}的基础概念，完成 20 张术语卡片。`,
    `第 2 周：选择${profile.canons.slice(0, 2).join('、')}相关材料，整理理论差异。`,
    `第 3 周：围绕${profile.cases[0]}收集材料，完成案例分析草稿。`,
    `第 4 周：加入反方观点和证据限制，完成${stage.label}综合任务。`
  ];
}

function makeContent(domain, stage) {
  const profile = chapterProfiles[domain.chapterId];
  const parts = splitDomain(domain.title, domain.tags);
  return {
    schemaVersion: '2026.05.27-undergraduate',
    domainId: domain.id,
    domainTitle: domain.title,
    domain: domain.title,
    chapterId: domain.chapterId,
    chapterTitle: domain.chapterTitle,
    stageKey: stage.key,
    stageLabel: stage.label,
    stage: stage.label,
    stageAudience: stage.audience,
    difficulty: stage.difficulty,
    undergraduateBenchmark: stage.depth,
    hook: `真正理解“${domain.title}”，不是多记几个名词，而是能解释${profile.question}，并在复杂案例中说清证据、边界和反方观点。`,
    intro: `${stage.label}围绕“${domain.title}”展开，目标是达到${stage.difficulty}水准：学习者需要掌握核心概念、主要理论、研究方法和案例分析路径，最终完成一份可被讨论的学习作品。`,
    learningGoals: [
      `建立${domain.title}的本科级知识框架`,
      `掌握${profile.methods.slice(0, 3).join('、')}等基本方法`,
      `能够围绕${profile.cases[0]}进行证据化分析`,
      '能够提出反方观点并修正自己的结论'
    ],
    knowledgeMap: knowledgeMap(domain, profile, parts),
    core_concepts: conceptSet(domain, profile, stage, parts),
    frameworks: frameworks(domain, profile, stage, parts),
    methods: methods(domain, profile),
    modules: modules(domain, profile, stage, parts),
    cases: cases(domain, profile, stage),
    debates: debates(profile),
    glossary: glossary(domain, parts),
    readingPlan: readingPlan(domain, profile, stage),
    exercises: exercises(domain, profile, stage, parts),
    capstone: capstone(domain, profile, stage),
    recommendedBooks: [1, 2, 3].map((n) => `book-${domain.id}-${stage.key}-${n}`),
    nextAction: stage.action,
    updatedAt: '2026-05-27'
  };
}

const domains = await readJson('data/domains.json');
const searchIndex = [];

for (const domain of domains) {
  for (const stage of stages) {
    const content = makeContent(domain, stage);
    const file = `content/${domain.id}/${stage.key}.json`;
    await writeJson(file, content);
    searchIndex.push(
      ...content.modules.map((module) => ({
        domainId: domain.id,
        domainTitle: domain.title,
        chapterTitle: domain.chapterTitle,
        stageKey: stage.key,
        stageLabel: stage.label,
        title: module.title,
        excerpt: `${module.academicDepth} ${module.keyPoints[0]}`,
        url: `#/domain/${domain.id}/stage/${stage.key}`
      })),
      ...content.core_concepts.map((concept) => ({
        domainId: domain.id,
        domainTitle: domain.title,
        chapterTitle: domain.chapterTitle,
        stageKey: stage.key,
        stageLabel: stage.label,
        title: concept.title,
        excerpt: concept.description,
        url: `#/domain/${domain.id}/stage/${stage.key}`
      }))
    );
  }
}

await writeJson('content/search-index.json', searchIndex);
console.log(JSON.stringify({ domains: domains.length, stages: domains.length * stages.length, searchItems: searchIndex.length }, null, 2));
