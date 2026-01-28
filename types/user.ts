/**
 * User related types
 */

export type UserTier = "free" | "pro";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  tier: UserTier;
  subscription_end_date?: string | null;
  trial_usage_count: number;
  created_at: string;
  updated_at: string;
}

export type ActionType = "save" | "learn";

export interface UserAction {
  id: string;
  user_id: string;
  expression_id: string;
  action_type: ActionType;
  created_at: string;
}
