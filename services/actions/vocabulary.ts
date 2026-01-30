"use server";

import { createAppError, VOCABULARY_ERROR } from "@/types/error";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/utils";

export interface VocabularyList {
  id: string;
  title: string;
  item_count?: number; // Optional count for UI
}

export async function getVocabularyLists(): Promise<VocabularyList[]> {
  const { userId, isPro } = await getAuthSession();

  if (!userId || !isPro) {
    // Free users: Handled in Release Phase (Local Storage) or mocked
    // Ideally this service is only for Remote users.
    return [];
  }

  const supabase = await createServerSupabase();

  // Use RPC to get lists with item counts in a single query
  const { data, error } = await supabase.rpc(
    "get_vocabulary_lists_with_counts",
  );

  if (error) {
    console.error("Failed to fetch vocabulary lists:", error);
    throw createAppError(VOCABULARY_ERROR.FETCH_FAILED);
  }

  const rows = (data ?? []) as VocabularyList[];

  return rows.map((item) => ({
    id: item.id,
    title: item.title,
    item_count: Number(item.item_count || 0),
  }));
}

export async function createVocabularyList(
  title: string,
): Promise<VocabularyList> {
  const { userId, isPro } = await getAuthSession();

  if (!userId || !isPro) {
    throw createAppError(VOCABULARY_ERROR.PREMIUM_REQUIRED);
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("vocabulary_lists")
    .insert({
      user_id: userId,
      title: title.trim(),
    })
    .select("id, title")
    .single();

  if (error) {
    console.error("Failed to create vocabulary list:", error);
    throw createAppError(VOCABULARY_ERROR.CREATE_FAILED);
  }

  return data;
}

// Check if an expression is in any list (for the active 'saved' state icon)
export async function getSavedListIds(expressionId: string): Promise<string[]> {
  const { isPro } = await getAuthSession();

  if (!isPro) return [];

  const supabase = await createServerSupabase();

  // Join is tricky with complex RLS or just do a subquery
  // Let's select from items where list owner is me
  // Actually policies handle the "owner is me" part via RLS on lists
  const { data, error } = await supabase
    .from("vocabulary_items")
    .select("list_id")
    .eq("expression_id", expressionId);

  if (error) {
    console.error("Failed to get saved list IDs:", error);
    return [];
  }

  return data.map((item) => item.list_id);
}

export async function addToVocabularyList(
  listId: string,
  expressionId: string,
): Promise<void> {
  const { isPro } = await getAuthSession();

  if (!isPro) throw createAppError(VOCABULARY_ERROR.UNAUTHORIZED);

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("vocabulary_items").insert({
    list_id: listId,
    expression_id: expressionId,
  }); // Constraints will handle duplicates

  if (error) {
    // Ignore duplicate key error (code 23505) gracefully?
    if (error.code === "23505") return;
    console.error("Failed to add to list:", error);
    throw createAppError(VOCABULARY_ERROR.ADD_FAILED);
  }
}

export async function removeFromVocabularyList(
  listId: string,
  expressionId: string,
): Promise<void> {
  const { isPro } = await getAuthSession();

  if (!isPro) throw createAppError(VOCABULARY_ERROR.UNAUTHORIZED);

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("vocabulary_items")
    .delete()
    .eq("list_id", listId)
    .eq("expression_id", expressionId);

  if (error) {
    console.error("Failed to remove from list:", error);
    throw createAppError(VOCABULARY_ERROR.REMOVE_FAILED);
  }
}
