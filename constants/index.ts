export const SERVICE_NAME = "Speak Mango";
export const DATABASE_SCHEMA = "speak_mango_en";
export const STORAGE_BUCKET = "speak-mango-en";
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const DOMAINS = ["all", "conversation", "test", "vocabulary"];

export const CATEGORIES = [
  "all",
  "daily",
  "business",
  "travel",
  "shopping",
  "emotion",
  "slang",
];

export const SCROLL_RESET_KEY = "SCROLL_RESET";

export const LOCAL_STORAGE_KEYS = {
  USER_ACTIONS: "user_actions",
};
