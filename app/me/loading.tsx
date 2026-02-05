import { SKELETON_PAGE } from "@/constants/ui";
import {
  Skeleton,
  SkeletonNavbar,
  SkeletonProfileHeader,
  SkeletonStudyModesGrid,
  SkeletonVocabularyListSection,
} from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-layout">
      <SkeletonNavbar page={SKELETON_PAGE.MY_PAGE} />
      <div className="max-w-2xl mx-auto pb-24 px-4 sm:px-6 py-8 space-y-10 animate-pulse">
        {/* Profile Section */}
        <section>
          <SkeletonProfileHeader />
        </section>

        {/* Study Modes Section */}
        <section>
          <Skeleton className="h-6 w-32 mb-4 opacity-50" />
          <SkeletonStudyModesGrid />
        </section>

        {/* Vocabulary Lists Section */}
        <section>
          <SkeletonVocabularyListSection />
        </section>
      </div>
    </div>
  );
}
