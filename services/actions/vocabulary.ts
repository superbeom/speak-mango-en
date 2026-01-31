"use server";

import { cache } from "react";
import { createAppError, VOCABULARY_ERROR } from "@/types/error";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/utils";
import {
  VocabularyList,
  VocabularyListWithCount,
  VocabularyListDetails,
} from "@/types/vocabulary";

/**
 * 현재 사용자의 모든 단어장 목록을 가져옵니다.
 * 각 단어장은 포함된 아이템 개수(item_count) 정보를 포함합니다.
 *
 * @returns 단어장 목록 배열을 담은 Promise를 반환합니다.
 */
export const getVocabularyLists = cache(
  async function getVocabularyLists(): Promise<VocabularyListWithCount[]> {
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

    const rows = (data ?? []) as VocabularyListWithCount[];

    return rows.map((item) => ({
      id: item.id,
      title: item.title,
      item_count: Number(item.item_count || 0),
      is_default: item.is_default,
    }));
  },
);

/**
 * 새로운 단어장을 생성합니다.
 *
 * @param title - 생성할 단어장의 이름입니다.
 * @returns 생성된 단어장의 ID와 제목을 포함한 객체를 반환합니다.
 */
export async function createVocabularyList(
  title: string,
): Promise<Pick<VocabularyList, "id" | "title">> {
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

/**
 * 특정 표현이 저장되어 있는 단어장 ID 목록을 가져옵니다.
 * (로그인한 프로 사용자 전용)
 *
 * @param expressionId - 확인할 표현의 ID입니다.
 * @returns 해당 표현이 포함된 단어장 ID들의 배열을 반환합니다.
 */
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

/**
 * 특정 단어장에 표현을 추가합니다.
 *
 * @param listId - 대상 단어장 ID입니다.
 * @param expressionId - 추가할 표현의 ID입니다.
 */
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

/**
 * 특정 단어장에서 표현을 제거합니다.
 *
 * @param listId - 대상 단어장 ID입니다.
 * @param expressionId - 제거할 표현의 ID입니다.
 */
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

/**
 * 특정 단어장을 기본 단어장으로 설정합니다.
 *
 * @param listId - 기본값으로 설정할 단어장 ID입니다.
 */
export async function setDefaultVocabularyList(listId: string): Promise<void> {
  const { isPro } = await getAuthSession();

  if (!isPro) throw createAppError(VOCABULARY_ERROR.UNAUTHORIZED);

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("set_default_vocabulary_list", {
    p_list_id: listId,
  });

  if (error) {
    console.error("Failed to set default list:", error);
    throw createAppError(VOCABULARY_ERROR.UPDATE_FAILED);
  }
}

/**
 * 특정 단어장의 상세 정보와 포함된 모든 표현 데이터를 가져옵니다.
 *
 * @param listId - 조회할 단어장 ID입니다.
 * @returns 단어장 정보와 Expression 배열을 포함한 VocabularyListDetails 객체를 반환합니다.
 */
export const getVocabularyListDetails = cache(
  async function getVocabularyListDetails(
    listId: string,
  ): Promise<VocabularyListDetails> {
    const { userId, isPro } = await getAuthSession();

    if (!userId || !isPro) {
      throw createAppError(VOCABULARY_ERROR.UNAUTHORIZED);
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc("get_vocabulary_list_details", {
      p_list_id: listId,
    });

    if (error) {
      console.error("Failed to fetch vocabulary list details:", error);
      throw createAppError(VOCABULARY_ERROR.FETCH_FAILED);
    }

    if (!data) {
      throw createAppError(VOCABULARY_ERROR.NOT_FOUND);
    }

    return data as VocabularyListDetails;
  },
);
