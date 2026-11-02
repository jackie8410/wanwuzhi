import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const domains = await read('data/domains.json');
const chapters = await read('data/chapters.json');
assert.equal(domains.length, 100); assert.equal(chapters.length, 10);
const uniqueLessons = new Set(); const uniqueQuestions = new Set(); const sourceUrls = new Set();
let characters = 0, lessons = 0, quizzes = 0, projects = 0, references = 0;
const text = (value, name, min = 1) => assert.ok(typeof value === 'string' && value.trim().length >= min, `${name}: missing or too short`);
const strings = (values, name, min = 1) => { assert.ok(Array.isArray(values) && values.length >= min, `${name}: array too short`); values.forEach(v => text(v, name)); };
for (let id = 1; id <= 100; id++) {
  const domain = domains.find(d => d.id === id); assert.ok(domain, `domain ${id}`);
  assert.ok(chapters.find(c => c.id === domain.chapterId));
  const c = await read(`data/curricula/${id}.json`); assert.equal(c.domainId, id);
  text(c.question, `${id} question`, 10); assert.ok(!uniqueQuestions.has(c.question), `${id} repeated question`); uniqueQuestions.add(c.question);
  strings(c.prerequisites, `${id} prerequisites`, 2); strings(c.outcomes, `${id} outcomes`, 3);
  assert.ok(Number.isFinite(c.hours) && c.hours > 0);
  assert.ok(c.connections.length >= 2); c.connections.forEach(n => assert.ok(n !== id && domains.some(d => d.id === n), `${id} connection ${n}`));
  assert.ok(c.sources.length >= 2); c.sources.forEach(s => { text(s.title, `${id} source title`); text(s.note, `${id} source note`); assert.equal(new URL(s.url).protocol, 'https:'); sourceUrls.add(s.url); references++; });
  assert.deepEqual(c.stages.map(s => s.key), ['beginner', 'intermediate', 'advanced']);
  for (const s of c.stages) {
    const label = `${id}/${s.key}`;
    text(s.title, label); strings(s.lesson, label, 2);
    assert.ok(s.lesson.join('').length >= 240, `${label} needs substantive explanation >=240 chars`);
    const hash = crypto.createHash('sha256').update(s.lesson.join('')).digest('hex'); assert.ok(!uniqueLessons.has(hash), `${label} duplicate lesson`); uniqueLessons.add(hash);
    assert.ok(s.concepts.length >= 2); s.concepts.forEach(concept => { text(concept.term, label); text(concept.explanation, label, 8); });
    text(s.workedExample.question, label); strings(s.workedExample.reasoning, label, 2); text(s.workedExample.answer, label, 8);
    text(s.exercise.question, label); text(s.exercise.answer, label, 12); strings(s.exercise.rubric, label, 2);
    assert.ok(s.quiz.length >= 1); s.quiz.forEach(q => { text(q.question, label); strings(q.options, label, 4); assert.equal(q.options.length, 4, `${label} must have four choices`); assert.equal(new Set(q.options).size, q.options.length); assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length); text(q.explanation, label, 8); assert.notEqual(q.explanation, s.exercise.answer, `${label} quiz explanation repeats another exercise answer`); quizzes++; });
    text(s.project.title, label); text(s.project.brief, label); strings(s.project.deliverables, label, 2); strings(s.project.rubric, label, 2); strings(s.prompts, label);
    const old = await read(`content/${id}/${s.key}.json`); assert.equal(old.domainId, id); assert.equal(old.domainTitle, domain.title); assert.equal(old.stageKey, s.key); assert.deepEqual(old.lesson, s.lesson);
    const allText = JSON.stringify(s); assert.ok(!/TODO|待补充|undefined|�/.test(allText), `${label} placeholder`);
    characters += allText.length; lessons++; projects++;
  }
}
const index = await read('data/curriculum-index.json'); assert.equal(index.length, 300); assert.equal(new Set(index.map(i => `${i.domainId}:${i.stageKey}`)).size, 300);
assert.ok(index.every(item => item.text.length > 240));
for (let c = 1; c <= 10; c++) assert.equal(domains.filter(d => d.chapterId === c).length, 10);
assert.equal((await fs.readFile(path.join(root, 'CNAME'), 'utf8')).trim(), 'learnforeverything.cn');
const qr = await fs.readFile(path.join(root, 'qr/store-qr.png')); assert.equal(qr.subarray(1, 4).toString(), 'PNG');
assert.equal(crypto.createHash('sha256').update(qr).digest('hex'), '2190d5eac9f6b57a6d366a0c6f915a4a08f42d7029780808750ae0266cc8d9f6', 'original store QR must remain unchanged');
assert.deepEqual(await read('data/books.json'), []);
console.log(JSON.stringify({ result: 'PASS', domains: domains.length, lessons, quizzes, projects, references, uniqueSourceUrls: sourceUrls.size, contentCharacters: characters, qrSha256: crypto.createHash('sha256').update(qr).digest('hex') }, null, 2));
