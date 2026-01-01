# Future Todos & Technical Debt

> 당장 급하지 않지만 향후 개선해야 할 사항이나 아이디어를 기록합니다.

## Improvements

- [ ] **Mobile Optimization**: 모바일 환경에서의 카드 리스트 뷰 최적화 (스와이프 제스처 등).
- [ ] **Search**: 표현 검색 기능 추가.
- [ ] **Category Filter**: 대분류(`domain`) 및 소분류(`category`)별 필터링 기능 구현.
- [ ] **Content Expansion**:
  - `domain`: `test`(TOEIC, TOEFL), `vocabulary`(주제별 단어장) 등 추가.
  - `category`: `toeic`, `toefl`, `animal`, `plant`, `home` 등 구체적인 테마 확장.
  - [ ] **Independent Workflows**: `test` 및 `vocabulary` 도메인은 생성 로직과 프롬프트가 다르므로, `conversation` 워크플로우와 분리하여 별도의 n8n 워크플로우로 구축.
- [ ] **i18n Client Transition**: 추후 북마크, 사용자 설정 등 **클라이언트 상호작용이 많아지면** 현재의 Server Helper 방식에서 `Client Context` 기반 라이브러리(`next-intl` 등)로 전환 고려.

## Technical Debt

- [ ] **Type Safety**: Supabase Generated Types 자동 업데이트 스크립트 추가.
- [ ] **n8n Production Config**: 실제 서비스 배포 시 `N8N_HOST` 및 `WEBHOOK_URL`을 실제 도메인 주소로 변경 필요.
- [ ] **Security (RLS)**: 프로덕션 배포 전 `daily_english` 스키마의 RLS를 활성화하고, `service_role` 전용 정책 설정 필요 (현재는 개발 편의를 위해 비활성화 상태).
- [ ] **Security (n8n)**: Supabase Credential의 'Allowed HTTP Request Domains'를 'All'에서 'Specific Domains'로 변경하여 보안 강화.
- [ ] **i18n Content Strategy**: DB의 `meaning` 및 `content` JSONB 컬럼에 `ja`, `es` 등 추가 언어 데이터 생성 워크플로우(n8n) 고도화.
