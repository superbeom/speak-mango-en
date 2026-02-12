import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { VocabularyListWithCount } from "@/types/vocabulary";
import { LocalVocabularyList } from "@/store/useLocalActionStore";
import { BASE_URL, STORAGE_BUCKET } from "@/constants";

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
  params: Record<string, string>,
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
        filters[key] !== "",
    )
    .map((key) => `${String(key)}=${String(filters[key])}`);

  if (parts.length === 0) return "all"; // 기본값 (전체보기)

  return parts.join("&");
}

/**
 * Supabase Storage의 Public URL을 생성합니다.
 * @param path - 스토리지 내 상대 경로 (예: "expressions/UUID/1.wav")
 */
export function getStorageUrl(path?: string) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return path;

  // clean path (remove leading slash)
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
}

/**
 * 표현 상세 페이지의 공유 URL을 생성합니다.
 * @param expressionId - 표현 ID
 * @param utmParams - 선택적 UTM 추적 파라미터
 */
export function getShareUrl(
  expressionId: string,
  utmParams?: Record<string, string>,
): string {
  const url = `${BASE_URL}/expressions/${expressionId}`;

  if (!utmParams || Object.keys(utmParams).length === 0) {
    return url;
  }

  const params = new URLSearchParams(utmParams);
  return `${url}?${params.toString()}`;
}

/**
 * 쿼리 파라미터로 전달된 페이지 번호를 안전하게 파싱합니다.
 * 숫자가 아니거나 0 이하인 경우 기본값(1)을 반환합니다.
 * @param page - 파싱할 페이지 번호 (문자열 또는 숫자)
 * @param defaultPage - 유효하지 않을 경우 반환할 기본 페이지 번호 (기본값: 1)
 */
export function getSafePageNumber(
  page: string | number | undefined | null,
  defaultPage = 1,
): number {
  const pageNumber = Number(page);
  return !isNaN(pageNumber) && pageNumber > 0 ? pageNumber : defaultPage;
}

/**
 * 로컬 단어장 목록을 정렬하고 UI 표시용 타입(VocabularyListWithCount)으로 변환합니다.
 * 정렬 기준: 1. Default 우선, 2. 생성일 순
 */
export function formatVocabularyLists(
  vocabularyLists: Record<string, LocalVocabularyList>,
): VocabularyListWithCount[] {
  return Object.values(vocabularyLists)
    .sort((a, b) => {
      // 1. Default 우선
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      // 2. 생성일 순
      return a.createdAt.localeCompare(b.createdAt);
    })
    .map((list) => ({
      id: list.id,
      title: list.title,
      item_count: list.itemIds.size,
      is_default: list.isDefault || false,
    }));
}

/**
 * 현재 시간을 기준으로 1시간 단위의 고정 시드 문자열을 생성합니다.
 * (예: 2024-03-11-15)
 * 이는 서버 컴포넌트 리프레시 시 리스트가 불필요하게 변경되는 것을 방지합니다.
 */
export function getHourlySeed() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
}
