-- Migration: Enable RLS on All Tables & Secure Policies
-- Created: 2026-02-05
-- Description: 모든 테이블에 RLS를 활성화하고, 용도에 맞는 최소 권한 정책(Least Privilege Policy)을 적용합니다.
--              vocabulary_lists, vocabulary_items는 이미 027번에서 처리되었으므로 제외합니다.

set search_path to speak_mango_en;

-- 1. Enable RLS on all remaining tables
alter table expressions enable row level security;
alter table users enable row level security;
alter table accounts enable row level security;
alter table sessions enable row level security;
alter table user_actions enable row level security;


-- 2. Define Policies for `expressions` (Public Read-Only)
-- 누구나 표현 데이터를 볼 수 있어야 합니다 (로그인 안 한 사용자 포함).
-- 쓰기/수정/삭제는 정책이 없으므로 기본적으로 거부됩니다 (Service Role 제외).
create policy "Anyone can view expressions"
  on expressions for select
  using (true);


-- 3. Define Policies for `user_actions` (Owner Only)
-- 내 액션(저장, 학습 등)은 나만 볼 수 있고 관리할 수 있어야 합니다.
create policy "Users can view their own actions"
  on user_actions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own actions"
  on user_actions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own actions"
  on user_actions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own actions"
  on user_actions for delete
  using (auth.uid() = user_id);


-- 4. Define Policies for `users` (Owner Read-Only)
-- 내 프로필 정보는 나만 볼 수 있습니다. (NextAuth가 관리하므로 쓰기 권한은 Service Role에 일임)
-- 다른 사용자의 프로필 조회가 필요한 경우(예: 친구 기능)가 생기면 그때 정책을 추가합니다.
create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

-- NextAuth Adapter가 업데이트를 수행할 때는 Service Role을 사용하므로 별도 정책이 필요 없지만,
-- 만약 클라이언트에서 직접 '내 정보 수정'을 한다면 아래 정책이 필요할 수 있습니다.
-- 현재는 보수적으로 닫아둡니다.


-- 5. Define Policies for `accounts` & `sessions` (No Public Access)
-- 이 테이블들은 NextAuth 서버 로직(Service Role)에서만 접근하면 되므로,
-- RLS를 켜두고 아무런 정책도 만들지 않음으로써 일반 사용자의 접근을 원천 차단합니다.
-- (No policies defined implies Deny All for anon/authenticated roles)
