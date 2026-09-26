# Security Specification & Firestore Hardening

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created, updated, or read by the authenticated user whose `request.auth.uid == userId`.
2. **Immutability of UID**: The `id` field inside `/users/{userId}` cannot be spoofed or mutated post-creation.
3. **No Unauthenticated Access**: All sensitive writes require `isSignedIn()`.
4. **Content Bounds**: All user-supplied textual fields (`displayName`, `caption`, `content`, `name`) must have strict bounded sizes (`.size() <= MAX`).
5. **Squad Authorship**: Only the user creating a squad can set `leaderId` to their own `request.auth.uid`.
6. **Message Authenticity**: Any message created under `/squads/{squadId}/messages/{messageId}` must have `incoming().userId == request.auth.uid`.
7. **Post Authenticity**: Any post created under `/community_posts/{postId}` must have `incoming().userId == request.auth.uid`.
8. **Catch-All Default Deny**: All unmapped paths are denied by default (`match /{document=**} { allow read, write: if false; }`).

## 2. The "Dirty Dozen" Payloads
1. **Payload 1 (ID Spoof)**: Write to `/users/alice` with `request.auth.uid = 'bob'`. Expect: `PERMISSION_DENIED`.
2. **Payload 2 (Unauthenticated Read)**: Read `/users/alice` with `request.auth = null`. Expect: `PERMISSION_DENIED`.
3. **Payload 3 (Oversized Display Name)**: Create `/users/alice` with `displayName` exceeding 100 characters. Expect: `PERMISSION_DENIED`.
4. **Payload 4 (Oversized Message)**: Create `/squads/s1/messages/m1` with `content` of 5,000 characters. Expect: `PERMISSION_DENIED`.
5. **Payload 5 (Message Spoof)**: Create `/squads/s1/messages/m1` with `userId = 'charlie'` while auth UID is 'alice'. Expect: `PERMISSION_DENIED`.
6. **Payload 6 (Squad Leader Spoof)**: Create `/squads/s1` with `leaderId = 'bob'` while auth UID is 'alice'. Expect: `PERMISSION_DENIED`.
7. **Payload 7 (Post Author Spoof)**: Create `/community_posts/p1` with `userId = 'bob'` while auth UID is 'alice'. Expect: `PERMISSION_DENIED`.
8. **Payload 8 (Post Delete by Non-Author)**: Delete `/community_posts/p1` owned by 'alice' while auth UID is 'bob'. Expect: `PERMISSION_DENIED`.
9. **Payload 9 (Junk Path Injection)**: Access `/users/!!!badpath$$$`. Expect: `PERMISSION_DENIED`.
10. **Payload 10 (Direct Modification of Catch-All)**: Write to `/internal_system_secrets/config`. Expect: `PERMISSION_DENIED`.
11. **Payload 11 (Immortal Field Mutation)**: Update `/users/alice` attempting to change immutable `id` to `mallory`. Expect: `PERMISSION_DENIED`.
12. **Payload 12 (Negative/Corrupted Score Injection)**: Update `/users/alice` with non-number score or invalid property. Expect: `PERMISSION_DENIED`.

## 3. Test Runner Outline
The test suite ensures that every operation violating identity or schema invariants is denied by rules.
