import React, { useState, useEffect, useMemo } from 'react';
import {
  Sunrise,
  Sun,
  SunMedium,
  Sunset,
  Moon,
  Clock,
  MapPin,
  Compass,
  Settings2,
  ChevronDown,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  calculateTodayPrayerTimes,
  getPrayerSettings,
  savePrayerSettings,
  PrayerSettings,
  CalculatedPrayers,
  POPULAR_CITIES,
  CityOption
} from '../utils/prayerTimes';
import { StarEightPoint } from './landing/IslamicOrnaments';
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
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsError('تحديد الموقع الجغرافي غير مدعوم في هذا المتصفح');
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
        setGpsError('تعذر تحديد الموقع، يرجى تفعيل إذن الوصول أو اختيار المدينة يدوياً');
        setLocatingGps(false);
      },
      { timeout: 10000 }
    );
  };

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

  const getPrayerIcon = (id: string) => {
    switch (id) {
      case 'fajr':
        return <Sunrise className="w-4 h-4" />;
      case 'sunrise':
        return <Sun className="w-4 h-4" />;
      case 'dhuhr':
        return <SunMedium className="w-4 h-4" />;
      case 'asr':
        return <SunMedium className="w-4 h-4" />;
      case 'maghrib':
        return <Sunset className="w-4 h-4" />;
      case 'isha':
      default:
        return <Moon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* ═══════ PRAYER TIMES HORIZONTAL TIMELINE CONTAINER ═══════ */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-white/90 dark:bg-[#18231C]/90 border border-[#C6A15B]/25 shadow-lg shadow-black/5 backdrop-blur-sm">
        {/* Top Bar: Section Title + Location Picker Pill */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C6A15B]/15 text-[#C6A15B] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
                أوقات الصلاة
              </h2>
              <p className="text-[11px] text-[#7E8C7F]">
                حساب فلكي دقيق • موثق
              </p>
            </div>
          </div>

          {/* Location Selector Pill */}
          <button
            type="button"
            onClick={() => setIsCityModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/15 border border-[#C6A15B]/20 text-xs font-semibold text-[#26352A] dark:text-[#E8DDD0] transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>{settings.cityName}</span>
            <ChevronDown className="w-3 h-3 text-[#7E8C7F]" />
          </button>
        </div>

        {/* Highlighted Next Prayer Banner with Live Countdown */}
        {prayersData.nextPrayer && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-l from-[#26352A] to-[#1F2E24] text-[#F6F1E7] border border-[#C6A15B]/30 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#18231C] border border-[#C6A15B]/30 text-[#C6A15B] flex items-center justify-center">
                {getPrayerIcon(prayersData.nextPrayer.id)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C6A15B]/25 text-[#C6A15B]">
                    الصلاة القادمة
                  </span>
                  <span className="text-xs text-[#A9B7A3] font-mono">
                    {prayersData.nextPrayer.formattedTime}
                  </span>
                </div>
                <h3 className="text-base font-bold font-spiritual-serif text-white mt-0.5">
                  صلاة {prayersData.nextPrayer.name}
                </h3>
              </div>
            </div>

            {/* Live Ticking Countdown */}
            <div className="text-left">
              <span className="text-[10px] text-[#A9B7A3] block">متبقي:</span>
              <span className="text-base sm:text-lg font-bold font-mono text-[#C6A15B] tracking-wider">
                {prayersData.timeRemaining}
              </span>
            </div>
          </div>
        )}

        {/* Continuous Horizontal Prayer Timeline */}
        <div className="relative pt-2">
          {/* Connecting Track */}
          <div className="absolute top-7 inset-x-4 h-0.5 bg-[#C6A15B]/20 dark:bg-white/10 -z-0" />

          <div className="grid grid-cols-6 gap-1 sm:gap-2 relative z-10">
            {prayersData.prayers.map((prayer) => {
              const isNext = prayer.isNext;
              const isCurrent = prayer.isCurrent;

              return (
                <div
                  key={prayer.id}
                  className={`flex flex-col items-center text-center p-2 rounded-2xl transition-all duration-200 ${
                    isNext
                      ? 'bg-[#C6A15B]/15 border border-[#C6A15B]/40 shadow-xs scale-105'
                      : isCurrent
                      ? 'bg-black/5 dark:bg-white/5 border border-transparent'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {/* Indicator Dot on Timeline */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                      isNext
                        ? 'bg-[#C6A15B] text-white shadow-sm ring-4 ring-[#C6A15B]/20'
                        : isCurrent
                        ? 'bg-[#26352A] dark:bg-[#E8DDD0] text-white dark:text-[#18231C]'
                        : 'bg-white dark:bg-[#18231C] border border-[#C6A15B]/30 text-[#7E8C7F]'
                    }`}
                  >
                    {getPrayerIcon(prayer.id)}
                  </div>

                  {/* Prayer Name */}
                  <span
                    className={`text-[11px] sm:text-xs font-bold leading-tight ${
                      isNext
                        ? 'text-[#C6A15B]'
                        : isCurrent
                        ? 'text-[#1D211E] dark:text-[#F6F1E7]'
                        : 'text-[#7E8C7F] dark:text-[#A9B7A3]'
                    }`}
                  >
                    {prayer.name}
                  </span>

                  {/* Prayer Time in Western digits */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-mono mt-1 ${
                      isNext
                        ? 'font-bold text-[#1D211E] dark:text-[#F6F1E7]'
                        : 'text-[#7E8C7F]'
                    }`}
                  >
                    {prayer.formattedTime}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
                onClick={handleUseGps}
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
