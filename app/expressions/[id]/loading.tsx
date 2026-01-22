import { SKELETON_PAGE } from "@/constants/ui";
import { SkeletonNavbar, SkeletonDetail } from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-layout pb-20">
      {/* Navbar Skeleton (Detail version) */}
      <SkeletonNavbar page={SKELETON_PAGE.DETAIL} />

      <main className="mx-auto max-w-layout px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <SkeletonDetail />
      </main>
    </div>
  );
}
