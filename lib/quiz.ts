import { ExpressionContent } from "@/types/database";

export interface ParsedQuiz {
  question: string;
  options: { label: string; text: string }[];
}

/**
 * DB에 저장된 퀴즈 문자열을 파싱하여 구조화된 객체로 반환합니다.
 *
 * DB 포맷 예시:
 * "When would you use '...'?\n\nA. Option 1\nB. Option 2\nC. Option 3"
 *
 * @param contentQuiz - DB의 quiz 객체 { question: string, answer: string }
 * @returns 구조화된 퀴즈 데이터 { question: string, options: { label: string, text: string }[] }
 */
const OPTION_REGEX = /^([A-C])\.\s+(.*)/;

export function parseQuizQuestion(
  contentQuiz: ExpressionContent["quiz"],
): ParsedQuiz {
  const rawQuestion = contentQuiz.question;
  const lines = rawQuestion.split("\n").map((line) => line.trim());

  let questionText = "";
  const options: { label: string; text: string }[] = [];

  for (const line of lines) {
    // 옵션 라인 감지 (A., B., C. 로 시작하는 경우)
    const optionMatch = line.match(OPTION_REGEX);

    if (optionMatch) {
      options.push({
        label: optionMatch[1], // "A", "B", "C"
        text: optionMatch[2], // 옵션 내용
      });
    } else {
      // 옵션이 아닌 줄은 질문 텍스트로 간주 (빈 줄 제외)
      if (line.length > 0) {
        questionText += line + " ";
      }
    }
  }

  return {
    question: questionText.trim(),
    options,
  };
}
