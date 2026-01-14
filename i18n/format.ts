import { LOCALE_DETAILS, SupportedLanguage, type Locale } from "./index";

/**
 * 날짜를 로케일에 맞는 문자열로 포맷팅합니다.
 * 
 * @param date - 날짜 문자열 또는 Date 객체
 * @param locale - 언어 코드 ('ko', 'en' 등)
 * @param options - Intl.DateTimeFormatOptions (선택 사항)
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(
  date: string | Date,
  locale: Locale | string = SupportedLanguage.EN,
  options?: Intl.DateTimeFormatOptions
) {
  const d = typeof date === "string" ? new Date(date) : date;
  // LOCALE_DETAILS에서 해당 로케일의 태그를 찾고, 없으면 기본값 사용
  const targetLocale = (locale as Locale) in LOCALE_DETAILS ? (locale as Locale) : SupportedLanguage.EN;
  const langTag = LOCALE_DETAILS[targetLocale].tag;

  // 기본 옵션 설정 (상세 페이지용 스타일)
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return d.toLocaleDateString(langTag, defaultOptions);
}
