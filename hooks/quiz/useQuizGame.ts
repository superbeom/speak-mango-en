import { useReducer, useMemo, useEffect } from "react";
import {
  trackQuizStart,
  trackQuizAnswer,
  trackQuizComplete,
} from "@/analytics";
import { useI18n } from "@/context/I18nContext";
import { Expression } from "@/types/database";
import { parseQuizQuestion, QUIZ_STORAGE_KEYS } from "@/lib/quiz";

/** Constants */
const QUIZ_ACTION = {
  RESTORE: "RESTORE_STATE",
  SUBMIT: "SUBMIT_ANSWER",
  NEXT: "NEXT_QUESTION",
  FINISH: "FINISH_QUIZ",
} as const;

/** Types */
export type QuizStatus = "playing" | "summary";

export interface QuizHistoryItem {
  expression: Expression;
  isCorrect: boolean;
}

export interface QuizState {
  expressions: Expression[];
  currentIndex: number;
  score: number;
  status: QuizStatus;
  selectedAnswer: string | null;
  isAnswerChecked: boolean;
  history: QuizHistoryItem[];
}

/** Actions */
type QuizAction =
  | { type: typeof QUIZ_ACTION.RESTORE; payload: QuizState }
  | {
      type: typeof QUIZ_ACTION.SUBMIT;
      payload: {
        answer: string;
        isCorrect: boolean;
        currentExpression: Expression;
      };
    }
  | { type: typeof QUIZ_ACTION.NEXT }
  | { type: typeof QUIZ_ACTION.FINISH };

/** Reducer */
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case QUIZ_ACTION.RESTORE:
      return action.payload;

    case QUIZ_ACTION.SUBMIT: {
      if (state.isAnswerChecked) return state;
      const { answer, isCorrect, currentExpression } = action.payload;
      return {
        ...state,
        selectedAnswer: answer,
        isAnswerChecked: true,
        score: isCorrect ? state.score + 1 : state.score,
        history: [
          ...state.history,
          { expression: currentExpression, isCorrect },
        ],
      };
    }

    case QUIZ_ACTION.NEXT:
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        selectedAnswer: null,
        isAnswerChecked: false,
      };

    case QUIZ_ACTION.FINISH:
      return {
        ...state,
        status: "summary",
      };
    default:
      return state;
  }
}

/** Hook */
export function useQuizGame(initialExpressions: Expression[]) {
  const { locale } = useI18n();

  // Initial State Factory
  const initialState: QuizState = {
    expressions: initialExpressions,
    currentIndex: 0,
    score: 0,
    status: "playing",
    selectedAnswer: null,
    isAnswerChecked: false,
    history: [],
  };

  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Derived Values
  const currentExpression = state.expressions[state.currentIndex];

  // Safe access for content
  const content =
    currentExpression?.content[locale as string] ||
    currentExpression?.content["en"];

  // Parse Question
  const parsedQuiz = useMemo(() => {
    if (!content) return null;
    return parseQuizQuestion(content.quiz);
  }, [content]);

  // Restore state logic
  useEffect(() => {
    const shouldRestore = sessionStorage.getItem(QUIZ_STORAGE_KEYS.RETURN_FLAG);

    if (shouldRestore) {
      const savedStateStr = sessionStorage.getItem(QUIZ_STORAGE_KEYS.STATE);
      if (savedStateStr) {
        try {
          const parsed = JSON.parse(savedStateStr);
          // Map inconsistent naming if any (gameState -> status)
          const restoredState: QuizState = {
            expressions: parsed.expressions,
            currentIndex: parsed.currentIndex,
            score: parsed.score,
            status: parsed.gameState || parsed.status || "playing",
            selectedAnswer: parsed.selectedAnswer || null,
            isAnswerChecked: parsed.isAnswerChecked || false,
            history: parsed.history || [],
          };
          dispatch({ type: QUIZ_ACTION.RESTORE, payload: restoredState });
        } catch (e) {
          console.error("Failed to restore quiz state", e);
        }
      }
      sessionStorage.removeItem(QUIZ_STORAGE_KEYS.RETURN_FLAG);
    } else {
      sessionStorage.removeItem(QUIZ_STORAGE_KEYS.STATE);
      trackQuizStart();
    }
  }, []);

  // Persist state logic
  useEffect(() => {
    const stateToSave = {
      ...state,
      gameState: state.status, // Keeping compatibility
    };
    sessionStorage.setItem(
      QUIZ_STORAGE_KEYS.STATE,
      JSON.stringify(stateToSave),
    );
  }, [state]);

  const handleAnswerSelect = (optionLabel: string) => {
    if (state.isAnswerChecked) return;

    const isCorrect = optionLabel === content.quiz.answer;
    dispatch({
      type: QUIZ_ACTION.SUBMIT,
      payload: {
        answer: optionLabel,
        isCorrect,
        currentExpression,
      },
    });

    trackQuizAnswer({
      expressionId: currentExpression.id,
      isCorrect,
      questionIndex: state.currentIndex,
    });
  };

  const handleNext = () => {
    if (state.currentIndex < state.expressions.length - 1) {
      dispatch({ type: QUIZ_ACTION.NEXT });
    } else {
      dispatch({ type: QUIZ_ACTION.FINISH });
      trackQuizComplete({
        score: state.score,
        totalQuestions: state.expressions.length,
      });
    }
  };

  const handleRestart = () => {
    sessionStorage.removeItem(QUIZ_STORAGE_KEYS.STATE);
    sessionStorage.removeItem(QUIZ_STORAGE_KEYS.RETURN_FLAG);
    window.location.reload();
  };

  return {
    state,
    content,
    parsedQuiz,
    currentExpression,
    actions: {
      handleAnswerSelect,
      handleNext,
      handleRestart,
    },
  };
}
