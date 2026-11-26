import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, CheckCircle2, XCircle, Calculator, Info } from 'lucide-react';
import { BANGLADESH_DISTRICTS, type DistrictInfo } from '../data/districts';
import { RAMADAN_GUIDE } from '../data/ramadanNamazData';
import { formatBnNumber, toBnDigits } from '../lib/bengali';
import {
  fetchRamadanCalendarForGregorianYear,
  type RamadanDayItem,
} from '../services/aladhan';
import ramadanCrescentSky from '../assets/images/ramadan_crescent_sky_1795721911260.jpg';

interface RamadanCalendarPageProps {
  district: DistrictInfo;
  onChangeDistrict: (id: string) => void;
}

const YEARS = Array.from({ length: 101 }, (_, idx) => 1950 + idx);

export const RamadanCalendarPage: React.FC<RamadanCalendarPageProps> = ({
  district,
  onChangeDistrict,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [hijriYear, setHijriYear] = useState<number | null>(null);
  const [days, setDays] = useState<RamadanDayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kaffarah & Fidyah Calculator
  const [missedDays, setMissedDays] = useState<number>(5);
  const [fidyahRatePerDay, setFidyahRatePerDay] = useState<number>(115); // standard BD fitrah/fidyah minimum
  const [calcMode, setCalcMode] = useState<'fidyah' | 'kaffarah'>('fidyah');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchRamadanCalendarForGregorianYear(selectedYear, district)
      .then((res) => {
        if (active) {
          setHijriYear(res.hijriYear);
          setDays(res.days);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'ক্যালেন্ডার লোড করা যায়নি');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedYear, district]);

  const fidyahTotal = Math.max(0, missedDays) * Math.max(0, fidyahRatePerDay);
  const kaffarahFeedCost = 60 * Math.max(0, fidyahRatePerDay);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-semibold text-[#D97706] dark:text-amber-400">
                রমজান ও হিজরি ক্যালেন্ডার (১৯৫০ – ২০৫০)
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {toBnDigits(selectedYear)} সালের রমজানের সেহরি, ইফতার ও নামাজের সময়সূচি
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                যেকোনো বছর (১৯৫০–২০৫০) এবং বাংলাদেশের ৬৪ জেলার যেকোনো একটি নির্বাচন করে পূর্ণাঙ্গ রমজান সূচি দেখুন।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="ramadan-year"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#047857]" />
                  বছর নির্বাচন করুন (১৯৫০–২০৫০)
                </label>
                <select
                  id="ramadan-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
                >
                  {YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {toBnDigits(yr)} খ্রিস্টাব্দ
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="ramadan-district"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#047857]" />
                  জেলা নির্বাচন করুন
                </label>
                <select
                  id="ramadan-district"
                  value={district.id}
                  onChange={(e) => onChangeDistrict(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameBn} ({d.divisionBn})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 relative min-h-[180px] bg-slate-900">
            <img
              src={ramadanCrescentSky}
              alt="রমজানের সন্ধ্যা আকাশে বাঁকা চাঁদ ও মসজিদ"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-5">
              <div className="text-white">
                <p className="text-xs text-amber-300 font-semibold">
                  {hijriYear ? `${toBnDigits(hijriYear)} হিজরি · মাহে রমজান` : 'হিজরি গণনা'}
                </p>
                <p className="text-sm font-medium mt-0.5">{district.nameBn}, বাংলাদেশ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ramadan Timetable */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {toBnDigits(selectedYear)} সালের পূর্ণাঙ্গ রমজান তালিকা ({district.nameBn})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            চাঁদ দেখার ওপর ১ দিন আগে-পরে হতে পারে
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-sm">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-3 font-semibold">রমজান</th>
                  <th className="py-3 pr-3 font-semibold">ইংরেজি তারিখ ও বার</th>
                  <th className="py-3 pr-3 font-semibold text-[#047857] dark:text-emerald-400">সেহরির শেষ</th>
                  <th className="py-3 pr-3 font-semibold">ফজর</th>
                  <th className="py-3 pr-3 font-semibold">যোহর</th>
                  <th className="py-3 pr-3 font-semibold">আসর</th>
                  <th className="py-3 pr-3 font-semibold text-[#D97706] dark:text-amber-400">ইফতার</th>
                  <th className="py-3 font-semibold">এশা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                {days.map((d) => (
                  <tr key={d.ramadanDay} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 pr-3 font-bold text-slate-900 dark:text-slate-100">
                      {toBnDigits(d.ramadanDay)} রমজান
                    </td>
                    <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {d.gregorianReadableBn} ({d.weekdayBn})
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-[#047857] dark:text-emerald-400 whitespace-nowrap">
                      {d.sehriEnd}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{d.fajr}</td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{d.dhuhr}</td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{d.asr}</td>
                    <td className="py-2.5 pr-3 font-bold text-[#D97706] dark:text-amber-400 whitespace-nowrap">
                      {d.iftar}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{d.isha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Niyat, Iftar Dua, Dos & Donts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#047857] dark:text-emerald-400">
              রোজার নিয়ত (সেহরির সময়)
            </h3>
            <p className="mt-3 font-arabic text-xl sm:text-2xl text-right text-slate-900 dark:text-slate-100">
              {RAMADAN_GUIDE.sehriNiyat.arabic}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              উচ্চারণ: {RAMADAN_GUIDE.sehriNiyat.pronunciation}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              অর্থ: {RAMADAN_GUIDE.sehriNiyat.meaning}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-[#D97706] dark:text-amber-400">
              ইফতারের দোয়া
            </h3>
            <p className="mt-3 font-arabic text-xl sm:text-2xl text-right text-slate-900 dark:text-slate-100">
              {RAMADAN_GUIDE.iftarDua.arabic}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              উচ্চারণ: {RAMADAN_GUIDE.iftarDua.pronunciation}
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              অর্থ: {RAMADAN_GUIDE.iftarDua.meaning}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#047857] dark:text-emerald-400 mb-3">
              রোজার করণীয় ও আদব
            </h3>
            <ul className="space-y-2">
              {RAMADAN_GUIDE.dos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-3">
              রোজার বর্জনীয় বিষয়সমূহ
            </h3>
            <ul className="space-y-2">
              {RAMADAN_GUIDE.donts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Kaffarah & Fidyah Calculator */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#047857] dark:text-emerald-400" />
              কাফফারা ও ফিদইয়া ক্যালকুলেটর
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              স্থায়ী অসুস্থতা বা বার্ধক্যজনিত কারণে রোজা রাখতে অক্ষম হলে ফিদইয়া, আর ইচ্ছাকৃত রোজা ভঙ্গের ক্ষেত্রে কাফফারার হিসাব করুন।
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setCalcMode('fidyah')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                calcMode === 'fidyah'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              ফিদইয়া হিসাব
            </button>
            <button
              type="button"
              onClick={() => setCalcMode('kaffarah')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                calcMode === 'kaffarah'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              কাফফারা হিসাব
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {calcMode === 'fidyah' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                মোট ছুটে যাওয়া রোজার সংখ্যা (দিন)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={missedDays}
                onChange={(e) => setMissedDays(Math.max(0, Number(e.target.value)))}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              প্রতিদিনের ফিদইয়া / এক মিসকিনের খাবারের মূল্য (টাকা)
            </label>
            <input
              type="number"
              min={10}
              value={fidyahRatePerDay}
              onChange={(e) => setFidyahRatePerDay(Math.max(0, Number(e.target.value)))}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 p-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {calcMode === 'fidyah' ? 'মোট প্রদেয় ফিদইয়া' : '৬০ জন মিসকিনকে খাওয়ানোর আনুমানিক ব্যয়'}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#047857] dark:text-emerald-400">
              ৳ {formatBnNumber(calcMode === 'fidyah' ? fidyahTotal : kaffarahFeedCost)} টাকা
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 p-3.5 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <span>
            {calcMode === 'fidyah'
              ? 'ফিদইয়া হলো প্রতিদিন একজন দরিদ্র ব্যক্তিকে দুবেলা তৃপ্তি সহকারে খাবার দেওয়া বা তার সমপরিমাণ অর্থ (সাদাকাতুল ফিতরের সমান) দান করা। সুস্থ হয়ে গেলে কাজা আদায় করা আবশ্যক; সে ক্ষেত্রে ফিদইয়া নয়।'
              : 'শরয়ি ওজর ছাড়া ইচ্ছাকৃত রোজা ভেঙে ফেললে কাফফারা হিসেবে ১টি রোজার বিনিময়ে বিরতিহীনভাবে ৬০ দিন রোজা রাখতে হবে। যদি তা শারীরিকভাবে অসম্ভব হয়, তবে ৬০ জন মিসকিনকে দুবেলা খাবার বা সমপরিমাণ মূল্য প্রদান করতে হবে। প্রয়োজনে আলেমের পরামর্শ নিন।'}
          </span>
        </div>
      </section>
    </div>
  );
};
