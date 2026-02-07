"use server";

import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/utils";
import { ActionType } from "@/services/repositories/UserActionRepository";

/**
 * 특정 액션 타입(예: 'learned')에 해당하는 사용자의 표현 ID 목록을 가져옵니다.
 *
 * @param type - 조회할 액션 타입입니다.
 * @returns 해당 액션이 적용된 표현 ID 배열을 반환합니다.
 */
export const getUserActions = cache(async function getUserActions(
  type: ActionType,
): Promise<string[]> {
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
});
