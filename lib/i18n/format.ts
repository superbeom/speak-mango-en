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
  locale: string = "ko",
  options?: Intl.DateTimeFormatOptions
) {
  const d = typeof date === "string" ? new Date(date) : date;
  const langTag = locale === "ko" ? "ko-KR" : "en-US";

  // 기본 옵션 설정 (상세 페이지용 스타일)
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return d.toLocaleDateString(langTag, defaultOptions);
}
