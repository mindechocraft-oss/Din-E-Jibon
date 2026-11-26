const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)] ?? d);
}

export function formatBnNumber(num: number, decimals = 0): string {
  const fixed = decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString();
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = Number(intPart).toLocaleString('en-IN');
  return toBnDigits(decPart ? `${formattedInt}.${decPart}` : formattedInt);
}

export const BN_WEEKDAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export const BN_EN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const BN_BENGALI_MONTHS = [
  'বৈশাখ',
  'জ্যৈষ্ঠ',
  'আষাঢ়',
  'শ্রাবণ',
  'ভাদ্র',
  'আশ্বিন',
  'কার্তিক',
  'অগ্রহায়ণ',
  'পৌষ',
  'মাঘ',
  'ফাল্গুন',
  'চৈত্র',
];

export const HIJRI_MONTHS_BN: Record<number, string> = {
  1: 'মুহাররম',
  2: 'সফর',
  3: 'রবিউল আউয়াল',
  4: 'রবিউস সানি',
  5: 'জমাদিউল আউয়াল',
  6: 'জমাদিউস সানি',
  7: 'রজব',
  8: 'শাবান',
  9: 'রমজান',
  10: 'শাওয়াল',
  11: 'জিলকদ',
  12: 'জিলহজ',
};

export function formatEnglishDateBn(date: Date): string {
  const day = toBnDigits(date.getDate());
  const month = BN_EN_MONTHS[date.getMonth()];
  const year = toBnDigits(date.getFullYear());
  const weekday = BN_WEEKDAYS[date.getDay()];
  return `${weekday}, ${day} ${month} ${year}`;
}

/**
 * Revised Bangladesh Bengali Calendar (Bangla Academy 2019 update):
 * Pohela Boishakh = April 14.
 * Boishakh–Ashwin = 31 days each (6 months); Kartik–Falgun = 30 days (Falgun 31 in Gregorian leap year), Chaitra = 30 days.
 */
export function getBengaliCalendarDate(date: Date): string {
  const gYear = date.getFullYear();
  const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  const pohelaThisYear = new Date(gYear, 3, 14);
  const startYear = date >= pohelaThisYear ? gYear : gYear - 1;
  const startDate = new Date(startYear, 3, 14);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let diffDays = Math.floor((target.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const falgunDays = isLeap(startYear + 1) ? 31 : 30;
  const monthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgunDays, 30];

  let monthIdx = 0;
  while (monthIdx < 11 && diffDays >= monthLengths[monthIdx]) {
    diffDays -= monthLengths[monthIdx];
    monthIdx++;
  }

  const banglaYear = startYear - 593;
  const banglaDay = diffDays + 1;
  return `${toBnDigits(banglaDay)} ${BN_BENGALI_MONTHS[monthIdx]} ${toBnDigits(banglaYear)} বঙ্গাব্দ`;
}

export function formatTime24To12Bn(time24: string): string {
  const clean = time24.split(' ')[0];
  const [hStr, mStr] = clean.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return toBnDigits(time24);

  let period = 'রাত';
  if (h >= 4 && h < 6) period = 'ভোর';
  else if (h >= 6 && h < 12) period = 'সকাল';
  else if (h >= 12 && h < 15) period = 'দুপুর';
  else if (h >= 15 && h < 18) period = 'বিকাল';
  else if (h >= 18 && h < 20) period = 'সন্ধ্যা';

  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, '0');
  return `${period} ${toBnDigits(h12)}:${toBnDigits(mm)}`;
}

export function getDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseTimeToday(time24: string, baseDate: Date = new Date()): Date {
  const clean = time24.split(' ')[0];
  const [hStr, mStr] = clean.split(':');
  const d = new Date(baseDate);
  d.setHours(parseInt(hStr, 10) || 0, parseInt(mStr, 10) || 0, 0, 0);
  return d;
}

export function formatCountdownBn(ms: number): string {
  if (ms <= 0) return '০০:০০:০০';
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${toBnDigits(hrs.toString().padStart(2, '0'))}:${toBnDigits(mins.toString().padStart(2, '0'))}:${toBnDigits(secs.toString().padStart(2, '0'))}`;
}
