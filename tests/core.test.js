import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DATA } from '../data/annotations.js';
import { LESSONS } from '../data/lessons.js';
import { TEXTS } from '../data/texts.js';
import { keywords, classify, normalizedMap, norm, hl } from '../src/core.js';
const provenance = JSON.parse(await readFile(new URL('../data/provenance.json', import.meta.url)));
test('导入数据与旧版一致，包含完整课文与注释', () => {
  for (const [key, value] of Object.entries({ DATA, LESSONS, TEXTS })) {
    assert.equal(createHash('sha256').update(JSON.stringify(value)).digest('hex'), provenance.sha256[key]);
  }
  assert.equal(DATA.length, 2349); assert.equal(LESSONS.length, 71); assert.equal(Object.keys(TEXTS).length, 71);
  for (const [book, lesson, count] of LESSONS) {
    assert.equal(DATA.filter(a => a[3] === book && a[4] === lesson).length, count);
    assert.ok(TEXTS[book + '|' + lesson]?.p.length);
  }
});
test('查询优先级与范围：精确词条、独立关键词、原句和释义', () => {
  const r = { t: '海客谈瀛洲，烟涛微茫信难求', c: '海客谈瀛洲，烟涛微茫信难求', g: '信，确实、实在。' };
  r.keys = keywords(r);
  assert.equal(classify(r, '信', 'all'), 1);
  assert.equal(classify(r, '确实', 'gloss'), 4);
  assert.equal(classify(r, '确实', 'term'), -1);
  assert.equal(classify(r, r.t, 'all'), 0);
  assert.equal(classify(r, '瀛洲', 'clause'), 3);
});
test('含标点与扩展汉字的阅读定位保留原文偏移', () => {
  const text = '甲，𠀀乙。'; const m = normalizedMap(text);
  assert.equal(m.text, norm(text));
  assert.equal(text.slice(m.map[1], m.map[3]), '𠀀');
});
test('高亮会转义输入，避免将查询内容当作 HTML', () => {
  assert.equal(hl('<img>', 'img'), '&lt;<mark>img</mark>&gt;');
});
