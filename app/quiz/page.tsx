import { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { CANONICAL_URLS } from "@/lib/routes";
import { getRandomExpressions } from "@/lib/expressions";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import QuizGame from "@/components/quiz/QuizGame";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  const url = CANONICAL_URLS.QUIZ();

  return {
    title: dict.quiz.metaTitle,
    description: dict.quiz.metaDescription,
    openGraph: {
      title: dict.quiz.metaTitle,
      description: dict.quiz.metaDescription,
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Force dynamic rendering to ensure fresh random questions on every request
export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const [{ locale, dict }, expressions] = await Promise.all([
    getI18n(),
    getRandomExpressions(10),
  ]);

  return (
    <div className="min-h-screen bg-layout pb-20">
      <Header>
        <div className="flex justify-between items-center quiz-header-padding">
          <BackButton label={dict.common.back} />
          <span className="ml-4 font-bold text-main">{dict.quiz.header}</span>
        </div>
      </Header>

      <main>
        {expressions.length > 0 ? (
          <QuizGame
            initialExpressions={expressions}
            locale={locale}
            dict={dict}
          />
        ) : (
          <div className="p-10 text-center text-zinc-500">
            {dict.quiz.failedToLoad}
          </div>
        )}
      </main>
    </div>
  );
}
