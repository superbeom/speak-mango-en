import { SKELETON_PAGE } from "@/constants/ui";
import {
  SkeletonNavbar,
  SkeletonVocabularyDetail,
} from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-layout pb-24">
      <SkeletonNavbar page={SKELETON_PAGE.DETAIL} />
      <SkeletonVocabularyDetail />
    </div>
  );
}
