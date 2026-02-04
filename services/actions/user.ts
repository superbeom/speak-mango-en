"use server";

import { createAppError, ACTION_ERROR } from "@/types/error";
import { ActionType } from "@/services/repositories/UserActionRepository";
import { createServerSupabase } from "@/lib/supabase/server";
import { withPro } from "@/lib/server/actionUtils";
import { getAuthSession } from "@/lib/auth/utils";

/**
 * 특정 액션 타입(예: 'learned')에 해당하는 사용자의 표현 ID 목록을 가져옵니다.
 *
 * @param type - 조회할 액션 타입입니다.
 * @returns 해당 액션이 적용된 표현 ID 배열을 반환합니다.
 */
export async function getUserActions(type: ActionType): Promise<string[]> {
  /**
   * Note: This function manually handles auth to return essential data (or empty)
   * instead of throwing, ensuring UI resilience for non-Pro users.
   */
  const { userId, isPro } = await getAuthSession();

  if (!userId || !isPro) {
    // Only Pro users can use remote actions
    return [];
  }

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("user_actions")
    .select("expression_id")
    .eq("user_id", userId)
    .eq("action_type", type);

  return data?.map((row) => row.expression_id) || [];
}

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
 * 로컬 스토리지의 액션 데이터를 서버와 동기화합니다.
 * 무료 사용자로 작업한 내용을 프로 사용자로 전환 후, 서버에 반영할 때 사용됩니다.
 *
 * @param actions - 동기화할 액션 데이터 배열입니다.
 */
export const syncUserActions = withPro(
  async (
    userId,
    _isPro,
    actions: { expressionId: string; type: ActionType }[],
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
