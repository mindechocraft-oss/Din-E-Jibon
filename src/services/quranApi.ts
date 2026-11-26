import { SURAH_LIST } from '../data/surahs';

export type QariId = 'ar.alafasy' | 'ar.abdurrahmaansudais';

export const QARI_OPTIONS: { id: QariId; nameBn: string; subtitleBn: string }[] = [
  { id: 'ar.alafasy', nameBn: 'মিশারি রশিদ আল-আফাসি', subtitleBn: 'Mishary Rashid Alafasy' },
  { id: 'ar.abdurrahmaansudais', nameBn: 'আব্দুর রহমান আস-সুদাইস', subtitleBn: 'Abdurrahmaan As-Sudais' },
];

export interface QuranAyah {
  number: number; // global ayah number 1..6236
  numberInSurah: number;
  textAr: string;
  transliterationEn: string;
  transliterationBn: string;
  translationBn: string;
  tafsirBn: string;
  audioUrl: string;
}

/**
 * Converts standard English phonetic Quran transliteration into clear, readable Bengali phonetics.
 */
function englishTranslitToBengali(text: string): string {
  if (!text) return '';
  let s = text
    .replace(/Bismil-laahir-Rahmaanir-Raheem/gi, 'বিসমিল্লা-হির রাহমা-নির রাহীম')
    .replace(/Alhamdu lillaahi/gi, 'আলহামদু লিল্লা-হি')
    .replace(/Rabbil 'aalameen/gi, 'রাব্বিল আ-লামীন');

  const pairs: [RegExp, string][] = [
    [/sh/gi, 'শ'],
    [/th/gi, 'ছ'],
    [/kh/gi, 'খ'],
    [/dh/gi, 'য'],
    [/gh/gi, 'গ'],
    [/aa/gi, 'আ-'],
    [/ee/gi, 'ঈ'],
    [/oo/gi, 'ঊ'],
    [/ai/gi, 'আই'],
    [/au/gi, 'আউ'],
    [/allaah/gi, 'আল্লা-হ'],
    [/allah/gi, 'আল্লাহ'],
    [/rabbi/gi, 'রাব্বি'],
    [/rabb/gi, 'রাব্ব'],
    [/q/gi, 'ক্ব'],
    [/k/gi, 'ক'],
    [/g/gi, 'গ'],
    [/j/gi, 'জ'],
    [/z/gi, 'য'],
    [/s/gi, 'স'],
    [/t/gi, 'ত'],
    [/d/gi, 'দ'],
    [/n/gi, 'ন'],
    [/m/gi, 'ম'],
    [/l/gi, 'ল'],
    [/r/gi, 'র'],
    [/b/gi, 'ব'],
    [/p/gi, 'প'],
    [/f/gi, 'ফ'],
    [/h/gi, 'হ'],
    [/y/gi, 'ইয়'],
    [/w/gi, 'ওয়'],
    [/a/gi, 'া'],
    [/i/gi, 'ি'],
    [/u/gi, 'ু'],
    [/e/gi, 'ে'],
    [/o/gi, 'ো'],
  ];

  // Keep clean word-level mapping so punctuation and hyphens stay natural
  s = s.replace(/'/g, 'আ');
  for (const [rx, rep] of pairs) {
    s = s.replace(rx, rep);
  }
  return s;
}

export function getAyahAudioUrl(globalAyahNumber: number, qari: QariId): string {
  // AlQuran Cloud CDN reliable HTTPS MP3 per ayah
  return `https://cdn.islamic.network/quran/audio/128/${qari}/${globalAyahNumber}.mp3`;
}

export function getSurahAudioUrl(surahNumber: number, qari: QariId): string {
  // Reliable full Surah MP3 streams from Islamic Network / MP3Quran CDN
  const padded = surahNumber.toString().padStart(3, '0');
  if (qari === 'ar.abdurrahmaansudais') {
    return `https://server11.mp3quran.net/sds/${padded}.mp3`;
  }
  return `https://server8.mp3quran.net/afs/${padded}.mp3`;
}

export async function fetchSurahDetail(
  surahNumber: number,
  qari: QariId = 'ar.alafasy'
): Promise<QuranAyah[]> {
  const cacheKey = `deen_surah_v2_${surahNumber}`;
  let baseData: Array<{
    number: number;
    numberInSurah: number;
    textAr: string;
    transliterationEn: string;
    transliterationBn: string;
    translationBn: string;
    tafsirBn: string;
  }> | null = null;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      baseData = JSON.parse(cached);
    }
  } catch {
    // ignore
  }

  if (!baseData) {
    // Fetch Uthmani Arabic, Muhiuddin Khan Bengali translation (bn.bengali), and transliteration
    // plus Zohurul Hoque Bengali commentary (bn.hoque) as Tafsir view
    const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,bn.bengali,en.transliteration,bn.hoque`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('সূরার আয়াত লোড করা সম্ভব হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
    }
    const json = await res.json();
    const editions = json.data as Array<{
      ayahs: Array<{ number: number; numberInSurah: number; text: string }>;
    }>;

    const arAyahs = editions[0]?.ayahs || [];
    const bnAyahs = editions[1]?.ayahs || [];
    const trAyahs = editions[2]?.ayahs || [];
    const tafsirAyahs = editions[3]?.ayahs || [];

    const surahMeta = SURAH_LIST.find((s) => s.number === surahNumber);

    baseData = arAyahs.map((ar, idx) => {
      const trEn = trAyahs[idx]?.text || '';
      const bnMain = bnAyahs[idx]?.text || '';
      const bnAlt = tafsirAyahs[idx]?.text || '';
      return {
        number: ar.number,
        numberInSurah: ar.numberInSurah,
        textAr: ar.text,
        transliterationEn: trEn,
        transliterationBn: englishTranslitToBengali(trEn),
        translationBn: bnMain,
        tafsirBn:
          bnAlt && bnAlt !== bnMain
            ? `ব্যাখ্যা ও ভাবানুবাদ (সূরা ${surahMeta?.nameBn || ''}, আয়াত ${ar.numberInSurah}): ${bnAlt}`
            : `আয়াতের সারমর্ম: ${bnMain} — (${surahMeta?.revelationBn || ''} সূরা, তাওহীদ ও আমলের শিক্ষা অনুযায়ী অনুধাবনযোগ্য।)`,
      };
    });

    try {
      localStorage.setItem(cacheKey, JSON.stringify(baseData));
    } catch {
      // ignore storage quota
    }
  }

  return baseData.map((a) => ({
    ...a,
    audioUrl: getAyahAudioUrl(a.number, qari),
  }));
}
