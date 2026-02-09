"use server";

import { cache } from "react";
import { createAppError, VOCABULARY_ERROR } from "@/types/error";
import { Expression } from "@/types/expression";
import {
  VocabularyListWithCount,
  VocabularyListDetails,
} from "@/types/vocabulary";
import { EXPRESSION_PAGE_SIZE } from "@/constants/expressions";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/utils";

/**
 * 현재 사용자의 모든 단어장 목록을 가져옵니다.
 * 각 단어장은 포함된 아이템 개수(item_count) 정보를 포함합니다.
 *
 * @returns 단어장 목록 배열을 담은 Promise를 반환합니다.
 */
export const getVocabularyLists = cache(
  async function getVocabularyLists(): Promise<VocabularyListWithCount[]> {
    /**
     * Note: This function doesn't use withPro because cache() doesn't play well with HOFs directly within the export.
     * Also, it handles the !isPro case by returning empty array instead of throwing.
     */
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
 * 특정 표현이 저장되어 있는 단어장 ID 목록을 가져옵니다.
 *
 * @param expressionId - 확인할 표현의 ID입니다.
 * @returns 해당 표현이 포함된 단어장 ID들의 배열을 반환합니다.
 */
export const getSavedListIds = cache(async function getSavedListIds(
  expressionId: string,
): Promise<string[]> {
  /**
   * Note: This function manually handles auth to return essential data (or empty)
   * instead of throwing, ensuring UI resilience for non-Pro users.
   */
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
});

/**
 * 특정 단어장의 상세 정보와 포함된 모든 표현 데이터를 가져옵니다.
 *
 * @param listId - 조회할 단어장 ID입니다.
 * @returns 단어장 정보와 Expression 배열을 포함한 VocabularyListDetails 객체를 반환합니다.
 */
export const getVocabularyListDetails = cache(
  async function getVocabularyListDetails(
    listId: string,
    page: number = 1,
    limit: number = EXPRESSION_PAGE_SIZE,
  ): Promise<VocabularyListDetails> {
    /**
     * Note: This function doesn't use withPro because cache() doesn't play well with HOFs directly within the export.
     */
    const { userId, isPro } = await getAuthSession();

    if (!userId || !isPro) {
      throw createAppError(VOCABULARY_ERROR.UNAUTHORIZED);
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc("get_vocabulary_list_details", {
      p_list_id: listId,
      p_page: page,
      p_page_size: limit,
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

/**
 * 학습 완료한(Is Learned) 표현 목록을 페이지네이션하여 가져옵니다.
 *
 * @param page - 페이지 번호
 * @param limit - 페이지당 항목 수 (기본값: 24)
 * @returns 학습 완료된 표현 목록과 전체 개수
 */
export const getLearnedListDetails = cache(async function getLearnedListDetails(
  page: number = 1,
  limit: number = EXPRESSION_PAGE_SIZE,
): Promise<VocabularyListDetails> {
  /**
   * Note: This function doesn't use withPro because cache() doesn't play well with HOFs directly within the export.
   */
  const { userId, isPro } = await getAuthSession();

  if (!userId || !isPro) {
    throw createAppError(VOCABULARY_ERROR.UNAUTHORIZED);
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase.rpc("get_learned_list_details", {
    p_page: page,
    p_page_size: limit,
  });

  if (error) {
    console.error("Failed to fetch learned list details:", error);
    throw createAppError(VOCABULARY_ERROR.FETCH_FAILED);
  }

  // RPC returns { total_count, items } matching VocabularyListDetails structure partially
  // We need to shape it as VocabularyListDetails
  // The RPC get_learned_list_details returns json: { total_count, items }
  // VocabularyListDetails expects: { id, title, is_default, created_at, ... }
  // We should map it or return compatible type.
  // The RPC output needs to be adapted.

  const result = data as { total_count: number; items: Expression[] };

  return {
    id: "learned", // Virtual ID
    title: "Learned Expressions",
    is_default: false,
    created_at: new Date().toISOString(),
    total_count: result.total_count,
    items: result.items,
  };
});
