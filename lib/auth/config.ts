import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { AUTH_SCHEMA } from "@/constants";
import { CustomSupabaseAdapter } from "./CustomSupabaseAdapter";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: CustomSupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    schema: AUTH_SCHEMA,
  }),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days (Refresh Token lifetime)
    updateAge: 24 * 60 * 60, // 24 hours (Update session in DB every 24h)
  },
  callbacks: {
    async session({ session, user }) {
      // Attach custom fields from DB to session
      if (session.user) {
        session.user.id = user.id;
        session.user.tier = user.tier || "free";
        session.user.subscriptionEndDate = user.subscription_end_date || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
