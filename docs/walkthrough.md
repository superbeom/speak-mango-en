# Implementation Walkthrough

> 각 버전별 구현 내용과 변경 사항을 상세히 기록합니다. 최신 버전이 상단에 옵니다.

## v0.12.36: Additional Performance Optimization & Documentation (2026-01-21)

### 1. Goal (목표)

- 번들 사이즈 감소, 서버 요청 중복 제거, 클라이언트 렌더링 최적화 등 추가적인 성능 개선 사항을 적용하고, 이를 문서화하여 향후 개발 가이드라인으로 삼습니다.

### 2. Implementation (구현)

#### A. Request Deduplication (`lib/expressions.ts`)

- **Problem**: 한 페이지 렌더링 과정에서 `getExpressions` 등의 DB 조회 함수가 여러 컴포넌트(메타데이터, 페이지 본문 등)에서 중복 호출될 경우 불필요한 DB 부하 발생.
- **Solution**: `React.cache()`로 DB 조회 함수들을 래핑하여, **동일한 요청(Request) 수명 주기 내**에서는 결과값을 메모리에 캐싱하고 재사용하도록 구현. (Per-request Memoization).

#### B. Client-Side Rendering Protection (`components/ExpressionCard.tsx`)

- **Problem**: 리스트 렌더링 시 부모 컴포넌트의 상태 변화로 인해 수많은 자식 카드 컴포넌트가 불필요하게 리렌더링됨.
- **Solution**:
  - `React.memo`를 적용하여 Props가 변경되지 않은 카드의 리렌더링을 방지.
  - `displayName`을 명시하여 React DevTools 하이드레이션 매칭 디버깅 용이성 확보.

#### C. Layout Rendering Optimization (`app/globals.css`)

- **Problem**: 수천 개의 `ExpressionCard`가 있는 긴 리스트(Long List) 렌더링 시 브라우저의 레이아웃 계산 비용 증가.
- **Solution**:
  - `content-visibility: auto` 속성을 적용한 `@utility content-visibility-auto` 클래스 생성.
  - 화면 밖(Off-screen)에 있는 요소의 렌더링(페인팅 및 히트 테스팅)을 브라우저가 생략하도록 하여 초기 로딩 및 스크롤 성능 개선.

#### D. Skeleton Optimization (`components/ui/Skeletons.tsx`)

- **Problem**: 로딩 상태에서 부모 컴포넌트가 리렌더링될 때 스켈레톤 컴포넌트까지 불필요하게 리렌더링되는 문제.
- **Solution**:
  - `ExpressionList.tsx`의 인라인 스켈레톤을 `SkeletonExpressionList` 컴포넌트로 분리.
  - `SkeletonCard`, `SkeletonNavbar` 등 모든 스켈레톤 컴포넌트에 `React.memo`를 적용하여 정적 UI의 리렌더링 비용 제거.

#### E. Data Fetching Strategy (`hooks/usePaginatedList.ts`)

- **Problem**: 기존 `usePaginatedList`는 `useState`, `useEffect`로 상태를 수동 관리하며, `ExpressionContext`에 리스트 전체(`items`)를 저장하여 메모리 비효율 발생.
- **Solution**:
  - `useSWRInfinite` 도입하여 데이터 페칭, 캐싱, 페이지네이션 상태 관리 자동화.
  - `ExpressionContext`는 `size`(페이지 수)와 `scrollPosition`만 관리하도록 경량화하여, 뒤로가기 시 복원 로직 단순화.

### 3. Result (결과)

- ✅ **Optimization**: 런타임 성능 향상.
- ✅ **Standardization**: `project_context.md`에 성능 최적화 표준 가이드라인 수립.
- ✅ **Modernization**: `useSWR` 도입으로 데이터 페칭 로직의 유지보수성 및 확장성(실시간 갱신 등) 확보.

## v0.12.35: Code Audit & Performance Optimization (2026-01-21)

### 1. Goal (목표)

- Vercel React Best Practices를 기준으로 생성된 감사 보고서(`audit_report.html`)의 개선 권고 사항을 적용하여, 애플리케이션의 성능(Latency)과 데이터베이스 확장성(Scalability)을 확보합니다.

### 2. Implementation (구현)

#### A. Server-Side Parallel Data Fetching (`app/quiz/page.tsx`)

- **Problem**: `getI18n()`(Dictionary)과 `getRandomExpressions()`(DB)가 `await`로 순차 실행되어 Waterfall 발생.
- **Solution**: `Promise.all`을 사용하여 두 비동기 요청을 병렬로 시작.
  ```typescript
  const [{ dict }, expressions] = await Promise.all([
    getI18n(),
    getExpressions({ ...filters, limit: 10 }),
  ]);
  ```

#### B. Regex Optimization (`lib/quiz.ts`)

- **Problem**: `parseQuizQuestion` 함수 내부의 반복문(`options.forEach`) 안에서 정규식 리터럴(`/^([A-C])\.\s+(.*)/`)이 반복적으로 사용됨. (이론적으로 JS 엔진이 최적화할 수 있으나, 명시적인 호이스팅이 권장됨).
- **Solution**: 정규식을 모듈 최상단 상수(`OPTION_REGEX`)로 호이스팅하여 컴파일 비용 제거.

#### C. Database RPC for Scalability (`database/functions/create_random_expressions.sql`)

- **Problem**: 기존 `getRandomExpressions`는 클라이언트(Node.js)에서 전체 ID를 가져온 후 셔플링하는 방식이었음. 데이터가 늘어날수록 메모리와 네트워크 부하가 급증(O(N))하는 구조.
- **Solution**: DB 내부에서 효율적으로 샘플링을 수행하는 Stored Procedure 도입.
  - **Function**: `speak_mango_en.get_random_expressions(limit_cnt)`
  - **Logic**: `ORDER BY random() LIMIT N`을 DB 엔진 내부에서 수행하여, 클라이언트로는 딱 필요한 N개의 행만 전송.

### 3. Result (결과)

- ✅ **Latency**: 퀴즈 페이지 초기 로딩 속도 단축 (병렬 처리).
- ✅ **Scalability**: 표현 데이터가 수만 건으로 늘어나도 퀴즈 생성 성능이 일정하게 유지됨 (RPC).
- ✅ **Documentation**:
  - `database` 폴더 구조를 `migrations`와 `functions`로 분리하여 관리 체계 개선.
  - `project_context.md`에 성능 최적화 가이드라인(Server-side Caching, Client-side Memoization 등)을 명문화하여 향후 개발 기준 수립.

## v0.12.34: Random Quiz Feature (2026-01-20)

### 1. Goal (목표)

- 수동적인 읽기/듣기 학습을 넘어, 사용자가 능동적으로 참여할 수 있는 **퀴즈 게임** 기능을 도입합니다.
- 매번 새로운 랜덤 문제 세트를 제공하여 반복 학습을 유도합니다.

### 2. Implementation (구현)

#### A. Random Data Fetching (`lib/expressions.ts`)

- **Logic**:
  1. 전체 ID 목록을 가볍게 조회 (`select("id")`).
  2. 요청된 개수(예: 10개)만큼 ID를 무작위 추출 (Set 활용).
  3. 추출된 ID로 `in` 쿼리를 수행하여 상세 정보 조회.
  4. DB 조회 결과의 순서 편향을 막기 위해 클라이언트 측에서 한 번 더 셔플링.

#### B. Quiz Game UI (`components/quiz/QuizGame.tsx`)

- **Progressive UX**:
  - **Playing State**: 상단 진행률 바(Progres Bar)와 함께 문제 표시. 선택지 클릭 시 즉시 정답/오답 피드백(Color Coded) 및 팁 노출.
  - **Summary State**: 10문제 완료 후 점수와 함께 전체 문제 리뷰 리스트 제공. 틀린 문제와 맞은 문제를 한눈에 확인하고 상세 페이지로 이동 가능.

#### C. Analytics Integration

- 사용자 참여도를 측정하기 위해 단계별 이벤트 추적:
  - `quiz_start`: 게임 시작 시점.
  - `quiz_answer`: 각 문제 풀이 시점 (정답 여부 포함).
  - `quiz_complete`: 게임 완료 및 최종 점수 기록.

### 3. Result (결과)

- ✅ **Gamification**: 단순 암기보다 재미있는 학습 경험 제공.
- ✅ **Dynamic Content**: Next.js `force-dynamic`을 활용하여 접속할 때마다 항상 새로운 문제 세트 보장.

## v0.12.33: Verification Logic Refinement & Sync (2026-01-20)

### 1. Goal (목표)

- 로컬 검증 스크립트(`verify_db_data.js`)와 n8n 워크플로우 검증 스크립트(`11_validate_content.js`, `07_validate_content_v2.js`) 간의 로직 파편화를 해결하고, 더 엄격하고 정확한 퀴즈 패턴 검증을 적용합니다.

### 2. Implementation (구현)

- **Strict Quiz Pattern Logic**:
  - **Pattern 1**: 질문에 영어가 2글자 이상 없으면 -> 선택지는 반드시 **영어**여야 합니다. (예외 없음)
  - **Pattern 2/3**: 질문에 영어가 2글자 이상 있으면 -> 선택지는 반드시 **타겟 언어**여야 합니다.

- **Regex Synchronization**:
  - `ideographic_full_stop` (`/。/`) 정규식이 n8n 스크립트에서 누락되어 있던 문제를 발견하고 추가했습니다.
  - 이제 `includes("。")` 대신 `REGEX.ideographic_full_stop.test(text)`를 사용하여 일관되게 CJK 마침표를 검출합니다.

- **Allowed Lists Strategy**:
  - `ALLOWED_NAMES` (예: Sarah, Mike)와 `ALLOWED_ENGLISH_TERMS` (예: iOS, eBay) 리스트를 도입했습니다.
  - 이를 통해 질문(Question) 내에 이러한 고유명사가 포함되어 있어도 "영어 문장"으로 오판(Pattern 2/3)하지 않도록 예외 처리하여, Pattern 1(질문에 영어 없음 -> 선택지는 영어) 검증의 정확도를 높였습니다.

### 3. Result (결과)

- ✅ **Consistency**: 로컬에서 `node verification/verify_db_data.js`를 돌렸을 때와 n8n 실서버 검증 결과가 100% 일치하게 되었습니다.
- ✅ **Accuracy**: 모호한 퀴즈 패턴을 허용하지 않음으로써 사용자에게 혼란을 줄 수 있는 저품질 퀴즈 생성을 방지합니다.

## v0.12.32: Performance Optimization (2026-01-19)

### 1. Goal (목표)

- 감사 보고서에서 식별된 주요 성능 병목 현상(Waterfall Data Fetching, Client-side Re-rendering)을 해결하여 사용자 경험을 개선합니다.

### 2. Implementation (구현)

#### A. Server-Side Waterfall Removal (`app/page.tsx`)

- **Problem**: `getI18n()` 호출이 완료된 후에야 `getExpressions()`가 실행되는 직렬(Serial) 구조로 인해 TTFB가 지연됨.
- **Solution**: 의존성이 없는 비동기 작업을 `Promise.all`로 병렬화.
  - 헤더에서 로케일을 먼저 추출(`getLocale`)한 후, 딕셔너리 로딩과 DB 쿼리를 동시에 실행.
  ```typescript
  const locale = await getLocale(); // Fast header read
  const [{ dict }, expressions] = await Promise.all([
    getI18n(), // Dictionary load
    getExpressions({ ...filters, locale }), // DB Query
  ]);
  ```

#### B. Client-Side Rendering Optimization (`components/DialogueSection.tsx`)

- **Problem**: 오디오 재생 시 `playingIndex` 상태가 변경될 때마다 부모 컴포넌트(`DialogueSection`)와 모든 자식 컴포넌트(`DialogueItem`)가 리렌더링됨.
- **Solution**:
  1.  **React.memo Application**: `DialogueItem`을 메모이제이션하여 Props 변경이 없는 경우 리렌더링 방지.
  2.  **Stable Callbacks**: 부모에서 자식으로 전달되는 함수들(`onPlay`, `onEnded`, `onToggleReveal`)을 `useCallback`으로 감싸고, 인라인 함수 정의를 제거.
      - **Index Prop Injection**: `DialogueItem`에 `index` prop을 명시적으로 전달하여, 콜백 함수가 인덱스를 직접 참조하지 않고 인자로 받도록 구조 변경 (함수 재생성 방지).
  3.  **Optimization Logic**: `handleEnglishClick` 내부의 중복 `setState` 호출 제거 및 조건문 로직 단순화.

#### C. Database Search Optimization (`lib/expressions.ts`)

- **Problem**: 9개 언어의 `meaning` 필드를 JSON 연산자(`->>`)로 조회하는 방식은 인덱스를 타지 못해 Full Table Scan을 유발함.
- **Solution**:
  1.  **Generated Column**: `meaning` JSONB 데이터를 단일 문자열로 변환하여 저장하는 `meaning_text` 컬럼 추가.
  2.  **Trigram Index**: `pg_trgm` 확장 모듈을 활용하여 `meaning_text`에 GIN 인덱스 생성.
  3.  **Double-Filter Strategy**:
      - **Phase 1 (Index Scan)**: `meaning_text`로 후보군을 고속 검색 (Trigram Index 활용).
      - **Phase 2 (Recheck)**: `meaning->>locale`로 현재 언어 일치 여부를 정밀 검사 (Table Filter).
      - `and(meaning_text.ilike... , meaning->>locale.ilike...)` 구문을 사용하여 **인덱스의 속도**와 **로케일 필터링의 정확성(노이즈 제거)**을 모두 확보.

#### D. Scroll Event Optimization (`components/FilterBar.tsx`)

- **Problem**: 스크롤 및 리사이즈 이벤트가 빈번하게 발생하여 메인 스레드 점유율 증가.
- **Solution**:
  1.  **requestAnimationFrame**: 브라우저 렌더링 주기에 맞춰 이벤트 핸들링 주파수 조절.
  2.  **useCallback Refinement**: `checkScroll` 함수를 메모이제이션하고 `useEffect` 의존성에 포함하여 리렌더링 시 불필요한 리스너 재생성 방지.
  3.  **Auto-Cleanup**: `useRef`로 rAF ID를 추적하여 언마운트 시 안전하게 취소.

### 3. Result (결과)

- ✅ **TTFB Improvement**: 병렬 데이터 페칭으로 초기 로딩 속도 향상.
- ✅ **Rendering Efficiency**: 오디오 재생 중 불필요한 리렌더링이 제거되어 저사양 기기에서의 반응성 개선.
- ✅ **Query Performance**: 검색 쿼리 성능을 최적화하면서도 정확한 로케일 결과를 제공 (Cross-language Noise 제거).
- ✅ **Scroll Smoothness**: `FilterBar` 스크롤 이벤트에 `rAF` 및 `useCallback`을 적용하여 메인 스레드 부하를 줄이고 리스너 안정성 확보.

## v0.12.31: Agent Skills Integration & Codebase Audit (2026-01-19)

### 1. Goal (목표)

- AI 에이전트에게 Vercel의 전문적인 개발 지식(Skills)을 주입하여 코드 품질을 상향 평준화.

### 2. Implementation (구현)

- **Agent Skills Setup**:
  - `npx add-skill vercel-labs/agent-skills`를 실행하여 두 가지 핵심 스킬 설치.
  - **Vercel React Best Practices**: 45개 성능 최적화 규칙 (Waterfall 방지, 번들 최적화 등).
  - **Web Design Guidelines**: 접근성 및 UI/UX 표준 가이드라인.
  - 관련 설정 파일들을 `.agent/skills/`에 저장하고 가이드 문서(`docs/agent_skills_guide.md`) 작성.

- **Git Configuration**:
  - `.gitignore`에 에이전트 공급자별 설정 폴더(`.gemini`, `.claude` 등)를 추가하여 레포지토리 정리.

### 3. Result (결과)

- ✅ **Intelligence**: 에이전트가 Vercel 엔지니어링 팀의 노하우를 참고하여 코딩하도록 업그레이드.
- ✅ **Visibility**: 현재 프로젝트의 기술적 부채와 최적화 포인트를 명확히 파악.

## v0.12.30: Marketing Studio & Image Automation (2026-01-18)

### 1. Goal (목표)

- SNS 마케팅을 위한 고화질 표현 카드 이미지를 손쉽게 생성하고, 이를 대량으로 자동화하는 시스템 구축.
- 콘텐츠 길이에 상관없이 브랜드 로고와 디자인 일관성을 유지.

### 2. Implementation (구현)

- **Marketing Studio (`app/(admin)/studio/[id]`)**:
  - **Route**: `/studio/[id]` (Basic Auth 보호).
  - **Features**: 고화질(Retina) 캡처, 다양한 배경(Brand, Gradient) 및 비율(1:1, 9:16) 지원.
  - **Layout**: `flex-col` 기반의 유동적 레이아웃으로 콘텐츠 길이에 따라 로고 위치 자동 조정.
  - **Static Mode**: `ExpressionCard`에 `isStatic` prop을 추가하여 애니메이션 없이 깔끔한 렌더링 지원.

- **Automation Script (`scripts/generate_studio_images.py`)**:
  - **Language Support**: `--lang` 옵션을 통해 특정 언어(예: `ko`)로 번역된 카드 이미지 생성 가능.
  - **Environment Flexibility**: `STUDIO_APP_URL` 환경 변수를 지원하여 로컬(`localhost`)뿐만 아니라 원격/스테이징 서버에서도 캡처 가능.
  - **Proxy Middleware**: `proxy.ts`에서 `lang` 쿼리 파라미터를 감지하여 강제로 로케일을 전환해주는 기능 활용.

### 3. Result (결과)

- ✅ **Productivity**: 수동 캡처 없이 수천 개의 고화질 마케팅 에셋을 단 몇 분 만에 생성.
- ✅ **Localization**: 전 세계 사용자를 위한 다국어 마케팅 이미지 확보.
- ✅ **Consistency**: 모든 이미지에서 브랜드 가이드라인(여백, 로고 위치)을 준수.

## v0.12.29: 서버 환경 변수 최적화 (2026-01-18)

### 1. Goal (목표)

- 하드코딩된 로컬 호스트 주소(`http://localhost:3000`)를 제거하고 환경 변수를 통해 유연성을 확보.

### 2. Implementation (구현)

- **Script Update**: `generate_studio_images.py`에서 `STUDIO_APP_URL` 환경 변수를 우선적으로 사용하도록 변경.
- **Default Fallback**: 환경 변수가 없을 경우 안전하게 `http://localhost:3000`을 사용.

### 3. Result (결과)

- ✅ **Flexibility**: CI/CD 파이프라인이나 다른 포트에서 실행 중인 서버에서도 스크립트 실행 가능.

## v0.12.28: Database Integrity Reinforcement (2026-01-17)

### 1. Goal (목표)

- 데이터베이스 레벨에서 `expression` 컬럼의 중복을 원천적으로 차단하여 데이터 무결성을 보장합니다.

### 2. Implementation (구현)

- **Unique Constraint**:
  - `speak_mango_en.expressions` 테이블의 `expression` 컬럼에 `UNIQUE` 제약 조건을 추가했습니다.
  - 이제 동일한 영어 표현이 입력되려 할 경우 DB 레벨에서 에러를 반환합니다.
- **Migration Script (`014_add_unique_constraint_to_expression.sql`)**:
  - `ALTER TABLE ... ADD CONSTRAINT unique_expression UNIQUE (expression);` 구문을 사용하여 제약 조건을 적용했습니다.

### 3. Result (결과)

- ✅ **Data Integrity**: 중복 데이터 발생 가능성이 완전히 제거되었습니다.
- ✅ **Performance**: Unique 인덱스 생성으로 인해 정확한 일치 검색 성능이 향상될 수 있습니다.

## v0.12.27: n8n V3 Specific Expression Workflow (2026-01-17)

### 1. Goal (목표)

- 랜덤 생성이 아닌, **특정 표현(Specific Expression)**을 지정하여 콘텐츠를 생성하는 새로운 워크플로우(V3) 도입.
- 사용자가 카테고리를 일일이 지정하지 않아도 AI가 문맥을 파악하여 **자동 분류(Auto-Classification)**하도록 개선.

### 2. Implementation (구현)

- **Pick Expression Node (`02_pick_expression_v3.js`)**:
  - `expression` 만을 포함하는 JSON 객체 반환 (`{ expression: "Let's get real" }`).
  - 외부 소스(DB, 파일 등)와 연동하기 쉬운 구조.

- **Specific Generator Prompt (`03_gemini_specific_expression_generator_prompt_v3.txt`)**:
  - **Classify Step**: 입력된 표현을 분석하여 6가지 카테고리 중 최적의 것을 선택하도록 지시.
  - **Inject**: 선택된 도메인/카테고리 정보를 JSON 결과에 포함.
  - 나머지 콘텐츠 생성 로직(Meaning, Dialogue, Quiz)은 V2와 동일한 품질 기준 유지.

- **Documentation (`optimization_steps_v3.md`)**:
  - V3 아키텍처 및 단계별 설정 가이드 작성.

### 3. Result (결과)

- ✅ **Targeting**: 원하는 표현을 정확히 DB에 추가 가능.
- ✅ **Automation**: 카테고리 태깅 업무 자동화.

## v0.12.26: n8n 데이터 정제 및 검증 강화 (2026-01-17)

### 1. Problem (문제)

- **Unwanted Punctuation**: Gemini가 프롬프트 지침을 무시하고 `meaning` 필드 문장 끝에 마침표(.)를 붙이거나, 의미 구분을 위해 세미콜론(;)을 사용하여 데이터 일관성을 저해.
- **Strict Validation Failure**: 기존 검증 로직은 이러한 포맷 오류를 즉시 에러로 처리하여, 간단한 수정으로 해결 가능한 데이터도 폐기되는 비효율 발생.

### 2. Solution (해결)

- **2-Step Validation Pipeline**:
  1.  **Cleanup (정제)**: 검증 전에 자동으로 문장 부호를 수정하는 단계 추가.
  2.  **Verify (검증)**: 정제 후에도 규칙을 위반하는 경우에만 에러 처리.

### 3. Implementation (구현)

- **New n8n Node (`Cleanup Meaning`)**:
  - `n8n/expressions/code_v2/06_cleanup_meaning.js` 작성.
  - 로직:
    - 문장 끝 및 **중간**의 모든 마침표(.) 제거 (말줄임표 `...`는 정규식으로 보존).
    - 세미콜론(;)을 프로젝트 표준 구분자 `·`로 일괄 치환.

- **Enhanced Validation (`Validate Content`)**:
  - `verification/verify_db_data.js` 및 n8n 검증 스크립트 업데이트.
  - `Target Language`뿐만 아니라 `English(en)`의 meaning 필드도 검증 대상에 포함.
  - 마침표나 세미콜론이 발견되면 즉시 에러(`Must not contain...`) 처리하여 엄격한 품질 기준 유지.

### 4. Result (결과)

- ✅ **Data Quality**: 문장 부호 오류가 0%로 감소하고 일관된 포맷 유지.
- ✅ **Efficiency**: 단순 포맷팅 오류로 인한 재생성 비용 절감.

## v0.12.25: Audio Context 리팩토링 (2026-01-17)

### 1. Problem (문제)

- **iOS Sequential Playback Failure**: 아이폰에서 '전체 듣기' 실행 시, 첫 번째 곡만 재생되고 두 번째 곡부터는 진행되지 않음.
- **Cause**: iOS Safari는 사용자 제스처(터치) 없는 `AudioContext` 생성을 차단함. 기존 로직은 매 곡마다 새로운 Context를 생성했기 때문에, 자동으로 넘어가는 두 번째 곡부터는 막힘.

### 2. Solution (해결)

- **Singleton AudioContext**: 앱 전체에서 **단 하나의 AudioContext**만 생성하여 공유하는 방식으로 변경.
- **React Context Migration**: 기존 `lib/audio.ts` 유틸리티를 `context/AudioContext.tsx` 리액트 컨텍스트로 승격.

### 3. Implementation (구현)

- **Global Provider (`context/AudioContext.tsx`)**:
  - `AudioContext` 인스턴스를 `useRef`로 관리하며 싱글턴 패턴 보장.
  - `getAudio()` 함수 제공: 이미 생성된 Context가 있다면 재사용.
  - 한국어 주석으로 내부 로직 상세 설명.

- **Hook Consumption (`components/DialogueAudioButton.tsx`)**:
  ```tsx
  const { getAudio } = useAudio();
  // ...
  const initializeWebAudio = useCallback(() => {
    const ctx = getAudio(); // 공유된 Context 가져오기
    // ...
  }, []);
  ```

### 4. Result (결과)

- ✅ **iOS Compatibility**: '전체 듣기' 시 끊김 없이 다음 곡 재생 성공.
- ✅ **Architecture**: 오디오 로직이 React Lifecycle 내에서 안전하게 관리됨.
- ✅ **Performance**: 불필요한 AudioContext 생성 오버헤드 제거.

## v0.12.24: JSON-LD Schema 최적화 (2026-01-16)

### 1. Goal (목표)

- `meta keywords` 태그 외에, Schema.org 구조화 데이터를 통해 검색 엔진에게 명확한 키워드 컨텍스트 제공.
- `layout.tsx`와 `page.tsx` 간의 스키마 중복 제거 및 역할 분리.

### 2. Implementation (구현)

- **Schema Injection**:
  - `Dict.meta.keywords` -> `WebSite` Schema (`layout.tsx`)
  - `generateSeoKeywords(...)` -> `LearningResource` Schema (`page.tsx`)

- **Schema Consolidation**:
  - `layout.tsx`: `Organization` + `WebSite` (Global Identity & Keywords)
  - `page.tsx`: `WebSite` (Local `SearchAction` only)

### 3. Result (결과)

- ✅ **Rich Snippets**: 검색 결과에서 더 풍부한 정보 노출 가능성 증대.
- ✅ **Logical Structure**: 전역 설정과 지역 설정의 명확한 분리.

## v0.12.23: SEO 설정 구조 리팩토링 (2026-01-16)

### 1. Goal (목표)

- SEO 설정(`suffixes`, `categories`)이 정적 메타데이터(`meta`) 내부에 혼재되어 있는 구조를 개선.
- 설정의 역할(Metadata vs SEO Strategy)을 명확히 분리.

### 2. Implementation (구현)

- **Locale Structure Change**:

```typescript
// Before
export const en = {
  meta: {
    seo: { ... },
    categories: { ... }
  }
}

// After
export const en = {
  meta: { ... }, // Pure Metadata
  seo: {         // SEO Strategy Config
    expressionSuffixes: [...],
    meaningSuffixes: [...],
    categories: { ... }
  }
}
```

- **Logic Update (`lib/seo.ts`)**:
  - `dict.meta.seo` -> `dict.seo`로 참조 경로 변경.

### 3. Result (결과)

- ✅ **Separation of Concerns**: 메타데이터와 SEO 전략 설정 분리.
- ✅ **Type Safety**: 명확한 구조로 타입 추론 및 유지보수 용이.

## v0.12.22: 동적 카테고리 키워드 현지화 (2026-01-16)

### 1. Goal (목표)

- "Travel" 카테고리인 경우 한국어 사용자에게는 "여행 영어", 영어 사용자에게는 "Travel English"와 같이 현지화된 키워드를 제공.
- 정적인 "Business English" 키워드가 모든 페이지에 중복되는 문제 해결.

### 2. Implementation (구현)

- **Locale Config (`i18n/locales/*.ts`)**:

```typescript
categories: {
  daily: "생활 영어",
  business: "비즈니스 영어",
  travel: "여행 영어",
  // ...
}
```

- **Dynamic Lookup (`lib/seo.ts`)**:

```typescript
// Before: 하드코딩된 if-else
if (category === "slang") ...

// After: Dictionary Lookup
const localizedCategory = dict.categories[category.toLowerCase()];
if (localizedCategory) keywords.push(localizedCategory);
```

### 3. Result (결과)

- ✅ **Relevance**: 콘텐츠와 정확히 일치하는 카테고리 키워드 노출.
- ✅ **Localization**: 사용자 언어에 맞는 자연스러운 키워드 ("쇼핑 영어" vs "Shopping English").
- ✅ **Efficiency**: 중복 키워드 제거로 SEO 가중치 분산 방지.

## v0.12.21: 동적 SEO 키워드 최적화 (2026-01-16)

### 1. Goal (목표)

- "Feel Blue 뜻", "우울하다 영어로"와 같이 사용자가 실제로 검색하는 고관여 키워드(Long-tail)를 자동으로 메타데이터에 포함.
- `meta keywords`의 한계를 넘어 실제 콘텐츠에 키워드를 노출하여 검색 엔진 가시성 확보.

### 2. Implementation (구현)

- **Locale Config (`ko.ts`)**:

```typescript
seo: {
  expressionSuffixes: ["뜻", "의미", "해석"],
  meaningSuffixes: ["영어로", "영어 표현", "영어로 어떻게"]
}
```

- **Shared SEO Logic (`lib/seo.ts`)**:
  - `generateSeoKeywords` 유틸리티 함수로 분리하여 메타데이터와 UI에서 재사용.

- **Visible Keywords (`KeywordList.tsx`)**:
  - `app/expressions/[id]/page.tsx` 하단에 `KeywordList` 컴포넌트 추가.
  - 관련 키워드를 시각적 태그로 노출 (White Hat SEO).

## v0.12.20: iOS 잠금 화면 메타데이터 구현 (2026-01-16)

### 1. Problem (문제)

- 아이폰 잠금 화면에서 오디오 재생 시, 앱 아이콘 대신 Vercel 로고(기본 파비콘)가 표시됨.

### 2. Solution (해결)

- `DialogueAudioButton.tsx`에 `Media Session API`를 도입하여 OS 레벨의 미디어 제어 UI에 명시적인 메타데이터를 제공.
- `DialogueItem`에서 텍스트 정보를 props로 전달받아 제목으로 설정.

### 3. Implementation (구현)

```typescript
// components/DialogueAudioButton.tsx

useEffect(() => {
  if (isPlaying && "mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Dialogue Audio",
      artist: "Speak Mango",
      artwork: [
        {
          src: "/assets/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });
    // ... setActionHandler ...
  }
}, [isPlaying, togglePlay]);
```

## v0.12.19: iOS Safari 오디오 로딩 픽스 (2026-01-16)

### 1. Problem

**iOS Safari Regression (Deadlock)**:

- 이전 버전(v0.12.18)의 "Lazy Loading"(`audio.load()` 제거)이 Safari의 Web Audio API 버그를 트리거함.
- `MediaElementSource`가 연결된 상태에서 오디오 엘리먼트가 초기화되지 않으면(`readyState: 0`), Safari는 로딩을 진행하지 않고 멈춰버림(Infinite Loading).

### 2. Solution

**Hybrid Loading (Revert Lazy Loading + Keep Lazy Init)**:

1.  **Revert Resource Loading**: `useEffect` 내 `audio.load()` 복구.
    - 페이지 로드 시 메타데이터를 즉시 로드하여 Safari의 Deadlock 조건을 회피.
2.  **Keep Lazy Init**: `AudioContext` 초기화는 여전히 `togglePlay`(클릭) 시점에 수행.
    - 카카오톡 등 인앱 브라우저의 Autoplay 정책 우회 유지.

### 3. Implementation

```tsx
// components/DialogueAudioButton.tsx

useEffect(() => {
  const audio = new Audio(getStorageUrl(audioUrl));
  audio.preload = "metadata";
  audioRef.current = audio;

  // Safari fix: Web Audio 연결 전 리소스 초기화 필수
  audio.load();
}, [audioUrl]);
```

### 4. Result

- ✅ **Safari**: 무한 로딩 해결, 정상 재생.
- ✅ **In-App Browsers**: 여전히 정상 재생 (Lazy Init 덕분).

## v0.12.18: 오디오 재생 최적화 - Lazy Loading 및 안정성 강화 (2026-01-16)

### 1. Problem

**iOS 호환성 및 리소스 효율성 문제**:

- `preload="metadata"` 설정에도 불구하고 컴포넌트 마운트 시 `audio.load()`가 호출되어 즉시 네트워크 요청 발생.
- 데이터 로드 이벤트 핸들러에서 Web Audio API를 초기화하려다 iOS의 Autoplay 정책에 걸려 실패 가능성 존재.
- `useCallback` 의존성 배열에 상태값이 포함되어 불필요한 함수 재생성 및 리렌더링 발생.

### 2. Solution

**True Lazy Loading & Stable Handler**:

1. **Lazy Resource Loading**: `useEffect`에서 `audio.load()` 제거. 재생 버튼 클릭 시에만 로딩 시작.
2. **Lazy API Initialization**: Web Audio API 초기화를 `togglePlay` 내부(사용자 클릭 시점)로 이동.
3. **Latest Ref Pattern**: `useRef`를 사용하여 상태값을 조회함으로써 `togglePlay` 함수를 안정화(Stable)함.

### 3. Implementation

#### A. Resource Loading 최적화

```tsx
useEffect(() => {
  const audio = new Audio(getStorageUrl(audioUrl));
  audio.preload = "metadata"; // 메타데이터만 미리 로드
  audioRef.current = audio;
  // audio.load() 삭제: 사용자가 누르기 전까지 요청 금지
}, [audioUrl]);
```

#### B. Lazy Initialization (User Gesture)

```tsx
const togglePlay = useCallback(async () => {
  // 클릭 시점에 초기화 (iOS 정책 준수)
  if (!audioContextRef.current) {
    initializeWebAudio();
  }

  // 로딩 상태 피드백
  if (audioRef.current.readyState < 2) {
    setIsLoading(true);
  }

  await audioRef.current.play(); // 이때 브라우저가 로딩 시작
}, []);
```

#### C. Performance Optimization

```tsx
// 최신 상태를 Ref에 저장
const latestValues = useRef({ isPlaying, isPaused, ... });

useEffect(() => {
  latestValues.current = { isPlaying, isPaused, ... };
});

// 의존성 없는 Stable Handler
const togglePlay = useCallback(async () => {
  const current = latestValues.current; // Ref에서 최신 값 조회
  // ...
}, []); // 의존성 배열 비움
```

### 4. Result

- ✅ **iOS 호환성**: 인앱 브라우저 및 Safari에서 완벽한 재생 보장.
- ✅ **데이터 절약**: 사용자가 듣지 않는 오디오는 다운로드하지 않음.
- ✅ **성능 향상**: 불필요한 리렌더링 및 함수 재생성 제거.

## v0.12.17: 인앱 브라우저 오디오 호환성 개선 (2026-01-15)

### 1. Problem

**카카오톡 공유 링크에서 오디오 무한 로딩 (Android vs iOS 차이)**:

- **증상 1**: 카카오톡으로 공유한 링크 접속 시 오디오가 계속 '로딩 중' 상태로 표시
- **증상 2 (Android)**: 첫 페이지에서는 안 되지만, 다른 표현 클릭 후 뒤로가기하면 정상 작동
- **증상 3 (iOS)**: Android 해결책 적용 후에도 iOS에서는 여전히 무한 로딩 표시
- **증상 4 (iOS 디버깅)**: `loadstart` 이벤트는 발생하지만 `loadeddata` 이벤트가 발생하지 않음
- **범위**: 일반 브라우저(Chrome, Safari)에서는 정상 작동, 인앱 브라우저에서만 발생
- **영향**: 사용자가 첫 접속 시 오디오를 재생할 수 없어 핵심 기능 사용 불가

### 2. Solution

**범용적인 폴백 메커니즘 + AudioContext 활성화 + iOS Safari 대응 (Web Audio API 지연 초기화)**:

- Web Audio API 초기화 실패 시 자동으로 기본 HTML5 Audio로 폴백
- User Agent 감지 대신 try-catch 기반 접근으로 모든 인앱 브라우저 자동 대응
- **Android**: AudioContext 생성 시 즉시 `resume()` 호출 시도
- **iOS Safari**: Web Audio API 초기화를 `loadeddata` 이벤트 후로 지연 + 사용자 클릭 시점에서 `resume()` 호출
- 볼륨 증폭은 포기하되 재생 기능은 보장

### 3. Implementation

#### A. Web Audio API 폴백 로직

**File**: `components/DialogueAudioButton.tsx`

**Before** (인앱 브라우저 감지 방식):

```tsx
// User Agent로 일일이 감지
const isInAppBrowser =
  userAgent.includes("kakaotalk") ||
  userAgent.includes("naver") ||
  // ... 계속 추가 필요

if (!isInAppBrowser) {
  // Web Audio API 초기화
}
```

**After** (try-catch 폴백 방식):

```tsx
let webAudioInitialized = false;

try {
  const ctx = new AudioContext();

  // 인앱 브라우저 autoplay 정책 대응: AudioContext를 즉시 resume
  if (ctx.state === "suspended") {
    ctx.resume().catch((e) => {
      console.warn("AudioContext resume failed:", e);
    });
  }

  const gainNode = ctx.createGain();
  const source = ctx.createMediaElementSource(audio);
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  gainNode.gain.value = 2.0; // 볼륨 증폭
  webAudioInitialized = true;
} catch (e) {
  console.warn(
    "Web Audio API initialization failed, using basic HTML5 Audio.",
    e,
  );
}

// 실패 시 기본 오디오 사용
if (!webAudioInitialized) {
  audio.volume = 1.0; // 최대 볼륨
}
```

#### B. AudioContext 활성화 로직

**첫 페이지 로딩 문제**:

```
카카오톡 링크 클릭 (첫 접속)
  ↓
AudioContext 생성 (suspended 상태)
  ↓
사용자 인터랙션 없음
  ↓
createMediaElementSource() 실패 가능
  ↓
무한 로딩 🔄
```

**해결 방법**:

```tsx
const ctx = new AudioContext();

// 즉시 resume 호출
if (ctx.state === "suspended") {
  ctx.resume().catch((e) => {
    console.warn("AudioContext resume failed:", e);
  });
}
```

**해결 후**:

```
카카오톡 링크 클릭 (첫 접속)
  ↓
AudioContext 생성 (suspended)
  ↓
즉시 resume() 호출
  ↓
suspended → running 전환
  ↓
정상 작동 ✅
```

#### C. iOS Safari 대응 (Web Audio API 지연 초기화)

**iOS Safari의 추가 제약**:

- `AudioContext.resume()`도 **사용자 제스처 내에서만** 작동
- **오디오 로딩 전** `createMediaElementSource()` 호출 시 `loadeddata` 이벤트가 발생하지 않음
- 무한 로딩 표시 → 사용자가 클릭하지 않음 → 악순환

**해결 1: Web Audio API 초기화 지연**:

```tsx
// Before: 즉시 Web Audio API 초기화 (iOS에서 loadeddata 차단)
const audio = new Audio(url);
createMediaElementSource(audio); // ❌ 너무 빨라!

// After: loadeddata 후 Web Audio API 초기화
const audio = new Audio(url);

const handleLoadedData = () => {
  setIsLoading(false);

  // Initialize Web Audio API AFTER audio is loaded
  if (!audioContextRef.current) {
    initializeWebAudio(); // ✅ 로딩 후 초기화!
  }
};

const initializeWebAudio = () => {
  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(audioRef.current);
  // ... Web Audio API 설정
};
```

**해결 2: 사용자 클릭 시 AudioContext 활성화**:

```tsx
const togglePlay = useCallback(async () => {
  // iOS Safari requires this to be called within a user gesture
  if (audioContextRef.current?.state === "suspended") {
    try {
      await audioContextRef.current.resume();
    } catch (e) {
      // Silently fail on iOS, will be resumed on user gesture
    }
  }
  // ... 오디오 재생
}, []);
```

**동작 흐름**:

```
iOS Safari 첫 접속
  ↓
오디오 파일 로딩 시작
  ↓
loadeddata 이벤트 발생 ✅
  ↓
로딩 스피너 사라짐 ✅
  ↓
Web Audio API 초기화 (AudioContext suspended)
  ↓
사용자가 재생 버튼 클릭
  ↓
AudioContext.resume() 호출 (사용자 제스처 내)
  ↓
정상 재생 ✅
```

#### D. 무한 로딩 문제 해결

**기존 문제**:

```
Web Audio API 실패
  ↓
catch 블록에서 볼륨만 설정
  ↓
오디오 객체 초기화 실패
  ↓
canplaythrough 이벤트 미발생
  ↓
isLoading 상태 계속 true
  ↓
무한 로딩 🔄
```

**해결 후**:

```
Web Audio API 실패
  ↓
플래그만 false로 설정
  ↓
기본 HTML5 Audio 사용
  ↓
canplaythrough 이벤트 정상 발생
  ↓
isLoading → false
  ↓
정상 재생 ✅
```

### 4. Result

**호환성 개선**:

- ✅ 카카오톡 인앱 브라우저: 정상 재생
- ✅ 네이버 인앱 브라우저: 정상 재생
- ✅ 위챗, 왓츠앱, 라인 등: 자동 대응
- ✅ 일반 브라우저: 기존대로 볼륨 증폭 유지

**Trade-off**:

- 인앱 브라우저: 볼륨 1.0 (증폭 없음)
- 일반 브라우저: 볼륨 2.0 (증폭 유지)

**유지보수성**:

- 새로운 인앱 브라우저 출시 시 코드 수정 불필요
- User Agent 목록 관리 불필요

## v0.12.16: 검색 기능 개선 - 아이콘 클릭, 다국어, 중복 방지 (2026-01-15)

### 1. Problem

**검색 기능의 사용성 및 정확도 문제**:

- **아이콘 클릭 불가**: 돋보기 아이콘이 장식용으로만 사용됨
- **부정확한 검색 결과**: 한국어 사용자가 영어 검색어 입력 시 관련 없는 결과 표시
- **중복 요청**: 동일한 검색어 재검색 시 불필요한 네트워크 요청 발생
- **일관성 부족**: Enter 키와 돋보기 버튼의 동작이 다름

### 2. Solution

**4가지 개선 사항 구현**:

1.  **검색 아이콘 클릭 기능**: 아이콘을 버튼으로 변경하여 클릭 가능하게 함
2.  **로케일별 검색**: 현재 언어의 meaning 필드만 검색
3.  **중복 검색 방지**: useRef로 이전 검색어 추적 및 스킵
4.  **데이터베이스 인덱스**: GIN 및 Trigram 인덱스 추가

### 3. Implementation

#### A. 검색 아이콘 클릭 기능

**File**: `components/SearchBar.tsx`

**Before**:

```tsx
<Search className="absolute left-4 ..." />  {/* 장식용 */}
```

**After**:

```tsx
<button type="button" onClick={handleIconClick} aria-label="Search">
  <Search className="w-5 h-5 ..." />
</button>
```

#### B. 로케일별 검색

**File**: `lib/expressions.ts`

**Before** (9개 언어 모두 검색):

```typescript
query.or(
  `expression.ilike.%${term}%,` +
  `meaning->>en.ilike.%${term}%,` +
  `meaning->>ko.ilike.%${term}%,` +
  // ... 9개 언어
);
```

**After** (expression + 현재 로케일만):

```typescript
const locale = filters.locale || "en";
query.or(`expression.ilike.%${term}%,meaning->>${locale}.ilike.%${term}%`);
```

**로케일 전달**:

- `app/page.tsx`: locale을 getExpressions에 전달
- `ExpressionList.tsx`: filtersWithLocale 생성하여 페이지네이션에도 적용

#### C. 중복 검색 방지

**File**: `components/SearchBar.tsx`

```tsx
const previousSearchRef = useRef<string>(initialValue);

const executeSearch = useCallback(
  (searchValue: string) => {
    // 중복 검색 방지
    if (searchValue === previousSearchRef.current) {
      return;
    }
    previousSearchRef.current = searchValue;
    onSearch(searchValue);
  },
  [onSearch],
);
```

#### D. 데이터베이스 인덱스

**Indexes Added**:

1.  **GIN 인덱스** (JSONB meaning 필드):

    ```sql
    CREATE INDEX idx_expressions_meaning_gin
    ON speak_mango_en.expressions
    USING GIN (meaning);
    ```

2.  **Trigram 인덱스** (TEXT expression 필드):
    ```sql
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE INDEX idx_expressions_expression_trgm
    ON speak_mango_en.expressions
    USING GIN (expression gin_trgm_ops);
    ```

### 4. Result

**검색 정확도**:

- ✅ 한국어 브라우저: 한국어 meaning만 검색
- ✅ 영어 브라우저: 영어 meaning만 검색
- ✅ 관련성 높은 결과만 표시

**검색 성능**:

- ✅ 검색 범위 77% 감소 (9개 필드 → 2개 필드)
- ✅ GIN 인덱스로 JSONB 쿼리 가속화
- ✅ Trigram 인덱스로 ILIKE 쿼리 가속화
- ✅ 중복 요청 제거로 네트워크 부하 감소

**사용자 경험**:

- ✅ 돋보기 아이콘 클릭으로 검색 가능
- ✅ Enter 키와 아이콘 클릭 동작 일관성
- ✅ 빈 검색어로 검색 초기화 가능
- ✅ 동일 검색어 재검색 시 즉시 응답

## v0.12.15: SEO 개선 - JSON-LD 구조화된 데이터 추가 (2026-01-15)

### 1. Problem

**Google 검색 결과에 브랜드명 대신 도메인 주소 표시**:

- **Issue**: Google 검색 시 "Speak Mango" 대신 "speakmango.com" 표시
- **Comparison**: Apple은 "Apple"로 표시되지만, Speak Mango는 도메인 주소만 표시
- **Root Cause**: 구조화된 데이터(Structured Data) 부재로 Google이 브랜드를 인식하지 못함

### 2. Solution

**JSON-LD 형식의 Schema.org 구조화된 데이터 추가**:

1. **Organization Schema**: 브랜드 정보 (이름, 로고, 소셜 미디어)
2. **WebSite Schema**: 웹사이트 정보 (이름, URL, 지원 언어)
3. **SearchAction Schema**: 검색 기능 (홈페이지만)

### 3. Implementation

#### A. Global Schemas (`app/layout.tsx`)

**모든 페이지에 적용되는 전역 스키마**:

```tsx
// Organization Schema - 브랜드 정보
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Speak Mango",
  "url": BASE_URL,
  "logo": `${BASE_URL}/assets/logo.png`,
  "sameAs": []  // 향후 소셜 미디어 추가 예정
}

// WebSite Schema - 기본 정보 + 다국어 지원
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Speak Mango",
  "url": BASE_URL,
  "inLanguage": SUPPORTED_LANGUAGES  // 9개 언어
}
```

**Import 추가**:

```tsx
import { SUPPORTED_LANGUAGES } from "@/i18n";
```

#### B. Homepage Schema (`app/page.tsx`)

**검색 기능 스키마 (홈페이지만)**:

```tsx
// WebSite Schema with SearchAction
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Speak Mango",
  "url": BASE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${BASE_URL}/?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
}
```

**Why Homepage Only?**

- 검색 바는 홈페이지에만 존재
- 상세 페이지에는 검색 기능 없음
- 스키마는 실제 기능이 있는 페이지에만 배치

#### C. TypeScript Config (`tsconfig.json`)

**코드 품질 개선**:

```json
{
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

- 사용하지 않는 import 자동 감지
- 사용하지 않는 함수 매개변수 경고

### 4. Schema Organization Strategy

**전역 vs 페이지별 구분**:

| Schema Type                | Location                    | Purpose                  | Scope         |
| -------------------------- | --------------------------- | ------------------------ | ------------- |
| `Organization`             | `layout.tsx`                | 브랜드 정보 (이름, 로고) | 전역          |
| `WebSite` (basic)          | `layout.tsx`                | 사이트 정보 + 다국어     | 전역          |
| `WebSite` + `SearchAction` | `page.tsx`                  | 검색 기능                | 홈페이지만    |
| `LearningResource`         | `expressions/[id]/page.tsx` | 학습 콘텐츠              | 상세 페이지만 |

**Why This Structure?**

1. **전역 스키마** (`layout.tsx`):
   - 모든 페이지에 공통으로 적용
   - 브랜드 정보는 변하지 않음
   - 다국어 지원은 사이트 전체 속성

2. **페이지별 스키마**:
   - 실제 기능이 있는 페이지에만 추가
   - 검색 기능 → 홈페이지
   - 학습 콘텐츠 → 상세 페이지

### 5. Key Decisions

**Q1. 왜 WebSite 스키마가 layout.tsx와 page.tsx 둘 다에 있나?**

- **A**: 서로 다른 목적:
  - `layout.tsx`: 기본 정보 (`name`, `url`, `inLanguage`)
  - `page.tsx`: 검색 기능 (`potentialAction`)
  - Google은 동일한 `@type`의 스키마를 자동으로 병합

**Q2. inLanguage는 왜 전역에 설정했나?**

- **A**: 다국어 지원은 사이트 전체 속성:
  - 9개 언어 지원 (`SUPPORTED_LANGUAGES`)
  - Google이 각 언어별 검색 결과에서 적절하게 표시
  - 국제 SEO 개선

**Q3. SearchAction은 왜 홈페이지에만?**

- **A**: 검색 기능은 홈페이지에만 존재:
  - 상세 페이지에는 검색 바 없음
  - 스키마는 실제 기능만 설명해야 함
  - Google이 사이트 내 검색 박스를 검색 결과에 표시 가능

### 6. Expected Results

**Before**:

- ❌ Google 검색 결과: `speakmango.com`
- ❌ 브랜드 인식 없음
- ❌ 일반 웹사이트로 취급

**After** (Google 재크롤링 후):

- ✅ Google 검색 결과: `Speak Mango`
- ✅ 브랜드 신뢰도 향상
- ✅ Knowledge Graph 표시 가능성
- ✅ 검색 결과에 사이트 내 검색 박스 표시 가능

### 7. Verification Steps

1. **Rich Results Test**: https://search.google.com/test/rich-results
   - URL 입력 후 Organization 및 WebSite 스키마 인식 확인

2. **Google Search Console**:
   - "URL 검사" → "색인 생성 요청"
   - 빠른 크롤링 요청

3. **Live Search Results**:
   - 며칠 ~ 몇 주 후 Google 검색에서 확인
   - "Speak Mango" 또는 "speakmango.com" 검색

### 8. Future Improvements

**Social Media Integration**:

```json
"sameAs": [
  "https://twitter.com/speakmango",
  "https://facebook.com/speakmango",
  "https://instagram.com/speakmango",
  "https://linkedin.com/company/speakmango"
]
```

**Benefits**:

- Knowledge Graph 표시 가능성 증가
- 브랜드 신뢰도 향상
- 소셜 미디어와 메인 사이트 연결

### 9. Result

- ✅ **Organization Schema**: 브랜드 정보 제공
- ✅ **WebSite Schema**: 사이트 정보 + 다국어 지원
- ✅ **SearchAction**: 검색 기능 명시
- ✅ **TypeScript 품질**: 미사용 코드 자동 감지
- ✅ **SEO 개선**: Google이 "Speak Mango"를 브랜드로 인식 가능

## v0.12.14: i18n 언어팩 일관성 검증 스크립트 추가 (2026-01-15)

### 1. Problem

**i18n 언어 파일의 언어 일관성 보장 필요**:

- **Challenge**: 9개 언어 파일을 수동으로 관리하다 보면 다른 언어가 섞일 수 있음
- **Risk**: 한국어 파일에 일본어나 영어가 섞이는 경우
- **Need**: 자동화된 검증으로 언어 일관성 보장

### 2. Solution

**자동화된 언어 일관성 검증 스크립트 개발**:

1. **언어별 스크립트 검증**: 각 언어 파일이 해당 언어만 포함하는지 검증
2. **영어 누출 검사**: 비라틴 언어에서 소문자 영어 단어 차단
3. **템플릿 변수 허용**: 동적으로 치환되는 변수명 허용

### 3. Implementation

#### A. Validation Script Structure

**File**: `verification/verify_i18n_locales.js`

#### B. Validation Logic

**4-Step Process**:

1. **TypeScript 파일 파싱**: JSON 변환 또는 Fallback 메서드
2. **문자열 추출**: 모든 문자열 값 재귀적 추출
3. **금지된 스크립트 검사**: 언어별 금지 문자 검증
4. **영어 누출 검사**: 비라틴 언어만 소문자 영어 차단

**Smart English Inclusion Check**:

- ✅ **허용**: 대문자 시작 (Instagram, TikTok)
- ✅ **허용**: 허용 목록의 용어 (serviceName, expression)
- ❌ **차단**: 소문자 영어 단어 (hello, world)

## v0.12.13: 대화 성별-이름 일관성 검증 강화 및 문서 리팩토링 (2026-01-15)

### 1. Problem

**대화 데이터에서 성별-이름 불일치 발견**:

- **Expected**: Role A (여성) → Role B를 남성 이름(Mike/David)으로 호칭
- **Found**: Role A (여성) → Role B를 "Emily"(여성 이름)으로 호칭
- **Root Cause**: Gemini가 프롬프트의 성별-이름 규칙을 무시하고 대화 생성

**문서 유지보수 문제**:

- `optimization_steps.md`에 200+ 줄의 인라인 코드 블록
- 코드 변경 시 문서와 실제 파일 간 불일치 발생 가능

### 2. Solution

**두 가지 접근**:

1. **프롬프트 강화**: 성별-이름 일관성 규칙 명시
2. **검증 로직 추가**: 호격 패턴 기반 성별-이름 검증
3. **문서 리팩토링**: 인라인 코드 → 파일 참조

### 3. Implementation

#### A. Gemini Prompt Enhancement

**Files**:

- `n8n/expressions/code/08_gemini_content_generator_prompt.txt`
- `n8n/expressions/code_v2/04_gemini_master_generator_prompt_v2.txt`

**Added Section** (Dialogue & Roles - Name Usage & Gender Consistency):

- Role A (여성)는 Role B를 **남성 이름**(Mike/David)으로 호칭
- Role B (남성)는 Role A를 **여성 이름**(Sarah/Emily)으로 호칭
- 자기 소개와 상대방 언급은 허용
- 잘못된 예시와 올바른 예시 제공

#### B. Validation Logic Enhancement

**Files**:

- `n8n/expressions/code/10_validate_content.js`
- `n8n/expressions/code_v2/06_validate_content_v2.js`
- `verification/verify_db_data.js`

**Added Validation**:

호격 패턴 기반 성별-이름 일관성 검증 (4가지 패턴):

1. 문장 시작: `"Hey Mike"`, `"Guess what, Emily"`
2. 쉼표 뒤: `"..., Mike."`, `"..., Emily?"`
3. 이름 + 동사: `"Mike, how are you?"`
4. 이름 + 대명사: `"Emily, you..."`, `"Mike, your..."`

**Key Features**:

- 대소문자 구분 없이 검증
- 자기 소개(`"Hi, I'm Emily"`)는 허용
- 상대방 언급(`"You're Mike, right?"`)은 허용

#### C. Documentation Refactoring

**File**: `docs/n8n/expressions/optimization_steps.md`

**Changes**:

- 8개 단계의 인라인 코드 블록을 파일 참조로 변경
- 영향받은 단계: 4, 5, 8, 9, 10, 11, 12, 15

**Before**:

````markdown
### 8단계: Gemini Content Generator

- **Prompt**:
  ```text
  [200+ lines of inline prompt]
  ```
````

**After**:

```markdown
### 8단계: Gemini Content Generator

- **Prompt**: `n8n/expressions/code/08_gemini_content_generator_prompt.txt`의 내용을 사용합니다.
```

### 4. Key Learnings

1. **정교한 패턴 설계**: 단순 이름 포함 검사는 정상 케이스(자기 소개)도 에러로 잡음
2. **호격 패턴 분석**: 실제로 상대를 부르는 경우만 검증하도록 패턴 설계
3. **문서 유지보수**: 코드를 파일로 분리하면 문서 가독성과 유지보수성 향상
4. **일관성 보장**: v1과 v2 모두 동일한 규칙 적용으로 데이터 품질 보장

## v0.12.12: n8n Quiz Validation 강화 (2026-01-15)

### 1. Problem

**DB에서 잘못된 quiz 구조 발견**:

- **Expected**: `quiz: { question: string, answer: string }`
- **Found**: `quiz: { question: string, answer: string, options: string[] }`
- Gemini가 `question` 필드에 선택지를 넣지 않고 `options` 배열을 별도로 생성

### 2. Solution

**두 가지 접근**:

1. **Gemini 프롬프트 강화**: DB 구조 명시
2. **Validation 로직 강화**: 잘못된 구조 차단

### 3. Implementation

#### A. Gemini Prompt Update

**Files**:

- `n8n/expressions/code/08_gemini_content_generator_prompt.txt`
- `n8n/expressions/code_v2/04_gemini_master_generator_prompt_v2.txt`

**Added Rules** (Rule 10 - Strict Formatting & Validation Rules):

- **Rule 2**: Database Structure (CRITICAL) - quiz는 `question`과 `answer` 필드만 포함, `options` 필드 금지
- **Rule 3**: Options in Question Field - 선택지를 `question` 필드 안에 포함
- **Rule 4**: Format 예시 제공

#### B. Validation Logic Update

**Files**:

- `n8n/expressions/code/10_validate_content.js`
- `n8n/expressions/code_v2/06_validate_content_v2.js`
- `verification/verify_db_data.js`

**Added Checks**:

1. **`quiz.options` 필드 금지**: DB 구조 위반 시 에러
2. **`quiz.question` 내 선택지 필수**: A, B, C 선택지가 모두 포함되어야 함

### 4. Code Quality

**Validation Logic**:

```javascript
// 1. quiz.options 필드 금지
if (contentObj.quiz.options) {
  errors.push(
    `Content (${lang}).quiz must NOT have 'options' field. Options should be in 'question' field as "A. ...", "B. ...", "C. ...".`,
  );
}

// 2. quiz.question 내 선택지 A, B, C 필수
const hasOptionA = /\nA\.\s/.test(questionText) || /^A\.\s/.test(questionText);
const hasOptionB = /\nB\.\s/.test(questionText);
const hasOptionC = /\nC\.\s/.test(questionText);

if (!hasOptionA || !hasOptionB || !hasOptionC) {
  const missing = [];
  if (!hasOptionA) missing.push("A");
  if (!hasOptionB) missing.push("B");
  if (!hasOptionC) missing.push("C");
  errors.push(
    `Content (${lang}).quiz.question must contain all options (A, B, C). Missing: ${missing.join(
      ", ",
    )}`,
  );
}
```

### 5. Result

**Gemini 생성**:

- ✅ 올바른 quiz 구조로 생성하도록 명확히 지시
- ✅ `options` 필드 생성 방지

**Validation**:

- ✅ 잘못된 구조 즉시 차단
- ✅ 선택지 누락 감지
- ✅ 명확한 에러 메시지로 디버깅 용이

**Data Quality**:

- ✅ 향후 생성되는 모든 데이터는 올바른 구조 보장
- ⚠️ 기존 DB에 잘못된 구조가 있다면 수동 수정 필요

---

## v0.12.11: Google 검색 결과 로고 표시 (2026-01-15)

### 1. Problem

- Google 검색 결과에 로고 대신 **지구본 아이콘** 표시
- Schema.org Organization 마크업 누락

### 2. Solution

- **File**: `app/page.tsx`
- **Addition**: Schema.org Organization 구조화된 데이터 추가
  ```tsx
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Speak Mango",
    "url": "https://speakmango.com",
    "logo": "https://speakmango.com/assets/logo.png"
  }
  ```

### 3. Google Logo Requirements

- **형식**: PNG, JPG, SVG
- **크기**: 최소 112x112px (권장: 512x512px)
- **비율**: 정사각형 또는 1:1에 가까운 비율
- **현재 사용**: `/assets/logo.png` (1024x1024px)

**1024x1024 선택 이유**:

- 고해상도 디스플레이에서도 선명
- Google이 다양한 크기로 리사이징
- 권장 크기(512x512)의 2배로 미래 대비

### 4. Schema.org 타입 차이

**WebSite vs Organization**:

| 타입           | 목적                  | Google 활용              |
| -------------- | --------------------- | ------------------------ |
| `WebSite`      | 사이트 검색 기능 정의 | 사이트 내 검색 박스 표시 |
| `Organization` | 브랜드 로고/정보 정의 | 검색 결과에 로고 표시    |

**왜 둘 다 사용?**

- WebSite: 사이트 기능 (검색)
- Organization: 브랜드 정보 (로고)
- 함께 사용: 완전한 SEO 최적화

### 5. sameAs 속성

**정의**: 공식 소셜 미디어 프로필 URL 목록

**효과**:

- Knowledge Graph (지식 패널) 표시
- 브랜드 신뢰도 향상
- SEO 점수 개선

**추가 가능한 URL**:

```json
"sameAs": [
  "https://twitter.com/speakmango",
  "https://facebook.com/speakmango",
  "https://instagram.com/speakmango"
]
```

**현재**: 빈 배열 (소셜 미디어 생성 후 추가 예정)

### 6. Verification

- **Rich Results Test**: https://search.google.com/test/rich-results
- **Google Search Console**: URL 검사 → 색인 생성 요청
- **예상 시간**: 며칠 ~ 몇 주 (크롤링 후 반영)

### 7. Result

- ✅ **Schema.org Organization**: 로고 정보 제공
- ✅ **SEO 개선**: Google이 사이트 정보 정확히 인식
- ✅ **브랜드 강화**: 검색 결과에 로고 표시 예정

## v0.12.10: SEO 개선 - Canonical URL 추가 (2026-01-15)

### 1. Canonical URL 구현

- **File**: `app/page.tsx`
- **Addition**: `generateMetadata` 함수 추가
  ```tsx
  export async function generateMetadata(): Promise<Metadata> {
    return {
      alternates: {
        canonical: BASE_URL,
      },
    };
  }
  ```

### 2. Canonical URL이란?

- **정의**: "이 페이지의 정식 주소는 이것입니다"라고 검색 엔진에 알려주는 메타 태그
- **목적**: 같은 콘텐츠가 여러 URL로 접근 가능할 때 중복 방지
  - 예: `/?lang=ko`, `/?utm_source=facebook` 등
- **SEO 효과**: 검색 엔진이 어떤 URL을 색인할지 명확히 인식

### 3. Google Search Console 리디렉션 경고

- **경고 내용**: "리디렉션이 포함된 페이지" (`http://` → `https://`)
- **결론**: **정상이며 걱정 불필요**
  - HTTP → HTTPS 리디렉션은 보안을 위해 필수
  - Google도 최종 HTTPS 페이지를 정상 색인
  - Canonical URL 추가는 SEO 개선 효과 (리디렉션 해결 X)

### 4. Result

- ✅ **SEO 개선**: 홈 페이지 canonical URL 설정 완료
- ✅ **중복 방지**: 쿼리 파라미터가 있어도 정식 URL 명확
- ✅ **일관성**: 상세 페이지와 동일한 SEO 구조

## v0.12.9: PWA Meta Tag 업데이트 (2026-01-15)

### 1. Deprecation Fix

- **File**: `app/layout.tsx`
- **Change**: Meta tag 업데이트
  - **Before**: `<meta name="apple-mobile-web-app-capable" content="yes" />`
  - **After**: `<meta name="mobile-web-app-capable" content="yes" />`

### 2. Reason

- Chrome DevTools deprecation 경고 해결
- 표준화된 메타 태그로 업데이트
- 향후 브라우저 호환성 확보

### 3. Result

- ✅ **Deprecation 경고 제거**: DevTools에서 경고 사라짐
- ✅ **표준 준수**: 최신 PWA 표준 메타 태그 사용
- ✅ **기능 유지**: Standalone 모드 정상 작동

## v0.12.8: Open Graph 이미지 중앙 정렬 개선 (2026-01-15)

### 1. Layout Adjustment

- **File**: `app/opengraph-image.tsx`
- **Issue**: 로고와 텍스트가 오른쪽으로 치우쳐 보이는 문제
- **Solution**: CSS transform을 사용한 미세 조정
  - Container: `transform: translateX(-25px)`
  - Text: `transform: translateX(-15px)`

### 2. Result

- ✅ **시각적 균형**: 로고와 서비스명이 중앙에 정렬
- ✅ **소셜 미디어 최적화**: 공유 시 더 나은 썸네일 표시

## v0.12.7: Share 메시지 개선 (i18n) (2026-01-15)

### 1. i18n Message Update

- **Files**: 9개 언어 파일 (`i18n/locales/*.ts`)
- **Change**: `shareCopied` 메시지 개선
  - **Before**: "Link copied to clipboard!" / "링크가 클립보드에 복사되었습니다!"
  - **After**: "Shared successfully!" / "공유 완료!"

### 2. Reason

- ShareButton은 두 가지 방식으로 작동:
  - **Web Share API** (모바일): 네이티브 공유 다이얼로그
  - **Clipboard API** (데스크탑): 클립보드 복사
- 기존 메시지는 데스크탑에만 정확, 모바일에서는 부정확
- 두 방식 모두에 적합한 일반적인 메시지로 통일

### 3. Result

- ✅ **정확한 사용자 피드백**: 모바일/데스크탑 모두에서 정확한 메시지 표시
- ✅ **일관된 UX**: 플랫폼 무관하게 동일한 메시지 경험
- ✅ **9개 언어 지원**: 모든 언어에서 개선된 메시지 제공

## v0.12.6: Google Tag Manager 향후 고려사항 문서화 (2026-01-14)

### 1. Documentation Update

- **File**: `docs/product/future_todos.md`
  - Marketing & Analytics 섹션 신규 추가
  - Google Tag Manager (GTM) 도입을 선택적 개선사항으로 문서화

### 2. Key Points (GTM)

- **Current State**: GA4를 `gtag.js`로 직접 연동 중 (타입 안전, 명확)
- **GTM Adoption Criteria**:
  - 마케팅 도구 2개 이상 사용
  - 마케팅 팀 구성 (비개발자 태그 관리)
  - 빈번한 A/B 테스트
- **Conclusion**: 현재는 GTM 불필요, 향후 프로젝트 복잡도 증가 시 고려

### 3. Result

- ✅ **명확한 의사결정 프레임워크**: GTM 도입 시점 및 조건 문서화
- ✅ **조기 최적화 방지**: 현재 단일 도구 환경에서는 직접 연동이 최적
- ✅ **향후 가이드 제공**: 마케팅 도구 확장 시 참고 자료

## v0.12.5: 표현 카드 공유 버튼 통합 (2026-01-14)

### 1. Card Layout Redesign

- **Independent Share Button Positioning**:
  - ShareButton을 카드 우측 하단에 absolute 포지셔닝
  - `bottom-5 right-5` 위치로 고정하여 태그와 독립적으로 배치
  - Link 컴포넌트에 `relative` 추가하여 포지셔닝 컨텍스트 제공

### 2. Event Propagation Prevention

- **Robust Click Handling**:
  - ShareButton 내부: `e.preventDefault()` + `e.stopPropagation()`
  - ExpressionCard: `onClick={(e) => e.stopPropagation()}`
  - 카드 클릭(상세 페이지 이동)과 공유 버튼 클릭 완전 분리

### 3. UI/UX Improvements

- **Visual Hierarchy**:
  - 태그는 좌측에 자연스럽게 흐르도록 flex-wrap
  - 공유 버튼은 우측 하단 고정 위치로 시각적 균형 확보
  - compact variant로 공간 효율성 극대화

### 4. Result

- ✅ **카드 통합 완료**: 메인 페이지 및 관련 표현 섹션에서 바로 공유 가능
- ✅ **이벤트 분리**: 공유 버튼 클릭 시 페이지 이동 없이 공유 기능만 실행
- ✅ **일관된 UX**: 상세 페이지와 동일한 공유 경험 제공

## v0.12.4: Share 기능 구현 (Web Share API + Analytics) (2026-01-14)

### 1. ShareButton Component Implementation

- **Component**: `components/ShareButton.tsx` 생성
  - **Web Share API**: 모바일 환경에서 네이티브 공유 다이얼로그 지원
  - **Clipboard Fallback**: 데스크탑 환경에서 클립보드 복사 기능 제공
  - **Variant Support**: `default` (아이콘 + 텍스트) 및 `compact` (아이콘만) 모드 지원
  - **Event Propagation Prevention**: 카드 통합 시 이벤트 전파 방지 (`e.preventDefault()` + `e.stopPropagation()`)
  - **Analytics Integration**: `trackShareClick` 및 `trackShareComplete` 자동 호출

### 2. Toast Notification System

- **Component**: `components/ui/Toast.tsx` 생성
  - 재사용 가능한 독립 컴포넌트로 설계
  - `success` / `error` 타입 지원
  - Framer Motion 기반 애니메이션 (fade-in + slide-in)
- **Type System**: `types/toast.ts` 생성
  - `ToastType` 타입 정의
  - `TOAST_TYPE` 상수 정의 (`SUCCESS`, `ERROR`)
  - 중앙 집중식 타입 관리로 재사용성 향상

### 3. Share URL Generation

- **Utility**: `lib/utils.ts`에 `getShareUrl` 함수 추가
  - 표현 ID 기반 공유 URL 생성
  - UTM 파라미터 지원 (`utm_source=share`, `utm_medium=native`)
  - `BASE_URL` 상수 활용 (환경별 URL 자동 전환)

### 4. Analytics Tracking

- **Events**: `analytics/index.ts`
  - `trackShareClick`: 공유 버튼 클릭 추적
    - `shareMethod`: `"native"` (Web Share API) | `"copy_link"` (클립보드)
    - `sharePlatform`: `"native"` | `"clipboard"`
  - `trackShareComplete`: 공유 완료 추적
- **Integration**: ShareButton 내부에서 자동 호출
  - 네이티브 공유 성공 시: `sharePlatform: "native"`
  - 클립보드 복사 성공 시: `sharePlatform: "clipboard"`

### 5. Internationalization (i18n)

- **9개 언어 지원**: EN, KO, JA, ES, FR, DE, RU, ZH, AR
- **Translation Keys**:
  - `detail.share`: "Share" / "공유" / "共有" 등
  - `detail.shareCopied`: "Link copied!" / "링크 복사됨!" 등
  - `detail.shareFailed`: "Failed to share" / "공유 실패" 등
  - `card.share`, `card.shareCopied`, `card.shareFailed`: 카드용 동일 텍스트

### 6. UI Integration

- **Detail Page**: `app/expressions/[id]/page.tsx`
  - Tags & Source 섹션에 ShareButton 추가 (default variant)

### 7. Documentation Updates

- **Analytics Guide**: `docs/analytics/analytics_guide.md`
  - 공유 이벤트 섹션 업데이트 ("향후 구현" → "구현 완료")
  - `share_method` 및 `share_platform` 파라미터 정의 업데이트
- **Implementation Guide**: `docs/analytics/implementation_guide.md`
  - ShareButton 컴포넌트 추가
  - 공유 이벤트 체크리스트 완료 표시
- **Features List**: `docs/product/features_list.md`
  - Share 기능 상세 설명 추가 (모바일/데스크탑 동작 방식)
  - Analytics 섹션에서 Share 이벤트 완료 표시
- **Future Todos**: `docs/product/future_todos.md`
  - Social Share Button 섹션 삭제 (구현 완료)
- **Task**: `docs/task.md`
  - Phase 5 Analytics - Tracking (Share) 완료 표시

### 8. Result

- ✅ **Web Share API 구현**: 모바일에서 Instagram, Twitter, KakaoTalk 등 네이티브 앱으로 직접 공유 가능
- ✅ **Clipboard Fallback**: 데스크탑에서 클립보드 복사 + Toast 알림
- ✅ **Analytics 추적**: 공유 클릭 및 완료 이벤트 자동 추적
- ✅ **9개 언어 지원**: 모든 언어에서 공유 기능 사용 가능
- ✅ **재사용 가능한 Toast**: 향후 다른 기능에서도 Toast 컴포넌트 활용 가능

## v0.12.3: Analytics Phase 3 완료 (Audio Complete & Related Click) (2026-01-14)

### 1. Audio Complete Tracking

- **Implementation**: `DialogueAudioButton.tsx`의 `handleEnded` 함수에서 `trackAudioComplete` 호출
  - **Logic**: 오디오 재생이 끝까지 완료되었을 때만 이벤트 전송
  - **Sequential Play**: 전체 듣기 모드에서도 각 문장이 끝날 때마다 이벤트 발생

### 2. Related Expression Click Tracking

- **Implementation**: `RelatedExpressions.tsx`에 `trackRelatedClick` 추가
  - **Props**: `currentExpressionId` prop 추가하여 출발지(Source) 추적
  - **Action**: 관련 표현 카드 클릭 시 `from_expression_id`와 `to_expression_id` 전송
- **Result**: 추천 콘텐츠의 클릭률(CTR) 및 연관 탐색 패턴 분석 가능

### 3. Smart Tracking Logic (Duplicate Prevention)

- **Problem**: '전체 듣기' 실행 시 개별 재생(`audio_play`) 이벤트가 중복 발생하거나, 일시정지 후 재개 시 중복 집계되는 문제
- **Solution**:
  - **Sequential Flag**: `play(true)` 파라미터를 통해 순차 재생임을 명시하고 중복 추적 방지
  - **Resume Check**: `isPaused` 상태를 확인하여 일시정지 후 재개인 경우 이벤트 스킵

### 4. Documentation Updates

- **docs/product/features_list.md**: Phase 3 완료 상태 반영 (Audio Complete, Related Click)
- **docs/analytics/implementation_guide.md**: 체크리스트 업데이트
- **docs/analytics/analytics_guide.md**: 이벤트 구현 상태 업데이트

### 5. Result

- **Phase 3 완전 정복**: 기획된 10개 핵심 이벤트 중 공유(Share)를 제외한 모든 상호작용 추적 구현 완료
- **Data Completeness**: 단순 클릭뿐만 아니라 '완청(Complete)' 데이터까지 확보하여 콘텐츠 몰입도 분석 가능

## v0.12.2: Analytics Phase 3 완료 - 학습 모드, 필터, 검색, 태그 추적 (2026-01-14)

### 1. Learning Mode Toggle Tracking

- **Implementation**: `DialogueSection.tsx`에 `trackLearningModeToggle` 추가
  - **Blind Listening Mode**: Headphones 아이콘 클릭 시 `mode: "blind_listening"`, `action: "enable"/"disable"` 전송
  - **Translation Blur Mode**: Eye 아이콘 클릭 시 `mode: "translation_blur"`, `action: "enable"/"disable"` 전송
- **Logic**: 각 모드의 활성화/비활성화 상태 변화를 정확히 추적
- **Result**: 사용자의 학습 패턴 및 모드 사용률 분석 가능

### 2. Category Filter Tracking

- **Implementation**: `FilterBar.tsx`에 `trackFilterApply` 추가
  - 카테고리 버튼 클릭 시 `filterType: "category"`, `filterValue: cat` 전송
  - 중복 클릭 방지: 이미 선택된 카테고리 재클릭 시에만 "all"로 변경 이벤트 전송
- **Result**: 사용자의 카테고리 탐색 패턴 및 인기 카테고리 파악 가능

### 3. Search Tracking

- **Implementation**: `SearchBar.tsx`에 `trackSearch` 추가
  - 검색 제출 시 `searchTerm: value` 전송
  - 빈 검색어는 추적하지 않음 (`value.trim()` 체크)
- **Result**: 사용자 검색 의도 및 검색어 패턴 분석 가능

### 4. Tag Click Tracking

- **Implementation**: `Tag.tsx`에 `trackTagClick` 추가
  - **Props 확장**: `source` prop 추가 (`"card" | "detail" | "filter"`)
  - **Client Component**: `"use client"` 지시어 추가하여 클라이언트 컴포넌트화
  - **Source Distinction**:
    - `ExpressionCard.tsx`: `source="card"` 전달 (홈 피드 카드)
    - `app/expressions/[id]/page.tsx`: `source="detail"` 전달 (상세 페이지)
- **Result**: 태그 클릭이 발생하는 위치별 사용자 행동 패턴 분석 가능

### 5. Documentation Updates

- **docs/project_history.md**: Analytics Phase 3 완료 항목 추가 (Q&A, 구현 상세, 검증 방법)
- **docs/product/features_list.md**: Phase 3 이벤트 상태를 ⏳에서 ✅로 변경
- **docs/analytics/analytics_guide.md**: Phase 3 완료 상태 반영
- **docs/analytics/implementation_guide.md**: 체크리스트 및 디렉토리 구조 업데이트

### 6. Result

- **Phase 3 완료**: 7개 이벤트 추적 구현 완료
  - ✅ `expression_click`, `expression_view`
  - ✅ `audio_play`
  - ✅ `learning_mode_toggle` (Blind Listening, Translation Blur)
  - ✅ `filter_apply` (카테고리)
  - ✅ `search`
  - ✅ `tag_click` (source 구분)
- **향후 구현**: `audio_complete`, `related_click`, `share_click` 등

## v0.12.1: Analytics 모듈 재구성 및 Phase 3 이벤트 추적 구현 (2026-01-14)

### 1. Analytics Module Structure Reorganization

- **Directory Move**: `lib/analytics/` → `analytics/` (루트 레벨로 이동)
  - 독립된 모듈로 분리하여 발견 가능성 향상
  - Import 경로 단순화: `@/lib/analytics` → `@/analytics`
- **Comment Localization**: 모든 영어 주석을 한국어로 변환
  - `analytics/index.ts`: 12개 이벤트 함수 주석 한국어화
  - `analytics/AnalyticsProvider.tsx`: Provider 주석 한국어화
  - `analytics/ExpressionViewTracker.tsx`: Tracker 주석 한국어화
- **Import Path Updates**: 7개 파일의 import 경로 업데이트
  - `app/layout.tsx`
  - `app/expressions/[id]/page.tsx`
  - `components/ExpressionCard.tsx`
  - `components/DialogueAudioButton.tsx`
  - `analytics/index.ts`
  - `analytics/AnalyticsProvider.tsx`
  - `analytics/ExpressionViewTracker.tsx`

### 2. Phase 3: Component-Level Event Tracking Implementation

- **Expression Click Tracking** (`ExpressionCard.tsx`)
  - `trackExpressionClick()` 호출 추가
  - 파라미터: `expressionId`, `expressionText`, `category`, `source: "home_feed"`
  - 사용자가 홈 피드에서 표현 카드를 클릭할 때 자동 추적
- **Expression View Tracking** (`ExpressionViewTracker.tsx`)
  - 새로운 클라이언트 컴포넌트 생성
  - 표현 상세 페이지 로드 시 `trackExpressionView()` 자동 호출
  - 파라미터: `expressionId`, `category`, `lang`
  - 서버 컴포넌트(`page.tsx`)에서 사용 가능하도록 설계
- **Audio Play Tracking Infrastructure** (`DialogueAudioButton.tsx`)
  - Props 추가: `expressionId`, `audioIndex`, `playType`
  - 오디오 재생 시작 시 `trackAudioPlay()` 호출
  - 파라미터 조건부 전송 (props가 있을 때만)
  - 향후 `DialogueSection`에서 props 전달 필요

### 3. Documentation Updates

- **project_context.md**: 디렉토리 구조 업데이트
  - `lib/analytics/` 제거
  - `analytics/` 추가 (3개 파일 명시)

### 4. Result

- Analytics 모듈이 독립적이고 발견하기 쉬운 구조로 개선
- 모든 주석이 한국어로 통일되어 프로젝트 규칙 준수
- 핵심 사용자 상호작용 3가지 자동 추적 시작:
  1. 표현 카드 클릭 (홈 피드)
  2. 표현 상세 조회
  3. 오디오 재생 (인프라 구축)
- Phase 3 나머지 이벤트 추적을 위한 기반 마련

## v0.12.0: Analytics Implementation (Google Analytics 4) (2026-01-14)

### 1. GA4 Integration & Infrastructure

- **Module Structure**: `lib/analytics/` 폴더 생성 및 모듈화
  - `index.ts`: 타입 안전한 이벤트 추적 유틸리티 (12개 이벤트 함수)
  - `AnalyticsProvider.tsx`: 자동 페이지 뷰 추적 Provider
- **Environment-Based Configuration**: 개발/프로덕션 환경별 GA4 속성 자동 전환
  - 개발: `NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID` (Speak Mango EN (Dev))
  - 프로덕션: `NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID` (Speak Mango EN)
  - `process.env.NODE_ENV`에 따라 `lib/analytics/index.ts`에서 자동 선택
- **Provider Architecture**: `AnalyticsProvider`를 최상위에 배치하여 `ExpressionProvider`와 독립적으로 작동
- **Result**: 사용자 행동 분석 인프라 구축 완료, Phase 1-2 완료 (페이지 뷰 자동 추적)

### 2. Automatic Page View Tracking

- **Implementation**: `usePathname` + `useSearchParams` 훅으로 라우트 변경 감지
- **Title Synchronization**: `setTimeout` 100ms로 Next.js Metadata API가 `document.title`을 설정할 시간 확보
- **Result**: 모든 페이지 이동이 자동으로 GA4에 전송되며, 정확한 title과 lang 정보 포함

### 3. TypeScript Type Safety

- **Function Overloading**: `gtag` 함수의 타입 정의를 함수 오버로드로 구현하여 `Date` 객체 타입 에러 해결
  ```typescript
  gtag?: {
    (command: "js", date: Date): void;
    (command: "config", targetId: string, config?: Record<string, any>): void;
    (command: "event", eventName: string, params?: Record<string, any>): void;
  };
  ```
- **Event Helpers**: 12개의 타입 안전한 이벤트 추적 함수 (표현 클릭, 오디오 재생, 학습 모드 등)
- **Result**: 컴파일 타임에 이벤트 파라미터 검증, 런타임 에러 방지

### 4. i18n Title Duplication Fix

- **Problem**: `layout.tsx`의 `title.template` (`%s | Speak Mango`)과 i18n 파일의 `expressionTitle` (`{expression} | {serviceName}`)이 중복되어 `snap up | Speak Mango | Speak Mango` 형태로 표시
- **Solution**: 9개 언어 파일 모두에서 `expressionTitle`을 `{expression}`으로 수정
- **Result**: `snap up | Speak Mango` 형태로 정상 표시

### 5. Documentation

- **Analytics Guide** (`docs/analytics/analytics_guide.md`): 전체 Analytics 전략, 이벤트 설계, 지표 정의
- **Implementation Guide** (`docs/analytics/implementation_guide.md`): 다른 Next.js 프로젝트에서 재사용 가능한 실전 구현 가이드
- **Project Context Update**: `lib/analytics/` 구조와 `docs/analytics/` 문서를 `project_context.md`에 추가

### 6. Next Steps (Phase 3)

- 컴포넌트별 이벤트 추적 구현 예정:
  - `ExpressionCard.tsx`: 표현 클릭 추적
  - `DialogueAudioButton.tsx`: 오디오 재생 추적
  - `DialogueSection.tsx`: 학습 모드 전환 추적
  - `FilterBar.tsx`: 필터/검색 추적
  - `Tag.tsx`: 태그 클릭 추적

## v0.11.5: PWA iOS Splash Screen Fix (2026-01-13)

### 1. Explicit Head Injection (iOS Compatibility)

- **Problem**: Next.js Metadata API를 통한 `startupImage` 설정이 iOS PWA 환경에서 간헐적으로 무시되어 앱 실행 시 흰 화면이 노출되는 문제 발생.
- **Solution**: `layout.tsx`에 수동으로 `<head>` 태그를 구성하고 30여 개의 `<link rel="apple-touch-startup-image" ...>` 태그를 직접 주입하여 안정성 확보.
- **Result**: iOS 기기별 모든 해상도 및 방향(Portrait/Landscape)에서 스플래시 스크린 정상 동작 확인.

### 2. Standalone Mode Assurance

- **Meta Tag**: `apple-mobile-web-app-capable` 메타 태그를 수동 시스템에 추가하여, "홈 화면에 추가" 시 브라우저 UI 없이 독립형(Standalone) 앱으로 구동되도록 강제함.

## v0.11.4: Service Essentials Update (PWA Splash & Theme Color) (2026-01-13)

### 1. Dynamic Theme Color

- **Viewport Config**: Next.js의 `viewport` 설정을 통해 시스템 테마(Light/Dark)에 따라 브라우저 상단 바 색상을 동적으로 전환(`#ffffff` <-> `#0a0a0a`).
- **UX Improvement**: 다크 모드 사용자에게 눈부심 없는 일관된 시각적 경험 제공.

### 2. Complete PWA Asset Injection

- **Splash Screens**: `pwa-asset-generator`로 생성된 iOS 기기별 스플래시 스크린(Startup Image) 메타 태그 30여 개를 `layout.tsx`에 모두 주입.
- **Manifest**: `manifest` 파일 연결을 명시하여 PWA 설치 가능성 및 웹 앱 표준 준수 강화.

## v0.11.3: Dynamic OG Image Design & Metadata Polish (2026-01-13)

### 1. Dynamic OG Image Redesign (Expression Detail)

- **Visual Upgrade**: 메인 OG 이미지의 디자인 언어(White BG, Gradient Text, Logo Header)를 상세 페이지인 `app/expressions/[id]/opengraph-image.tsx`에도 적용하여 브랜드 일관성 확보.
- **Runtime Switch (Edge -> Node.js)**: 로컬 파일 시스템(`fs`)을 통해 고화질 로고(`logo.png`)와 폰트 파일(`inter-*.ttf`)을 직접 로드하기 위해 런타임 환경을 변경함.
- **Typography Hierarchy**:
  - **Service Name**: Inter Bold (700) + Gradient
  - **Expression**: Inter Black (900)
  - **Meaning**: Inter Medium (500)
  - 각 요소의 중요도에 따라 폰트 두께를 차등 적용하여 가독성 최적화.

### 2. i18n Metadata Optimization

- **Expression Description**: 9개 국어 로케일 파일에서 `expressionDesc` 템플릿 수정. 중복되는 `expression` 변수를 제거하고 `meaning`을 전면에 배치하여 검색 결과 및 소셜 공유 시 정보 전달력 강화.

## v0.11.2: 대화 생성 규칙 정교화 및 검증 로직 완화 (2026-01-13)

### 1. Dialogue Generation Rules (Gender & Names)

- **Gender Standardization**:
  - **Role A**: 여성 (Female) - Default: Sarah/Emily
  - **Role B**: 남성 (Male) - Default: Mike/David
- **Name Usage Strategy**:
  - **Flexible Rule**: "If using names"라는 조건을 추가하여, 대화의 자연스러운 흐름을 위해 필요한 경우에만 이름을 사용하도록 유도.
  - **American Preferred**: 이름을 사용할 때는 전형적인 미국식 이름을 사용하며, 한국식 이름 사용은 지양.

## v0.11.1: 검증 로직 완전 동기화 (Validation Parity) (2026-01-13)

### 1. Verification Script Sync

- **Strict Parity**: 로컬 검증 스크립트(`verification/verify_db_data.js`)를 n8n의 최신 검증 로직(`10_validate_content.js`)과 100% 일치시킴.
- **Rules Applied**:
  - **Dialogue Length**: 대화 턴수 2~4턴 강제.
  - **Quiz Consistency**: 퀴즈 선택지의 언어 혼용(영어+타겟어) 금지.
  - **Punctuation & Syntax**: 엄격한 문장 부호 및 태그 형식 검사.

## v0.11.0: n8n Workflow V2 최적화 - Single-Shot AI Generation (2026-01-13)

### 1. Single-Shot AI Architecture

- **통합 생성 (Consolidated Generation)**: 기존의 2단계(표현 선정 -> 콘텐츠 생성) 호출을 하나의 `Gemini Master Generator` 호출로 통합함.
- **성능 향상**: API 호출 횟수를 50% 절감하고, 네트워크 오버헤드를 제거하여 전체 생성 속도를 2배가량 향상시킴.
- **문맥 일관성**: 동일한 프롬프트 컨텍스트 내에서 표현 선정과 다국어 설명을 동시 수행하여, AI가 선정한 표현의 뉘앙스가 예문과 상황 설명에 더 정교하게 반영되도록 개선함.

### 2. Fail-Fast Validation Pipeline

- **검증 단계 전진 배치**: `Validate Content` 로직을 DB 중복 확인 및 ID 생성보다 앞단으로 이동함.
- **효율성 극대화**: 파싱 에러나 규격 미달 데이터가 발생할 경우 조기에 워크플로우를 중단하여, 불필요한 DB 쿼리와 Storage 요청을 방지함.
- **코드 최적화**: `06_validate_content.js` 내의 미사용 변수(`id`)를 제거하여 ESLint 경고를 해결하고 로직을 정제함.

### 3. Workflow Documentation Sync

- **1:1 매칭 가이드**: `docs/n8n/expressions/optimization_steps_v2.md`를 신규 작성하여, 워크플로우의 실제 노드 순서(1~15번)와 문서의 단계 설명(1~15단계)을 완벽하게 일치시킴으로써 운영 가독성을 높임.

## v0.10.1: 대화 턴수 검증 규칙 도입 (Dialogue Turn Length Validation) (2026-01-12)

### 1. Dialogue Length Validation

- **엄격한 턴수 제한**: n8n Code Node인 `10_validate_content.js`에 대화 턴수가 2~4턴 사이인지 검증하는 로직을 도입함.
- **문서 동기화**: `docs/n8n/expressions/optimization_steps.md`에 해당 검증 규칙을 명시하여 데이터 품질 기준을 현행화함.

## v0.10.0: V2 워크플로우 아키텍처 (개발 중) (2026-01-12)

> **⚠️ 상태: 개발 중 (In Development)**
> 이 V2 워크플로우는 현재 개발 중이며 아직 프로덕션 준비가 되지 않았습니다. 특히 `15_groq_tts_v2.js` 노드에 대한 검증이 필요합니다.

### 1. Fan-out 아키텍처 구현

- **병렬 처리 (Parallel Processing)**: `01_pick_category_v2.js`가 이제 여러 카테고리 아이템을 반환하여, 다양한 주제에 대한 콘텐츠 생성을 동시에 수행(Fan-out)할 수 있도록 개선됨.
- **컨텍스트 보존 (Context Preservation)**: `04_prepare_prompt_data_v2.js` 및 다운스트림 노드들이 다중 실행 브랜치를 올바르게 처리하고 병합할 수 있도록 업데이트됨.

### 2. 코드베이스 구조 재편 (V2)

- **전용 디렉토리 (Dedicated Directory)**: 모든 V2 전용 로직과 프롬프트를 `n8n/expressions/v2/`로 이동하여 안정적인 V1 워크플로우와 완전히 격리함.
- **파일 표준화**:
  - `01_pick_category_v2.js`
  - `12_validate_content_v2.js`: "Non-strict" 검증 구현 (실패 대신 필터링).
  - `15_groq_tts_v2.js`: **[검증 필요]** Groq API 제한 준수를 위한 배치 처리(10개 항목) 및 속도 제한(65초 대기) 구현.

### 3. 검증 로직 이원화 (Validation Logic Divergence)

- **V1 (Strict)**: 유효하지 않은 데이터 발생 시 워크플로우를 중단함 (프로덕션용).
- **V2 (Relaxed)**: 유효한 아이템만 통과시키고 유효하지 않은 것은 로그를 남겨, 엄격한 차단보다는 워크플로우의 지속적인 실행을 우선시함.

## v0.9.9: 데이터 검증 로직 고도화 (Strict Validation) (2026-01-12)

### 1. Verification Logic Refinement

- **Strict Data Verification**: `10_validate_content.js`에 엄격한 규칙(Structure Check, Tag Rules, No Mixed Language) 도입.
- **Local Script**: `verification/verify_db_data.js`를 신설하여 n8n 워크플로우 없이 로컬에서 `temp.json` 데이터를 검증할 수 있는 환경 구축.
- **Bug Fix**: `15_aggregate_tts_results.js`에서 Supabase Insert 에러 `PGRST204`를 해결하기 위해 `_validation` 필드 삭제 로직 추가.

## v0.9.8: 프롬프트 정교화 - 혼합 언어 방지 (2026-01-11)

- **이슈**: 타겟 언어 번역에 영어 원문이 섞여 들어가는 현상 발견 (예: "Korean Text. English Text").
- **해결**: `gemini_content_generator_prompt.txt` 및 `batch_dialogue_translation_prompt.txt`에 **"Target Language ONLY"** 및 **"No Mixed Language (CRITICAL)"** 제약 조건 추가.
- **검증**: `docs/n8n/expressions/optimization_steps.md` 문서와 코드가 일치하는지 확인 및 검증 완료.

## v0.9.7: n8n Batch Backfill Optimization & Prompt Strengthening (2026-01-11)

### 1. Batch Processing for Backfill

- **Efficiency**: 대량의 Dialogue 번역 누락 건을 처리하기 위해 Batch Size 20 기반의 처리 로직 도입.
- **Workflow**: `batch_dialogue_translation_prompt.txt` 및 `batch_dialogue_translation_parse_code.js` 구현.

### 2. Prompt Strictness

- **Critical Warning**: `08_gemini_content_generator_prompt.txt`에 8개 언어(`ko, ja, es, fr, de, ru, zh, ar`) 필수 포함 규칙을 `**CRITICAL**` 키워드로 강조하여 누락 방지.

### 3. Legacy Code Cleanup

- **Schema Sync**: TTS 관련 코드(`prepare_tts_requests.js`, `aggregate_tts_results.js`)에서 구버전 `content.ko.dialogue` 경로를 제거하고 `data.dialogue`로 표준화.

## v0.9.6: 하드코딩된 언어 문자열 제거 및 상수화 (2026-01-11)

### 1. Hardcoded String Refactoring

- **Removal of Hardcoded Strings**:
  - codebase 전반(components, i18n utilities, pages)에 걸쳐 `'en'`, `'ko'` 등으로 산재해 있던 하드코딩된 언어 문자열을 `SupportedLanguage` 상수로 대체.
  - `i18n/format.ts`, `i18n/server.ts`, `app/expressions/[id]/page.tsx`, `components/ExpressionCard.tsx` 등 프로젝트 전반의 로케일 로직을 정교화.
- **Logic Standardization**: 특정 언어에 의존적이던 로직을 제거하고 `SupportedLanguage.EN`을 명시적 Fallback으로 사용하도록 통일하여 오타 방지 및 중앙 집중식 관리 실현.

## v0.9.5: 5개국어 추가 및 i18n 타입 안정성 강화 (2026-01-11)

### 1. Language Expansion (9 Languages Supported)

- **New Locales**: FR (French), DE (German), RU (Russian), ZH (Chinese), AR (Arabic) 추가.
- **Implementation**: `i18n/locales/`에 각 언어별 번역 파일 생성 및 `LOCALE_DETAILS` 메타데이터 업데이트.

### 2. Strict Type Safety

- **Dictionary Logic**: `en.ts`를 기준(Source of Truth)으로 삼아 `Dictionary` 타입을 정의.
- **Enforcement**: `i18n/index.ts`에서 모든 언어 팩이 `Dictionary` 인터페이스를 완벽히 준수하도록 강제하여, 키 누락 시 컴파일 에러 발생.

## v0.9.3: Universal Backfill System 구축 (Multi-Language Expansion) (2026-01-11)

### 1. Dual Backfill Strategy (이원화 전략)

- **Problem**: 기존 데이터에 새로운 언어(FR, DE, RU, ZH, AR)를 추가할 때, 이미 검증된 영어 콘텐츠(`en`)까지 덮어쓰여지는 위험과, 반대로 영어 콘텐츠 리뉴얼이 필요한 상황이 혼재.
- **Solution**: 상황에 따라 선택 가능한 두 가지 전략으로 분리.
  - **Universal Mode**: 영문(`en`)을 포함한 6개 국어를 동시 생성 및 갱신. (기존 `ko`, `ja`, `es`는 보존)
  - **Supplementary Mode**: 기존 영문 데이터는 철저히 보존하고, 신규 5개 국어만 생성하여 안전하게 병합.

### 2. Logic Separation (코드 분리)

- **Files**:
  - `universal_backfill_parse_code.js`: `en` 필드 업데이트를 허용하는 병합 로직.
  - `supplementary_backfill_parse_code.js`: `en` 필드 업데이트를 차단하고 신규 언어만 주입하는 로직.
- **Workflow**: `Parse Content JSON` 노드의 자바스크립트 코드를 별도 파일로 관리하여, 운영자가 전략에 맞춰 코드를 손쉽게 교체할 수 있도록 개선.

## v0.9.2: 데이터베이스 스키마 리팩토링 (Database Schema Refactoring) (2026-01-11)

### 1. Dialogue Data Normalization

- **Structure Change**: 기존 `content` JSON 내부에 중첩되어 있던 대화문 데이터를 최상위 `dialogue` JSONB 컬럼으로 이동.
- **Deduplication**: 영어 원문(`en`)과 오디오 경로(`audio_url`)가 각 언어별(`ko`, `ja` 등) 객체마다 반복 저장되던 비효율을 개선하여, 최상위 레벨에서 한 번만 저장하고 각 언어는 번역본(`translations`)만 관리하도록 구조 변경.
- **Indexing**: 대화 내용 검색 성능 향상을 위해 `dialogue` 컬럼에 GIN 인덱스 추가.

## v0.9.1: n8n 콘텐츠 품질 고도화 (Content Quality Refinement) (2026-01-10)

### 1. Gemini Prompt Logic Improvement

- **n8n/expressions/code/08_gemini_content_generator_prompt.txt**:
  - **4-Language Support**: JSON 스키마에 영어(en) 필드를 추가하여, 다국어 콘텐츠 생성 파이프라인(EN/KO/JA/ES)을 완성.
  - **Tone & Manner**: 영어 설명에 대해 "Standard English (Friendly yet educational)" 톤을 정의하고, 교육적 목적에 맞지 않는 Text-speak(문자체) 사용을 금지.
  - **Quiz Randomization**: 퀴즈 정답이 'B'로 쏠리는 편향을 막기 위해, 정답 위치(Option A/B/C)를 무작위로 배정하라는 명시적 규칙 추가.

## v0.9.0: 서비스 필수 요소 완성 (Service Essentials: PWA, SEO, i18n) (2026-01-10)

### 1. PWA Implementation (iOS Completeness)

- **`manifest.ts`**: 안드로이드 및 데스크탑을 위한 표준 매니페스트 설정 (아이콘, 테마 컬러, Standalone 모드).
- **iOS Assets Generator**: `pwa-asset-generator`를 활용하여 iOS 기기별 스플래시 스크린(Startup Image) 30여 장 생성 및 `layout.tsx` 연결.
  - **Logic**: 세로 30%, 가로 20%의 여백(Padding)을 차등 적용하여 모든 화면 회전 상태에서 로고 시인성 확보.
- **Build Config**: `next-pwa`와 Turbopack의 충돌을 방지하기 위해 `next dev --webpack` 설정 강제.

### 2. SEO & Metadata Strategy

- **Dynamic Metadata**: `generateMetadata`를 통해 페이지별 콘텐츠에 최적화된 메타 태그(Title, Desc, Keywords) 동적 생성.
- **Open Graph Image**: `opengraph-image.tsx`를 구현하여 상세 페이지 공유 시 해당 표현 텍스트가 렌더링된 썸네일 카드 자동 생성.
- **Structured Data (JSON-LD)**: 학습 자료(LearningResource) 스키마를 적용하여 구글 검색 리치 스니펫 대응.

### 3. I18n Infrastructure Refactoring

- **Single Source of Truth**: `i18n/index.ts`에 `SupportedLanguage` 상수를 도입하여 흩어져 있던 언어 코드 정의를 중앙화.
- **Refactoring**: `middleware.ts`, `server.ts`, `format.ts` 등 전반적인 i18n 로직이 문자열 대신 상수를 참조하도록 수정하여 타입 안정성(Type Safety) 강화.

## v0.8.18: 프로젝트 고도화 및 품질 개선 (2026-01-09)

### 1. 코드 리팩토링 및 훅 분리 (Hooks Extraction)

- **Problem**: `ExpressionList.tsx`의 비대해진 로직으로 인해 유지보수가 어렵고 버그 발생 가능성이 높음.
- **Solution**: 로직을 목적에 따라 두 개의 커스텀 훅으로 분리함.
  - **`usePaginatedList`**: 페이지네이션 상태 및 캐시 동기화에 집중하도록 개선.
  - **`useScrollRestoration`**: 정밀한 스크롤 위치 추적(200ms 디바운스) 및 재귀적 RAF 기반의 복원 로직 담당.
- **Result**: UI 레이아웃과 데이터 렌더링에만 집중하는 간결하고 예측 가능한 컴포넌트 구조 확보.

## v0.8.17: 스크롤 네비게이션 동작 수정 (2026-01-09)

### 1. Explicit Scroll Reset

- **Problem**: `ExpressionList`가 스크롤 복원을 위해 `history.scrollRestoration`을 `manual`로 설정하고 있어, 상세 페이지에서 태그를 클릭해 메인으로 돌아올 때(새로운 네비게이션) 스크롤이 자동으로 초기화되지 않고 유지되는 문제 발생.
- **Solution**: 캐시된 스크롤 위치가 없는 경우(`targetPosition <= 0`)에는 명시적으로 `window.scrollTo(0, 0)`을 호출하여 강제로 최상단으로 이동하도록 로직 추가.

### 2. Detail Page Scroll Reset (Session Storage)

- **Problem**: 상세 페이지 진입 시 브라우저의 이전 스크롤 기억으로 인해 화면 중간부터 렌더링이 시작되는 현상.
- **Solution**: `sessionStorage` 플래그와 `template.tsx`를 결합하여 새로운 진입 시에만 화면 노출 전 스크롤을 리셋하는 시스템 구축.

## v0.8.16: Audio URL 정규화 및 아키텍처 리팩토링 (2026-01-09)

### 1. Audio URL Normalization (DB 정규화)

- **Relative Paths**: Supabase DB의 `audio_url`을 절대 경로에서 스토리지 내부 상대 경로(`expressions/...`)로 일괄 전환.
- **Portability**: 도메인 변경이나 프로젝트 이전에 유연하게 대응할 수 있는 데이터 구조 확보.

### 2. Architectural Refactoring (캡슐화 및 최적화)

- **Centralized Resolution**: URL 완성 로직을 Server Component에서 Client Component(`DialogueAudioButton`) 내부로 이동.
- **Payload Optimization**: 서버에서 클라이언트로 전달되는 JSON 데이터를 가볍게 유지하고, 필요한 시점에만 Full URL 생성.
- **DX (Developer Experience)**: `constants/index.ts`에 `STORAGE_BUCKET` 상수를 도입하여 설정을 중앙화하고, `lib/utils`의 `getStorageUrl` 유틸리티를 고도화.

### 3. Error Handling Polish

- **Detailed Logging**: 오디오 재생 실패 시 단순 에러 객체 대신 `error.code`, `error.message`, `src`를 포함한 상세 정보를 콘솔에 출력하도록 개선.

## v0.8.15: UI 비주얼 보정 (2026-01-09)

### 1. Visual Polish

- **Dark Mode Visibility**: `DialogueItem`의 Blue Variant가 블러 상태일 때 올바른 색상(`text-blue-200/70`)을 유지하도록 수정하여 시인성 확보.

### 2. Utility Refactoring

- **`text-disabled`**: `app/globals.css`에 유틸리티 클래스를 추가하고 이를 컴포넌트에 적용하여 스타일 코드 중복 제거.

## v0.8.14: 학습 모드 상호작용 고도화 (2026-01-09)

### 1. Smart Toggle Interaction

- **`components/DialogueSection.tsx`**:
  - **Auto-Disable Logic**: 'Blind Listening' 모드가 켜진 상태에서 'Translation Blur'(눈 아이콘) 클릭 시, 자동으로 리스닝 모드를 끄고 해석을 보여주도록 개선.
  - **State Preservation**: `savedRevealedIndices` 상태를 도입하여, Blind Mode 진입 시 이전의 해석 노출 상태를 백업하고 해제 시 복원.
  - **Constraint Removal**: 기존의 `isDisabled` 제약을 제거하여 사용자 주도적인 모드 전환 지원.

### 2. Individual English Reveal

- **`components/DialogueSection.tsx` & `DialogueItem.tsx`**:
  - **Selective Reveal**: 'Blind Listening' 모드 활성화 시, 전체를 다 끄지 않고도 궁금한 영어 문장만 클릭하여 일시적으로 확인할 수 있는 기능 추가.
  - **Auto-Exposed Logic**: 사용자가 수동으로 모든 영어 문장을 드러내면(`revealedEnglishIndices.size === dialogue.length`), 자동으로 `viewMode`를 `exposed`로 전환하여 'Blind Mode'를 해제하고 UI를 동기화.
  - **State Management**: `viewMode`(`'blind' | 'partial' | 'exposed'`) 상태 머신을 도입하여 복잡한 투명도/블러 로직을 체계적으로 관리.
  - **UX Detail**: 블러 처리된 텍스트에 `cursor-pointer`와 `hover` 효과를 주어 클릭 가능함을 암시하고, 해석은 여전히 가려진 상태를 유지하여 학습 효과 지속.

## v0.8.12: 학습 모드 (Learning Mode) 및 오디오 안정화 (2026-01-08)

### 1. Learning Mode Foundation

- **`components/DialogueSection.tsx`**:
  - `isBlindMode` (영어 블러) 및 `revealedIndices` (해석 블러) 상태 관리 로직 추가.
  - **LearningToggle**: 공통 토글 버튼 컴포넌트를 사용하여 리스닝 모드와 해석 블러 제어 UI 구현.
  - **Interaction Policy**: 리스닝 모드 활성 시 해석 블러 버튼을 비활성화(`isDisabled`)하여 학습 집중도 향상.

### 2. Individual Line Translation Reveal

- **`components/DialogueItem.tsx`**:
  - 해석 영역 클릭 시 해당 문장의 블러만 해제되는 토글 기능 구현.
  - 리스닝 모드일 경우 해석 영역과 영어 문장 모두 블러 처리 및 클릭 방지.

## v0.8.11: 대화 전체 듣기(Sequential Playback) 기능 구현 (2026-01-08)

### 1. Sequential Playback Logic

- **`components/DialogueSection.tsx`**:
  - `DialogueSection` 컴포넌트를 신설하여 대화 리스트와 오디오 재생 로직을 캡슐화.
  - **Auto Play**: '전체 듣기(Play All)' 버튼 클릭 시 A와 B의 대화를 순차적으로 재생하는 로직 구현.
  - **Smart Interruption**: 자동 재생 중 사용자가 특정 줄을 수동으로 재생하거나 멈추면, 자동 재생 모드가 즉시 해제되어 사용자 의도를 존중.
  - **Loading Synchronization**: '전체 듣기' 버튼은 포함된 모든 오디오 파일(`readyIndices`)이 로딩될 때까지 비활성화되며, 'Loading...' 상태를 표시하여 안정적인 연속 재생을 보장.

### 2. Audio Stability & Optimization

- **`components/DialogueAudioButton.tsx`**:
  - **Flicker Fix**: `onReady` 콜백이 변경될 때마다 오디오가 불필요하게 재로딩되는 문제를 `useRef`를 사용하여 해결, 로딩 상태 깜빡임 제거.
  - **Ready State**: 오디오 로딩이 완료(`canplaythrough`)되거나 에러가 발생했을 때 부모에게 준비 완료 신호를 보내는 `onReady` prop 구현.
  - **Visual Feedback**: 개별 재생 버튼 로딩 시에도 커서를 `not-allowed`로 변경하여 사용자에게 명확한 피드백 제공.

### 3. UI/UX

- **Play All Button**: 대화 섹션 타이틀 옆에 직관적인 재생/정지 버튼 배치.
- **Active State**: 현재 자동 재생 중인 대화 버블에 `ring` 효과를 주어 시각적 포커스 제공.

### 4. Internationalization

- **Keys**: `playAll`, `stop` 키를 `en.ts`, `ko.ts`에 추가하여 다국어 지원.
- **Loading Label**: 'Loading...' 텍스트를 `common.loading` 키로 중앙 관리하여 언어팩에서 제어하도록 개선.

## v0.8.10: 대화 섹션 스타일링 개선 및 모바일 최적화 (2026-01-08)

### 1. Mobile Optimization (Hover Removal)

- **`useIsMobile` Hook**: `DialogueSection` 및 `DialogueAudioButton`에 훅을 적용하여 모바일 환경 감지.
- **Conditional Styling**: `hover:` 클래스들을 `!isMobile` 조건부로 래핑하여, 터치 디바이스에서 불필요한 호버 효과(색상 변경 등)가 발생하는 것을 방지.

### 2. UI Consistency & Visibility

- **Button Styling**:
  - `DialogueAudioButton`: `variant` prop(`default` | `blue`) 도입.
    - **Default (User A)**: Dark mode hover 개선(`dark:hover:bg-zinc-700`)하여 배경과 구분되도록 수정.
    - **Blue (User B)**: Dark mode에서도 Light mode와 동일한 파란색 테마 유지. 재생 중(Playing) 상태일 때 호버 배경색(`bg-blue-500`)을 그대로 사용하여 시각적 안정감 확보.
  - **Dark Mode**: '전체 듣기' 버튼의 호버 시 텍스트 색상을 `dark:hover:text-zinc-200`으로 명시하여, 어두운 배경(`bg-zinc-700`) 위에서도 가독성 확보.
- **Code Refactoring**: `cn` 유틸리티를 활용하여 조건부 클래스 결합 로직을 깔끔하게 정리.

## v0.8.9: 오디오 재생 권한 제어 기반 구현 (2026-01-08)

### 1. Feature Gating Infrastructure

- **`components/DialogueAudioButton.tsx`**: `onPlayAttempt` 콜백 함수를 Props로 추가.
- **Asynchronous Permission Check**: 재생 버튼 클릭 시 `onPlayAttempt`가 존재하면 이를 실행하고, 결과(`boolean`)에 따라 재생 여부를 결정하도록 로직 고도화.
- **Future-Proof Design**: 이 구조를 통해 상세 페이지나 리스트 어디에서든 사용자 티어 체크, 포인트 차감, 또는 광고 시청 유도 로직을 유연하게 주입할 수 있게 됨.

## v0.8.8: 원어민 대화 듣기 기능 구현 (2026-01-08)

### 1. Audio Playback Component

- **`components/DialogueAudioButton.tsx`**: Lucide 아이콘(`Volume2`, `Pause`, `Loader2`)을 활용한 전용 오디오 재생 버튼 컴포넌트 구현.
- **Audio Synchronization**: 한 번에 하나의 오디오만 재생되도록 커스텀 이벤트(`AUDIO_PLAYBACK_START`) 기반의 전역 중지 로직 적용.
- **Visual Feedback**: 재생 중(`Pause` 아이콘), 로딩 중(`Spinner`), 정지 중(`Volume` 아이콘) 상태를 명확히 구분하여 제공.

### 2. Detailed Page Integration

- **`app/expressions/[id]/page.tsx`**: A/B 대화 버블 내부에 오디오 버튼을 통합.
- **Thematic Styling**: 화자별 배경색(회색/파란색)에 최적화된 아이콘 색상 및 호버 효과 적용 (`text-blue-200` 등).

### 3. Structural Improvements (Constants & Naming)

- **Constants Centralization**: 루트 레벨의 `constants/` 폴더를 신설하여 일반 상수(`index.ts`)와 이벤트 상수(`events.ts`)를 분리 관리.
- **Standardized Naming**: 브라우저 DOM 관례에 맞춰 이벤트 값은 소문자 `snake_case`로, 변수명은 `UPPER_SNAKE_CASE`로 정의하여 프로젝트 일관성 확보.

## v0.8.7: n8n 워크플로우 최적화 및 콘텐츠 품질 고도화 (2026-01-08)

### 1. Check Duplicate Node Optimization

- **Performance**: `Check Duplicate` 노드에 `Limit: 1` 설정을 추가하여 중복 여부 확인 시 첫 번째 매칭 결과만 반환하도록 최적화.
- **Stability**: `Always Output Data: On` 옵션을 활성화하여 데이터가 없는 경우에도 빈 객체를 출력하게 함으로써, 워크플로우가 예외 없이 정상적으로 흐르도록 개선.
- **Logic Sync**: `If New` 노드의 조건문을 데이터 존재 여부(`Check Duplicate`의 출력 데이터가 비어있는지)를 기준으로 판단하도록 동기화.

### 2. High-Quality Content Generation Standards

- **Dialogue Structure**: 대화문을 2~3턴(A-B 또는 A-B-A)으로 표준화. 학습자가 상황을 빠르게 이해할 수 있는 최적의 길이를 유지하고 TTS 생성 효율성 확보.
- **Currency & Numeric Formatting**:
  - 통화 표기를 USD(`$`)로 통일하여 데이터 일관성 부여.
  - 1,000 이상의 숫자에 쉼표(`,`)를 강제하여 가독성 상향 평준화.
- **Requirement Updates**: 위 규칙들을 `n8n/expressions/code/08_gemini_content_generator_prompt.txt` 및 워크플로우 템플릿에 명시적으로 반영.

### 3. Operator Safety & Troubleshooting

- **Groq Terms Notice**: `orpheus-v1-english` 모델 사용 시 Groq Console에서 약관 동의가 필수임을 문서(`optimization_steps.md`, `user_guide.md`)에 명시.
- **Error Handling Guide**: `model_terms_required`로 인한 400 에러 발생 시의 해결 방법을 트러블슈팅 섹션에 추가하여 운영 안정성 강화.

## v0.8.6: n8n 워크플로우 모듈화 및 확장성 강화 (2026-01-07)

### 1. Modular Code & Prompt Management

- **Structure**: n8n 워크플로우의 각 노드에 분산되어 있던 JavaScript 코드와 Gemini 프롬프트를 로컬 파일로 분리하여 `n8n/expressions/code/` 폴더에 저장.
- **File Naming**: 실행 순서에 따라 번호 접두사를 부여하여 가독성 확보 (예: `02_pick_category.js`, `04_gemini_expression_generator_prompt.txt`).
- **Benefits**: 외부 에디터 사용 가능, 버전 관리 용이성, 코드 재사용성 향상.

### 2. Documentation Reorganization

- **Categorization**: `docs/` 내의 평면적인 파일 구조를 `n8n/`, `monetization/`, `git/`, `database/`, `product/` 등 주제별 하위 폴더로 재편.
- **Scalability**: `docs/n8n/expressions/`와 같이 워크플로우별 전용 문서 폴더를 생성하여, 향후 `vocas` 등 새로운 기능 추가 시 문서 혼재를 방지.

### 3. Scalable Workflow Organization

- **Directory Relocation**: 기존 루트의 n8n 관련 파일들을 `n8n/expressions/` 하위로 이동.
- **Template Renaming**: `n8n_workflow_template.json`을 `expressions_workflow_template.json`으로 변경하여 향후 `vocas`, `images` 등 다른 도메인의 워크플로우가 추가될 때 충돌 없이 확장 가능한 구조 마련.

### 4. Template Sanitization & Security

- **Credential Cleanup**: 워크플로우 템플릿 내에 포함된 특정 Credential ID들을 `your-http-header-auth-id` 등과 같은 플레이스홀더로 교체하여 공용 저장소 커밋 시 보안 위험 원천 차단.

## v0.8.5: 라우트 중앙 관리 및 필터 누적 시스템 (2026-01-06)

### 1. Centralized Route Management

- **File**: `lib/routes.ts` 생성.
- **Implementation**: 앱 내 모든 경로(`ROUTES`)와 필터 기반 홈 경로 생성 함수(`getHomeWithFilters`)를 정의. 모든 컴포넌트에서 하드코딩된 경로를 제거하고 이 시스템을 사용하도록 리팩토링.

### 2. Additive Filtering UX

- **Logic**: `ExpressionCard.tsx`에서 카테고리/태그 클릭 시 `useSearchParams`를 통해 기존 필터 상태를 읽어와 조합.
- **Behavior**:
  - 카테고리 클릭: 기존 검색어/태그 유지 + 카테고리 변경.
  - 태그 클릭: 기존 카테고리 유지 + 태그 변경 (검색어는 초기화).
  - 결과적으로 사용자가 원하는 대로 필터를 겹쳐서 적용할 수 있는 강력한 탐색 기능 제공.

## v0.8.4: 카테고리 필터링 최적화 (2026-01-06)

### 1. Smart Category Toggling

- **Logic**: `FilterBar.tsx`의 카테고리 선택 핸들러(`handleCategoryClick`)를 고도화.
- **Toggling**: 특정 카테고리(예: `Business`)가 활성화된 상태에서 다시 클릭 시, `category` 파라미터를 제거하고 `all` 상태로 자동 전환.
- **Duplicate Prevention**: 현재 상태가 `all`인 경우, `all` 버튼 클릭 시 라우팅 동작을 중단(`return`)하여 불필요한 데이터 페칭 및 리렌더링 방지.

## v0.8.3: 네비게이션 상태 보존 및 스크롤 복원 (2026-01-06)

### 1. Multi-Cache Global State

- **Architecture**: `context/ExpressionContext.tsx`에서 필터별 상태를 저장하는 맵 구조(`cache`) 도입. 검색, 카테고리, 태그 검색 결과가 각각 독립적인 데이터와 스크롤 위치를 가짐.
- **Optimization**: `useCallback`, `useMemo`를 통한 컨텍스트 함수 메모이제이션 및 얕은 비교를 통한 불필요한 리렌더링 방지.

### 2. Real-time Scroll Tracking

- **Tracking**: `ExpressionList.tsx`에서 스크롤 리스너를 통해 현재 위치를 실시간으로 캐시에 기록 (200ms 디바운스 적용).
- **Data Integrity**: 스크롤 복원 중에는 저장 로직을 차단하여 캐시 오염을 방지. 데이터 변경(`items`) 시에도 스크롤 위치는 보존되도록 메서드 분리(`updateCacheData`).

### 3. Robust Scroll Restoration (Recursive RAF)

- **Recursive RAF**: `requestAnimationFrame`을 사용하여 브라우저 페인팅 주기에 맞춰 최대 60프레임 동안 반복적으로 스크롤 이동 시도. 레이아웃 안정화 지연에 완벽 대응.
- **Component Lifecycle Control**: `app/page.tsx`에서 필터별 `key` prop을 `ExpressionList`에 전달하여, 필터 변경 시 컴포넌트 강제 리마운트 및 깨끗한 상태 초기화 보장.

### 4. Navigation UX

- **`components/BackButton.tsx`**: `router.back()` 기반의 뒤로가기 구현. 히스토리가 없는 직접 진입 시에도 홈으로 안전하게 이동하는 Fallback 처리.

## v0.8.2: 리스트 애니메이션 최적화 및 UI/UX 폴리싱 (2026-01-05)

### 1. Layout Stability Optimization

- **`components/AnimatedList.tsx`**: `motion.div`에서 `layout` 속성을 제거.
  - **Reason**: '더 보기' 기능을 통해 리스트가 동적으로 확장될 때, 기존 아이템들이 불필요하게 재계산되어 위치를 이동하려는 시도를 차단. 이를 통해 새로운 아이템 추가 시 발생하는 미세한 레이아웃 흔들림(Jitter)을 방지하고 성능을 최적화함.

### 2. Entrance Animation Refinement

- **`components/ExpressionCard.tsx`**: 카드 등장 애니메이션의 핵심 속성을 변경.
  - **Scale-based Entrance**: 기존 Slide-up(`y: 20`) 대신 Scale-up(`scale: 0.96 -> 1.0`)을 적용하여 콘텐츠가 화면에 더 부드럽고 집중력 있게 안착하도록 개선.
  - **Timing & Easing**: 애니메이션 지속 시간을 `0.5s`에서 `0.4s`로 단축하고, 정교한 베지어 곡선(`[0.21, 0.47, 0.32, 0.98]`)을 적용하여 리스트 로딩 시의 리듬감을 향상시킴.

## v0.8.1: 리스트 '더 보기(Load More)' 기능 구현 및 스크롤 리셋 최적화 (2026-01-05)

### 1. Pagination Logic

- **Server-side Range**: `lib/expressions.ts`의 `getExpressions` 함수에 `page`와 `limit` 파라미터를 추가하고, Supabase의 `.range(from, to)`를 사용하여 필요한 데이터만 효율적으로 페칭하도록 개선.
- **Initial Load**: 홈 페이지 첫 진입 시 최신순으로 12개의 아이템을 먼저 로드함.

### 2. Server Actions for Client Interaction

- **`lib/actions.ts`**: 클라이언트 컴포넌트에서 추가 데이터를 요청할 수 있도록 `"use server"` 지시어를 사용한 `fetchMoreExpressions` 액션 구현. 이를 통해 API route 생성 없이도 타입 안정성을 유지하며 비동기 데이터 페칭 가능.

### 3. Client-side State Management

- **`components/ExpressionList.tsx`**:
  - `useState`를 사용하여 서버에서 받은 초기 데이터와 추가 페칭된 데이터를 통합 관리.
  - `useEffect`를 통해 카테고리나 검색어 필터가 변경될 때 리스트를 즉시 초기화하도록 구현.
  - `hasMore` 상태를 통해 데이터 소진 여부를 판단하고 버튼 노출 여부를 동적으로 제어.
- **`components/LoadMoreButton.tsx`**: 독립적인 버튼 컴포넌트로 분리. 다크모드 시인성 개선 및 `useEnableHover`를 통한 모바일 UX 최적화 적용.

### 4. Automatic Scroll Reset

- **`template.tsx`**: 상세 페이지(`[id]`) 진입 시 이전 스크롤 위치가 유지되는 문제를 해결하기 위해 Next.js Template 도입. 페이지 전환 시마다 `window.scrollTo(0, 0)`를 실행하여 사용자 경험 일관성 확보.

## v0.8.0: 스켈레톤 로딩 (Skeleton Loading) 도입 및 UX 정교화 (2026-01-05)

### 1. Reusable Skeleton Components

- **`components/ui/Skeletons.tsx`**:
  - `SkeletonNavbar`: 메인 페이지(로고+서브헤더)와 상세 페이지(뒤로가기)의 각기 다른 헤더 구조를 지원하는 반응형 스켈레톤.
  - `SkeletonHomeHero`: 홈 페이지 상단 타이틀과 설명 영역의 공간을 미리 확보하여 CLS 방지.
  - `SkeletonCard`: 실제 `ExpressionCard`와 동일한 레이아웃, 여백, 애니메이션을 가진 카드 스켈레톤.
  - `SkeletonFilterBar`: 검색창과 카테고리 칩 리스트 모양을 모사한 스켈레톤.
  - `SkeletonDetail`: 상세 페이지의 복잡한 카드 구조(상황, 대화, 팁, 퀴즈, 태그)를 실제 DOM 트리와 동일하게 구현하여 로딩 전후의 시각적 이질감 제거.

### 2. Streamlined Loading Pages

- **`app/loading.tsx`**: 홈 페이지 로딩 시 상단 네비바부터 하단 카드 그리드까지 전체 레이아웃 윤곽을 즉시 렌더링.
- **`app/expressions/[id]/loading.tsx`**: 상세 페이지 로딩 시 뒤로가기 버튼이 포함된 네비바와 상세 콘텐츠 스켈레톤을 배치하여 사용자 대기 경험 개선.

### 3. Documentation & Governance

- **`docs/project_context.md`**: '스켈레톤 로딩 전략'을 공식 코딩 컨벤션에 추가하여 향후 모든 데이터 기반 UI에 대한 스켈레톤 동시 개발 의무화.

## v0.7.9: Scroll To Top 기능 구현 및 모바일 최적화 (2026-01-05)

### 1. Scroll To Top Component

- **Visibility Logic**: `useScroll(300)` 훅을 사용하여 페이지가 300px 이상 스크롤되었을 때만 버튼이 나타나도록 구현.
- **Smooth Animation**: `framer-motion`의 `AnimatePresence`를 사용하여 버튼의 등장과 퇴장을 부드럽게 처리하고, `whileHover` 및 `whileTap` 인터랙션을 추가함.
- **Top Interaction**: 클릭 시 `window.scrollTo({ top: 0, behavior: 'smooth' })`를 통해 최상단으로 부드럽게 이동.

### 2. Mobile Responsive Design

- **Adaptive Styling**: 모바일 환경을 고려하여 버튼 크기(`p-3` vs `sm:p-3.5`)와 위치(`bottom-6` vs `sm:bottom-8`)를 유연하게 조정.
- **Hover Prevention**: `useEnableHover` 훅을 적용하여 터치 디바이스에서는 불필요한 호버 스타일 및 애니메이션이 발생하지 않도록 최적화.

## v0.7.8: n8n 생성 로직 고도화 - 태그 생성 의무화 (2026-01-05)

### 1. n8n Prompt Optimization (Tags)

- **Mandatory Tags**: `docs/n8n/expressions/optimization_steps.md` 및 `n8n/n8n_workflow_template.json`의 Gemini 프롬프트에 `tags` 필드를 필수(MANDATORY)로 지정.
- **Strict Formatting**: 3~5개의 소문자 문자열 배열 형식을 강제하고, '#' 기호 사용을 금지하여 DB 저장 및 필터링 시의 데이터 정합성을 확보함.

## v0.7.7: 모바일 호버 효과 제거 및 관련 표현 추천 개선 (2026-01-05)

### 1. Mobile Hover UX Fix

- **Condition Logic**: `ExpressionCard.tsx`에서 `useIsMobile` 훅을 사용하여 모바일 환경(`isMobile === true`)을 감지.
- **Animation Control**: 모바일일 경우 `whileHover`, `whileTap` 애니메이션 props를 `undefined`로 설정하여 비활성화.
- **Style Conditional**: `cn` 유틸리티를 사용하여 `hover:` 관련 CSS 클래스들도 모바일이 아닐 때만 적용되도록 조건부 렌더링 처리.
- **Hydration Safety**: `isMobile`이 `undefined`일 때(초기 렌더링)는 데스크탑으로 간주하여 서버 사이드 렌더링(SSR)과의 불일치 방지.

### 2. Auto-Scroll Filter Bar

- **Auto-Focus**: `FilterBar.tsx`에서 현재 선택된 카테고리(`currentCategory`)가 변경될 때마다 `data-category` 속성을 사용하여 해당 버튼 요소를 찾음.
- **Center Alignment**: 선택된 버튼이 스크롤 컨테이너의 중앙에 오도록 `scrollTo`를 사용하여 부드럽게 이동시킴. 모바일과 같이 화면이 좁을 때 사용자가 선택한 필터를 놓치지 않도록 개선.

### 3. Documentation

- **Technical Guide**: `docs/technical_implementation.md`를 신설하여 모바일 감지, 호버 제어, 무한 스크롤 등 UI/UX 관련 핵심 기술 구현 내용을 상세히 정리함.

## v0.7.6: 관련 표현 추천 드래그 가속 기능 추가 (2026-01-05)

### 1. Accelerated Drag on Hover

- **Fade Interaction**: 데스크탑 뷰에서 좌우 페이드 영역에 마우스를 올리면 스크롤이 해당 방향으로 빠르게 가속되는 기능 구현.
- **Directional Logic**: `hoverDirection` 상태를 도입하여 왼쪽 페이드 호버 시 역방향(`-4.0`), 오른쪽 페이드 호버 시 정방향(`4.0`)으로 스크롤 속도 조정.
- **Bidirectional Infinite Loop**: 기존의 단방향 무한 루프 로직을 개선하여, 왼쪽 끝에 도달했을 때도 자연스럽게 오른쪽 끝으로 연결되도록 보완.

### 2. UI/UX Polish

- **Enhanced Affordance**: 페이드 영역에 마우스를 올리면 `cursor-w-resize`, `cursor-e-resize` 커서가 표시되도록 하여 인터랙션 가능함을 직관적으로 알림.
- **Improved Hit Area**: 페이드 영역의 너비를 `w-24`로 확장하여 사용자가 더 쉽게 가속 기능을 트리거할 수 있도록 개선.

## v0.7.5: 사용자 가이드 및 퀴즈 UI 가독성 개선 (2026-01-04)

### 1. New Documentation: User Guide

- **`docs/n8n/expressions/user_guide.md`**: 서비스의 핵심 기능 소개부터 n8n 워크플로우 운영 가이드까지 포함한 종합 사용자 가이드 작성.
- **Operator focus**: n8n을 통한 자동화 프로세스(프롬프트 설정, Credentials 연결, 트러블슈팅)를 상세히 설명하여 운영 효율성 제고.

### 2. UI Polish (Quiz)

- **Line Break Support**: 상세 페이지 퀴즈 질문 섹션에 `whitespace-pre-wrap`을 적용하여 n8n에서 생성된 다중 개행(`\n`)이 의도한 대로 렌더링되도록 수정.
- **Enhanced Readability**: 질문과 선택지가 뭉쳐 보이던 문제를 해결하여 모바일 환경에서의 가독성을 대폭 향상.

## v0.7.4: 퀴즈 로직 고도화 및 데이터 정합성 확보 (2026-01-04)

### 1. n8n Quiz Logic Optimization

- **Pattern Refinement**: 퀴즈 생성 패턴을 3가지로 명확히 재정의하여 학습 효과 극대화.
  - **Pattern 1 (Situation -> EN)**: 상황에 맞는 영어 표현 고르기.
  - **Pattern 2 (Expression -> Situation)**: 영어 표현에 맞는 상황 고르기.
  - **Pattern 3 (Negative Logic)**: 영어 표현에 적절하지 _않은_ 상황 고르기.
- **Strict Formatting**: 모든 언어(KO, JA, ES)에 대해 3지 선다(A/B/C)와 정답 포맷(단일 알파벳)을 강제하는 규칙 적용.

### 2. Data Integrity

- **Corrective SQL**: 기존 데이터 중 논리적 오류(한국어 대사 고르기)나 포맷 오류(선택지 누락)가 있는 항목을 올바른 패턴으로 일괄 수정하는 SQL 스크립트(`database/009_fix_invalid_quizzes.sql`) 작성 및 적용.

## v0.7.3: n8n 프롬프트 최적화 (2026-01-03)

### 1. n8n Prompt Engineering

- **Capitalization Rules**: `Gemini Content Generator` 프롬프트에 문장("No worries")은 대문자, 구절("spill the tea")은 소문자로 시작하도록 명시적 규칙 추가.
- **Tone & Manner**: '무조건 반말' 원칙을 완화하여, 영어 표현 자체가 정중할 경우("Could I...?") 한국어 뜻풀이도 존댓말을 허용하도록 유연성 확보.
- **Punctuation**: 영어 표현이 의문문일 경우 뜻풀이도 물음표로 끝나도록 강제하여 뉘앙스 전달력 강화.

### 2. Agent Workflow Enhancement

- **Context Restoration**: `.agent/workflows/restore_context.md`를 업데이트하여 `features_list.md`, `database/schema.md` 등 핵심 문서를 추가 로드하도록 개선. 이를 통해 에이전트가 프로젝트의 기능과 데이터 구조를 더 정확히 이해하게 됨.

## v0.7.2: UI 스타일 중앙 관리 및 모바일 최적화 (2026-01-03)

### 1. Style Centralization (Utility Classes)

- **Semantic Utilities**: 반복되는 테마 스타일을 `globals.css`에 유틸리티 클래스로 정의하여 유지보수성 향상.
  - `bg-surface`: 메인 카드 및 입력창 배경 (`white` / `zinc-900`)
  - `bg-subtle`: 보조 카드 및 태그 배경 (`zinc-50` / `zinc-800/50`)
  - `bg-muted`: 호버 효과 및 강조 배경 (`zinc-100` / `zinc-800`)
  - `border-main`: 기본 테두리 (`zinc-200` / `zinc-800`)
  - `border-subtle`: 약한 테두리 및 구분선 (`zinc-100` / `zinc-800`)
  - `text-body`: 본문 텍스트 (`zinc-800` / `zinc-200`)
  - `text-secondary`: 설명 및 보조 텍스트 (`zinc-600` / `zinc-400`)

### 2. Reliable Mobile Detection

- **Custom Hooks**: `useMediaQuery`와 `useIsMobile` 훅을 구현하여 화면 크기에 따른 로직 분기 처리.
- **Hydration Safety**: `SyncExternalStore`와 초기값 `undefined` 처리를 통해 SSR 환경에서의 하이드레이션 오류 방지.
- **Responsive Layout**: `RelatedExpressions` 컴포넌트에서 모바일일 경우 세로 리스트, 데스크탑일 경우 Marquee 스크롤로 자동 전환되도록 개선.

### 3. Documentation Workflow Update

- **Ideas Management**: `update_docs` 워크플로우에 `feature_ideas.md`를 추가하고, 구현된 기능을 자동으로 필터링하도록 규칙 가이드 업데이트.

## v0.7.1: 아키텍처 정비 및 Sticky UI 고도화 (2026-01-03)

### 1. Architectural Restructuring

- **Folder Relocation**: `hooks/`, `i18n/` 폴더를 루트 레벨로 이동하여 모듈 접근성 및 구조적 명확성 향상.
- **Shared Logic**: `useScroll` 커스텀 훅을 통해 스크롤 상태 관리 로직을 중앙화하고 컴포넌트 간 중복 제거.

### 2. Sticky UI & Spacing Polish

- **Dynamic Transitions**: 스크롤 위치에 따라 헤더의 테두리를 필터 바 하단으로 이동시키는 동적 스타일링 구현.
- **Background Sync**: 화이트 모드에서 스크롤 시 헤더 배경색이 메인 배경색(`zinc-50`)과 일치하도록 변경하여 시각적 일체감 확보.
- **Consistent Spacing**: 필터 바가 고정될 때와 평상시의 카드 간격을 동일하게 유지하도록 여백 로직 최적화.

### 3. Developer Experience (DX)

- **Theming**: Tailwind v4 테마 변수(`--header-height`) 및 커스텀 유틸리티(`max-w-layout`, `border-layout`) 도입.
- **Workflow Automation**: 문서 자동 업데이트를 지원하는 `update_docs` 에이전트 워크플로우 구축.
- **Type Safety**: `yarn lint` 실행 시 `tsc --noEmit`을 포함하여 린트 단계에서 타입 체크 강제.

## v0.6.7: 관련 표현 추천 고도화 (Auto-Marquee) (2026-01-02)

### 1. Auto-Marquee Animation

- **무한 루프 스크롤**: `requestAnimationFrame`을 활용하여 끊김 없이 흐르는 자동 스크롤(Infinite Loop)을 구현.
- **데이터 복제(Cloning)**: 리스트 데이터를 2배로 복제하여 스크롤이 끝에 도달했을 때 순식간에 처음으로 되돌리는 트릭을 사용하여 시각적으로 끊김 없는 연결을 구현.

### 2. Interaction Polish

- **스마트 일시정지**: 사용자가 카드를 자세히 볼 수 있도록 마우스 호버 시 스크롤을 **일시정지(Pause)**하고, 이탈 시 자동으로 **재개(Resume)**.
- **시각적 힌트**: 좌우 Fade 영역에 마우스를 올리면 `cursor-w-resize`, `cursor-e-resize` 커서를 표시하여 스크롤 가능함을 직관적으로 알림.

### 3. Performance

- **최적화**: `useCallback`과 `useRef`를 적절히 활용하여 애니메이션 루프가 리렌더링을 유발하지 않도록 최적화하고, `useEffect` 의존성을 관리하여 메모리 누수를 방지.

## v0.7.0: 브랜드 리뉴얼 및 다국어 확장 아키텍처 수립 (2026-01-02)

### 1. 서비스 브랜드 리뉴얼

- **명칭 변경**: `Daily English`에서 **`Speak Mango`**로 서비스명을 공식 변경.
- **상수화**: `lib/constants.ts`에 `SERVICE_NAME` 상수를 추가하여 UI 및 메타데이터에서 일관되게 참조하도록 개선.
- **메타데이터 업데이트**: `app/layout.tsx`의 타이틀 및 설명을 새로운 브랜드명에 맞춰 업데이트.

### 2. 다국어 확장 및 서비스 격리 전략 수립

- **스키마 설계**:
  - 콘텐츠 스키마(`speak_mango_en`, `speak_mango_ko` 등)와 사용자 공유 스키마(`speak_mango_shared`)를 분리하는 하이브리드 아키텍처 도입.
  - `auth.users`를 공유하되 스키마별 `profiles` 테이블(외래키 참조)을 통해 서비스 가입자를 구분하는 보안 전략 수립.
- **클라이언트 고도화**:
  - `createBrowserSupabase` 및 `createServerSupabase` 함수가 스키마 이름을 인자로 받아 동적으로 전환할 수 있도록 리팩토링.
  - 단일 스키마(Scenario A)와 다중 스키마(Scenario B) 사용 예시를 문서화(`docs/database/supabase_strategy.md`).

### 3. 데이터베이스 마이그레이션

- **스키마 변경**: 기존 `daily_english` 스키마를 `speak_mango_en`으로 변경하는 마이그레이션 스크립트 작성 (`database/008_rename_schema_to_speak_mango.sql`).
- **권한 재설정**: 변경된 스키마 명칭에 맞춰 API 및 n8n 접근 권한(`GRANT`)을 일괄 재부여.

## v0.6.6: Header 리팩토링 및 추천 섹션 UI 개선 (2026-01-02)

### 1. Header 컴포넌트 독립 분리

- **`components/Header.tsx`**: 메인 페이지와 상세 페이지에서 중복 사용되던 헤더 로직을 독립 컴포넌트로 분리.
- **Overlap 이슈 해결**: 헤더의 `z-index`를 `z-50`으로 상향 조정하여, 스크롤 시 카드 컴포넌트(특히 카테고리 라벨)가 헤더 위로 노출되는 문제 해결.

### 2. 관련 표현 추천 UI 고도화

- **`components/RelatedExpressions.tsx`**:
  - 상세 페이지 하단의 추천 섹션을 별도 컴포넌트로 분리.
  - 가로 스크롤(`overflow-x-auto`)을 적용하고 각 카드에 최소 가로 폭(`min-w`)을 설정하여 찌그러짐 방지.
  - `FilterBar`와 동일하게 양옆 **Fade 효과**를 추가하여 스크롤 가능 여부를 시각적으로 표시.
- **데이터 확보**: 추천 리스트의 풍부함을 위해 페칭 제한을 6개로 상향.

## v0.6.5: 관련 표현 추천 기능 구현 (2026-01-02)

### 1. 데이터 로직 확장

- **`lib/expressions.ts`**: `getRelatedExpressions(currentId, category)` 함수 추가. 동일한 카테고리의 표현을 최대 3개까지 가져오며, 현재 보고 있는 표현은 결과에서 제외하도록 쿼리 작성.

### 2. UI 구현

- **`app/expressions/[id]/page.tsx`**:
  - 상세 페이지 하단에 '📚 이런 표현은 어때요?' 섹션 추가.
  - `ExpressionCard`를 재사용하여 일관된 디자인 유지.
- **i18n 지원**: `ko.ts`, `en.ts`에 섹션 타이틀(`relatedTitle`) 다국어 문자열 추가.

## v0.6.4: Framer Motion을 활용한 애니메이션 고도화 (2026-01-02)

### 1. 애니메이션 인프라 구축

- **Dependencies**: `framer-motion` 패키지 설치.
- **`components/AnimatedList.tsx`**: 리스트의 Staggered 애니메이션(순차적 등장)과 레이아웃 전환(Layout Animation)을 처리하는 전용 클라이언트 컴포넌트 구현. `AnimatePresence`를 통해 요소 추가/삭제 시 부드러운 전환 지원.

### 2. 컴포넌트 애니메이션 적용

- **`ExpressionCard`**:
  - `motion.div`를 도입하여 카드 진입 시 Fade-in & Slide-up 효과 적용.
  - `whileHover`(살짝 떠오름) 및 `whileTap`(눌림 효과) 인터랙션 추가.
  - `layout` 속성을 통해 필터링 시 카드가 부드럽게 재배치되도록 개선.
- **`app/page.tsx`**: 기존의 정적 그리드를 `AnimatedList`로 교체하여 전체적인 사용자 경험(UX) 상향.

## v0.6.3: CategoryLabel 컴포넌트 추가 및 인터랙션 강화 (2026-01-01)

### 1. CategoryLabel 컴포넌트

- **`components/CategoryLabel.tsx`**: 카테고리 표시 UI를 독립 컴포넌트로 분리. `Tag`와 마찬가지로 `Link`와 `button` 모드를 모두 지원하며, `cn` 유틸리티를 활용한 안전한 스타일링 적용.
- **애니메이션 고도화**: 컴포넌트에 `group` 클래스를 내장하여, 상세 페이지 등 부모 컨텍스트에 상관없이 아이콘 호버 애니메이션(`rotate-12`)이 작동하도록 개선.

### 2. 필터링 연동

- **`ExpressionCard`**: 카드 내 카테고리 클릭 시 `handleCategoryClick`을 통해 메인 페이지로 이동하며 해당 카테고리로 필터링.
- **`ExpressionDetailPage`**: 상세 페이지 상단의 카테고리도 클릭 가능하도록 변경하여, 사용자가 동일한 카테고리의 다른 표현을 쉽게 탐색할 수 있도록 개선.

## v0.6.2: 스타일 유틸리티 도입 및 Tag 컴포넌트 고도화 (2026-01-01)

### 1. 스타일 충돌 방지 시스템

- **Dependencies**: `tailwind-merge` 및 `clsx` 패키지 추가.
- **Utility**: `lib/utils.ts`에 `cn` 함수를 추가하여 Tailwind 클래스 병합 및 조건부 스타일링 지원.
- **Refactoring**: `Tag` 컴포넌트에서 `cn` 유틸리티를 사용하도록 변경하여 외부 `className` 주입 시 발생할 수 있는 스타일 충돌 문제 해결.

## v0.6.1: 검색/필터 UI 고도화 및 컴포넌트 리팩토링 (2026-01-01)

### 1. 검색 및 필터링 기능 구현

- **`SearchBar` 컴포넌트 분리**: 입력 상태 관리와 초기화 로직을 독립적인 컴포넌트로 분리하여 재사용성 확보.
- **`FilterBar` 기능 확장**: 검색어와 카테고리(`category`) 필터링을 URL 쿼리 파라미터(`searchParams`)와 연동하여 구현. 태그 검색(`#tag`) UX 지원.
- **상세 페이지 태그 연동**: `app/expressions/[id]/page.tsx`의 태그를 클릭 시 메인 페이지의 태그 필터로 연결되도록 구현.
- **필터 간소화**: `domain` 필터는 데이터 확충 전까지 임시로 제거하고 `category` 필터에 집중.

### 2. UI/UX 개선

- **스크롤 UI**: `FilterBar`의 가로 스크롤 영역에 양옆 페이드(Fade) 효과를 추가하고 스크롤바를 숨겨(`scrollbar-hide`) 깔끔한 디자인 구현.
- **인터랙션**: `ExpressionCard`를 클라이언트 컴포넌트로 전환하고, 태그 클릭 시 즉시 검색 필터가 적용되도록 `onClick` 핸들러 구현.
- **다크 모드**: 카드 호버 시 그림자와 테두리 효과를 강화하여 다크 모드에서의 시인성 개선.

### 3. 코드 구조 개선

- **Tag 컴포넌트 분리**: `Link`와 `button`을 통합 지원하는 `components/Tag.tsx`를 생성하고, 메인 및 상세 페이지에 일관된 스타일로 적용.
- **설정 중앙화**: UI 관련 설정(아이콘, 색상 등)을 `lib/ui-config.ts`로, 상수(카테고리 목록 등)를 `lib/constants.ts`로 분리.
- **유틸리티 분리**: 문자열 포맷팅 함수 등을 `lib/utils.ts`로 이동.

## v0.6.0: 콘텐츠 분류 체계 고도화 (2026-01-01)

### 1. 2단계 분류 체계 도입 (Dual-Category)

- **Schema Expansion**: `domain`(대분류)과 `category`(소분류) 컬럼을 `expressions` 테이블에 추가하여 콘텐츠 확장성 확보.
- **Migration**: 기존 데이터를 `conversation` 도메인 및 `daily` 카테고리로 일괄 업데이트하는 스크립트 작성 (`database/005_add_category_columns.sql`).

### 2. n8n 워크플로우 최적화

- **Structured Picking**: 'Pick Category' 노드에서 단순 문자열 배열 대신 `domain`, `category`, `topic`을 포함한 객체 배열을 사용하도록 리팩토링.
- **Global Context**: 특정 언어권에 국한된 '콩글리시' 카테고리를 제거하고, 전 세계 공통 주제인 '쇼핑' 등을 추가.

### 3. 다국어 데이터 동시 생성

- **Prompt Engineering**: Gemini Content Generator가 한국어, 일본어, 스페인어 데이터를 한 번에 생성하도록 프롬프트 고도화.
- **Data Integrity**: JSONB 구조(`meaning`, `content`)에 맞춰 각 언어별 키(`ko`, `ja`, `es`)를 동적으로 매핑하도록 n8n 노드 설정 변경.

## v0.5.0: 다국어(i18n) 지원 인프라 구축 (2025-12-31)

### 1. 데이터베이스 스키마 확장

- **i18n Schema**: `meaning` 컬럼을 `JSONB`로 변경하고, `content` 구조를 언어 코드별로 계층화(`{ "ko": { ... } }`)함.
- **Generic Keys**: `dialogue` 내부의 언어별 키(`kr`, `jp` 등)를 중립적인 `translation` 키로 통일하여 확장성 확보.

### 2. 동적 언어 감지 및 미들웨어

- **`middleware.ts`**: 브라우저의 `Accept-Language` 헤더를 분석하여 커스텀 헤더(`x-locale`)를 전달하는 로직 구현.
- **Server-side Helper**: 서버 컴포넌트에서 언어와 딕셔너리를 쉽게 가져올 수 있는 `getI18n()` 헬퍼 함수 (`lib/i18n/server.ts`) 추가.

### 3. 중앙 집중식 문자열 관리

- **Locales**: `lib/i18n/locales/` 내에 `ko.ts`, `en.ts` 등으로 다국어 문자열 분리 관리.
- **Refactoring**: 메인 페이지, 상세 페이지, 카드 컴포넌트의 하드코딩된 문자열을 딕셔너리 기반으로 전면 교체.

## v0.4.2: AI 프롬프트 고도화 및 파이프라인 최적화 (2025-12-31)

### 1. 프롬프트 페르소나 일관성 강화

- **Prompt Engineering**: Gemini Content Generator 프롬프트에 실서비스 데이터 예시 3종을 추가하여 스타일 학습 유도.
- **Constraint**: 특정 집단(학생 등)을 지칭하는 호칭 사용 금지 및 2030 타겟의 세련된 톤 앤 매너 적용.

### 2. JSON 파싱 로직 추가

- **`Parse JSON` Node**: Gemini의 마크다운 코드 블록(` ```json `)이 포함된 응답을 순수 JSON 객체로 변환하는 JavaScript 로직 구현.
- **Error Handling**: 파싱 실패 시 원본 데이터를 로깅하도록 예외 처리.

### 3. n8n 백업 체계 수립

- **`docs/n8n/expressions/workflow_guide.md`**: 워크플로우 Export/Import 가이드 추가.

## v0.4.1: n8n 데이터 지속성 설정 개선 (2025-12-31)

### 1. Docker Volume -> Bind Mount 변경

- **`docker-compose.yml`**: 데이터 초기화 문제 해결을 위해 n8n 데이터 저장 경로를 Docker Volume에서 로컬 디렉토리 바인딩(`user -> ./n8n_data:/home/node/.n8n`)으로 변경.
- **`.gitignore`**: 로컬 DB 파일이 커밋되지 않도록 `n8n_data/` 추가.

## v0.4.0: 자동화 파이프라인 구축 (2025-12-30)

### 1. n8n 로컬 환경 설정

- **`docker-compose.yml`**: n8n을 Docker로 실행하기 위한 설정 추가 (`localhost:5678`).
- **Persistence**: `n8n_data` 볼륨을 통해 워크플로우 저장 데이터 보존.

### 2. 워크플로우 템플릿 제공

- **`n8n/n8n_workflow_template.json`**: Schedule -> HTTP -> Gemini -> Supabase로 이어지는 핵심 파이프라인 템플릿 생성.
- **Gemini 프롬프트**: JSON 구조 응답을 강제하여 DB 데이터 정합성 확보.

## v0.3.0: 상세 페이지 및 데이터 페칭 개선 (2025-12-30)

### 1. 상세 페이지 구현

- **`app/expressions/[id]/page.tsx`**: 개별 표현의 상세 정보를 보여주는 페이지 구현.
- **UI 구성**: 원본 링크, 태그, 회화 예문 등을 포함한 확장된 카드 뷰.
- **Link 연동**: 메인 리스트의 카드를 클릭하면 상세 페이지로 이동하도록 `ExpressionCard` 수정.

### 2. 데이터 페칭 로직 개선 (Refactoring)

- **`lib/expressions.ts`**:
  - `getExpressionById(id)` 함수 추가.
  - 환경 변수 미설정 시 에러가 아닌 Mock 데이터로 우아하게 대체(Fallback)되도록 `try-catch` 및 로직 개선.
- **`lib/mock-data.ts`**: Mock 데이터를 별도 파일로 분리하여 재사용성 확보.

## v0.2.0: 메인 UI 및 데이터 페칭 구현 (2025-12-30)

### 1. 데이터 타입 정의

- **`types/database.ts`**: `Expression` 인터페이스 정의.

### 2. UI 컴포넌트 구현

- **`components/ExpressionCard.tsx`**: 개별 영어 표현을 보여주는 카드 UI. Tailwind CSS 활용.

### 3. 데이터 페칭 로직 (SSR/ISR)

- **`lib/expressions.ts`**: Supabase에서 표현 리스트를 가져오는 서버 측 함수 구현.
- **`app/page.tsx`**:
  - `getExpressions`를 사용하여 서버 컴포넌트에서 데이터 페칭.
  - `export const revalidate = 3600` 설정을 통해 1시간 간격 ISR 적용.
  - 데이터가 없을 경우를 대비한 Mock 데이터 fallback 및 Empty State UI 구현.

## v0.1.1: Supabase 클라이언트 및 환경 설정 (2025-12-30)

### 1. 의존성 설치

- `@supabase/ssr`, `@supabase/supabase-js` 패키지 설치.

### 2. Supabase 클라이언트 유틸리티 구현

- **`lib/supabase/client.ts`**: `createBrowserSupabase` - 브라우저 환경용 클라이언트 설정.
- **`lib/supabase/server.ts`**: `createServerSupabase` - 서버 컴포넌트 및 SSR용 클라이언트 설정 (Next.js 16+ `cookies()` 비동기 대응).

### 3. 환경 변수 템플릿 생성

- **`.env.local.example`**: 프로젝트 URL 및 Anon Key 설정을 위한 템플릿 파일 추가.

## v0.1.0: 프로젝트 스캐폴딩 및 설계 (2025-12-30)

- Command: `npx create-next-app@latest speak-mango-en --ts --tailwind --eslint --app --no-src-dir`
- 기본 설정: TypeScript, Tailwind CSS, App Router 사용.

### 2. 문서화 (Documentation)

- **`docs/database/schema.md`**: Supabase `expressions` 테이블 스키마 정의 (UUID, 영어 표현, 뜻, 예문 등).
- **`docs/n8n/expressions/workflow_guide.md`**: n8n 자동화 로직 설계 (HTTP Request -> Gemini AI -> Supabase).
- **`docs/project_context.md`**: 프로젝트 규칙 및 아키텍처 정의.

### 3. 향후 계획 (Next Steps)

- Supabase 프로젝트 생성 및 테이블 실제 적용.
- Next.js에서 Supabase 클라이언트 연동 (`@supabase/ssr` 패키지 설치 예정).
- 메인 페이지 UI 구현 (카드 리스트 형태).
