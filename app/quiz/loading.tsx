import { SKELETON_PAGE } from "@/constants/ui";
import { SkeletonNavbar, SkeletonQuiz } from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-layout">
      {/* Navbar Skeleton */}
      <SkeletonNavbar
        page={SKELETON_PAGE.QUIZ}
        className="w-full justify-between quiz-header-padding"
      />

      {/* Quiz Content Skeleton */}
      <SkeletonQuiz />
    </div>
  );
}
