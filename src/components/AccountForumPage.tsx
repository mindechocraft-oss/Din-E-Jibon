import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  MapPin,
  Bookmark,
  CheckSquare,
  Search,
} from 'lucide-react';
import { BANGLADESH_DISTRICTS, type DistrictInfo } from '../data/districts';
import {
  fetchForumAnswersCloud,
  fetchForumQuestionsCloud,
  type ForumAnswerItem,
  type ForumQuestionItem,
} from '../lib/firebase';
import { toBnDigits } from '../lib/bengali';

interface AccountForumPageProps {
  district: DistrictInfo;
  onChangeDistrict: (id: string) => void;
  bookmarksCount: number;
  todayAmalCompleted: number;
}

const FORUM_CATEGORIES = ['সকল', 'নামাজ ও পবিত্রতা', 'কোরআন ও তাফসির', 'রমজান ও রোজা', 'যাকাত ও ব্যবসা', 'দোয়া ও আমল'];

const DEFAULT_COMMUNITY_QUESTIONS: ForumQuestionItem[] = [
  {
    id: 'faq-1',
    authorUid: 'community',
    authorName: 'দ্বীনি সহায়তা',
    category: 'নামাজ ও পবিত্রতা',
    title: 'কাজা নামাজ আদায় করার সঠিক নিয়ম কী?',
    body: 'কারো পূর্ববর্তী ফরজ নামাজ ছুটে গেলে ওয়াক্তিয়া নামাজের আগে বা পরে অথবা সুবিধাজনক সময়ে কেবল ফরজ ও বিতর রাকাতগুলো ক্রমানুসারে কাজা আদায় করতে হবে।',
    createdAtMs: 1700000000000,
  },
  {
    id: 'faq-2',
    authorUid: 'community',
    authorName: 'দ্বীনি সহায়তা',
    category: 'নামাজ ও পবিত্রতা',
    title: 'সফরে নামাজ কসর করার দূরত্ব কত কিলোমিটার?',
    body: 'অধিকাংশ ফকিহ ও হানাফি মাজহাব অনুযায়ী প্রায় ৭৮ কিলোমিটার (৪৮ মাইল) বা তার বেশি দূরত্বে ভ্রমণের নিয়তে নিজ এলাকা অতিক্রম করলে ৪ রাকাত বিশিষ্ট ফরজ নামাজ ২ রাকাত কসর পড়তে হয়।',
    createdAtMs: 1700000100000,
  },
  {
    id: 'faq-3',
    authorUid: 'community',
    authorName: 'দ্বীনি সহায়তা',
    category: 'যাকাত ও ব্যবসা',
    title: 'ব্যাংকে জমানো টাকার ওপর কখন যাকাত ফরজ হয়?',
    body: 'নেসাব পরিমাণ সম্পদ (৫২.৫ ভরি রূপার সমমূল্য) কোনো ব্যক্তির মালিকানায় এক চন্দ্রবছর (হিজরি বছর) পূর্ণ হলে মোট সম্পদের ২.৫% যাকাত আদায় করা ফরজ হয়।',
    createdAtMs: 1700000200000,
  },
];

const DEFAULT_COMMUNITY_ANSWERS: Record<string, ForumAnswerItem[]> = {
  'faq-1': [
    {
      id: 'ans-1',
      questionId: 'faq-1',
      authorUid: 'community',
      authorName: 'তথ্য নোট',
      body: 'যত দ্রুত সম্ভব তওবা ও নিয়মিত কাজা আদায়ের রুটিন করে নেওয়া উত্তম। এই অ্যাপের "আমল ও কাজা ট্র্যাকার" থেকে সহজেই হিসাব রাখা যায়।',
      createdAtMs: 1700000005000,
    },
  ],
};

export const AccountForumPage: React.FC<AccountForumPageProps> = ({
  district,
  onChangeDistrict,
  bookmarksCount,
  todayAmalCompleted,
}) => {
  const [authorName, setAuthorName] = useState<string>(() => {
    try {
      return localStorage.getItem('deen_player_name') || 'আব্দুল্লাহ';
    } catch {
      return 'আব্দুল্লাহ';
    }
  });
  const [selectedCategory, setSelectedCategory] = useState('সকল');
  const [searchQuery, setSearchQuery] = useState('');

  const [localQuestions, setLocalQuestions] = useState<ForumQuestionItem[]>(() => {
    try {
      const raw = localStorage.getItem('deen_forum_questions');
      return raw ? (JSON.parse(raw) as ForumQuestionItem[]) : DEFAULT_COMMUNITY_QUESTIONS;
    } catch {
      return DEFAULT_COMMUNITY_QUESTIONS;
    }
  });
  const [cloudQuestions, setCloudQuestions] = useState<ForumQuestionItem[]>([]);
  const [forumLoading, setForumLoading] = useState(false);

  const [qCategory, setQCategory] = useState(FORUM_CATEGORIES[1]);
  const [qTitle, setQTitle] = useState('');
  const [qBody, setQBody] = useState('');
  const [forumError, setForumError] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<string, ForumAnswerItem[]>>(() => {
    try {
      const raw = localStorage.getItem('deen_forum_answers');
      return raw ? (JSON.parse(raw) as Record<string, ForumAnswerItem[]>) : DEFAULT_COMMUNITY_ANSWERS;
    } catch {
      return DEFAULT_COMMUNITY_ANSWERS;
    }
  });
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    setForumLoading(true);
    fetchForumQuestionsCloud()
      .then((list) => setCloudQuestions(list))
      .catch(() => {})
      .finally(() => setForumLoading(false));
  }, []);

  const allQuestions = [...localQuestions, ...cloudQuestions].filter((q) => {
    if (selectedCategory !== 'সকল' && q.category !== selectedCategory) return false;
    const s = searchQuery.trim().toLowerCase();
    if (!s) return true;
    return q.title.toLowerCase().includes(s) || q.body.toLowerCase().includes(s);
  });

  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setForumError(null);
    if (qTitle.trim().length < 3 || qBody.trim().length < 5) {
      setForumError('প্রশ্নের শিরোনাম (কমপক্ষে ৩ অক্ষর) ও বিস্তারিত বিবরণ লিখুন।');
      return;
    }
    const cleanName = authorName.trim() || 'মুসলিম ভাই/বোন';
    const newItem: ForumQuestionItem = {
      id: `local-${Date.now()}`,
      authorUid: 'local',
      authorName: cleanName,
      category: qCategory,
      title: qTitle.trim(),
      body: qBody.trim(),
      createdAtMs: Date.now(),
    };
    const updated = [newItem, ...localQuestions];
    setLocalQuestions(updated);
    try {
      localStorage.setItem('deen_forum_questions', JSON.stringify(updated));
      localStorage.setItem('deen_player_name', cleanName);
    } catch {
      // ignore
    }
    setQTitle('');
    setQBody('');
  };

  const toggleExpandQuestion = async (qId: string) => {
    if (expandedQuestionId === qId) {
      setExpandedQuestionId(null);
      return;
    }
    setExpandedQuestionId(qId);
    if (!qId.startsWith('local-') && !qId.startsWith('faq-')) {
      try {
        const ans = await fetchForumAnswersCloud(qId);
        setAnswersMap((prev) => ({ ...prev, [qId]: ans }));
      } catch {
        // ignore
      }
    }
  };

  const handlePostAnswer = (qId: string) => {
    if (replyText.trim().length < 2) return;
    const cleanName = authorName.trim() || 'মুসলিম ভাই/বোন';
    const newAns: ForumAnswerItem = {
      id: `ans-${Date.now()}`,
      questionId: qId,
      authorUid: 'local',
      authorName: cleanName,
      body: replyText.trim(),
      createdAtMs: Date.now(),
    };
    const nextMap = {
      ...answersMap,
      [qId]: [...(answersMap[qId] || []), newAns],
    };
    setAnswersMap(nextMap);
    try {
      localStorage.setItem('deen_forum_answers', JSON.stringify(nextMap));
    } catch {
      // ignore
    }
    setReplyText('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Personal Summary & Preferences (No Login Needed) */}
      <section className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 h-fit">
        <div>
          <p className="text-xs font-semibold text-[#047857] dark:text-emerald-400">
            সরাসরি ব্যবহারযোগ্য (লগইন প্রয়োজন নেই)
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
            আপনার ব্যক্তিগত সারসংক্ষেপ
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            বুকমার্ক, আমল ও ফোরাম নোট এই ডিভাইসে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে।
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
            <Bookmark className="w-4 h-4 text-[#047857] mx-auto mb-1" />
            <p className="text-xl font-bold tabular-nums text-[#047857] dark:text-emerald-400">
              {toBnDigits(bookmarksCount)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">বুকমার্ক আয়াত</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
            <CheckSquare className="w-4 h-4 text-[#D97706] mx-auto mb-1" />
            <p className="text-xl font-bold tabular-nums text-[#D97706] dark:text-amber-400">
              {toBnDigits(todayAmalCompleted)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">আজকের আমল</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            আপনার নাম (কুইজ ও প্রশ্নোত্তরের জন্য)
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => {
              setAuthorName(e.target.value);
              try {
                localStorage.setItem('deen_player_name', e.target.value);
              } catch {
                // ignore
              }
            }}
            placeholder="আপনার নাম লিখুন"
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm font-semibold"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#047857]" />
            সংরক্ষিত জেলা
          </label>
          <select
            value={district.id}
            onChange={(e) => onChangeDistrict(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm font-semibold"
          >
            {BANGLADESH_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameBn} ({d.divisionBn})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Right: Islamic Q&A Forum */}
      <section className="lg:col-span-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#D97706] dark:text-amber-400">
              দ্বীনি আলোচনা ও নোটবুক
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#047857]" />
              দ্বীনি প্রশ্নোত্তর ফোরাম
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রশ্ন খুঁজুন..."
              className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FORUM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#047857] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form
          onSubmit={handlePostQuestion}
          className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              নতুন প্রশ্ন বা দ্বীনি নোট লিখুন
            </span>
            <select
              value={qCategory}
              onChange={(e) => setQCategory(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium"
            >
              {FORUM_CATEGORIES.filter((c) => c !== 'সকল').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={qTitle}
            onChange={(e) => setQTitle(e.target.value)}
            placeholder="প্রশ্নের শিরোনাম লিখুন..."
            maxLength={160}
            className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm"
          />
          <textarea
            rows={3}
            value={qBody}
            onChange={(e) => setQBody(e.target.value)}
            placeholder="আপনার প্রশ্ন বা বিবরণ লিখুন..."
            maxLength={2000}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm"
          />

          {forumError && <p className="text-xs text-rose-600 dark:text-rose-400">{forumError}</p>}

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              মাসআলা-মাসায়েলের ক্ষেত্রে অভিজ্ঞ আলেমের পরামর্শ নেওয়া উত্তম।
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] hover:bg-emerald-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              পোস্ট করুন
            </button>
          </div>
        </form>

        {forumLoading && allQuestions.length === 0 ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {allQuestions.map((q) => {
              const isOpen = expandedQuestionId === q.id;
              const answers = answersMap[q.id] || [];
              return (
                <article
                  key={q.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#047857] dark:text-emerald-400">
                      {q.category} · {q.authorName}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpandQuestion(q.id)}
                      className="text-xs font-semibold text-[#D97706] hover:underline"
                    >
                      {isOpen ? 'উত্তর লুকান' : `উত্তর দেখুন (${toBnDigits(answers.length)})`}
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {q.title}
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {q.body}
                  </p>

                  {isOpen && (
                    <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      {answers.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          এখনো কোনো উত্তর যুক্ত হয়নি।
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {answers.map((a) => (
                            <div
                              key={a.id}
                              className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs sm:text-sm"
                            >
                              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">
                                {a.authorName}
                              </span>
                              <p className="text-slate-700 dark:text-slate-300">{a.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="আপনার উত্তর বা মন্তব্য লিখুন..."
                          className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handlePostAnswer(q.id)}
                          className="px-4 py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold"
                        >
                          উত্তর দিন
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
