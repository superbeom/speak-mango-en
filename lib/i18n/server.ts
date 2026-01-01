import { headers } from "next/headers";
import { getDictionary } from "./index";

/**
 * 서버 컴포넌트에서 현재 요청의 언어를 감지합니다.
 * @returns 'ko' | 'en' (기본값: 'ko')
 */
export async function getLocale() {
  const headerList = await headers();
  return headerList.get("x-locale") || "ko";
}

/**
 * 서버 컴포넌트에서 언어와 딕셔너리를 한 번에 가져옵니다.
 * @returns { locale, dict }
 */
export async function getI18n() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { locale, dict };
}
