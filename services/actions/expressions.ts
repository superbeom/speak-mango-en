"use server";

import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { Expression } from "@/types/expression";

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
});
