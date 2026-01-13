import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ExpressionProvider } from "@/context/ExpressionContext";
import { getI18n } from "@/i18n/server";
import { SERVICE_NAME, BASE_URL } from "@/constants";
import { formatMessage } from "@/lib/utils";
import ScrollToTop from "@/components/ScrollToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const { fullLocale, dict } = await getI18n();

  const title = formatMessage(dict.meta.mainTitle, {
    serviceName: SERVICE_NAME,
  });

  const description = dict.meta.mainDescription;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: title,
      template: `%s | ${SERVICE_NAME}`,
    },
    description,
    keywords: dict.meta.keywords.split(", "),
    authors: [{ name: SERVICE_NAME }],
    creator: SERVICE_NAME,
    publisher: SERVICE_NAME,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: SERVICE_NAME,
      startupImage: [
        {
          url: "/assets/splash/apple-splash-2048-2732.png",
          media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2732-2048.png",
          media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1668-2388.png",
          media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2388-1668.png",
          media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1536-2048.png",
          media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2048-1536.png",
          media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1668-2224.png",
          media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2224-1668.png",
          media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1620-2160.png",
          media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2160-1620.png",
          media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1290-2796.png",
          media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2796-1290.png",
          media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1179-2556.png",
          media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2556-1179.png",
          media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1284-2778.png",
          media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2778-1284.png",
          media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1170-2532.png",
          media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2532-1170.png",
          media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1125-2436.png",
          media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2436-1125.png",
          media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1242-2688.png",
          media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2688-1242.png",
          media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-828-1792.png",
          media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-1792-828.png",
          media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-1242-2208.png",
          media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-2208-1242.png",
          media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-750-1334.png",
          media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-1334-750.png",
          media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
        },
        {
          url: "/assets/splash/apple-splash-640-1136.png",
          media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          url: "/assets/splash/apple-splash-1136-640.png",
          media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
        },
      ],
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title,
      description,
      url: BASE_URL,
      siteName: SERVICE_NAME,
      locale: fullLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@speakmango",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/assets/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/assets/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: "/assets/apple-touch-icon.png",
      other: {
        rel: "apple-touch-icon-precomposed",
        url: "/assets/apple-touch-icon.png",
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getI18n();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ExpressionProvider>
          {children}
          <ScrollToTop />
        </ExpressionProvider>
      </body>
    </html>
  );
}
