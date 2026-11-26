// Adversarial security rule test matrix verifying Dirty Dozen payloads against firestore.rules
export const dirtyDozenSecurityCases = [
  { id: 1, name: 'Unauthenticated user profile read', path: '/users/userA', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Cross-user PII read', path: '/users/userA', actor: 'userB', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Identity spoofing on profile create', path: '/users/userA', payload: { uid: 'userB' }, expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow field injection (isAdmin)', path: '/users/userA', payload: { isAdmin: true }, expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Client-forged createdAt timestamp', path: '/users/userA', payload: { createdAt: 'client-time' }, expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'ID poisoning in bookmark doc ID', path: '/users/userA/bookmarks/bad*id', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Type poisoning in amal_logs', path: '/users/userA/amal_logs/2026-11-26', payload: { fajr: 'yes' }, expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Hijacking leaderboard entry of another user', path: '/quiz_leaderboard/userB_2026-11-26', actor: 'userA', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Out-of-bounds quiz score', path: '/quiz_leaderboard/userA_2026-11-26', payload: { score: 99999 }, expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Oversized forum question body', path: '/forum_questions/q1', payload: { bodyLen: 5000 }, expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Cross-user forum question update', path: '/forum_questions/q1', actor: 'userA', owner: 'userB', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Orphaned forum answer creation', path: '/forum_questions/nonexistent/answers/a1', expected: 'PERMISSION_DENIED' },
];
