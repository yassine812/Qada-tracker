// Build-time packaging of approved/public UI narration; no runtime TTS service.
// Input: JSON [{ text, spoken, url }] returned by AI Voice Generator.
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { companionPronunciation } from './companion-pronunciation.mjs';

const source = process.argv[2];
if (!source) throw new Error('Provide the generated narration JSON path.');
const clips = JSON.parse(await readFile(source, 'utf8'));
const manifestFile = new URL('../src/data/companionAudio.json', import.meta.url);
const current = JSON.parse(await readFile(manifestFile, 'utf8'));
if (clips.length !== Object.keys(current).length || new Set(clips.map(clip => clip.text)).size !== clips.length) {
  throw new Error('Require one generated recording per current UI line.');
}
for (const clip of clips) {
  if (!Object.hasOwn(current, clip.text) || clip.spoken !== companionPronunciation(clip.text)) throw new Error('Stale narration input.');
  const url = new URL(clip.url);
  if (url.protocol !== 'https:' || url.hostname !== 'storage.googleapis.com') throw new Error('Unexpected audio provider URL.');
}

const rawDir = new URL('../artifacts/voice-source-v2/', import.meta.url);
const publicDir = new URL('../public/audio/companion/', import.meta.url);
await mkdir(rawDir, { recursive: true });
await mkdir(publicDir, { recursive: true });
function encode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args], { windowsHide: true });
    let error = '';
    child.stderr.on('data', data => { error += data; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(error || `Encoder exited ${code}`)));
  });
}
const manifest = {};
let next = 0;
let finished = 0;
async function packageClip(clip) {
  const id = createHash('sha256').update('delicate-cartoon-v2:' + clip.spoken).digest('hex').slice(0, 16);
  const original = new URL(`${id}.mp3`, rawDir);
  const output = new URL(`${id}.mp3`, publicDir);
  if (!(await stat(original).catch(() => null))?.size) {
    const response = await fetch(clip.url, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Audio download failed: ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length < 1000) throw new Error('Empty narration clip.');
    await writeFile(original, data);
  }
  // A synthetic cartoon timbre. Adjust resonances with the voice and retain a
  // comfortable speaking pace; never speed up an MP3 with HTML playbackRate.
  await encode(['-y', '-i', fileURLToPath(original), '-af',
    'rubberband=pitch=1.38:tempo=1.02:formant=shifted:transients=mixed:detector=soft:pitchq=quality,highpass=f=90,lowpass=f=9000,loudnorm=I=-18:TP=-2:LRA=7',
    '-ar', '24000', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '80k', fileURLToPath(output)]);
  // Decode the complete delivered MP3: catches bad input, corruption, or an
  // encoder failure before any UI line is switched to the new asset.
  await encode(['-v', 'error', '-i', fileURLToPath(output), '-f', 'null', '-']);
  if ((await stat(output)).size < 1000) throw new Error('Empty encoded narration.');
  manifest[clip.text] = `/audio/companion/${id}.mp3`;
  finished++;
  if (finished % 10 === 0) console.log(`Packaged ${finished}/${clips.length}`);
}
async function worker() {
  while (next < clips.length) await packageClip(clips[next++]);
}
const jobs = await Promise.allSettled(Array.from({ length: 4 }, () => worker()));
const failed = jobs.find(job => job.status === 'rejected');
if (failed) throw failed.reason;
// Preserve the working manifest until every new recording is available.
await writeFile(manifestFile, JSON.stringify(Object.fromEntries(clips.map(clip => [clip.text, manifest[clip.text]])), null, 2) + '\n');
console.log(`Activated ${clips.length} verified cartoon narration files.`);
