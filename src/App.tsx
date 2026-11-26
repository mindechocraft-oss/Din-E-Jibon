import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  Compass,
  BookOpen,
  Calendar,
  Sparkles,
  Calculator,
  HelpCircle,
  CheckSquare,
  MessageSquare,
  Sun,
  Moon,
  Grid,
  X,
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardPage, type AppTab } from './components/DashboardPage';
import { PrayerPage } from './components/PrayerPage';
import { QuranPage } from './components/QuranPage';
import { RamadanCalendarPage } from './components/RamadanCalendarPage';
import { DuaTasbihHadithPage } from './components/DuaTasbihHadithPage';
import { CalculatorsPage } from './components/CalculatorsPage';
import { QuizPage } from './components/QuizPage';
import {
  countAmalCompleted,
  createEmptyAmalLog,
  TrackerPage,
  AMAL_ITEMS,
} from './components/TrackerPage';
import { AccountForumPage } from './components/AccountForumPage';
import { AudioPlayerBar, type AudioPlayerState } from './components/AudioPlayerBar';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { getDistrictById } from './data/districts';
import { SURAH_LIST } from './data/surahs';
import { getDateKey, toBnDigits } from './lib/bengali';
import {
  testFirestoreConnection,
  type AmalDayLog,
  type BookmarkItem,
  type LastReadState,
  type QazaState,
} from './lib/firebase';
import { fetchPrayerTimingsForDistrict, type PrayerTimingsData } from './services/aladhan';
import {
  getAyahAudioUrl,
  getSurahAudioUrl,
  type QariId,
  type QuranAyah,
} from './services/quranApi';

const NAV_ITEMS: { id: AppTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'ড্যাশবোর্ড', shortLabel: 'হোম', icon: <Home className="w-4 h-4" /> },
  { id: 'prayer', label: 'নামাজ ও কিবলা', shortLabel: 'নামাজ', icon: <Compass className="w-4 h-4" /> },
  { id: 'quran', label: 'আল-কোরআন', shortLabel: 'কোরআন', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'ramadan', label: 'রমজান ও হিজরি', shortLabel: 'রমজান', icon: <Calendar className="w-4 h-4" /> },
  { id: 'dua', label: 'দোয়া, হাদিস ও তাসবিহ', shortLabel: 'দোয়া', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'calculators', label: 'যাকাত ও ফারায়েজ', shortLabel: 'হিসাব', icon: <Calculator className="w-4 h-4" /> },
  { id: 'quiz', label: 'ইসলামিক কুইজ', shortLabel: 'কুইজ', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'tracker', label: 'আমল ও কাজা ট্র্যাকার', shortLabel: 'আমল', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'account', label: 'দ্বীনি প্রশ্নোত্তর', shortLabel: 'ফোরাম', icon: <MessageSquare className="w-4 h-4" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('deen_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem('deen_theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  const [districtId, setDistrictId] = useState<string>(() => {
    try {
      return localStorage.getItem('deen_district') || 'Dhaka';
    } catch {
      return 'Dhaka';
    }
  });
  const district = getDistrictById(districtId);

  const [timings, setTimings] = useState<PrayerTimingsData | null>(null);
  const [timingsLoading, setTimingsLoading] = useState(false);
  const [timingsError, setTimingsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setTimingsLoading(true);
    setTimingsError(null);
    fetchPrayerTimingsForDistrict(district)
      .then((data) => {
        if (active) setTimings(data);
      })
      .catch((err) => {
        if (active) setTimingsError(err instanceof Error ? err.message : 'সময়সূচি পাওয়া যায়নি');
      })
      .finally(() => {
        if (active) setTimingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [district]);

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const raw = localStorage.getItem('deen_bookmarks');
      return raw ? (JSON.parse(raw) as BookmarkItem[]) : [];
    } catch {
      return [];
    }
  });
  const [lastRead, setLastRead] = useState<LastReadState | null>(() => {
    try {
      const raw = localStorage.getItem('deen_last_read');
      return raw ? (JSON.parse(raw) as LastReadState) : null;
    } catch {
      return null;
    }
  });
  const [amalLogs, setAmalLogs] = useState<Record<string, AmalDayLog>>(() => {
    try {
      const raw = localStorage.getItem('deen_amal_logs');
      return raw ? (JSON.parse(raw) as Record<string, AmalDayLog>) : {};
    } catch {
      return {};
    }
  });
  const [qaza, setQaza] = useState<QazaState>(() => {
    try {
      const raw = localStorage.getItem('deen_qaza');
      return raw
        ? (JSON.parse(raw) as QazaState)
        : { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, fasting: 0 };
    } catch {
      return { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, fasting: 0 };
    }
  });

  const handleChangeDistrict = (id: string) => {
    setDistrictId(id);
    try {
      localStorage.setItem('deen_district', id);
    } catch {
      // ignore
    }
  };

  const [selectedSurah, setSelectedSurah] = useState<number>(lastRead?.surahNumber || 55);
  const [qari, setQari] = useState<QariId>('ar.alafasy');
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const repeatTrackerRef = useRef<number>(1);
  const ayahQueueRef = useRef<QuranAyah[]>([]);

  const [player, setPlayer] = useState<AudioPlayerState>({
    mode: 'surah',
    surahNumber: 55,
    audioUrl: getSurahAudioUrl(55, 'ar.alafasy'),
    titleBn: 'সূরা আর-রহমান',
    subtitleBn: 'মিশারি রশিদ আল-আফাসি',
    qari: 'ar.alafasy',
    isPlaying: false,
    repeatCount: 1,
  });

  const qariLabel = (q: QariId) =>
    q === 'ar.alafasy' ? 'মিশারি রশিদ আল-আফাসি' : 'আব্দুর রহমান আস-সুদাইস';

  const handlePlayFullSurah = (surahNum: number) => {
    const meta = SURAH_LIST.find((s) => s.number === surahNum) || SURAH_LIST[54];
    setPlayer({
      mode: 'surah',
      surahNumber: surahNum,
      audioUrl: getSurahAudioUrl(surahNum, qari),
      titleBn: `সূরা ${meta.nameBn}`,
      subtitleBn: qariLabel(qari),
      qari,
      isPlaying: true,
      repeatCount: 1,
    });
  };

  const handlePlayAyah = (surahNum: number, ayah: QuranAyah, allAyahs: QuranAyah[]) => {
    const meta = SURAH_LIST.find((s) => s.number === surahNum) || SURAH_LIST[0];
    ayahQueueRef.current = allAyahs;
    repeatTrackerRef.current = 1;
    setPlayer({
      mode: 'ayah',
      surahNumber: surahNum,
      ayahNumberInSurah: ayah.numberInSurah,
      audioUrl: getAyahAudioUrl(ayah.number, qari),
      titleBn: `${meta.nameBn} · আয়াত ${toBnDigits(ayah.numberInSurah)}`,
      subtitleBn: qariLabel(qari),
      qari,
      isPlaying: true,
      repeatCount,
    });
  };

  const handleChangeQari = (nextQari: QariId) => {
    setQari(nextQari);
    setPlayer((prev) => {
      if (prev.mode === 'ayah' && prev.ayahNumberInSurah) {
        const found = ayahQueueRef.current.find(
          (a) => a.numberInSurah === prev.ayahNumberInSurah
        );
        return {
          ...prev,
          qari: nextQari,
          subtitleBn: qariLabel(nextQari),
          audioUrl: found ? getAyahAudioUrl(found.number, nextQari) : prev.audioUrl,
        };
      }
      return {
        ...prev,
        qari: nextQari,
        subtitleBn: qariLabel(nextQari),
        audioUrl: getSurahAudioUrl(prev.surahNumber, nextQari),
      };
    });
  };

  const handlePlayerNext = () => {
    if (player.mode === 'ayah' && player.ayahNumberInSurah && ayahQueueRef.current.length > 0) {
      const idx = ayahQueueRef.current.findIndex(
        (a) => a.numberInSurah === player.ayahNumberInSurah
      );
      if (idx >= 0 && idx + 1 < ayahQueueRef.current.length) {
        handlePlayAyah(player.surahNumber, ayahQueueRef.current[idx + 1], ayahQueueRef.current);
        return;
      }
    }
    const nextSurah = player.surahNumber >= 114 ? 1 : player.surahNumber + 1;
    handlePlayFullSurah(nextSurah);
  };

  const handlePlayerPrev = () => {
    if (player.mode === 'ayah' && player.ayahNumberInSurah && ayahQueueRef.current.length > 0) {
      const idx = ayahQueueRef.current.findIndex(
        (a) => a.numberInSurah === player.ayahNumberInSurah
      );
      if (idx > 0) {
        handlePlayAyah(player.surahNumber, ayahQueueRef.current[idx - 1], ayahQueueRef.current);
        return;
      }
    }
    const prevSurah = player.surahNumber <= 1 ? 114 : player.surahNumber - 1;
    handlePlayFullSurah(prevSurah);
  };

  const handleAudioEnded = () => {
    if (player.mode === 'ayah' && player.ayahNumberInSurah && ayahQueueRef.current.length > 0) {
      if (repeatCount === 0 || repeatTrackerRef.current < repeatCount) {
        repeatTrackerRef.current += 1;
        setPlayer((p) => ({ ...p, isPlaying: false }));
        window.setTimeout(() => {
          setPlayer((p) => ({ ...p, isPlaying: true }));
        }, 60);
        return;
      }
      const idx = ayahQueueRef.current.findIndex(
        (a) => a.numberInSurah === player.ayahNumberInSurah
      );
      if (idx >= 0 && idx + 1 < ayahQueueRef.current.length) {
        handlePlayAyah(player.surahNumber, ayahQueueRef.current[idx + 1], ayahQueueRef.current);
        return;
      }
    }
    setPlayer((p) => ({ ...p, isPlaying: false }));
  };

  const handleToggleBookmark = (item: Omit<BookmarkItem, 'id'>) => {
    const id = `${item.surahNumber}_${item.ayahNumber}`;
    const exists = bookmarks.some(
      (b) => b.surahNumber === item.surahNumber && b.ayahNumber === item.ayahNumber
    );
    const updated = exists
      ? bookmarks.filter(
          (b) => !(b.surahNumber === item.surahNumber && b.ayahNumber === item.ayahNumber)
        )
      : [{ id, ...item }, ...bookmarks];

    setBookmarks(updated);
    try {
      localStorage.setItem('deen_bookmarks', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSaveLastRead = (data: LastReadState) => {
    setLastRead(data);
    try {
      localStorage.setItem('deen_last_read', JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const handleToggleAmal = (dateKey: string, field: keyof Omit<AmalDayLog, 'date'>) => {
    const prevLog = amalLogs[dateKey] || createEmptyAmalLog(dateKey);
    const nextLog: AmalDayLog = { ...prevLog, [field]: !prevLog[field] };
    const nextMap = { ...amalLogs, [dateKey]: nextLog };
    setAmalLogs(nextMap);
    try {
      localStorage.setItem('deen_amal_logs', JSON.stringify(nextMap));
    } catch {
      // ignore
    }
  };

  const handleUpdateQaza = (nextQaza: QazaState) => {
    setQaza(nextQaza);
    try {
      localStorage.setItem('deen_qaza', JSON.stringify(nextQaza));
    } catch {
      // ignore
    }
  };

  const todayAmalCompleted = countAmalCompleted(amalLogs[getDateKey()]);

  const navigateTo = (tab: AppTab) => {
    setActiveTab(tab);
    setMoreSheetOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <OfflineIndicator />

        {/* 3-Zone Top Bar Contract (No Login) */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="text-lg font-bold tracking-tight text-[#047857] dark:text-emerald-400 whitespace-nowrap shrink-0"
            >
              দীন-ই-জীবন
            </button>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              {(
                [
                  { id: 'dashboard', label: 'ড্যাশবোর্ড' },
                  { id: 'prayer', label: 'নামাজ' },
                  { id: 'quran', label: 'কোরআন' },
                  { id: 'ramadan', label: 'রমজান' },
                  { id: 'tracker', label: 'আমল' },
                ] as const
              ).map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigateTo(link.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    activeTab === link.id
                      ? 'text-[#047857] dark:text-emerald-400 border-[#047857] dark:border-emerald-400 font-semibold'
                      : 'border-transparent hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => navigateTo('account')}
                className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-emerald-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                প্রশ্নোত্তর ফোরাম
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-32 lg:pb-24 flex gap-8">
          <aside className="hidden lg:flex flex-col w-60 shrink-0 space-y-6">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full min-h-[42px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                      active
                        ? 'bg-[#047857] text-white font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <button
                type="button"
                onClick={() => setDarkMode((v) => !v)}
                className="w-full min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold flex items-center justify-between text-slate-700 dark:text-slate-200"
              >
                <span>{darkMode ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}</span>
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-500" />
                )}
              </button>
              <PWAInstallButton />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <DashboardPage
                district={district}
                onChangeDistrict={handleChangeDistrict}
                timings={timings}
                timingsLoading={timingsLoading}
                timingsError={timingsError}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode((v) => !v)}
                onNavigate={navigateTo}
                lastRead={lastRead}
                onPlayDefaultSurah={() => handlePlayFullSurah(55)}
                todayAmalCompleted={todayAmalCompleted}
                todayAmalTotal={AMAL_ITEMS.length}
              />
            )}

            {activeTab === 'prayer' && (
              <PrayerPage
                district={district}
                onChangeDistrict={handleChangeDistrict}
                timings={timings}
                loading={timingsLoading}
                error={timingsError}
              />
            )}

            {activeTab === 'quran' && (
              <QuranPage
                selectedSurah={selectedSurah}
                onSelectSurah={setSelectedSurah}
                qari={qari}
                onChangeQari={handleChangeQari}
                activePlayingSurah={player.surahNumber}
                activePlayingAyah={player.mode === 'ayah' ? player.ayahNumberInSurah : undefined}
                isAudioPlaying={player.isPlaying}
                repeatCount={repeatCount}
                onChangeRepeatCount={(c) => {
                  setRepeatCount(c);
                  setPlayer((p) => ({ ...p, repeatCount: c }));
                }}
                onPlayAyah={handlePlayAyah}
                onPlayFullSurah={handlePlayFullSurah}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
                lastRead={lastRead}
                onSaveLastRead={handleSaveLastRead}
              />
            )}

            {activeTab === 'ramadan' && (
              <RamadanCalendarPage
                district={district}
                onChangeDistrict={handleChangeDistrict}
              />
            )}

            {activeTab === 'dua' && <DuaTasbihHadithPage />}

            {activeTab === 'calculators' && <CalculatorsPage />}

            {activeTab === 'quiz' && <QuizPage />}

            {activeTab === 'tracker' && (
              <TrackerPage
                amalLogs={amalLogs}
                onToggleAmal={handleToggleAmal}
                qaza={qaza}
                onUpdateQaza={handleUpdateQaza}
              />
            )}

            {activeTab === 'account' && (
              <AccountForumPage
                district={district}
                onChangeDistrict={handleChangeDistrict}
                bookmarksCount={bookmarks.length}
                todayAmalCompleted={todayAmalCompleted}
              />
            )}
          </main>
        </div>

        <AudioPlayerBar
          player={player}
          onTogglePlay={() => setPlayer((p) => ({ ...p, isPlaying: !p.isPlaying }))}
          onChangeQari={handleChangeQari}
          onPrev={handlePlayerPrev}
          onNext={handlePlayerNext}
          onEnded={handleAudioEnded}
          onOpenQuran={() => {
            setSelectedSurah(player.surahNumber);
            navigateTo('quran');
          }}
        />

        <nav
          aria-label="মোবাইল নেভিগেশন"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
        >
          {(
            [
              { id: 'dashboard', label: 'হোম', icon: <Home className="w-5 h-5" /> },
              { id: 'prayer', label: 'নামাজ', icon: <Compass className="w-5 h-5" /> },
              { id: 'quran', label: 'কোরআন', icon: <BookOpen className="w-5 h-5" /> },
              { id: 'ramadan', label: 'রমজান', icon: <Calendar className="w-5 h-5" /> },
            ] as const
          ).map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`h-full flex flex-col items-center justify-center gap-0.5 ${
                  active
                    ? 'text-[#047857] dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.icon}
                <span className="text-[10px] leading-none">{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreSheetOpen(true)}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              ['dua', 'calculators', 'quiz', 'tracker', 'account'].includes(activeTab)
                ? 'text-[#047857] dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] leading-none">আরও</span>
          </button>
        </nav>

        {moreSheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
            <div className="w-full rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  সকল ইসলামিক সেবা
                </h3>
                <button
                  type="button"
                  onClick={() => setMoreSheetOpen(false)}
                  aria-label="বন্ধ করুন"
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`min-h-[48px] px-3.5 py-3 rounded-xl border text-left flex items-center gap-2.5 text-xs font-semibold ${
                      activeTab === item.id
                        ? 'bg-[#047857] border-[#047857] text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDarkMode((v) => !v)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                  {darkMode ? 'লাইট মোড' : 'ডার্ক মোড'}
                </button>
                <PWAInstallButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
