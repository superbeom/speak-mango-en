export interface ExpressionContent {
  situation: string;
  dialogue: { en: string; kr: string }[];
  tip: string;
  quiz: { question: string; answer: string };
}

export interface Expression {
  id: string;
  expression: string;
  meaning: string;
  content: ExpressionContent;
  tags?: string[] | null;
  published_at: string;
  created_at: string;
}
