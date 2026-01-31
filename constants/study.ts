import { Layers, Headphones, Zap, BrainCircuit } from "lucide-react";
import { StudyMode } from "@/types/study";

export const STUDY_MODES: StudyMode[] = [
  {
    id: "flashcards",
    icon: Layers,
    href: "/me/flashcards",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    borderColor: "border-blue-100 dark:border-blue-800",
    shadowColor: "dark:hover:shadow-blue-500/10",
    disabled: true,
  },
  {
    id: "listening",
    icon: Headphones,
    href: "/me/listening",
    color:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    borderColor: "border-green-100 dark:border-green-800",
    shadowColor: "dark:hover:shadow-green-500/10",
    disabled: true,
  },
  {
    id: "quiz",
    icon: BrainCircuit,
    href: "/me/quiz",
    color:
      "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    borderColor: "border-orange-100 dark:border-orange-800",
    shadowColor: "dark:hover:shadow-orange-500/10",
    disabled: true,
  },
  {
    id: "reinforce",
    icon: Zap,
    href: "/me/reinforce",
    color:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    borderColor: "border-purple-100 dark:border-purple-800",
    shadowColor: "dark:hover:shadow-purple-500/10",
    disabled: true,
  },
];
