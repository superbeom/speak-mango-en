import { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { getRandomExpressions } from "@/lib/expressions";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import QuizGame from "@/components/quiz/QuizGame";

export const metadata: Metadata = {
  title: "Random Quiz Challenge - Speak Mango",
  description: "Test your skills with random English expressions!",
};

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
        <div className="flex items-center">
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
            Failed to load quiz data. Please try again.
          </div>
        )}
      </main>
    </div>
  );
}
