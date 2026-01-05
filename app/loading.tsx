import {
  SkeletonCard,
  SkeletonFilterBar,
  SkeletonNavbar,
  SkeletonHomeHero,
} from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-layout">
      {/* Navbar Skeleton */}
      <SkeletonNavbar />

      <main className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Home Hero Skeleton */}
        <SkeletonHomeHero />

        {/* FilterBar Skeleton */}
        <SkeletonFilterBar />

        {/* Grid of Skeleton Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
