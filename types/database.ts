export interface ExpressionContent {
  situation: string;
  dialogue: { en: string; translation: string }[];
  tip: string;
  quiz: { question: string; answer: string };
}

export interface I18nString {
  ko: string;
  ja?: string;
  es?: string;
  [key: string]: string | undefined;
}

export interface I18nContent {
  ko: ExpressionContent;
  ja?: ExpressionContent;
  es?: ExpressionContent;
  [key: string]: ExpressionContent | undefined;
}

export interface Expression {
  id: string;
  domain: string; // 대분류 (conversation, test, vocabulary)
  category: string; // 소분류 (business, travel, shopping)
  expression: string;
  meaning: I18nString;
  content: I18nContent;
  tags?: string[] | null;
  published_at: string;
  created_at: string;
}
