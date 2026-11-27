import React from 'react';
import { MapPin, ChevronDown, Sunrise, Sun, Sunset, Moon, Settings2 } from 'lucide-react';
import { FeatureHelp } from './guide/FeatureHelp';
import type { CalculatedPrayers, PrayerSettings } from '../utils/prayerTimes';
import './prayerClockHero.css';

const icons = { fajr: Sunrise, sunrise: Sunrise, dhuhr: Sun, asr: Sun, maghrib: Sunset, isha: Moon };

/** Original vector landscape: no external image requests or copied artwork. */
function MosqueLandscape() {
  return <svg className="prayer-landscape" viewBox="0 0 640 300" fill="none" aria-hidden="true">
    <path d="M0 250Q120 205 260 250T640 238V300H0Z" fill="currentColor" opacity=".06" />
    <g fill="currentColor" opacity=".11">
      <path d="M206 236V198H434V236ZM225 198C225 158 257 151 270 124C283 151 315 158 315 198ZM331 198C331 174 350 167 359 150C368 167 387 174 387 198Z" />
      <path d="M270 124V111H272V124ZM357 150V139H359V150ZM177 236V126H193V236ZM172 126H198L185 99ZM181 99V66H189V99L185 53ZM449 236V149H463V236ZM444 149H468L456 124ZM453 124V96H459V124L456 83Z" />
    </g>
    <g stroke="currentColor" opacity=".19" strokeWidth="2">
      <path d="M244 236V214Q255 194 266 214V236M287 236V214Q298 194 309 214V236M343 236V216Q354 198 365 216V236M386 236V216Q397 198 408 216V236" />
      <path d="M66 255Q102 208 86 158M86 190Q62 190 56 172Q79 169 86 190M88 208Q114 203 117 185Q93 185 88 208M80 227Q54 224 48 205Q71 205 80 227M75 240Q103 240 111 223Q85 219 75 240" />
      <path d="M509 138q8-10 16 0q8-10 16 0M549 113q6-8 12 0q6-8 12 0M484 112q5-7 10 0q5-7 10 0" />
    </g>
    <path d="M100 266H540" stroke="currentColor" opacity=".12" />
  </svg>;
}

export function PrayerClockHero({ data, settings, locating, onLocation }: {
  data: CalculatedPrayers; settings: PrayerSettings; locating: boolean; onLocation: () => void;
}) {
  return <section className="prayer-clock" dir="rtl" aria-label="أوقات الصلاة">
    <div className="prayer-clock-meta">
      <span className="prayer-date"><Moon size={15} />{data.hijriDate}</span>
      <button type="button" onClick={onLocation} className="prayer-location" aria-label="تغيير موقع أوقات الصلاة"><MapPin size={15} /><span>{locating ? 'تحديد الموقع…' : settings.cityName}</span><ChevronDown size={13} /></button>
    </div>
    <div className="prayer-sanctuary">
      <svg className="prayer-arch" viewBox="0 0 600 420" preserveAspectRatio="none" aria-hidden="true"><path d="M12 408V187C12 112 101 122 135 91C187 43 256 49 300 10C344 49 413 43 465 91C499 122 588 112 588 187V408" /></svg>
      <div className="prayer-clock-heading"><span>لحظة سكينة</span><FeatureHelp topic="prayerTimes" /></div>
      <div className="prayer-countdown">
        <p>{data.nextPrayer?.id === 'sunrise' ? 'الشروق القادم' : 'الصلاة القادمة'}</p>
        <h2>{data.nextPrayer?.name || 'أوقات الصلاة'}</h2>
        <p className="prayer-countdown-label">{data.nextPrayer?.id === 'sunrise' ? 'متبقٍ على الشروق' : 'متبقٍ على الأذان'}</p>
        <div className="prayer-countdown-time" dir="ltr" aria-label={`متبقٍ ${data.timeRemaining}`}>{data.timeRemaining}</div>
        <span className="prayer-at">موعدها <bdi>{data.nextPrayer?.formattedTime}</bdi><span aria-hidden="true"> • </span>بتوقيت جهازك</span>
      </div>
      <MosqueLandscape />
      <button type="button" className="prayer-location-settings" onClick={onLocation}><Settings2 size={16} />الموقع وأوقات الصلاة</button>
    </div>
    <div className="prayer-times-strip" aria-label="مواقيت اليوم">
      {data.prayers.map(prayer => {
        const Icon = icons[prayer.id];
        return <div key={prayer.id} className={`prayer-time-item ${prayer.isNext ? 'is-next' : ''}`} aria-current={prayer.isNext ? 'time' : undefined}>
          <Icon size={23} className={`prayer-icon-${prayer.id}`} strokeWidth={1.6} />
          <span>{prayer.name}</span><bdi>{prayer.formattedTime}</bdi>
          {prayer.isNext && <span className="prayer-next-dot" aria-label="القادمة" />}
        </div>;
      })}
    </div>
  </section>;
}
