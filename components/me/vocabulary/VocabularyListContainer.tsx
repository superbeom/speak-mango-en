import { Suspense } from "react";
import { getVocabularyLists } from "@/services/actions/vocabulary";
import { SkeletonVocabularyListSection } from "@/components/ui/Skeletons";
import VocabularyListManager from "./VocabularyListManager";

interface VocabularyListContainerProps {
  isPro: boolean;
}

async function VocabularyListContent({ isPro }: { isPro: boolean }) {
  // Only fetch from DB if the user is a Pro member
  const lists = isPro ? await getVocabularyLists() : [];

  return <VocabularyListManager lists={lists} isPro={isPro} />;
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
