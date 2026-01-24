# Future Todos & Technical Debt

> 당장 급하지 않지만 향후 개선해야 할 사항이나 아이디어를 기록합니다.

## Improvements

- [ ] **Search Performance (FTS)**: `lib/expressions.ts`의 `ILIKE` 쿼리를 Supabase의 **Full Text Search (tsvector)**로 전환하여 대량 데이터 검색 성능 확보.
- [ ] **Mobile Interaction**: 모바일 환경에서의 카드 리스트 뷰 최적화 (스와이프 제스처, 긴 탭 인터랙션 등).

- [ ] **Category Expansion**: 현재 비활성화된 대분류(`domain`) 필터 활성화 및 데이터 연동.
  - [ ] **Domain Filter Restoration**: 현재는 `conversation` 도메인만 존재하므로 UI에서 비활성화함. 추후 `test`, `vocabulary` 데이터가 쌓이면 다시 활성화 필요.
- [ ] **Content Expansion**:
  - `domain`: `test`(TOEIC, TOEFL), `vocabulary`(주제별 단어장) 등 추가.
  - `category`: `toeic`, `toefl`, `animal`, `plant`, `home` 등 구체적인 테마 확장.
  - [ ] **Independent Workflows**: `test` 및 `vocabulary` 도메인은 생성 로직과 프롬프트가 다르므로, `conversation` 워크플로우와 분리하여 별도의 n8n 워크플로우로 구축.
- [ ] **i18n UI Expansion**: 현재 KO, EN 중심의 UI를 일본어(JA), 스페인어(ES)로 확장하여 다국어 학습자들에게 최적화된 인터페이스 제공.
- [ ] **i18n Client Transition**: 추후 북마크, 사용자 설정 등 **클라이언트 상호작용이 많아지면** 현재의 Server Helper 방식에서 `Client Context` 기반 라이브러리(`next-intl` 등)로 전환 고려.
- [ ] **Shared Schema Implementation**: 사용자 가입, 프로필 통합 등 공유 데이터 관리가 필요한 시점에 `speak_mango_shared` 스키마를 생성하고 `auth.users`와 연동된 통합 시스템 구축.
- [ ] **Feature Gating (Audio Support)**: 음성 지원(TTS) 기능을 사용자 티어(`free`/`pro`)에 따라 차별화하여 제공.
  - [ ] **UI Logic**: 무료 사용자가 '원어민 대화 듣기' 버튼 클릭 시 유료 기능 안내 모달(Payment Prompt) 팝업 및 결제 페이지 유도.
  - [ ] **Security (RLS)**: Supabase Storage 정책을 강화하여 유료 사용자만 오디오 파일 다운로드/접근이 가능하도록 보안 고도화.
    - **실행 지침**: 버킷 권한을 `Public`에서 **`Private`**으로 전환하고, `storage.objects` 테이블에 RLS 정책을 추가하여 `profiles.tier`가 'pro'인 사용자만 `SELECT` 가능하도록 제한.

- [ ] **Admin Page Implementation**: 현재는 없지만 추후 콘텐츠 관리 및 n8n 워크플로우 제어를 위한 관리자 페이지(`admin`) 구축 필요.
  - 관련 경로: `/admin`, `/n8n` (필요 시)
  - **Robots.txt**: 구현 시 `app/robots.ts`의 `disallow` 목록에 해당 경로들을 반드시 추가할 것.

## Technical Debt

- [ ] **Logic Bug Fix**: `hooks/usePaginatedList.ts`의 `finally` 블록 내 불필요한 `setLoading(true)` 호출 제거.
- [ ] **Type Safety**: Supabase Generated Types 자동 업데이트 스크립트 추가.
- [ ] **n8n Production Config**: 실제 서비스 배포 시 `N8N_HOST` 및 `WEBHOOK_URL`을 실제 도메인 주소로 변경 필요.
- [ ] **Security (RLS)**: 프로덕션 배포 전 `speak_mango_en` 스키마의 RLS를 활성화하고, `service_role` 전용 정책 설정 필요 (현재는 개발 편의를 위해 비활성화 상태).
- [ ] **Security (n8n)**: Supabase Credential의 'Allowed HTTP Request Domains'를 'All'에서 'Specific Domains'로 변경하여 보안 강화.
- [ ] **i18n Content Strategy**: DB의 `meaning` 및 `content` JSONB 컬럼에 `ja`, `es` 등 추가 언어 데이터 생성 워크플로우(n8n) 고도화.

## User System & Interaction (사용자 시스템 및 고도화)

### 하이브리드 리포지토리 및 실시간 동기화

- [ ] **Hybrid Repository Layer**: `useUserActions` 훅에서 로그인 상태에 따라 `LocalRepository`와 `RemoteRepository`를 투명하게 전환하는 추상화 계층 구현.
- [ ] **Bulk Sync Logic**: 사용자가 로그인하거나 구독 결제 완료 시, 로컬 데이터를 서버 DB로 일괄 이동(`Merge`)하는 서버 액션 구현.
- [ ] **Action Integrity**: 중복 액션 방지 및 네트워크 불안정 시 로컬 캐시 우선 반영 로직 고도화.

### 학습 관리 및 마이 페이지

- [ ] **Engagement Tracking**: '학습 완료' 처리 시 자동으로 다음 추천 콘텐츠로 스크롤하거나 관련 퀴즈를 제안하는 연속적 UX 구현.
- [ ] **My Mango (Dashboard)**: `/my` 경로에서 좋아요/저장/학습한 기여도 요약 및 필터링된 카드 리스트 제공.
- [ ] **Adaptive Listing**: 메인 페이지에서 '이미 학습한 표현'을 흐리게 처리하거나 필터로 숨길 수 있는 개인화 기능 UI 추가.

### 학습 기반 퀴즈 (Learning-based Quiz)

- **Review Mode**:
  - 랜덤 퀴즈가 아닌, 사용자가 '학습 완료'한 표현들만을 대상으로 퀴즈 출제.
  - 망각 곡선을 고려한 복습 알림 및 퀴즈 생성 (추후 고도화).
- **Access**: `/quiz` 페이지에서 "랜덤 퀴즈"와 "복습 퀴즈(나의 단어장)" 모드 선택 가능하도록 확장.
- [ ] **Quiz Summary Save**: QuizState가 `summary`일 때(퀴즈 완료 화면), 결과 리스트에서 각 표현을 바로 '저장(Save)'할 수 있는 버튼/기능 추가.

---

## Marketing & Analytics (마케팅 및 분석)

### Google Tag Manager (GTM) 도입 (선택사항)

**현재 상태**: GA4를 `gtag.js`로 직접 연동 중

**도입 시점**: 다음 조건 중 하나 이상 충족 시 고려

- 마케팅 도구 2개 이상 사용 (Facebook Pixel, Google Ads, Hotjar 등)
- 마케팅 팀이 구성되어 비개발자가 태그를 관리해야 할 때
- A/B 테스트를 자주 실행할 때

**장점**:

- 코드 수정 없이 마케팅 태그 추가/수정 가능
- 여러 도구를 한 곳에서 중앙 관리
- 태그 설정 변경 이력 추적 및 롤백 가능
- 조건부 태그 실행 (특정 페이지/이벤트에서만)

**단점**:

- 추가 학습 곡선 (GTM 자체를 배워야 함)
- 간단한 프로젝트에는 오버엔지니어링
- 디버깅 복잡도 증가

**결론**: 현재는 불필요. GA4만 사용하는 상황에서는 현재 방식(직접 연동)이 더 명확하고 타입 안전함.

---

## SEO & Branding (검색 최적화 및 브랜딩)

### Schema.org sameAs 속성 추가

**현재 상태**: Organization 스키마에 `sameAs` 빈 배열

**추가 시점**: 공식 소셜 미디어 계정 생성 후

**추가할 내용**:

```json
"sameAs": [
  "https://twitter.com/speakmango",
  "https://facebook.com/speakmango",
  "https://instagram.com/speakmango",
  "https://linkedin.com/company/speakmango",
  "https://youtube.com/@speakmango"
]
```

**효과**:

- **Knowledge Graph**: Google 검색 시 우측 정보 패널에 소셜 미디어 링크 표시
- **브랜드 신뢰도**: Google이 "공식 소셜 미디어가 있는 진짜 브랜드"로 인식
- **SEO 개선**: 검색 결과 순위 향상 가능
- **검색 결과 강화**: 소셜 미디어 링크 및 "공식" 배지 표시 가능

**우선순위**: 낮음 (소셜 미디어 계정 생성이 선행 조건)
