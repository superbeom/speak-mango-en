# Vocabulary Management Zustand Refactor 구현 가이드

> **작성일**: 2026-02-12
> **목표**: SWR 기반의 현재 상태 관리를 Zustand + SWR 하이브리드 패턴으로 개선하여 UI 응답성 향상
> **범위**: Pro/Free 사용자 통합 스토어, 낙관적 업데이트, 모달 데이터 동기화

---

## 📋 목차

1. [개요 및 목표](#개요-및-목표)
2. [현재 문제 분석](#현재-문제-분석)
3. [제안 솔루션](#제안-솔루션)
4. [아키텍처 설계](#아키텍처-설계)
5. [구현 단계별 가이드](#구현-단계별-가이드)
6. [코드 예시](#코드-예시)
7. [검증 방법](#검증-방법)
8. [롤백 계획](#롤백-계획)

---

## 개요 및 목표

### 배경

현재 프로젝트는 **하이브리드 상태 관리** 방식을 사용합니다:

- **Pro 사용자**: SWR + Supabase DB (서버 상태)
- **Free 사용자**: Zustand + localStorage (로컬 상태)

이 방식으로 인해 다음 문제가 발생합니다:

1. Me List Page에서 리스트 수정/삭제/기본설정 후 모달에 이전 데이터 표시
2. App Page에서 리스트 저장 시 UI 업데이트 지연
3. 표현 카드 저장 버튼 딜레이

### 목표

| 목표                    | 설명                            | 성공 기준               |
| ----------------------- | ------------------------------- | ----------------------- |
| **UI 즉시 반영**        | 사용자 액션 후 UI 즉시 업데이트 | 100ms 내 반영           |
| **데이터 일관성**       | 서버/로컬 상태 동기화           | SWR 캐시와 Zustand 일치 |
| **코드 간소화**         | 복잡한 분기 로직 제거           | 컴포넌트 코드 30% 감소  |
| **점진적 마이그레이션** | 기존 기능 유지하며 개선         | 단계별 배포 가능        |

---

## 현재 문제 분석

### 문제 1: Me List Page에서 모달에 이전 데이터 표시

**현상**:

```
리스트 수정/삭제/기본설정 → API 호출 → mutate()
                               ↓
                         모달 열기 → savedListIds 로드
                               ↓
                    첫 렌더링 시 이전 데이터 표시
```

**원인 분석**:

```typescript
// VocabularyListModal.tsx (line 45-52)
useEffect(() => {
  if (isOpen && expressionId) {
    getContainingListIds(expressionId).then((ids) => {
      setSavedListIds(new Set(ids)); // 비동기 로드
    });
  }
}, [isOpen, expressionId, getContainingListIds]);
```

**이슈**:

1. `savedListIds`가 로컬 상태로 별도 관리
2. `useEffect`에서 비동기로 로드하므로 첫 렌더링 시 이전 데이터 표시
3. SWR 캐시와 Zustand 스토어가 분리되어 있어 동기화 지연

### 문제 2: App Page에서 UI 업데이트 지연

**현상**:

```
저장 버튼 클릭 → toggleInList() → API 호출 → mutate()
                                                        ↓
                                               서버 revalidate 대기
                                                        ↓
                                                   UI 업데이트
```

**원인 분석**:

```typescript
// useVocabularyLists.ts (line 106)
toggleInList: async (listId, expressionId, isCurrentlyIn) => {
  if (isCurrentlyIn) {
    await removeFromVocabularyList(listId, expressionId);
  } else {
    await addToVocabularyList(listId, expressionId);
  }
  mutate(); // SWR cache refresh (지연 발생)
};
```

**이슈**:

1. `await addToVocabularyList()`가 완료될 때까지 대기
2. `mutate()` 호출 후 서버에서 다시 데이터를 가져올 때까지 UI 업데이트 없음
3. 네트워크 지연 시 사용자 체감 지연 약 500ms~1s

### 문제 3: 표현 카드 저장 버튼 딜레이

**현상**:

```
SaveButton → useSaveAction → syncOnSave() → API 호출 → mutate()
                                                    ↓
                                        UI 업데이트 지연
```

**원인 분석**:

```typescript
// useSaveAction.ts (line 83-95)
if (willSave) {
  try {
    const availableLists = await getActiveLists();
    await Promise.all([toggleSaveState(), syncOnSave(availableLists)]);
  } catch (error) {
    console.error("Save sync failed:", error);
  }
}
```

**이슈**:

1. `syncOnSave()`가 비동기로 API 호출
2. 낙관적 업데이트가 vocabulary lists에는 적용되지 않음
3. 사용자가 저장 버튼을 눌렀을 때 즉각적 피드백 부족

---

## 제안 솔루션

### Zustand + SWR 하이브리드 패턴

**핵심 개념**:

```
┌─────────────────────────────────────────────────────┐
│                UI Layer (React)                     │
│                                                     │
│  ┌───────────────────────────────────────────┐      │
│  │  Zustand Store (클라이언트 상태)              │      │
│  │  - lists: []                              │      │
│  │  - isSaving: false                        │      │
│  │  - optimisticToggle()                     │      │
│  └───────────────────────────────────────────┘      │
│                    ↑                                │
│                    │                                │
│                즉시 업데이트                           │
│                                                     │
│  ┌───────────────────────────────────────────┐      │
│  │  SWR Cache (서버 상태)                      │      │
│  │  - 자동 revalidate                         │      │
│  │  - 백그라운드 동기화                           │      │
│  └───────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

**작동 원리**:

1. **사용자 액션** → Zustand 스토어 즉시 업데이트 (100ms 이내)
2. **백그라운드 API 호출** → 서버에 데이터 반영
3. **SWR 캐시 동기화** → `onSuccess`에서 스토어에 서버 데이터 반영
4. **실패 시 롤백** → 스토어를 이전 상태로 복원

### 왜 Zustand?

| 항목            | SWR만               | Zustand만      | Zustand + SWR |
| --------------- | ------------------- | -------------- | ------------- |
| UI 즉시 반영    | ❌ (서버 대기 필요) | ✅             | ✅            |
| 서버 동기화     | ✅                  | ❌ (수동 필요) | ✅            |
| 낙관적 업데이트 | ⚠️ (복잡함)         | ✅             | ✅            |
| 캐싱            | ✅                  | ❌             | ✅            |
| 난이도          | 중                  | 소             | 중            |

---

## 아키텍처 설계

### 디렉토리 구조

```
/store/
├── useVocabularyStore.ts        # 새로 추가: 통합 스토어
├── useUserActionStore.ts        # 새로 추가: 사용자 액션 스토어
├── useLocalActionStore.ts       # 기존: Free 유저 전용 (마이그레이션 필요)
├── useVocabularyModalStore.ts  # 기존: 모달 상태
└── index.ts                   # 스토어 바럴 파일
```

### 통합 스토어 구조

```typescript
interface VocabularyStore {
  // 상태
  lists: VocabularyListWithCount[];
  savedListIds: Map<string, Set<string>>; // expressionId -> listIds
  isLoading: boolean;
  error: Error | null;

  // 액션
  setLists: (lists: VocabularyListWithCount[]) => void;
  optimisticToggle: (listId: string, expressionId: string) => void;
  syncSavedListIds: (expressionId: string, listIds: string[]) => void;
  syncWithServer: (serverData: VocabularyListWithCount[]) => void;
}
```

### 데이터 흐름

```
┌────────────────────────────────────────────────────────────┐
│ 1. 사용자 액션 (저장 버튼 클릭)                                  │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ 2. Zustand Store 업데이트 (즉시 반영)                          │
│    optimisticToggle() → lists 업데이트                       │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ 3. Server Action 실행 (DB 업데이트)                       │
│    addToVocabularyList() (비차단)                            │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ 4. revalidatePath() 호출 ⭐                             │
│    Next.js 서버 캐시 무효화 (유지 필수)                 │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ 5. SWR 캐시 동기화                                            │
│    onSuccess → syncWithServer(serverData)                  │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ 6. 사용자에게 성공/실패 피드백                                    │
│    토스트 메시지, 롤백 처리                                      │
└────────────────────────────────────────────────────────────┘
```

### 독립적인 캐시 레이어

```
┌────────────────────────────────────────────────────────────┐
│           Next.js Server Cache (서버 사이드)          │
│  ── revalidatePath()로 갱신 ──────→                  │
└────────────────────────────────────────────────────────────┘
                    ↕ (독립)
┌────────────────────────────────────────────────────────────┐
│            SWR Client Cache (클라이언트 사이드)      │
│  ── mutate()로 갱신 ───────────→                        │
└────────────────────────────────────────────────────────────┘
                    ↕ (독립)
┌────────────────────────────────────────────────────────────┐
│            Zustand Store (클라이언트 사이드)         │
│  ── set()로 갱신 ──────────────→                      │
└────────────────────────────────────────────────────────────┘
```

**핵심**: 각 캐시는 다른 목적을 가지며, 독립적으로 갱신됩니다.

---

## 구현 단계별 가이드

### 1단계: 통합 스토어 설계

**목표**: Pro/Free 사용자 통합 스토어 생성

**파일**: `/store/useVocabularyStore.ts` (새로 생성)

**코드**:

```typescript
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { VocabularyListWithCount } from "@/types/vocabulary";

interface VocabularyStore {
  // 상태
  lists: VocabularyListWithCount[];
  savedListIds: Map<string, Set<string>>; // expressionId -> listIds
  isLoading: boolean;
  error: Error | null;

  // 서버 동기용
  setLists: (lists: VocabularyListWithCount[]) => void;
  syncWithServer: (serverData: VocabularyListWithCount[]) => void;

  // 낙관적 업데이트
  optimisticToggle: (
    listId: string,
    expressionId: string,
    add: boolean,
  ) => void;
  optimisticSetDefault: (listId: string) => void;
  optimisticUpdateTitle: (listId: string, title: string) => void;
  optimisticDeleteList: (listId: string) => void;

  // 저장 리스트 관리
  syncSavedListIds: (expressionId: string, listIds: string[]) => void;

  // 로딩/에러
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useVocabularyStore = create<VocabularyStore>()(
  immer((set, get) => ({
    lists: [],
    savedListIds: new Map(),
    isLoading: false,
    error: null,

    setLists: (lists) => set({ lists }),

    syncWithServer: (serverData) => set({ lists: serverData }),

    optimisticToggle: (listId, expressionId, add) => {
      set((state) => {
        const listIndex = state.lists.findIndex((l) => l.id === listId);
        if (listIndex === -1) return;

        const currentCount = state.lists[listIndex].item_count || 0;
        state.lists[listIndex].item_count = add
          ? currentCount + 1
          : Math.max(0, currentCount - 1);

        // savedListIds 업데이트
        const expressionLists =
          state.savedListIds.get(expressionId) || new Set();
        if (add) {
          expressionLists.add(listId);
        } else {
          expressionLists.delete(listId);
        }
        state.savedListIds.set(expressionId, expressionLists);
      });
    },

    optimisticSetDefault: (listId) => {
      set((state) => {
        state.lists.forEach((list) => {
          list.is_default = list.id === listId;
        });
      });
    },

    optimisticUpdateTitle: (listId, title) => {
      set((state) => {
        const list = state.lists.find((l) => l.id === listId);
        if (list) list.title = title;
      });
    },

    optimisticDeleteList: (listId) => {
      set((state) => {
        state.lists = state.lists.filter((l) => l.id !== listId);
      });
    },

    syncSavedListIds: (expressionId, listIds) => {
      set((state) => {
        state.savedListIds.set(expressionId, new Set(listIds));
      });
    },

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
  })),
);

// Selectors
export const selectLists = (state: VocabularyStore) => state.lists;
export const selectSavedListIds =
  (expressionId: string) => (state: VocabularyStore) =>
    state.savedListIds.get(expressionId) || new Set();
```

**구현 포인트**:

1. `immer` middleware로 불변성 처리
2. `savedListIds`를 Map으로 관리하여 표현별 리스트 추적
3. 낙관적 업데이트를 별도 액션으로 분리
4. 서버 동기용 액션 분리

---

### 2단계: SWR-스토어 통합

**목표**: SWR 캐시와 Zustand 스토어 동기화

**파일**: `/hooks/user/useVocabularyLists.ts` (수정)

**수정 전**:

```typescript
// 기존 코드
const { data: remoteLists, mutate } = useSWR<VocabularyListWithCount[]>(
  isPro ? "vocabulary_lists" : null,
  getVocabularyLists,
  { fallbackData: [] },
);
```

**수정 후**:

```typescript
"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useVocabularyStore, selectLists } from "@/store/useVocabularyStore";
import {
  getVocabularyLists,
  getSavedListIds,
} from "@/services/queries/vocabulary";
import {
  createVocabularyList,
  addToVocabularyList,
  removeFromVocabularyList,
  setDefaultVocabularyList,
} from "@/services/actions/vocabulary";

export function useVocabularyLists() {
  const { isPro } = useAuthUser();

  // SWR은 데이터 소스로만 사용 (백그라운드 동기화)
  const { data: serverData, mutate } = useSWR<VocabularyListWithCount[]>(
    isPro ? "vocabulary_lists" : null,
    getVocabularyLists,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: true, // 백그라운드 동기화 활성화
      onSuccess: (data) => {
        // SWR 데이터를 Zustand 스토어에 동기화
        useVocabularyStore.getState().syncWithServer(data);
      },
      fallbackData: [],
    },
  );

  // UI는 Zustand 스토어에서 바로 표시
  const lists = useVocabularyStore(selectLists);

  // Computed Lists (Free 유저를 위한)
  const displayLists = useMemo(() => {
    if (isPro) {
      return lists;
    }
    // Free 유저는 로컬 스토어 사용
    return useLocalActionStore.getState().getLists();
  }, [isPro, lists]);

  const createList = useCallback(
    async (title: string): Promise<string | undefined> => {
      if (!isPro) {
        if (displayLists.length >= 5) {
          throw createAppError(VOCABULARY_ERROR.LIMIT_REACHED);
        }
        return useLocalActionStore.getState().createList(title);
      }

      // 낙관적 업데이트
      useVocabularyStore
        .getState()
        .optimisticUpdateTitle(crypto.randomUUID(), title);

      try {
        const newList = await createVocabularyList(title);
        await mutate(); // SWR 캐시 갱신
        return newList?.id;
      } catch (error) {
        // 실패 시 롤백 (mutate에서 서버 데이터로 복원)
        throw error;
      }
    },
    [isPro, displayLists.length, mutate],
  );

  const toggleInList = useCallback(
    async (listId: string, expressionId: string, isCurrentlyIn: boolean) => {
      if (!isPro) {
        const localStore = useLocalActionStore.getState();
        if (isCurrentlyIn) {
          localStore.removeFromList(listId, expressionId);
        } else {
          localStore.addToList(listId, expressionId);
        }
        return;
      }

      // 낙관적 업데이트
      useVocabularyStore
        .getState()
        .optimisticToggle(listId, expressionId, !isCurrentlyIn);

      try {
        if (isCurrentlyIn) {
          await removeFromVocabularyList(listId, expressionId);
        } else {
          await addToVocabularyList(listId, expressionId);
        }
        await mutate(); // SWR 캐시 갱신
      } catch (error) {
        // 실패 시 롤백
        useVocabularyStore.getState().syncWithServer(serverData || []);
        throw error;
      }
    },
    [isPro, mutate, serverData],
  );

  const getContainingListIds = useCallback(
    async (expressionId: string): Promise<string[]> => {
      if (!isPro) {
        return useLocalActionStore
          .getState()
          .getListIdsForExpression(expressionId);
      }
      return getSavedListIds(expressionId);
    },
    [isPro],
  );

  const setDefaultList = useCallback(
    async (listId: string) => {
      if (!isPro) {
        useLocalActionStore.getState().setDefaultList(listId);
        return;
      }

      // 낙관적 업데이트
      useVocabularyStore.getState().optimisticSetDefault(listId);

      try {
        await setDefaultVocabularyList(listId);
        await mutate(); // SWR 캐시 갱신
      } catch (error) {
        // 실패 시 롤백
        useVocabularyStore.getState().syncWithServer(serverData || []);
        throw error;
      }
    },
    [isPro, mutate, serverData],
  );

  const refreshLists = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    lists: displayLists,
    isLoading: false, // Zustand 스토어이므로 항상 false
    createList,
    toggleInList,
    getContainingListIds,
    setDefaultList,
    refreshLists,
    isPro,
  };
}
```

**구현 포인트**:

1. SWR의 `onSuccess`에서 Zustand 스토어에 서버 데이터 동기화
2. UI는 Zustand 스토어에서 바로 표시 (즉시 반영)
3. 낙관적 업데이트를 수행 후 백그라운드에서 API 호출
4. 실패 시 서버 데이터로 롤백
5. ⭐ **Server Actions에서 revalidate 호출 패턴 유지 (기존대로)**

### 2.1 Server Actions에서 revalidate 호출 패턴 유지

**중요**: `services/actions/vocabulary.ts`의 모든 Server Actions에서 `revalidateMyPage()`, `revalidateVocabularyInfo(listId)` 호출을 **기존대로 유지**합니다.

**전체 호출 횟수**: 총 17회 (revalidateMyPage: 9회, revalidateVocabularyInfo: 8회)

```typescript
// services/actions/vocabulary.ts - 모든 Server Actions 패턴
export const addToVocabularyList = withPro(
  async (_userId, _isPro, listId: string, expressionId: string) => {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("vocabulary_items").insert({
      list_id: listId,
      expression_id: expressionId,
    });

    if (error) {
      if (error.code === "23505") return; // 중복 무시
      throw createAppError(VOCABULARY_ERROR.ADD_FAILED);
    }

    // ⭐ 유지 필수: 서버 캐시 무효화
    revalidateMyPage(); // /me 페이지의 카운트 업데이트
    revalidateVocabularyInfo(listId); // /me/[listId] 페이지의 아이템 리스트 업데이트
  },
);
```

**revalidate 호출 패턴 표**:

| Server Action                       | revalidateMyPage() | revalidateVocabularyInfo() | 목적                                     |
| ----------------------------------- | ------------------ | -------------------------- | ---------------------------------------- |
| createVocabularyList                | ✅ 호출            | ❌ 호출 않음               | 리스트 생성 후 목록 갱신                 |
| addToVocabularyList                 | ✅ 호출            | ✅ 호출                    | 항목 추가 후 카운트/아이템 갱신          |
| removeFromVocabularyList            | ✅ 호출            | ✅ 호출                    | 항목 제거 후 카운트/아이템 갱신          |
| setDefaultVocabularyList            | ✅ 호출            | ✅ 호출                    | 기본 리스트 설정 후 모든 리스트 업데이트 |
| updateVocabularyListTitle           | ✅ 호출            | ✅ 호출                    | 제목 수정 후 목록/상세 갱신              |
| deleteVocabularyList                | ✅ 호출            | ❌ 호출 않음               | 리스트 삭제 후 목록 갱신 (페이지 404)    |
| copyExpressionsToVocabularyList     | ✅ 호출            | ✅ 호출                    | 복사 후 카운트/아이템 갱신               |
| moveExpressionsToVocabularyList     | ✅ 호출            | ✅ 호출 (2번)              | 이동 후 source/target 카운트/아이템 갱신 |
| removeExpressionsFromVocabularyList | ✅ 호출            | ✅ 호출                    | 다중 제거 후 카운트/아이템 갱신          |

**왜 유지해야 하는가?**

1. **서버 캐시는 독립 레이어**:
   - Next.js 서버 캐시와 SWR 클라이언트 캐시는 서로 다른 목적을 가짐
   - revalidatePath는 서버 캐시만 갱신, SWR에는 영향 없음

2. **ISR 환경 필수**:
   - Next.js ISR (Incremental Static Regeneration)이 사용 중이므로
   - revalidatePath로 서버 캐시 갱신 필수

3. **하이드레이션 불일치 방지**:
   - revalidatePath 제거 시 새로고침 시 이전 서버 데이터 표시
   - SWR은 클라이언트 캐시만 관리하므로 서버 캐시 갱신 불가

---

### 3단계: 낙관적 업데이트 구현

**목표**: 사용자 액션 시 UI 즉시 반영

**파일**: `/store/useVocabularyStore.ts` (이미 구현 완료)

**추가 설명**:

낙관적 업데이트의 3단계:

1. **예측 상태 적용**: 사용자 액션 결과를 예측하여 즉시 업데이트

   ```typescript
   optimisticToggle(listId, expressionId, true); // +1 예측
   ```

2. **백그라운드 API 호출**: 실제 서버에 반영 (비차단)

   ```typescript
   addToVocabularyList(listId, expressionId);
   ```

3. **결과 동기화**: 서버 응답으로 최종 상태 맞춤
   ```typescript
   onSuccess: (data) => syncWithServer(data); // 실제 데이터로 복원
   ```

**실패 시 롤백**:

```typescript
try {
  // 1. 낙관적 업데이트
  optimisticToggle(listId, expressionId, true);

  // 2. API 호출
  await addToVocabularyList(listId, expressionId);

  // 3. 성공: 서버 데이터로 동기화
  await mutate(); // onSuccess에서 syncWithServer() 호출
} catch (error) {
  // 4. 실패: 롤백
  syncWithServer(serverData);
  showToast("저장 실패", "error");
}
```

---

### 4단계: 모달 스토어 통합

**목표**: 모달에서 이전 데이터 표시 문제 해결

**파일**: `/components/vocabulary/VocabularyListModal.tsx` (수정)

**수정 전**:

```typescript
// 기존 코드
const [savedListIds, setSavedListIds] = useState<Set<string>>(new Set());

useEffect(() => {
  if (isOpen && expressionId) {
    getContainingListIds(expressionId).then((ids) => {
      setSavedListIds(new Set(ids)); // 비동기 로드
    });
  }
}, [isOpen, expressionId, getContainingListIds]);
```

**수정 후**:

```typescript
"use client";

import { VocabularyListModalProps } from "./types";
import { useVocabularyLists } from "@/hooks/user/useVocabularyLists";
import {
  useVocabularyStore,
  selectSavedListIds,
} from "@/store/useVocabularyStore";

export default function VocabularyListModal({
  isOpen,
  onOpenChange,
  expressionId,
  trigger,
  onListAction,
}: VocabularyListModalProps) {
  const {
    lists,
    createList,
    toggleInList,
    getContainingListIds,
    setDefaultList,
  } = useVocabularyLists();
  const { dict } = useI18n();
  const { handleError } = useAppErrorHandler();
  const { user } = useAuthUser();

  // ⭐ 변경: 스토어에서 바로 가져옴 (useEffect 불필요)
  const savedListIds = useVocabularyStore(
    selectSavedListIds(expressionId || ""),
  );

  // 모달 열 때 최신 데이터 로드
  useEffect(() => {
    if (isOpen && expressionId) {
      getContainingListIds(expressionId).then((ids) => {
        useVocabularyStore.getState().syncSavedListIds(expressionId, ids);
      });
    }
  }, [isOpen, expressionId, getContainingListIds]);

  const handleToggle = async (listId: string) => {
    const isCurrentlyIn = savedListIds.has(listId);

    // 낙관적 업데이트
    useVocabularyStore
      .getState()
      .optimisticToggle(listId, expressionId || "", !isCurrentlyIn);

    try {
      if (expressionId) {
        await toggleInList(listId, expressionId, isCurrentlyIn);
        onListAction?.(listId, !isCurrentlyIn);
      }
    } catch (error) {
      console.error("Failed to toggle list:", error);
      // 실패 시 롤백은 SWR onSuccess에서 자동 처리됨
      handleError(error);
    }
  };

  const handleSetDefault = async (listId: string) => {
    // 낙관적 업데이트
    useVocabularyStore.getState().optimisticSetDefault(listId);

    try {
      await setDefaultList(listId);
      showToast("기본 단어장으로 설정되었습니다.");
    } catch (error) {
      handleError(error);
    }
  };

  // ... 나머지 코드는 동일
}
```

**구현 포인트**:

1. `savedListIds`를 로컬 상태가 아닌 스토어에서 바로 가져옴
2. `selectSavedListIds` selector로 필요한 데이터만 구독 (성능 최적화)
3. 모달 열 때 비동기로 최신 데이터 로드 (백그라운드)
4. `handleToggle`에서 낙관적 업데이트 적용

---

### 5단계: 컴포넌트 점진적 마이그레이션

**목표**: 기존 컴포넌트를 점진적으로 새로운 스토어로 마이그레이션

**순서**:

1. **VocabularyListModal** (4단계 완료)
2. **VocabularyListItem**
3. **VocabularyDetailHeader**
4. **SaveButton**
5. **ExpressionCard**

**5.1 VocabularyListItem 수정**

**파일**: `/components/vocabulary/VocabularyListItem.tsx`

**수정 전**:

```typescript
interface VocabularyListItemProps {
  list: VocabularyListWithCount;
  isSelected: boolean;
  // ...
}
```

**수정 후**:

```typescript
"use client";

import { memo } from "react";
import { VocabularyListWithCount } from "@/types/vocabulary";
import { useLongPress } from "@/hooks/useLongPress";
import { useI18n } from "@/context/I18nContext";
import { formatMessage, cn } from "@/lib/utils";
import { useVocabularyStore } from "@/store/useVocabularyStore";

interface VocabularyListItemProps {
  list: VocabularyListWithCount;
  expressionId?: string;
  onToggle: () => void;
  onSetDefault: () => void;
  disabled?: boolean;
}

const VocabularyListItem = memo(function VocabularyListItem({
  list,
  expressionId,
  onToggle,
  onSetDefault,
  disabled,
}: VocabularyListItemProps) {
  const { dict } = useI18n();

  // ⭐ 변경: 스토어에서 바로 가져옴
  const savedListIds = useVocabularyStore(
    (state) => expressionId ? state.savedListIds.get(expressionId) : new Set()
  );

  const isSelected = expressionId ? savedListIds.has(list.id) : false;

  const longPressProps = useLongPress(
    () => {
      if (!list.is_default && !disabled) onSetDefault();
    },
    () => !disabled && onToggle(),
  );

  return (
    <button
      {...longPressProps}
      disabled={disabled}
      className={cn(
        "vocab-list-item sm:cursor-pointer disabled:cursor-default",
        isSelected ? "vocab-list-item-selected" : "vocab-list-item-default",
      )}
    >
      {/* ... 기존 UI는 동일 */}
    </button>
  );
});

export default VocabularyListItem;
```

**5.2 VocabularyDetailHeader 수정**

**파일**: `/components/me/vocabulary/VocabularyDetailHeader.tsx`

**수정**:

```typescript
"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/context/I18nContext";
import { useVocabularyStore } from "@/store/useVocabularyStore";
import {
  updateVocabularyListTitle,
  deleteVocabularyList,
} from "@/services/actions/vocabulary";

interface VocabularyDetailHeaderProps {
  listId: string;
  title: string;
  itemCount: number;
  isDefault: boolean;
  onTitleSave?: (newTitle: string) => void;
  onListDelete?: () => void;
  onSetDefault?: () => void;
}

export function VocabularyDetailHeader({
  listId,
  title,
  itemCount,
  isDefault,
  onTitleSave,
  onListDelete,
  onSetDefault,
}: VocabularyDetailHeaderProps) {
  const { dict } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  // ⭐ 변경: 스토어에서 바로 가져옴
  const updateTitle = useCallback(
    (newTitle: string) => {
      useVocabularyStore.getState().optimisticUpdateTitle(listId, newTitle);
      updateVocabularyListTitle(listId, newTitle);
    },
    [listId],
  );

  const handleTitleSave = (newTitle: string) => {
    updateTitle(newTitle);
    setIsEditing(false);
    onTitleSave?.(newTitle);
  };

  // ... 나머지 코드는 유지
}
```

**5.3 SaveButton 수정**

**파일**: `/components/actions/SaveButton.tsx`

**수정**: 이미 `useSaveAction`를 사용하므로 큰 변경 없음. 다만, 낙관적 업데이트가 적용되는지 확인.

---

## 코드 예시

### 완전한 예시: 낙관적 업데이트 적용

```typescript
// useVocabularyLists.ts - toggleInList 완전한 예시

const toggleInList = useCallback(
  async (listId: string, expressionId: string, isCurrentlyIn: boolean) => {
    if (!isPro) {
      // Free 유저: 로컬 스토어 즉시 업데이트
      const localStore = useLocalActionStore.getState();
      if (isCurrentlyIn) {
        localStore.removeFromList(listId, expressionId);
      } else {
        localStore.addToList(listId, expressionId);
      }
      return;
    }

    // Pro 유저: 낙관적 업데이트 + API 호출
    const add = !isCurrentlyIn;

    // 1. 즉시 UI 업데이트 (낙관적)
    useVocabularyStore.getState().optimisticToggle(listId, expressionId, add);

    try {
      // 2. 백그라운드 API 호출
      if (isCurrentlyIn) {
        await removeFromVocabularyList(listId, expressionId);
      } else {
        await addToVocabularyList(listId, expressionId);
      }

      // 3. SWR 캐시 갱신
      await mutate();
    } catch (error) {
      // 4. 실패 시 롤백 (서버 데이터로 복원)
      useVocabularyStore.getState().syncWithServer(serverData || []);
      throw error;
    }
  },
  [isPro, mutate, serverData],
);
```

---

## 검증 방법

### 1. 기능 테스트

| 테스트 항목                              | 예상 동작          | 확인 방법                   |
| ---------------------------------------- | ------------------ | --------------------------- |
| 저장 버튼 클릭 시 UI 즉시 반영           | 100ms 내 반영      | Performance API로 측정      |
| 리스트 수정 후 모달에 최신 데이터 표시   | 즉시 표시          | 모달 열 시 데이터 확인      |
| 기본 리스트 설정 후 다른 리스트 업데이트 | 모든 UI에 반영     | 페이지 새로고침 없이 확인   |
| API 실패 시 롤백                         | 이전 상태로 복원   | Network throttle으로 테스트 |
| Free 유저 로컬 스토어 작동               | 로컬 즉시 업데이트 | localStorage 확인           |

### 2. 성능 측정

```javascript
// 측정 코드
const start = performance.now();

// 저장 버튼 클릭
await handleSaveToggle();

const end = performance.now();
console.log(`UI 업데이트 시간: ${end - start}ms`);

// 예상: 100ms 이내
```

### 3. 데이터 일관성 검증

```typescript
// SWR 캐시와 Zustand 스토어 일치 확인
const swrData = useSWR("vocabulary_lists", getVocabularyLists).data;
const zustandData = useVocabularyStore(selectLists);

console.assert(
  JSON.stringify(swrData) === JSON.stringify(zustandData),
  "SWR과 Zustand 데이터 불일치!",
);
```

---

## 롤백 계획

### 롤백 조건

다음 경우에 롤백 수행:

1. **성능 저하**: UI 업데이트 시간이 200ms 초과
2. **데이터 불일치**: SWR 캐시와 Zustand 스토어 데이터가 3회 이상 불일치
3. **메모리 누수**: Chrome DevTools에서 메모리 사용량 50% 증가

### 롤백 절차

1. **1단계**: Git에서 이전 커밋으로 롤백

   ```bash
   git checkout <commit-hash>
   ```

2. **2단계**: 새로운 스토어 파일 삭제

   ```bash
   rm /store/useVocabularyStore.ts
   rm /store/useUserActionStore.ts
   ```

3. **3단계**: 기존 훅 복원

   ```bash
   git checkout HEAD -- /hooks/user/useVocabularyLists.ts
   ```

4. **4단계**: 컴포넌트 복원
   ```bash
   git checkout HEAD -- /components/vocabulary/VocabularyListModal.tsx
   ```

### 롤백 후 조치

- 기존 코드베이스에서 다시 분석 수행
- 문제 원인 파악 후 수정 사항 도면 작성
- 팀 리뷰 후 재구현 시작

---

## 부록

### A. 참고자료

- [SWR 문서 - Mutation](https://swr.vercel.app/docs/mutation)
- [Zustand 문서 - Best Practices](https://docs.pmnd.rs/zustand/guides/performance)
- [React Optimistic UI 패턴](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)

### B. 관련 파일

| 파일                                                   | 역할            | 상태      |
| ------------------------------------------------------ | --------------- | --------- |
| `/store/useVocabularyStore.ts`                         | 통합 스토어     | 새로 생성 |
| `/hooks/user/useVocabularyLists.ts`                    | SWR-스토어 통합 | 수정      |
| `/components/vocabulary/VocabularyListModal.tsx`       | 모달 컴포넌트   | 수정      |
| `/components/vocabulary/VocabularyListItem.tsx`        | 리스트 아이템   | 수정      |
| `/components/me/vocabulary/VocabularyDetailHeader.tsx` | 헤더 컴포넌트   | 수정      |
| `/lib/server/revalidate.ts`                            | revalidate 함수 | 기존 유지 |
| `/services/actions/vocabulary.ts`                      | Server Actions  | 기존 유지 |

## Learn Action 통합 방법

### 통합 방식: useUserActions 유지

**현재 구조**:

```
useLocalActionStore
  ├── actions (save, learn 통합)
  └── vocabularyLists

useUserActions
  └── save와 learn을 통합하여 낙관적 업데이트 처리
```

**Zustand Refactoring 시**:

- 별도의 learn store 생성 불필요
- useUserActions 통합 방식 유지
- 캐시 무효화 로직만 추가

### Learn Action 처리 흐름

```
LearnButton 클릭
  → useUserActions.toggleAction(expressionId, "learn")
  → 낙관적 업데이트 (Pro: SWR, Free: useLocalActionStore)
  → toggle_user_action RPC (DB)
  → SWR 캐시 동기화 / 로컬 스토어 업데이트
```

### Vocabulary Action과의 차이점 명시

| 항목                | Vocabulary Action  | Learn Action                         |
| ------------------- | ------------------ | ------------------------------------ |
| **데이터 테이블**   | `vocabulary_items` | `user_actions` (action_type='learn') |
| **캐시 키**         | `vocabulary_lists` | `learned-expressions`                |
| **UI 목적**         | 단어장 관리        | 학습 완료 표시                       |
| **Store**           | useVocabularyStore | useUserActions 통합                  |
| **낙관적 업데이트** | vocabulary 전용    | useUserActions에 이미 구현됨         |

### SWR 캐시 무효화 로직 (필수 수정)

**문제**: Learn action 발생 시 learned list의 SWR 캐시를 갱신하지 않아 사용자가 learned 페이지에서 즉시 변경을 확인하지 못할 수 있음

**해결책**: `useUserActions.ts`의 `toggleAction` 함수에 learned 캐시 무효화 로직 추가

```typescript
// hooks/user/useUserActions.ts - toggleAction 수정 필요
const { mutate: globalMutate } = useSWRConfig();

const toggleAction = useCallback(
  async (expressionId: string, type: ActionType) => {
    if (isPro) {
      const isSave = type === "save";
      const currentData = (isSave ? saveActions : learnActions) || [];
      const mutateFn = isSave ? mutateSave : mutateLearn;

      // 1. 낙관적 업데이트 (즉시 UI 반영)
      const newData = currentData.includes(expressionId)
        ? currentData.filter((id) => id !== expressionId)
        : [...currentData, expressionId];
      await mutateFn(newData, { revalidate: false });

      try {
        // 2. 서버 API 호출
        await toggleUserAction(expressionId, type);

        // 3. SWR 캐시 갱신
        await mutate(); // onSuccess에서 syncWithServer() 호출됨
      } catch (error) {
        // 4. 실패 시 롤백
        await mutateFn(currentData, { revalidate: false });
        throw error;
      }
    } else {
      localToggle(expressionId, type);
    }
  },
  [
    isPro,
    saveActions,
    learnActions,
    mutateSave,
    mutateLearn,
    localToggle,
    toggleUserAction,
  ],
);
```

### 학습 완료 UI 특이사항

**목적**: Learned Page는 단순 표시 목적으로만 동작하며, 편집/관리 기능을 제공하지 않음

**특이사항**:

- `isSelectionMode={false}` - 선택 모드 비활성화
- `onToggleItem={() => {}}` - 토글 콜백 비활성화
- `readonly={true}` - VocabularyDetailHeader에 전달
- 선택 툴바/대량 작업 기능 미제공

**이유**: 학습 완료된 표현은 "학습 완료" 표시만 하면 되며, 사용자가 직접 관리하거나 제거하는 기능은 제공되지 않음.

---

## 부록

### A. 참고자료

- [SWR 문서 - Mutation](https://swr.vercel.app/docs/mutation)
- [Zustand 문서 - Best Practices](https://docs.pmnd.rs/zustand/guides/performance)
- [React Optimistic UI 패턴](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)
- [revalidate 함수 분석 보고서](./revalidate_analysis.md) - Next.js revalidate와 SWR의 관계

### B. 관련 파일

| 파일                                                   | 역할                               | 상태      |
| ------------------------------------------------------ | ---------------------------------- | --------- |
| `/store/useVocabularyStore.ts`                         | 통합 스토어                        | 새로 생성 |
| `/hooks/user/useVocabularyLists.ts`                    | SWR-스토어 통합                    | 수정      |
| `/components/vocabulary/VocabularyListModal.tsx`       | 모달 컴포넌트                      | 수정      |
| `/components/vocabulary/VocabularyListItem.tsx`        | 리스트 아이템                      | 수정      |
| `/components/me/vocabulary/VocabularyDetailHeader.tsx` | 헤더 컴포넌트                      | 수정      |
| `/lib/server/revalidate.ts`                            | revalidate 함수                    | 기존 유지 |
| `/services/actions/vocabulary.ts`                      | Server Actions                     | 기존 유지 |
| `/hooks/user/useUserActions.ts`                        | 사용자 액션 훅 (learn action 포함) | 수정 필요 |
| `/app/me/learned/page.tsx`                             | 학습 완료 페이지                   | 기존 유지 |
| `/components/me/learned/LocalLearnedDetail.tsx`        | Free 유저 학습 목록                | 기존 유지 |
| `/components/me/learned/RemoteLearnedDetail.tsx`       | Pro 유저 학습 목록                 | 기존 유지 |

### C. 질문사항

이 문서에 대한 질문이나 추가 필요한 사항이 있으시면, 다음을 참고해 주세요:

- [기술 구현 가이드](./index.md)
- [SWR 전략 문서](./use_swr_strategy.md)
- [단어장 관리 기능 참조](../feature_references/vocabulary_management.md)
- [revalidate 함수 분석 보고서](./revalidate_analysis.md) - Next.js revalidate와 SWR의 관계
