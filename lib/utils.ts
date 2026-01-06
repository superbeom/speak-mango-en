import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스를 병합하고 충돌을 해결하는 유틸리티입니다.
 * clsx로 조건부 클래스를 처리하고, twMerge로 스타일 충돌을 해결합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 문자열 템플릿 내의 변수를 치환합니다.
 * 예: formatMessage("Hello {name}", { name: "World" }) -> "Hello World"
 */
export function formatMessage(
  template: string,
  params: Record<string, string>
) {
  return template.replace(/{(\w+)}/g, (_, key) => params[key] || `{${key}}`);
}

/**
 * 필터 객체를 고유한 문자열 키로 변환합니다.
 * 키 순서를 정렬하여 { a: 1, b: 2 }와 { b: 2, a: 1 }이 동일한 키를 생성하도록 합니다.
 */
export function serializeFilters<T extends object>(filters: T): string {
  const sortedKeys = Object.keys(filters).sort() as Array<keyof T>;

  const parts = sortedKeys
    .filter(
      (key) =>
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
    )
    .map((key) => `${String(key)}=${String(filters[key])}`);

  if (parts.length === 0) return "all"; // 기본값 (전체보기)

  return parts.join("&");
}
