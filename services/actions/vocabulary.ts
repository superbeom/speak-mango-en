"use server";

import { createAppError, VOCABULARY_ERROR } from "@/types/error";
import { createServerSupabase } from "@/lib/supabase/server";
import { withPro } from "@/lib/server/actionUtils";
import {
  revalidateMyPage,
  revalidateVocabularyInfo,
} from "@/lib/server/revalidate";
import { VocabularyList } from "@/types/vocabulary";

/**
 * 새로운 단어장을 생성합니다.
 *
 * @param title - 생성할 단어장의 이름입니다.
 * @returns 생성된 단어장의 ID와 제목을 포함한 객체를 반환합니다.
 */
export const createVocabularyList = withPro(
  async (
    userId,
    _isPro,
    title: string,
  ): Promise<Pick<VocabularyList, "id" | "title">> => {
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

    revalidateMyPage();
    return data;
  },
);

/**
 * 특정 단어장에 표현을 추가합니다.
 *
 * @param listId - 대상 단어장 ID입니다.
 * @param expressionId - 추가할 표현의 ID입니다.
 */
export const addToVocabularyList = withPro(
  async (
    _userId,
    _isPro,
    listId: string,
    expressionId: string,
  ): Promise<void> => {
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

    revalidateMyPage(); // To update counts
    revalidateVocabularyInfo(listId);
  },
);

/**
 * 특정 단어장에서 표현을 제거합니다.
 *
 * @param listId - 대상 단어장 ID입니다.
 * @param expressionId - 제거할 표현의 ID입니다.
 */
export const removeFromVocabularyList = withPro(
  async (
    _userId,
    _isPro,
    listId: string,
    expressionId: string,
  ): Promise<void> => {
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

    revalidateMyPage();
    revalidateVocabularyInfo(listId);
  },
);

/**
 * 특정 단어장을 기본 단어장으로 설정합니다.
 *
 * @param listId - 기본값으로 설정할 단어장 ID입니다.
 */
export const setDefaultVocabularyList = withPro(
  async (_userId, _isPro, listId: string): Promise<void> => {
    const supabase = await createServerSupabase();
    const { error } = await supabase.rpc("set_default_vocabulary_list", {
      p_list_id: listId,
    });

    if (error) {
      console.error("Failed to set default list:", error);
      throw createAppError(VOCABULARY_ERROR.UPDATE_FAILED);
    }

    revalidateMyPage();
    revalidateVocabularyInfo(listId);
  },
);

/**
 * 단어장의 이름을 수정합니다.
 *
 * @param listId - 이름을 수정할 단어장 ID입니다.
 * @param title - 새로운 단어장 이름입니다.
 */
export const updateVocabularyListTitle = withPro(
  async (_userId, _isPro, listId: string, title: string): Promise<void> => {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("vocabulary_lists")
      .update({ title: title.trim() })
      .eq("id", listId);

    if (error) {
      console.error("Failed to update vocabulary list title:", error);
      throw createAppError(VOCABULARY_ERROR.UPDATE_FAILED);
    }

    revalidateMyPage();
    revalidateVocabularyInfo(listId);
  },
);

/**
 * 특정 단어장을 삭제합니다.
 *
 * @param listId - 삭제할 단어장 ID입니다.
 */
export const deleteVocabularyList = withPro(
  async (_userId, _isPro, listId: string): Promise<void> => {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("vocabulary_lists")
      .delete()
      .eq("id", listId);

    if (error) {
      console.error("Failed to delete vocabulary list:", error);
      throw createAppError(VOCABULARY_ERROR.DELETE_FAILED);
    }

    revalidateMyPage();
    // No need to revalidate /me/[listId] as it will 404
  },
);

/**
 * 여러 표현을 특정 단어장으로 복사합니다.
 *
 * @param listId - 대상 단어장 ID
 * @param expressionIds - 복사할 표현 ID 목록
 */
export const copyExpressionsToVocabularyList = withPro(
  async (
    _userId,
    _isPro,
    listId: string,
    expressionIds: string[],
  ): Promise<void> => {
    const supabase = await createServerSupabase();

    const rows = expressionIds.map((id) => ({
      list_id: listId,
      expression_id: id,
    }));

    const { error } = await supabase.from("vocabulary_items").upsert(rows, {
      onConflict: "list_id, expression_id",
      ignoreDuplicates: true,
    });

    if (error) {
      console.error("Failed to copy to list:", error);
      throw createAppError(VOCABULARY_ERROR.COPY_FAILED);
    }

    revalidateMyPage();
    revalidateVocabularyInfo(listId);
  },
);

/**
 * 여러 표현을 다른 단어장으로 이동합니다.
 * (대상 단어장으로 복사 후, 원본 단어장에서 제거)
 *
 * @param sourceListId - 원본 단어장 ID
 * @param targetListId - 대상 단어장 ID
 * @param expressionIds - 이동할 표현 ID 목록
 */
export const moveExpressionsToVocabularyList = withPro(
  async (
    _userId,
    _isPro,
    sourceListId: string,
    targetListId: string,
    expressionIds: string[],
  ): Promise<void> => {
    const supabase = await createServerSupabase();

    const { error } = await supabase.rpc("move_vocabulary_items", {
      p_source_list_id: sourceListId,
      p_target_list_id: targetListId,
      p_expression_ids: expressionIds,
    });

    if (error) {
      console.error("Failed to move expressions:", error);
      throw createAppError(VOCABULARY_ERROR.MOVE_FAILED);
    }

    revalidateMyPage();
    revalidateVocabularyInfo(sourceListId);
    revalidateVocabularyInfo(targetListId);
  },
);

/**
 * 특정 단어장에서 여러 표현을 제거합니다.
 *
 * @param listId - 대상 단어장 ID
 * @param expressionIds - 제거할 표현 ID 목록
 */
export const removeExpressionsFromVocabularyList = withPro(
  async (
    _userId,
    _isPro,
    listId: string,
    expressionIds: string[],
  ): Promise<void> => {
    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from("vocabulary_items")
      .delete()
      .eq("list_id", listId)
      .in("expression_id", expressionIds);

    if (error) {
      console.error("Failed to remove multiple from list:", error);
      throw createAppError(VOCABULARY_ERROR.REMOVE_FAILED);
    }

    revalidateMyPage();
    revalidateVocabularyInfo(listId);
  },
);
