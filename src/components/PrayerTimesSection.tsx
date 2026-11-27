import { PrayerClockHero } from './PrayerClockHero';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Compass,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  calculateTodayPrayerTimes,
  getPrayerSettings,
  hasSavedPrayerSettings,
  savePrayerSettings,
  PrayerSettings,
  CalculatedPrayers,
  POPULAR_CITIES,
  CityOption
} from '../utils/prayerTimes';
import { TactileButton } from './ui/MotionPrimitives';

export const PrayerTimesSection: React.FC = () => {
  const [settings, setSettings] = useState<PrayerSettings>(() => getPrayerSettings());
  const [prayersData, setPrayersData] = useState<CalculatedPrayers>(() =>
    calculateTodayPrayerTimes(new Date(), settings)
  );
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Live timer tick every second for countdown and active prayer update
  useEffect(() => {
    const timer = setInterval(() => {
      setPrayersData(calculateTodayPrayerTimes(new Date(), settings));
    }, 1000);
    return () => clearInterval(timer);
  }, [settings]);

  // Handle GPS location
  const handleUseGps = useCallback((automatic = false) => {
    if (!navigator.geolocation) {
      if (!automatic) setGpsError('تحديد الموقع الجغرافي غير مدعوم في هذا المتصفح');
      return;
    }

    setLocatingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newSettings: PrayerSettings = {
          ...settings,
          useGps: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          cityName: 'موقعي الحالي (GPS)'
        };
        savePrayerSettings(newSettings);
        setSettings(newSettings);
        setPrayersData(calculateTodayPrayerTimes(new Date(), newSettings));
        setLocatingGps(false);
        setIsCityModalOpen(false);
      },
      () => {
        if (!automatic) setGpsError('تعذر تحديد الموقع، يرجى تفعيل إذن الوصول أو اختيار المدينة يدوياً');
        setLocatingGps(false);
      },
      { timeout: 10000 }
    );
  }, [settings]);

  // First visit: request the device location once so prayer times are useful
  // immediately. A manual city choice is persisted and is never overwritten.
  useEffect(() => {
    if (hasSavedPrayerSettings()) return;
    try {
      const attemptKey = 'qada_prayer_location_auto_attempted';
      if (localStorage.getItem(attemptKey)) return;
      localStorage.setItem(attemptKey, '1');
    } catch { /* fall back to the default city and manual picker */ }
    handleUseGps(true);
  }, [handleUseGps]);

  // Handle manual city selection
  const handleSelectCity = (city: CityOption) => {
    const newSettings: PrayerSettings = {
      ...settings,
      cityId: city.id,
      cityName: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      useGps: false
    };
    savePrayerSettings(newSettings);
    setSettings(newSettings);
    setPrayersData(calculateTodayPrayerTimes(new Date(), newSettings));
    setIsCityModalOpen(false);
  };

  // Filter cities for search
  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return POPULAR_CITIES;
    const q = citySearchQuery.trim().toLowerCase();
    return POPULAR_CITIES.filter(
      (c) => c.name.includes(q) || c.country.includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [citySearchQuery]);

  return (
    <div className="space-y-4">
      <PrayerClockHero data={prayersData} settings={settings} locating={locatingGps} onLocation={() => setIsCityModalOpen(true)} />

      {/* ═══════ CITY SELECTION MODAL ═══════ */}
      <AnimatePresence>
        {isCityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#1C2820] border border-[#C6A15B]/30 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#C6A15B]/15 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#C6A15B]" />
                  <h3 className="text-base font-bold text-[#1D211E] dark:text-[#F6F1E7] font-spiritual-serif">
                    اختيار موقع أوقات الصلاة
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(false)}
                  className="p-1 text-[#7E8C7F] hover:text-black dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* GPS Button */}
              <TactileButton
                onClick={() => handleUseGps(false)}
                disabled={locatingGps}
                className="w-full py-3 px-4 rounded-2xl bg-[#26352A] dark:bg-[#C6A15B] text-white dark:text-[#18231C] font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Compass className={`w-4 h-4 ${locatingGps ? 'animate-spin' : ''}`} />
                <span>{locatingGps ? 'جاري تحديد موقعك الجغرافي...' : 'استخدام موقعي الحالي تلقائياً (GPS)'}</span>
              </TactileButton>

              {gpsError && (
                <p className="text-[11px] text-[#9E3A3A] text-center">{gpsError}</p>
              )}

              {/* City Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  placeholder="ابحث عن مدينة أو ولاية تونسية..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#18231C] border border-[#C6A15B]/20 text-xs text-[#1D211E] dark:text-[#F6F1E7] focus:outline-none focus:border-[#C6A15B]"
                />
              </div>

              {/* Cities List */}
              <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 max-h-60">
                <p className="text-[11px] font-bold text-[#7E8C7F] mb-1">المدن والولايات المتاحة:</p>
                {filteredCities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className={`w-full p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      settings.cityId === city.id
                        ? 'bg-[#C6A15B]/20 text-[#C6A15B] font-bold'
                        : 'bg-white/60 dark:bg-[#18231C]/60 text-[#26352A] dark:text-[#E8DDD0] hover:bg-[#C6A15B]/10'
                    }`}
                  >
                    <span>{city.name}</span>
                    <span className="text-[10px] text-[#7E8C7F]">{city.country}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
