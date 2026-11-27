import ts from 'typescript';
import vm from 'node:vm';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { companionPronunciation } from './companion-pronunciation.mjs';

// Only public UI copy is rendered. No account or user-entered text is sent to TTS.
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
function loadData(source) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), { module, exports: module.exports });
  return module.exports;
}
const lines = new Set();
const add = text => lines.add(text.normalize('NFC').replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim());
const guide = ts.createSourceFile('guide.tsx', await read('src/components/guide/GuideDialog.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function visitGuide(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(guide) === 'GUIDE_STEPS') {
    for (const item of node.initializer.elements) {
      const fields = Object.fromEntries(item.properties.filter(p => ['title', 'text', 'tip'].includes(p.name?.getText(guide))).map(p => [p.name.getText(guide), p.initializer.text]));
      add(`${fields.title}. ${fields.text} ${fields.tip}`);
    }
  }
  ts.forEachChild(node, visitGuide);
}
visitGuide(guide);
const { HELP_TOPICS } = loadData(await read('src/components/guide/helpTopics.ts'));
for (const topic of Object.values(HELP_TOPICS)) for (const step of topic.steps) add(`${step.title}. ${step.text} ${step.tip}`);
const { companionMessage } = loadData(await read('src/components/companionMessages.ts'));
const prayers = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
for (const label of [...prayers, 'استغفار', 'صيام', 'قرآن', 'صباح', 'مساء', 'نوم', 'دعاء', 'ذكر', 'حساب', 'المزيد', 'الرئيسية', 'عام']) {
  for (let i = 0; i < 3; i++) add(companionMessage(label, i));
}
add('رحلتك تبدأ بخطوة 🌿');
for (const file of ['src/context/AppContext.tsx', 'src/hooks/useAdhkar.ts', 'src/pages/IbadatPage.tsx', 'src/pages/QuranPage.tsx']) {
  const source = ts.createSourceFile(file, await read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function collect(node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'encourageProgress') {
      function strings(part) {
        if (ts.isStringLiteral(part)) add(part.text);
        else if (ts.isTemplateExpression(part)) {
          if (part.templateSpans.length !== 1 || !part.templateSpans[0].expression.getText(source).includes('prayerArabicNames')) throw new Error(`Unrecorded variable narration in ${file}`);
          for (const name of prayers) add(part.head.text + name + part.templateSpans[0].literal.text);
        } else ts.forEachChild(part, strings);
      }
      strings(node.arguments[0]);
    } else ts.forEachChild(node, collect);
  }
  collect(source);
}
// Inspect current copy without replacing already generated voice recordings.
if (process.argv.includes('--list') || process.argv.includes('--missing')) {
  const recorded = process.argv.includes('--missing')
    ? JSON.parse(await read('src/data/companionAudio.json')) : {};
  console.log(JSON.stringify([...lines].filter(text => !recorded[text]).map(text => ({ text, spoken: companionPronunciation(text) }))));
  process.exit(0);
}
const manifest = Object.fromEntries([...lines].map(text => [text, `/audio/companion/${createHash('sha256').update('delicate-cartoon-v2:' + companionPronunciation(text)).digest('hex').slice(0, 16)}.mp3`]));
await mkdir(new URL('../public/audio/companion/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/data/companionAudio.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared ${lines.size} public Arabic narration clips.`);
