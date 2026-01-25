import { createClient } from "@supabase/supabase-js";
import type { Adapter } from "@auth/core/adapters";

export function format<T>(obj: Record<string, any>): T {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      delete obj[key];
    }
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // @ts-ignore
        obj[key] = date;
      }
    }
  }
  return obj as T;
}

export interface SupabaseAdapterOptions {
  url: string;
  secret: string;
  schema?: string;
}

export function CustomSupabaseAdapter(
  options: SupabaseAdapterOptions,
): Adapter {
  const { url, secret, schema = "speak_mango_en" } = options;
  const supabase = createClient(url, secret, {
    db: { schema },
    global: { headers: { "X-Client-Info": "speak-mango-custom-adapter" } },
    auth: { persistSession: false },
  });

  return {
    async createUser(user) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          ...user,
          emailVerified: user.emailVerified?.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return format(data);
    },
    async getUser(id) {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return format(data);
    },
    async getUserByEmail(email) {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return format(data);
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const { data, error } = await supabase
        .from("accounts")
        .select("users (*)")
        .match({ provider, providerAccountId })
        .maybeSingle();
      if (error) throw error;
      if (!data || !data.users) return null;
      return format(data.users);
    },
    async updateUser(user) {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...user,
          emailVerified: user.emailVerified?.toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return format(data);
    },
    async deleteUser(userId) {
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;
    },
    async linkAccount(account) {
      const { error } = await supabase.from("accounts").insert(account);
      if (error) throw error;
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .match({ provider, providerAccountId });
      if (error) throw error;
    },
    async createSession({ sessionToken, userId, expires }) {
      const { data, error } = await supabase
        .from("sessions")
        .insert({ sessionToken, userId, expires: expires.toISOString() })
        .select()
        .single();
      if (error) throw error;
      return format(data);
    },
    async getSessionAndUser(sessionToken) {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, users(*)")
        .eq("sessionToken", sessionToken)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { users: user, ...session } = data;
      return {
        user: format(user),
        session: format(session),
      };
    },
    async updateSession(session) {
      const { data, error } = await supabase
        .from("sessions")
        .update({
          ...session,
          expires: session.expires?.toISOString(),
        })
        .eq("sessionToken", session.sessionToken)
        .select()
        .single();
      if (error) throw error;
      return format(data);
    },
    async deleteSession(sessionToken) {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("sessionToken", sessionToken);
      if (error) throw error;
    },
    async createVerificationToken(token) {
      const { data, error } = await supabase
        .from("verification_tokens")
        .insert({
          ...token,
          expires: token.expires.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...verificationToken } = data;
      return format(verificationToken);
    },
    async useVerificationToken({ identifier, token }) {
      const { data, error } = await supabase
        .from("verification_tokens")
        .delete()
        .match({ identifier, token })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...verificationToken } = data;
      return format(verificationToken);
    },
  };
}
