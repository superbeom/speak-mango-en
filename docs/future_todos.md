# Future Todos & Technical Debt

> 당장 급하지 않지만 향후 개선해야 할 사항이나 아이디어를 기록합니다.

## Improvements

- [ ] **Mobile Optimization**: 모바일 환경에서의 카드 리스트 뷰 최적화 (스와이프 제스처 등).
- [ ] **Search**: 표현 검색 기능 추가.
- [ ] **Category Filter**: 태그별 필터링 기능.

## Technical Debt

- [ ] **Type Safety**: Supabase Generated Types 자동 업데이트 스크립트 추가.
- [ ] **n8n Production Config**: 실제 서비스 배포 시 `N8N_HOST` 및 `WEBHOOK_URL`을 실제 도메인 주소로 변경 필요.
- [ ] **Security (RLS)**: 프로덕션 배포 전 `daily_english` 스키마의 RLS를 활성화하고, `service_role` 전용 정책 설정 필요 (현재는 개발 편의를 위해 비활성화 상태).
