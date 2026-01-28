"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/utils";
import { ActionType } from "@/services/repositories/UserActionRepository";

export async function getUserActions(type: ActionType): Promise<string[]> {
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

export async function toggleUserAction(
  expressionId: string,
  type: ActionType,
): Promise<void> {
  const { isPro } = await getAuthSession();

  if (!isPro) {
    throw new Error("Unauthorized or invalid tier");
  }

  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("toggle_user_action", {
    p_expression_id: expressionId,
    p_action_type: type,
  });

  if (error) {
    console.error("Failed to toggle action:", error);
    throw new Error("Failed to toggle action");
  }
}

export async function syncUserActions(
  actions: { expressionId: string; type: ActionType }[],
): Promise<void> {
  const { userId, isPro } = await getAuthSession();

  if (!userId || !isPro) {
    return;
  }

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
    throw new Error("Sync failed");
  }
}
