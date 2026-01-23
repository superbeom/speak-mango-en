"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  trackQuizStart,
  trackQuizAnswer,
  trackQuizComplete,
} from "@/analytics";
import { SupportedLanguage } from "@/i18n";
import { Expression } from "@/types/database";
import { formatMessage } from "@/lib/utils";
import { parseQuizQuestion, QUIZ_STORAGE_KEYS } from "@/lib/quiz";
import StudyButton from "@/components/quiz/StudyButton";

interface QuizGameProps {
  initialExpressions: Expression[];
  locale: SupportedLanguage;
  dict: any; // Dictionary type would be better if imported
}

type QuizState = "playing" | "summary";

export default function QuizGame({
  initialExpressions,
  locale,
  dict,
}: QuizGameProps) {
  const [expressions, setExpressions] =
    useState<Expression[]>(initialExpressions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<QuizState>("playing");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  // To track history for summary: { expressionId, isCorrect }
  const [history, setHistory] = useState<
    { expression: Expression; isCorrect: boolean }[]
  >([]);

  // Current Question Data
  const currentExpression = expressions[currentIndex];
  // Fallback to EN if locale content is missing, typical i18n logic
  const content =
    currentExpression.content[locale as string] ||
    currentExpression.content["en"];

  // Parse Question
  const parsedQuiz = useMemo(() => {
    if (!content) return null;
    return parseQuizQuestion(content.quiz);
  }, [content]);

  // Restore state logic
  useEffect(() => {
    const shouldRestore = sessionStorage.getItem(QUIZ_STORAGE_KEYS.RETURN_FLAG);

    if (shouldRestore) {
      const savedState = sessionStorage.getItem(QUIZ_STORAGE_KEYS.STATE);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setExpressions(parsed.expressions);
          setCurrentIndex(parsed.currentIndex);
          setScore(parsed.score);
          setGameState(parsed.gameState);
          setHistory(parsed.history);
          // Optional: restore selection state if you want precise resumption
          if (parsed.selectedAnswer) setSelectedAnswer(parsed.selectedAnswer);
          if (parsed.isAnswerChecked)
            setIsAnswerChecked(parsed.isAnswerChecked);
        } catch (e) {
          console.error("Failed to restore quiz state", e);
        }
      }
      // Consume the flag
      sessionStorage.removeItem(QUIZ_STORAGE_KEYS.RETURN_FLAG);
    } else {
      // If not returning from study, start fresh -> clear any old state
      sessionStorage.removeItem(QUIZ_STORAGE_KEYS.STATE);
      trackQuizStart();
    }
  }, []);

  // Persist state logic
  useEffect(() => {
    const stateToSave = {
      expressions,
      currentIndex,
      score,
      gameState,
      history,
      selectedAnswer,
      isAnswerChecked,
    };
    sessionStorage.setItem(
      QUIZ_STORAGE_KEYS.STATE,
      JSON.stringify(stateToSave),
    );
  }, [
    expressions,
    currentIndex,
    score,
    gameState,
    history,
    selectedAnswer,
    isAnswerChecked,
  ]);

  const handleAnswerSelect = (optionLabel: string) => {
    if (isAnswerChecked) return; // Prevent double clicking

    setSelectedAnswer(optionLabel);
    setIsAnswerChecked(true);

    const isCorrect = optionLabel === content.quiz.answer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Add to history
    setHistory((prev) => [
      ...prev,
      { expression: currentExpression, isCorrect },
    ]);

    trackQuizAnswer({
      expressionId: currentExpression.id,
      isCorrect,
      questionIndex: currentIndex,
    });
  };

  const handleNext = () => {
    // Reset state for next question
    setSelectedAnswer(null);
    setIsAnswerChecked(false);

    if (currentIndex < expressions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setGameState("summary");
      trackQuizComplete({
        score,
        totalQuestions: expressions.length,
      });
    }
  };

  const handleRestart = () => {
    // For a simple standard web approach, we can verify if we want client-side fetch or full reload.
    // Full reload is easiest to get fresh server data (random order).
    // Clear state before reloading
    sessionStorage.removeItem(QUIZ_STORAGE_KEYS.STATE);
    sessionStorage.removeItem(QUIZ_STORAGE_KEYS.RETURN_FLAG);
    window.location.reload();
  };

  if (gameState === "summary") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-main">
            {dict.quiz.completeTitle}
          </h1>
          <div className="text-2xl font-bold text-main">
            {dict.quiz.score} <span className="text-green-500">{score}</span> /{" "}
            {expressions.length}
          </div>
        </div>

        <div className="rounded-2xl border border-main bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-main">
            {dict.quiz.reviewTitle}
          </h2>
          <ul className="space-y-4">
            {history.map((item) => (
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
                  label={dict.quiz.study}
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
              index: String(currentIndex + 1),
            })}
          </span>
          <span>
            {currentIndex + 1} / {expressions.length}
          </span>
        </div>
        <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{
              width: `${((currentIndex + 1) / expressions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <section className="relative rounded-3xl border border-main bg-surface shadow-lg overflow-hidden transition-all">
        <div className="p-6 sm:p-8 space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-main leading-relaxed whitespace-pre-wrap">
            {parsedQuiz.question}
          </h2>

          <div className="space-y-3">
            {parsedQuiz.options.map((option) => {
              const label = option.label; // A, B, C
              const isSelected = selectedAnswer === label;
              const isCorrect = label === content.quiz.answer;

              // Determine button style based on state
              let buttonStyle =
                "w-full text-left p-4 rounded-xl border-2 border-zinc-100 bg-white hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-[0.98] dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700";

              if (isAnswerChecked) {
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
                  disabled={isAnswerChecked}
                  className={`${buttonStyle} ${isAnswerChecked ? "cursor-not-allowed" : "cursor-pointer"}`}
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
        {isAnswerChecked && (
          <div className="bg-zinc-50 border-t border-subtle p-6 dark:bg-zinc-900 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  {selectedAnswer === content.quiz.answer ? (
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
                    label={dict.quiz.study}
                    className="flex-1 sm:flex-none py-3 px-6 h-auto"
                  />
                  <button
                    onClick={handleNext}
                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl blue-btn font-bold transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    {currentIndex < expressions.length - 1
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
