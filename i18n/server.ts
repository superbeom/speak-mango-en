import { headers } from "next/headers";
import { getDictionary, LOCALE_DETAILS, type Locale } from "./index";

/**
 * 서버 컴포넌트에서 현재 요청의 언어를 감지합니다.
 * @returns Locale (기본값: 'en')
 */
export async function getLocale(): Promise<Locale> {
  const headerList = await headers();
  const locale = headerList.get("x-locale") as Locale;
  return locale || "en";
}

/**
 * 서버 컴포넌트에서 언어와 딕셔너리, 전체 로케일을 한 번에 가져옵니다.
 * @returns { locale, fullLocale, dict }
 */
export async function getI18n() {
  const locale = await getLocale();
  const fullLocale = LOCALE_DETAILS[locale]?.ogLocale || LOCALE_DETAILS["en"].ogLocale;
  const dict = getDictionary(locale);
  return { locale, fullLocale, dict };
}
