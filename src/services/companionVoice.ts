import recordings from '../data/companionAudio.json';

export type VoiceOwner = 'companion' | 'guide';
type VoiceState = { enabled: boolean; owner: VoiceOwner | null; phase: 'idle' | 'loading' | 'speaking' | 'error'; error: string };
const preferenceKey = 'qada:companion-voice:v1';
let enabled = false;
try { enabled = localStorage.getItem(preferenceKey) === 'on'; } catch { /* Storage can be unavailable. */ }
let state: VoiceState = { enabled, owner: null, phase: 'idle', error: '' };
const listeners = new Set<() => void>();
let player: HTMLAudioElement | null = null;
let version = 0;
let currentText = '';
let cleanup: (() => void) | null = null;

export const getCompanionVoice = () => state;
export function subscribeCompanionVoice(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function publish(update: Partial<VoiceState>) { state = { ...state, ...update }; listeners.forEach(listener => listener()); }
export function normalizeNarration(text: string) { return text.normalize('NFC').replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim(); }

export function stopCompanionVoice(owner?: VoiceOwner) {
  if (owner && state.owner !== owner) return;
  version++;
  cleanup?.(); cleanup = null;
  if (player) { player.onplaying = player.onended = player.onerror = null; player.pause(); }
  currentText = '';
  publish({ phase: 'idle', owner: null, error: '' });
}

export function setCompanionVoiceEnabled(value: boolean) {
  if (!value) stopCompanionVoice();
  try { localStorage.setItem(preferenceKey, value ? 'on' : 'off'); } catch { /* Keep session preference. */ }
  publish({ enabled: value });
}

// Reuse one media element: an unmute tap authorizes subsequent guide and feedback audio.
function audioPlayer() {
  if (!player) {
    player = document.createElement('audio');
    player.hidden = true;
    player.dataset.companionAudio = 'true';
    player.setAttribute('playsinline', '');
    player.preload = 'auto';
    document.body.appendChild(player);
  }
  return player;
}

export function speakCompanion(text: string, owner: VoiceOwner) {
  if (!state.enabled) return;
  const normalized = normalizeNarration(text);
  if (normalized === currentText && state.owner === owner && ['loading', 'speaking'].includes(state.phase)) return;
  stopCompanionVoice();
  const request = version;
  currentText = normalized;
  publish({ owner, phase: 'loading', error: '' });
  const active = () => request === version;
  const fail = (error: string) => { if (active()) publish({ phase: 'error', error }); };
  let fallbackStarted = false;
  const fallback = () => {
    if (!active() || fallbackStarted) return;
    fallbackStarted = true;
    if (player) { player.onplaying = player.onended = player.onerror = null; player.pause(); }
    cleanup?.(); cleanup = null;
    if (!active()) return;
    // Device speech voices vary by platform and do not match this character.
    // Keep the visible bubble and offer replay if its recording cannot load.
    fail('تعذّر تحميل الصوت العربي. تحقّق من الاتصال واضغط أيقونة الصوت لإعادة المحاولة.');
  };
  const url = (recordings as Record<string, string>)[normalized];
  if (!url) { fallback(); return; }
  const audio = audioPlayer();
  audio.src = url;
  audio.volume = 1;
  audio.muted = false;
  audio.onplaying = () => { if (active()) { cleanup?.(); cleanup = null; publish({ phase: 'speaking' }); } };
  audio.onended = () => { if (active()) publish({ phase: 'idle' }); };
  audio.onerror = () => { if (active()) fallback(); };
  const timer = window.setTimeout(() => {
    if (active() && state.phase === 'loading') { audio.onerror = null; audio.pause(); fallback(); }
  }, 8000);
  cleanup = () => window.clearTimeout(timer);
  // Called directly by unmute; don't move this into an effect or await a fetch first.
  void audio.play().catch(error => {
    if (!active()) return;
    if (error?.name === 'NotAllowedError') { cleanup?.(); cleanup = null; fail('اضغط أيقونة الصوت للسماح بالتشغيل.'); }
    else fallback();
  });
}

export function toggleCompanionVoice(text: string, owner: VoiceOwner) {
  if (state.enabled && state.phase !== 'error') setCompanionVoiceEnabled(false);
  else { setCompanionVoiceEnabled(true); speakCompanion(text, owner); }
}
