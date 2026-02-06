import { useI18n } from "@/context/I18nContext";
import { formatMessage } from "@/lib/utils";

interface VocabularyPlanStatusProps {
  currentCount: number;
  maxCount?: number;
  isLoading?: boolean;
}

export default function VocabularyPlanStatus({
  currentCount,
  maxCount = 5,
  isLoading = false,
}: VocabularyPlanStatusProps) {
  const { dict } = useI18n();

  return (
    <div className="mt-2 text-center">
      <p className="text-xs font-medium text-zinc-500">
        {formatMessage(dict.vocabulary.planStatus, {
          count: isLoading ? "-" : currentCount.toString(),
          total: maxCount.toString(),
        })}
      </p>
      <p className="mt-1 text-[10px] text-zinc-400">
        {dict.vocabulary.planHint}
      </p>
    </div>
  );
}
