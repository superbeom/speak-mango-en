-- [002] Fix Permissions and RLS for n8n Access
-- Description: n8n의 Supabase 노드 접근 권한 문제(permission denied) 해결
-- Created at: 2025-12-30

-- 1. Schema Usage 권한 재확인
-- n8n이 daily_english 스키마를 볼 수 있도록 합니다.
grant usage on schema daily_english to anon, authenticated, service_role;

-- 2. Table 권한 재확인
-- expressions 테이블에 대해 읽기/쓰기 권한을 명시적으로 부여합니다.
grant all on table daily_english.expressions to anon, authenticated, service_role;

-- 3. Sequence 권한 (Future-proofing)
-- 만약 id가 시퀀스를 사용하거나 추후 시퀀스가 추가될 경우를 대비합니다.
grant all on all sequences in schema daily_english to anon, authenticated, service_role;

-- 4. RLS (Row Level Security) 설정
-- n8n 테스트 및 초기 운영 단계에서 권한 오류를 방지하기 위해 RLS를 비활성화합니다.
-- 추후 보안 강화가 필요할 때 ENABLE ROW LEVEL SECURITY로 변경하고 정책(Policy)을 추가해야 합니다.
alter table daily_english.expressions disable row level security;
