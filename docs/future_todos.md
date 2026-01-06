# Future Todos & Technical Debt

> 당장 급하지 않지만 향후 개선해야 할 사항이나 아이디어를 기록합니다.

## Improvements

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

## Technical Debt

- [ ] **Type Safety**: Supabase Generated Types 자동 업데이트 스크립트 추가.
- [ ] **n8n Production Config**: 실제 서비스 배포 시 `N8N_HOST` 및 `WEBHOOK_URL`을 실제 도메인 주소로 변경 필요.
- [ ] **Security (RLS)**: 프로덕션 배포 전 `speak_mango_en` 스키마의 RLS를 활성화하고, `service_role` 전용 정책 설정 필요 (현재는 개발 편의를 위해 비활성화 상태).
- [ ] **Security (n8n)**: Supabase Credential의 'Allowed HTTP Request Domains'를 'All'에서 'Specific Domains'로 변경하여 보안 강화.
- [ ] **i18n Content Strategy**: DB의 `meaning` 및 `content` JSONB 컬럼에 `ja`, `es` 등 추가 언어 데이터 생성 워크플로우(n8n) 고도화.
