import {
  MessageCircle,
  GraduationCap,
  Book,
  Tag,
  Briefcase,
  Plane,
  ShoppingCart,
  Heart,
  Zap,
  Coffee,
} from "lucide-react";

/**
 * 도메인(대분류)별 UI 설정 (아이콘, 색상)
 */
export const getDomainConfig = (domain: string) => {
  switch (domain) {
    case "conversation":
      return {
        icon: MessageCircle,
        label: "Conversation",
        styles:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      };
    case "test":
      return {
        icon: GraduationCap,
        label: "Test Prep",
        styles:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      };
    case "vocabulary":
      return {
        icon: Book,
        label: "Vocabulary",
        styles:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      };
    default:
      return {
        icon: Tag,
        label: domain,
        styles: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
      };
  }
};

/**
 * 카테고리(소분류)별 UI 설정 (색상, 아이콘 등)
 * - 텍스트 색상 등을 카테고리 분위기에 맞춰 다르게 설정
 */
export const getCategoryConfig = (category: string) => {
  switch (category) {
    case "business":
      return {
        icon: Briefcase,
        textStyles: "text-slate-600 dark:text-slate-400",
      };
    case "travel":
      return {
        icon: Plane,
        textStyles: "text-sky-600 dark:text-sky-400",
      };
    case "shopping":
      return {
        icon: ShoppingCart,
        textStyles: "text-pink-600 dark:text-pink-400",
      };
    case "emotion":
      return {
        icon: Heart,
        textStyles: "text-rose-600 dark:text-rose-400",
      };
    case "slang":
      return {
        icon: Zap,
        textStyles: "text-yellow-600 dark:text-yellow-400",
      };
    case "daily":
    default:
      return {
        icon: Coffee,
        textStyles: "text-zinc-400 dark:text-zinc-500",
      };
  }
};
