import { Dictionary } from "@/i18n";

/**
 * 딕셔너리 설정을 기반으로 동적 SEO 키워드를 생성합니다.
 * `i18n/locales/*.ts` 파일의 `meta.seo` 설정을 사용합니다.
 */
export function generateSeoKeywords(
  dict: Dictionary,
  expression: string,
  meaning: string,
  category?: string
): string[] {
  const keywords = dict.meta.keywords.split(", ");

  // Add category-specific keyword if category is provided
  if (category) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories = (dict as any).seo?.categories;

    if (categories) {
      const categoryKey = category.toLowerCase();
      // If we have a localized keyword for this category, add it
      if (categories[categoryKey]) {
        keywords.push(categories[categoryKey]);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seo = (dict as any).seo;

  if (seo) {
    // 1. Expression + Suffix (e.g., "Feel Blue 뜻", "Feel Blue Meaning")
    if (seo.expressionSuffixes && Array.isArray(seo.expressionSuffixes)) {
      seo.expressionSuffixes.forEach((suffix: string) => {
        keywords.push(`${expression} ${suffix}`);
      });
    }

    // 2. Meaning + Suffix (e.g., "우울하다 영어로", "Sad in English")
    // 의미가 '·'로 구분된 경우 각각 분리하여 키워드 생성 (예: "좋은 가격에 물건을 사다 · 저렴하게 득템하다")
    if (seo.meaningSuffixes && Array.isArray(seo.meaningSuffixes)) {
      // 1. 의미를 분리하여 배열 생성 (의미 단위)
      // 괄호로 된 부가 설명 제거 (예: "(e.g., laughter...)" -> "")
      const meanings = meaning
        .replace(/\([^)]*\)/g, "") // 괄호 및 내부 내용 제거
        .split("·")
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      // 2. 각 의미와 접미사를 조합
      meanings.forEach((m) => {
        seo.meaningSuffixes.forEach((suffix: string) => {
          if (suffix.includes("{}")) {
            // Placeholder가 있는 경우: 템플릿으로 처리 (예: "how to say {}")
            keywords.push(suffix.replace("{}", m));
          } else {
            // Placeholder가 없는 경우: 기존처럼 접미사로 처리
            keywords.push(`${m} ${suffix}`);
          }
        });
      });
    }
  }

  // 중복 제거 후 반환
  return Array.from(new Set(keywords));
}
