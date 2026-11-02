import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { refineQuizExplanations } from './refine-quiz-explanations.mjs';
const root = path.resolve(import.meta.dirname, '..');
await refineQuizExplanations(root);
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const write = async (file, data) => fs.writeFile(path.join(root, file), JSON.stringify(data, null, 2) + '\n');
const domains = await read('data/domains.json');
const labels = { beginner: '入门阶段', intermediate: '进阶阶段', advanced: '综合研习' };
const index = [];
for (const domain of domains) {
  const course = await read(`data/curricula/${domain.id}.json`);
  // Stable answer ordering prevents the authored correct option from always being first.
  for (const s of course.stages) for (const q of s.quiz) {
    const answer = q.options[q.correct];
    const rank = option => crypto.createHash('sha256').update(`${domain.id}:${s.key}:${q.question}:${option}`).digest('hex');
    q.options.sort((a, b) => rank(a).localeCompare(rank(b)));
    q.correct = q.options.indexOf(answer);
  }
  await write(`data/curricula/${domain.id}.json`, course);
  domain.summary = course.question;
  domain.objectives = course.outcomes;
  for (const s of course.stages) {
    index.push({ domainId: domain.id, stageKey: s.key, title: s.title, text: [domain.title, domain.chapterTitle, course.question, ...s.lesson, ...s.concepts.flatMap(c => [c.term, c.explanation]), s.workedExample.question, ...s.workedExample.reasoning, s.workedExample.answer, s.exercise.question, s.exercise.answer, s.project.title].join(' ') });
    // Keep all original 300 content URLs useful for existing integrations.
    await write(`content/${domain.id}/${s.key}.json`, { schemaVersion: '2026.11.02-v4', domainId: domain.id, domainTitle: domain.title, chapterId: domain.chapterId, chapterTitle: domain.chapterTitle, stageKey: s.key, stageLabel: labels[s.key], title: `${domain.title} · ${labels[s.key]}`, intro: s.lesson.join('\n\n'), learningGoals: course.outcomes, core_concepts: s.concepts.map(c => ({ title: c.term, description: c.explanation })), lesson: s.lesson, workedExample: s.workedExample, exercises: [{ question: s.exercise.question, answer: s.exercise.answer, rubric: s.exercise.rubric }], quiz: s.quiz, capstone: s.project, resources: course.sources, tutorPrompts: s.prompts });
  }
}
await write('data/domains.json', domains);
await write('data/curriculum-index.json', index);
await write('content/search-index.json', index.map(item => ({ ...item, domainTitle: domains.find(d => d.id === item.domainId).title, chapterTitle: domains.find(d => d.id === item.domainId).chapterTitle, stageLabel: labels[item.stageKey], excerpt: item.text.slice(0, 180), url: `#/domain/${item.domainId}/stage/${item.stageKey}` })));
// Retire synthetic books and ISBNs. Verified learning resources live with each curriculum.
await write('data/books.json', []);
await write('data/stages.json', Object.entries(labels).map(([key, label], i) => ({ key, label, level: i + 1, difficulty: ['理解与辨析', '推演与应用', '研究与综合'][i] })));
console.log(`Built ${domains.length} domains, ${index.length} lessons and full-text search.`);
