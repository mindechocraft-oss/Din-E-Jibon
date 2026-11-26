import React, { useMemo, useState } from 'react';
import { Calculator, AlertTriangle } from 'lucide-react';
import { formatBnNumber, toBnDigits } from '../lib/bengali';

const FITRAH_STAPLES = [
  { id: 'wheat', nameBn: 'গম বা আটা (১.৬৫ কেজি)', defaultRate: 115 },
  { id: 'barley', nameBn: 'যব (৩.৩ কেজি)', defaultRate: 400 },
  { id: 'dates', nameBn: 'খেজুর (৩.৩ কেজি)', defaultRate: 1980 },
  { id: 'raisins', nameBn: 'কিসমিস (৩.৩ কেজি)', defaultRate: 2145 },
  { id: 'cheese', nameBn: 'পনির (৩.৩ কেজি)', defaultRate: 2640 },
];

export const CalculatorsPage: React.FC = () => {
  const [subTab, setSubTab] = useState<'zakat' | 'fitrah' | 'inheritance'>('zakat');

  // Zakat state
  const [goldVori, setGoldVori] = useState(0);
  const [goldPricePerVori, setGoldPricePerVori] = useState(125000);
  const [silverVori, setSilverVori] = useState(0);
  const [silverPricePerVori, setSilverPricePerVori] = useState(2100);
  const [cashAmount, setCashAmount] = useState(100000);
  const [bankAmount, setBankAmount] = useState(150000);
  const [businessAssets, setBusinessAssets] = useState(0);
  const [debts, setDebts] = useState(0);
  const [nisabStandard, setNisabStandard] = useState<'silver' | 'gold'>('silver');

  const totalAssets =
    goldVori * goldPricePerVori +
    silverVori * silverPricePerVori +
    cashAmount +
    bankAmount +
    businessAssets;
  const netZakatable = Math.max(0, totalAssets - debts);
  const nisabThreshold =
    nisabStandard === 'silver' ? 52.5 * silverPricePerVori : 7.5 * goldPricePerVori;
  const isZakatDue = netZakatable >= nisabThreshold && netZakatable > 0;
  const zakatAmount = isZakatDue ? netZakatable * 0.025 : 0;

  // Fitrah state
  const [familyMembers, setFamilyMembers] = useState(4);
  const [selectedStaple, setSelectedStaple] = useState(FITRAH_STAPLES[0].id);
  const [customFitrahRate, setCustomFitrahRate] = useState(FITRAH_STAPLES[0].defaultRate);

  const handleSelectStaple = (id: string) => {
    setSelectedStaple(id);
    const found = FITRAH_STAPLES.find((s) => s.id === id);
    if (found) setCustomFitrahRate(found.defaultRate);
  };

  const totalFitrah = Math.max(1, familyMembers) * Math.max(0, customFitrahRate);

  // Inheritance (Faraid) state
  const [estateValue, setEstateValue] = useState(1000000);
  const [estateDebts, setEstateDebts] = useState(0);
  const [spouseType, setSpouseType] = useState<'none' | 'wife' | 'husband'>('wife');
  const [wifeCount, setWifeCount] = useState(1);
  const [sons, setSons] = useState(1);
  const [daughters, setDaughters] = useState(1);
  const [fatherAlive, setFatherAlive] = useState(true);
  const [motherAlive, setMotherAlive] = useState(true);

  const inheritanceResult = useMemo(() => {
    const netEstate = Math.max(0, estateValue - estateDebts);
    const hasChildren = sons > 0 || daughters > 0;

    // Fixed Quranic fractions (Fard)
    let spouseShare = 0;
    if (spouseType === 'husband') {
      spouseShare = hasChildren ? 1 / 4 : 1 / 2;
    } else if (spouseType === 'wife') {
      spouseShare = hasChildren ? 1 / 8 : 1 / 4;
    }

    let motherShare = 0;
    if (motherAlive) {
      motherShare = hasChildren ? 1 / 6 : 1 / 3;
    }

    let fatherFixed = 0;
    if (fatherAlive) {
      fatherFixed = hasChildren ? 1 / 6 : 0;
    }

    let daughterFixed = 0;
    if (daughters > 0 && sons === 0) {
      daughterFixed = daughters === 1 ? 1 / 2 : 2 / 3;
    }

    const totalFixed = spouseShare + motherShare + fatherFixed + daughterFixed;
    let remaining = Math.max(0, 1 - totalFixed);

    // Awl normalization if fixed shares exceed 1
    let scale = 1;
    if (totalFixed > 1) {
      scale = 1 / totalFixed;
      remaining = 0;
    }

    const finalSpouse = spouseShare * scale;
    const finalMother = motherShare * scale;
    let finalFather = fatherFixed * scale;
    let finalDaughtersTotal = daughterFixed * scale;
    let finalSonsTotal = 0;

    // Asabah (Residuary distribution)
    if (sons > 0) {
      // Sons + Daughters share residue in 2:1 ratio
      const totalParts = sons * 2 + daughters;
      finalSonsTotal = remaining * ((sons * 2) / totalParts);
      finalDaughtersTotal += remaining * (daughters / totalParts);
    } else if (fatherAlive) {
      // Father takes remaining as Asabah if no sons
      finalFather += remaining;
    } else if (totalFixed > 0 && remaining > 0) {
      // Radd to blood relatives (Mother / Daughters) proportionally when no Asabah
      const bloodTotal = finalMother + finalDaughtersTotal;
      if (bloodTotal > 0) {
        const extraMother = remaining * (finalMother / bloodTotal);
        const extraDaughters = remaining * (finalDaughtersTotal / bloodTotal);
        const mShare = finalMother + extraMother;
        finalDaughtersTotal += extraDaughters;
        const rows = [];
        if (spouseType !== 'none' && finalSpouse > 0) {
          rows.push({
            label:
              spouseType === 'husband'
                ? 'স্বামী'
                : wifeCount > 1
                  ? `স্ত্রী (${toBnDigits(wifeCount)} জন — সমান ভাগে)`
                  : 'স্ত্রী',
            fraction: finalSpouse,
            amount: netEstate * finalSpouse,
          });
        }
        if (motherAlive) {
          rows.push({ label: 'মাতা', fraction: mShare, amount: netEstate * mShare });
        }
        if (daughters > 0) {
          rows.push({
            label: `কন্যা (${toBnDigits(daughters)} জন — প্রতিজন ${formatBnNumber((netEstate * finalDaughtersTotal) / daughters)} টাকা)`,
            fraction: finalDaughtersTotal,
            amount: netEstate * finalDaughtersTotal,
          });
        }
        return { netEstate, rows, unallocated: 0 };
      }
    }

    const rows: { label: string; fraction: number; amount: number }[] = [];
    if (spouseType !== 'none' && finalSpouse > 0) {
      rows.push({
        label:
          spouseType === 'husband'
            ? 'স্বামী'
            : wifeCount > 1
              ? `স্ত্রী (${toBnDigits(wifeCount)} জন — সমান ভাগে)`
              : 'স্ত্রী',
        fraction: finalSpouse,
        amount: netEstate * finalSpouse,
      });
    }
    if (fatherAlive && finalFather > 0) {
      rows.push({ label: 'পিতা', fraction: finalFather, amount: netEstate * finalFather });
    }
    if (motherAlive && finalMother > 0) {
      rows.push({ label: 'মাতা', fraction: finalMother, amount: netEstate * finalMother });
    }
    if (sons > 0 && finalSonsTotal > 0) {
      rows.push({
        label: `পুত্র (${toBnDigits(sons)} জন — প্রতিজন ${formatBnNumber((netEstate * finalSonsTotal) / sons)} টাকা)`,
        fraction: finalSonsTotal,
        amount: netEstate * finalSonsTotal,
      });
    }
    if (daughters > 0 && finalDaughtersTotal > 0) {
      rows.push({
        label: `কন্যা (${toBnDigits(daughters)} জন — প্রতিজন ${formatBnNumber((netEstate * finalDaughtersTotal) / daughters)} টাকা)`,
        fraction: finalDaughtersTotal,
        amount: netEstate * finalDaughtersTotal,
      });
    }

    const distributed = rows.reduce((s, r) => s + r.fraction, 0);
    return {
      netEstate,
      rows,
      unallocated: Math.max(0, 1 - distributed) * netEstate,
    };
  }, [estateValue, estateDebts, spouseType, wifeCount, sons, daughters, fatherAlive, motherAlive]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <p className="text-xs font-semibold text-[#047857] dark:text-emerald-400">
          শরিয়াহভিত্তিক আর্থিক ও সম্পদ হিসাব
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          যাকাত, ফিতরা ও উত্তরাধিকার ক্যালকুলেটর
        </h1>

        <div className="mt-5 inline-flex flex-wrap rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
          {[
            { id: 'zakat', label: 'যাকাত ক্যালকুলেটর' },
            { id: 'fitrah', label: 'ফিতরা ক্যালকুলেটর' },
            { id: 'inheritance', label: 'উত্তরাধিকার (ফারায়েজ)' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                subTab === t.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* ZAKAT CALCULATOR */}
      {subTab === 'zakat' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#047857]" />
              সম্পদের বিবরণ লিখুন
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  স্বর্ণের পরিমাণ (ভরি)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={goldVori}
                  onChange={(e) => setGoldVori(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  প্রতি ভরি স্বর্ণের বাজারমূল্য (টাকা)
                </label>
                <input
                  type="number"
                  min={0}
                  value={goldPricePerVori}
                  onChange={(e) => setGoldPricePerVori(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  রূপার পরিমাণ (ভরি)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={silverVori}
                  onChange={(e) => setSilverVori(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  প্রতি ভরি রূপার বাজারমূল্য (টাকা)
                </label>
                <input
                  type="number"
                  min={0}
                  value={silverPricePerVori}
                  onChange={(e) => setSilverPricePerVori(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  হাতে থাকা নগদ টাকা
                </label>
                <input
                  type="number"
                  min={0}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ব্যাংক ব্যালেন্স ও সঞ্চয়
                </label>
                <input
                  type="number"
                  min={0}
                  value={bankAmount}
                  onChange={(e) => setBankAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ব্যবসায়িক পণ্য ও বিনিয়োগ (টাকা)
                </label>
                <input
                  type="number"
                  min={0}
                  value={businessAssets}
                  onChange={(e) => setBusinessAssets(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  চলতি দেনা বা ঋণ (বাদ যাবে)
                </label>
                <input
                  type="number"
                  min={0}
                  value={debts}
                  onChange={(e) => setDebts(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                নেসাব মানদণ্ড নির্বাচন করুন
              </label>
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setNisabStandard('silver')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    nisabStandard === 'silver'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  রূপার নেসাব (৫২.৫ ভরি)
                </button>
                <button
                  type="button"
                  onClick={() => setNisabStandard('gold')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    nisabStandard === 'gold'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  স্বর্ণের নেসাব (৭.৫ ভরি)
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                যাকাত হিসাবের ফলাফল
              </h3>
              <div className="space-y-2.5 text-sm tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">মোট সম্পদ:</span>
                  <span className="font-semibold">৳ {formatBnNumber(totalAssets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">দেনা বাদে নিট সম্পদ:</span>
                  <span className="font-semibold">৳ {formatBnNumber(netZakatable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">বর্তমান নেসাব সীমা:</span>
                  <span className="font-semibold">৳ {formatBnNumber(nisabThreshold)}</span>
                </div>
              </div>

              <div
                className={`rounded-2xl p-5 border ${
                  isZakatDue
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#047857]/40'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isZakatDue
                    ? 'আপনার ওপর ২.৫% হারে যাকাত ফরজ হয়েছে:'
                    : 'আপনার নিট সম্পদ নেসাবের চেয়ে কম হওয়ায় বর্তমানে যাকাত ফরজ নয়।'}
                </p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums text-[#047857] dark:text-emerald-400">
                  ৳ {formatBnNumber(zakatAmount)} টাকা
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 p-3.5 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <span>
                জটিল ব্যবসায়িক শেয়ার, দীর্ঘমেয়াদি ঋণ বা জমি সংক্রান্ত সম্পদের যাকাত নির্ণয়ে প্রয়োজনে অভিজ্ঞ আলেমের পরামর্শ নিন।
              </span>
            </div>
          </div>
        </section>
      )}

      {/* FITRAH CALCULATOR */}
      {subTab === 'fitrah' && (
        <section className="max-w-3xl mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              সাদাকাতুল ফিতর (ফিতরা) হিসাব
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              ঈদুল ফিতরের নামাজের আগে পরিবারের প্রতিটি সদস্যের পক্ষ থেকে ফিতরা আদায় করা ওয়াজিব।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                পরিবারের সদস্য সংখ্যা
              </label>
              <input
                type="number"
                min={1}
                value={familyMembers}
                onChange={(e) => setFamilyMembers(Math.max(1, Number(e.target.value)))}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm font-semibold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                খাদ্যপণ্য নির্বাচন করুন
              </label>
              <select
                value={selectedStaple}
                onChange={(e) => handleSelectStaple(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm font-medium"
              >
                {FITRAH_STAPLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                জনপ্রতি হার (টাকা)
              </label>
              <input
                type="number"
                min={10}
                value={customFitrahRate}
                onChange={(e) => setCustomFitrahRate(Math.max(0, Number(e.target.value)))}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-[#047857]/30 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {toBnDigits(familyMembers)} জন সদস্যের মোট সাদাকাতুল ফিতর
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-[#047857] dark:text-emerald-400">
                ৳ {formatBnNumber(totalFitrah)} টাকা
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed">
              ইসলামিক ফাউন্ডেশন বাংলাদেশের নির্ধারিত বার্ষিক ফিতরার হার অনুযায়ী সামর্থ্যবানরা গম ছাড়াও খেজুর, কিসমিস বা পনিরের মূল্য হিসেবে আদায় করলে অধিক সওয়াব পাওয়া যায়।
            </p>
          </div>
        </section>
      )}

      {/* INHERITANCE CALCULATOR */}
      {subTab === 'inheritance' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              মৃত ব্যক্তির সম্পদ ও জীবিত ওয়ারিশগণ
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  মোট রেখে যাওয়া সম্পদের মূল্য (টাকা)
                </label>
                <input
                  type="number"
                  min={0}
                  value={estateValue}
                  onChange={(e) => setEstateValue(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  কাফন-দাফন ও ঋণ পরিশোধ (টাকা)
                </label>
                <input
                  type="number"
                  min={0}
                  value={estateDebts}
                  onChange={(e) => setEstateDebts(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  জীবিত স্বামী বা স্ত্রী
                </label>
                <select
                  value={spouseType}
                  onChange={(e) => setSpouseType(e.target.value as 'none' | 'wife' | 'husband')}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm"
                >
                  <option value="none">কেউ নেই</option>
                  <option value="wife">স্ত্রী</option>
                  <option value="husband">স্বামী</option>
                </select>
              </div>
              {spouseType === 'wife' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    স্ত্রীর সংখ্যা
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={wifeCount}
                    onChange={(e) => setWifeCount(Math.min(4, Math.max(1, Number(e.target.value))))}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  পুত্র সংখ্যা
                </label>
                <input
                  type="number"
                  min={0}
                  value={sons}
                  onChange={(e) => setSons(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  কন্যা সংখ্যা
                </label>
                <input
                  type="number"
                  min={0}
                  value={daughters}
                  onChange={(e) => setDaughters(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fatherAlive}
                  onChange={(e) => setFatherAlive(e.target.checked)}
                  className="w-4 h-4 accent-[#047857]"
                />
                পিতা জীবিত আছেন
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={motherAlive}
                  onChange={(e) => setMotherAlive(e.target.checked)}
                  className="w-4 h-4 accent-[#047857]"
                />
                মাতা জীবিত আছেন
              </label>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                বণ্টনের ফলাফল (নিট সম্পদ: ৳ {formatBnNumber(inheritanceResult.netEstate)})
              </h3>

              <div className="mt-4 space-y-2.5">
                {inheritanceResult.rows.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    প্রাথমিক ওয়ারিশদের কেউ না থাকলে ভাই-বোন বা অন্যান্য আসাবা ওয়ারিশ প্রযোজ্য হবে।
                  </p>
                ) : (
                  inheritanceResult.rows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {row.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          অংশ: {formatBnNumber(row.fraction * 100, 1)}%
                        </p>
                      </div>
                      <p className="text-base font-bold tabular-nums text-[#047857] dark:text-emerald-400 whitespace-nowrap">
                        ৳ {formatBnNumber(row.amount)}
                      </p>
                    </div>
                  ))
                )}

                {inheritanceResult.unallocated > 1 && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3.5 text-xs text-slate-700 dark:text-slate-300">
                    অবশিষ্ট ৳ {formatBnNumber(inheritanceResult.unallocated)} টাকা দূরবর্তী আসাবা ওয়ারিশদের (যেমন ভাই-বোন বা চাচা) মধ্যে বণ্টিত হবে।
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                <strong className="block text-[#D97706] dark:text-amber-400 mb-0.5">
                  আলেমের পরামর্শ নিন
                </strong>
                উত্তরাধিকার আইন অত্যন্ত সূক্ষ্ম। মৃত ব্যক্তির দাদা-দাদি, ভাই-বোন, অসিয়ত বা জটিল পারিবারিক অবস্থায় চূড়ান্ত সম্পদ বণ্টনের আগে অবশ্যই একজন বিজ্ঞ মুফতি বা আলেমের পরামর্শ নিন।
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
