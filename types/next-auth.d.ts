import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tier: "free" | "pro";
      subscriptionEndDate: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    tier?: "free" | "pro";
    subscription_end_date?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tier: "free" | "pro";
    subscriptionEndDate: string | null;
  }
}
