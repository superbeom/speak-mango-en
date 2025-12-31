import { createServerSupabase } from "@/lib/supabase/server";
import { Expression } from "@/types/database.types";
import { MOCK_EXPRESSIONS } from "@/lib/mock-data";

export async function getExpressions(): Promise<Expression[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("expressions")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch error:", error.message);
      return MOCK_EXPRESSIONS;
    }

    return (data as Expression[]) || [];
  } catch (error) {
    console.warn("Failed to fetch expressions (check env vars):", error);
    return MOCK_EXPRESSIONS;
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
      // If not found in DB, check mock data before returning null
      const mockItem = MOCK_EXPRESSIONS.find((item) => item.id === id);
      if (mockItem) return mockItem;

      console.warn(`Supabase fetch error for id ${id}:`, error.message);
      return null;
    }

    return data as Expression;
  } catch (error) {
    console.warn(`Failed to fetch expression ${id}:`, error);
    // Fallback to mock data
    const mockItem = MOCK_EXPRESSIONS.find((item) => item.id === id);
    return mockItem || null;
  }
}
