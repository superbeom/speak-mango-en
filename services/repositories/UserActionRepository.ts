/**
 * 애플리케이션 레벨 유저 액션 타입.
 *
 * - "save": 표현 저장/해제 (Phase 3에서 vocabulary_items 기반으로 전환됨, user_actions 테이블 미사용)
 * - "learn": 표현 학습 완료/해제 (user_actions 테이블 사용)
 */
export type ActionType = "save" | "learn";

/**
 * 로컬 스토리지에서 actions 레코드로 관리하는 액션 타입.
 * Phase 3: save는 vocabularyLists에서 파생되므로 learn만 해당.
 */
export type LocalActionType = Extract<ActionType, "learn">;
