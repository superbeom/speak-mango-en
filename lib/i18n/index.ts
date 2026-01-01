import { ko } from "./locales/ko";
import { en } from "./locales/en";

// 딕셔너리 객체
const dictionaries = {
  ko,
  en,
};

// 지원하는 언어 타입
export type Locale = keyof typeof dictionaries;

// 기본 언어 설정
export const defaultLocale: Locale = "ko";

/**
 * 주어진 로케일에 해당하는 딕셔너리를 반환합니다.
 * 지원하지 않는 로케일이 들어오면 기본값(영어)으로 대체합니다.
 *
 * @param locale - 언어 코드 (예: 'ko', 'en', 'ja')
 * @returns 해당 언어의 문자열 객체
 */
export const getDictionary = (locale: string) => {
  if (locale in dictionaries) {
    return dictionaries[locale as Locale];
  }
  // 기본 Fallback은 영어로 설정 (글로벌 대응)
  return dictionaries["en"];
};
