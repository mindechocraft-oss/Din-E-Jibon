import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Clock,
  BookOpen,
  Calendar,
  Compass,
  Calculator,
  CheckSquare,
  HelpCircle,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  Play,
} from 'lucide-react';
import { BANGLADESH_DISTRICTS, type DistrictInfo } from '../data/districts';
import { DAILY_AYAHS, SAHIH_HADITHS } from '../data/duaHadithData';
import {
  formatCountdownBn,
  formatEnglishDateBn,
  formatTime24To12Bn,
  getBengaliCalendarDate,
  toBnDigits,
} from '../lib/bengali';
import { getCurrentAndNextWaqt, type PrayerTimingsData } from '../services/aladhan';
import type { LastReadState } from '../lib/firebase';

export type AppTab =
  | 'dashboard'
  | 'prayer'
  | 'quran'
  | 'ramadan'
  | 'dua'
  | 'calculators'
  | 'quiz'
  | 'tracker'
  | 'account';

interface DashboardPageProps {
  district: DistrictInfo;
  onChangeDistrict: (id: string) => void;
  timings: PrayerTimingsData | null;
  timingsLoading: boolean;
  timingsError: string | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate: (tab: AppTab) => void;
  lastRead: LastReadState | null;
  onPlayDefaultSurah: () => void;
  todayAmalCompleted: number;
  todayAmalTotal: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  district,
  onChangeDistrict,
  timings,
  timingsLoading,
  timingsError,
  darkMode,
  onToggleDarkMode,
  onNavigate,
  lastRead,
  onPlayDefaultSurah,
  todayAmalCompleted,
  todayAmalTotal,
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const ayahOfDay = DAILY_AYAHS[dayOfYear % DAILY_AYAHS.length];
  const hadithOfDay = SAHIH_HADITHS[dayOfYear % SAHIH_HADITHS.length];

  const waqtInfo = timings ? getCurrentAndNextWaqt(timings, now) : null;

  const quickFeatures: {
    tab: AppTab;
    title: string;
    desc: string;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      tab: 'prayer',
      title: 'নামাজ ও কিবলা',
      desc: '৬৪ জেলার সময়সূচি, মাকরুহ সময় ও কিবলা কম্পাস',
      icon: <Compass className="w-5 h-5" />,
      accent: 'text-[#047857] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      tab: 'quran',
      title: 'আল-কোরআন মাজিদ',
      desc: '১১৪ সূরা, বাংলা উচ্চারণ, অনুবাদ, তাফসির ও হিফজ',
      icon: <BookOpen className="w-5 h-5" />,
      accent: 'text-[#D97706] dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    },
    {
      tab: 'ramadan',
      title: 'রমজান ও হিজরি',
      desc: '১৯৫০–২০৫০ ক্যালেন্ডার, সেহরি-ইফতার ও ফিদইয়া',
      icon: <Calendar className="w-5 h-5" />,
      accent: 'text-[#047857] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      tab: 'dua',
      title: 'দোয়া, হাদিস ও তাসবিহ',
      desc: 'হিসনুল মুসলিম, ৯৯ নাম, সহিহ বুখারি-মুসলিম',
      icon: <Sparkles className="w-5 h-5" />,
      accent: 'text-[#D97706] dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    },
    {
      tab: 'calculators',
      title: 'ইসলামী ক্যালকুলেটর',
      desc: 'যাকাত, সাদাকাতুল ফিতর ও উত্তরাধিকার হিসাব',
      icon: <Calculator className="w-5 h-5" />,
      accent: 'text-[#047857] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      tab: 'quiz',
      title: 'দৈনিক ইসলামিক কুইজ',
      desc: 'প্রতিদিন ৫টি প্রশ্ন, ৩০ সেকেন্ড টাইমার ও লিডারবোর্ড',
      icon: <HelpCircle className="w-5 h-5" />,
      accent: 'text-[#D97706] dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    },
    {
      tab: 'tracker',
      title: 'আমল ও কাজা ট্র্যাকার',
      desc: `আজকের আমল: ${toBnDigits(todayAmalCompleted)}/${toBnDigits(todayAmalTotal)} সম্পন্ন`,
      icon: <CheckSquare className="w-5 h-5" />,
      accent: 'text-[#047857] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner Split */}
      <section className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#047857] dark:text-emerald-400">
                  আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ
                </p>
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  aria-label="ডার্ক বা লাইট মোড পরিবর্তন করুন"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                  {darkMode ? 'লাইট মোড' : 'ডার্ক মোড'}
                </button>
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-snug [text-wrap:balance]">
                দীন-ই-জীবন: আপনার প্রতিদিনের ইসলামী সঙ্গী
              </h1>

              {/* Triple Calendar Line (Clean Unboxed Metadata) */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <span>{formatEnglishDateBn(now)}</span>
                <span aria-hidden="true">·</span>
                <span>{getBengaliCalendarDate(now)}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#D97706] dark:text-amber-400">
                  {timings ? timings.hijriFormattedBn : 'হিজরি তারিখ লোড হচ্ছে...'}
                </span>
              </div>
            </div>

            {/* District Selector + Live Countdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label
                  htmlFor="dashboard-district"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#047857] dark:text-emerald-400" />
                  আপনার জেলা নির্বাচন করুন
                </label>
                <select
                  id="dashboard-district"
                  value={district.id}
                  onChange={(e) => onChangeDistrict(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameBn} ({d.divisionBn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900 p-3.5 flex flex-col justify-center">
                {timingsLoading && !waqtInfo ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">সময় গণনা হচ্ছে...</p>
                ) : timingsError && !waqtInfo ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{timingsError}</p>
                ) : waqtInfo ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>বর্তমান: <strong className="text-[#047857] dark:text-emerald-400">{waqtInfo.currentWaqt}</strong></span>
                      <span>পরবর্তী: {waqtInfo.nextPrayerName}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white tracking-tight">
                        {formatCountdownBn(waqtInfo.remainingMs)}
                      </span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {waqtInfo.nextPrayerTimeDisplay}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Sehri / Iftar & Audio/Last-Read Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">সেহরির শেষ সময়: </span>
                  <strong className="tabular-nums text-slate-900 dark:text-slate-100">
                    {timings ? formatTime24To12Bn(timings.imsak) : '—'}
                  </strong>
                </div>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">ইফতারের সময়: </span>
                  <strong className="tabular-nums text-[#D97706] dark:text-amber-400">
                    {timings ? formatTime24To12Bn(timings.maghrib) : '—'}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lastRead && (
                  <button
                    type="button"
                    onClick={() => onNavigate('quran')}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    পড়া চালিয়ে যান: {lastRead.surahNameBn} ({toBnDigits(lastRead.ayahNumber)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={onPlayDefaultSurah}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#047857] hover:bg-emerald-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" />
                  সূরা আর-রহমান শুনুন
                </button>
              </div>
            </div>
          </div>

          {/* Right Mosque Visual with Measured Scrim */}
          <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-emerald-950">
            <img
              src="/src/assets/images/hero_masjid_dawn_1795721910992.jpg"
              alt="ভোরের আলোয় শান্ত মসজিদের আঙিনা"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
              <p className="text-xs text-amber-300 font-medium">
                {district.nameBn} জেলার নামাজের সময়সূচি
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-white">
                {timings ? (
                  [
                    { label: 'ফজর', time: timings.fajr },
                    { label: 'যোহর', time: timings.dhuhr },
                    { label: 'আসর', time: timings.asr },
                    { label: 'মাগরিব', time: timings.maghrib },
                    { label: 'এশা', time: timings.isha },
                    { label: 'সূর্যোদয়', time: timings.sunrise },
                  ].map((item) => (
                    <div key={item.label} className="bg-black/40 backdrop-blur-sm rounded-xl px-2.5 py-2 border border-white/10">
                      <p className="text-[11px] text-slate-300">{item.label}</p>
                      <p className="text-xs font-semibold tabular-nums mt-0.5">
                        {formatTime24To12Bn(item.time)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="col-span-3 text-xs text-slate-200">নামাজের সময়সূচি লোড হচ্ছে...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ayah of the Day & Hadith of the Day */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#047857] dark:text-emerald-400">আজকের আয়াত</span>
              <span>
                {ayahOfDay.surahNameBn} · {ayahOfDay.ayahRef}
              </span>
            </div>
            <p className="mt-4 font-arabic text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 text-right">
              {ayahOfDay.arabic}
            </p>
            <p className="mt-3 text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              “{ayahOfDay.meaningBn}”
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate('quran')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#047857] dark:text-emerald-400 hover:underline"
            >
              সম্পূর্ণ কোরআন পড়ুন
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </article>

        <article className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#D97706] dark:text-amber-400">আজকের হাদিস</span>
              <span>
                {hadithOfDay.book} · {hadithOfDay.hadithNumber}
              </span>
            </div>
            <p className="mt-4 font-arabic text-xl sm:text-2xl text-slate-900 dark:text-slate-100 text-right">
              {hadithOfDay.arabic}
            </p>
            <p className="mt-3 text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              “{hadithOfDay.textBn}”
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              বর্ণনায়: {hadithOfDay.narratorBn}
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate('dua')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] dark:text-amber-400 hover:underline"
            >
              আরও হাদিস ও দোয়া দেখুন
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </article>
      </section>

      {/* Quick Feature Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            দ্রুত ব্যবহারযোগ্য বিভাগসমূহ
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            সব ফিচার এক জায়গায়
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickFeatures.map((card) => (
            <button
              key={card.tab}
              type="button"
              onClick={() => onNavigate(card.tab)}
              className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-[#047857] dark:hover:border-emerald-500 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.accent}`}>
                {card.icon}
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#047857] dark:group-hover:text-emerald-400">
                {card.title}
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {card.desc}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
