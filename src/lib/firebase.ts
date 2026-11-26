import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;
export async function testFirestoreConnection(): Promise<boolean> {
  if (connectionTested) return true;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or unreachable; using local cache.');
    }
    return false;
  }
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  await sendEmailVerification(cred.user).catch(() => {});
  return cred;
}

export async function resendVerificationEmail(user: User) {
  await sendEmailVerification(user);
}

export async function logoutUser() {
  return signOut(auth);
}

export interface UserProfileDoc {
  uid: string;
  displayName: string;
  email: string;
  district: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function ensureUserProfile(user: User, defaultDistrict = 'Dhaka'): Promise<UserProfileDoc | null> {
  if (!user.emailVerified) return null;
  const path = `users/${user.uid}`;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfileDoc;
    }
    const profile = {
      uid: user.uid,
      displayName: (user.displayName || user.email?.split('@')[0] || 'মুসলিম ভাই/বোন').slice(0, 80),
      email: user.email || 'unknown@example.com',
      district: defaultDistrict,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return {
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      district: profile.district,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserDistrict(user: User, displayName: string, district: string) {
  if (!user.emailVerified) return;
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        displayName: displayName.slice(0, 80),
        email: user.email || 'unknown@example.com',
        district,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export interface BookmarkItem {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  surahNameBn: string;
  translationBn: string;
}

export async function saveBookmarkCloud(user: User, item: Omit<BookmarkItem, 'id'>) {
  if (!user.emailVerified) return;
  const bookmarkId = `${item.surahNumber}_${item.ayahNumber}`;
  const path = `users/${user.uid}/bookmarks/${bookmarkId}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'bookmarks', bookmarkId), {
      uid: user.uid,
      surahNumber: item.surahNumber,
      ayahNumber: item.ayahNumber,
      surahNameBn: item.surahNameBn.slice(0, 100),
      translationBn: item.translationBn.slice(0, 2000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeBookmarkCloud(user: User, surahNumber: number, ayahNumber: number) {
  if (!user.emailVerified) return;
  const bookmarkId = `${surahNumber}_${ayahNumber}`;
  const path = `users/${user.uid}/bookmarks/${bookmarkId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'bookmarks', bookmarkId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchBookmarksCloud(user: User): Promise<BookmarkItem[]> {
  const path = `users/${user.uid}/bookmarks`;
  try {
    const q = query(collection(db, 'users', user.uid, 'bookmarks'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        surahNumber: data.surahNumber,
        ayahNumber: data.ayahNumber,
        surahNameBn: data.surahNameBn,
        translationBn: data.translationBn,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export interface LastReadState {
  surahNumber: number;
  ayahNumber: number;
  surahNameBn: string;
}

export async function saveLastReadCloud(user: User, data: LastReadState) {
  if (!user.emailVerified) return;
  const path = `users/${user.uid}/last_read/current`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'last_read', 'current'), {
      uid: user.uid,
      surahNumber: data.surahNumber,
      ayahNumber: data.ayahNumber,
      surahNameBn: data.surahNameBn.slice(0, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchLastReadCloud(user: User): Promise<LastReadState | null> {
  const path = `users/${user.uid}/last_read/current`;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'last_read', 'current'));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      surahNumber: d.surahNumber,
      ayahNumber: d.ayahNumber,
      surahNameBn: d.surahNameBn,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export interface AmalDayLog {
  date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  quran: boolean;
  dhikr: boolean;
  sadaqah: boolean;
  fasting: boolean;
  sunnah: boolean;
}

export async function saveAmalLogCloud(user: User, log: AmalDayLog) {
  if (!user.emailVerified) return;
  const path = `users/${user.uid}/amal_logs/${log.date}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'amal_logs', log.date), {
      uid: user.uid,
      ...log,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAmalLogsCloud(user: User): Promise<Record<string, AmalDayLog>> {
  const path = `users/${user.uid}/amal_logs`;
  try {
    const q = query(collection(db, 'users', user.uid, 'amal_logs'), limit(90));
    const snap = await getDocs(q);
    const out: Record<string, AmalDayLog> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      out[data.date] = {
        date: data.date,
        fajr: Boolean(data.fajr),
        dhuhr: Boolean(data.dhuhr),
        asr: Boolean(data.asr),
        maghrib: Boolean(data.maghrib),
        isha: Boolean(data.isha),
        quran: Boolean(data.quran),
        dhikr: Boolean(data.dhikr),
        sadaqah: Boolean(data.sadaqah),
        fasting: Boolean(data.fasting),
        sunnah: Boolean(data.sunnah),
      };
    });
    return out;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export interface QazaState {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  fasting: number;
}

export async function saveQazaCloud(user: User, qaza: QazaState) {
  if (!user.emailVerified) return;
  const path = `users/${user.uid}/qaza_tracker/summary`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'qaza_tracker', 'summary'), {
      uid: user.uid,
      ...qaza,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchQazaCloud(user: User): Promise<QazaState | null> {
  const path = `users/${user.uid}/qaza_tracker/summary`;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'qaza_tracker', 'summary'));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      fajr: Number(d.fajr) || 0,
      dhuhr: Number(d.dhuhr) || 0,
      asr: Number(d.asr) || 0,
      maghrib: Number(d.maghrib) || 0,
      isha: Number(d.isha) || 0,
      fasting: Number(d.fasting) || 0,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export interface LeaderboardEntry {
  id: string;
  uid: string;
  displayName: string;
  score: number;
  dateKey: string;
  totalCompleted: number;
}

export async function saveQuizScoreCloud(
  user: User,
  score: number,
  dateKey: string
) {
  if (!user.emailVerified) return;
  const entryId = `${user.uid}_${dateKey}`;
  const path = `quiz_leaderboard/${entryId}`;
  try {
    const ref = doc(db, 'quiz_leaderboard', entryId);
    const snap = await getDoc(ref);
    const prevCompleted = snap.exists() ? Number(snap.data().totalCompleted) || 0 : 0;
    const prevScore = snap.exists() ? Number(snap.data().score) || 0 : 0;
    await setDoc(ref, {
      uid: user.uid,
      displayName: (user.displayName || user.email?.split('@')[0] || 'ইসলামিক শিক্ষার্থী').slice(0, 80),
      score: Math.max(prevScore, Math.min(100, score)),
      dateKey,
      totalCompleted: Math.min(500, prevCompleted + 1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchLeaderboardCloud(): Promise<LeaderboardEntry[]> {
  const path = 'quiz_leaderboard';
  try {
    const q = query(collection(db, 'quiz_leaderboard'), orderBy('score', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: data.uid,
        displayName: data.displayName,
        score: Number(data.score) || 0,
        dateKey: data.dateKey || '',
        totalCompleted: Number(data.totalCompleted) || 1,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export interface ForumQuestionItem {
  id: string;
  authorUid: string;
  authorName: string;
  category: string;
  title: string;
  body: string;
  createdAtMs: number;
}

export interface ForumAnswerItem {
  id: string;
  questionId: string;
  authorUid: string;
  authorName: string;
  body: string;
  createdAtMs: number;
}

export async function fetchForumQuestionsCloud(): Promise<ForumQuestionItem[]> {
  const path = 'forum_questions';
  try {
    const q = query(collection(db, 'forum_questions'), orderBy('createdAt', 'desc'), limit(40));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        authorUid: data.authorUid,
        authorName: data.authorName,
        category: data.category,
        title: data.title,
        body: data.body,
        createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createForumQuestionCloud(
  user: User,
  payload: { category: string; title: string; body: string }
) {
  if (!user.emailVerified) {
    throw new Error('প্রশ্ন করতে অনুগ্রহ করে আপনার ইমেইল ভেরিফাই করুন অথবা গুগল দিয়ে লগইন করুন।');
  }
  const path = 'forum_questions';
  try {
    const docRef = await addDoc(collection(db, 'forum_questions'), {
      authorUid: user.uid,
      authorName: (user.displayName || user.email?.split('@')[0] || 'সদস্য').slice(0, 80),
      category: payload.category.slice(0, 40),
      title: payload.title.trim().slice(0, 160),
      body: payload.body.trim().slice(0, 2000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchForumAnswersCloud(questionId: string): Promise<ForumAnswerItem[]> {
  const path = `forum_questions/${questionId}/answers`;
  try {
    const q = query(
      collection(db, 'forum_questions', questionId, 'answers'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        questionId: data.questionId,
        authorUid: data.authorUid,
        authorName: data.authorName,
        body: data.body,
        createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createForumAnswerCloud(
  user: User,
  questionId: string,
  body: string
) {
  if (!user.emailVerified) {
    throw new Error('উত্তর দিতে অনুগ্রহ করে ইমেইল ভেরিফাই করুন অথবা গুগল দিয়ে লগইন করুন।');
  }
  const path = `forum_questions/${questionId}/answers`;
  try {
    const docRef = await addDoc(collection(db, 'forum_questions', questionId, 'answers'), {
      questionId,
      authorUid: user.uid,
      authorName: (user.displayName || user.email?.split('@')[0] || 'সদস্য').slice(0, 80),
      body: body.trim().slice(0, 1500),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
