"use server";

import { createAppError, ACTION_ERROR } from "@/types/error";
import { VocabularyListWithCount } from "@/types/vocabulary";
import {
  ActionType,
  LocalActionType,
} from "@/services/repositories/UserActionRepository";
import { createServerSupabase } from "@/lib/supabase/server";
import { withPro } from "@/lib/server/actionUtils";

/**
 * 특정 표현에 대한 사용자의 액션(예: 학습 완료 상태)을 토글합니다.
 *
 * @param expressionId - 대상 표현의 ID입니다.
 * @param type - 토글할 액션 타입입니다.
 */
export const toggleUserAction = withPro(
  async (
    _userId,
    _isPro,
    expressionId: string,
    type: ActionType,
  ): Promise<void> => {
    const supabase = await createServerSupabase();

    const { error } = await supabase.rpc("toggle_user_action", {
      p_expression_id: expressionId,
      p_action_type: type,
    });

    if (error) {
      console.error("Failed to toggle action:", error);
      throw createAppError(ACTION_ERROR.TOGGLE_FAILED);
    }
  },
);

/**
 * 표현의 저장 상태를 토글합니다 (단일 RPC).
 * - 저장: 기본 단어장에 추가
 * - 해제: 모든 단어장에서 제거
 * - 최신 단어장 목록(item_count 포함)을 반환합니다.
 *
 * @param expressionId - 대상 표현의 ID입니다.
 * @returns 최신 단어장 목록 배열을 반환합니다.
 */
export const toggleSaveExpression = withPro(
  async (
    _userId,
    _isPro,
    expressionId: string,
  ): Promise<VocabularyListWithCount[]> => {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc("toggle_save_expression", {
      p_expression_id: expressionId,
    });

    if (error) {
      console.error("Failed to toggle save expression:", error);
      throw createAppError(ACTION_ERROR.TOGGLE_FAILED);
    }

    return (data as VocabularyListWithCount[]) || [];
  },
);

/**
 * 로컬 스토리지의 액션 데이터를 서버와 동기화합니다.
 * 무료 사용자로 작업한 내용을 프로 사용자로 전환 후, 서버에 반영할 때 사용됩니다.
 *
 * Phase 3: save는 vocabulary_items 기반으로 이관되었으므로, 이 함수는 learn 전용입니다.
 * save 데이터의 마이그레이션은 별도 함수(vocabulary list 기반)로 처리해야 합니다.
 *
 * @param actions - 동기화할 액션 데이터 배열입니다 (learn만 허용).
 */
export const syncUserActions = withPro(
  async (
    userId,
    _isPro,
    actions: { expressionId: string; type: LocalActionType }[],
  ): Promise<void> => {
    if (actions.length === 0) return;

    const supabase = await createServerSupabase();

    // Prepare data for bulk insert
    const rows = actions.map((action) => ({
      user_id: userId,
      expression_id: action.expressionId,
      action_type: action.type,
    }));

    // Perform upsert (ignore duplicates)
    // Assuming there is a UNIQUE constraint on (user_id, expression_id, action_type)
    const { error } = await supabase.from("user_actions").upsert(rows, {
      onConflict: "user_id, expression_id, action_type",
      ignoreDuplicates: true,
    });

    if (error) {
      console.error("Failed to sync user actions:", error);
      throw createAppError(ACTION_ERROR.SYNC_FAILED);
    }
  },
);
