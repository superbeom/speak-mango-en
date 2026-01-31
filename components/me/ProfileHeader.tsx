import Image from "next/image";
import { User } from "next-auth";
import { User as UserIcon, Crown } from "lucide-react";
import { getI18n } from "@/i18n/server";

interface ProfileHeaderProps {
  user: User | null;
  isPro: boolean;
}

export default async function ProfileHeader({
  user,
  isPro,
}: ProfileHeaderProps) {
  if (!user) return null;

  const { dict } = await getI18n();

  return (
    <div className="flex items-center gap-5 p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm">
      <div className="relative h-18 w-18 shrink-0 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || dict.me.userAlt}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-zinc-400">
            <UserIcon size={36} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <h2 className="text-2xl font-bold truncate text-zinc-900 dark:text-zinc-50 tracking-tight">
          {user.name}
        </h2>
        <div className="flex items-center gap-3">
          {isPro && (
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-colors bg-linear-to-r from-purple-500/10 to-indigo-500/10 text-purple-700 border-purple-200/50 dark:from-purple-900/30 dark:to-indigo-900/30 dark:text-purple-300 dark:border-purple-500/30">
              <Crown size={12} className="fill-current" />
              {dict.me.proMember}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
