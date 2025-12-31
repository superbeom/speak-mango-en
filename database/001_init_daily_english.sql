-- [001] Initial Setup for Daily English Project
-- Description: Daily English 프로젝트 전용 격리 스키마 및 테이블 생성
-- 이 SQL 스크립트는 Daily English 자동화 파이프라인에 필요한 스키마와 테이블을 초기화합니다.

-- 1. Schema Creation
-- 프로젝트별 데이터 격리를 위해 별도의 스키마(daily_english)를 생성합니다.
-- 이를 통해 단일 Supabase 프로젝트 내에서 여러 서비스의 테이블이 섞이는 것을 방지하고 독립적인 관리가 가능해집니다.
create schema if not exists daily_english;

-- 2. Permissions & Privileges
-- Supabase의 Data API(PostgREST) 및 인증 역할들이 새 스키마에 접근할 수 있도록 권한을 부여합니다.
-- anon: 비로그인 사용자, authenticated: 로그인 사용자, service_role: 관리자 및 백엔드(n8n 등) 권한
grant usage on schema daily_english to anon, authenticated, service_role;
grant all on all tables in schema daily_english to anon, authenticated, service_role;
grant all on all sequences in schema daily_english to anon, authenticated, service_role;
grant all on all routines in schema daily_english to anon, authenticated, service_role;

-- 3. Table: daily_english.expressions
-- 영어 표현, 한국어 뜻, 그리고 AI(Gemini)가 가공한 상세 콘텐츠를 저장하는 핵심 테이블입니다.
create table if not exists daily_english.expressions (
  id uuid default gen_random_uuid() primary key, -- 고유 식별자 (자동 생성 UUID)
  expression text not null,                     -- 추출된 핵심 영어 표현 (예: "Piece of cake")
  meaning text not null,                        -- 표현의 한국어 의미 (예: "식은 죽 먹기")
  content jsonb not null default '{}'::jsonb,      -- AI가 생성한 상세 데이터 (상황 설명, 대화문, 팁, 퀴즈 포함)
  origin_url text,                              -- 데이터의 출처가 된 원본 사이트 URL
  tags text[],                                  -- 분류 및 검색을 위한 태그 배열 (예: ['daily', 'humor'])
  published_at timestamp with time zone default now(), -- 사용자에게 노출될 시간 (정렬 및 예약 게시용)
  created_at timestamp with time zone default now()    -- 데이터베이스 레코드 생성 시간
);

-- 4. Indexing Strategy
-- 대량의 데이터에서도 빠른 조회 성능을 유지하기 위한 인덱스 설정입니다.

-- 최신 콘텐츠를 먼저 보여주기 위한 정렬(Ordering) 성능 최적화
create index if not exists idx_expressions_published_at on daily_english.expressions (published_at desc);

-- PostgreSQL의 GIN(Generalized Inverted Index)을 사용하여 태그 배열(tags) 내의 요소 검색 성능 향상
create index if not exists idx_expressions_tags on daily_english.expressions using gin (tags);

-- JSONB 내부의 구조화된 데이터를 효율적으로 검색하기 위한 GIN 인덱스
create index if not exists idx_expressions_content on daily_english.expressions using gin (content);

-- 5. Table Comments
-- 데이터베이스 관리 도구에서 테이블의 용도를 쉽게 파악할 수 있도록 설명을 추가합니다.

comment on table daily_english.expressions is '영어 표현과 AI 가공 콘텐츠를 관리하는 메인 데이터 테이블';

-- 6. RLS Configuration (for Initial Setup)
-- 초기 개발 및 n8n 자동화 테스트의 편의를 위해 RLS(Row Level Security)를 비활성화합니다.
alter table daily_english.expressions disable row level security;