import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AppFrame from "@/components/AppFrame";
import { SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Drafts",
  title: { default: "Drafts", template: "%s | Drafts" },
  description: "Read, write, and share ideas with the Drafts community.",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "96x96" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Drafts",
    url: SITE_URL,
    title: "Drafts",
    description: "Read, write, and share ideas with the Drafts community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Drafts",
    description: "Read, write, and share ideas with the Drafts community.",
  },
  verification: {
    google: "jCZ_gULX0FzZ4l_JoxTlNct7fp8iyYbgo5Qz-b7Djkw",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AppFrame>{children}</AppFrame>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
