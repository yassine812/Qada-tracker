// Packages generated public UI narration. Switch the manifest only after every
// clip has downloaded and decoded successfully; older audio remains recoverable.
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { companionPronunciation } from './companion-pronunciation.mjs';

if (!process.argv[2]) throw new Error('Provide the generated narration JSON path.');
const clips = JSON.parse(await readFile(process.argv[2], 'utf8'));
const manifestFile = new URL('../src/data/companionAudio.json', import.meta.url);
const current = JSON.parse(await readFile(manifestFile, 'utf8'));
const incremental = process.argv.includes('--incremental');
const currentCopy = JSON.parse(execFileSync(process.execPath, [fileURLToPath(new URL('./prepare-companion-audio.mjs', import.meta.url)), '--list'], { encoding: 'utf8', windowsHide: true }));
const expected = new Set([...Object.keys(current), ...currentCopy.map(c => c.text)]);
if (!clips.length || (!incremental && clips.length !== expected.size) || new Set(clips.map(c => c.text)).size !== clips.length) {
  throw new Error('Expected unique recordings; full replacements must include every narration line.');
}
for (const clip of clips) {
  if (!expected.has(clip.text) || clip.spoken !== companionPronunciation(clip.text)) throw new Error('Stale narration.');
  const url = new URL(clip.url);
  if (url.protocol !== 'https:' || url.hostname !== 'dnznrvs05pmza.cloudfront.net' || !url.pathname.startsWith('/text_to_speech/')) throw new Error('Unexpected audio URL.');
}
const folder = new URL('../public/audio/companion/child-arabic-v3/', import.meta.url);
const originals = new URL('../artifacts/voice-source-v3/', import.meta.url);
await mkdir(folder, { recursive: true });
await mkdir(originals, { recursive: true });
function encode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args], { windowsHide: true });
    let error = '';
    child.stderr.on('data', data => { error += data; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(error || `Audio encoder exited ${code}`)));
  });
}
const manifest = {};
let index = 0, done = 0;
async function worker() {
  while (index < clips.length) {
    const clip = clips[index++];
    const id = createHash('sha256').update('rachel-ar-v3-speed095:' + clip.spoken).digest('hex').slice(0, 16);
    const raw = new URL(`${id}.mp3`, originals);
    const output = new URL(`${id}.mp3`, folder);
    if ((await stat(output).catch(() => null))?.size > 1000) {
      await encode(['-i', fileURLToPath(output), '-f', 'null', '-']);
      manifest[clip.text] = `/audio/companion/child-arabic-v3/${id}.mp3`;
      done++;
      continue;
    }
    if (!(await stat(raw).catch(() => null))?.size) {
      const res = await fetch(clip.url, { signal: AbortSignal.timeout(90000) });
      if (!res.ok) throw new Error(`Audio download failed: ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length < 1000) throw new Error('Empty audio.');
      await writeFile(raw, bytes);
    }
    // Preserve the synthesized child voice's natural pitch and speaking pace.
    await encode(['-y', '-i', fileURLToPath(raw), '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-ar', '24000', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '80k', fileURLToPath(output)]);
    await encode(['-i', fileURLToPath(output), '-f', 'null', '-']);
    if ((await stat(output)).size < 1000) throw new Error('Invalid encoded audio.');
    manifest[clip.text] = `/audio/companion/child-arabic-v3/${id}.mp3`;
    if (++done % 10 === 0) console.log(`Verified ${done}/${clips.length} recordings`);
  }
}
const results = await Promise.allSettled(Array.from({length: 4}, worker));
const failed = results.find(r => r.status === 'rejected');
if (failed) throw failed.reason;
const backup = new URL('../artifacts/companion-manifest-before-v3.json', import.meta.url);
if (!(await stat(backup).catch(() => null))) await writeFile(backup, JSON.stringify(current, null, 2));
const replacements = Object.fromEntries(clips.map(c => [c.text, manifest[c.text]]));
await writeFile(manifestFile, JSON.stringify(incremental ? { ...current, ...replacements } : replacements, null, 2) + '\n');
console.log(`Activated ${clips.length} original childlike Arabic recordings.`);
