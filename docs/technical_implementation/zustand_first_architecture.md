# Zustand-First 아키텍처: Pro 유저 상태 관리 리팩토링

> **작성일**: 2026-02-12 (최종 업데이트: 2026-02-14)
> **상태**: Phase 1 완료 (Vocabulary Lists), Phase 2 완료 (User Actions), Phase 3 계획 (Save RPC 통합)
> **핵심 원칙**: "Zustand 스토어 우선, 서버 데이터는 초기 시드, revalidatePath 불필요"

---

## 📋 목차

1. [무엇을 하는가 (What)](#1-무엇을-하는가-what)
2. [왜 하는가 (Why)](#2-왜-하는가-why)
3. [어떻게 하는가 (How)](#3-어떻게-하는가-how)
4. [\_pendingOps 메커니즘](#4-_pendingops-메커니즘)
5. [Phase 1: Vocabulary Lists (완료)](#5-phase-1-vocabulary-lists-완료)
6. [Phase 2: User Actions (완료)](#6-phase-2-user-actions-완료)
7. [파일별 검토 결과](#7-파일별-검토-결과)
8. [데이터 흐름 다이어그램](#8-데이터-흐름-다이어그램)
9. [신뢰성 및 예외 처리](#9-신뢰성-및-예외-처리)
10. [Phase 3: Save RPC 통합 (계획)](#10-phase-3-save-rpc-통합-계획)

---

## 1. 무엇을 하는가 (What)

### 대상 데이터

Pro 유저가 서버(Supabase)와 동기화하는 **모든 클라이언트 상태**를 Zustand 스토어로 전환합니다.

| 데이터                                                 | DB 테이블                               | 현재 상태 관리 | 목표 상태 관리            |
| ------------------------------------------------------ | --------------------------------------- | -------------- | ------------------------- |
| **단어장 목록** (lists, item_count, is_default, title) | `vocabulary_lists` + `vocabulary_items` | SWR 직접 사용  | ✅ Zustand (Phase 1 완료) |
| **단어장 내 표현 매핑** (savedListIds)                 | `vocabulary_items`                      | SWR 직접 사용  | ✅ Zustand (Phase 1 완료) |
| **저장 상태** (save actions)                           | `user_actions` (action_type='save')     | SWR 직접 사용  | ✅ Zustand (Phase 2 완료) |
| **학습 상태** (learn actions)                          | `user_actions` (action_type='learn')    | SWR 직접 사용  | ✅ Zustand (Phase 2 완료) |

### 핵심 규칙

1. **Zustand 스토어가 비어있으면** → 서버에서 가져온 데이터를 스토어에 동기화 → 이후 스토어에서 읽음
2. **Zustand 스토어에 데이터가 있으면** → 스토어 데이터를 바로 사용 (서버 데이터 무시)
3. **사용자 액션 시** → 스토어를 즉시 업데이트 → UI 즉시 반영 → 서버 액션은 백그라운드
4. **`_pendingOps > 0`이면** → 백그라운드 SWR 동기화를 자동 스킵하여 낙관적 데이터 보호

---

## 2. 왜 하는가 (Why)

### 문제 1: SWR 백그라운드 리페치가 낙관적 업데이트를 덮어씀

```
T0: 사용자 저장 클릭 → optimisticToggle() → item_count: 5 → 6 ✅
T1: SWR 백그라운드 리페치 도착 (T0 이전에 시작된 요청)
    → syncWithServer({item_count: 5}) → 6 → 5 ❌ (다시 내려감)
T2: 서버 액션 완료 → mutate() → item_count: 6 ✅ (뒤늦게 올라감)
```

**증상**: 숫자가 올라갔다가 내려갔다가 다시 올라가는 "깜빡임" 현상

### 문제 2: 서버 컴포넌트 데이터가 스토어를 무시

```
피드 페이지: 저장 버튼 3번 클릭 → Zustand item_count +3
/me 페이지 이동 → VocabularyListContainer(서버 컴포넌트)
  → getVocabularyLists() → 서버 캐시의 이전 데이터 반환
  → VocabularyListManager(클라이언트 컴포넌트)가 서버 prop 사용
  → item_count가 +3 반영 안 됨 ❌
```

**증상**: 페이지 이동 시 항목 수가 이전 값으로 표시되다가 늦게 업데이트

### 문제 3: 저장 버튼 로딩 스피너

```
저장 버튼 클릭 → isSyncing = true → 로딩 스피너 표시
  → await getActiveLists()
  → await Promise.all([toggleSaveState(), syncOnSave()])
  → isSyncing = false → 스피너 해제
```

**증상**: 낙관적 업데이트인데 불필요한 로딩 스피너가 500ms~1s 동안 표시

### 문제 4: user_actions도 동일한 문제에 노출

```
useUserActions.toggleAction():
  → mutateSave(newData, { revalidate: false }) // SWR 낙관적 업데이트
  → await toggleUserAction() // 서버 액션
```

현재 `useUserActions`는 SWR만으로 낙관적 업데이트를 하므로:

- SWR의 `revalidateOnFocus`가 stale 데이터로 덮어쓸 수 있음
- 다른 탭에서 돌아오면 저장/학습 상태가 일시적으로 깜빡일 수 있음
- 여러 표현을 빠르게 저장할 때 SWR 내부 캐시 레이스 발생 가능

---

## 3. 어떻게 하는가 (How)

### 아키텍처 계층

```
┌──────────────────────────────────────────────────────────┐
│                   UI Layer (React)                       │
│                                                          │
│   컴포넌트가 Zustand 스토어를 직접 구독                         │
│   (서버 prop이나 SWR data가 아닌 스토어에서 렌더링)              │
└──────────────────────────────────────────────────────────┘
                        ↑ 구독
┌──────────────────────────────────────────────────────────┐
│             Zustand Store (Single Source of Truth)       │
│                                                          │
│   _pendingOps: number    ← 진행 중인 낙관적 업데이트 수         │
│   lists: []              ← 단어장 목록 (item_count 포함)     │
│   savedListIds: Map      ← 표현별 소속 리스트 ID              │
│                                                          │
│   optimistic*()  → _pendingOps++ + 즉시 상태 변경           │
│   resolveOperation(data?) → _pendingOps-- (0이면 서버 반영) │
│   syncWithServer(data)  → _pendingOps > 0이면 스킵         │
└──────────────────────────────────────────────────────────┘
                        ↑ 초기 데이터 공급
┌──────────────────────────────────────────────────────────┐
│                SWR Cache (Background Sync)               │
│                                                          │
│   역할: 초기 데이터 로드 + 주기적 서버 동기화                     │
│   useEffect(serverData) → syncWithServer (가드 적용)       │
└──────────────────────────────────────────────────────────┘
                        ↑ 데이터 페칭
┌──────────────────────────────────────────────────────────┐
│              Server (Supabase + Server Actions)          │
│                                                          │
│   getVocabularyLists(), getUserActions()                 │
│   addToVocabularyList(), toggleUserAction()              │
│   revalidatePath() → 전면 제거 (아래 섹션 참조)                │
└──────────────────────────────────────────────────────────┘
```

### revalidatePath 전면 제거

`services/actions/vocabulary.ts`의 모든 Server Actions에서 `revalidateMyPage()`, `revalidateVocabularyInfo(listId)` 호출을 **전면 제거**했습니다.

**제거 근거**:

1. **Dynamic Rendering**: `/me`, `/me/[listId]` 페이지는 `getAuthSession()` (쿠키)을 사용하므로 Dynamic Route입니다. Next.js의 Full Route Cache가 적용되지 않아 매 요청마다 서버가 DB에서 직접 쿼리합니다.
2. **네비게이션 방해**: 빠르게 여러 표현을 저장할 때 `revalidatePath`가 서버 재렌더링 큐를 생성하여, 이후 네비게이션 시 `/me` 페이지로 강제 리다이렉트되는 버그를 유발했습니다.
3. **불필요한 중복**: Zustand 스토어 + SWR 백그라운드 리페치가 이미 클라이언트 상태를 완전히 관리하므로 서버 캐시 무효화는 불필요합니다.

**데이터 흐름 (revalidatePath 제거 후)**:

```
사용자 액션 (저장/삭제/이동 등)
  → optimistic*() → Zustand 즉시 업데이트
  → 서버 액션 (백그라운드, DB만 처리, revalidatePath 없음)
  → resolveOperation → 스토어 확정
  → globalMutate → SWR 캐시 동기화

페이지 네비게이션
  /me        → Zustand 스토어에서 리스트 읽기
  /me/[id]   → 스토어(메타) + SWR(items)

  Server Component는 초기 시드만 (첫 방문 시)
  이후 방문은 스토어가 우선
```

### 롤백(Rollback) 및 정합성 보장 전략

서버 액션 실패 시 낙관적으로 업데이트된 스토어 데이터를 복구하는 두 가지 경로를 운영합니다:

1. **자동 복구 (SWR Background Revalidation)**:
   - 서버 에러 발생 시 `resolveOperation()`을 호출하여 `_pendingOps` 가드만 해제합니다.
   - 이때 스토어 데이터를 강제로 서버 데이터로 덮어쓰지(mutate) 않습니다.
   - 가드가 해제된 직후 발생하는 SWR의 백그라운드 리페치가 DB의 진본(Ground Truth) 데이터를 가져와 스토어를 자연스럽게 올바른 상태로 되돌립니다.
2. **명시적 롤백 (Manual Rollback)**:
   - 삭제와 같이 데이터가 소멸하는 작업에서는 에러 발생 시 `globalMutate`를 통해 이전 캐시 데이터를 복원하여 즉시 롤백을 유도할 수 있습니다.

**핵심**: `catch` 블록에서 불필요한 `globalMutate` 호출을 줄임으로써, 레이스 컨디션을 방지하고 SWR과 Zustand 간의 책임 분리를 명확히 했습니다.

### 서버 컴포넌트에서의 데이터 사용 패턴

서버 컴포넌트에서 가져온 데이터는 **클라이언트 컴포넌트의 초기 시드**로만 사용:

---

## 4. 동기화 유틸리티 (useVocabularyListSync)

상세 페이지(`RemoteVocabularyDetail`)의 복잡도를 낮추고 스토어↔SWR 캐시 간의 정합성을 보장하기 위해 중앙화된 동기화 훅을 사용합니다.

### 핵심 기능

1.  **`resolveAndSyncLists(serverData?)`**:
    - `_pendingOps` 카운터를 감소시키고 작업을 확정합니다.
    - 확정된 스토어 데이터를 `globalMutate("vocabulary_lists", ...)`를 통해 SWR 캐시에 강제 반영하여 다른 컴포넌트들(예: 마이페이지 목록)이 최신 상태를 즉시 읽게 합니다.
2.  **`adjustItemCounts(adjustments)`**:
    - 벌크 작업(삭제, 이동, 복사) 시 여러 단어장의 `item_count`를 상대값(`delta`)으로 일괄 조정합니다.
    - 모든 조정값에 `Math.max(0, ...)`를 적용하여 음수 방지 가드를 태웁니다.
3.  **`invalidateOtherDetailPages()`**:
    - `is_default` 설정 변경 등 다른 단어장 상세 페이지의 데이터에 영향을 주는 액션 발생 시, 해당 캐시들을 일괄 무효화(`revalidate: true`)합니다.

### 벌크 작업 정합성 가이드

벌크 이동/복사 시 서버는 DB 제약 조건(`ON CONFLICT DO NOTHING`)에 의해 중복 항목을 무시하지만, 클라이언트는 낙관적 업데이트 시점에 어떤 항목이 중복인지 알 수 없습니다.

- **정책**: 클라이언트는 일단 선택된 전체 개수만큼 카운트를 조정합니다.
- **교정**: 서버 액션 완료 후 실행되는 SWR 백그라운드 리페치가 DB의 실제 결과값으로 카운트를 최종 교정합니다. (깜빡임 최소화)

```tsx
// 서버 컴포넌트 (VocabularyListContainer.tsx)
async function VocabularyListContent({ isPro }) {
  const [lists, learnedCount] = isPro
    ? await Promise.all([getVocabularyLists(), getLearnedCount()])
    : [[], 0];
  return <VocabularyListManager lists={lists} isPro={isPro} />;
}

// 클라이언트 컴포넌트 (VocabularyListManager.tsx)
function VocabularyListManager({ lists: serverLists, isPro }) {
  const zustandLists = useVocabularyStore(selectLists);

  // Zustand 스토어가 있으면 우선 사용, 없으면 서버 prop fallback
  const activeLists = isPro
    ? zustandLists.length > 0
      ? zustandLists
      : serverLists
    : localLists;

  // 서버 prop으로 스토어 초기화 (스토어가 비어있을 때만)
  useEffect(() => {
    if (isPro && serverLists.length > 0 && store.lists.length === 0) {
      store.syncWithServer(serverLists);
    }
  }, [isPro, serverLists]);
}
```

---

## 4. \_pendingOps 메커니즘

### 개요

`_pendingOps`는 Zustand 스토어 내부의 **진행 중인 낙관적 업데이트 카운터**입니다.
이 카운터가 0보다 클 때는 백그라운드 SWR 동기화가 자동으로 스킵됩니다.

### 동작 원리

| 이벤트                            | \_pendingOps | 동작                                  |
| --------------------------------- | ------------ | ------------------------------------- |
| `optimisticToggle()`              | 0 → 1        | 스토어 즉시 업데이트 + 카운터 증가    |
| 백그라운드 SWR `syncWithServer()` | 1 (> 0)      | **스킵** (stale 데이터 무시)          |
| `resolveOperation(freshData)`     | 1 → 0        | 카운터 감소. 0이면 서버 데이터로 교체 |

### 단일 작업 예시

```
T0: 사용자가 저장 버튼 클릭
    → optimisticToggle() 호출
    → _pendingOps: 0 → 1
    → 스토어: item_count = 5 → 6 ✅

T1: SWR 백그라운드 리페치 응답 도착 (T0 이전에 시작된 요청)
    → syncWithServer() 호출
    → _pendingOps === 1 (> 0이므로 스킵!) ✅
    → 스토어: item_count = 6 유지 ✅

T2: 서버 액션 완료 + mutate() 리페치 완료
    → resolveOperation(freshData) 호출
    → _pendingOps: 1 → 0
    → 0이므로 서버 데이터로 교체: item_count = 6 ✅
```

### 동시 작업 예시

```
T0: 카드 A 저장 → optimisticToggle()
    → _pendingOps: 0 → 1
    → 스토어: item_count = 6

T1: 카드 B 저장 → optimisticToggle()
    → _pendingOps: 1 → 2
    → 스토어: item_count = 7

T2: 백그라운드 SWR → syncWithServer()
    → _pendingOps === 2 → 스킵 ✅

T3: 카드 A 서버 완료 → resolveOperation(freshDataA)
    → _pendingOps: 2 → 1 (> 0이므로 교체 안 함)
    → 스토어: item_count = 7 유지 ✅ (B의 낙관적 데이터 보호)

T4: 카드 B 서버 완료 → resolveOperation(freshDataB)
    → _pendingOps: 1 → 0
    → 0이므로 서버 데이터로 교체 ✅
    → 스토어: item_count = 7 (서버도 A+B 반영 완료)
```

### 핵심: 왜 boolean이 아닌 카운터인가?

`isOperating: boolean` 방식의 문제:

- 카드 A 시작 → `isOperating = true`
- 카드 B 시작 → 이미 `true` (변화 없음)
- 카드 A 완료 → `isOperating = false` ← **카드 B는 아직 진행 중인데 가드 해제!**
- 백그라운드 SWR → `isOperating === false` → stale 데이터로 덮어씀 ❌

`_pendingOps: number` 방식:

- 카드 A 시작 → `_pendingOps = 1`
- 카드 B 시작 → `_pendingOps = 2`
- 카드 A 완료 → `_pendingOps = 1` ← **아직 1이므로 가드 유지!**
- 백그라운드 SWR → `_pendingOps === 1` → 스킵 ✅

---

## 5. Phase 1: Vocabulary Lists (완료)

### 수정된 파일 목록

| 파일                                                  | 변경 내용                                                                                                           | 상태    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------- |
| `store/useVocabularyStore.ts`                         | Zustand + Immer 스토어 신규 생성. `_pendingOps` 카운터 + `resolveOperation` + `savedListIds` Map                    | ✅ 완료 |
| `hooks/user/useVocabularyLists.ts`                    | SWR → Zustand 동기화, `toggleInList`/`setDefaultList`에 낙관적 업데이트 + resolve 패턴, `isLoading: false`          | ✅ 완료 |
| `hooks/user/useSaveAction.ts`                         | `isSyncing` state 제거, Race Condition 수정 (`await Promise.resolve` + Zustand 읽기), Stale Closure 수정 (ref 패턴) | ✅ 완료 |
| `components/me/vocabulary/VocabularyListManager.tsx`  | Zustand 스토어 구독 (서버 prop → 스토어 우선), Reorder 코드 제거, `orderedLists` useState → `customLists` useMemo   | ✅ 완료 |
| `components/me/vocabulary/RemoteVocabularyDetail.tsx` | 각 핸들러에 낙관적 업데이트 + `resolveOperation()` 추가, 대량 작업 시 `setLists()`로 `item_count` 직접 조정         | ✅ 완료 |
| `components/vocabulary/VocabularyListModal.tsx`       | `savedListIds`를 Zustand 스토어 구독으로 전환, `toggleGenRef`로 stale 응답 방지, `onListAction` fire-and-forget     | ✅ 완료 |
| `components/vocabulary/VocabularyListItem.tsx`        | 프레젠테이셔널 컴포넌트로 전환 (이전 커밋에서 완료)                                                                 | ✅ 완료 |
| `hooks/user/useVocabularySync.ts`                     | `syncOnSave`에서 `addToVocabularyList` 직접 호출 → `toggleInList` 사용 (Zustand 낙관적 업데이트 포함)               | ✅ 완료 |
| `services/actions/vocabulary.ts`                      | `revalidatePath` 전면 제거 (Dynamic Route이므로 불필요, 네비게이션 방해 원인)                                       | ✅ 완료 |
| `components/vocabulary/EmptyListMessage.tsx`          | 모달 내 중복되던 빈 상태 UI를 순수 UI 컴포넌트로 추출. 서버 컴포넌트 호환성 확보.                                   | ✅ 완료 |

### 모달 데이터 로딩 및 상태 관리 최적화

Zustand 도입 이후, 모달 내의 데이터 흐름을 대폭 단순화했습니다:

1. **isLoading 상태 제거**:
   - `useVocabularyLists` 훅은 이제 SWR의 `fallbackData: []`를 활용합니다.
   - 데이터 페칭 중에도 `lists`는 항상 배열(초기값 `[]`)을 유지하므로, 별도의 `isLoading` 플래그 없이 `lists.length === 0` 만으로 로딩과 빈 상태를 동시에 제어합니다.
2. **isSubmitting 중심 제어**:
   - 외부 로딩 상태(`isLoading`)에 의존하던 버튼 활성화 및 스피너 로직을 컴포넌트 내부의 `isSubmitting` 상태로 단일화했습니다.
   - 이를 통해 네트워크 지연과 상관없이 사용자 액션에 대한 직접적인 피드백만 제공하여 UI 민첩성을 높였습니다.
3. **스켈레톤(Skeleton) 제거**:
   - SWR 캐시가 즉시 응답하므로, 잠깐 나타났다 사라지는 `SkeletonVocabularyList`를 제거했습니다. 이는 레이아웃 흔들림(CLS)을 줄이고 초기 렌더링 부하를 감소시킵니다.

### 대량 작업 시 스토어 업데이트 패턴

`optimisticToggle`은 단건 추가/삭제용입니다. 대량 삭제/이동/복사 시에는 서버 액션 완료 후 `setLists()`로 `item_count`를 직접 조정합니다:

```typescript
// 대량 삭제 후
const deletedCount = selectedIds.size;
const updatedLists = useVocabularyStore
  .getState()
  .lists.map((l) =>
    l.id === listId
      ? { ...l, item_count: Math.max(0, (l.item_count || 0) - deletedCount) }
      : l,
  );
useVocabularyStore.getState().setLists(updatedLists);
globalMutate("vocabulary_lists", updatedLists, false);

// 이동 후 (소스 감소, 타겟 증가)
const updatedLists = useVocabularyStore.getState().lists.map((l) => {
  if (l.id === targetListId)
    return { ...l, item_count: (l.item_count || 0) + count };
  if (l.id === listId)
    return { ...l, item_count: Math.max(0, (l.item_count || 0) - count) };
  return l;
});
```

**핵심**: `displayTotalCount = storeList?.item_count ?? data?.total_count ?? 0`에서 스토어가 우선이므로, 대량 작업 후에도 반드시 `setLists()`로 스토어를 업데이트해야 합니다.

---

## 6. Phase 2: User Actions (완료)

### 이전 구조 (`useUserActions.ts`)

```typescript
// SWR로 서버 데이터 페칭
const { data: saveActions, mutate: mutateSave } = useSWR(
  isPro ? ["actions", "save"] : null,
  () => getUserActions("save"),
);

// SWR 캐시 기반 낙관적 업데이트
const toggleAction = async (expressionId, type) => {
  const newData = currentData.includes(expressionId)
    ? currentData.filter((id) => id !== expressionId)
    : [...currentData, expressionId];

  await mutateFn(newData, { revalidate: false }); // SWR 캐시 직접 수정
  await toggleUserAction(expressionId, type); // 서버 액션
};
```

### 문제점

1. **SWR 캐시만 사용**: `revalidateOnFocus`나 다른 컴포넌트의 `mutate` 호출로 stale 데이터 가능
2. **hasAction()이 SWR data에 의존**: 배열 검색 (`includes`)으로 O(n) 성능
3. **LearnButton의 `isLoading.learn`**: SWR의 `isLoading`에 의존하여 초기 로딩 스피너 존재

### Phase 2 구현 완료 ✅

#### 스토어: `store/useUserActionStore.ts`

```typescript
interface UserActionStore {
  savedIds: Set<string>; // save 액션이 적용된 expressionId 집합
  learnedIds: Set<string>; // learn 액션이 적용된 expressionId 집합
  _pendingOps: number;
  _initialized: { save: boolean; learn: boolean }; // SWR 초기 데이터 수신 여부

  // 서버 동기화용: _pendingOps === 0일 때만 적용
  syncWithServer: (type: ActionType, ids: string[]) => void;

  // 낙관적 업데이트 (_pendingOps++)
  optimisticToggle: (expressionId: string, type: ActionType) => void;

  // 작업 완료: _pendingOps--, 0이면 서버 데이터로 동기화
  resolveOperation: (type: ActionType, serverIds?: string[]) => void;

  // O(1) 조회
  has: (expressionId: string, type: ActionType) => boolean;
}
```

#### 수정된 파일

| 파일                                 | 이전                                       | 현재 (완료)                                |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------ |
| `store/useUserActionStore.ts`        | (신규)                                     | Immer + Set + \_pendingOps 패턴 ✅         |
| `hooks/user/useUserActions.ts`       | SWR data 직접 사용                         | Zustand 스토어 구독 + SWR은 초기 시드만 ✅ |
| `hooks/user/useSaveToggle.ts`        | `useUserActions.hasAction` 사용 (SWR 의존) | 스토어의 반응형 `has()` 사용 ✅            |
| `hooks/user/useSaveAction.ts`        | `syncingRef` 가드 (블로킹)                 | `_pendingOps` 기반 즉시 업데이트 ✅        |
| `hooks/user/useVocabularyLists.ts`   | Free 유저 savedListIds 미동기화            | 모달 열림 시 savedListIds 동기화 ✅        |
| `store/useVocabularyStore.ts`        | item_count 비멱등적 증감                   | savedListIds 기반 멱등성 보장 ✅           |
| `components/actions/LearnButton.tsx` | 변경 없음 (API 호환)                       | `useUserActions` API 유지로 자동 적용 ✅   |

#### 달성된 효과

- **저장/학습 버튼**: 클릭 즉시 상태 전환, 서버 응답 대기 없이 재클릭 가능
- **POST 감소**: 저장 1회당 POST 4개 → 3개 (`mutateFn` 리페치 제거)
- **탭 전환**: `revalidateOnFocus: true`로 백그라운드 자동 정합성 보장
- **다중 작업**: `_pendingOps` 가드로 빠르게 여러 표현을 저장해도 상태 일관성 유지
- **Free/Pro 일관성**: 단어장 모달의 `isSelected` UI가 두 유저 타입 모두 즉시 반영

---

## 7. 파일별 검토 결과

### 서버 데이터를 사용하는 모든 경로 감사 (Audit)

#### ✅ 적용 완료

| 파일                                                  | 서버 데이터 사용 방식                             | Zustand 적용                                            |
| ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `hooks/user/useVocabularyLists.ts`                    | SWR → `getVocabularyLists()`                      | ✅ `useEffect` + `syncWithServer` (가드 적용)           |
| `components/vocabulary/VocabularyListModal.tsx`       | `getContainingListIds()` → `savedListIds`         | ✅ 스토어의 `selectSavedListIds` 구독                   |
| `components/vocabulary/VocabularyListItem.tsx`        | 부모에서 `isSelected` prop                        | ✅ 프레젠테이셔널 컴포넌트                              |
| `components/me/vocabulary/VocabularyListManager.tsx`  | 서버 prop `lists`                                 | ✅ `zustandLists` 우선 사용 + 서버 prop fallback        |
| `components/me/vocabulary/RemoteVocabularyDetail.tsx` | SWR (`vocabulary-details`) + `useVocabularyStore` | ✅ `resolveOperation` 적용                              |
| `hooks/user/useSaveAction.ts`                         | `isSyncing` state                                 | ✅ 제거됨 (로딩 스피너 없음)                            |
| `hooks/user/useVocabularySync.ts`                     | `toggleInList` 사용                               | ✅ 스토어 기반 낙관적 업데이트                          |
| `components/vocabulary/BulkVocabularyListModal.tsx`   | `useVocabularyLists().lists`                      | ✅ 이미 Zustand 스토어 경유 (`useVocabularyLists` 내부) |
| `hooks/user/useVocabularyListSync.ts`                 | 스토어↔SWR 캐시 동기화 유틸리티                   | ✅ 동기화 로직 중앙화 완료                              |

#### ✅ Phase 2 적용 완료

| 파일                                 | 이전 방식                                        | 현재 (완료)                                |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------ |
| `hooks/user/useUserActions.ts`       | SWR → `getUserActions()`                         | ✅ Zustand 스토어 구독 + SWR은 초기 시드만 |
| `hooks/user/useSaveToggle.ts`        | `useUserActions.hasAction()`                     | ✅ 스토어의 반응형 `has()` 사용            |
| `components/actions/LearnButton.tsx` | `useUserActions.hasAction()` + `isLoading.learn` | ✅ `_initialized` 플래그 기반 로딩 관리    |

#### ℹ️ 적용 불필요 (서버 컴포넌트 전용)

| 파일                                                   | 이유                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `app/me/page.tsx`                                      | 서버 컴포넌트 → 클라이언트 컴포넌트(VocabularyListManager)에 데이터 전달만  |
| `app/me/[listId]/page.tsx`                             | 서버 컴포넌트 → 클라이언트 컴포넌트(RemoteVocabularyDetail)에 데이터 전달만 |
| `components/me/vocabulary/VocabularyListContainer.tsx` | 서버 컴포넌트 → `getVocabularyLists()` 호출 후 prop으로 전달만              |
| `services/queries/vocabulary.ts`                       | 서버 전용 쿼리 함수 (Zustand 적용 대상 아님)                                |
| `services/queries/user.ts`                             | 서버 전용 쿼리 함수 (Zustand 적용 대상 아님)                                |

### 놓친 부분 검토

스키마(`docs/database/schema.md`)와 유저 시스템(`docs/users/user_system_plan.md`)을 검토한 결과:

1. **`user_actions` (save/learn)**: ✅ Phase 2에서 Zustand 스토어(`useUserActionStore`)로 전환 완료
2. **`vocabulary_items` (savedListIds)**: Phase 1에서 이미 `savedListIds: Map`으로 관리 중 ✅
3. **`vocabulary_lists`**: Phase 1에서 이미 `lists: []`로 관리 중 ✅
4. **`user_custom_cards`**: 아직 미구현 기능 (Phase 6에서 구현 예정) → 해당 없음
5. **`ranking_stats`**: 읽기 전용 집계 데이터 → Zustand 불필요
6. **`learnedCount`**: `VocabularyListContainer`에서 서버 prop으로 전달 → `VocabularyListManager`에서 사용. Phase 2 완료로 `useUserActionStore.learnedIds.size`를 통한 즉시 반영이 가능해짐 (향후 적용 검토)

---

## 8. 데이터 흐름 다이어그램

### Phase 1 (현재): Vocabulary Lists

```
[피드 페이지]                         [/me 페이지]
     │                                     │
     │ 저장 버튼 클릭                        │ 페이지 이동
     ▼                                     ▼
useSaveAction                     VocabularyListContainer (서버)
     │                                     │
     │ syncOnSave()                        │ getVocabularyLists()
     ▼                                     ▼
useVocabularySync                  VocabularyListManager (클라이언트)
     │                                     │
     │ toggleInList()                      │ useVocabularyStore(selectLists)
     ▼                                     ▼
useVocabularyLists              ┌──────────────────────┐
     │                          │  Zustand Store       │
     │ optimisticToggle()       │                      │
     │    (_pendingOps++)       │  lists: [...] ✅ 즉시 │
     ▼                          │  _pendingOps: N      │
┌──────────────────────┐        │                      │
│  Zustand Store       │        │  스토어 있으면 우선      │
│                      │        │  없으면 서버 prop       │
│  item_count +1 즉시   │        └──────────────────────┘
│  _pendingOps: 1      │
└──────────────────────┘
     │
     │ 서버 액션 (백그라운드)
     ▼
addToVocabularyList()
     │
     │ 완료 후
     ▼
resolveOperation(freshData)
     │ _pendingOps--
     │ 0이면 서버 데이터로 교체
```

### Phase 2 (완료): User Actions

```
[표현 카드]                          [/me 페이지]
     │                                    │
     │ 저장/학습 버튼                       │ 학습 완료 수
     ▼                                    ▼
useUserActions                    VocabularyListManager
     │                                    │
     │ optimisticToggle()                 │ learnedIds.size
     ▼                                    ▼
┌──────────────────────┐         ┌──────────────────────┐
│  UserAction Store    │         │  (Phase 2 적용 완료)   │
│                      │         │                      │
│  savedIds: Set ✅    │         │  학습 완료 수도          │
│  learnedIds: Set ✅  │         │  스토어에서 즉시 반영     │
│  _pendingOps: N      │         └──────────────────────┘
└──────────────────────┘
     │
     │ 서버 액션 (백그라운드)
     ▼
toggleUserAction()
     │
     │ 완료 후
     ▼
resolveOperation(type, freshIds)
```

---

## 9. 신뢰성 및 예외 처리

### 문제: 서버 반영 전 앱 종료 시 데이터 손실

낙관적 업데이트의 본질적 트레이드오프입니다.
Zustand 스토어는 메모리에만 존재하므로, **백그라운드 서버 액션이 완료되기 전에 브라우저 탭이 닫히면 해당 작업은 서버에 반영되지 않을 수 있습니다.**

#### 시나리오

```
T0: 사용자가 저장 버튼 클릭
    → optimisticToggle() → Zustand item_count: 5 → 6 ✅ (UI 즉시 반영)
    → addToVocabularyList() 서버 요청 시작 (백그라운드)

T1: 사용자가 탭을 닫음 (또는 브라우저 종료)
    → Zustand 스토어 소멸 (메모리 해제)
    → 진행 중인 fetch 요청 Abort ❌
    → 서버 DB: item_count = 5 (변경 안 됨)

T2: 사용자가 다시 앱을 열음
    → SWR이 서버에서 데이터 페칭
    → item_count = 5 표시 (저장 작업이 "씹힘")
```

#### 영향도 평가

| 항목          | 평가                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------- |
| 발생 빈도     | **매우 낮음** — 서버 액션은 보통 100~300ms 내에 완료됨. 저장 직후 탭을 닫는 시간 창은 극히 짧음 |
| 데이터 중요도 | **낮음~중간** — 금융 데이터가 아닌 단어장/학습 상태. 사용자가 다시 저장하면 복구 가능           |
| 사용자 인지   | **중간** — "저장했는데 왜 안 되어 있지?" 경험은 신뢰도에 영향                                   |

#### 완화 전략

##### 전략 A: `beforeunload` 경고 (최소 비용, 권장)

`_pendingOps > 0`일 때 페이지를 떠나려고 하면 브라우저 기본 경고창을 표시합니다.

```typescript
// hooks/useBeforeUnloadGuard.ts
import { useEffect } from "react";
import { useVocabularyStore } from "@/store/useVocabularyStore";

export function useBeforeUnloadGuard() {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const pendingOps = useVocabularyStore.getState()._pendingOps;
      // Phase 2 완료: + useUserActionStore.getState()._pendingOps

      if (pendingOps > 0) {
        e.preventDefault();
        // 최신 브라우저는 커스텀 메시지를 무시하고 기본 경고만 표시
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
}
```

**적용 위치**: 루트 레이아웃의 클라이언트 래퍼 컴포넌트에서 한 번만 호출.

##### 전략 B: `navigator.sendBeacon` / `keepalive` (요청 완료 보장)

브라우저가 닫혀도 요청이 끝까지 전달되도록 하는 Web API입니다.

```typescript
// fetch의 keepalive 옵션
fetch("/api/vocabulary/add", {
  method: "POST",
  body: JSON.stringify({ listId, expressionId }),
  keepalive: true, // 탭이 닫혀도 요청 완료를 보장
});

// 또는 navigator.sendBeacon (POST만 가능, 본문 크기 제한 64KB)
navigator.sendBeacon("/api/vocabulary/add", formData);
```

**제약사항**:

- Next.js Server Actions는 내부적으로 `fetch`를 사용하지만 `keepalive` 옵션을 직접 노출하지 않음
- 별도 API Route (`app/api/...`)를 만들어야 적용 가능
- 현재 아키텍처에서는 오버엔지니어링일 수 있음

##### 전략 C: 로컬 큐 + 재전송 (가장 완벽, 고비용)

미완료 작업을 `localStorage`에 저장하고, 다음 세션에서 자동 재전송합니다.

```typescript
// 개념적 구조 (Phase 3+ 고려)
interface PendingOperation {
  id: string;
  action: "add" | "remove" | "toggle";
  payload: { listId: string; expressionId: string };
  timestamp: number;
}

// 작업 시작 시 큐에 추가
localStorage.setItem("pendingOps", JSON.stringify([...queue, newOp]));

// 서버 성공 시 큐에서 제거
const updated = queue.filter((op) => op.id !== completedOp.id);
localStorage.setItem("pendingOps", JSON.stringify(updated));

// 앱 시작 시 미완료 큐 확인 및 재전송
useEffect(() => {
  const pending = JSON.parse(localStorage.getItem("pendingOps") || "[]");
  pending.forEach((op) => retryOperation(op));
}, []);
```

**적용 시점**: 현재 단계에서는 불필요. 오프라인 지원이나 PWA 전환 시 고려.

#### 현재 프로젝트 권장 사항

| 전략                          | 복잡도 | 적용 시점                     | 상태    |
| ----------------------------- | ------ | ----------------------------- | ------- |
| A. `beforeunload` 경고        | 낮음   | Phase 2 완료 → 적용 가능      | ⬜ 계획 |
| B. `keepalive` / `sendBeacon` | 중간   | 필요 시 (API Route 추가 필요) | ⬜ 보류 |
| C. 로컬 큐 + 재전송           | 높음   | PWA/오프라인 지원 시          | ⬜ 미래 |

> **참고**: Free 유저는 `useLocalActionStore`가 Zustand `persist` 미들웨어로 `localStorage`에 자동 동기화하므로, 이 문제에서 완전히 자유롭습니다. 탭을 닫아도 데이터가 항상 로컬에 보존됩니다.

---

> **참고**: 이 문서는 리팩토링의 진행 상황에 따라 지속적으로 업데이트됩니다.

---

## 10. Phase 3: Save RPC 통합 (계획)

> Phase 1-2에서 구축한 Zustand 인프라 위에서, **서버 측 데이터 모델과 호출 구조를 최적화**하는 단계입니다.

### 문제 정의

#### 이중 관리로 인한 데이터 불일치

현재 "이 표현이 저장됨"이라는 사실이 **두 개의 테이블에 동시 기록**됨:

```
1. user_actions:    (user_id, expression_id, action_type='save')
2. vocabulary_items: (list_id, expression_id)
```

`save`는 `vocabulary_items` 멤버십과 100% 동일하므로 **제거 가능** (`learn`은 독립적이므로 유지).

#### 과도한 서버 호출

저장 버튼 **1회 클릭** 시 발생하는 POST 요청:

| #   | 호출                                | 목적                  | 소요 시간 |
| --- | ----------------------------------- | --------------------- | --------- |
| 1   | `toggleUserAction(expr, "save")`    | user_actions 토글     | ~1.5초    |
| 2   | `addToVocabularyList(listId, expr)` | vocabulary_items 추가 | ~1.5초    |
| 3   | `mutate()` → `getVocabularyLists()` | SWR 리페치            | ~1.5초    |

**총 3개 POST**, 해제 시에는 `getContainingListIds` 쿼리까지 추가.

### 목표 아키텍처

#### Before → After 비교

| 항목                  | Before (현재)                                  | After (Phase 3)                      |
| --------------------- | ---------------------------------------------- | ------------------------------------ |
| "저장됨" 판단         | `user_actions(save)` 조회                      | `vocabulary_items` 조인 조회         |
| 저장 토글             | `toggleUserAction` + `addToList` (2 서버 액션) | **`toggle_save_expression` RPC 1개** |
| 해제 토글             | `toggleUserAction` + N개 `removeFromList`      | **`toggle_save_expression` RPC 1개** |
| POST 수 (저장)        | 3                                              | **1**                                |
| POST 수 (해제)        | 3+                                             | **1**                                |
| Race Condition        | ⚠️ 병렬 서버 호출                              | **없음** (단일 트랜잭션)             |
| SWR 리페치            | 필요 (별도 POST)                               | **불필요** (RPC가 데이터 반환)       |
| `user_actions` 테이블 | `save` + `learn`                               | **`learn` 전용**                     |

#### 새로운 저장 흐름

```
사용자 클릭 (0ms)
  ├─ optimisticToggle → Zustand 스토어 즉시 업데이트 → UI 즉시 반영
  │
  └─ toggleSaveExpression(expressionId) → POST 1개 (서버 RPC)
       ├─ 서버: 저장 여부 확인 (vocabulary_items에서)
       ├─ 서버: 토글 수행 (추가 또는 전체 제거)
       └─ 서버: 최신 단어장 데이터 반환

  → resolveOperation(freshData)  (~1.5초 후)
```

### 구현 단계

#### Step 1-2: DB 함수 생성

**`toggle_save_expression`** (RPC):

```sql
create or replace function speak_mango_en.toggle_save_expression(
  p_expression_id uuid
)
returns json
language plpgsql
security definer
set search_path = speak_mango_en, public
as $$
declare
  v_user_id uuid = auth.uid();
  v_is_saved boolean;
  v_default_list_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. 저장 여부 확인 (vocabulary_items 기반)
  select exists (
    select 1 from vocabulary_items vi
    join vocabulary_lists vl on vl.id = vi.list_id
    where vl.user_id = v_user_id and vi.expression_id = p_expression_id
  ) into v_is_saved;

  if v_is_saved then
    -- 2a. 해제: 모든 단어장에서 제거
    delete from vocabulary_items
    where expression_id = p_expression_id
      and list_id in (
        select id from vocabulary_lists where user_id = v_user_id
      );
  else
    -- 2b. 저장: 기본 단어장에 추가
    select id into v_default_list_id
    from vocabulary_lists
    where user_id = v_user_id and is_default = true
    limit 1;

    if v_default_list_id is not null then
      insert into vocabulary_items (list_id, expression_id)
      values (v_default_list_id, p_expression_id)
      on conflict (list_id, expression_id) do nothing;
    end if;
  end if;

  -- 3. 최신 단어장 데이터 반환 (SWR 리페치 대체)
  return (
    select coalesce(json_agg(row_to_json(t)), '[]'::json)
    from (
      select vl.id, vl.title, vl.is_default,
             count(vi.expression_id)::int as item_count
      from vocabulary_lists vl
      left join vocabulary_items vi on vi.list_id = vl.id
      where vl.user_id = v_user_id
      group by vl.id, vl.title, vl.is_default
      order by vl.is_default desc, vl.created_at asc
    ) t
  );
end;
$$;
```

**`get_saved_expression_ids`** (`getUserActions("save")` 대체용):

```sql
create or replace function speak_mango_en.get_saved_expression_ids()
returns setof uuid
language sql
security invoker
stable
as $$
  select distinct vi.expression_id
  from vocabulary_items vi
  join vocabulary_lists vl on vl.id = vi.list_id
  where vl.user_id = auth.uid();
$$;
```

#### Step 3-4: Server Action/Query

| 파일                       | 변경                                                                         |
| -------------------------- | ---------------------------------------------------------------------------- |
| `services/actions/user.ts` | `toggleSaveExpression(expressionId)` 추가, `toggleUserAction`은 `learn` 전용 |
| `services/queries/user.ts` | `getSavedExpressionIds()` 추가, `getUserActions("save")` 대체                |

#### Step 5-6: Hook 리팩토링

| 파일                           | 변경                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/user/useUserActions.ts` | save SWR 키 → `["saved_expressions"]` + `getSavedExpressionIds`, `toggleAction("save")` → RPC 호출 + vocabulary store 직접 갱신 |
| `hooks/user/useSaveAction.ts`  | `Promise.all` 제거, 단일 호출로 통합. `syncOnSave`/`syncOnUnsave` 제거 가능                                                     |

#### Step 7-9: Store/Hook 정리

| 파일                              | 변경                                                    |
| --------------------------------- | ------------------------------------------------------- |
| `hooks/user/useSaveToggle.ts`     | 내부 동작 변경 없음 (API 유지)                          |
| `store/useUserActionStore.ts`     | `savedIds` 초기화 소스 변경 (→ `getSavedExpressionIds`) |
| `store/useVocabularyStore.ts`     | RPC 응답의 lists 데이터로 직접 갱신 경로 추가           |
| `hooks/user/useVocabularySync.ts` | `syncOnSave`/`syncOnUnsave` 축소/제거                   |

#### Step 10: 검증 및 정리

- 모든 테스트 시나리오 검증 (검증 체크리스트 참조)
- `user_actions` 테이블에서 기존 `save` 데이터 정리 (마이그레이션)
- 문서 업데이트: `schema.md`, `user_system_plan.md`, `project_history.md`, `walkthrough.md`

### 파일 변경 매트릭스

#### 신규 파일

| 파일                                              | 설명                               |
| ------------------------------------------------- | ---------------------------------- |
| `database/functions/toggle_save_expression.sql`   | 저장 토글 + 단어장 데이터 반환 RPC |
| `database/functions/get_saved_expression_ids.sql` | 저장된 표현 ID 목록 조회 RPC       |

#### 수정 파일

| 파일                              | 변경 내용                                        | 영향도   |
| --------------------------------- | ------------------------------------------------ | -------- |
| `services/actions/user.ts`        | `toggleSaveExpression` 추가                      | 낮음     |
| `services/queries/user.ts`        | `getSavedExpressionIds` 추가                     | 낮음     |
| `hooks/user/useUserActions.ts`    | save SWR 키 변경, toggleAction("save") 로직 교체 | **높음** |
| `hooks/user/useSaveAction.ts`     | `Promise.all` 제거, 단일 호출로 단순화           | **높음** |
| `hooks/user/useVocabularySync.ts` | `syncOnSave`/`syncOnUnsave` 축소/제거            | 중간     |
| `store/useUserActionStore.ts`     | save 초기화 소스 변경                            | 중간     |
| `store/useVocabularyStore.ts`     | RPC 응답으로 lists 갱신 경로 추가                | 낮음     |

#### 변경하지 않는 파일 (API 호환)

| 파일                                            | 이유                                    |
| ----------------------------------------------- | --------------------------------------- |
| `components/actions/SaveButton.tsx`             | `useSaveAction`의 API 표면 동일         |
| `components/actions/LearnButton.tsx`            | `useUserActions`의 learn 경로 변경 없음 |
| `components/vocabulary/VocabularyListModal.tsx` | `useVocabularyStore` 구독 방식 동일     |
| `components/vocabulary/VocabularyListItem.tsx`  | props 변경 없음                         |

### 검증 체크리스트

#### 기존 기능 보존 (Regression Test)

**Pro 유저 — 저장(Save)**:

- [ ] 표현 카드의 저장 버튼 클릭 → 즉시 노란색 북마크로 전환
- [ ] 저장된 표현의 저장 버튼 클릭 → 즉시 빈 북마크로 전환
- [ ] 저장 버튼 길게 누름 → 단어장 모달 열림
- [ ] 모달에서 리스트 선택 → isSelected UI 즉시 반영 + 항목 수 +1
- [ ] 모달에서 리스트 해제 → isSelected UI 즉시 해제 + 항목 수 -1
- [ ] 모달에서 모든 리스트 해제 → 저장 버튼 빈 북마크로 전환
- [ ] 단어장이 없는 상태에서 저장 → 단어장 생성 모달 열림
- [ ] 페이지 새로고침 후 저장 상태 유지
- [ ] 탭 전환 후 돌아와도 저장 상태 유지

**Pro 유저 — 학습(Learn)**:

- [ ] 학습 버튼 클릭 → 즉시 녹색으로 전환 + 스크롤 이동
- [ ] 학습 완료된 표현 다시 클릭 → 즉시 해제
- [ ] `/me/learned` 페이지에서 학습 완료 목록 정상 표시

**Free 유저**:

- [ ] 저장/학습 버튼 클릭 → 즉시 UI 전환 (로컬 스토리지)
- [ ] 모달에서 리스트 선택/해제 → isSelected UI 즉시 반영

**비로그인 유저**:

- [ ] 저장/학습 버튼 클릭 → 로그인 모달 표시

**단어장 기능 (Phase 1 보존)**:

- [ ] 단어장 생성/삭제/이름 변경
- [ ] 기본 단어장 변경
- [ ] 벌크 복사/이동/삭제 → item_count 정확히 반영

#### 버그 수정 검증

- [ ] **[Bug 1]** 저장 해제 후 바로 모달 열어도 isSelected가 정확히 해제 상태
- [ ] **[Bug 2]** 빠른 연속 토글 후 모달 열어도 item_count가 정확히 반영
- [ ] **[Bug 3]** 저장 버튼 빠르게 연속 클릭 가능 (렌더링 중 블로킹 없음)

#### 성능 개선 검증

- [ ] 저장 1회 클릭 시 서버 터미널에 POST **1개**만 표시
- [ ] 해제 1회 클릭 시 서버 터미널에 POST **1개**만 표시
- [ ] 빠른 연속 토글 (5회) 시 POST **5개** (이전: 15-20개)
- [ ] 저장/해제 후 item_count 정합 복구 시간: ~1.5초 (이전: ~3-6초)

### 롤백 계획

- `toggle_save_expression` RPC는 additive (기존 함수 미수정) → RPC 삭제만으로 롤백
- `user_actions(save)` 데이터 삭제는 **모든 검증 완료 후** 별도 마이그레이션으로 수행
- Git 브랜치 전략: `feature/save-action-rpc` 브랜치에서 작업 → 검증 완료 후 merge

### 구현 순서 요약

```
Step 1-2: DB 함수 생성 (toggle_save_expression, get_saved_expression_ids)
    ↓
Step 3-4: Server Action/Query 추가 (toggleSaveExpression, getSavedExpressionIds)
    ↓
Step 5-6: Hook 리팩토링 (useUserActions, useSaveAction)
    ↓
Step 7-9: Store/Hook 정리 (useSaveToggle, useVocabularySync, stores)
    ↓
Step 10: 검증 (체크리스트) + 문서 업데이트
```

각 Step 완료 후 `npx tsc --noEmit`으로 타입 체크, 브라우저 테스트로 기능 확인.
