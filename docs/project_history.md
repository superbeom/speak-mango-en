# Project History & Q&A Logs

> 최신 항목이 상단에 위치합니다.

## 2026-01-14: 표현 카드 공유 버튼 통합 (Card Share Integration)

### ✅ 진행 사항

- **Expression Card Layout Update**: `components/ExpressionCard.tsx`
  - ShareButton을 absolute 포지셔닝으로 우측 하단에 배치
  - Link 컴포넌트에 `relative` 추가 (포지셔닝 컨텍스트)
  - 태그와 독립적인 영역으로 분리
- **Event Propagation Enhancement**: 이벤트 전파 방지 강화
- **i18n Update**: 9개 언어에 card.share 관련 텍스트 추가 (이전 커밋에서 누락)

### 💬 주요 Q&A 및 의사결정

**Q. ShareButton을 왜 absolute 포지셔닝으로 배치했나?**

- **A.** 초기에는 태그와 함께 flex 레이아웃에 배치했으나, 태그 개수에 따라 공유 버튼 위치가 변동되는 문제 발생. absolute 포지셔닝으로 우측 하단(`bottom-5 right-5`)에 고정하여:
  1. **일관된 위치**: 태그 개수와 무관하게 항상 같은 위치
  2. **시각적 균형**: 우측 하단 고정으로 카드 레이아웃 안정성 확보
  3. **공간 효율**: 태그 영역을 침범하지 않고 독립적으로 배치

**Q. Link에 `relative`와 `block`을 함께 사용해도 괜찮은가?**

- **A.** 완전히 유효한 조합임:
  - `block`: display 속성 (레이아웃 타입) - Link가 카드 전체 높이(`h-full`) 차지
  - `relative`: position 속성 (포지셔닝 컨텍스트) - ShareButton의 absolute 기준점
  - 두 속성은 서로 다른 CSS 속성이므로 충돌 없이 함께 작동

**Q. 이벤트 전파 방지는 어떻게 강화했나?**

- **A.** 이중 방어 전략:
  1. **ShareButton 내부**: `handleShare`에서 `e.preventDefault()` + `e.stopPropagation()`
  2. **ExpressionCard**: ShareButton의 `onClick` prop에서 `e.stopPropagation()`
  - 두 레벨에서 이벤트 전파를 차단하여 카드 클릭 이벤트와 완전히 분리

**Q. 태그와 공유 버튼을 왜 분리했나?**

- **A.** 초기 grid 레이아웃(2:1 비율)도 시도했으나, absolute 포지셔닝이 더 나은 이유:
  - **유연성**: 태그가 많아져도 레이아웃 깨지지 않음
  - **명확성**: 공유 버튼이 항상 예측 가능한 위치에 있어 사용자 학습 비용 감소
  - **반응형**: 모바일/데스크탑 모두에서 일관된 경험 제공

### 🏗️ 구현 상세

**1. Absolute Positioning**

```tsx
// ExpressionCard.tsx
<Link
  href={ROUTES.EXPRESSION_DETAIL(item.id)}
  className="relative block h-full" // relative 추가
>
  {/* 카드 내용 */}

  {/* ShareButton - absolute 포지셔닝 */}
  <div className="absolute bottom-5 right-5">
    <ShareButton
      variant="compact"
      expressionId={item.id}
      expressionText={item.expression}
      meaning={meaning}
      shareLabel={dict.card.share}
      shareCopiedLabel={dict.card.shareCopied}
      shareFailedLabel={dict.card.shareFailed}
      onClick={(e) => e.stopPropagation()}
    />
  </div>
</Link>
```

**2. Event Propagation Prevention**

```tsx
// ShareButton.tsx - handleShare
const handleShare = async (e: React.MouseEvent) => {
  e.preventDefault(); // 기본 동작 방지
  e.stopPropagation(); // 이벤트 전파 차단

  if (onClick) onClick(e); // 추가 핸들러 실행
  // ... 공유 로직
};
```

### 🔍 검증 방법

**브라우저 테스트**:

1. **메인 페이지 카드**:

   - 공유 버튼이 우측 하단에 고정 위치로 표시
   - 공유 버튼 클릭 시 페이지 이동 없이 공유 기능만 실행 ✅
   - Toast 알림 정상 표시 ✅

2. **관련 표현 섹션**:
   - 데스크탑 Marquee 스크롤 중에도 공유 버튼 정상 작동
   - 모바일 세로 리스트에서도 동일하게 작동

### 🔄 다음 단계

- [ ] 사용자 피드백 수집 (공유 버튼 위치 및 크기)
- [ ] GA4에서 카드 공유 vs 상세 페이지 공유 비율 분석

## 2026-01-14: Share 기능 구현 (Web Share API + Toast System)

### ✅ 진행 사항

- **Share Button Component**: `components/ShareButton.tsx` 생성
  - Web Share API 활용 (모바일 네이티브 공유)
  - Clipboard Fallback (데스크탑 복사)
  - Variant 지원 (`default` / `compact`)
  - Analytics 자동 추적 통합
- **Toast Notification System**: 재사용 가능한 Toast 컴포넌트 및 타입 시스템 구축
  - `components/ui/Toast.tsx`: 독립 컴포넌트
  - `types/toast.ts`: 중앙 집중식 타입 관리
- **Share URL Generation**: `lib/utils.ts`에 `getShareUrl` 함수 추가
- **i18n 업데이트**: 9개 언어에 share 관련 텍스트 추가
- **UI Integration**: 상세 페이지 및 표현 카드에 ShareButton 통합
- **Documentation**: Analytics, Features, Task 문서 업데이트

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Toast를 별도 컴포넌트로 분리했나?**

- **A.** ShareButton 내부에 Toast 로직을 포함시키면 재사용성이 떨어짐. 향후 다른 기능(예: 북마크, 좋아요 등)에서도 Toast 알림이 필요할 수 있으므로, `components/ui/Toast.tsx`로 독립시켜 범용 컴포넌트로 만듦. 이를 통해 일관된 알림 UX 제공 가능.

**Q. Toast 타입을 왜 `types/toast.ts`로 분리했나?**

- **A.** `ToastType`과 `TOAST_TYPE` 상수를 ShareButton과 Toast 컴포넌트 모두에서 사용함. 두 컴포넌트가 서로 다른 파일에 있으므로, 타입을 중앙 집중식으로 관리하여 일관성 확보. 향후 Toast 타입이 확장될 때(예: `warning`, `info` 추가) 한 곳에서만 수정하면 됨.

**Q. Web Share API가 지원되지 않는 환경은 어떻게 처리하나?**

- **A.** `navigator.share` 존재 여부를 체크하여 분기 처리:
  - **지원**: Web Share API 사용 (`sharePlatform: "native"`)
  - **미지원**: Clipboard API로 URL 복사 (`sharePlatform: "clipboard"`)
  - 두 경우 모두 Toast로 사용자에게 피드백 제공.

**Q. Analytics 추적은 어떻게 구현했나?**

- **A.** ShareButton 내부에서 자동으로 추적:
  1. **Share Click**: 버튼 클릭 시 `trackShareClick` 호출
     - `shareMethod`: `"native"` (Web Share API) 또는 `"copy_link"` (클립보드)
     - `sharePlatform`: `"native"` 또는 `"clipboard"`
  2. **Share Complete**: 공유 성공 시 `trackShareComplete` 호출
     - Web Share API 완료 또는 클립보드 복사 성공 시
  - 컴포넌트 사용자는 Analytics 로직을 신경 쓸 필요 없이 자동으로 추적됨.

### 🏗️ 구현 상세

**1. ShareButton Component**

```typescript
// components/ShareButton.tsx
export default function ShareButton({
  expressionId,
  expressionText,
  meaning,
  shareLabel,
  shareCopiedLabel,
  shareFailedLabel,
  variant = "default",
  onClick,
}: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) onClick(e);

    const shareUrl = getShareUrl(expressionId, {
      utm_source: "share",
      utm_medium: "native",
    });

    if (navigator.share) {
      // Web Share API
      await navigator.share({ title, text, url: shareUrl });
      trackShareComplete({ expressionId, sharePlatform: "native" });
    } else {
      // Clipboard Fallback
      await navigator.clipboard.writeText(shareUrl);
      trackShareComplete({ expressionId, sharePlatform: "clipboard" });
    }
  };
}
```

**2. Toast Component**

```typescript
// components/ui/Toast.tsx
export default function Toast({ message, type, isVisible }: ToastProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
        type === TOAST_TYPE.SUCCESS ? "bg-green-500" : "bg-red-500"
      )}
    >
      {type === TOAST_TYPE.SUCCESS && <Check />}
      {type === TOAST_TYPE.ERROR && <X />}
      <span>{message}</span>
    </div>
  );
}
```

**3. Type System**

```typescript
// types/toast.ts
export type ToastType = "success" | "error";

export const TOAST_TYPE = {
  SUCCESS: "success" as const,
  ERROR: "error" as const,
} satisfies Record<string, ToastType>;
```

### 📊 현재 추적 가능한 이벤트 (Phase 5 완료)

**자동 추적:**

- ✅ `page_view`: 모든 페이지 뷰

**수동 추적 (Phase 3-5 완료):**

- ✅ `expression_click`: 표현 카드 클릭
- ✅ `expression_view`: 표현 상세 조회
- ✅ `audio_play`: 오디오 재생
- ✅ `audio_complete`: 오디오 재생 완료
- ✅ `learning_mode_toggle`: 학습 모드 전환
- ✅ `filter_apply`: 필터 적용
- ✅ `search`: 검색 실행
- ✅ `tag_click`: 태그 클릭
- ✅ `related_click`: 관련 표현 클릭
- ✅ `share_click`: 공유 버튼 클릭
- ✅ `share_complete`: 공유 완료

### 🔍 검증 방법

**개발 환경 콘솔 로그 확인:**

1. **모바일 (Web Share API)**:

   - Share 버튼 클릭 → 네이티브 공유 다이얼로그 표시
   - Instagram, Twitter, KakaoTalk 등 설치된 앱으로 공유 가능
   - `[Analytics] Event: share_click { expression_id: "...", share_method: "native", share_platform: "native" }`
   - `[Analytics] Event: share_complete { expression_id: "...", share_platform: "native" }`

2. **데스크탑 (Clipboard)**:

   - Share 버튼 클릭 → URL 클립보드 복사
   - Toast 알림: "Link copied!"
   - `[Analytics] Event: share_click { expression_id: "...", share_method: "copy_link", share_platform: "clipboard" }`
   - `[Analytics] Event: share_complete { expression_id: "...", share_platform: "clipboard" }`

## 2026-01-14: Analytics Phase 3 완료 (audio_complete, related_click 추적)

### ✅ 진행 사항

- **Phase 3: 나머지 이벤트 추적 구현 완료**
  - Audio Complete Tracking (`DialogueAudioButton.tsx`)
  - Related Expression Click Tracking (`RelatedExpressions.tsx`)
- **Props 확장**:
  - `DialogueSection`: `expressionId` prop 추가 및 하위 컴포넌트로 전달
  - `DialogueItem`: `isAutoPlaying`, `expressionId`, `audioIndex` props 추가
  - `DialogueAudioButton`: `isAutoPlaying` prop 추가 및 `play()` 함수 시그니처 확장
  - `RelatedExpressions`: `currentExpressionId` prop 추가
- **중복 추적 방지 로직 구현**:
  - 전체 듣기(Play All) 시 개별 `audio_play` 이벤트 중복 방지
  - 일시정지 후 재개(Resume) 시 `audio_play` 이벤트 스킵
- **문서 업데이트**:
  - `docs/product/features_list.md`: Phase 3 이벤트 상태를 ⏳에서 ✅로 변경
  - `docs/task.md`: Audio Complete, Related Click 작업 완료 표시

### 💬 주요 Q&A 및 의사결정

**Q. 전체 듣기 중에 개별 audio_play 이벤트가 중복 발생하는 문제를 어떻게 해결했나?**

- **A.** React의 state 업데이트는 비동기이므로, `setIsAutoPlaying(true)` 후 즉시 `play()`를 호출해도 컴포넌트는 아직 `isAutoPlaying: false` 상태임. 이를 해결하기 위해:
  1. `DialogueAudioButtonHandle.play()` 함수에 `isSequential` 파라미터 추가
  2. `DialogueSection`에서 전체 듣기 시 `play(true)` 호출하여 명시적으로 sequential 재생임을 전달
  3. `DialogueAudioButton`의 `togglePlay` 함수를 `useCallback`으로 감싸고 dependency에 `isAutoPlaying` 포함
  4. `useImperativeHandle`의 dependency에 `togglePlay` 추가하여 최신 클로저 참조

**Q. 일시정지 후 재개할 때 audio_play 이벤트가 발생하는 문제는?**

- **A.** 일시정지 상태(`isPaused`)를 체크하여 resume인지 새로운 재생인지 구분:
  ```typescript
  const isResume = isPaused;
  const shouldSkipTracking = (forcePlay && isSequential) || isResume;
  ```
  Resume인 경우 추적을 스킵하여 중복 방지.

**Q. 전체 듣기 중에 다른 오디오를 클릭하면 어떻게 되나?**

- **A.** 사용자가 직접 버튼을 클릭한 경우(`forcePlay: false`)는 항상 개별 듣기로 추적됨:
  ```typescript
  const shouldSkipTracking = (forcePlay && isSequential) || isResume;
  ```
  `forcePlay`가 `false`이면 `shouldSkipTracking`도 `false`가 되어 정상적으로 추적됨.

**Q. Related Expression 클릭 추적은 어떻게 구현했나?**

- **A.** `RelatedExpressions` 컴포넌트에 `currentExpressionId` prop을 추가하고, 카드 클릭 시 `trackRelatedClick` 호출:
  ```typescript
  trackRelatedClick({
    fromExpressionId: currentExpressionId,
    toExpressionId: item.id,
  });
  ```
  모바일(세로 리스트)과 데스크탑(Marquee 스크롤) 모두에서 동일하게 작동.

### 🏗️ 구현 상세

**1. Audio Complete Tracking**

```typescript
// DialogueAudioButton.tsx - handleEnded
const handleEnded = () => {
  setIsPlaying(false);
  setIsPaused(false);

  // Track audio complete event
  if (expressionId !== undefined && audioIndex !== undefined) {
    trackAudioComplete({
      expressionId,
      audioIndex,
    });
  }

  onEndedRef.current?.();
};
```

**2. Sequential Play with Explicit Parameter**

```typescript
// DialogueSection.tsx - handlePlayAll
const handlePlayAll = () => {
  // ...
  setIsAutoPlaying(true);
  setPlayingIndex(0);
  // Pass true to indicate this is sequential playback
  buttonRefs.current[0]?.play(true);

  trackAudioPlay({
    expressionId,
    audioIndex: 0,
    playType: "sequential",
  });
};
```

**3. Smart Tracking Logic**

```typescript
// DialogueAudioButton.tsx - togglePlay
const isResume = isPaused;

// Skip tracking if:
// 1. This is a forced play (from ref.play()) AND isSequential is true (auto-play sequence)
// 2. This is a resume from paused state (not a new play)
const shouldSkipTracking = (forcePlay && isSequential) || isResume;

if (
  !shouldSkipTracking &&
  expressionId !== undefined &&
  audioIndex !== undefined
) {
  trackAudioPlay({
    expressionId,
    audioIndex,
    playType,
  });
}
```

**4. Related Expression Click Tracking**

```typescript
// RelatedExpressions.tsx
const handleCardClick = (toExpressionId: string) => {
  trackRelatedClick({
    fromExpressionId: currentExpressionId,
    toExpressionId: toExpressionId,
  });
};
```

### 📊 현재 추적 가능한 이벤트 (Phase 3 완료)

**자동 추적:**

- ✅ `page_view`: 모든 페이지 뷰 (AnalyticsProvider)

**수동 추적 (Phase 3 - 완료):**

- ✅ `expression_click`: 표현 카드 클릭
- ✅ `expression_view`: 표현 상세 조회
- ✅ `audio_play`: 오디오 재생
- ✅ `audio_complete`: 오디오 재생 완료 (**신규**)
- ✅ `learning_mode_toggle`: 학습 모드 전환
- ✅ `filter_apply`: 필터 적용
- ✅ `search`: 검색 실행
- ✅ `tag_click`: 태그 클릭
- ✅ `related_click`: 관련 표현 클릭 (**신규**)

**향후 구현 예정:**

- ⏳ `share_click`: 공유 버튼 클릭
- ⏳ `share_complete`: 공유 완료

### 🔍 검증 방법

**개발 환경 콘솔 로그 확인:**

```bash
# 개발 서버 실행
yarn dev
```

브라우저 콘솔에서 다음 시나리오 테스트:

1. **전체 듣기**: 상세 페이지에서 "Play All" 버튼 클릭

   - `[Analytics] Event: audio_play { expression_id: "...", audio_index: 0, play_type: "sequential" }` (1회만)
   - `[Analytics] Event: audio_complete { expression_id: "...", audio_index: 0 }`
   - `[Analytics] Event: audio_complete { expression_id: "...", audio_index: 1 }`

2. **개별 듣기**: 대화 버블의 오디오 버튼 클릭

   - `[Analytics] Event: audio_play { expression_id: "...", audio_index: 0, play_type: "individual" }`
   - `[Analytics] Event: audio_complete { expression_id: "...", audio_index: 0 }`

3. **일시정지 후 재개**: 재생 중 버튼 클릭 → 다시 클릭

   - 재개 시 `audio_play` 이벤트 발생하지 않음 ✅

4. **관련 표현 클릭**: 상세 페이지 하단의 관련 표현 카드 클릭
   - `[Analytics] Event: related_click { from_expression_id: "...", to_expression_id: "..." }`

### 🔄 다음 단계

- [ ] GA4 대시보드에서 실제 데이터 수집 검증 (프로덕션 배포 후)
- [ ] 공유 기능 구현 시 `share_click`, `share_complete` 이벤트 추가

## 2026-01-14: Analytics Phase 3 완료 (학습 모드, 필터, 검색, 태그 추적)

### ✅ 진행 사항

- **Phase 3: 나머지 이벤트 추적 구현 완료**
  - Learning Mode Toggle Tracking (`DialogueSection.tsx`)
  - Category Filter Tracking (`FilterBar.tsx`)
  - Search Tracking (`SearchBar.tsx`)
  - Tag Click Tracking (`Tag.tsx`)
- **Props 확장**:
  - `Tag`: `source` prop 추가 (`"card" | "detail" | "filter"` 구분)
- **상위 컴포넌트 수정**:
  - `ExpressionCard`: Tag에 `source="card"` 전달
  - `app/expressions/[id]/page.tsx`: Tag에 `source="detail"` 전달
- **문서 업데이트**:
  - `docs/product/features_list.md`: Phase 3 이벤트 상태를 ⏳에서 ✅로 변경

### 💬 주요 Q&A 및 의사결정

**Q. 학습 모드 토글 추적은 어떻게 구현했나?**

- **A.** `DialogueSection` 컴포넌트의 두 가지 학습 모드를 각각 추적:
  1. **Blind Listening Mode**: Headphones 아이콘 클릭 시 `mode: "blind_listening"` 전송
  2. **Translation Blur**: Eye 아이콘 클릭 시 `mode: "translation_blur"` 전송
  - 각 모드의 활성화/비활성화를 `action: "enable" | "disable"`로 구분하여 사용자의 학습 패턴 파악 가능

**Q. 카테고리 필터 추적에서 중복 클릭은 어떻게 처리했나?**

- **A.** `FilterBar`에서 이미 선택된 카테고리를 다시 클릭하는 경우:
  - `"all"` 카테고리는 아무 동작도 하지 않음 (중복 페칭 방지)
  - 다른 카테고리는 선택 해제(`category: "all"`)하고 해당 이벤트 전송
  - 실제로 필터가 변경될 때만 이벤트를 전송하여 데이터 정확성 확보

**Q. Tag 컴포넌트의 source는 왜 필요한가?**

- **A.** 태그 클릭이 발생하는 위치에 따라 사용자 행동 패턴이 다름:
  - `"card"`: 홈 피드의 카드에서 태그 클릭 (탐색 초기 단계)
  - `"detail"`: 상세 페이지에서 태그 클릭 (콘텐츠 소비 후 관련 탐색)
  - `"filter"`: 필터 바에서 태그 클릭 (향후 구현 예정)
  - 이를 통해 어느 단계에서 태그 기반 탐색이 활발한지 분석 가능

**Q. 빈 검색어는 왜 추적하지 않나?**

- **A.** `SearchBar`의 `handleSubmit`에서 `value.trim()`이 비어있으면 이벤트를 전송하지 않음. 빈 검색어는 사용자가 실수로 Enter를 누르거나 검색을 취소하는 경우가 많아 의미 있는 데이터가 아니므로 제외.

### 🏗️ 구현 상세

**1. Learning Mode Toggle Tracking**

```typescript
// DialogueSection.tsx
import { trackLearningModeToggle } from "@/analytics";

// Blind Listening 활성화
trackLearningModeToggle({
  mode: "blind_listening",
  action: "enable",
});

// Translation Blur 비활성화 (모두 보기)
trackLearningModeToggle({
  mode: "translation_blur",
  action: "disable",
});
```

**2. Category Filter Tracking**

```typescript
// FilterBar.tsx
import { trackFilterApply } from "@/analytics";

// 카테고리 변경 시
trackFilterApply({
  filterType: "category",
  filterValue: cat, // "business", "travel", "all" 등
});
```

**3. Search Tracking**

```typescript
// SearchBar.tsx
import { trackSearch } from "@/analytics";

// 검색 제출 시 (빈 검색어 제외)
if (value.trim()) {
  trackSearch({
    searchTerm: value,
  });
}
```

**4. Tag Click Tracking**

```typescript
// Tag.tsx
import { trackTagClick } from "@/analytics";

// 태그 클릭 시
trackTagClick({
  tagName: label,
  source: source, // "card", "detail", "filter"
});
```

### 📊 현재 추적 가능한 이벤트 (Phase 3 완료)

**자동 추적 (Phase 1-2):**

- ✅ `page_view`: 모든 페이지 뷰 (AnalyticsProvider)

**수동 추적 (Phase 3 - 구현 완료):**

- ✅ `expression_click`: 표현 카드 클릭
- ✅ `expression_view`: 표현 상세 조회
- ✅ `audio_play`: 오디오 재생
- ✅ `learning_mode_toggle`: 학습 모드 전환 (**신규**)
- ✅ `filter_apply`: 필터 적용 (**신규**)
- ✅ `search`: 검색 실행 (**신규**)
- ✅ `tag_click`: 태그 클릭 (**신규**)

**수동 추적 (향후 구현 예정):**

- ⏳ `audio_complete`: 오디오 재생 완료
- ⏳ `related_click`: 관련 표현 클릭
- ⏳ `share_click`: 공유 버튼 클릭
- ⏳ `share_complete`: 공유 완료

### 🔍 검증 방법

**개발 환경 콘솔 로그 확인:**

```bash
# 개발 서버 실행
yarn dev
```

브라우저 콘솔에서 다음 이벤트 로그 확인:

1. **학습 모드 토글**: 상세 페이지에서 Headphones/Eye 아이콘 클릭
   - `[Analytics] Event: learning_mode_toggle { mode: "blind_listening", action: "enable" }`
2. **카테고리 필터**: 홈 페이지에서 카테고리 버튼 클릭
   - `[Analytics] Event: filter_apply { filter_type: "category", filter_value: "business" }`
3. **검색**: 검색창에 "hello" 입력 후 Enter
   - `[Analytics] Event: search { search_term: "hello" }`
4. **태그 클릭**: 카드 또는 상세 페이지의 태그 클릭
   - `[Analytics] Event: tag_click { tag_name: "daily", source: "card" }`

### 🔄 다음 단계

- [ ] `audio_complete` 이벤트 구현 (`DialogueAudioButton.tsx`)
- [ ] `related_click` 이벤트 구현 (`RelatedExpressions.tsx`)
- [ ] GA4 대시보드에서 실제 데이터 수집 검증 (프로덕션 배포 후)

## 2026-01-14: Analytics Phase 3 구현 (컴포넌트 이벤트 추적 및 모듈 재구성)

### ✅ 진행 사항

- **Analytics Module Reorganization**: `lib/analytics/` → `analytics/` (루트 레벨로 이동)
  - 독립된 모듈로 분리하여 발견 가능성 및 유지보수성 향상
  - Import 경로 단순화: `@/lib/analytics` → `@/analytics`
  - 7개 파일의 import 경로 업데이트 완료
- **Comment Localization**: 모든 영어 주석을 한국어로 변환
  - `analytics/index.ts`: 12개 이벤트 함수 주석 한국어화
  - `analytics/AnalyticsProvider.tsx`: Provider 주석 한국어화
  - `analytics/ExpressionViewTracker.tsx`: Tracker 주석 한국어화
- **Phase 3: Component-Level Event Tracking**
  - Expression Click Tracking (`ExpressionCard.tsx`)
  - Expression View Tracking (`ExpressionViewTracker.tsx` 신규 생성)
  - Audio Play Tracking Infrastructure (`DialogueAudioButton.tsx`)

### 💬 주요 Q&A 및 의사결정

**Q. Analytics 모듈을 왜 `lib/`에서 루트로 이동했나?**

- **A.** Analytics는 단순 유틸리티가 아니라 독립적인 기능 모듈임. `lib/`은 범용 유틸리티 함수를 위한 공간이고, Analytics는 GA4 통합, Provider, Tracker 등 여러 컴포넌트로 구성된 완전한 모듈이므로 루트 레벨에서 관리하는 것이 적절함. 이는 `components/`, `hooks/`, `context/`와 동일한 레벨의 독립 모듈로 취급.

**Q. ExpressionViewTracker를 왜 별도 컴포넌트로 분리했나?**

- **A.** 표현 상세 페이지(`app/expressions/[id]/page.tsx`)는 서버 컴포넌트인데, Analytics 추적은 클라이언트에서만 가능함(`useEffect` 필요). 따라서 클라이언트 컴포넌트인 `ExpressionViewTracker`를 별도로 만들어 서버 컴포넌트에서 import하여 사용. 이를 통해 서버/클라이언트 경계를 명확히 분리하고 코드 재사용성 향상.

**Q. DialogueAudioButton에 analytics props를 왜 선택적(optional)으로 만들었나?**

- **A.** `DialogueAudioButton`은 범용 컴포넌트로 다양한 곳에서 사용될 수 있음. Analytics가 필요 없는 경우(예: 미리보기, 테스트 환경)에도 동작해야 하므로 props를 선택적으로 설계. Props가 제공되면 추적하고, 없으면 추적하지 않는 조건부 로직 적용.

**Q. 주석을 왜 모두 한국어로 변경했나?**

- **A.** 프로젝트 전체가 한국어 주석을 사용하는 규칙을 따르고 있음. Analytics 모듈만 영어 주석을 사용하면 일관성이 깨지고, 향후 유지보수 시 혼란을 야기할 수 있음. 코드베이스 전체의 일관성 유지가 장기적으로 더 중요.

### 🏗️ 구현 상세

**1. Expression Click Tracking**

```typescript
// ExpressionCard.tsx
trackExpressionClick({
  expressionId: item.id,
  expressionText: item.expression,
  category: item.category,
  source: "home_feed",
});
```

**2. Expression View Tracking**

```typescript
// ExpressionViewTracker.tsx (새로운 클라이언트 컴포넌트)
useEffect(() => {
  trackExpressionView({
    expressionId,
    category,
    lang,
  });
}, [expressionId, category, lang]);
```

**3. Audio Play Tracking**

```typescript
// DialogueAudioButton.tsx
interface DialogueAudioButtonProps {
  // ... 기존 props
  // Analytics props (선택적)
  expressionId?: string;
  audioIndex?: number;
  playType?: "individual" | "sequential";
}

// 재생 시작 시
if (expressionId !== undefined && audioIndex !== undefined) {
  trackAudioPlay({
    expressionId,
    audioIndex,
    playType,
  });
}
```

### 📊 현재 추적 가능한 이벤트

**자동 추적 (Phase 1-2):**

- ✅ `page_view`: 모든 페이지 뷰 (AnalyticsProvider)

**수동 추적 (Phase 3 - 구현 완료):**

- ✅ `expression_click`: 표현 카드 클릭
- ✅ `expression_view`: 표현 상세 조회
- ✅ `audio_play`: 오디오 재생 (인프라 구축, props 전달 필요)

**수동 추적 (Phase 3 - 구현 예정):**

- ⏳ `learning_mode_toggle`: 학습 모드 전환
- ⏳ `filter_apply`: 필터 적용
- ⏳ `search`: 검색 실행
- ⏳ `tag_click`: 태그 클릭
- ⏳ `related_click`: 관련 표현 클릭

### 🔄 다음 단계

- `DialogueSection.tsx`에 `expressionId` prop 추가 및 `DialogueItem`으로 전달
- 나머지 Phase 3 이벤트 추적 구현 (학습 모드, 필터, 검색, 태그, 관련 표현)
- 개발 환경에서 콘솔 로그 테스트
- GA4 대시보드에서 실제 데이터 수집 검증

## 2026-01-14: Analytics Implementation (Google Analytics 4 Integration)

### ✅ 진행 사항

- **GA4 Integration**: Google Analytics 4를 Next.js 16 App Router 프로젝트에 통합하여 사용자 행동 분석 인프라 구축.
- **Environment-Based Configuration**: 개발/프로덕션 환경별로 별도의 GA4 속성 사용하도록 환경 변수 기반 자동 전환 구현.
- **Analytics Module Structure**: `lib/analytics/` 폴더 생성 및 모듈화
  - `index.ts`: 타입 안전한 이벤트 추적 유틸리티 함수 (10개 핵심 이벤트 + 2개 공유 이벤트)
  - `AnalyticsProvider.tsx`: 페이지 뷰 자동 추적 Provider 컴포넌트
- **Automatic Page View Tracking**: `usePathname` + `useSearchParams` 훅을 활용한 라우트 변경 감지 및 자동 페이지 뷰 전송.
- **Title Duplication Fix**: i18n 파일의 `expressionTitle`에서 `| {serviceName}` 제거하여 `layout.tsx`의 `title.template`과 중복 방지.
- **Documentation**:
  - `analytics_guide.md`: 전체 Analytics 전략 및 이벤트 설계 문서
  - `implementation_guide.md`: 다른 프로젝트에서 재사용 가능한 실전 구현 가이드

### 🏗️ 아키텍처 설계

**디렉토리 구조:**

```
lib/analytics/
├── index.ts              # 유틸리티 함수 (이벤트 추적)
└── AnalyticsProvider.tsx # Provider 컴포넌트 (페이지 뷰 자동 추적)
```

**환경별 분리:**

- 개발 환경: `NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID` (Speak Mango EN (Dev) 속성)
- 프로덕션 환경: `NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID` (Speak Mango EN 속성)
- `process.env.NODE_ENV`에 따라 자동 선택

**Provider 계층:**

```tsx
<AnalyticsProvider>
  {" "}
  // 최상위 (독립적)
  <ExpressionProvider>{children}</ExpressionProvider>
</AnalyticsProvider>
```

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Analytics를 components가 아닌 lib 폴더에 두었나?**

- **A.** `AnalyticsProvider`는 UI 컴포넌트가 아니라 부수 효과(side effect)를 처리하는 유틸리티 Provider임. `ExpressionProvider`처럼 상태 관리를 하는 Context와 달리, 단순히 `useEffect`로 이벤트를 추적하는 역할만 수행. `lib/analytics.ts`와 함께 있는 것이 논리적이며, 향후 확장성을 고려하여 `lib/analytics/` 폴더로 모듈화.

**Q. 개발/프로덕션 환경을 왜 별도 GA4 속성으로 분리했나?**

- **A.** 개발 중 테스트 데이터가 실제 프로덕션 통계에 섞이는 것을 방지하기 위함. 두 개의 환경 변수(`NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID`)를 `.env.local`에 설정하고, `lib/analytics/index.ts`에서 `NODE_ENV`에 따라 자동 선택하도록 구현. 이 방식은 `.env.local`과 `.env.production` 파일을 분리하는 것보다 안전하고 관리가 용이함.

**Q. `document.title`이 빈 값으로 추적되는 문제를 어떻게 해결했나?**

- **A.** `AnalyticsProvider`가 클라이언트 컴포넌트로 렌더링될 때, Next.js가 아직 `document.title`을 설정하지 않은 상태임. `setTimeout` 100ms를 추가하여 Next.js Metadata API가 title을 설정할 시간을 확보. 이는 SSR 환경에서 클라이언트 컴포넌트가 hydration되는 타이밍 이슈를 해결하는 일반적인 패턴.

**Q. Title 중복 문제(`snap up | Speak Mango | Speak Mango`)는 어떻게 발생했나?**

- **A.** `layout.tsx`의 `title.template`이 `%s | Speak Mango` 형식이고, i18n 파일의 `expressionTitle`이 `{expression} | {serviceName}` 형식이어서 중복 발생. 9개 언어 파일 모두에서 `expressionTitle`을 `{expression}`으로 수정하여 해결. `layout.tsx`의 template이 자동으로 서비스명을 추가하므로 중복 불필요.

**Q. GA4 스크립트를 왜 `layout.tsx`에서 `GA_MEASUREMENT_ID`를 import해서 사용하나?**

- **A.** 환경별 측정 ID 선택 로직을 `lib/analytics/index.ts`에 집중시키기 위함. `layout.tsx`에서 환경 변수를 직접 참조하면 로직이 분산되고, 향후 환경 추가 시 여러 파일을 수정해야 함. `GA_MEASUREMENT_ID`를 export하여 단일 진실 공급원(Single Source of Truth) 유지.

**Q. 타입 에러(`Argument of type 'Date' is not assignable to parameter of type 'string'`)는 어떻게 해결했나?**

- **A.** `gtag` 함수의 타입 정의가 단일 시그니처로 되어 있어서, `gtag("js", new Date())`처럼 `Date` 객체를 전달할 때 타입 에러 발생. 함수 오버로드를 사용하여 각 명령어(`js`, `config`, `event`)별로 다른 타입의 파라미터를 받을 수 있도록 수정:
  ```typescript
  gtag?: {
    (command: "js", date: Date): void;
    (command: "config", targetId: string, config?: Record<string, any>): void;
    (command: "event", eventName: string, params?: Record<string, any>): void;
  };
  ```

### 📊 구현된 이벤트 함수

**핵심 이벤트 (10개):**

1. `trackPageView` - 페이지 뷰 (자동)
2. `trackExpressionView` - 표현 상세 조회
3. `trackExpressionClick` - 표현 카드 클릭
4. `trackAudioPlay` - 오디오 재생
5. `trackAudioComplete` - 오디오 재생 완료
6. `trackLearningModeToggle` - 학습 모드 전환
7. `trackFilterApply` - 필터 적용
8. `trackSearch` - 검색 실행
9. `trackTagClick` - 태그 클릭
10. `trackRelatedClick` - 관련 표현 클릭

**향후 구현 예정 (2개):** 11. `trackShareClick` - 공유 버튼 클릭 12. `trackShareComplete` - 공유 완료

### 🔄 다음 단계

- **Phase 3**: 컴포넌트별 이벤트 추적 구현
  - `ExpressionCard.tsx`: 표현 클릭 추적
  - `DialogueAudioButton.tsx`: 오디오 재생 추적
  - `DialogueSection.tsx`: 학습 모드 전환 추적
  - `FilterBar.tsx`: 필터/검색 추적
  - `Tag.tsx`: 태그 클릭 추적

## 2026-01-13: PWA iOS Splash Screen Fix (Troubleshooting & Resolution)

### ✅ 진행 사항

- **Explicit Head Injection**: Next.js `metadata.appleWebApp` 설정이 iOS에서 무시되는 현상을 해결하기 위해, `layout.tsx`에 수동으로 `<head>` 태그를 선언하고 `<link rel="apple-touch-startup-image">`를 직접 주입.
- **Standalone Mode Enforcement**: `apple-mobile-web-app-capable` 메타 태그를 명시적으로 추가하여 홈 화면 추가 시 Standalone 모드로 실행되도록 보장.

### 🚨 트러블슈팅 (Troubleshooting)

#### iOS Splash Screen White Screen Issue

- **문제**: 정해진 규격의 스플래시 이미지를 모두 생성했음에도 불구하고, iOS 기기에서 앱 실행 시 스플래시 스크린 대신 흰 화면이 잠시 뜨는 현상.
- **원인**: Next.js의 Metadata API가 생성하는 태그 구성 방식이 iOS의 PWA 인식 메커니즘과 충돌하거나 시점이 늦는 것으로 파악됨.
- **해결**: Metadata abstraction을 우회하고 원시 HTML `<link>` 태그를 `<head>` 최상단부에 직접 배치하여 해결.

## 2026-01-13: Service Essentials Update (PWA Splash & Theme Color)

### ✅ 진행 사항

- **Dynamic Theme Color**: `viewport` 설정에서 `themeColor`를 배열로 확장하여, 시스템 테마(Light/Dark)에 따라 브라우저 상단 바 색상이 `#ffffff` 또는 `#0a0a0a`로 자동 전환되도록 개선.
- **Splash Screen Data Generation**: `pwa-asset-generator`를 통해 30여 종의 iOS 해상도별 스플래시 이미지 생성 및 에셋 확보.
- **Manifest Connection**: `layout.tsx` 메타데이터에 `manifest: "/manifest.ts"`를 명시적으로 연결.

### 💬 주요 Q&A 및 의사결정

**Q. Theme Color를 왜 동적으로 바꿨나?**

- **A.** 단일 색상(`#ffffff`)으로 고정할 경우, 다크 모드 사용자에게 눈부심을 유발하고 앱의 통합성을 해침. 미디어 쿼리(`prefers-color-scheme`)를 지원하는 Next.js `viewport` 설정을 통해 사용자 시스템 설정에 맞는 UI 경험을 제공함.

## 2026-01-13: Dynamic OG Image Design & Metadata Polish

### ✅ 진행 사항

- **Dynamic OG Image Redesign (Expression Detail)**:

  - **Visual Upgrade**: 메인 OG 이미지의 디자인 언어(White BG, Gradient Text, Logo Header)를 상세 페이지(`app/expressions/[id]/opengraph-image.tsx`)에도 적용.
  - **Runtime Switch**: 고화질 로고(`logo.png`) 및 폰트 파일(`inter-*.ttf`) 직접 로딩을 위해 `edge`에서 `nodejs` 런타임으로 변경.
  - **Typography**: `Inter` 폰트(Bold 700, Black 900, Medium 500)를 사용하여 가독성 및 브랜드 일관성 강화.

- **i18n Metadata Optimization**:
  - **Expression Description Refinement**: 9개 국어 로케일 파일에서 `meaning`을 `expression`보다 먼저 노출하도록 포맷 수정.
  - **Reason**: 검색 결과 및 소셜 공유 시 핵심 정보인 '뜻'을 강조하여 클릭률(CTR) 유도.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Edge Runtime을 포기하고 Node.js로 전환했나?**

- **A.** `edge` 런타임은 파일 시스템(`fs`) 접근이 제한적이라 로컬에 저장된 고화질 로고와 폰트 파일을 효율적으로 읽어올 수 없었음. 디자인 완성도를 높이기 위해 Node.js 환경의 파일 시스템 API를 활용하기로 결정함.

## 2026-01-13: Dialogue Generation Rules Refinement (Gender & Names)

### ✅ 진행 사항

- **Dialogue Role & Name Standardization**:
  - **Gender Roles**: Role A(여성), Role B(남성)으로 성별을 고정하여 대화의 일관성 확보.
  - **Name Convention**: 미국식 이름(Sarah, Mike 등) 사용을 기본 원칙으로 하되, "이름을 사용할 경우(If using names)"에만 적용되도록 유연화.
  - **Anti-Pattern Prevention**: 한국어 이름(민지, 철수 등) 사용을 명시적으로 금지하여 영어 학습 콘텐츠로서의 몰입도 저해 방지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 이름을 강제하지 않고 "사용할 경우"로 바꿨나?**

- **A.** 모든 대화에 이름을 부르는 것은 부자연스러울 수 있음. "Hey, Mike" 처럼 자연스러운 문맥에서만 이름을 사용하도록 하여 대화의 자연스러움을 높임.

## 2026-01-13: Validation Logic Synchronization & Data Fix (Strict Parity)

### ✅ 진행 사항

- **검증 로직 완전 동기화 (Strict Parity)**:
  - `verification/verify_db_data.js`를 최신 n8n 로직(`10_validate_content.js`)과 100% 동일하게 업데이트.
  - 대화 턴수(2~4), 퀴즈 선택지 언어 일관성, 문장 부호 검사 등의 엄격한 규칙이 로컬 스크립트에도 적용됨.

## 2026-01-13: n8n Workflow V2 Optimization (Single-Shot Generation)

### ✅ 진행 사항

- **Single-Shot AI 전환 (V2 Architecture)**:
  - 기존의 2-Step (표현 생성 -> 콘텐츠 생성) 방식을 **단일 Gemini 호출**로 통합하여 API 호출 횟수를 50% 절감하고 속도를 2배 향상시킴.
  - 관련 프롬프트 및 파싱 로직을 `n8n/expressions/code_v2/` 폴더에 분리하여 관리 (`04_gemini_master_generator_prompt.txt`, `05_parse_master_json.js`).
- **Fail-Fast 검증 로직 적용**:
  - 데이터 검증 단계(`Validate Content`)를 DB 중복 확인 및 ID 생성 이전으로 앞당겨, 잘못된 데이터가 후속 로직(DB 조회, TTS 등)에 영향을 주지 않도록 개선.
  - `06_validate_content.js`에서 불필요한 변수(`id`) 제거 및 로직 최적화.
- **문서 동기화 (Sync)**:
  - `docs/n8n/expressions/optimization_steps_v2.md`를 신규 작성하여, 워크플로우의 실제 노드 순서와 문서의 단계(1~15)를 1:1로 완벽하게 일치시킴.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 한 번에 생성(Single-Shot)하는 방식으로 바꿨나?**

- **A.**
  1. **속도 및 비용**: 두 번의 LLM 호출과 그 사이의 네트워크 오버헤드를 줄여 전체 처리 속도를 높임.
  2. **문맥 일관성**: 표현을 선정하는 AI와 예문을 만드는 AI가 동일한 컨텍스트(프롬프트) 내에서 동작하므로, 선정된 표현의 뉘앙스가 예문과 설명에 더 정확하게 반영됨.

**Q. 검증 로직을 왜 앞단으로 옮겼나?**

- **A.** 기존에는 DB 중복 체크 후에 검증을 수행했으나, 형식이 잘못된 데이터(예: JSON 파싱 실패)를 가지고 DB를 조회하는 것 자체가 비효율적임. 데이터 무결성을 먼저 확보한 후 비즈니스 로직(중복 체크, 저장)을 수행하는 것이 안정적임.

## 2026-01-12: Dialogue Turn Length Validation & Logic Refinement

### ✅ 진행 사항

- **대화 턴수 검증 로치 강화 (Dialogue Length Validation)**:
  - n8n Code Node 전용 `10_validate_content.js`에 대화 턴수 검증 규칙(2~4턴)을 추가하여 데이터 품질 균일화.
  - 관련 내용을 `docs/n8n/expressions/optimization_steps.md`에 반영하여 문서 현행화.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 대화 턴수를 2~4턴으로 제한했나?**

- **A.** Gemini 프롬프트에서는 2~3턴을 권장하고 있으나, 상황에 따라 A-B-A-B 구조가 자연스러울 때가 있음. 너무 짧으면 맥락 파악이 어렵고, 너무 길면 학습 피로도가 높으므로 2~4턴을 표준 범위로 설정함.

## 2026-01-12: V2 워크플로우 아키텍처 (개발 중)

### ✅ 진행 사항

- **V2 파일 격리 (Isolation)**:
  - V2 개발의 안정성을 위해 관련 모든 파일(`js`, `txt`, `json`)을 `n8n/expressions/v2/` 디렉토리로 이동하여 V1과의 의존성을 완전히 분리함.
- **Fan-out 아키텍처 도입**:
  - 다중 카테고리를 동시에 처리하기 위한 병렬 실행 구조를 설계하고 `01_pick_category_v2.js`에 구현함.
- **Rate Limiting (Groq TTS)**:
  - `15_groq_tts_v2.js`에 배치 처리(Batch Size: 10)와 대기 로직(Wait: 65s)을 구현하여 Groq API Rate Limit을 준수하도록 설계.
  - **Note**: 해당 로직에 대한 라이브 환경 검증(Verification)이 필수적으로 요구됨.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 V2 파일을 별도 폴더로 분리했나?**

- **A.** V2는 구조적 변경(Fan-out)이 커서 기존 워크플로우를 깨뜨릴 위험이 있음. 개발 중인 V2 파일들이 실수로 V1에 참조되지 않도록 물리적으로 격리함.

**Q. V2는 언제 배포 가능한가?**

- **A.** 현재 아키텍처 설계와 코딩은 완료되었으나, 실제 데이터 파이프라인에서의 전체 검증(특히 TTS 배치 처리의 안정성)이 완료될 때까지는 V1을 프로덕션으로 유지함.

## 2026-01-12: Verification Logic Refinement & Local Script Setup

### ✅ 진행 사항

- **엄격한 데이터 검증 로직 도입 (Strict Data Verification)**:
  - 기존의 `verify_gemini_response.js` 로직을 n8n Code Node용 `10_validate_content.js`로 이식 및 최적화.
  - **English Inclusion Rule**: 번역된 텍스트에 영어가 섞여 있는지 확인하는 로직을 강화(소문자 단어 검출, 고유명사 허용 등).
  - **Local Verification Script**: 로컬 환경에서도 `temp.json`을 검증할 수 있도록 `verification/verify_db_data.js` 스크립트 구축.
- **Bug Fix (Supabase Insert Error)**:
  - `_validation` 필드가 Supabase 테이블 스키마에 존재하지 않아 발생하던 `PGRST204` 에러 해결.
  - `15_aggregate_tts_results.js`에서 DB 저장 직전 `_validation` 필드를 명시적으로 삭제하도록 로직 수정.
- **문서 현행화**: `docs/n8n/expressions/optimization_steps.md`에 변경된 검증 및 정리 로직 반영.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 로컬 검증 스크립트(`verification/verify_db_data.js`)를 만들었나?**

- **A.** n8n 워크플로우를 매번 실행하지 않고도, 로컬에 저장된 데이터(`temp.json`)를 대상으로 검증 로직을 빠르게 테스트하고 수정하기 위함임. n8n의 코드와 로직을 100% 동일하게 유지하여 신뢰성을 확보함.

## 2026-01-11: Prompt Refinement (No Mixed Language)

### ✅ 진행 사항

- **프롬프트 강화 (혼합 언어 방지)**:
  - 대화 번역 프롬프트에 "Target Language ONLY" 및 "No Mixed Language" 제약 조건을 엄격하게 적용하여, 번역 결과에 영어(English)가 유출되는 현상을 방지함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 혼합 언어 방지 프롬프트를 추가했나?**

- **A.** LLM이 간헐적으로 번역 결과에 원문(영어)을 포함하거나, 타겟 언어 외의 다른 언어를 섞어 출력하는 경우가 발생함. 이는 번역 품질을 저해하고 후처리 과정을 복잡하게 만들 수 있어, 프롬프트 레벨에서 명확한 제약을 두어 모델의 일관된 출력을 유도함.

## 2026-01-11: n8n Batch Backfill & Prompt Optimization (Dialogue Translations)

### ✅ 진행 사항

- **Backfill Workflow 최적화 (Batch Processing)**:
  - 기존의 단건 처리 방식에서 벗어나, `Batch Size: 20`으로 묶어 처리하는 `batch_dialogue_translation_prompt.txt` 및 파싱 로직(`batch_dialogue_translation_parse_code.js`) 구현.
  - 이를 통해 대량의 데이터를 효율적으로 처리하고 API 호출 횟수를 획기적으로 절감함.
- **Prompt Strengthening (Critical Logic)**:
  - `08_gemini_content_generator_prompt.txt` 및 `optimization_steps.md`에 `**CRITICAL**` 경고 문구를 추가하여, 8개 언어(`ko, ja, es, fr, de, ru, zh, ar`) 번역이 절대 누락되지 않도록 제약 강화.
- **Legacy Code Removal**:
  - `optimization_steps.md`, `prepare_tts_requests.js`, `aggregate_tts_results.js`에서 구버전 데이터 경로(`data.content.ko.dialogue`)를 참조하던 레거시 코드를 최신 스키마(`data.dialogue`)로 일괄 업데이트.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Batch Processing을 도입했나?**

- **A.** 112개의 기존 데이터를 하나씩 처리하면 112번의 LLM 호출과 오버헤드가 발생함. 20개씩 묶어서 처리함으로써 호출 횟수를 약 1/20로 줄이고 처리 속도를 대폭 향상시킴.

**Q. 프롬프트에 `CRITICAL`을 추가한 이유는?**

- **A.** LLM이 간헐적으로 일부 언어(특히 아랍어 등)를 누락하는 현상이 발견됨. 이를 "절대 생략 불가" 영역으로 명시하여 모델이 모든 언어를 강제로 출력하도록 유도함.

## 2026-01-11: 하드코딩된 언어 문자열 제거 및 상수화 (Hardcoded String Refactoring)

### ✅ 진행 사항

- **하드코딩 제거 (Removal of Hardcoded Strings)**:
  - codebase 전반(components, i18n utilities, pages)에 걸쳐 `'en'`, `'ko'` 등으로 산재해 있던 하드코딩된 언어 문자열을 `SupportedLanguage` 상수로 대체.
  - 이를 통해 로케일 코드 변경 시 중앙(`i18n/index.ts`)에서 일괄 제어가 가능하도록 구조 개선.
- **컴포넌트 로직 정교화**:
  - `ExpressionCard`, `DialogueSection` 등에서 특정 언어에 의존적이던 로직을 제거하고 `SupportedLanguage.EN`을 명시적 Fallback으로 사용하도록 통일.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 하드코딩된 문자열을 상수로 바꿨나?**

- **A.** 9개 국어로 확장됨에 따라 `'en'`, `'ko'` 같은 문자열이 오타로 인해 버그를 유발할 가능성이 높아짐. `SupportedLanguage` enum/object를 사용하면 IDE의 자동 완성을 지원받을 수 있고, 휴먼 에러를 원천 차단할 수 있음.

## 2026-01-11: 5개국어 추가 및 i18n 타입 안정성 강화 (v0.9.5)

### ✅ 진행 사항

- **5개 신규 언어 지원 (Language Expansion)**:
  - 프랑스어(FR), 독일어(DE), 러시아어(RU), 중국어(ZH), 아랍어(AR) 로케일 추가.
  - 기존 4개국어(EN, KO, JA, ES) 포함 총 9개 국어 지원 체계 완성.
- **Strict i18n Type Safety (타입 안정성 강화)**:
  - `i18n/index.ts`에서 `en` 딕셔너리를 기준으로 `Dictionary` 타입을 추론.
  - 모든 언어 파일(`ko`, `fr` 등)이 `en`과 동일한 키 구조를 가지도록 강제.
  - 키 누락 시 빌드 타임에 에러가 발생하여 런타임 `undefined` 참조 방지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `en`을 기준으로 타입을 추론하나?**

- **A.** 별도의 `interface`를 유지보수하는 것보다, 실제 가장 최신 상태인 영어 파일(`en.ts`)을 Source of Truth로 삼는 것이 관리 비용이 적고 직관적임.

**Q. 신규 언어의 번역 퀄리티는?**

- **A.** UI 표준 용어(Standard UI Terms)를 기준으로 생성하였으며, 추후 서비스 고도화 시 원어민 감수를 통해 톤 앤 매너를 다듬을 예정임.

## 2026-01-11: Universal Backfill System 구축 (Multi-Language Expansion)

### ✅ 진행 사항

- **Dual Backfill Strategy (이원화 전략) 구현**:
  - `universal_backfill_workflow.json`에 두 가지 병합 전략을 적용할 수 있도록 로직 분리.
  - **Universal Mode**: 영문(`en`)을 포함한 6개 국어(`fr`, `de`, `ru`, `zh`, `ar`) 동시 생성 및 덮어쓰기.
  - **Supplementary Mode**: 기존 영문 데이터는 유지하고 신규 5개 국어만 안전하게 병합.
- **코드 모듈화**: 병합 로직을 `universal_backfill_parse_code.js`와 `supplementary_backfill_parse_code.js`로 분리하여 유지보수성 향상.
- **프롬프트 표준화**: 모든 프롬프트의 언어 지원 범위를 9개 국어(EN, KO, JA, ES, FR, DE, RU, ZH, AR)로 통일하고 검증 규칙 강화.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Universal과 Supplementary 전략을 나눴나?**

- **A.** 데이터의 상태에 따라 필요한 작업이 다르기 때문임.
  1. **Universal**: 영문 콘텐츠 자체도 리뉴얼이 필요하거나, 초기 데이터가 부실할 때 전체를 새로 덮어써야 함.
  2. **Supplementary**: 이미 검증된 영문 콘텐츠가 있고, 단지 새로운 언어만 "끼워 넣고" 싶을 때 기존 데이터를 보호해야 함.

**Q. 병합 로직을 별도 JS 파일로 분리한 이유는?**

- **A.** n8n 노드 내에서 코드를 수정하는 실수를 방지하고, 운영자가 상황에 맞게 파일 내용을 복사-붙여넣기 하는 것만으로 전략을 전환할 수 있도록 하여 운영 안정성을 높임.

## 2026-01-11: 데이터베이스 스키마 리팩토링 (Database Schema Refactoring)

### ✅ 진행 사항

- **Dialogue 데이터 정규화**:
  - `expressions` 테이블에 `dialogue` JSONB 컬럼을 추가하고 GIN 인덱스를 적용하여 쿼리 성능을 최적화함.
  - 기존 `content` 컬럼 내부에 중첩되어 있던 대화문 데이터를 최상위 `dialogue` 컬럼으로 마이그레이션(`011_migrate_dialogue_data.sql`)하여 데이터 구조를 단순화함.
- **문서 동기화**: `docs/database/schema.md`에 변경된 스키마(Dialogue 컬럼 및 인덱스) 반영 완료.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Dialogue 데이터를 별도 컬럼으로 분리했나?**

- **A.**
  1. **데이터 중복 제거**: 기존에는 `content` JSON 내부의 각 언어(`ko`, `ja`, `es`)마다 영어 대화문(`en`)과 오디오 경로(`audio_url`)가 반복해서 저장되는 비효율이 있었음. 이를 최상위 `dialogue` 컬럼으로 빼내어 영어 원문과 오디오는 한 번만 저장하고, 각 언어는 번역본만 관리하도록 리팩토링함.
  2. **확장성**: `en` 필드가 공식적으로 추가됨에 따라, 영어 자체도 하나의 '언어'로서 동등하게 관리하고 TTS 생성 및 멀티턴 학습 등 독립적인 기능 확장의 기반을 마련함.
  3. **성능**: `content`라는 거대한 JSON 안에 숨겨두기보다 최상위 컬럼으로 꺼내어 인덱싱(GIN)과 쿼리 효율을 높임.

## 2026-01-10: n8n 콘텐츠 품질 고도화 (Content Quality Refinement)

### ✅ 진행 사항

- **Gemini 프롬프트 개선**:
  - **영어(en) 지원 추가**: JSON 스키마 및 예시에 영어 필드를 추가하여 4개 국어(EN, KO, JA, ES) 지원 완성.
  - **톤 매너 정교화**:
    - 영어 설명 톤을 "Standard English (Friendly, conversational, yet educational)"로 정의.
    - 문자 메시지체(Text-speak)나 과도한 슬랭 사용을 금지하여 교육 콘텐츠로서의 품질 확보.
  - **퀴즈 편향 해결**: 정답이 특정 번호(B)로 쏠리는 현상을 방지하기 위해 "정답 위치 랜덤화(Randomize answer position)" 규칙을 명시적으로 추가.
- **문서 동기화**: `n8n/expressions/expressions_workflow_template.json`, `docs/n8n/expressions/optimization_steps.md` 및 `n8n/expressions/code/08_gemini_content_generator_prompt.txt`에 변경된 프롬프트 내용을 동기화하여 코드-문서-템플릿 간의 정합성 유지.

## 2026-01-10: 서비스 필수 요소 완성 (Service Essentials: PWA, SEO, i18n)

### ✅ 진행 사항

- **PWA (Progressive Web App) 완성**:
  - **Manifest & Icons**: `manifest.ts`를 통해 안드로이드/데스크탑용 아이콘과 테마 색상을 설정함.
  - **iOS 스플래시 스크린**: `pwa-asset-generator`를 사용하여 iOS 기기 해상도별 스플래시 이미지 30여 장을 생성(`public/assets/splash`)하고 `layout.tsx`에 `startupImage` 및 `appleWebApp` 메타데이터를 연결함.
    - **디자인 최적화**: 세로 모드(Portrait)는 30% 여백, 가로 모드(Landscape)는 20% 여백을 적용하여 로고 시인성을 확보함.
  - **개발 환경 최적화**: `next-pwa` 플러그인의 Webpack 의존성 호환을 위해 `next dev --webpack` 및 `next build --webpack`으로 스크립트 강제 설정.
- **SEO (Search Engine Optimization) 고도화**:
  - **동적 메타데이터**: `generateMetadata` 함수를 통해 각 페이지별 타이틀, 설명, 키워드를 i18n 딕셔너리에 맞춰 동적으로 생성.
  - **Open Graph**: `opengraph-image.tsx`를 구현하여 상세 페이지의 표현(Expression) 텍스트가 포함된 동적 썸네일을 생성 및 제공.
  - **JSON-LD**: 구글 리치 스니펫(Rich Snippet)을 위한 구조화된 데이터(LearningResource, Organization) 추가.
  - **Sitemap & Robots**: `sitemap.ts`와 `robots.ts`를 구현하여 검색 엔진 크롤링 경로 최적화.
- **Internationalization (i18n) 리팩토링**:
  - **상수화**: `SupportedLanguage` 상수를 도입하여 언어 코드(`en`, `ko`, `ja`, `es`) 및 포맷(`locale`, `lang`, `og_locale`)을 중앙에서 일관되게 관리.
  - **Type Safety**: 미들웨어 및 서버 로직에서 문자열 하드코딩을 제거하고 상수 기반으로 리팩토링하여 안정성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Turbopack 대신 Webpack을 강제했나?**

- **A.** `next-pwa` 플러그인이 아직 Webpack 플러그인 시스템에 의존하고 있어 Turbopack 환경에서는 서비스 워커 생성이 불가능함. 기능 안정성을 위해 개발 및 빌드 환경 모두 Webpack으로 통일함. (프로덕션 성능에는 영향 없음)

**Q. iOS 스플래시 스크린을 왜 이미지로 각각 생성했나?**

- **A.** 안드로이드는 아이콘 하나로 OS가 자동 생성해주지만, iOS(Web Web App) 스펙상 아직 자동 생성을 지원하지 않음. 사용자가 앱을 켤 때 흰 화면(White screen)을 보지 않게 하려면 각 기기 해상도에 딱 맞는 이미지를 `link rel="apple-touch-startup-image"`로 일일이 지정해줘야 함.

**Q. 가로 모드에서 스플래시 여백을 줄인 이유는?**

- **A.** 가로 모드는 세로 높이가 낮아, 30% 여백 적용 시 로고가 너무 작아지거나 잘려 보일 수 있음. 가로 모드만 20%로 여백을 줄여 시각적 균형을 맞춤.

## 2026-01-09: 프로젝트 고도화 및 품질 개선 (Code Refactoring & Optimization)

### ✅ 진행 사항

- **커스텀 훅 추출 및 리팩토링**: `ExpressionList.tsx`의 비대한 로직을 기능별로 분리하여 코드 가독성과 유지보수성을 극대화함.
  - **`usePaginatedList`**: 페이지네이션 상태 관리, 더 보기 페칭 및 캐시 동기화 로직 담당.
  - **`useScrollRestoration`**: 정밀한 스크롤 위치 추적(200ms 디바운스) 및 재귀적 RAF 기반의 복원 로직 담당.
- **성능 최적화**: 브라우저 렌더링 프레임에 최적화된 스크롤 복원 시스템 구축 및 자원 효율 극대화.

## 2026-01-09: 스크롤 복원 동작 수정 (Scroll Restoration Fix)

### ✅ 진행 사항

- **스크롤 초기화 로직 추가**: `ExpressionList` 컴포넌트에서 새로운 필터(태그, 검색어 등)로 진입하여 저장된 스크롤 위치가 없을 경우(`targetPosition <= 0`), 명시적으로 `window.scrollTo(0, 0)`을 실행하도록 수정.
- **상세 페이지 스크롤 리셋 전략 (Session Storage)**: 상세 페이지(`[id]`) 진입 시, 새로운 페이지 이동(Push)과 뒤로가기(Back)를 구분하기 위해 `sessionStorage` 플래그(`SCROLL_RESET_KEY`)를 도입.
  - `ExpressionCard` 클릭 시 플래그를 심고, `template.tsx`에서 이를 확인하여 스켈레톤 로딩 전 최상단 스크롤을 보장함.
  - 뒤로가기 시에는 플래그가 없으므로 브라우저의 전역 `history.scrollRestoration = "auto"` 설정을 통해 자연스러운 위치 복원을 지원함.
- **원인 및 해결**: 브라우저의 자동 스크롤 복원(`scrollRestoration`)을 수동(`manual`)으로 설정해 두었기 때문에, 새로운 페이지 진입 시 스크롤이 자동으로 위로 가지 않는 현상을 해결함.

## 2026-01-09: 버그 수정 (Bug Fixes)

### ✅ 진행 사항

- **Audio URL Handling & DB Normalization**:
  - **DB Normalization**: Supabase DB의 `audio_url`을 기존 절대 경로(`https://...`)에서 스토리지 내부 상대 경로(`expressions/...`)로 일괄 정규화(SQL 사용). 이를 통해 도메인 변경이나 프로젝트 이전에 유연하게 대응 가능하도록 구조 개선.
  - **아키텍처 최적화**: URL 완성 로직을 Server Component(`page.tsx`)가 아닌 Client Component(`DialogueAudioButton.tsx`) 내부로 이동(Encapsulation). 서버는 가공되지 않은 원시 데이터를 전달하고, 클라이언트는 재생 직전에만 전체 URL로 변환하여 페이로드 크기 최적화 및 유지보수성 향상.
  - **에러 핸들링 강화**: `DialogueAudioButton`의 오디오 재생 에러 로그를 상세화하여 `error.code`, `error.message`, `src` 정보를 포함하도록 개선. 브라우저의 불투명한 미디어 에러 디버깅을 용이하게 함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 DB에 상대 경로로 저장하고 클라이언트에서 변환하나?**

- **A.**
  1. **유지보수**: Supabase 프로젝트 ID나 도메인이 바뀌어도 환경 변수 하나만 수정하면 되기 때문.
  2. **캡슐화**: "오디오 주소를 어떻게 구성하는가"에 대한 지식을 재생 컴포넌트 내부에 숨겨, 데이터 소유자(서버)는 인프라 정보에 신경 쓰지 않아도 됨.
  3. **최적화**: 서버에서 클라이언트로 넘어가는 JSON 데이터의 크기를 줄일 수 있음.

**Q. 상세한 에러 로그를 남겨두는 이유는?**

- **A.** 오디오 재생 에러는 네트워크, 코덱, 브라우저 정책 등 원인이 다양함. 단순 로그만으로는 원인 파악이 어렵기 때문에 구체적인 `MediaError` 코드를 남기는 것이 장기적인 유지보수에 훨씬 유리함.

## 2026-01-09: UI 비주얼 보정 및 리팩토링 (UI Visual Polish & Refactoring)

### ✅ 진행 사항

- **Dark Mode Visibility**: `DialogueItem`에서 Blue 테마(`variant="blue"`)가 블러 처리될 때, 텍스트가 회색(`text-disabled`)으로 변하여 어색한 문제 해결. `text-blue-200/70`을 적용하여 파란 배경 위에서도 자연스럽게 블러되도록 개선.
- **Code Refactoring**: 반복되는 비활성화 텍스트 스타일(`text-zinc-300 dark:text-zinc-600`)을 `@utility text-disabled`로 추상화하고 `DialogueSection` 및 `DialogueItem`에 적용.

## 2026-01-09: 학습 모드 상호작용 고도화 (Learning Mode Interaction Refinement)

### ✅ 진행 사항

- **Smart Toggle Interaction**: 'Blind Listening' 모드와 'Translation Blur' 모드 간의 상호작용 개선.
  - 기존: 'Blind Listening' 모드 중에는 'Translation Blur' 버튼 비활성화.
  - 개선: 'Translation Blur' 버튼 클릭 시 'Blind Listening' 모드가 자동으로 꺼지며 해석이 노출됨.
  - **Individual English Reveal (Partial Blind)**: 리스닝 모드에서 문장별 확인 기능 추가.
  - 리스닝 모드가 켜져 있어도, 사용자 클릭 시 해당 영어 문장만 블러가 해제됨.
  - **Auto-Exposed**: 모든 영어 문장을 하나씩 열어보다가 전체가 다 열리면, 자동으로 'Blind Mode'가 해제되고 'Exposed Mode'로 전환됨. 동시에 'Translation Blur' 버튼도 원래의 활성화 상태(눈 뜬 아이콘)로 자동 복귀.
  - **State Preservation**: 블라인드 모드 진입 전의 '해석 보기' 상태를 기억했다가, 모드 해제 시 그대로 복원하여 학습 흐름 유지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 리스닝 모드에서 개별 문장 확인 기능을 넣었나?**

- **A.** 기존에는 문장이 안 들릴 때 무조건 전체 리스닝 모드를 꺼야 했음. 학습자가 "이 문장만 확인하고 싶다"는 니즈를 충족시키고, 학습의 흐름이 끊기지 않도록 하기 위해 개별 문장 클릭 기능을 추가함.

**Q. 개별 문장 클릭 시 영어만 보여주고 해석은 여전히 가리는 이유는?**

- **A.** 'Partial Blind'의 목적은 "안 들리는 단어/문장 확인"에 있음. 해석까지 바로 보여주면 학습자가 소리가 아닌 의미에 의존하게 되어 리스닝 훈련 효과가 감소함. 따라서 영어 텍스트만 먼저 확인하고, 해석은 필요시 별도로 확인하거나 모드를 해제해서 보도록 단계적으로 설계함.

**Q. 개별 문장 확인 대신 모드 해제로 변경한 이유는?**

- **A.** 초기 기획에서는 개별 확인 기능을 넣지 않으려 했으나, 사용자가 "잠깐 확인하고 싶은데 모드를 껐다 켜기 귀찮다"는 피드백을 수용함. 단, "문장을 클릭한다"는 행위가 누적되어 전체를 다 보게 되면 사실상 모드를 끈 것과 다름없으므로, 이때는 자동으로 모드를 해제(Auto-Exposed)하여 사용자 의도에 맞게 상태를 동기화함.

**Q. 호버 효과를 뺀 이유는?**

- **A.** 블라인드 모드는 텍스트를 가리는 것이 목적임. 마우스를 올릴 때마다 배경이 변하는 등의 효과는 시각적 노이즈가 될 수 있어, '클릭 가능함'을 알리는 커서 변경(`cursor-pointer`)만 남기고 나머지는 제거함.

**Q. 'Partial Blind' 상태(아이콘은 꺼졌지만 일부만 보임)를 둔 이유는?**

- **A.** "문장 클릭 -> 전체 해제"는 너무 급격한 변화임. 사용자가 클릭한 문장만 확인하고 싶을 때, 모드 아이콘이 꺼지는 시각적 피드백은 주되, 다른 문장은 계속 가려두어 학습 흐름을 유지함.

**Q. '눈 아이콘'이 떠 있는데 왜 비활성화 색상인가?**

- **A.** 사용자의 "해석 보기 설정"은 켜져 있지만, "Blind Mode"가 이를 덮어쓰고(Override) 있음을 나타냄. Blind Mode가 꺼지면 즉시 원래 설정(해석 보임)으로 복귀함을 암시하는 UI 패턴임.

**Q. 왜 모든 영어 문장이 열리면 자동으로 모드를 끄나?**

- **A.** 사용자가 모든 문장을 클릭해서 열었다는 건 더 이상 "Blind Listening" 상태가 아님을 의미함. 사용자가 굳이 아이콘을 눌러 모드를 끌 필요 없이, 자연스럽게 다음 단계(해석 확인 등)로 넘어갈 수 있도록 자동화함.

## 2026-01-08: 학습 모드 (Learning Mode) 기초 구현 및 오디오 안정성 강화

### ✅ 진행 사항

- **학습 모드 기반 구축**:
  - **Blind Listening Mode**: 대화문의 영어 텍스트를 숨기고(Blur) 소리에 집중하는 모드 구현. (Default: ON)
  - **Translation Blur**: 기본적으로 해석을 숨기고, 사용자가 클릭할 때만 해당 문장의 해석을 보여주는 기능 구현. (Default: Blur)
- **LearningToggle 컴포넌트**: '리스닝 모드'와 '해석 블러'를 제어하는 공통 버튼 컴포넌트를 추출하여 UI 일관성 확보.
- **상호작용 최적화**: 'Blind Listening' 모드 활성화 시 'Translation Blur' 버튼을 비활성화하여 논리적 충돌 방지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 리스닝 모드에서 해석 블러 버튼을 비활성화했나?**

- **A.** 리스닝 모드는 소리에만 집중하는 단계이므로, 해석을 하나씩 열어보는 인터랙션까지 허용하면 학습 단계의 구분이 모호해짐. 우선은 영어 텍스트를 먼저 익히고, 나중에 리스닝 모드를 끄고 해석을 확인하는 흐름을 권장하기 위함임 (추후 피드백에 따라 상호작용 고도화 예정).

## 2026-01-08: 대화 전체 듣기(Play All) 로딩 동기화 및 안정화

### ✅ 진행 사항

- **로딩 동기화(Loading Sync)**: '전체 듣기' 버튼이 모든 개별 오디오 파일이 준비(`onReady`)될 때까지 로딩 상태를 유지하도록 개선하여, 재생 도중 끊기는 현상 방지.
- **깜빡임(Flickering) 해결**: `DialogueAudioButton`에서 `onReady` 콜백이 변경될 때마다 오디오가 재로딩되는 문제를 `useRef`로 의존성을 제거하여 해결.
- **i18n 적용**: 'Loading...' 텍스트를 `dict.common.loading`으로 교체하여 다국어 지원.
- **UI 폴리싱**: 로딩 중 커서 스타일(`not-allowed`)을 통일하여 사용자 경험 일관성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `useEffect` 의존성에서 `onReady`를 뺐나?**

- **A.** `useEffect`에 `onReady`가 포함되어 있으면, 부모가 리렌더링되어 새로운 `onReady` 함수를 내려줄 때마다 자식의 오디오 로딩 로직이 다시 실행되는 무한 루프 또는 깜빡임이 발생함. `useRef`를 사용하여 최신 함수를 참조하되, 이펙트의 트리거가 되지 않도록 함.

## 2026-01-08: 대화 전체 듣기(Play All) 기능 구현

### ✅ 진행 사항

- **순차 재생 시스템**: `DialogueSection` 컴포넌트를 통해 대화문을 처음부터 끝까지 자동으로 이어서 들려주는 '전체 듣기' 기능 도입.
- **스마트 인터럽트**: 자동 재생 중 개별 재생 시도 시 자동 모드를 해제하여 사용자 경험 충돌 방지.
- **시각적 동기화**: 현재 재생 중인 대화 버블에 하이라이트(`ring`) 처리를 하여 청각과 시각 정보를 일치시킴.
- **다국어 처리**: 재생/정지 버튼 텍스트를 i18n 딕셔너리로 처리.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `DialogueSection`을 별도로 만들었나?**

- **A.** 기존에는 `page.tsx`에서 대화 리스트를 맵핑했지만, '전체 듣기'와 같은 상태(`isAutoPlaying`, `playingIndex`)를 관리하려면 클라이언트 컴포넌트로 분리하는 것이 필수적이었음. 또한 코드 가독성과 재사용성을 높이기 위함.

## 2026-01-08: 오디오 재생 권한 제어 기반 마련 (Audio Feature Gating Infrastructure)

### ✅ 진행 사항

- **Feature Gating 기반 구현**: `DialogueAudioButton` 컴포넌트에 `onPlayAttempt` 콜백 프로퍼티 추가. 이를 통해 재생 전 사용자 티어(Free/Pro)나 권한을 체크할 수 있는 확장 가능한 구조 확보.
- **기술 부채 해결**: `future_todos.md`에 기록되었던 'Scalable Architecture' 항목을 구현하여 향후 수익화 모델(Freemium) 도입을 위한 기술적 준비 완료.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `DialogueAudioButton` 내부에 직접 권한 체크 로직을 넣지 않았나?**

- **A.** 컴포넌트는 UI와 재생 로직에만 집중하고, 권한 체크 로직은 외부(Container 또는 Context)에서 주입받도록 함으로써 컴포넌트의 재사용성을 높이고 비즈니스 로직과의 결합도를 낮추기 위함임.

## 2026-01-08: 원어민 대화 듣기 기능 구현 및 구조 개선 (Native Audio Playback & Structural Refactoring)

### ✅ 진행 사항

- **오디오 재생 기능 구현**: `DialogueAudioButton` 컴포넌트를 신설하여 대화 버블 내에서 원어민 음성을 즉시 재생할 수 있는 기능 추가.
- **오디오 동기화 로직 적용**: 한 번에 하나의 음성만 재생되도록 커스텀 이벤트를 활용한 전역 중지 메커니즘 구현.
- **상수 관리 구조 개편**: `lib/constants` 폴더를 루트의 `constants/`로 이동하여 접근성 및 명확성 향상.
- **이벤트 네이밍 표준화**: 브라우저 표준 관례를 따라 이벤트 값은 소문자 `snake_case`로, 변수명은 대문자 `UPPER_SNAKE_CASE`로 관리하도록 규칙 정립 및 `docs/project_context.md` 반영.
- **Lint 경고 해결**: n8n JavaScript 코드 내 사용하지 않는 변수 정리 등 전반적인 코드 품질 개선.

### 💬 주요 Q&A 및 의사결정

**Q. 오디오 재생 동기화는 어떻게 구현했나?**

- **A.** 각 오디오 버튼이 재생을 시작할 때 `AUDIO_PLAYBACK_START` 이벤트를 발생시키고, 다른 버튼들은 이 이벤트를 감지하여 자신의 재생을 중지하도록 설계함. 이를 통해 여러 음성이 겹쳐 들리는 현상을 방지함.

**Q. 왜 상수(Constants) 폴더를 루트 레벨로 이동했나?**

- **A.** 프로젝트 전반에서 참조되는 설정값들이 `lib` 하위에 숨겨져 있는 것보다 최상위에서 명시적으로 관리되는 것이 유지보수와 협업 측면에서 더 유리하다고 판단함.

**Q. 이벤트 값에 소문자를 사용하는 이유는?**

- **A.** `click`, `play` 등 브라우저의 기본 DOM 이벤트 네이밍 관례와 일관성을 유지하여 개발자 경험(DX)을 높이기 위함임.

## 2026-01-08: n8n 워크플로우 최적화 및 콘텐츠 품질 고도화 (n8n Workflow Optimization & Quality Improvements)

### ✅ 진행 사항

- **중복 체크 로직 최적화**: `Check Duplicate` 노드에 `Limit: 1` 및 `Always Output Data: On` 설정을 적용하여 성능을 높이고 데이터 부재 시에도 워크플로우가 중단되지 않도록 개선.
- **콘텐츠 생성 규칙 강화**:
  - **대화문 구조 표준화**: 모든 대화문이 2~3턴(A-B 또는 A-B-A)의 간결하고 자연스러운 구성을 갖추도록 프롬프트 수정.
  - **수치 및 통화 표기 통일**: 통화 기호는 항상 `$`(USD)를 사용하고, 1,000 이상의 숫자에는 쉼표(,)를 사용하도록 강제하여 데이터 일관성 확보.
- **운영 안정성 확보**: `Groq Orpheus TTS` 모델 사용 전 약관 동의(Terms of Use)가 필요함을 문서화하고, 미동의 시 발생하는 400 에러 해결 가이드 추가.
- **추후 과제 발굴**: '원어민 대화' 재생 시 볼륨 크기 제어 로직 구현을 `future_todos.md`에 추가.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `Always Output Data` 옵션을 켰나?**

- **A.** Supabase 노드에서 필터링 결과가 없을 경우 기본적으로 에러를 내거나 출력을 하지 않아 다음 노드(`If New`)가 실행되지 않는 문제가 있음. 이 옵션을 켜면 데이터가 없더라도 빈 객체를 반환하므로 워크플로우의 흐름을 안정적으로 제어할 수 있음.

**Q. 대화 턴수를 2~3턴으로 제한한 이유는?**

- **A.** 학습용 콘텐츠로서 너무 긴 대화는 사용자 집중도를 떨어뜨릴 수 있고, TTS 생성 비용 및 시간도 증가함. 핵심 표현을 명확한 맥락에서 보여주기에 가장 효율적인 2~3턴으로 표준화함.

**Q. 왜 달러($) 기호를 강제하나?**

- **A.** 글로벌 영어 학습 서비스로서 통화 단위가 섞여 있으면(원, 엔, 달러 등) 데이터의 통일성이 떨어짐. 가장 보편적인 달러를 기본으로 사용하되, 특정 국가의 문화를 다루는 예외적인 경우에만 다른 통화를 허용함.

## 2026-01-07: n8n 워크플로우 모듈화 및 확장성 강화 (n8n Workflow Modularization & Scalability)

### ✅ 진행 사항

- **문서 구조 재편 (Documentation Reorganization)**:
  - `docs/` 폴더 내의 문서들을 주제별 하위 폴더(`n8n/`, `monetization/`, `git/`, `database/`, `product/`)로 분류하여 관리 효율성 증대.
  - `docs/n8n/` 하위에 `expressions/` 폴더를 신설하여 워크플로우별 문서 격리 및 확장성 확보.
- **코드 노드 개별 파일화**: n8n 워크플로우 내의 복잡한 JavaScript 로직과 AI 프롬프트를 `n8n/expressions/code/` 폴더 내의 개별 파일(`*.js`, `*.txt`)로 분리하여 관리 효율성 증대.
- **워크플로우 구조 정교화**: 템플릿 파일명을 `expressions_workflow_template.json`으로 변경하고 전용 폴더로 이동하여 향후 `vocas` 등 다른 도메인 확장을 위한 구조적 기반 마련.
- **보안성 향상**: 워크플로우 템플릿 내의 특정 Credential ID를 플레이스홀더로 교체하여 공유 및 커밋 시 보안 위험 제거.
- **백업 체계 개선**: 로컬 백업 파일명을 `speak_mango_n8n_expressions_workflow.json`으로 변경하여 명확성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 문서 폴더 구조를 재편했나?**

- **A.** 프로젝트 문서가 많아짐에 따라 `docs/` 루트에 모든 파일이 나열되어 있어 가독성이 떨어짐. `n8n`, `database`, `product` 등 주제별로 폴더를 나누고, 특히 `n8n`은 워크플로우 종류(`expressions`, `vocas` 등)에 따라 하위 폴더를 두어 확장성을 고려함.

**Q. 왜 코드 노드를 별도 파일로 분리했나?**

- **A.** n8n GUI 내에서 직접 코드를 수정하는 것은 버전 관리와 가독성 측면에서 한계가 있음. 로컬 파일로 분리함으로써 에디터의 기능을 활용하고, 문서와 실제 구현 코드 간의 정합성을 더 쉽게 유지하기 위함임.

**Q. 폴더 구조를 `n8n/expressions/`로 세분화한 이유는?**

- **A.** 현재는 '표현(Expressions)' 생성 워크플로우만 존재하지만, 향후 '단어장(Vocas)', '이미지 생성' 등 성격이 다른 자동화 로직이 추가될 때 서로 섞이지 않고 독립적으로 관리하기 위함임.

## 2026-01-07: TTS 파이프라인 통합 및 문서화 (TTS Integration & Documentation)

### ✅ 진행 사항

- **TTS 파이프라인 구축**: n8n 워크플로우에 `Groq Orpheus TTS`를 연동하여 영어 대화문 생성 시 원어민 음성(WAV)을 자동 합성하고 Supabase Storage에 저장하는 로직 구현.
- **Storage 구조 최적화**:
  - 버킷명을 `speak-mango-en`으로 설정하여 프로젝트 단위 통합 저장소로 격상.
  - 하위 폴더 구조를 `expressions/{id}/{index}.wav`로 정규화하여 확장성 확보.
- **문서 현행화**:
  - `docs/n8n/expressions/optimization_steps.md`, `docs/n8n/expressions/user_guide.md`, `docs/n8n/expressions/workflow_guide.md`에 TTS 관련 상세 설정 및 트러블슈팅 가이드 추가.
  - `docs/database/supabase_strategy.md`에 Storage 폴더 격리 전략 및 향후 유료화(Feature Gating) 시 보안 전환 가이드 수립.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Storage 버킷 이름을 `speak-mango-en`으로 설정했나?**

- **A.** `expression-audio`는 오디오 전용이라는 느낌이 강했음. 향후 이미지(`images/`), 사용자 프로필(`users/`) 등 다양한 자산을 하나의 버킷에서 효율적으로 관리하기 위해 프로젝트명과 동일한 버킷을 생성하고 하위 폴더로 격리하는 전략(`Folder-based Isolation`)을 채택함.

**Q. TTS 음성 파일은 왜 Public 버킷에 저장하나?**

- **A.** 초기 개발 단계에서의 접근 편의성과 CDN 캐싱 효율을 위해 Public으로 설정함. 단, `docs/product/future_todos.md`에 기록한 대로 추후 유료 사용자 전용 기능(Feature Gating) 도입 시 Private 전환 및 RLS 설정을 적용할 예정임.

## 2026-01-06: 라우트 중앙 관리 및 필터 누적 시스템 (Centralized Routing & Additive Filtering)

### ✅ 진행 사항

- **중앙 관리형 라우트 시스템 도입**: `lib/routes.ts`를 생성하여 앱 내 모든 경로와 필터 조합 로직을 단일 지점에서 관리하도록 구조화. 하드코딩된 문자열을 제거하여 유지보수성 향상.
- **필터 누적(Additive Filtering) 구현**: `ExpressionCard` 내 카테고리/태그 클릭 시 기존 필터를 초기화하는 대신 현재 상태를 유지하며 새로운 필터를 더하는 방식으로 UX 고도화.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 필터 누적 방식을 택했나?**

- **A.** 사용자가 특정 카테고리 내에서 특정 태그가 붙은 항목만 골라보는 등 정교한 탐색을 원할 때, 필터가 초기화되면 다시 설정해야 하는 번거로움이 있음. 현대적인 서비스의 필터링 관례에 맞춰 사용자 경험을 상향 평준화함.

## 2026-01-06: 카테고리 필터링 최적화 (Toggle & Duplicate Prevention)

### ✅ 진행 사항

- **카테고리 토글(Toggle) 기능 구현**: 이미 선택된 카테고리를 다시 클릭할 경우 필터가 해제되어 '전체' 목록으로 돌아가도록 UX 개선.
- **중복 페칭 방지**: '전체' 카테고리가 선택된 상태에서 '전체'를 다시 누를 경우 아무 동작도 하지 않도록 차단하여 불필요한 네트워크 요청 제거.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 '전체' 클릭 시에는 아무 동작도 안 하게 했나?**

- **A.** 이미 모든 데이터를 보여주는 상태에서 다시 '전체'를 누르는 것은 의미 없는 중복 데이터 페칭만 유발함. 성능 최적화와 사용자 실수 방지를 위해 해당 동작을 무시하도록 처리함.

**Q. 토글 방식의 장점은?**

- **A.** 사용자가 필터를 해제하기 위해 매번 '전체' 버튼을 찾아서 누를 필요 없이, 보던 카테고리를 한 번 더 누르는 것만으로 초기 상태로 돌아갈 수 있어 탐색 속도가 향상됨.

## 2026-01-06: 네비게이션 상태 보존 고도화 (Multi-cache & Robust Scroll Restoration)

### ✅ 진행 사항

- **Multi-cache 시스템 구축**: 필터 조합(URL)별로 리스트 데이터와 스크롤 위치를 독립적으로 저장하는 `ExpressionContext` 고도화. 검색 결과, 카테고리별 목록 등 각기 다른 탐색 맥락을 완벽히 격리 보존.
- **실시간 스크롤 추적**: 디바운스가 적용된 실시간 리스너를 통해 페이지 이동 클릭 시점뿐만 아니라 브라우저 뒤로가기 등 모든 상황에서의 위치 저장을 자동화.
- **재귀적 RAF 복원 로직**: `requestAnimationFrame`을 사용하여 레이아웃이 확정될 때까지 최대 1초간 추적하며 정확한 위치로 스크롤을 이동시키는 강력한 복원 엔진 구현.
- **컴포넌트 생명주기 최적화**: 필터 변경 시 컴포넌트의 `key` prop을 교체하여 완전한 초기화 및 캐시 복원 프로세스 강제.
- **BackButton 컴포넌트**: 브라우저 히스토리 기반의 뒤로가기 기능 및 직접 진입 시를 위한 홈 이동 안전장치 구현.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `ResizeObserver` 대신 재귀적 `RAF` 방식을 택했나?**

- **A.** `ResizeObserver`는 요소의 크기 변화만 감지하지만, `Framer Motion` 애니메이션이나 폰트 로딩 등으로 인한 미세한 레이아웃 시프트는 브라우저의 페인팅 주기와 밀접하게 연관됨. 재귀적 `RAF`는 브라우저가 화면을 그리는 시점에 맞춰 여러 번 보정하므로 시각적 완성도와 복원 정확도가 훨씬 높음.

**Q. 왜 실시간으로 스크롤 위치를 저장하나?**

- **A.** 상세 페이지로 넘어가는 클릭 시점(`onClick`)에만 저장하면, 브라우저 자체의 뒤로가기 버튼을 눌러 나가는 상황이나 의도치 않은 언마운트 시 대응이 불가능함. 사용자 경험의 연속성을 위해 실시간 저장 방식을 채택함.

## 2026-01-06: 네비게이션 상태 보존 (Scroll Restoration & State Persistence)

### ✅ 진행 사항

- **전역 상태 관리 도입**: `ExpressionContext`를 생성하여 페이지 이동 간에도 리스트 데이터, 페이지 번호, 필터 상태를 유지하도록 구현.
- **스크롤 복원 구현**: 상세 페이지에서 뒤로가기 시, 이전 리스트의 스크롤 위치를 정확히 복원하는 로직(`useLayoutEffect`) 추가.
- **BackButton 컴포넌트**: `router.back()`을 사용하여 브라우저 히스토리를 활용하는 뒤로가기 버튼 구현 (안전장치 포함).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `Context API`를 사용했나?**

- **A.** Next.js App Router에서 페이지 이동 시 클라이언트 컴포넌트의 상태는 초기화됨. '더 보기'로 불러온 데이터가 사라지는 문제를 해결하기 위해, 상태를 최상위(`layout.tsx`)로 끌어올려 전역에서 관리해야 했음.

**Q. `BackButton`에서 `router.push('/')`는 왜 필요한가?**

- **A.** SNS 공유 등으로 상세 페이지에 바로 진입(Deep Link)했을 때는 브라우저 히스토리가 없음. 이때 `router.back()`은 작동하지 않으므로, 사용자가 갇히지 않고 메인으로 이동할 수 있도록 Fallback을 제공함.

## 2026-01-05: 리스트 애니메이션 최적화 및 UI/UX 폴리싱

### ✅ 진행 사항

- **리스트 레이아웃 안정화**: `AnimatedList` 컴포넌트에서 `layout` 속성을 제거하여 '더 보기' 버튼 클릭으로 새로운 아이템이 추가될 때 기존 아이템들이 의도치 않게 움직이거나 깜빡이는 현상 해결.
- **카드 진입 애니메이션 개선**: `ExpressionCard`의 등장 효과를 Slide-up(`y: 20`) 방식에서 Scale-up(`scale: 0.96 -> 1.0`) 방식으로 변경. 보다 세련되고 몰입감 있는 시각적 경험 제공.
- **트랜지션 성능 최적화**: 카드 애니메이션 지속 시간을 0.5초에서 0.4초로 단축하고 베지어 곡선(Ease)을 조정하여 더욱 경쾌한 반응성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `layout` 속성을 제거했나?**

- **A.** Framer Motion의 `layout` 속성은 요소의 크기나 위치가 바뀔 때 자동으로 애니메이션을 적용해주지만, 무한 스크롤이나 '더 보기'처럼 리스트가 아래로 계속 늘어나는 구조에서는 때때로 이전 아이템들이 불필요하게 재계산되어 덜컥거리는 느낌(Jitter)을 줄 수 있음. 성능과 시각적 안정성을 위해 이를 제거함.

**Q. 등장 애니메이션을 Scale로 바꾼 이유는?**

- **A.** Slide-up 방식은 아래에서 위로 올라오는 느낌이 강해 시선이 분산될 수 있음. 반면 Scale-up은 제자리에서 피어오르는 듯한 느낌을 주어 사용자가 새롭게 로드된 콘텐츠에 더 자연스럽게 집중할 수 있도록 도움.

## 2026-01-05: 리스트 탐색 경험 개선 ('더 보기' 구현 및 스크롤 리셋)

### ✅ 진행 사항

- **스크롤 자동 리셋**: 상세 페이지 진입 시 스크롤이 유지되는 문제를 해결하기 위해 Next.js 표준 방식인 `template.tsx` 도입.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 스크롤 리셋을 위해 `useEffect` 대신 `template.tsx`를 썼나?**

- **A.** `layout.tsx`는 페이지 이동 시 상태를 유지하지만, `template.tsx`는 매번 새롭게 마운트됨. 프레임워크 수준에서 페이지 전환 시 초기화 로직(스크롤 리셋 등)을 처리하기 위한 가장 깨끗하고 공식적인 방법임.

## 2026-01-05: 리스트 탐색 경험 개선 ('더 보기' 버튼 구현)

### ✅ 진행 사항

- **페이지네이션 도입**: `lib/expressions.ts`의 `getExpressions` 함수를 수정하여 `page`, `limit` 파라미터 기반의 범위 조회(`range`) 로직 구현.
- **서버 액션(Server Action) 생성**: 클라이언트 컴포넌트에서 안전하게 다음 페이지 데이터를 요청할 수 있도록 `lib/actions.ts`에 `fetchMoreExpressions` 액션 추가.
- **ExpressionList 컴포넌트 구현**: 초기 데이터와 추가 데이터를 통합 관리하고 '더 보기' 인터랙션을 처리하는 전용 클라이언트 컴포넌트 구축.
- **컴포넌트 모듈화**: '더 보기' 버튼을 독립 컴포넌트(`LoadMoreButton.tsx`)로 분리하고, 리스트 관리 로직을 `ExpressionList.tsx`로 캡슐화.
- **UI/UX 최적화**:
  - 추가 로딩 시 `SkeletonCard`를 사용하여 레이아웃 흔들림 방지.
  - 다크모드에서의 버튼 시인성 개선 및 모바일 터치 호버 방지(`useEnableHover`).
  - 버튼 호버 애니메이션 추가 및 데이터 소진 시 버튼 자동 숨김 처리.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 무한 스크롤(Infinite Scroll) 대신 '더 보기' 버튼을 선택했나?**

- **A.** 무한 스크롤은 사용자가 푸터(Footer)에 접근하는 것을 방해하고, 원치 않는 데이터 로딩으로 인해 피로감을 줄 수 있음. 사용자가 명시적으로 '더 보기'를 누르게 함으로써 탐색의 주도권을 제공하고 성능을 최적화함.

**Q. 왜 `actions.ts`를 별도로 분리했나?**

- **A.** Next.js App Router 규칙에 따라 서버 액션은 `"use server"` 지시어가 포함된 별도 파일에 관리하는 것이 클라이언트 컴포넌트와의 충돌을 방지하고 코드 구조를 명확히 하는 데 유리함.

**Q. '더 보기' 버튼을 왜 독립 컴포넌트로 만들었나?**

- **A.** 버튼의 스타일(다크모드 대응, 호버 애니메이션 등)이 복잡해짐에 따라 리스트 로직과 UI 관심사를 분리하여 유지보수성을 높이고, 향후 다른 리스트에서도 재사용하기 위함임.

## 2026-01-05: 스켈레톤 로딩 (Skeleton Loading) 구현 및 UX 최적화

### ✅ 진행 사항

- **스켈레톤 시스템 구축**: 데이터 페칭 중 레이아웃 흔들림(CLS)을 방지하고 체감 속도를 높이기 위해 `Skeleton` 컴포넌트 시리즈 구현.
- **맞춤형 스켈레톤 설계**:
  - `SkeletonNavbar`: 메인(로고+서브헤더)과 상세(뒤로가기) 페이지의 헤더 구조에 맞춘 변주 지원.
  - `SkeletonHomeHero`: 홈 페이지 상단 타이틀과 설명 영역 공간 확보.
  - `SkeletonDetail`: 상세 페이지의 메인 카드, 대화 블록, 퀴즈 카드 구조를 정교하게 모사.
- **전역 로딩 적용**: `app/loading.tsx`와 `app/expressions/[id]/loading.tsx`를 생성하여 Next.js App Router의 내장 스트리밍 로딩 기능 활용.
- **전략 문서화**: `docs/project_context.md`에 새로운 데이터 의존 컴포넌트 생성 시 스켈레톤 구현을 의무화하는 규칙 추가.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Client Component 내부에 로딩 상태를 두지 않고 `loading.tsx`를 썼나?**

- **A.** 서버 컴포넌트에서 데이터를 가져오는 동안 페이지 전체의 레이아웃 일관성을 유지하고, Next.js의 스트리밍 기능을 최대한 활용하여 첫 바이트 도달 시간(TTFB)을 최적화하기 위함임.

**Q. 스켈레톤 디자인 시 가장 고려한 점은?**

- **A.** 실제 콘텐츠가 로드되었을 때 요소의 위치가 바뀌지 않도록(Zero CLS), 실제 컴포넌트와 동일한 패딩, 여백, 최소 높이 값을 적용하는 데 집중함.

## 2026-01-05: Scroll To Top 기능 구현 및 모바일 최적화

### ✅ 진행 사항

- **ScrollToTop 컴포넌트 생성**: 스크롤이 일정 깊이(300px) 이상 내려가면 우측 하단에 나타나는 상단 이동 버튼 구현.
- **애니메이션 및 반응형**: `framer-motion`을 사용하여 부드러운 등장/퇴장 효과를 적용하고, 모바일과 데스크탑 환경에 맞춰 버튼 크기와 위치를 최적화함.
- **전역 적용**: `app/layout.tsx`에 배치하여 모든 페이지에서 일관되게 동작하도록 설정.
- **코드 리팩토링**: `useScroll` 훅을 재사용하여 스크롤 감지 로직을 간소화하고, `useEnableHover`를 통해 모바일 터치 호버 문제를 방지함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `layout.tsx`에 배치했나?**

- **A.** 스크롤이 길어지는 상황은 메인 리스트뿐만 아니라 상세 페이지 등 서비스 전반에서 발생할 수 있으므로, 페이지마다 중복 코드를 작성하는 대신 레이아웃 레벨에서 전역으로 관리하는 것이 효율적임.

## 2026-01-05: 모바일 UX 최적화 및 기술 구현 문서화 및 n8n 태그 생성 로직 고도화

### ✅ 진행 사항

- **태그 생성 규칙 명문화**: `docs/n8n/expressions/optimization_steps.md` 및 `n8n/n8n_workflow_template.json`에 태그 생성 필수 요건(Requirement 11)을 추가. AI가 3~5개의 소문자 키워드를 포함하도록 명시하여 데이터 품질 및 필터링 효율성을 높임.
- **모바일 호버 이슈 해결**: 모바일에서 스크롤 시 카드의 호버 효과(크기 변경, 테두리 색상)가 유지되거나 깜빡이는 문제를 해결하기 위해 `useIsMobile` 훅을 활용.
- **조건부 렌더링**: 모바일 환경(`isMobile === true`)에서는 `whileHover`, `whileTap` 애니메이션과 CSS `hover:` 클래스가 적용되지 않도록 `ExpressionCard` 컴포넌트 로직 수정.
- **안정성 확보**: 초기 렌더링 시(`undefined`) 데스크탑을 기본값으로 간주하여 하이드레이션 불일치 방지 및 점진적 적용.
- **필터 UX 개선**: `FilterBar`에서 카테고리 선택 시, 선택된 칩이 자동으로 화면 중앙으로 스크롤되도록 로직 구현(`data-category` 속성 활용).
- **기술 문서 작성**: 프로젝트의 핵심 기술 구현 상세(i18n, 데이터 아키텍처, UI 자동화 등)를 정리한 `docs/technical_implementation.md` 생성.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 모바일에서 호버를 껐나?**

- **A.** 터치 디바이스에서는 손가락이 닿는 순간을 `hover`로 인식하는 경우가 많아, 스크롤 중에 카드가 눌리거나 색이 변하는 등 의도치 않은 시각적 피드백이 발생함. 깔끔한 스크롤 경험을 위해 모바일에서는 호버 효과를 제거함.

**Q. 기술 문서를 왜 따로 만들었나?**

- **A.** 모바일 감지, 무한 스크롤 가속, 필터 자동 스크롤 등 UI/UX와 관련된 복잡한 기술 로직이 늘어남에 따라, 이를 코드 주석으로만 남기기보다 별도의 문서로 정리하여 유지보수성과 이해도를 높이기 위함임.

## 2026-01-05: 관련 표현 추천 드래그 가속 기능 구현 및 안정화

### ✅ 진행 사항

- **데스크탑 스크롤 인터랙션 고도화**: 상세 페이지 하단의 '관련 표현 추천' 섹션에서, 좌우 페이드 영역에 마우스를 올리면 해당 방향으로 스크롤이 빠르게 가속되는 기능을 추가함.
- **양방향 무한 루프 구현**: 기존의 단방향(오른쪽) 무한 루프를 보완하여, 가속 기능을 통해 왼쪽 끝에 도달했을 때도 끊김 없이 오른쪽 끝으로 연결되도록 로직을 개선함.
- **시각적 피드백 강화**: 페이드 영역 호버 시 전용 커서(`w-resize`, `e-resize`)를 제공하고 히트 영역을 `w-24`로 확장하여 사용성을 높임.
- **버그 수정 (Stacking Context & Events)**:
  - 페이드 영역이 카드 콘텐츠보다 아래(`z-index`)에 있어 호버 이벤트가 발생하지 않던 문제를 `z-index: 20` 상향 및 DOM 순서 변경으로 해결.
  - `fade-mask-base`의 `pointer-events-none` 속성으로 인해 이벤트가 차단되던 문제를, 페이드가 보일 때(`opacity-100`) `pointer-events-auto`를 명시적으로 추가하여 해결.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 페이드 영역에 가속 기능을 추가했나?**

- **A.** 자동 스크롤(Marquee)은 시선을 끄는 데 효과적이지만, 사용자가 특정 표현을 빨리 찾고 싶을 때 답답함을 느낄 수 있음. 페이드 영역을 "가속 버튼"처럼 활용하게 함으로써, 별도의 버튼 UI 없이도 직관적으로 스크롤 속도를 제어할 수 있는 UX를 제공함.

## 2026-01-04: 사용자 가이드 작성 및 퀴즈 UI 개선

### ✅ 진행 사항

- **사용자 가이드 작성**: 서비스 개요부터 n8n 워크플로우 설정 방법까지 상세히 안내하는 `docs/n8n/expressions/user_guide.md` 생성. 운영자가 워크플로우를 직접 설정하고 운영하는 데 필요한 모든 단계(Credentials, Node Logic, Troubleshooting)를 문서화함.
- **퀴즈 UI 가독성 개선**: 상세 페이지의 퀴즈 질문(`question`) 영역에 `whitespace-pre-wrap` 속성을 추가하여, n8n에서 생성된 줄바꿈(`\n`)이 UI에 그대로 반영되도록 수정. 이를 통해 질문과 선택지가 섞여 보이던 문제를 해결함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 퀴즈 질문에 `whitespace-pre-wrap`을 적용했나?**

- **A.** Gemini가 생성하는 퀴즈 데이터는 질문과 선택지 사이, 혹은 긴 문장 사이의 가독성을 위해 개행 문자(`\n`)를 포함함. 기존 CSS에서는 이를 무시하고 한 줄로 붙여서 보여주었기에 가독성이 매우 떨어졌음. CSS 속성 하나로 데이터가 의도한 레이아웃대로 출력되도록 개선함.

## 2026-01-04: n8n 퀴즈 생성 로직 고도화 및 데이터 무결성 확보

### ✅ 진행 사항

- **Quiz Logic 재정립**: `docs/n8n/expressions/optimization_steps.md`의 Gemini 프롬프트를 전면 개편.
  - 기존의 모호하거나 잘못된 패턴(Target Language -> Target Language)을 제거하고, 3가지 명확한 패턴(Situation->EN, Expression->Situation, Negative Logic)으로 정립.
  - 모든 언어(KO, JA, ES)에 대해 3지 선다(A/B/C)와 정답 포맷(단일 알파벳)을 강제하는 **Strict Formatting Rules** 추가.
- **데이터 보정**: 기존 DB에 쌓인 잘못된 형식의 퀴즈 데이터(`How's it going?`, `down in the dumps` 등)와 논리적으로 부적절한 데이터(`Is there a fitting room?` 등)를 올바른 패턴으로 수정하는 SQL 스크립트 작성 (`database/009_fix_invalid_quizzes.sql`).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 기존 퀴즈 패턴(Pattern 3)을 삭제했나?**

- **A.** 기존 Pattern 3은 "한국어 상황"을 주고 "한국어 대사"를 고르는 방식이었는데, 이는 영어 학습 목적에 부합하지 않음. 대신 '부적절한 상황 고르기(Negative Logic)'를 Pattern 3으로 새로 정의하여 학습 효과를 높임.

**Q. SQL에서 Dollar Quoting(`$$`)을 사용한 이유는?**

- **A.** JSONB 데이터 내부에 싱글 쿼테이션(`'`)이 포함된 텍스트(예: `How's it going?`)를 업데이트할 때, 일반적인 이스케이핑 방식으로는 구문 오류가 발생하기 쉬움. `$$`를 사용하여 쿼리의 가독성을 높이고 이스케이프 문제를 원천 차단함.

## 2026-01-03: n8n 프롬프트 최적화 및 문서 워크플로우 개선

### ✅ 진행 사항

- **Gemini 프롬프트 고도화**: `Gemini Content Generator` 프롬프트를 수정하여 영어 표현의 대소문자(문장 vs 구절), 의미의 톤(반말 vs 존댓말), 문장 부호(물음표 등) 규칙을 명확히 정의함.
- **컨텍스트 복원 강화**: `.agent/workflows/restore_context.md`가 로드하는 파일 목록에 `features_list.md`, `database/schema.md`를 추가하여 에이전트의 이해도 향상.
- **문서 동기화**: `n8n_optimization_steps.md`와 `n8n/n8n_workflow_template.json`을 최신 프롬프트 변경 사항에 맞춰 업데이트.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 "No worries"는 대문자, "spill the tea"는 소문자로 시작하게 했나?**

- **A.** 독립된 문장이나 감탄사는 대문자로 시작하는 것이 자연스럽고, 문장 속에 삽입되는 관용구는 소문자로 시작해야 활용하기 좋기 때문임.

**Q. 의미(Meaning) 필드에서 존댓말을 허용한 이유는?**

- **A.** 기존에는 무조건 반말을 강제했으나, "Could I...?" 같이 정중한 영어 표현을 "해 줄래?"로 번역하면 뉘앙스가 어긋남. 따라서 영어 표현 자체가 정중할 경우 한국어 뜻풀이도 존댓말을 사용하도록 예외 규칙을 추가함.

## 2026-01-03: UI 스타일 중앙 관리 및 모바일 최적화

### ✅ 진행 사항

- **공통 유틸리티 클래스 도입**: `globals.css`에 반복되는 UI 패턴(배경, 테두리, 텍스트 색상 등)을 `bg-surface`, `bg-subtle`, `text-body` 등 전역 유틸리티 클래스로 정의하여 통합 관리.
- **모바일 감지 훅 구현**: `useMediaQuery`와 `useIsMobile` 훅을 추가하여 클라이언트 사이드에서 정확한 모바일 환경 감지 로직 구축.
- **하이드레이션 이슈 해결**: 모바일 감지 시 SSR과 CSR 간의 불일치로 발생하는 Hydration Mismatch 문제를 초기값 `undefined` 처리 및 동적 렌더링을 통해 해결.
- **컴포넌트 리팩토링**: `ExpressionCard`, `SearchBar`, `FilterBar`, `RelatedExpressions` 등 주요 컴포넌트가 전역 유틸리티와 모바일 훅을 사용하도록 전면 리팩토링.
- **문서 체계 강화**: 에이전트 워크플로우(`update_docs`)에 `feature_ideas.md`를 포함시키고, 구현 완료된 아이템의 관리 규칙을 명시함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Tailwind 클래스를 직접 쓰지 않고 유틸리티 클래스를 따로 정의했나?**

- **A.** `bg-white dark:bg-zinc-900` 같은 조합이 수십 개의 컴포넌트에서 반복되면, 나중에 테마 색상을 변경할 때 모든 파일을 수정해야 함. `bg-surface`와 같이 시맨틱한 이름을 사용하면 `globals.css` 한 곳만 수정해도 전체 앱의 디자인을 일관되게 바꿀 수 있음.

**Q. 왜 `isMobile`의 초기값을 `false`가 아닌 `undefined`로 두었나?**

- **A.** 서버 사이드에서는 화면 크기를 알 수 없으므로 `false`로 가정하면, 실제 모바일 기기에서 접속했을 때 서버는 데스크탑 뷰를 보내고 클라이언트는 모바일 뷰로 그려 하이드레이션 에러가 발생함. `undefined`를 반환하고 클라이언트에서 값이 확정된 후 그리게 함으로써 이를 방지함.

## 2026-01-03: 아키텍처 정비 및 Sticky UI 고도화

### ✅ 진행 사항

- **폴더 구조 재편**: `lib/hooks`와 `lib/i18n`을 루트 레벨(`hooks/`, `i18n/`)로 이동하여 아키텍처 명확성 확보.
- **공통 훅 도입**: `useScroll` 훅을 생성하여 헤더와 필터 바의 스크롤 감지 로직을 통합.
- **Sticky UI 개선**: 헤더와 필터 바가 스크롤 시 자연스럽게 연결되도록 디자인 및 로직(Border 토글, 배경색 전환) 개선.
- **전역 스타일 체계 구축**: `globals.css`에 Tailwind v4 테마 변수와 유틸리티를 정의하여 레이아웃 폭, 헤더 높이 등을 중앙 관리.
- **에이전트 워크플로우 모듈화**: 문서 현행화를 자동화하는 `update_docs` 워크플로우를 구축하고 커밋 프로세스에 통합.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 hooks와 i18n 폴더를 루트로 옮겼나?**

- **A.** 프로젝트 규모가 커짐에 따라 `lib` 폴더가 비대해지는 것을 방지하고, 전역적으로 사용되는 핵심 모듈들을 더 직관적으로 찾을 수 있도록 루트 레벨로 승격시킴.

**Q. Sticky UI에서 Border를 왜 동적으로 토글하나?**

- **A.** 평소에는 헤더 하단에 선이 있지만, 필터 바가 헤더 아래에 붙을 때는 헤더의 선이 사라지고 필터 바 하단에 선이 생겨야 두 요소가 하나의 완성된 "상단 바"처럼 보이기 때문임.

## 2026-01-03: 기능 명세 문서화 (Features List)

### ✅ 진행 사항

- **문서화**: 프로젝트의 현재 구현된 기능들을 일목요연하게 정리한 `docs/product/features_list.md` 생성.
- **범위**: 사용자 인터페이스(메인, 상세)부터 백엔드 인프라(Supabase, n8n)까지 전체 시스템 기능 명세 포함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 기능 목록 문서를 별도로 만들었나?**

- **A.** 개발 히스토리(`project_history.md`)는 시간 순서대로 기록되어 현재 시점의 완성된 기능 스펙을 한눈에 파악하기 어려움. 따라서 신규 개발자나 이해관계자가 현재 서비스의 기능을 빠르게 파악할 수 있도록 Living Document 형태의 기능 명세서를 작성함.

## 2026-01-02: 관련 표현 추천 UI 고도화 (Auto-Marquee)

### ✅ 진행 사항

- **자동 스크롤 구현**: `requestAnimationFrame`을 사용하여 끊김 없이 흐르는 무한 루프 스크롤(Infinite Loop) 구현.
- **인터랙션 강화**: 마우스 호버 시 스크롤 일시정지, 마우스 이탈 시 재개 기능 추가.
- **성능 최적화**: `useCallback` 및 `useEffect` 의존성 최적화로 불필요한 리렌더링 방지.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 자동 스크롤(Auto-Marquee)을 적용했나?**

- **A.** 정적인 리스트보다 움직이는 리스트가 사용자의 시선을 더 잘 끌며, "더 많은 콘텐츠가 있다"는 것을 암시적으로 전달하기 위함임. 또한, 마우스 호버 시 멈추게 하여 사용자가 읽는 데 불편함이 없도록 배려함.

## 2026-01-02: n8n 중복 생성 방지 로직 강화 (Pre-fetch Check)

### ✅ 진행 사항

- **로직 개선**: 기존의 사후 중복 체크(Check Duplicate) 방식이 Gemini의 반복 생성을 막지 못하는 문제를 해결하기 위해, 생성 전 기존 데이터를 조회하여 제외 목록으로 전달하는 **사전 예방(Pre-fetch)** 단계를 추가함.
- **문서 업데이트**: `docs/n8n/expressions/optimization_steps.md` 및 `docs/n8n/expressions/workflow_guide.md`에 'Get Existing Expressions' 단계 추가.

### 💬 주요 Q&A 및 의사결정

**Q. 사후 체크만으로 충분하지 않았나?**

- **A.** 사후 체크(`If New`)는 중복 시 저장을 막을 뿐, 워크플로우를 재실행하거나 다른 표현을 다시 생성하지 않음. 따라서 Gemini가 계속 같은 표현("Touch base" 등)만 생성하면 데이터가 쌓이지 않는 문제가 발생함. 이를 해결하기 위해 **생성 단계에서부터** 이미 있는 표현을 배제하도록 개선함.

## 2026-01-02: n8n 중복 체크 로직 개선 (ILIKE 도입)

### ✅ 진행 사항

- **중복 검사 강화**: n8n 워크플로우의 'Check Duplicate' 노드 설정을 변경.
  - 기존: `Equal` 연산자 (정확히 일치해야 함).
  - 변경: **`ILIKE` (Case-insensitive Like)** 연산자 + 와일드카드(`*`).
  - 예: "touch base" 생성 시, DB에 "Let's touch base"가 있어도 중복으로 감지하여 생성 스킵.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `Equal` 대신 `ILIKE`를 사용했나?**

- **A.** AI가 매번 동일한 표현을 생성하더라도, 문장 부호나 대소문자, 관사 유무 등이 미세하게 다를 수 있음. 단순 `Equal`로는 이를 걸러내지 못해 데이터베이스에 유사 중복 데이터가 쌓이는 문제가 발생할 수 있어, 보다 유연한 `ILIKE` 검색으로 개선함.

## 2026-01-02: 서비스 명칭 변경 및 다국어 확장 아키텍처 수립

### ✅ 진행 사항

- **브랜드 리뉴얼**: 서비스 명칭을 `Daily English`에서 **`Speak Mango`**로 공식 변경.
- **상수화 및 코드 반영**:
  - `lib/constants.ts`에 `SERVICE_NAME` 상수를 추가하고 모든 UI와 메타데이터에서 참조하도록 수정.
  - 서비스 패키지명(`package.json`) 및 로컬 디렉토리 참조 구조 업데이트.
- **다국어 DB 전략 정립**:
  - **콘텐츠 스키마 분리**: 언어별 독립 스키마(`speak_mango_en`, `speak_mango_ko` 등) 사용 결정.
  - **공유 스키마 도입**: 사용자 프로필 및 통합 단어장 관리를 위한 `speak_mango_shared` 스키마 설계.
  - **서비스 격리**: `auth.users`를 공유하되 스키마별 `profiles` 테이블의 존재 여부로 서비스 가입자를 구분하는 보안 전략 수립.
- **클라이언트 유틸리티 고도화**: 스키마 이름을 인자로 받아 동적으로 Supabase 클라이언트를 생성할 수 있도록 `createBrowserSupabase` 및 `createServerSupabase` 함수 개선.
- **DB 마이그레이션**: 기존 `daily_english` 스키마를 `speak_mango_en`으로 변경하는 마이그레이션 스크립트 작성 (`database/008_rename_schema_to_speak_mango.sql`).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 단일 테이블 대신 스키마 분리 방식을 선택했나?**

- **A.** 언어별로 콘텐츠 구조(컬럼 등)가 달라질 수 있는 유연성을 확보하고, 특정 서비스의 데이터 장애가 다른 서비스로 전파되는 것을 막기 위함임. 또한, 향후 특정 언어 서비스만 별도로 분리하거나 매각해야 할 경우 관리가 훨씬 용이함.

**Q. 서로 다른 서비스 간 사용자 로그인을 어떻게 구분하나?**

- **A.** Supabase의 `auth.users`는 공유하되, 각 서비스의 스키마 내에 `auth.users.id`를 외래키로 갖는 `profiles` 테이블을 둠으로써, 해당 테이블에 레코드가 있는 사용자만 가입자로 간주하는 논리적 격리 방식을 채택함.

## 2026-01-02: 관련 표현 추천 구현 및 콘텐츠 탐색 전략 수립

### ✅ 진행 사항

- **관련 표현 추천 구현**:
  - 상세 페이지(`app/expressions/[id]/page.tsx`) 하단에 현재 표현과 동일한 카테고리의 다른 표현들을 추천하는 섹션 추가.
  - `lib/expressions.ts`에 `getRelatedExpressions` 함수를 추가하여 데이터 로직 분리.
- **콘텐츠 탐색 전략 수립**:
  - 향후 데이터 증가에 대비하여 **'더 보기(Load More)'** 방식의 페이지네이션 도입 결정.
  - 탐색 편의성을 극대화하기 위해 **A-Z 인덱스** 및 **업로드 순 인덱스**를 포함한 아카이브 페이지 기획 추가.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 무한 스크롤 대신 '더 보기' 버튼을 선택했나?**

- **A.** 무한 스크롤은 푸터(Footer) 접근성을 저해하고 사용자에게 통제 불가능한 피로감을 줄 수 있음. '더 보기' 버튼은 푸터 접근성을 보장하면서도 사용자가 명시적으로 다음 데이터를 요청하게 함으로써 더 나은 탐색 경험을 제공함.

**Q. 인덱스 페이지의 역할은?**

- **A.** 카테고리/태그 필터링 외에, 사용자가 전체 콘텐츠의 양을 가늠하고 알파벳 순서나 시간 순서로 빠르게 원하는 표현을 '색인(Indexing)' 할 수 있도록 돕는 도서관 카탈로그 같은 역할을 수행함.

## 2026-01-02: Framer Motion 애니메이션 적용 및 데이터 표준화

### ✅ 진행 사항

- **애니메이션 고도화**:
  - `framer-motion` 라이브러리를 도입하여 리스트 및 카드에 생동감 있는 인터랙션 적용.
  - `AnimatedList` 컴포넌트를 통해 검색/필터링 시 카드가 부드럽게 재배치되는 Layout Animation 구현.
  - `ExpressionCard`에 Staggered 진입 효과(순차적 등장) 및 Hover/Tap 피드백 추가.
- **데이터 품질 개선**:
  - `database/007_fix_meaning_style.sql` 스크립트를 통해 `meaning` 컬럼의 문장 끝 마침표(`.`)를 일괄 제거.
  - 기존 데이터 중 존댓말(`~요`, `~세요`)로 작성된 항목들을 프로젝트 규칙에 맞게 반말 스타일로 교정.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `AnimatedList`라는 별도 컴포넌트를 만들었나?**

- **A.** `AnimatePresence`와 `layout` 속성을 효과적으로 관리하기 위함임. 메인 페이지의 코드를 깔끔하게 유지하면서, 추후 다른 리스트(예: 북마크 목록)에서도 동일한 애니메이션 경험을 재사용할 수 있도록 설계함.

**Q. 왜 의미(Meaning) 필드에서 마침표를 제거하고 반말로 통일했나?**

- **A.** `docs/n8n/expressions/optimization_steps.md`에서 정의한 '간결한 뜻풀이'와 '캐주얼한 톤' 원칙을 지키기 위함임. 특히 모바일 카드 UI에서는 텍스트의 간결함이 가독성에 큰 영향을 미치므로 마침표 같은 불필요한 문장 부호를 최소화함.

## 2026-01-01: CategoryLabel 호버 애니메이션 고도화

### ✅ 진행 사항

- **인터랙션 개선**: `CategoryLabel` 컴포넌트 자체에 `group` 클래스를 추가하여, 상세 페이지와 같이 부모에 `group`이 없는 환경에서도 카테고리 아이콘의 호버 애니메이션(`rotate-12`)이 작동하도록 개선.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 컴포넌트에 `group`을 추가했나?**

- **A.** 메인 페이지의 카드는 카드 전체 호버 시 아이콘이 반응하지만, 상세 페이지에서는 카테고리 라벨 자체에 마우스를 올렸을 때 반응해야 함. 컴포넌트가 스스로 호버 상태를 감지할 수 있게 함으로써 범용성을 높임.

## 2026-01-01: CategoryLabel 컴포넌트 추가 및 인터랙션 강화

### ✅ 진행 사항

- **CategoryLabel 컴포넌트 생성**: `components/CategoryLabel.tsx`를 생성하여 카테고리 표시 UI를 캡슐화하고 링크/버튼 동작을 통합 지원.
- **필터링 연동**:
  - `ExpressionCard`: 카테고리 클릭 시 해당 카테고리로 필터링된 메인 페이지로 이동(`/?category=...`)하도록 `handleCategoryClick` 구현.
  - `ExpressionDetailPage`: 상세 페이지 상단의 카테고리를 클릭 가능한 `Link`로 변경하여 필터링 기능 연결.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Tag와 비슷하게 Category도 별도 컴포넌트로 만들었나?**

- **A.** 카테고리 역시 태그처럼 클릭 시 필터링 기능을 제공해야 하며, 메인(버튼)과 상세(링크) 페이지에서 일관된 스타일을 유지해야 하므로 별도 컴포넌트로 분리하여 재사용성을 높임.

## 2026-01-01: 스타일 충돌 방지를 위한 유틸리티 도입

### ✅ 진행 사항

- **패키지 설치**: `tailwind-merge`와 `clsx`를 설치하여 Tailwind 클래스 병합 로직 강화.
- **유틸리티 추가**: `lib/utils.ts`에 `cn` 함수를 추가하여 조건부 클래스 및 스타일 충돌 해결 기능 제공.
- **컴포넌트 리팩토링**: `Tag.tsx`에서 단순 문자열 연결 대신 `cn` 함수를 사용하도록 수정하여, 외부에서 주입된 클래스가 기본 스타일을 올바르게 덮어쓰도록 개선.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `cn` 유틸리티를 도입했나?**

- **A.** 단순 문자열 연결(`${base} ${custom}`)은 CSS 정의 순서에 따라 스타일 적용 우선순위가 결정되므로, 의도한 대로 스타일 오버라이딩이 되지 않는 문제(Cascading Issue)가 발생할 수 있음. 이를 방지하고 유지보수성을 높이기 위해 도입함.

## 2026-01-01: Tag 컴포넌트 독립 분리 및 재사용성 확보

### ✅ 진행 사항

- **Tag 컴포넌트 생성**: `components/Tag.tsx`를 생성하여 태그 UI 및 인터랙션 로직을 캡슐화. `Link` 모드와 `button` 모드를 모두 지원.
- **적용 및 리팩토링**:
  - `ExpressionCard`: 기존 버튼 기반 태그를 `Tag` 컴포넌트로 교체.
  - `ExpressionDetailPage`: 기존 `Link` 기반 태그를 `Tag` 컴포넌트로 교체하여 스타일 일관성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Tag를 별도 컴포넌트로 분리했나?**

- **A.** 메인 페이지의 카드 내부(버튼 역할)와 상세 페이지(링크 역할)에서 태그의 스타일은 동일해야 하지만 동작이 다름. 이를 `Tag` 컴포넌트 내부에서 `href` 유무에 따라 분기 처리함으로써 코드 중복을 제거하고 유지보수성을 높임.

## 2026-01-01: 표현 상세 페이지 태그 검색 연동

### ✅ 진행 사항

- **태그 인터랙션 구현**: `app/expressions/[id]/page.tsx` 하단의 태그를 클릭 가능한 `Link`로 변경하여, 클릭 시 메인 페이지의 해당 태그 검색 결과로 이동하도록 구현.
- **UI 일관성 유지**: `ExpressionCard`와 동일한 스타일(호버 효과, 색상 등)을 적용하여 시각적 일관성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 상세 페이지에서 왜 `Link`를 사용했나?**

- **A.** 상세 페이지는 서버 컴포넌트이므로, `useRouter`를 사용하는 클라이언트 로직 대신 표준 `Link` 태그를 사용하는 것이 성능과 SEO 측면에서 유리하다고 판단함.

## 2026-01-01: 검색/필터 기능 완성 및 UI 고도화

### ✅ 진행 사항

- **검색 시스템 구축**: `SearchBar` 컴포넌트를 분리하고, 일반 검색과 태그 검색(`#tag`)을 자동 식별하여 처리하는 로직 구현.
- **필터링 기능 구현**: `FilterBar`를 통해 카테고리별 데이터 필터링 기능 제공. 도메인 필터는 데이터 확충 시점까지 임시 비활성화.
- **UI/UX 폴리싱**:
  - `ExpressionCard`에 생동감 있는 호버 애니메이션(Lift & Glow) 적용.
  - 필터 바에 스크롤 페이드 효과를 추가하여 스크롤 가능 여부를 직관적으로 표시.
  - 클릭 가능한 요소에 `cursor-pointer` 적용 및 시각적 피드백 강화.
- **코드 구조 개선**:
  - UI 설정(`ui-config.ts`), 상수(`constants.ts`), 유틸리티(`utils.ts`) 분리.
  - 컴포넌트(`FilterBar`, `ExpressionCard`)를 클라이언트 컴포넌트로 전환하여 인터랙션 처리.

### 💬 주요 Q&A 및 의사결정

**Q. `#` 검색어 처리는 어떻게 하나?**

- **A.** 사용자가 검색창에 `#idiom`과 같이 입력하면, 이를 검색어가 아닌 '태그 필터'로 인식하여 자동으로 태그 쿼리(`?tag=idiom`)로 변환하도록 구현함.

## 2026-01-01: UI 인터랙션 강화 및 컴포넌트 리팩토링

### ✅ 진행 사항

- **스크롤 UI 개선**: `FilterBar`에 양옆 페이드(Fade) 효과를 추가하여 스크롤 가능 여부를 직관적으로 보여주도록 개선하고, 스크롤바는 숨김 처리함.
- **인터랙션 강화**: `ExpressionCard` 내 태그(`#tag`) 클릭 시 해당 태그로 즉시 필터링되는 기능 구현.
- **UX 디테일 보완**: 모든 클릭 가능한 요소(카테고리 칩, 태그, 닫기 버튼 등)에 `cursor-pointer`를 적용하여 사용성을 높임.
- **리팩토링**:
  - `ExpressionCard`와 `FilterBar`를 `export default`로 전환하고 `use client`를 적용하여 클라이언트 컴포넌트로 변경.
  - 중복되는 UI 설정 로직을 `lib/ui-config.ts`의 `getExpressionUIConfig` 헬퍼 함수로 통합.

### 💬 주요 Q&A 및 의사결정

**Q. 스크롤바를 숨긴 이유는?**

- **A.** 모바일 및 데스크탑에서 깔끔한 UI를 유지하기 위함임. 대신 양옆에 그라데이션 페이드를 동적으로 표시(`useRef`로 스크롤 위치 감지)하여 스크롤 가능함을 힌트로 제공함.

## 2026-01-01: 검색 및 필터링 기능 구현, UI 고도화

### ✅ 진행 사항

- **검색 및 필터 구현**: 메인 페이지 상단에 `FilterBar` 컴포넌트를 추가하여 검색어 입력 및 카테고리(`category`)별 필터링 기능 구현.
- **UI/UX 개선**: `ExpressionCard`에 세련된 호버 애니메이션(Lift & Glow) 적용 및 다크 모드 시인성 강화.
- **상호작용 강화**: `ExpressionCard`를 클라이언트 컴포넌트로 전환하고, 카드 내 태그 클릭 시 즉시 해당 태그로 검색되도록 기능 추가.
- **필터 간소화**: 초기에는 `domain` 필터도 고려했으나, 현재 데이터가 `conversation` 위주이므로 사용자 혼동을 줄이기 위해 우선 `category` 필터에 집중하고 `domain` 필터는 비활성화함 (추후 데이터 확충 시 재활성화 예정).
- **컴포넌트 리팩토링**: `FilterBar` 및 `ExpressionCard`를 `export default` 방식으로 통일하고, UI 설정을 `lib/ui-config.ts`로 중앙화하여 유지보수성 향상.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `FilterBar`에서 Domain 필터를 제거했나?**

- **A.** 현재 DB에 `conversation` 도메인 데이터만 존재하므로, 굳이 탭을 보여주는 것이 불필요하다고 판단함. 카테고리(`business`, `travel` 등) 필터가 사용자에게 더 유용한 탐색 경험을 제공함.

**Q. `ExpressionCard`를 왜 클라이언트 컴포넌트로 바꿨나?**

- **A.** 카드 전체는 상세 페이지 링크(`Link`)로 감싸져 있는데, 내부의 태그 버튼 클릭 시 상세 페이지 이동을 막고(`stopPropagation`) 검색 필터만 적용해야 했음. 이러한 이벤트 처리를 위해 클라이언트 컴포넌트 전환이 필요했음.

## 2026-01-01: 콘텐츠 분류 체계 고도화 및 다국어 확장 대응

### ✅ 진행 사항

- **2단계 분류 체계 도입**: `domain`(대분류: conversation, test 등)과 `category`(소분류: business, travel 등) 컬럼을 추가하여 콘텐츠 확장성 확보.
- **n8n 워크플로우 최적화**: 'Pick Category' 노드를 구조화된 데이터(JSON) 기반으로 리팩토링하고, 쇼핑 카테고리 추가 및 콩글리시 등 특정 문화권 한정 주제 제거.
- **다국어 생성 강화**: Gemini 프롬프트를 고도화하여 한국어, 일본어, 스페인어 콘텐츠를 한 번의 호출로 생성하도록 개선.
- **AI 페르소나 및 톤 교정**: AI가 반말과 존댓말을 혼용하는 문제를 해결하기 위해, 프롬프트에 '반말 사용 금지' 및 '일관된 경어체(Desu-Masu) 사용' 제약 조건을 명시적으로 추가함.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 콩글리시 카테고리를 제거했나?**

- **A.** 서비스가 다국어(일본어, 스페인어 등)로 확장됨에 따라 한국인에게만 유효한 '콩글리시 교정'은 글로벌 사용성 측면에서 부적합하다고 판단함. 대신 모든 언어권에서 공통적으로 유용한 '쇼핑', '여행' 등의 주제로 확장함.

**Q. Domain과 Category를 왜 나누었나?**

- **A.** 추후 '시험 영어(TOEIC 등)', '테마별 단어장' 등으로 서비스를 확장할 때 DB 구조의 대대적인 변경 없이도 유연하게 대응하기 위함임.

## 2025-12-31: 다국어(i18n) 인프라 구축 및 중앙 관리 체계 도입

### ✅ 진행 사항

- **DB 스키마 확장**: `meaning` 및 `content` 컬럼을 JSONB 기반 다국어 구조로 전환 (기존 데이터 `ko` 키로 마이그레이션 전략 수립).
- **동적 언어 감지**: Next.js Middleware를 사용하여 브라우저 언어 설정을 서버 컴포넌트에 전달하는 메커니즘 구현.
- **문자열 중앙 관리**: `lib/i18n/locales/`에 언어별 파일을 분리하고, 하드코딩된 모든 UI 텍스트를 딕셔너리 기반으로 리팩토링.
- **서버 헬퍼 도입**: 서버 컴포넌트 전용 `getI18n()` 유틸리티를 통해 중복 코드를 제거하고 타입 안정성 확보.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 i18n 라이브러리 대신 직접 구현했나?**

- **A.** 현재 프로젝트 규모에서 외부 라이브러리(next-intl 등)는 다소 무거울 수 있음. 미들웨어 + 커스텀 헬퍼 조합으로도 SEO 친화적인 서버 사이드 다국어 처리가 충분히 가능하며, 추후 필요 시 라이브러리로의 전환이 용이하도록 구조화함.

**Q. `dialogue` 내부의 `kr` 키를 왜 `translation`으로 바꿨나?**

- **A.** 일본어(`ja`), 스페인어(`es`) 등 다른 언어 콘텐츠가 추가될 때, 매번 키 이름을 바꿀 필요 없이 동일한 인터페이스(`translation`)를 사용하기 위함임.

## 2025-12-31: AI 프롬프트 고도화 및 페르소나 일관성 확보

### ✅ 진행 사항

- **프롬프트 튜닝**: Gemini Content Generator에 3가지 고품질 예시(`under the weather`, `swamped`, `hang in there`)를 포함하여 생성 품질 상향 평준화.
- **페르소나 교정**: "얘들아", "우리 친구들" 등 특정 대상을 지칭하는 말투를 제거하고, 2030 타겟의 일반적이고 친근한 톤으로 통일.
- **로직 보완**: Gemini의 마크다운 응답을 순수 JSON으로 변환하는 `Parse JSON` 노드 추가 및 Supabase Insert 에러 해결.
- **n8n 백업 체계**: 워크플로우 JSON 내보내기/가져오기 가이드 문서화 및 로컬 백업 파일 생성 (`n8n_data/n8n_workflow_daily_english.json`).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 "얘들아" 같은 표현을 금지했나?**

- **A.** 서비스 타겟이 전 연령층(특히 2030 사회인)으로 확장될 가능성을 고려할 때, 너무 학생 대상인 말투는 브랜드 신뢰도를 떨어뜨릴 수 있음. 따라서 보편적인 친근함을 유지하되 특정 집단을 지칭하지 않도록 제약 조건을 추가함.

**Q. JSON Parsing 에러가 발생한 이유는?**

- **A.** Gemini가 응답 시 `json ... ` 마크다운 태그를 포함하여 문자열로 반환했기 때문임. 이를 정규식으로 제거하고 `JSON.parse`하는 단계를 추가하여 DB Insert가 가능하도록 수정함.

## 2025-12-31: n8n 아키텍처 변경 (Scraping -> AI Generation)

### ✅ 진행 사항

- **n8n 데이터 지속성 확보**: `docker-compose.yml` 수정 (Bind Mount 적용) 및 `.gitignore` 설정 추가 (`n8n_data/`).
- **자동화 전략 대전환**: 기존 외부 블로그 스크래핑 방식에서 **AI 기반 자체 생성 방식**으로 변경.
- **문서 업데이트**:
  - `docs/n8n/expressions/optimization_steps.md`: AI 기반 생성 및 중복 방지 가이드로 전면 수정.
  - `docs/n8n/expressions/workflow_guide.md`: 변경된 아키텍처(Category Selection -> Generator) 반영.
  - `docs/project_context.md`: 시스템 아키텍처 다이어그램 업데이트.

### 💬 주요 Q&A 및 의사결정

**Q. n8n 설정이 자꾸 초기화되는데?**

- **A.** 기존 Docker Volume 방식 대신 프로젝트 내 `./n8n_data` 폴더를 직접 마운트하는 방식(Bind Mount)으로 변경하여, 컨테이너 재시작 시에도 계정 및 워크플로우 데이터가 유지되도록 수정함.

**Q. 왜 스크래핑을 포기하고 AI 생성 방식을 택했나?**

- **A.**
  1.  **안정성**: 외부 블로그의 HTML 구조 변경이나 접속 불가 이슈로부터 완전히 자유로워짐.
  2.  **비용 절감**: 불필요한 HTML 파싱 및 데이터 전송 비용 제거.
  3.  **제어 가능성**: 우리가 원하는 카테고리(비즈니스, 여행 등)를 직접 설정하여 콘텐츠의 방향성을 주도할 수 있음.

**Q. "Gemini Extractor"는 어떻게 변했나?**

- **A.** 기존에는 텍스트에서 표현을 "추출(Extract)"하는 역할이었으나, 이제는 주제를 받아 표현을 "생성(Generate)"하는 역할로 변경됨에 따라 명칭을 `Gemini Expression Generator`로 변경함.

## 2025-12-30: n8n 자동화 파이프라인 완성 및 DB 스키마 분리

### ✅ 진행 사항

- n8n 자동화 워크플로우(스크래핑 -> Gemini -> Supabase) 테스트 성공.
- **다중 프로젝트 전략 적용**: `public` 스키마 대신 `daily_english` 스키마 도입.
- **코드 리팩토링**: DB 스키마명을 `lib/constants.ts`에서 상수로 중앙 관리하고, Supabase 클라이언트(`lib/supabase/*`)가 이를 자동으로 참조하도록 수정.
- **권한 문제 해결**: n8n(Supabase API) 접근 시 발생한 `permission denied` 및 `Invalid schema` 오류를 해결하기 위해 RLS 비활성화 및 명시적 권한 부여 SQL 스크립트 작성 (`database/002_fix_permissions.sql`).

### 💬 주요 Q&A 및 의사결정

**Q. 왜 스키마 이름을 상수로 관리하는가?**

- **A.** 코드 내 `daily_english`라는 문자열이 하드코딩되면 추후 변경 시 누락 위험이 큼. `lib/constants.ts`에 정의하고 이를 `createBrowserSupabase`, `createServerSupabase`에서 참조함으로써 유지보수성을 높이고 실수를 방지함.

**Q. n8n에서 "Invalid schema" 에러가 발생한 이유는?**

- **A.** Supabase의 `public` 스키마 외에 커스텀 스키마를 사용할 경우, Data API 설정에서 해당 스키마를 **Expose** 해주지 않으면 외부에서 접근할 수 없음. 또한, DB 레벨에서도 `GRANT USAGE` 권한이 필요함.

## 2025-12-30: n8n 자동화 환경 구축

### ✅ 진행 사항

- `docker-compose.yml`을 통한 로컬 n8n 실행 환경 설정.
- `n8n/n8n_workflow_template.json` 생성 (가져오기용 워크플로우 템플릿).
- Gemini API 프롬프트 최적화 및 Supabase 연동 로직 설계.
- `feat/n8n-automation-setup` 브랜치 생성 및 작업 시작.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 Docker Compose를 사용하나?**

- **A.** 로컬 환경에서 n8n을 빠르고 일관되게 실행하기 위함이며, 추후 서버 배포 시에도 그대로 활용할 수 있기 때문임.

**Q. n8n 워크플로우 템플릿의 역할은?**

- **A.** 사용자가 n8n GUI에서 하나하나 노드를 만들지 않고, JSON 파일을 `Import from File` 하여 즉시 구조를 잡을 수 있도록 돕기 위함.

## 2025-12-30: 상세 페이지 구현 및 데이터 로직 개선

### ✅ 진행 사항

- 상세 페이지 (`app/expressions/[id]/page.tsx`) 구현.
- 데이터 페칭 로직(`lib/expressions.ts`)을 리팩토링하여 환경 변수 미설정 시에도 우아하게 Mock 데이터로 Fallback 하도록 개선.
- Mock 데이터 분리 (`lib/mock-data.ts`).
- 메인 리스트 카드와 상세 페이지 연동.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `lib/expressions.ts`에서 환경 변수 체크를 제거했나?**

- **A.** 데이터 페칭 로직이 환경 설정에 의존하는 것은 관심사 분리에 위배됨. 대신 `try-catch` 패턴을 사용하여 Supabase 클라이언트 생성이나 요청 실패 시 자연스럽게 Mock 데이터로 대체하는 방식이 더 유연하고 코드 오염이 적다고 판단.

**Q. Mock 데이터는 왜 분리했나?**

- **A.** 메인 페이지와 상세 페이지, 그리고 Fallback 로직 등 여러 곳에서 Mock 데이터를 참조해야 하므로 `lib/mock-data.ts`로 중앙화하여 관리 효율성을 높임.

## 2025-12-30: Supabase 연동 및 메인 UI 구현

### ✅ 진행 사항

- Supabase 클라이언트 설정 (`@supabase/ssr`) 및 환경 변수 템플릿(`.env.local.example`) 생성.
- `createBrowserSupabase`, `createServerSupabase` 유틸리티 함수 구현 (명확한 명명 규칙 적용).
- `Expression` 타입 정의 및 `ExpressionCard` UI 컴포넌트 구현.
- 메인 페이지(`app/page.tsx`) 데이터 페칭 및 ISR(1시간) 적용.

### 💬 주요 Q&A 및 의사결정

**Q. 왜 `createClient` 대신 `createBrowserSupabase`, `createServerSupabase`를 사용하나?**

- **A.** Next.js 환경에서 브라우저와 서버용 클라이언트의 역할(쿠키 접근 등)이 명확히 다르며, 한 파일에서 두 클라이언트를 동시에 다룰 때의 이름 충돌 및 혼동을 방지하기 위함.

**Q. 데이터가 없을 때의 처리는?**

- **A.** 개발 초기 단계에서 UI 확인을 위해 Mock 데이터를 Fallback으로 사용하도록 구현하였으며, 실제 DB 데이터가 있을 경우 이를 우선적으로 보여줌.

## 2025-12-30: 프로젝트 초기 설정 (Project Initialization)

### ✅ 진행 사항

- Next.js 16 + Tailwind CSS + TypeScript 프로젝트 생성 (`speak-mango-en`).
- `src` 디렉토리 없는 구조 채택.
- 문서화 구조 수립 (`docs/` 폴더 내 컨텍스트, 히스토리, 워크스루).
- 데이터베이스 스키마 설계 (Supabase) 및 n8n 워크플로우 가이드 작성.

### 💬 주요 Q&A 및 의사결정

**Q. Next.js + n8n 아키텍처는 적합한가?**

- **A.** 매우 적합함. n8n이 백엔드/데이터 파이프라인 역할을 담당하고, Next.js는 뷰어 역할에 집중하여 효율적임.

**Q. LLM 비용 문제 (OpenAI vs Gemini)?**

- **A.** **Google Gemini 2.5 Flash**를 사용하기로 결정.
- 이유: OpenAI는 유료(종량제)인 반면, Gemini는 강력한 무료 티어(일 1,500회 요청 무료)를 제공하여 초기 운영 비용을 0원으로 만들 수 있음.

**Q. 프로젝트 폴더 구조는?**

- **A.** 최신 Next.js 트렌드에 맞춰 `src` 폴더 없이 루트에 `app`을 두는 구조로 진행.
