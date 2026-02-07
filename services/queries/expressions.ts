"use server";

import { cache } from "react";
import { Expression } from "@/types/expression";
import { createServerSupabase } from "@/lib/supabase/server";

export interface ExpressionFilters {
  domain?: string;
  category?: string;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
  locale?: string; // 검색 시 사용할 언어 (예: 'ko', 'en', 'ja')
}

/**
 * 제공된 필터(도메인, 카테고리 등)를 기반으로 표현 목록을 가져옵니다.
 *
 * Supabase의 'expressions' 테이블을 조회하며, 도메인, 카테고리, 검색어, 태그 등의
 * 필터를 적용합니다. 페이지네이션 기능도 포함되어 있습니다.
 *
 * @param filters - 필터링 기준을 담은 선택적 객체:
 *   - domain: 도메인별 필터 (예: 'conversation', 'business'). 'all'은 무시됩니다.
 *   - category: 카테고리별 필터 (예: 'daily', 'travel'). 'all'은 무시됩니다.
 *   - search: 해당 문자열을 포함하는 표현을 검색합니다 (대소문자 구분 없음).
 *   - tag: 특정 태그를 가진 표현을 필터링합니다.
 *   - page: 페이지네이션을 위한 페이지 번호 (기본값: 1).
 *   - limit: 페이지당 항목 수 (기본값: 12).
 * @returns Expression 객체 배열을 담은 Promise를 반환합니다. 에러 발생 시 빈 배열을 반환합니다.
 */
export const getExpressions = cache(async function getExpressions(
  filters?: ExpressionFilters,
): Promise<Expression[]> {
  try {
    const supabase = await createServerSupabase();
    let query = supabase.from("expressions").select("*");

    // 필터 적용
    if (filters?.domain && filters.domain !== "all") {
      query = query.eq("domain", filters.domain);
    }
    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }
    if (filters?.tag) {
      // tags 컬럼이 해당 태그를 포함하고 있는지 확인 (배열 내 검색)
      query = query.contains("tags", [filters.tag]);
    }
    if (filters?.search) {
      const searchTerm = filters.search;
      const locale = filters.locale || "en"; // 기본값: 영어

      /**
       * 로케일별 검색: expression 필드 + 현재 로케일의 meaning 필드만 검색
       * 로케일별 검색 최적화 (Double-Filter Pattern):
       * 1. meaning_text.ilike: Trigram 인덱스를 사용하여 후보군을 빠르게 압축 (Candidate Generation).
       * 2. meaning->>locale.ilike: 실제 데이터에서 해당 언어의 값만 정확하게 필터링 (Recheck).
       * 이 조합은 인덱스의 속도와 로케일 필터링의 정확성을 모두 확보함.
       */
      query = query.or(
        `expression.ilike.%${searchTerm}%,and(meaning_text.ilike.%${searchTerm}%,meaning->>${locale}.ilike.%${searchTerm}%)`,
      );
    }

    // 페이지네이션 처리
    const limit = filters?.limit || 12;
    const page = filters?.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await query
      .order("published_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.warn("Supabase fetch error:", error.message);
      return [];
    }

    return (data as Expression[]) || [];
  } catch (error) {
    console.warn("Failed to fetch expressions (check env vars):", error);
    return [];
  }
});

/**
 * ID를 사용하여 단일 표현을 가져옵니다.
 *
 * @param id - 가져올 표현의 고유 ID입니다.
 * @returns 해당 ID를 가진 Expression 객체 또는 찾을 수 없거나 에러 발생 시 null을 반환합니다.
 */
export const getExpressionById = cache(async function getExpressionById(
  id: string,
): Promise<Expression | null> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("expressions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.warn(`Supabase fetch error for id ${id}:`, error.message);
      return null;
    }

    return data as Expression;
  } catch (error) {
    console.warn(`Failed to fetch expression ${id}:`, error);
    return null;
  }
});

/**
 * ID 목록을 바탕으로 여러 표현(Expression) 데이터를 한꺼번에 가져옵니다.
 *
 * 주로 로컬 스토리지에 ID만 저장하는 무료 사용자의 단어장 상세 내용을
 * DB에서 불러올 때 사용됩니다.
 *
 * @param ids - 가져올 표현의 고유 ID 배열입니다.
 * @returns 조회된 Expression 객체 배열을 담은 Promise를 반환합니다. 결과는 최신순으로 정렬됩니다.
 */
export const getExpressionsByIds = cache(async function getExpressionsByIds(
  ids: string[],
): Promise<Expression[]> {
  if (!ids || ids.length === 0) return [];

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("expressions")
      .select("*")
      .in("id", ids)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch expressions by IDs:", error);
      return [];
    }

    return (data as Expression[]) || [];
  } catch (error) {
    console.error("Failed to fetch expressions by IDs:", error);
    return [];
  }
});

/**
 * 동일한 카테고리 내의 관련 표현들을 가져옵니다.
 *
 * 상세 페이지 하단의 "관련 표현"이나 "추천" 등을 표시할 때 사용됩니다.
 * 결과에서 현재 보고 있는 표현은 제외됩니다.
 *
 * @param currentId - 결과에서 제외할 현재 표현의 ID입니다.
 * @param category - 관련 표현을 찾을 카테고리입니다.
 * @param limit - 반환할 최대 관련 표현 수 (기본값: 4).
 * @returns 관련 Expression 객체 배열을 반환합니다.
 */
export const getRelatedExpressions = cache(async function getRelatedExpressions(
  currentId: string,
  category: string,
  limit = 4,
): Promise<Expression[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("expressions")
      .select("*")
      .eq("category", category)
      .neq("id", currentId)
      .limit(limit)
      .order("published_at", { ascending: false });

    if (error) {
      console.warn(
        "Supabase fetch error for related expressions:",
        error.message,
      );
      return [];
    }

    return (data as Expression[]) || [];
  } catch (error) {
    console.warn("Failed to fetch related expressions:", error);
    return [];
  }
});

/**
 * 모든 표현의 ID를 최신순으로 가져옵니다.
 *
 * 주로 동적 사이트맵(SEO) 생성이나 정적 경로(Static Paths) 생성을 위해 사용됩니다.
 *
 * @returns 표현 ID 문자열 배열을 반환합니다.
 */
export const getAllExpressionIds = cache(
  async function getAllExpressionIds(): Promise<string[]> {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("expressions")
        .select("id")
        .order("published_at", { ascending: false });

      if (error) {
        console.warn("Failed to fetch all IDs for sitemap:", error.message);
        return [];
      }

      return (data || []).map((item) => item.id);
    } catch (error) {
      console.warn("Failed to fetch all IDs for sitemap:", error);
      return [];
    }
  },
);

/**
 * 무작위 표현을 지정된 개수만큼 가져옵니다.
 *
 * 퀴즈 기능을 위해 사용됩니다.
 * 구현 방식:
 * 1. 전체 ID 목록을 가져옵니다.
 * 2. 요청된 개수만큼 무작위로 ID를 추출합니다.
 * 3. 추출된 ID들에 대한 상세 정보를 한 번에 조회합니다.
 *
 * @param limit - 가져올 무작위 표현의 개수 (기본값: 10).
 * @returns 무작위로 선정된 Expression 객체 배열.
 */
export const getRandomExpressions = cache(async function getRandomExpressions(
  limit = 10,
): Promise<Expression[]> {
  try {
    const supabase = await createServerSupabase();

    // Use RPC for efficient random selection
    const { data, error } = await supabase.rpc("get_random_expressions", {
      limit_cnt: limit,
    });

    if (error) {
      console.warn("Supabase RPC error for random expressions:", error.message);
      return [];
    }

    return (data as Expression[]) || [];
  } catch (error) {
    console.warn("Failed to fetch random expressions:", error);
    return [];
  }
});

/**
 * 무한 스크롤 및 페이지네이션을 위한 추가 데이터 페칭 함수입니다.
 * 클라이언트 컴포넌트의 useSWRInfinite 등에서 다음 페이지 데이터를 불러올 때 상용됩니다.
 *
 * @param filters - 적용할 필터 조건 (로케일, 검색어, 카테고리 등).
 * @param page - 불러올 페이지 번호.
 * @returns 해당 페이지의 Expression 객체 배열을 담은 Promise를 반환합니다.
 */
export async function fetchMoreExpressions(
  filters: ExpressionFilters,
  page: number,
): Promise<Expression[]> {
  // 인자로 받은 필터와 새 페이지 번호를 사용하여 다음 데이터 페칭
  return await getExpressions({
    ...filters,
    page,
  });
}
