-- Migration: Grant permissions for speak_mango_en schema
-- Created: 2026-02-04
-- Description: speak_mango_en 스키마 및 테이블에 대한 권한을 anon, authenticated, service_role에 부여

set search_path to speak_mango_en;

-- 1. 스키마 사용 권한 (방 문 열쇠)
grant usage on schema speak_mango_en to anon, authenticated, service_role;

-- 2. 모든 테이블 조작 권한 (가구 사용)
grant all on all tables in schema speak_mango_en to anon, authenticated, service_role;

-- 3. 모든 시퀀스 권한 (ID 발급기 사용)
grant all on all sequences in schema speak_mango_en to anon, authenticated, service_role;

-- 4. 미래의 테이블 자동 권한 부여 (앞으로 생길 테이블에도 자동 적용)
alter default privileges in schema speak_mango_en grant all on tables to anon, authenticated, service_role;
