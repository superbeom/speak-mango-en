import { createBrowserClient } from "@supabase/ssr";
import { DATABASE_SCHEMA } from "@/constants";

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: DATABASE_SCHEMA,
      },
    }
  );
}
