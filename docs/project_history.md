# Project History & Q&A Logs

> 최신 항목이 상단에 위치합니다.

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
  - `docs/n8n_optimization_steps.md`: AI 기반 생성 및 중복 방지 가이드로 전면 수정.
  - `docs/n8n_workflow_guide.md`: 변경된 아키텍처(Category Selection -> Generator) 반영.
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
- `docs/n8n_workflow_template.json` 생성 (가져오기용 워크플로우 템플릿).
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

- Next.js 15 + Tailwind CSS + TypeScript 프로젝트 생성 (`daily-english`).
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
