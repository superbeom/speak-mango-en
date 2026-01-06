"use server";

import { getExpressions, ExpressionFilters } from "@/lib/expressions";
import { Expression } from "@/types/database";

export async function fetchMoreExpressions(
  filters: ExpressionFilters,
  page: number
): Promise<Expression[]> {
  // 인자로 받은 필터와 새 페이지 번호를 사용하여 다음 데이터 페칭
  return await getExpressions({
    ...filters,
    page,
  });
}
