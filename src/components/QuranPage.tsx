import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Play,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Eye,
  EyeOff,
  Repeat,
  ChevronLeft,
  Volume2,
} from 'lucide-react';
import { SURAH_LIST, type SurahMeta } from '../data/surahs';
import { toBnDigits } from '../lib/bengali';
import {
  fetchSurahDetail,
  QARI_OPTIONS,
  type QariId,
  type QuranAyah,
} from '../services/quranApi';
import type { BookmarkItem, LastReadState } from '../lib/firebase';

interface QuranPageProps {
  selectedSurah: number;
  onSelectSurah: (surahNumber: number) => void;
  qari: QariId;
  onChangeQari: (qari: QariId) => void;
  activePlayingSurah: number;
  activePlayingAyah?: number;
  isAudioPlaying: boolean;
  repeatCount: number;
  onChangeRepeatCount: (count: number) => void;
  onPlayAyah: (surahNumber: number, ayah: QuranAyah, allAyahs: QuranAyah[]) => void;
  onPlayFullSurah: (surahNumber: number) => void;
  bookmarks: BookmarkItem[];
  onToggleBookmark: (item: Omit<BookmarkItem, 'id'>) => void;
  lastRead: LastReadState | null;
  onSaveLastRead: (data: LastReadState) => void;
}

export const QuranPage: React.FC<QuranPageProps> = ({
  selectedSurah,
  onSelectSurah,
  qari,
  onChangeQari,
  activePlayingSurah,
  activePlayingAyah,
  isAudioPlaying,
  repeatCount,
  onChangeRepeatCount,
  onPlayAyah,
  onPlayFullSurah,
  bookmarks,
  onToggleBookmark,
  lastRead,
  onSaveLastRead,
}) => {
  const [viewTab, setViewTab] = useState<'list' | 'reader' | 'bookmarks'>('list');
  const [surahQuery, setSurahQuery] = useState('');
  const [revelationFilter, setRevelationFilter] = useState<'all' | 'মাক্কি' | 'মাদানি'>('all');
  const [ayahQuery, setAyahQuery] = useState('');
  const [showTafsir, setShowTafsir] = useState(false);
  const [showTranslit, setShowTranslit] = useState(true);
  const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSurahMeta: SurahMeta =
    SURAH_LIST.find((s) => s.number === selectedSurah) || SURAH_LIST[0];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchSurahDetail(selectedSurah, qari)
      .then((data) => {
        if (active) setAyahs(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'সূরা লোড করা যায়নি');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedSurah, qari]);

  useEffect(() => {
    if (viewTab === 'reader' && activePlayingSurah === selectedSurah && activePlayingAyah) {
      const el = document.getElementById(`ayah-card-${activePlayingAyah}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activePlayingAyah, activePlayingSurah, selectedSurah, viewTab]);

  const filteredSurahs = useMemo(() => {
    const q = surahQuery.trim().toLowerCase();
    return SURAH_LIST.filter((s) => {
      if (revelationFilter !== 'all' && s.revelationBn !== revelationFilter) return false;
      if (!q) return true;
      return (
        s.nameBn.toLowerCase().includes(q) ||
        s.meaningBn.toLowerCase().includes(q) ||
        s.nameAr.includes(q) ||
        String(s.number) === q ||
        toBnDigits(s.number) === q
      );
    });
  }, [surahQuery, revelationFilter]);

  const filteredAyahs = useMemo(() => {
    const q = ayahQuery.trim().toLowerCase();
    if (!q) return ayahs;
    return ayahs.filter(
      (a) =>
        a.translationBn.toLowerCase().includes(q) ||
        a.transliterationBn.toLowerCase().includes(q) ||
        a.textAr.includes(q) ||
        String(a.numberInSurah) === q ||
        toBnDigits(a.numberInSurah) === q
    );
  }, [ayahs, ayahQuery]);

  const openSurahReader = (surahNum: number) => {
    onSelectSurah(surahNum);
    setViewTab('reader');
    const meta = SURAH_LIST.find((s) => s.number === surahNum);
    if (meta) {
      onSaveLastRead({
        surahNumber: surahNum,
        ayahNumber: 1,
        surahNameBn: meta.nameBn,
      });
    }
  };

  const isBookmarked = (surahNum: number, ayahNum: number) =>
    bookmarks.some((b) => b.surahNumber === surahNum && b.ayahNumber === ayahNum);

  return (
    <div className="space-y-6">
      {/* Top Editorial Banner */}
      <section className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#047857] dark:text-emerald-400">
                আল-কোরআনুল কারীম · ১১৪টি পূর্ণাঙ্গ সূরা
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                কোরআন তিলাওয়াত, বাংলা উচ্চারণ, অনুবাদ ও হিফজ মোড
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                উসমানি আরবি লিপি, বাংলা অর্থ, তাফসির টগল, আয়াত-ভিত্তিক অডিও হাইলাইট ও বুকমার্ক।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setViewTab('list')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    viewTab === 'list'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ১১৪ সূরার তালিকা
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('reader')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    viewTab === 'reader'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  পাঠক মোড ({currentSurahMeta.nameBn})
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('bookmarks')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    viewTab === 'bookmarks'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  বুকমার্ক ({toBnDigits(bookmarks.length)})
                </button>
              </div>

              {lastRead && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectSurah(lastRead.surahNumber);
                    setViewTab('reader');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#047857]/30 bg-emerald-50/60 dark:bg-emerald-950/40 text-xs font-semibold text-[#047857] dark:text-emerald-400 hover:bg-emerald-100/70 transition-colors"
                >
                  সর্বশেষ পঠিত: {lastRead.surahNameBn} · আয়াত {toBnDigits(lastRead.ayahNumber)}
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 relative min-h-[160px] bg-slate-900">
            <img
              src="/src/assets/images/quran_manuscript_art_1795721911542.jpg"
              alt="পবিত্র কোরআনের উসমানি পাণ্ডুলিপি"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-5">
              <p className="text-xs text-slate-100 leading-relaxed">
                “নিশ্চয়ই আমিই কোরআন নাজিল করেছি এবং আমিই এর সংরক্ষণকারী।” — সূরা হিজর (১৫:৯)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TAB 1: 114 Surah List */}
      {viewTab === 'list' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={surahQuery}
                onChange={(e) => setSurahQuery(e.target.value)}
                placeholder="সূরার নাম, অর্থ বা নম্বর দিয়ে খুঁজুন..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
              />
            </div>

            <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
              {(['all', 'মাক্কি', 'মাদানি'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRevelationFilter(f)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    revelationFilter === f
                      ? 'bg-[#047857] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {f === 'all' ? 'সকল সূরা (১১৪)' : f}
                </button>
              ))}
            </div>
          </div>

          {filteredSurahs.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              আপনার অনুসন্ধানের সাথে মিলে এমন কোনো সূরা পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.number}
                  type="button"
                  onClick={() => openSurahReader(surah.number)}
                  className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 hover:border-[#047857] dark:hover:border-emerald-500 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#047857] dark:text-emerald-400 font-bold text-sm tabular-nums flex items-center justify-center shrink-0">
                      {toBnDigits(surah.number)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#047857] dark:group-hover:text-emerald-400">
                        {surah.nameBn}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {surah.meaningBn} · {surah.revelationBn} · {toBnDigits(surah.ayahs)} আয়াত
                      </p>
                    </div>
                  </div>
                  <span className="font-arabic text-xl text-slate-800 dark:text-slate-200 shrink-0">
                    {surah.nameAr}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Surah Reader */}
      {viewTab === 'reader' && (
        <section className="space-y-4">
          {/* Reader Toolbar */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewTab('list')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                  তালিকা
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {toBnDigits(currentSurahMeta.number)}. {currentSurahMeta.nameBn}{' '}
                    <span className="font-arabic text-xl ml-1.5 text-[#047857] dark:text-emerald-400">
                      {currentSurahMeta.nameAr}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    অর্থ: {currentSurahMeta.meaningBn} · {currentSurahMeta.revelationBn} ·{' '}
                    {toBnDigits(currentSurahMeta.ayahs)} আয়াত
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onPlayFullSurah(currentSurahMeta.number)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                সম্পূর্ণ সূরা শুনুন
              </button>
            </div>

            {/* Secondary Controls: Search Ayah, Qari, Hifz Repeat, Tafsir, Pronunciation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={ayahQuery}
                  onChange={(e) => setAyahQuery(e.target.value)}
                  placeholder="আয়াত নম্বর বা বাংলা শব্দ..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
                />
              </div>

              <select
                aria-label="ক্বারী নির্বাচন"
                value={qari}
                onChange={(e) => onChangeQari(e.target.value as QariId)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
              >
                {QARI_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    ক্বারী: {opt.nameBn}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#D97706] shrink-0" />
                <select
                  aria-label="হিফজ রিপিট মোড"
                  value={repeatCount}
                  onChange={(e) => onChangeRepeatCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#047857]"
                >
                  <option value={1}>হিফজ রিপিট: ১ বার (স্বাভাবিক)</option>
                  <option value={3}>হিফজ রিপিট: ৩ বার প্রতিটি আয়াত</option>
                  <option value={5}>হিফজ রিপিট: ৫ বার প্রতিটি আয়াত</option>
                  <option value={0}>হিফজ রিপিট: অবিরত লুপ</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTranslit((v) => !v)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                    showTranslit
                      ? 'border-[#047857] bg-emerald-50 dark:bg-emerald-950/50 text-[#047857] dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  উচ্চারণ
                </button>
                <button
                  type="button"
                  onClick={() => setShowTafsir((v) => !v)}
                  className={`flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                    showTafsir
                      ? 'border-[#D97706] bg-amber-50 dark:bg-amber-950/40 text-[#D97706] dark:text-amber-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {showTafsir ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  তাফসির
                </button>
              </div>
            </div>
          </div>

          {/* Bismillah Header (Except Surah 9) */}
          {currentSurahMeta.number !== 9 && currentSurahMeta.number !== 1 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-center">
              <p className="font-arabic text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>
          )}

          {/* Ayahs List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-6 text-center text-sm text-rose-700 dark:text-rose-300">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAyahs.map((ayah) => {
                const isActive =
                  activePlayingSurah === currentSurahMeta.number &&
                  activePlayingAyah === ayah.numberInSurah;
                const bookmarked = isBookmarked(currentSurahMeta.number, ayah.numberInSurah);

                return (
                  <article
                    key={ayah.number}
                    id={`ayah-card-${ayah.numberInSurah}`}
                    className={`rounded-2xl border p-5 sm:p-6 transition-colors ${
                      isActive
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-[#047857] dark:border-emerald-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold tabular-nums text-[#047857] dark:text-emerald-400">
                        আয়াত {toBnDigits(ayah.numberInSurah)}
                        {isActive && isAudioPlaying ? ' · তিলাওয়াত চলছে' : ''}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPlayAyah(currentSurahMeta.number, ayah, ayahs)}
                          aria-label={`আয়াত ${ayah.numberInSurah} শুনুন`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#047857] dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          শুনুন
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onToggleBookmark({
                              surahNumber: currentSurahMeta.number,
                              ayahNumber: ayah.numberInSurah,
                              surahNameBn: currentSurahMeta.nameBn,
                              translationBn: ayah.translationBn,
                            })
                          }
                          aria-label="আয়াত বুকমার্ক করুন"
                          className={`p-2 rounded-lg border transition-colors ${
                            bookmarked
                              ? 'border-[#D97706] bg-amber-50 dark:bg-amber-950/50 text-[#D97706]'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {bookmarked ? (
                            <BookmarkCheck className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onSaveLastRead({
                              surahNumber: currentSurahMeta.number,
                              ayahNumber: ayah.numberInSurah,
                              surahNameBn: currentSurahMeta.nameBn,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          এখানে থামলাম
                        </button>
                      </div>
                    </div>

                    <p className="mt-5 font-arabic text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 text-right leading-[2.3]">
                      {ayah.textAr}
                    </p>

                    {showTranslit && (
                      <p className="mt-4 text-sm text-[#047857] dark:text-emerald-400 font-medium leading-relaxed">
                        উচ্চারণ: {ayah.transliterationBn}
                      </p>
                    )}

                    <p className="mt-2.5 text-base text-slate-800 dark:text-slate-200 leading-relaxed">
                      {ayah.translationBn}
                    </p>

                    {showTafsir && (
                      <div className="mt-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-[#D97706] dark:text-amber-400 block mb-1">
                          তাফসির ও ব্যাখ্যা
                        </span>
                        {ayah.tafsirBn}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Bookmarks */}
      {viewTab === 'bookmarks' && (
        <section className="space-y-4">
          {bookmarks.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                এখনো কোনো আয়াত বুকমার্ক করা হয়নি
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                কোরআন পড়ার সময় যেকোনো আয়াতের পাশে থাকা বুকমার্ক আইকনে চাপ দিলে এখানে সংরক্ষিত হবে।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarks.map((bm) => (
                <div
                  key={`${bm.surahNumber}_${bm.ayahNumber}`}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#047857] dark:text-emerald-400">
                        {bm.surahNameBn} · আয়াত {toBnDigits(bm.ayahNumber)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleBookmark({
                            surahNumber: bm.surahNumber,
                            ayahNumber: bm.ayahNumber,
                            surahNameBn: bm.surahNameBn,
                            translationBn: bm.translationBn,
                          })
                        }
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        সরান
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {bm.translationBn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSurah(bm.surahNumber);
                      setViewTab('reader');
                    }}
                    className="self-start text-xs font-semibold text-[#047857] dark:text-emerald-400 hover:underline"
                  >
                    সূরায় ফিরে যান →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
