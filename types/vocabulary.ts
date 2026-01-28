/**
 * Vocabulary List related types
 */

export interface VocabularyList {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface VocabularyItem {
  list_id: string;
  expression_id: string; // Currently required as Custom Cards are future work
  custom_card_id?: string | null;
  created_at: string;
}
