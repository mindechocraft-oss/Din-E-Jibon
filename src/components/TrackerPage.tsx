import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Square,
  Calendar as CalendarIcon,
  TrendingUp,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react';
import {
  BN_EN_MONTHS,
  formatBnNumber,
  getDateKey,
  toBnDigits,
} from '../lib/bengali';
import type { AmalDayLog, QazaState } from '../lib/firebase';

export const AMAL_ITEMS: { key: keyof Omit<AmalDayLog, 'date'>; label: string; group: 'নামাজ' | 'আমল' }[] = [
  { key: 'fajr', label: 'ফজর নামাজ', group: 'নামাজ' },
  { key: 'dhuhr', label: 'যোহর নামাজ', group: 'নামাজ' },
  { key: 'asr', label: 'আসর নামাজ', group: 'নামাজ' },
  { key: 'maghrib', label: 'মাগরিব নামাজ', group: 'নামাজ' },
  { key: 'isha', label: 'এশা নামাজ', group: 'নামাজ' },
  { key: 'quran', label: 'কোরআন তিলাওয়াত', group: 'আমল' },
  { key: 'dhikr', label: 'সকাল-সন্ধ্যা যিকির', group: 'আমল' },
  { key: 'sadaqah', label: 'দান বা সাদাকাহ', group: 'আমল' },
  { key: 'fasting', label: 'নফল/ফরজ রোজা', group: 'আমল' },
  { key: 'sunnah', label: 'সুন্নাহ অভ্যাস (মিসওয়াক/দোয়া)', group: 'আমল' },
];

export function createEmptyAmalLog(date: string): AmalDayLog {
  return {
    date,
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
    quran: false,
    dhikr: false,
    sadaqah: false,
    fasting: false,
    sunnah: false,
  };
}

export function countAmalCompleted(log?: AmalDayLog): number {
  if (!log) return 0;
  return AMAL_ITEMS.reduce((sum, item) => sum + (log[item.key] ? 1 : 0), 0);
}

interface TrackerPageProps {
  amalLogs: Record<string, AmalDayLog>;
  onToggleAmal: (dateKey: string, field: keyof Omit<AmalDayLog, 'date'>) => void;
  qaza: QazaState;
  onUpdateQaza: (next: QazaState) => void;
}

export const TrackerPage: React.FC<TrackerPageProps> = ({
  amalLogs,
  onToggleAmal,
  qaza,
  onUpdateQaza,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => getDateKey());
  const [viewMonthDate, setViewMonthDate] = useState<Date>(() => new Date());
  const [qazaYearsInput, setQazaYearsInput] = useState<number>(1);

  const activeLog = amalLogs[selectedDate] || createEmptyAmalLog(selectedDate);
  const completedCount = countAmalCompleted(activeLog);
  const pct = Math.round((completedCount / AMAL_ITEMS.length) * 100);

  const weeklyDays = useMemo(() => {
    const list: { dateKey: string; labelBn: string; count: number; pct: number }[] = [];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const dk = getDateKey(d);
      const c = countAmalCompleted(amalLogs[dk]);
      list.push({
        dateKey: dk,
        labelBn: toBnDigits(d.getDate()),
        count: c,
        pct: Math.round((c / AMAL_ITEMS.length) * 100),
      });
    }
    return list;
  }, [amalLogs]);

  const weeklyAvgPct = Math.round(
    weeklyDays.reduce((s, d) => s + d.pct, 0) / weeklyDays.length
  );

  const calendarDays = useMemo(() => {
    const year = viewMonthDate.getFullYear();
    const month = viewMonthDate.getMonth();
    const firstDayWeekday = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateKey?: string; count?: number }> = [];
    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push({ day: null });
    }
    for (let day = 1; day <= totalDays; day++) {
      const dk = `${year}-${(month + 1).toString().padStart(2, '0')}-${day
        .toString()
        .padStart(2, '0')}`;
      cells.push({ day, dateKey: dk, count: countAmalCompleted(amalLogs[dk]) });
    }
    return cells;
  }, [viewMonthDate, amalLogs]);

  const changeQazaField = (field: keyof QazaState, delta: number) => {
    onUpdateQaza({
      ...qaza,
      [field]: Math.max(0, (qaza[field] || 0) + delta),
    });
  };

  const addYearsToQaza = () => {
    const days = Math.max(0, Math.round(qazaYearsInput * 365));
    onUpdateQaza({
      ...qaza,
      fajr: qaza.fajr + days,
      dhuhr: qaza.dhuhr + days,
      asr: qaza.asr + days,
      maghrib: qaza.maghrib + days,
      isha: qaza.isha + days,
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <p className="text-xs font-semibold text-[#047857] dark:text-emerald-400">
          দৈনিক আত্ম-মূল্যায়ন ও আমল হিসাব
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          আমল ট্র্যাকার ও কাজা নামাজ হিসাব
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          আপনার সকল দৈনিক আমল এবং কাজা নামাজের হিসাব স্বয়ংক্রিয়ভাবে আপনার ডিভাইসে সংরক্ষিত থাকছে।
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                তারিখের আমল চেকলিস্ট ({toBnDigits(selectedDate)})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সম্পন্ন: {toBnDigits(completedCount)} / {toBnDigits(AMAL_ITEMS.length)} ({toBnDigits(pct)}%)
              </p>
            </div>
            <input
              type="date"
              aria-label="তারিখ নির্বাচন করুন"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || getDateKey())}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold"
            />
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-[#047857] dark:bg-emerald-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {AMAL_ITEMS.map((item) => {
              const checked = Boolean(activeLog[item.key]);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggleAmal(selectedDate, item.key)}
                  className={`min-h-[48px] px-4 py-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors ${
                    checked
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#047857] text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  {checked ? (
                    <CheckSquare className="w-5 h-5 text-[#047857] dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#047857]" />
                সাপ্তাহিক অগ্রগতি (গড় {toBnDigits(weeklyAvgPct)}%)
              </h3>
            </div>
            <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
              {weeklyDays.map((d) => (
                <button
                  key={d.dateKey}
                  type="button"
                  onClick={() => setSelectedDate(d.dateKey)}
                  className="flex flex-col items-center gap-1.5 h-full justify-end group"
                >
                  <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-lg h-20 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        d.dateKey === selectedDate
                          ? 'bg-[#D97706]'
                          : 'bg-[#047857] dark:bg-emerald-500'
                      }`}
                      style={{ height: `${Math.max(8, d.pct)}%` }}
                    />
                  </div>
                  <span className="text-[11px] tabular-nums font-medium text-slate-600 dark:text-slate-400">
                    {d.labelBn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#D97706]" />
                {BN_EN_MONTHS[viewMonthDate.getMonth()]} {toBnDigits(viewMonthDate.getFullYear())}
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setViewMonthDate(
                      new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth() - 1, 1)
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setViewMonthDate(
                      new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth() + 1, 1)
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400 mb-1.5">
              {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'].map((wd) => (
                <span key={wd}>{wd}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, i) => {
                if (!cell.day || !cell.dateKey) {
                  return <div key={`empty-${i}`} className="h-9" />;
                }
                const c = cell.count || 0;
                const isSelected = cell.dateKey === selectedDate;
                let bg = 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300';
                if (c >= 8) bg = 'bg-[#047857] text-white';
                else if (c >= 4) bg = 'bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100';
                else if (c >= 1) bg = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300';

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateKey!)}
                    className={`h-9 rounded-lg text-xs font-semibold tabular-nums transition-colors ${bg} ${
                      isSelected ? 'ring-2 ring-[#D97706]' : ''
                    }`}
                  >
                    {toBnDigits(cell.day)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              কাজা নামাজ ও রোজা হিসাব ট্র্যাকার
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              পূর্ববর্তী ছুটে যাওয়া কাজা নামাজ ও রোজার হিসাব রাখুন এবং আদায় করার সাথে সাথে (-) বোতামে কমিয়ে নিন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={60}
              value={qazaYearsInput}
              onChange={(e) => setQazaYearsInput(Math.max(1, Number(e.target.value)))}
              aria-label="কাজা বছর"
              className="w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs font-semibold tabular-nums text-center"
            />
            <button
              type="button"
              onClick={addYearsToQaza}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap"
            >
              + {toBnDigits(qazaYearsInput)} বছরের নামাজ যোগ করুন
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(
            [
              { key: 'fajr', label: 'ফজর কাজা' },
              { key: 'dhuhr', label: 'যোহর কাজা' },
              { key: 'asr', label: 'আসর কাজা' },
              { key: 'maghrib', label: 'মাগরিব কাজা' },
              { key: 'isha', label: 'এশা ও বিতর কাজা' },
              { key: 'fasting', label: 'কাজা রোজা' },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatBnNumber(qaza[item.key])}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => changeQazaField(item.key, -1)}
                  aria-label={`${item.label} ১টি কমান`}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-[#047857]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => changeQazaField(item.key, 1)}
                  aria-label={`${item.label} ১টি বাড়ান`}
                  className="w-10 h-10 rounded-xl bg-[#047857] text-white flex items-center justify-center hover:bg-emerald-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              onUpdateQaza({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, fasting: 0 })
            }
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            সবগুলো শূন্য করুন
          </button>
        </div>
      </section>
    </div>
  );
};
