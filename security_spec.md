# Security Specification & Payload TDD — Deen-e-Jibon

## 1. Data Invariants
1. User private records (`users/{userId}` and subcollections `bookmarks`, `last_read`, `amal_logs`, `qaza_tracker`) contain PII or private worship logs and MUST only be readable/writable by `request.auth.uid == userId` with verified auth (`email_verified == true`).
2. Public leaderboard entries (`quiz_leaderboard/{entryId}`) MUST NOT contain PII (no email/phone) and `entryId` must match `{uid}_{dateKey}` or `uid` owned by `request.auth.uid`.
3. Forum questions and answers MUST verify `authorUid == request.auth.uid` on create, enforce strict `hasOnly()` key allowlists and bounded string lengths, and prevent modifying `authorUid` or `createdAt` on update.
4. Forum answers MUST verify parent question existence via `exists()` on create (Master Gate).
5. All server timestamps (`createdAt`, `updatedAt`) MUST equal `request.time`.

## 2. Dirty Dozen Adversarial Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read of `/users/userA`.
2. Authenticated `userB` reading `/users/userA` (PII leak test).
3. Authenticated `userA` writing `/users/userA` with `uid: "userB"` (Identity spoofing).
4. Authenticated `userA` writing `/users/userA` with extra shadow field `isAdmin: true` (Shadow update test).
5. Authenticated `userA` writing `/users/userA` with client-forged `createdAt` != `request.time`.
6. Authenticated `userA` writing `/users/userA/bookmarks/bad*id` (ID poisoning with invalid regex).
7. Authenticated `userA` writing `/users/userA/amal_logs/2026-11-26` with `fajr: "yes"` (Type poisoning).
8. Authenticated `userA` writing `/quiz_leaderboard/userB_2026-11-26` (Hijacking another user's leaderboard entry).
9. Authenticated `userA` writing `/quiz_leaderboard/userA_2026-11-26` with `score: 99999` (Out-of-bounds score).
10. Authenticated `userA` creating `/forum_questions/q1` with 5000-char `body` (Resource exhaustion).
11. Authenticated `userA` updating `/forum_questions/q1` owned by `userB` (Cross-user tamper).
12. Authenticated `userA` creating `/forum_questions/nonexistent/answers/a1` (Orphaned subcollection write).
