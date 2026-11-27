import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const recordings = JSON.parse(readFileSync(new URL('../src/data/companionAudio.json', import.meta.url), 'utf8'));
const lines = Object.keys(recordings);
function fixture({ blocked = false, stored = 'off', voices = [] } = {}) {
  const timers = new Map(), audio = [], storage = new Map([['qada:companion-voice:v1', stored]]);
  let timerId = 0;
  class FakeAudio {
    dataset = {}; muted = true; volume = 0; paused = true; count = 0;
    setAttribute() {}
    pause() { this.paused = true; }
    play() {
      this.count++;
      if (blocked) return Promise.reject(Object.assign(new Error('Blocked'), { name: 'NotAllowedError' }));
      this.paused = false; this.onplaying?.(); return Promise.resolve();
    }
  }
  const synth = { getVoices: () => voices, cancel() {}, resume() {}, speak() {}, addEventListener() {}, removeEventListener() {} };
  const window = { speechSynthesis: synth, SpeechSynthesisUtterance: class {}, setTimeout(callback) { timers.set(++timerId, callback); return timerId; }, clearTimeout(id) { timers.delete(id); } };
  const module = { exports: {} };
  const source = readFileSync(new URL('../src/services/companionVoice.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), {
    module, exports: module.exports, require: () => ({ default: recordings }), window,
    SpeechSynthesisUtterance: window.SpeechSynthesisUtterance,
    document: { body: { appendChild() {} }, createElement() { const element = new FakeAudio(); audio.push(element); return element; } },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  });
  return { api: module.exports, audio, timers, storage };
}

test('every recorded Arabic line has a non-empty MP3 shipped with the app', () => {
  assert.ok(lines.length >= 100);
  for (const url of Object.values(recordings)) assert.ok(statSync(new URL(`../public${url}`, import.meta.url)).size > 1000, url);
});
test('every current tour step and feature explanation has matching full narration', () => {
  const source = ts.createSourceFile('guide.tsx', readFileSync(new URL('../src/components/guide/GuideDialog.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let tour;
  function find(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'GUIDE_STEPS') tour = vm.runInNewContext(`(${node.initializer.getText(source)})`);
    ts.forEachChild(node, find);
  }
  find(source);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpile(readFileSync(new URL('../src/components/guide/helpTopics.ts', import.meta.url), 'utf8'), { module: ts.ModuleKind.CommonJS }), { module, exports: module.exports });
  const { api } = fixture();
  for (const step of [...tour, ...Object.values(module.exports.HELP_TOPICS).flatMap(topic => topic.steps)]) {
    assert.ok(recordings[api.normalizeNarration(`${step.title}. ${step.text} ${step.tip}`)], step.title);
  }
});
test('unmute starts media directly without requiring any installed speech voice', () => {
  const { api, audio, storage } = fixture();
  api.toggleCompanionVoice(lines[0], 'companion');
  assert.equal(audio.length, 1); assert.equal(audio[0].count, 1);
  assert.equal(audio[0].muted, false); assert.equal(audio[0].volume, 1);
  assert.equal(api.getCompanionVoice().phase, 'speaking');
  assert.equal(storage.get('qada:companion-voice:v1'), 'on');
});
test('the latest guide replaces feedback using the same audio element; stale callbacks cannot change it', () => {
  const { api, audio } = fixture({ stored: 'on' });
  api.speakCompanion(lines[0], 'companion');
  const oldEnd = audio[0].onended;
  api.speakCompanion(lines[1], 'guide'); oldEnd();
  api.stopCompanionVoice('companion');
  assert.equal(audio.length, 1); assert.equal(audio[0].src, recordings[lines[1]]);
  assert.equal(api.getCompanionVoice().owner, 'guide');
  assert.equal(api.getCompanionVoice().phase, 'speaking');
});
test('muting from a guide stops playback and prevents later messages playing', () => {
  const { api, audio } = fixture({ stored: 'on' });
  api.speakCompanion(lines[0], 'guide');
  api.toggleCompanionVoice(lines[0], 'guide');
  api.speakCompanion(lines[1], 'companion');
  assert.equal(audio[0].paused, true); assert.equal(audio[0].count, 1);
  assert.equal(api.getCompanionVoice().enabled, false);
});
test('autoplay rejection becomes a visible retry state rather than false speaking', async () => {
  const { api, audio } = fixture({ blocked: true });
  api.toggleCompanionVoice(lines[0], 'companion');
  await Promise.resolve(); await Promise.resolve();
  assert.equal(api.getCompanionVoice().phase, 'error');
  assert.ok(api.getCompanionVoice().error.length > 0);
  api.toggleCompanionVoice(lines[0], 'companion');
  await Promise.resolve();
  assert.equal(audio[0].count, 2);
  assert.equal(api.getCompanionVoice().enabled, true);
});
test('failed MP3 reports a retry instead of switching to a mismatched device voice', () => {
  const { api, audio, timers } = fixture({ stored: 'on', voices: [{ name: 'Adult device voice', lang: 'ar-SA' }] });
  api.speakCompanion(lines[0], 'guide');
  audio[0].onerror();
  for (const callback of [...timers.values()]) callback();
  assert.equal(api.getCompanionVoice().phase, 'error');
  assert.match(api.getCompanionVoice().error, /العربي/);
});
test('emoji and whitespace do not prevent finding the exact recorded line', () => {
  const { api, audio } = fixture({ stored: 'on' });
  api.speakCompanion('  رحلتك تبدأ بخطوة 🌿  ', 'companion');
  assert.equal(audio[0].src, recordings['رحلتك تبدأ بخطوة']);
});
