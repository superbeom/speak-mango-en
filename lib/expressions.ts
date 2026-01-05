import { createServerSupabase } from "@/lib/supabase/server";
import { Expression } from "@/types/database";

export interface ExpressionFilters {
  domain?: string;
  category?: string;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export async function getExpressions(
  filters?: ExpressionFilters
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
      query = query.ilike("expression", `%${filters.search}%`);
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
}

export async function getExpressionById(
  id: string
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
}

export async function getRelatedExpressions(
  currentId: string,
  category: string,
  limit = 4
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
        error.message
      );
      return [];
    }

    return (data as Expression[]) || [];
  } catch (error) {
    console.warn("Failed to fetch related expressions:", error);
    return [];
  }
}
