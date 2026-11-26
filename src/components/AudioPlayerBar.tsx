import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Repeat,
} from 'lucide-react';
import { SURAH_LIST } from '../data/surahs';
import { QARI_OPTIONS, type QariId } from '../services/quranApi';
import { toBnDigits } from '../lib/bengali';

export interface AudioPlayerState {
  mode: 'surah' | 'ayah';
  surahNumber: number;
  ayahNumberInSurah?: number;
  audioUrl: string;
  titleBn: string;
  subtitleBn: string;
  qari: QariId;
  isPlaying: boolean;
  repeatCount?: number; // 1 = once, 3, 5, 0 = infinite
}

interface AudioPlayerBarProps {
  player: AudioPlayerState;
  onTogglePlay: () => void;
  onChangeQari: (qari: QariId) => void;
  onPrev: () => void;
  onNext: () => void;
  onEnded: () => void;
  onOpenQuran: () => void;
}

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '০০:০০';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${toBnDigits(m.toString().padStart(2, '0'))}:${toBnDigits(s.toString().padStart(2, '0'))}`;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  player,
  onTogglePlay,
  onChangeQari,
  onPrev,
  onNext,
  onEnded,
  onOpenQuran,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const surahMeta = SURAH_LIST.find((s) => s.number === player.surahNumber);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setAudioError(null);
    if (audio.src !== player.audioUrl) {
      audio.src = player.audioUrl;
      audio.load();
    }
    if (player.isPlaying) {
      audio.play().catch(() => {
        setAudioError('অডিও চালু করতে প্লে বোতামে চাপ দিন');
      });
    } else {
      audio.pause();
    }
  }, [player.audioUrl, player.isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  return (
    <div className="fixed bottom-14 lg:bottom-0 left-0 right-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => {
          onEnded();
        }}
        onError={() => {
          setAudioError('অডিও লোড করতে ইন্টারনেট সংযোগ প্রয়োজন');
        }}
      />

      {/* Expanded controls panel */}
      {expanded && (
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">ক্বারী নির্বাচন:</span>
            <select
              aria-label="ক্বারী নির্বাচন করুন"
              value={player.qari}
              onChange={(e) => onChangeQari(e.target.value as QariId)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {QARI_OPTIONS.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.nameBn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-md">
            <span className="tabular-nums text-slate-500 dark:text-slate-400 w-11 text-right">
              {formatDuration(currentTime)}
            </span>
            <input
              type="range"
              aria-label="অডিও অগ্রগতি"
              min={0}
              max={duration || 100}
              value={Math.min(currentTime, duration || 100)}
              onChange={handleSeek}
              className="w-full accent-[#047857] h-1.5 rounded-lg cursor-pointer"
            />
            <span className="tabular-nums text-slate-500 dark:text-slate-400 w-11">
              {formatDuration(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'শব্দ চালু করুন' : 'শব্দ বন্ধ করুন'}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              aria-label="শব্দের মাত্রা"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setMuted(false);
                setVolume(Number(e.target.value));
              }}
              className="w-20 accent-[#047857] h-1.5 cursor-pointer"
            />
            <button
              type="button"
              onClick={onOpenQuran}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#047857] dark:text-emerald-400 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap"
            >
              কোরআন পাতায় যান
            </button>
          </div>
        </div>
      )}

      {/* Compact single-row bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenQuran}
          className="flex items-center gap-3 min-w-0 text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#047857] text-white flex items-center justify-center shrink-0 font-arabic text-base">
            {surahMeta?.nameAr.slice(0, 6) || 'قرآن'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#047857] dark:group-hover:text-emerald-400">
              {player.titleBn}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {audioError || player.subtitleBn}
              {player.repeatCount !== undefined && player.repeatCount !== 1 && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-[#D97706]">
                  <Repeat className="w-3 h-3" />
                  {player.repeatCount === 0 ? 'অবিরত' : `${toBnDigits(player.repeatCount)}×`}
                </span>
              )}
            </p>
          </div>
        </button>

        {/* Desktop inline progress */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-sm">
          <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            aria-label="অডিও পজিশন"
            min={0}
            max={duration || 100}
            value={Math.min(currentTime, duration || 100)}
            onChange={handleSeek}
            className="w-full accent-[#047857] h-1.5 cursor-pointer"
          />
          <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Transport controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            aria-label="পূর্ববর্তী সূরা বা আয়াত"
            className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={player.isPlaying ? 'বিরতি দিন' : 'তিলাওয়াত শুনুন'}
            className="min-w-[40px] min-h-[40px] rounded-full bg-[#047857] hover:bg-emerald-800 text-white flex items-center justify-center shadow-sm transition-colors"
          >
            {player.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={onNext}
            aria-label="পরবর্তী সূরা বা আয়াত"
            className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'অডিও নিয়ন্ত্রণ লুকান' : 'আরও অডিও নিয়ন্ত্রণ দেখুন'}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
