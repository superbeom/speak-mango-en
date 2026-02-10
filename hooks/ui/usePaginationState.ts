import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationOptions {
  /**
   * 이동할 기본 경로 (Base URL)
   * 설정하지 않으면 현재 경로를 유지하며 Query Parameter만 변경됩니다.
   */
  baseUrl?: string;

  /**
   * 페이지 이동 후 스크롤을 상단으로 이동할지 여부
   * @default true
   */
  scroll?: boolean;
}

/**
 * URL의 Query Parameter(page)와 동기화되는 페이지네이션 상태를 관리하는 훅
 *
 * @returns
 * - page: 현재 페이지 번호 (URL의 page 파라미터 값, 기본값 1)
 * - setPage: 페이지 상태 수동 설정 함수
 * - handlePageChange: 페이지 변경을 처리하고 URL을 업데이트하는 함수
 *
 * @example
 * ```tsx
 * const { page, handlePageChange } = usePaginationState();
 *
 * // 기본 사용 (현재 URL 유지, 스크롤 이동)
 * handlePageChange(2);
 *
 * // 옵션 사용 (특정 URL로 이동, 스크롤 유지)
 * handlePageChange(2, { baseUrl: "/list", scroll: false });
 * ```
 */
export function usePaginationState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageFromUrl = Number(searchParams.get("page")) || 1;
  const [page, setPage] = useState(pageFromUrl);

  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  /**
   * 페이지 번호를 변경하고 URL을 업데이트합니다.
   *
   * @param newPage - 이동할 새 페이지 번호
   * @param options - 페이지 이동 옵션 (baseUrl, scroll)
   * @param options.scroll - 기본값 true. false로 설정 시 스크롤 위치 유지.
   */
  const handlePageChange = (
    newPage: number,
    { baseUrl, scroll = true }: PaginationOptions = {},
  ) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    const url = baseUrl
      ? `${baseUrl}?${params.toString()}`
      : `?${params.toString()}`;

    router.push(url, { scroll });
  };

  return { page, setPage, handlePageChange };
}
