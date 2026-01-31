import { LucideIcon } from "lucide-react";

export type StudyModeId = "flashcards" | "listening" | "quiz" | "reinforce";

export interface StudyMode {
  id: StudyModeId;
  icon: LucideIcon;
  href: string;
  color: string;
  borderColor: string;
  shadowColor: string;
  disabled?: boolean;
}
