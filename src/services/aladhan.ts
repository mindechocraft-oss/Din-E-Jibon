import { HIJRI_MONTHS_BN, formatTime24To12Bn, getDateKey, parseTimeToday, toBnDigits } from '../lib/bengali';
import type { DistrictInfo } from '../data/districts';

export interface PrayerTimingsData {
  dateKey: string;
  districtId: string;
  imsak: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  hijriDay: number;
  hijriMonthNumber: number;
  hijriMonthBn: string;
  hijriYear: number;
  hijriFormattedBn: string;
}

export interface RamadanDayItem {
  ramadanDay: number;
  gregorianDate: string;
  gregorianReadableBn: string;
  weekdayBn: string;
  sehriEnd: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  iftar: string;
  isha: string;
}

function addMinutesToTime24(time24: string, deltaMinutes: number): string {
  const clean = time24.split(' ')[0];
  const [hStr, mStr] = clean.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const total = ((h * 60 + m + deltaMinutes) % 1440 + 1440) % 1440;
  const nh = Math.floor(total / 60).toString().padStart(2, '0');
  const nm = (total % 60).toString().padStart(2, '0');
  return `${nh}:${nm}`;
}

export function getMakruhTimes(timings: PrayerTimingsData) {
  return [
    {
      title: 'সূর্যোদয়ের সময় (ইশরাকের পূর্ব মুহূর্ত)',
      range: `${formatTime24To12Bn(timings.sunrise)} – ${formatTime24To12Bn(addMinutesToTime24(timings.sunrise, 15))}`,
      note: 'সূর্যোদয় শুরু থেকে প্রায় ১৫ মিনিট পর্যন্ত নফল বা যেকোনো নামাজ পড়া মাকরুহ।',
    },
    {
      title: 'যাওয়াল বা দ্বিপ্রহরের নিষিদ্ধ সময়',
      range: `${formatTime24To12Bn(addMinutesToTime24(timings.dhuhr, -10))} – ${formatTime24To12Bn(timings.dhuhr)}`,
      note: 'সূর্য ঠিক মাথার উপরে থাকার সময় (~১০ মিনিট) নামাজ পড়া নিষিদ্ধ।',
    },
    {
      title: 'সূর্যাস্তের পূর্ব মুহূর্ত',
      range: `${formatTime24To12Bn(addMinutesToTime24(timings.maghrib, -15))} – ${formatTime24To12Bn(timings.maghrib)}`,
      note: 'সূর্য হলুদ বর্ণ ধারণ করে অস্ত যাওয়ার পূর্বের প্রায় ১৫ মিনিট নামাজ পড়া নিষিদ্ধ (তবে ওই দিনের আসরের ফরজ আদায় করা যাবে)।',
    },
  ];
}

export function getCurrentAndNextWaqt(timings: PrayerTimingsData, now: Date = new Date()) {
  const schedule = [
    { key: 'fajr', nameBn: 'ফজর', time24: timings.fajr },
    { key: 'sunrise', nameBn: 'সূর্যোদয়', time24: timings.sunrise },
    { key: 'dhuhr', nameBn: 'যোহর', time24: timings.dhuhr },
    { key: 'asr', nameBn: 'আসর', time24: timings.asr },
    { key: 'maghrib', nameBn: 'মাগরিব', time24: timings.maghrib },
    { key: 'isha', nameBn: 'এশা', time24: timings.isha },
  ].map((item) => ({
    ...item,
    dateObj: parseTimeToday(item.time24, now),
    displayTime: formatTime24To12Bn(item.time24),
  }));

  let currentWaqt = 'এশা';
  let nextPrayer = schedule[0];
  let nextDate = new Date(schedule[0].dateObj.getTime() + 24 * 60 * 60 * 1000);

  for (let i = 0; i < schedule.length; i++) {
    if (now < schedule[i].dateObj) {
      nextPrayer = schedule[i];
      nextDate = schedule[i].dateObj;
      if (i === 0) currentWaqt = 'তাহাজ্জুদ / শেষ রাত';
      else if (i === 1) currentWaqt = 'ফজর';
      else if (i === 2) currentWaqt = 'ইশরাক ও চাশত';
      else if (i === 3) currentWaqt = 'যোহর';
      else if (i === 4) currentWaqt = 'আসর';
      else if (i === 5) currentWaqt = 'মাগরিব';
      break;
    }
    if (i === schedule.length - 1 && now >= schedule[i].dateObj) {
      currentWaqt = 'এশা';
      nextPrayer = schedule[0];
      nextDate = new Date(schedule[0].dateObj.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  return {
    currentWaqt,
    nextPrayerName: nextPrayer.nameBn,
    nextPrayerTimeDisplay: nextPrayer.displayTime,
    remainingMs: Math.max(0, nextDate.getTime() - now.getTime()),
    schedule,
  };
}

export async function fetchPrayerTimingsForDistrict(
  district: DistrictInfo,
  date: Date = new Date()
): Promise<PrayerTimingsData> {
  const dateKey = getDateKey(date);
  const cacheKey = `deen_prayer_${district.id}_${dateKey}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as PrayerTimingsData;
    }
  } catch {
    // ignore storage errors
  }

  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = date.getFullYear();

  const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${district.lat}&longitude=${district.lng}&method=1&school=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('নামাজের সময়সূচি লোড করা যায়নি');
  }
  const json = await res.json();
  const data = json.data;
  const t = data.timings;
  const h = data.date.hijri;
  const hMonthNum = Number(h.month.number) || 1;
  const hDay = Number(h.day) || 1;
  const hYear = Number(h.year) || 1448;
  const hMonthBn = HIJRI_MONTHS_BN[hMonthNum] || h.month.en;

  const parsed: PrayerTimingsData = {
    dateKey,
    districtId: district.id,
    imsak: (t.Imsak || addMinutesToTime24(t.Fajr, -10)).split(' ')[0],
    fajr: t.Fajr.split(' ')[0],
    sunrise: t.Sunrise.split(' ')[0],
    dhuhr: t.Dhuhr.split(' ')[0],
    asr: t.Asr.split(' ')[0],
    maghrib: t.Maghrib.split(' ')[0],
    isha: t.Isha.split(' ')[0],
    hijriDay: hDay,
    hijriMonthNumber: hMonthNum,
    hijriMonthBn: hMonthBn,
    hijriYear: hYear,
    hijriFormattedBn: `${toBnDigits(hDay)} ${hMonthBn} ${toBnDigits(hYear)} হিজরি`,
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(parsed));
  } catch {
    // ignore quota
  }

  return parsed;
}

const WEEKDAY_MAP_BN: Record<string, string> = {
  Sunday: 'রবিবার',
  Monday: 'সোমবার',
  Tuesday: 'মঙ্গলবার',
  Wednesday: 'বুধবার',
  Thursday: 'বৃহস্পতিবার',
  Friday: 'শুক্রবার',
  Saturday: 'শনিবার',
};

const MONTH_MAP_BN: Record<string, string> = {
  January: 'জানুয়ারি',
  February: 'ফেব্রুয়ারি',
  March: 'মার্চ',
  April: 'এপ্রিল',
  May: 'মে',
  June: 'জুন',
  July: 'জুলাই',
  August: 'আগস্ট',
  September: 'সেপ্টেম্বর',
  October: 'অক্টোবর',
  November: 'নভেম্বর',
  December: 'ডিসেম্বর',
};

/**
 * Finds the Hijri year corresponding to Ramadan falling in a given Gregorian year (1950..2050),
 * then loads the full 29/30 days of Ramadan prayer/Sehri/Iftar times from Aladhan hijriCalendar API.
 */
export async function fetchRamadanCalendarForGregorianYear(
  gregorianYear: number,
  district: DistrictInfo
): Promise<{ hijriYear: number; days: RamadanDayItem[] }> {
  const cacheKey = `deen_ramadan_${gregorianYear}_${district.id}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as { hijriYear: number; days: RamadanDayItem[] };
    }
  } catch {
    // ignore
  }

  // Approximate Hijri year at mid-Gregorian year using standard lunar conversion
  let approxHijri = Math.round((gregorianYear - 622) * (33 / 32));
  const checkYear = async (hYear: number) => {
    const url = `https://api.aladhan.com/v1/hijriCalendar/${hYear}/9?latitude=${district.lat}&longitude=${district.lng}&method=1&school=1`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('রমজান ক্যালেন্ডার লোড করা যায়নি');
    const j = await r.json();
    return j.data as Array<{
      timings: Record<string, string>;
      date: {
        gregorian: {
          date: string;
          day: string;
          month: { en: string };
          year: string;
          weekday: { en: string };
        };
      };
    }>;
  };

  let rawDays = await checkYear(approxHijri);
  const firstGYear = Number(rawDays[0]?.date?.gregorian?.year);
  if (firstGYear && firstGYear < gregorianYear) {
    approxHijri += 1;
    rawDays = await checkYear(approxHijri);
  } else if (firstGYear && firstGYear > gregorianYear) {
    approxHijri -= 1;
    rawDays = await checkYear(approxHijri);
  }

  const days: RamadanDayItem[] = rawDays.map((item, idx) => {
    const g = item.date.gregorian;
    const t = item.timings;
    const fajr = (t.Fajr || '04:30').split(' ')[0];
    const imsak = (t.Imsak || addMinutesToTime24(fajr, -6)).split(' ')[0];
    const maghrib = (t.Maghrib || '18:05').split(' ')[0];
    const gMonthBn = MONTH_MAP_BN[g.month.en] || g.month.en;
    const weekdayBn = WEEKDAY_MAP_BN[g.weekday.en] || g.weekday.en;

    return {
      ramadanDay: idx + 1,
      gregorianDate: g.date,
      gregorianReadableBn: `${toBnDigits(Number(g.day))} ${gMonthBn} ${toBnDigits(g.year)}`,
      weekdayBn,
      sehriEnd: formatTime24To12Bn(imsak),
      fajr: formatTime24To12Bn(fajr),
      dhuhr: formatTime24To12Bn((t.Dhuhr || '12:05').split(' ')[0]),
      asr: formatTime24To12Bn((t.Asr || '15:30').split(' ')[0]),
      iftar: formatTime24To12Bn(maghrib),
      isha: formatTime24To12Bn((t.Isha || '19:30').split(' ')[0]),
    };
  });

  const result = { hijriYear: approxHijri, days };
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // ignore
  }
  return result;
}
