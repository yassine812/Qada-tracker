export type CompanionEmotion = 'calm' | 'curious' | 'focused' | 'happy' | 'celebrate';
export interface CompanionFeedback { message: string; emotion: CompanionEmotion }
export const COMPANION_FEEDBACK = 'qada:companion-feedback';
export const REPLAY_GUIDE = 'qada:replay-guide';
export const GUIDE_OPENED = 'qada:guide-opened';

export function encourageProgress(message: string, milestone = false) {
  window.dispatchEvent(new CustomEvent<CompanionFeedback>(COMPANION_FEEDBACK, {
    detail: { message, emotion: milestone ? 'celebrate' : 'happy' },
  }));
}
