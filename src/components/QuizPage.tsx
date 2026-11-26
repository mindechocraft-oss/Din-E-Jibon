import React, { useEffect, useState } from 'react';
import { Timer, Trophy, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { getDailyQuizQuestions, type QuizQuestion } from '../data/quizData';
import { getDateKey, toBnDigits } from '../lib/bengali';
import { fetchLeaderboardCloud, type LeaderboardEntry } from '../lib/firebase';

export const QuizPage: React.FC = () => {
  const [questions] = useState<QuizQuestion[]>(() => getDailyQuizQuestions());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem('deen_player_name') || 'আব্দুল্লাহ';
    } catch {
      return 'আব্দুল্লাহ';
    }
  });

  const [localEntries, setLocalEntries] = useState<LeaderboardEntry[]>(() => {
    try {
      const raw = localStorage.getItem('deen_local_leaderboard');
      return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [cloudEntries, setCloudEntries] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    setLbLoading(true);
    fetchLeaderboardCloud()
      .then((rows) => setCloudEntries(rows))
      .catch(() => {})
      .finally(() => setLbLoading(false));
  }, []);

  useEffect(() => {
    if (finished || selectedOption !== null) return;
    if (timeLeft <= 0) {
      setSelectedOption(-1);
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [timeLeft, selectedOption, finished]);

  const currentQ = questions[currentIdx];

  const handleChoose = (optIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optIdx);
    if (optIdx === currentQ.correctIndex) {
      setScore((s) => s + 20);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setTimeLeft(30);
    } else {
      setFinished(true);
      const dateKey = getDateKey();
      const nameClean = playerName.trim() || 'শিক্ষার্থী';
      const entry: LeaderboardEntry = {
        id: `local_${dateKey}_${nameClean}`,
        uid: 'local',
        displayName: nameClean,
        score,
        dateKey,
        totalCompleted: 1,
      };
      const updated = [
        entry,
        ...localEntries.filter((e) => e.id !== entry.id),
      ]
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);
      setLocalEntries(updated);
      try {
        localStorage.setItem('deen_local_leaderboard', JSON.stringify(updated));
        localStorage.setItem('deen_player_name', nameClean);
        localStorage.setItem(`deen_quiz_${dateKey}`, String(score));
      } catch {
        // ignore
      }
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setTimeLeft(30);
    setScore(0);
    setFinished(false);
  };

  const combinedLeaderboard = [...localEntries, ...cloudEntries]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold text-[#047857] dark:text-emerald-400">
              দৈনিক ইসলামিক জ্ঞান পরীক্ষা
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              আজকের ৫টি প্রশ্ন (প্রতি প্রশ্নে ৩০ সেকেন্ড)
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              aria-label="আপনার নাম"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="আপনার নাম"
              className="w-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold"
            />
            <span className="text-sm font-bold tabular-nums text-[#047857] dark:text-emerald-400">
              স্কোর: {toBnDigits(score)} / ১০০
            </span>
          </div>
        </div>

        {!finished ? (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                প্রশ্ন {toBnDigits(currentIdx + 1)} / {toBnDigits(questions.length)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 font-bold tabular-nums ${
                  timeLeft <= 8 ? 'text-rose-600 dark:text-rose-400' : 'text-[#D97706] dark:text-amber-400'
                }`}
              >
                <Timer className="w-4 h-4" />
                {toBnDigits(timeLeft)} সেকেন্ড বাকি
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {currentQ.question}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                let btnStyle =
                  'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-[#047857] text-slate-900 dark:text-slate-100';

                if (selectedOption !== null) {
                  if (isCorrect) {
                    btnStyle =
                      'bg-emerald-50 dark:bg-emerald-950/60 border-[#047857] text-emerald-900 dark:text-emerald-200';
                  } else if (isSelected) {
                    btnStyle =
                      'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200';
                  } else {
                    btnStyle =
                      'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => handleChoose(idx)}
                    className={`w-full min-h-[48px] text-left rounded-xl border px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>
                      {toBnDigits(idx + 1)}. {opt}
                    </span>
                    {selectedOption !== null && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                    )}
                    {selectedOption !== null && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-4 space-y-2">
                <p className="text-xs font-bold text-[#D97706] dark:text-amber-400">
                  {selectedOption === -1
                    ? 'সময় শেষ! সঠিক উত্তর ও ব্যাখ্যা:'
                    : selectedOption === currentQ.correctIndex
                      ? 'মাশাআল্লাহ! সঠিক উত্তর (+২০ পয়েন্ট)'
                      : 'ভুল উত্তর! সঠিক উত্তর ও ব্যাখ্যা:'}
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentQ.explanation}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  সূত্র: {currentQ.reference}
                </p>
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                >
                  {currentIdx + 1 < questions.length ? 'পরবর্তী প্রশ্ন →' : 'ফলাফল দেখুন'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 text-center space-y-4">
            <Trophy className="w-12 h-12 text-[#D97706] mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              আজকের কুইজ সম্পন্ন হয়েছে!
            </h2>
            <p className="text-3xl font-bold tabular-nums text-[#047857] dark:text-emerald-400">
              প্রাপ্ত নম্বর: {toBnDigits(score)} / ১০০
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              আপনার স্কোর স্বয়ংক্রিয়ভাবে লিডারবোর্ডে সংরক্ষিত হয়েছে।
            </p>
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-emerald-800 text-white text-sm font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              আবার অনুশীলন করুন
            </button>
          </div>
        )}
      </section>

      <aside className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D97706]" />
            দৈনিক লিডারবোর্ড
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">শীর্ষ ২০</span>
        </div>

        {lbLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : combinedLeaderboard.length === 0 ? (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-5 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            আজকের কুইজ খেলে আপনার প্রথম স্কোর লিডারবোর্ডে যুক্ত করুন!
          </div>
        ) : (
          <div className="space-y-2">
            {combinedLeaderboard.map((entry, idx) => (
              <div
                key={entry.id}
                className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#047857]/10 text-[#047857] dark:text-emerald-400 text-xs font-bold tabular-nums flex items-center justify-center shrink-0">
                    {toBnDigits(idx + 1)}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {entry.displayName}
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-[#D97706] dark:text-amber-400 shrink-0">
                  {toBnDigits(entry.score)}
                </span>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};
