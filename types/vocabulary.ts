/**
 * Vocabulary List related types
 */

import { Expression } from "@/types/expression";

export interface VocabularyList {
  id: string;
  user_id: string;
  title: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface VocabularyListWithCount extends Pick<
  VocabularyList,
  "id" | "title" | "is_default"
> {
  item_count: number;
}

export interface VocabularyListDetails extends Pick<
  VocabularyList,
  "id" | "title" | "is_default" | "created_at"
> {
  total_count: number;
  items: Expression[];
}

export interface VocabularyItem {
  list_id: string;
  expression_id: string; // Currently required as Custom Cards are future work
  custom_card_id?: string | null;
  created_at: string;
}
