import { SKELETON_PAGE } from "@/constants/ui";
import {
  SkeletonNavbar,
  SkeletonVocabularyDetailHeader,
  SkeletonVocabularyToolbar,
  SkeletonExpressionList,
} from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-layout pb-24">
      <SkeletonNavbar page={SKELETON_PAGE.DETAIL} />

      <div className="py-8">
        <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonVocabularyDetailHeader />
        </div>

        <div className="mt-8 space-y-10 max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonVocabularyToolbar />
          <SkeletonExpressionList />
        </div>
      </div>
    </div>
  );
}
