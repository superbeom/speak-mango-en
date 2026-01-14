# Next.js Analytics 구현 가이드 (실전편)

> **작성일**: 2026-01-14  
> **프로젝트**: Speak Mango EN  
> **목적**: Next.js 16+ App Router 프로젝트에 Google Analytics 4를 처음부터 구현하는 실전 가이드

## 개요

이 문서는 실제 프로젝트에서 GA4를 구현한 과정을 단계별로 기록한 것입니다. 다른 Next.js 프로젝트에서도 동일한 방식으로 적용할 수 있습니다.

## 전제 조건

- Next.js 16+ (App Router)
- TypeScript
- 환경 변수 설정 가능 (`.env.local`)

## Phase 1: 기본 설정 및 인프라 구축

### 1.1 GA4 계정 설정

**단계:**

1. https://analytics.google.com/ 접속
2. **관리** (톱니바퀴 아이콘) 클릭
3. **계정 만들기**
   - 계정 이름: 프로젝트/회사명 (예: "Speak Mango")
4. **속성 만들기**
   - 속성 이름: 구체적인 서비스명 (예: "Speak Mango EN")
   - 시간대: Asia/Seoul
   - 통화: KRW 또는 USD
5. **데이터 스트림 설정**
   - 플랫폼: 웹
   - 웹사이트 URL: 프로덕션 URL
   - 스트림 이름: "Production"
6. **측정 ID 복사**: `G-XXXXXXXXXX` 형식

**결과물:**

- GA4 계정 및 속성 생성 완료
- 측정 ID 발급 완료

---

### 1.2 디렉토리 구조 설계

**권장 구조:**

```
analytics/
├── index.ts              # 유틸리티 함수 (이벤트 추적)
├── AnalyticsProvider.tsx # Provider 컴포넌트 (페이지 뷰 자동 추적)
└── ExpressionViewTracker.tsx # 표현 상세 조회 추적 컴포넌트
```

**이유:**

- ✅ 독립성: Analytics는 완전한 기능 모듈로 루트 레벨에 배치
- ✅ 확장성: 향후 다른 analytics 관련 파일 추가 용이
- ✅ 일관성: `components/`, `hooks/`와 동일한 레벨의 독립 모듈

---

### 1.3 Analytics 유틸리티 함수 작성

**파일**: `analytics/index.ts`

**핵심 기능:**

1. **타입 정의** (함수 오버로드)

   ```typescript
   declare global {
     interface Window {
       gtag?: {
         (command: "js", date: Date): void;
         (
           command: "config",
           targetId: string,
           config?: Record<string, any>
         ): void;
         (
           command: "event",
           eventName: string,
           params?: Record<string, any>
         ): void;
       };
       dataLayer?: any[];
     }
   }
   ```

2. **환경 감지**

   ```typescript
   export const isAnalyticsEnabled = (): boolean => {
     return (
       typeof window !== "undefined" &&
       !!GA_MEASUREMENT_ID &&
       process.env.NODE_ENV === "production"
     );
   };
   ```

3. **기본 추적 함수**

   - `trackPageView(path, title, lang)`: 페이지 뷰 추적
   - `trackEvent(eventName, properties)`: 커스텀 이벤트 추적
   - `trackConversion(type, value, properties)`: 전환 추적

4. **타입 안전한 헬퍼 함수**
   - `trackExpressionView(params)`
   - `trackExpressionClick(params)`
   - `trackAudioPlay(params)`
   - 등등...

**주의사항:**

- ⚠️ 개발 환경에서는 콘솔 로그만 출력
- ⚠️ 프로덕션에서만 실제 GA4로 전송

---

### 1.4 AnalyticsProvider 컴포넌트 작성

**파일**: `analytics/AnalyticsProvider.tsx`

**핵심 로직:**

```typescript
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

export default function AnalyticsProvider({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // ⚠️ 중요: document.title이 설정될 때까지 대기
    const timer = setTimeout(() => {
      trackPageView(url, document.title, lang);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, lang]);

  return <>{children}</>;
}
```

**핵심 포인트:**

- ✅ `'use client'` 지시어 필수 (클라이언트 컴포넌트)
- ✅ `setTimeout` 100ms: Next.js가 `document.title`을 설정할 시간 확보
- ✅ Cleanup 함수: 메모리 누수 방지

---

### 1.5 Layout에 통합

**파일**: `app/layout.tsx`

**1단계: Import 추가**

```typescript
import Script from "next/script";
import AnalyticsProvider from "@/analytics/AnalyticsProvider";
import { GA_MEASUREMENT_ID } from "@/analytics";
```

**2단계: GA4 스크립트 추가**

```tsx
<body>
  {/* Google Analytics 4 */}
  <Script
    strategy="afterInteractive"
    src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
  />
  <Script
    id="google-analytics"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{
      __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}', {
          send_page_view: false
        });
      `,
    }}
  />

  <AnalyticsProvider lang={locale}>
    <ExpressionProvider>{children}</ExpressionProvider>
  </AnalyticsProvider>
</body>
```

**Provider 순서:**

- ✅ `AnalyticsProvider`가 최상위 (독립적)
- ✅ 다른 Provider들은 내부에 중첩

---

### 1.6 환경 변수 설정 (개발/프로덕션 분리)

**파일**: `.env.local`

```bash
# Analytics (Google Analytics 4)
# Development Environment
NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID=G-개발용ID

# Production Environment
NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID=G-프로덕션ID
```

**작동 방식:**

- 개발 환경 (`yarn dev`): `NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID` 사용
- 프로덕션 환경 (`yarn build` + 배포): `NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID` 사용
- `lib/analytics/index.ts`에서 `process.env.NODE_ENV`에 따라 자동 선택

**주의:**

- ⚠️ `NEXT_PUBLIC_` 접두사 필수 (클라이언트에서 접근)
- ⚠️ `.env.local`은 `.gitignore`에 포함되어야 함
- ✅ 환경별로 자동 전환되므로 안전하고 실수 방지

---

### 1.7 타입 에러 해결

**문제**: `gtag("js", new Date())` 타입 에러

**원인**: 단일 함수 시그니처로는 `Date` 타입 처리 불가

**해결**: 함수 오버로드 사용

```typescript
// ❌ 잘못된 방식
gtag?: (command: "config" | "event" | "js", targetId: string, ...) => void;

// ✅ 올바른 방식 (함수 오버로드)
gtag?: {
  (command: "js", date: Date): void;
  (command: "config", targetId: string, config?: Record<string, any>): void;
  (command: "event", eventName: string, params?: Record<string, any>): void;
};
```

---

## Phase 2: 페이지 뷰 추적 테스트

### 2.1 개발 환경 테스트

**1단계: 개발 서버 실행**

```bash
yarn dev
```

**2단계: 브라우저 콘솔 확인**

1. 브라우저에서 `http://localhost:3000` 접속
2. F12 (개발자 도구) 열기
3. Console 탭 선택
4. 페이지 이동 시 로그 확인:

```
[Analytics] Page view: { path: '/', title: 'Speak Mango - 하루 한 문장 영어 회화', lang: 'ko' }
```

**3단계: 여러 페이지 테스트**

- 홈 → 상세 페이지
- 검색 기능
- 카테고리 필터
- 태그 클릭

각 페이지 이동마다 콘솔에 로그가 출력되어야 합니다.

---

### 2.2 프로덕션 환경 테스트 (선택사항)

**개발 환경에서 GA4 전송 활성화:**

`lib/analytics/index.ts` 파일의 `isAnalyticsEnabled` 함수를 임시로 수정:

```typescript
// 임시로 개발 환경에서도 활성화
export const isAnalyticsEnabled = (): boolean => {
  return typeof window !== "undefined" && !!GA_MEASUREMENT_ID;
  // process.env.NODE_ENV === 'production' 조건 제거
};
```

**GA4 실시간 보고서 확인:**

1. https://analytics.google.com/ 접속
2. 보고서 > 실시간 선택
3. 페이지 이동하면서 실시간 데이터 확인

**⚠️ 테스트 후 반드시 원래대로 복구!**

---

### 2.3 일반적인 문제 해결

#### 문제 1: Title이 빈 값으로 추적됨

**증상**: 콘솔에 `title: ""` 표시

**원인**: `AnalyticsProvider`가 렌더링될 때 `document.title`이 아직 설정되지 않음

**해결**: `setTimeout` 100ms 추가

```typescript
const timer = setTimeout(() => {
  trackPageView(url, document.title, lang);
}, 100);
```

---

#### 문제 2: Title 중복 (예: "snap up | Speak Mango | Speak Mango")

**원인**:

- `layout.tsx`의 `title.template`: `%s | Speak Mango`
- i18n 파일의 `expressionTitle`: `{expression} | {serviceName}`

**해결**: i18n 파일에서 `| {serviceName}` 제거

```typescript
// 수정 전
expressionTitle: "{expression} | {serviceName}";

// 수정 후
expressionTitle: "{expression}";
```

**적용 파일**: 모든 언어 파일 (ko.ts, en.ts, ja.ts, es.ts, fr.ts, de.ts, ru.ts, zh.ts, ar.ts)

---

## Phase 3: 이벤트 추적 구현 (예정)

### 3.1 컴포넌트별 이벤트 추가

**대상 컴포넌트:**

- `ExpressionCard.tsx`: 표현 클릭, 공유 버튼 (카드 통합)
- `DialogueAudioButton.tsx`: 오디오 재생
- `DialogueSection.tsx`: 학습 모드 전환
- `FilterBar.tsx`: 필터/검색
- `Tag.tsx`: 태그 클릭
- `ShareButton.tsx`: 소셜 공유

**구현 예시:**

```typescript
import { trackExpressionClick } from "@/lib/analytics";

const handleClick = () => {
  trackExpressionClick({
    expressionId: id,
    expressionText: expression,
    category: category,
    source: "home_feed",
  });
};
```

---

## 체크리스트

### Phase 1: 기본 설정

- [x] GA4 계정 및 속성 생성
- [x] 측정 ID 발급
- [x] `lib/analytics/` 디렉토리 구조 생성
- [x] `lib/analytics/index.ts` 유틸리티 함수 작성
- [x] `lib/analytics/AnalyticsProvider.tsx` 컴포넌트 작성
- [x] `app/layout.tsx`에 GA4 스크립트 추가
- [x] `app/layout.tsx`에 AnalyticsProvider 통합
- [x] `.env.local`에 측정 ID 추가
- [x] 타입 에러 해결 (함수 오버로드)

### Phase 2: 페이지 뷰 추적

- [x] 개발 서버에서 콘솔 로그 확인
- [x] Title 빈 값 문제 해결 (setTimeout)
- [x] Title 중복 문제 해결 (i18n 수정)
- [ ] GA4 실시간 보고서 확인 (선택사항)

### Phase 3: 이벤트 추적

- [x] 표현 관련 이벤트 추가
  - [x] `ExpressionCard.tsx`: 표현 클릭 추적
  - [x] `ExpressionViewTracker.tsx`: 표현 상세 조회 추적
- [x] 오디오 관련 이벤트 추가
  - [x] `DialogueAudioButton.tsx`: 오디오 재생 추적
  - [x] `DialogueAudioButton.tsx`: 오디오 재생 완료 추적
- [x] 학습 모드 이벤트 추가
  - [x] `DialogueSection.tsx`: Blind Listening, Translation Blur 토글 추적
- [x] 탐색 이벤트 추가
  - [x] `FilterBar.tsx`: 카테고리 필터 추적
  - [x] `SearchBar.tsx`: 검색 실행 추적
  - [x] `Tag.tsx`: 태그 클릭 추적 (source 구분)
  - [x] `RelatedExpressions.tsx`: 관련 표현 클릭 추적
- [x] 공유 이벤트 추가
  - [x] `ShareButton.tsx`: 공유 버튼 클릭 및 완료 추적 (Native API & Clipboard)

## 참고 자료

### 공식 문서

- [GA4 시작 가이드](https://support.google.com/analytics/answer/9304153)
- [GA4 이벤트 측정](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Next.js Analytics 통합](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)

### 내부 문서

- `docs/analytics/analytics_guide.md`: 전체 Analytics 계획 및 이벤트 설계
- `docs/analytics/implementation_guide.md`: 단계별 구현 가이드 (본 문서)
- `analytics/index.ts`: 유틸리티 함수 구현
- `analytics/AnalyticsProvider.tsx`: Provider 컴포넌트
- `analytics/ExpressionViewTracker.tsx`: 표현 조회 추적 컴포넌트

---

## 다른 프로젝트 적용 시 주의사항

### 1. 환경 변수명 확인

- `NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID`: 개발용 측정 ID
- `NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID`: 프로덕션용 측정 ID
- `NEXT_PUBLIC_` 접두사 필수 (클라이언트에서 접근)

### 2. Provider 순서

- Analytics는 최상위에 배치 (독립적)
- 다른 Context Provider와 분리

### 3. 개발/프로덕션 분리

- 개발: 콘솔 로그만
- 프로덕션: GA4 전송

### 4. 타입 안전성

- 모든 이벤트에 타입 정의
- 파라미터 검증

### 5. 성능 최적화

- `setTimeout` 최소화
- 불필요한 리렌더링 방지

---

**작성자**: AI Agent  
**최종 수정**: 2026-01-14  
**버전**: 1.0  
**상태**: Phase 2 완료
