"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

/**
 * AnalyticsProvider
 *
 * Automatically tracks page views when the route changes.
 * This component should be placed in the root layout.
 */
export default function AnalyticsProvider({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view on route change
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Wait for document.title to be set by Next.js metadata
    // This ensures we capture the correct title in analytics
    const timer = setTimeout(() => {
      trackPageView(url, document.title, lang);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, lang]);

  return <>{children}</>;
}
