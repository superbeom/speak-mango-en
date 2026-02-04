import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { DATABASE_SCHEMA } from "@/constants";
import { getAuthSession } from "@/lib/auth/utils";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const { userId, session } = await getAuthSession();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET!;

  // Validate configuration (Optional but helpful for debugging)
  if (!jwtSecret && userId) {
    console.warn(
      "SUPABASE_JWT_SECRET is missing. RLS policies relying on auth.uid() will fail.",
    );
  }

  const options = {
    db: {
      schema: DATABASE_SCHEMA,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
    global: {},
  };

  // If user is logged in, sign a custom JWT for Supabase key
  // This allows Supabase to recognize the user as authenticated with their ID
  if (userId && session && jwtSecret) {
    const payload = {
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      sub: userId,
      email: session.user?.email,
      role: "authenticated",
    };

    try {
      const token = jwt.sign(payload, jwtSecret);
      options.global = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    } catch (error) {
      console.error("Failed to sign JWT for Supabase:", error);
    }
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, options);
}
