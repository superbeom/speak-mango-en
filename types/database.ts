export interface ExpressionContent {
  situation: string;
  tip: string;
  quiz: { question: string; answer: string };
}

// Base translations without English (used for Dialogue where 'en' is separate)
export interface I18nTranslation {
  ko: string;
  ja: string;
  es: string;
  [key: string]: string | undefined;
}

// Full I18nString including English (used for Meaning, etc. where English definition might exist)
export interface I18nString extends I18nTranslation {
  en: string;
}

export interface I18nContent {
  en: ExpressionContent;
  ko: ExpressionContent;
  ja: ExpressionContent;
  es: ExpressionContent;
  [key: string]: ExpressionContent | undefined;
}

export interface DialogueItem {
  role: string;
  en: string;
  audio_url: string;
  translations: I18nTranslation;
}

export interface Expression {
  id: string;
  domain: string; // 대분류 (conversation, test, vocabulary)
  category: string; // 소분류 (business, travel, shopping)
  expression: string;
  meaning: I18nString;
  content: I18nContent;
  dialogue: DialogueItem[];
  tags?: string[] | null;
  published_at: string;
  created_at: string;
}
