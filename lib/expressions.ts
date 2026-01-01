import { createServerSupabase } from "@/lib/supabase/server";
import { Expression } from "@/types/database";

export async function getExpressions(): Promise<Expression[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("expressions")
      .select("*")
      .order("published_at", { ascending: false });

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
