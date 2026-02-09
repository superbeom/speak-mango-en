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

      <main className="layout-container py-8">
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
