import { Suspense } from "react";
import {
  getVocabularyLists,
  getLearnedCount,
} from "@/services/queries/vocabulary";
import { SkeletonVocabularyListSection } from "@/components/ui/Skeletons";
import VocabularyListManager from "./VocabularyListManager";

interface VocabularyListContainerProps {
  isPro: boolean;
}

async function VocabularyListContent({ isPro }: { isPro: boolean }) {
  // Only fetch from DB if the user is a Pro member
  const [lists, learnedCount] = isPro
    ? await Promise.all([getVocabularyLists(), getLearnedCount()])
    : [[], 0];

  return (
    <VocabularyListManager
      lists={lists}
      isPro={isPro}
      remoteLearnedCount={learnedCount}
    />
  );
}

export default function VocabularyListContainer({
  isPro,
}: VocabularyListContainerProps) {
  return (
    <Suspense fallback={<SkeletonVocabularyListSection />}>
      <VocabularyListContent isPro={isPro} />
    </Suspense>
  );
}
