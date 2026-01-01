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
