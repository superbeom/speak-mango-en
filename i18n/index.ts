import { en } from "./locales/en";
import { ko } from "./locales/ko";
import { ja } from "./locales/ja";
import { es } from "./locales/es";

// 딕셔너리 객체
// 언어 상수 정의 (Single Source of Truth)
export const SupportedLanguage = {
  EN: "en",
  KO: "ko",
  JA: "ja",
  ES: "es",
} as const;

export type SupportedLanguage = (typeof SupportedLanguage)[keyof typeof SupportedLanguage];

// 딕셔너리 객체
const dictionaries = {
  [SupportedLanguage.EN]: en,
  [SupportedLanguage.KO]: ko,
  [SupportedLanguage.JA]: ja,
  [SupportedLanguage.ES]: es,
};

// 지원하는 언어 타입
export type Locale = SupportedLanguage;

// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES: Locale[] = Object.values(SupportedLanguage);

// 기본 언어 설정
export const defaultLocale: Locale = SupportedLanguage.EN;

// 언어별 상세 설정 (표시명, 로케일 태그 등)
export const LOCALE_DETAILS: Record<
  Locale,
  { label: string; tag: string; ogLocale: string }
> = {
  [SupportedLanguage.EN]: { label: "English", tag: "en-US", ogLocale: "en_US" },
  [SupportedLanguage.KO]: { label: "한국어", tag: "ko-KR", ogLocale: "ko_KR" },
  [SupportedLanguage.JA]: { label: "日本語", tag: "ja-JP", ogLocale: "ja_JP" },
  [SupportedLanguage.ES]: { label: "Español", tag: "es-ES", ogLocale: "es_ES" },
};

/**
 * 주어진 문자열이 지원하는 로케일인지 확인하는 Type Guard 함수입니다.
 * @param lang - 확인할 문자열 (예: 'ko', 'en', 'fr')
 * @returns 로케일 타입 여부
 */
export function isSupportedLocale(lang: string | null | undefined): lang is Locale {
  return (
    typeof lang === "string" &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
  );
}

/**
 * 데이터 맵(meaning, content 등)에서 사용 가능한 안전한 로케일 키를 반환합니다.
 *
 * @param data - 다국어 데이터 객체 (예: expression.meaning)
 * @param locale - 선호하는 로케일 (예: 'ko')
 * @param fallback - 데이터가 없을 경우 사용할 기본 로케일 (기본값: 'en')
 * @returns 데이터가 존재하는 로케일 키 또는 fallback.
 */
export function getContentLocale(
  data: Record<string, unknown> | undefined | null,
  locale: string,
  fallback = "en"
): string {
  if (!data) return fallback;
  if (locale === fallback) return fallback;
  return locale in data ? locale : fallback;
}

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
