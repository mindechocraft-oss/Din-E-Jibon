import React, { useMemo, useRef, useState } from 'react';
import {
  Search,
  Volume2,
  VolumeX,
  Smartphone,
  RotateCcw,
  Plus,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import {
  ALLAH_99_NAMES,
  HISNUL_MUSLIM_DUAS,
  SAHIH_HADITHS,
} from '../data/duaHadithData';
import { toBnDigits } from '../lib/bengali';

const DHIKR_PRESETS = [
  { label: 'সুবহানাল্লাহ', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'আল্লাহ অতি পবিত্র' },
  { label: 'আলহামদুলিল্লাহ', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'সকল প্রশংসা আল্লাহর' },
  { label: 'আল্লাহু আকবার', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'আল্লাহ সর্বশ্রেষ্ঠ' },
  { label: 'আস্তাগফিরুল্লাহ', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: 'আমি আল্লাহর ক্ষমা প্রার্থনা করছি' },
  { label: 'লা ইলাহা ইল্লাল্লাহ', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', meaning: 'আল্লাহ ছাড়া কোনো মাবুদ নেই' },
];

export const DuaTasbihHadithPage: React.FC = () => {
  const [subTab, setSubTab] = useState<'dua' | 'names' | 'tasbih' | 'hadith'>('dua');
  const [searchQuery, setSearchQuery] = useState('');
  const [duaCategory, setDuaCategory] = useState<string>('সকল');
  const [hadithCategory, setHadithCategory] = useState<string>('সকল');
  const [hadithBook, setHadithBook] = useState<string>('সকল');

  // Tasbih state
  const [tasbihCount, setTasbihCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('deen_tasbih_count')) || 0;
    } catch {
      return 0;
    }
  });
  const [tasbihTarget, setTasbihTarget] = useState<number>(33);
  const [selectedDhikr, setSelectedDhikr] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClickTone = (isTargetReached: boolean) => {
    if (!soundEnabled) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isTargetReached ? 880 : 520, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isTargetReached ? 0.18 : 0.06));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isTargetReached ? 0.19 : 0.07));
    } catch {
      // ignore WebAudio restrictions
    }
  };

  const handleTasbihTap = () => {
    const next = tasbihCount + 1;
    setTasbihCount(next);
    try {
      localStorage.setItem('deen_tasbih_count', String(next));
    } catch {
      // ignore
    }
    const reached = tasbihTarget > 0 && next % tasbihTarget === 0;
    playClickTone(reached);
    if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(reached ? [40, 40, 80] : 20);
    }
  };

  const resetTasbih = () => {
    setTasbihCount(0);
    try {
      localStorage.setItem('deen_tasbih_count', '0');
    } catch {
      // ignore
    }
  };

  const filteredDuas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HISNUL_MUSLIM_DUAS.filter((d) => {
      if (duaCategory !== 'সকল' && d.category !== duaCategory) return false;
      if (!q) return true;
      return (
        d.titleBn.toLowerCase().includes(q) ||
        d.meaningBn.toLowerCase().includes(q) ||
        d.pronunciationBn.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, duaCategory]);

  const filteredNames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ALLAH_99_NAMES;
    return ALLAH_99_NAMES.filter(
      (n) =>
        n.transliterationBn.toLowerCase().includes(q) ||
        n.meaningBn.toLowerCase().includes(q) ||
        n.arabic.includes(q) ||
        String(n.number) === q
    );
  }, [searchQuery]);

  const filteredHadiths = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SAHIH_HADITHS.filter((h) => {
      if (hadithBook !== 'সকল' && h.book !== hadithBook) return false;
      if (hadithCategory !== 'সকল' && h.category !== hadithCategory) return false;
      if (!q) return true;
      return (
        h.textBn.toLowerCase().includes(q) ||
        h.narratorBn.toLowerCase().includes(q) ||
        h.book.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, hadithBook, hadithCategory]);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <p className="text-xs font-semibold text-[#047857] dark:text-emerald-400">
          মাসনুন দোয়া · আসমাউল হুসনা · তাসবিহ · সহিহ হাদিস
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          দোয়া, যিকির, ৯৯ নাম ও হাদিস ভাণ্ডার
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            {[
              { id: 'dua', label: 'হিসনুল মুসলিম দোয়া' },
              { id: 'tasbih', label: 'ডিজিটাল তাসবিহ' },
              { id: 'names', label: 'আল্লাহর ৯৯ নাম' },
              { id: 'hadith', label: 'সহিহ হাদিস' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id as typeof subTab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  subTab === t.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {subTab !== 'tasbih' && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="খুঁজুন..."
                className="w-full min-h-[42px] pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
              />
            </div>
          )}
        </div>
      </section>

      {/* SUBTAB: DUA */}
      {subTab === 'dua' && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['সকল', 'সকাল-সন্ধ্যা', 'নামাজ', 'ঘুম ও জাগরণ', 'বিপদ ও তাওবা', 'সফর ও দৈনন্দিন'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setDuaCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  duaCategory === cat
                    ? 'bg-[#047857] text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDuas.map((dua) => (
              <article
                key={dua.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#047857] dark:text-emerald-400">
                      {dua.category}
                    </span>
                    <span>{dua.reference}</span>
                  </div>
                  <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">
                    {dua.titleBn}
                  </h2>
                  <p className="mt-4 font-arabic text-2xl text-right text-slate-900 dark:text-slate-100 leading-[2.2]">
                    {dua.arabic}
                  </p>
                  <p className="mt-3 text-xs sm:text-sm font-medium text-[#047857] dark:text-emerald-400 leading-relaxed">
                    উচ্চারণ: {dua.pronunciationBn}
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    অর্থ: {dua.meaningBn}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* SUBTAB: DIGITAL TASBIH */}
      {subTab === 'tasbih' && (
        <section className="max-w-2xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  soundEnabled
                    ? 'border-[#047857] text-[#047857] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {soundEnabled ? 'শব্দ চালু' : 'শব্দ বন্ধ'}
              </button>
              <button
                type="button"
                onClick={() => setVibrateEnabled((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  vibrateEnabled
                    ? 'border-[#D97706] text-[#D97706] dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                {vibrateEnabled ? 'ভাইব্রেশন চালু' : 'ভাইব্রেশন বন্ধ'}
              </button>
            </div>

            <select
              aria-label="তাসবিহ লক্ষ্য"
              value={tasbihTarget}
              onChange={(e) => setTasbihTarget(Number(e.target.value))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <option value={33}>লক্ষ্য: ৩৩ বার</option>
              <option value={99}>লক্ষ্য: ৯৯ বার</option>
              <option value={100}>লক্ষ্য: ১০০ বার</option>
              <option value={0}>সীমাহীন</option>
            </select>
          </div>

          {/* Dhikr Selector */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {DHIKR_PRESETS.map((p, idx) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setSelectedDhikr(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedDhikr === idx
                    ? 'bg-[#047857] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="py-2">
            <p className="font-arabic text-3xl sm:text-4xl text-slate-900 dark:text-slate-100">
              {DHIKR_PRESETS[selectedDhikr].arabic}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {DHIKR_PRESETS[selectedDhikr].meaning}
            </p>
          </div>

          {/* Big Tap Counter */}
          <div className="flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={handleTasbihTap}
              aria-label="তাসবিহ গণনা করুন"
              className="w-52 h-52 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border-4 border-[#047857] dark:border-emerald-500 flex flex-col items-center justify-center shadow-sm active:scale-[0.97] transition-transform select-none"
            >
              <span className="text-5xl font-bold tabular-nums text-[#047857] dark:text-emerald-400">
                {toBnDigits(tasbihCount)}
              </span>
              <span className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                গণনা করতে স্পর্শ করুন
              </span>
              {tasbihTarget > 0 && (
                <span className="mt-1 text-[11px] tabular-nums text-[#D97706] dark:text-amber-400">
                  চক্র: {toBnDigits(tasbihCount % tasbihTarget)} / {toBnDigits(tasbihTarget)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={resetTasbih}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              শূন্য করুন (Reset)
            </button>
          </div>
        </section>
      )}

      {/* SUBTAB: 99 NAMES */}
      {subTab === 'names' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredNames.map((n) => (
            <div
              key={n.number}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between gap-3"
            >
              <div>
                <span className="text-xs font-bold tabular-nums text-[#D97706] dark:text-amber-400">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {toBnDigits(n.number)}
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                  {n.transliterationBn}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{n.meaningBn}</p>
              </div>
              <span className="font-arabic text-2xl text-[#047857] dark:text-emerald-400 shrink-0">
                {n.arabic}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* SUBTAB: HADITH */}
      {subTab === 'hadith' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {['সকল', 'সহিহ বুখারি', 'সহিহ মুসলিম'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setHadithBook(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    hadithBook === b
                      ? 'bg-[#047857] text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['সকল', 'ঈমান ও নিয়ত', 'নামাজ ও পবিত্রতা', 'চরিত্র ও আখলাক', 'দোয়া ও যিকির', 'দান ও রোজা'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setHadithCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    hadithCategory === c
                      ? 'bg-[#D97706] text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredHadiths.map((h) => (
              <article
                key={h.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-[#047857] dark:text-emerald-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {h.book} · {h.hadithNumber}
                    </span>
                    <span>{h.category}</span>
                  </div>
                  <p className="mt-4 font-arabic text-xl sm:text-2xl text-right text-slate-900 dark:text-slate-100 leading-[2.2]">
                    {h.arabic}
                  </p>
                  <p className="mt-3 text-base text-slate-800 dark:text-slate-200 leading-relaxed">
                    “{h.textBn}”
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  বর্ণনাকারী: {h.narratorBn}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
