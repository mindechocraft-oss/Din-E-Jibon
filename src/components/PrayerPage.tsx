import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Compass,
  AlertCircle,
  BookOpen,
  Clock,
  Navigation,
} from 'lucide-react';
import {
  BANGLADESH_DISTRICTS,
  calculateDistanceToMakkahKm,
  calculateQiblaBearing,
  type DistrictInfo,
} from '../data/districts';
import { NAMAZ_GUIDE_STEPS, NAMAZ_RAKAAT_TABLE } from '../data/ramadanNamazData';
import { formatTime24To12Bn, toBnDigits } from '../lib/bengali';
import { getCurrentAndNextWaqt, getMakruhTimes, type PrayerTimingsData } from '../services/aladhan';

interface PrayerPageProps {
  district: DistrictInfo;
  onChangeDistrict: (id: string) => void;
  timings: PrayerTimingsData | null;
  loading: boolean;
  error: string | null;
}

export const PrayerPage: React.FC<PrayerPageProps> = ({
  district,
  onChangeDistrict,
  timings,
  loading,
  error,
}) => {
  const [districtSearch, setDistrictSearch] = useState('');
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [compassActive, setCompassActive] = useState(false);
  const [compassNote, setCompassNote] = useState<string | null>(null);

  const qiblaBearing = calculateQiblaBearing(district.lat, district.lng);
  const distanceKm = calculateDistanceToMakkahKm(district.lat, district.lng);
  const waqtInfo = timings ? getCurrentAndNextWaqt(timings) : null;
  const makruhList = timings ? getMakruhTimes(timings) : [];

  const filteredDistricts = BANGLADESH_DISTRICTS.filter(
    (d) =>
      d.nameBn.includes(districtSearch.trim()) ||
      d.nameEn.toLowerCase().includes(districtSearch.trim().toLowerCase()) ||
      d.divisionBn.includes(districtSearch.trim())
  );

  useEffect(() => {
    if (!compassActive) return;
    const handler = (event: DeviceOrientationEvent) => {
      const webkitHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (typeof webkitHeading === 'number') {
        setCompassHeading(webkitHeading);
      } else if (typeof event.alpha === 'number') {
        setCompassHeading((360 - event.alpha) % 360);
      }
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [compassActive]);

  const enableLiveCompass = async () => {
    setCompassNote(null);
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (DOE && typeof DOE.requestPermission === 'function') {
      try {
        const perm = await DOE.requestPermission();
        if (perm !== 'granted') {
          setCompassNote('কম্পাস সেন্সর অনুমতি পাওয়া যায়নি; ডিগ্রি নির্দেশক দেখে কিবলা নির্ণয় করুন।');
          return;
        }
      } catch {
        setCompassNote('এই ডিভাইসে লাইভ সেন্সর সাপোর্ট করেনি; স্থির কিবলা দিকনির্দেশনা প্রদর্শিত হচ্ছে।');
        return;
      }
    }
    setCompassActive(true);
    setCompassNote('লাইভ কম্পাস সক্রিয় হয়েছে (ফোন সমতলভাবে ধরুন)।');
  };

  const arrowRotation =
    compassHeading !== null ? (qiblaBearing - compassHeading + 360) % 360 : qiblaBearing;

  return (
    <div className="space-y-8">
      {/* Header & 64 District Selector */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#047857] dark:text-emerald-400">
              আলাধান (Aladhan) লাইভ সময়সূচি
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              বাংলাদেশের ৬৪ জেলার নামাজের সময় ও কিবলা
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              বর্তমান নির্বাচিত জেলা: <strong className="text-slate-900 dark:text-white">{district.nameBn}</strong> ({district.divisionBn})
            </p>
          </div>

          <div className="w-full lg:w-80 space-y-2">
            <input
              type="search"
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              placeholder="জেলা বা বিভাগ খুঁজুন..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
            />
            <select
              aria-label="জেলা নির্বাচন করুন"
              value={district.id}
              onChange={(e) => onChangeDistrict(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
            >
              {filteredDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameBn} — {d.divisionBn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 64 District Quick Grid Pills/Buttons */}
        <div className="mt-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#047857]" />
            ৬৪ জেলা তালিকা ({toBnDigits(filteredDistricts.length)}টি জেলা প্রদর্শিত)
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
            {filteredDistricts.map((d) => {
              const active = d.id === district.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onChangeDistrict(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#047857] text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#047857]'
                  }`}
                >
                  {d.nameBn}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Prayer Timings Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#047857] dark:text-emerald-400" />
              আজকের ওয়াক্তসমূহ ({district.nameBn})
            </h2>
            {timings && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {timings.hijriFormattedBn}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-sm">
              {error}
            </div>
          ) : waqtInfo ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {waqtInfo.schedule.map((item) => {
                const isNext = item.nameBn === waqtInfo.nextPrayerName;
                return (
                  <div
                    key={item.key}
                    className={`rounded-xl p-4 border transition-colors ${
                      isNext
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#047857] dark:border-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {item.nameBn}
                      </span>
                      {isNext && (
                        <span className="text-[11px] font-semibold text-[#047857] dark:text-emerald-400">
                          পরবর্তী
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {item.displayTime}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Makruh / Forbidden times */}
          {makruhList.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-[#D97706] dark:text-amber-400 flex items-center gap-1.5 mb-3">
                <AlertCircle className="w-4 h-4" />
                নামাজের নিষিদ্ধ ও মাকরুহ সময়
              </h3>
              <div className="space-y-2.5">
                {makruhList.map((m) => (
                  <div
                    key={m.title}
                    className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {m.title}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-[#D97706] dark:text-amber-400">
                        {m.range}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{m.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Qibla Direction Compass */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#047857] dark:text-emerald-400" />
              কিবলা দিকনির্দেশনা ({district.nameBn})
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              উত্তর দিক থেকে পশ্চিম দিকে {toBnDigits(qiblaBearing)}° কোণে কাবা শরীফের অবস্থান
            </p>
          </div>

          <div className="my-6 flex flex-col items-center justify-center">
            <div className="relative w-52 h-52 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
              <span className="absolute top-2.5 text-xs font-bold text-slate-500">উত্তর</span>
              <span className="absolute bottom-2.5 text-xs font-bold text-slate-500">দক্ষিণ</span>
              <span className="absolute left-3 text-xs font-bold text-slate-500">পশ্চিম</span>
              <span className="absolute right-3 text-xs font-bold text-slate-500">পূর্ব</span>

              <div
                className="w-36 h-36 flex items-center justify-center transition-transform duration-300"
                style={{ transform: `rotate(${arrowRotation}deg)` }}
              >
                <div className="flex flex-col items-center">
                  <Navigation className="w-10 h-10 text-[#047857] dark:text-emerald-400 fill-current" />
                  <span className="mt-1 text-[11px] font-bold text-[#D97706]">কাবা</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {toBnDigits(qiblaBearing)}° কিবলা কোণ
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                মক্কা মুকাররমা থেকে দূরত্ব: প্রায় {toBnDigits(distanceKm.toLocaleString('en-IN'))} কি.মি.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={enableLiveCompass}
              className="w-full min-h-[44px] rounded-xl bg-[#047857] hover:bg-emerald-800 text-white text-sm font-semibold transition-colors"
            >
              {compassActive ? 'লাইভ কম্পাস সক্রিয় রয়েছে' : 'মোবাইল লাইভ কম্পাস চালু করুন'}
            </button>
            {compassNote && (
              <p className="text-xs text-center text-slate-600 dark:text-slate-400">{compassNote}</p>
            )}
          </div>
        </div>
      </section>

      {/* Namaz Learning Guide & Rakaat Table */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#047857] dark:text-emerald-400" />
            সহজ বাংলায় নামাজ শেখার নির্দেশনা
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            ওযু থেকে সালাম ফেরানো পর্যন্ত ধারাবাহিক নিয়ম ও পাঁচ ওয়াক্তের রাকাত তালিকা
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAMAZ_GUIDE_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-4"
            >
              <span className="text-xs font-bold text-[#047857] dark:text-emerald-400">
                ধাপ {toBnDigits(item.step)}
              </span>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4 font-semibold">ওয়াক্ত</th>
                <th className="py-3 pr-4 font-semibold">পূর্ববর্তী সুন্নাত</th>
                <th className="py-3 pr-4 font-semibold">ফরজ</th>
                <th className="py-3 pr-4 font-semibold">পরবর্তী সুন্নাত / নফল / বিতর</th>
                <th className="py-3 font-semibold text-right">মোট রাকাত</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {NAMAZ_RAKAAT_TABLE.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-bold text-slate-900 dark:text-slate-100">{row.name}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{row.sunnatBefore}</td>
                  <td className="py-3 pr-4 font-semibold text-[#047857] dark:text-emerald-400">{row.fard}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{row.sunnatAfter}</td>
                  <td className="py-3 font-bold tabular-nums text-right text-slate-900 dark:text-slate-100">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
