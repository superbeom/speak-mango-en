import { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { getAuthSession } from "@/lib/auth/utils";
import MainHeader from "@/components/MainHeader";
import LoginRequiredView from "@/components/me/LoginRequiredView";
import ProfileHeader from "@/components/me/ProfileHeader";
import StudyModesGrid from "@/components/me/StudyModesGrid";
import VocabularyListContainer from "@/components/me/VocabularyListContainer";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();

  return {
    title: dict.me.metaTitle,
    description: dict.me.metaDescription,
    openGraph: {
      title: dict.me.metaTitle,
      description: dict.me.metaDescription,
      url: "./",
    },
    alternates: {
      canonical: "./",
    },
    robots: { index: false, follow: false },
  };
}

export default async function MyPage() {
  const { dict } = await getI18n();
  const { user, isPro, isAuthenticated } = await getAuthSession();

  if (!isAuthenticated) {
    return <LoginRequiredView />;
  }

  return (
    <div className="min-h-screen bg-layout">
      <MainHeader />
      <div className="max-w-2xl mx-auto pb-24 px-4 sm:px-6 py-8 space-y-10">
        <section>
          <ProfileHeader user={user || null} isPro={isPro} />
        </section>

        <section>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 px-1 flex items-center gap-2 opacity-60 grayscale-[0.5]">
            {dict.me.studyModes}
            <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter border border-zinc-200 dark:border-zinc-700">
              {dict.common.comingSoon}
            </span>
          </h3>
          <StudyModesGrid />
        </section>

        <section>
          <VocabularyListContainer isPro={isPro} />
        </section>
      </div>
    </div>
  );
}
