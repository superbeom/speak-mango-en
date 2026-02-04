import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

/**
 * 마이페이지(/me)의 데이터를 갱신합니다.
 * 단어장 목록이 변경되거나 기본 단어장이 변경될 때 사용합니다.
 */
export function revalidateMyPage() {
  revalidatePath(ROUTES.MY_PAGE);
}

/**
 * 특정 단어장 상세 페이지(/me/[id])의 데이터를 갱신합니다.
 * 단어장에 표현을 추가/삭제하거나 제목을 수정할 때 사용합니다.
 *
 * @param listId - 갱신할 단어장의 ID
 */
export function revalidateVocabularyInfo(listId: string) {
  revalidatePath(ROUTES.VOCABULARY_LIST(listId));
}
