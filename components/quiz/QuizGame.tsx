"use client";

import Link from "next/link";
import { Expression } from "@/types/database";
import { formatMessage } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";
import { useQuizGame } from "@/hooks/quiz/useQuizGame";
import StudyButton from "@/components/quiz/StudyButton";

interface QuizGameProps {
  initialExpressions: Expression[];
}

export default function QuizGame({ initialExpressions }: QuizGameProps) {
  const { dict } = useI18n();
  const {
    state,
    content,
    parsedQuiz,
    currentExpression,
    actions: { handleAnswerSelect, handleNext, handleRestart },
  } = useQuizGame(initialExpressions);

  if (state.status === "summary") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-main">
            {dict.quiz.completeTitle}
          </h1>
          <div className="text-2xl font-bold text-main">
            {dict.quiz.score}{" "}
            <span className="text-green-500">{state.score}</span> /{" "}
            {state.expressions.length}
          </div>
        </div>

        <div className="rounded-2xl border border-main bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-main">
            {dict.quiz.reviewTitle}
          </h2>
          <ul className="space-y-4">
            {state.history.map((item) => (
              <li
                key={item.expression.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-subtle gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span
                    className={`text-xl ${
                      item.isCorrect ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {item.isCorrect ? "✅" : "❌"}
                  </span>
                  <span className="font-medium text-main">
                    {item.expression.expression}
                  </span>
                </div>
                <StudyButton
                  expressionId={item.expression.id}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-lg"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl font-bold bg-zinc-700 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            {dict.quiz.goHome}
          </Link>
          <button
            onClick={handleRestart}
            className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 cursor-pointer"
          >
            {dict.quiz.startNew}
          </button>
        </div>
      </div>
    );
  }

  if (!parsedQuiz)
    return <div className="p-8 text-center">{dict.common.loading}</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-bold text-zinc-500 mb-2">
          <span>
            {formatMessage(dict.quiz.questionProgress, {
              index: String(state.currentIndex + 1),
            })}
          </span>
          <span>
            {state.currentIndex + 1} / {state.expressions.length}
          </span>
        </div>
        <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{
              width: `${((state.currentIndex + 1) / state.expressions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <section className="relative rounded-card border border-main bg-surface shadow-lg overflow-hidden transition-all">
        <div className="p-6 sm:p-8 space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-main leading-relaxed whitespace-pre-wrap">
            {parsedQuiz.question}
          </h2>

          <div className="space-y-3">
            {parsedQuiz.options.map((option) => {
              const label = option.label; // A, B, C
              const isSelected = state.selectedAnswer === label;
              const isCorrect = label === content.quiz.answer;

              // Determine button style based on state
              let buttonStyle =
                "w-full text-left p-4 rounded-xl border-2 border-zinc-100 bg-white hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-[0.98] dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700";

              if (state.isAnswerChecked) {
                if (isCorrect) {
                  // This is the correct answer
                  buttonStyle =
                    "w-full text-left p-4 rounded-xl border-2 border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100";
                } else if (isSelected && !isCorrect) {
                  // This was selected but wrong
                  buttonStyle =
                    "w-full text-left p-4 rounded-xl border-2 border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100";
                } else {
                  // Not selected, not correct (dimmed)
                  buttonStyle =
                    "w-full text-left p-4 rounded-xl border-2 border-transparent bg-zinc-50 text-zinc-400 dark:bg-zinc-800/50";
                }
              }

              return (
                <button
                  key={label}
                  onClick={() => handleAnswerSelect(label)}
                  disabled={state.isAnswerChecked}
                  className={`${buttonStyle} ${state.isAnswerChecked ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex gap-3">
                    <span className="font-black opacity-50">{label}.</span>
                    <span className="font-medium">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback / Next Section */}
        {state.isAnswerChecked && (
          <div className="bg-zinc-50 border-t border-subtle p-6 dark:bg-zinc-900 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  {state.selectedAnswer === content.quiz.answer ? (
                    <div className="text-green-600 font-bold text-lg flex items-center gap-2">
                      <span>{dict.quiz.correct}</span>
                    </div>
                  ) : (
                    <div className="text-red-500 font-bold text-lg flex items-center gap-2">
                      <span>
                        {formatMessage(dict.quiz.wrong, {
                          answer: content.quiz.answer,
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <StudyButton
                    expressionId={currentExpression.id}
                    className="flex-1 sm:flex-none py-3 px-6 h-auto"
                  />
                  <button
                    onClick={handleNext}
                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl blue-btn font-bold transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    {state.currentIndex < state.expressions.length - 1
                      ? dict.quiz.next
                      : dict.quiz.seeResult}
                  </button>
                </div>
              </div>

              <div className="text-sm text-secondary bg-white p-4 rounded-xl border border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700">
                <span className="font-bold text-main mr-2">
                  {dict.quiz.tip}
                </span>
                {content.tip}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
