import { Suspense } from "react";
import { getVocabularyLists } from "@/services/actions/vocabulary";
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
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-6" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
            <div className="h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
          </div>
        </div>
      }
    >
      <VocabularyListContent isPro={isPro} />
    </Suspense>
  );
}
