/**
 * Toast notification types and constants
 */

export type ToastType = "success" | "error";

export const TOAST_TYPE = {
  SUCCESS: "success" as const,
  ERROR: "error" as const,
} satisfies Record<string, ToastType>;
