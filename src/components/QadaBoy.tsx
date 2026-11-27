import React from 'react';
import { CompanionEmotion } from '../services/companionFeedback';

export function QadaBoy({ emotion = 'calm', reaction = 0, speaking = false, reducedMotion = false, pose = 'standing' }: { emotion?: CompanionEmotion; reaction?: number; speaking?: boolean; reducedMotion?: boolean; pose?: 'standing'|'peek' }) {
  const joyful = emotion === 'happy' || emotion === 'celebrate';
  const peeking = pose === 'peek';
  return (
      <svg viewBox="0 0 140 168" fill="none" className="h-full w-full">
        <g transform={peeking ? 'translate(-33 1) rotate(9 70 130)' : undefined}>
        <>
        <ellipse cx="70" cy="157" rx="39" ry="6" fill="#13241c" opacity=".13" />
        <path d="M46 148h19v7c-4 5-23 5-24 0zM77 148h19l5 7c-1 5-20 5-24 0z" fill="#534139" />
        <rect x="61" y="85" width="19" height="22" rx="8" fill="#EAB68A" />
        <path d="M45 98Q70 90 95 98l8 50Q71 161 37 148z" fill="#FAF2DC" stroke="#D5C6A5" strokeWidth="2" />
        <path d="m60 96 11 9 11-9" stroke="#D5C6A5" strokeWidth="2" strokeLinejoin="round" />
        <path d="M66 98h9v36h-9z" fill="#E6D8B8" /><circle cx="71" cy="111" r="2" fill="#B28A44" /><circle cx="71" cy="123" r="2" fill="#B28A44" />
        <path d="M47 99l-15 24 11 7 17-21" fill="#FAF2DC" stroke="#D5C6A5" strokeWidth="2" />
        <ellipse cx="33" cy="129" rx="8" ry="9" fill="#D99D71" />
        <g className={reaction && !reducedMotion ? 'qada-companion-wave' : ''} key={reaction}>
          <path d="M88 101q13 1 18-20l10 5q-2 31-24 32" fill="#FAF2DC" stroke="#D5C6A5" strokeWidth="2" />
          <path d="M108 86q-9-10-3-15l5 4V60q4-6 7 0v11q5-7 8-2l-1 15q-6 12-16 2" fill="#D99D71" />
        </g>
        </>
        <g>
        <ellipse cx="40" cy="66" rx="7" ry="10" fill="#D99D71" /><ellipse cx="100" cy="66" rx="7" ry="10" fill="#D99D71" />
        <rect x="36" y="30" width="69" height="70" rx="33" fill="#F0BE94" />
        <path d="M39 49q-3-29 31-29t32 29q-27-11-63 0" fill="#315343" />
        <path d="M40 39q30-10 60 0v10q-30-9-60 0z" fill="#416653" />
        <path d="m53 39 4-4 4 4-4 4zm14-2 4-4 4 4-4 4zm14 2 4-4 4 4-4 4z" fill="#D5B56F" />
        {joyful ? <g stroke="#382E28" strokeWidth="3" strokeLinecap="round">
          <path d="M52 67q5-8 10 0M79 67q5-8 10 0" />
          {emotion === 'celebrate' && <path d="m50 58 6-3m29 0 6 3" />}
        </g> : <g>
          <ellipse cx="56" cy="66" rx="5" ry="6.5" fill="#382E28" /><ellipse cx="85" cy="66" rx="5" ry="6.5" fill="#382E28" />
          <circle cx="57.5" cy="63.5" r="1.8" fill="#FFFDF7" /><circle cx="86.5" cy="63.5" r="1.8" fill="#FFFDF7" />
          <circle cx="54.5" cy="68.5" r=".8" fill="#D9B18C" /><circle cx="83.5" cy="68.5" r=".8" fill="#D9B18C" />
          {emotion === 'curious' && <path d="M79 55q5-3 10 0" stroke="#79563C" strokeWidth="2" strokeLinecap="round" />}
        </g>}
        <ellipse cx="47" cy="77" rx="7.5" ry="4.5" fill="#E68F81" opacity={joyful ? .7 : .5} /><ellipse cx="94" cy="77" rx="7.5" ry="4.5" fill="#E68F81" opacity={joyful ? .7 : .5} />
        <g className={speaking && !reducedMotion ? 'qada-companion-mouth' : ''}>
          {joyful ? <><path d="M61 79h20q-1 15-10 15T61 79" fill="#85452F" /><path d="M63 80h16l-2 4H65z" fill="#FFF8ED" /><path d="M66 90q5-4 10 0" stroke="#E69383" strokeWidth="3" strokeLinecap="round" /></> : <path d="M63 81q8 10 16 0" stroke="#965C43" strokeWidth="2.5" strokeLinecap="round" />}
        </g>
        </g>
        <path d="M70 69v5h3" stroke="#C68F66" strokeWidth="2" strokeLinecap="round" />
        </g>
        {peeking && <g aria-label="hand on the screen edge">
          <path d="M0 107q7-6 12 0l5 4q5 7-1 14l-4 6H0Z" fill="#D99D71"/>
          <path d="M1 109h8q6 0 6 4t-6 4H1m0 0h10q5 0 4 4t-6 3H1m0 0h8q5 0 4 4t-8 3H1" fill="#EAB68A" stroke="#BD805B" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M11 108q7 0 8 7" stroke="#F3C79F" strokeWidth="3" strokeLinecap="round"/>
        </g>}
        {reaction > 0 && <g className="qada-companion-stars" fill="#D5B56F"><path d="m19 37 2-7 2 7 7 2-7 2-2 7-2-7-7-2zM119 25l2-6 2 6 6 2-6 2-2 6-2-6-6-2z" /></g>}
      </svg>
  );
}
