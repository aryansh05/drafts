import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppFrame from "@/components/AppFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: { default: "Drafts — stories worth sharing", template: "%s | Drafts" },
  description: "Read, write, and share ideas with the Drafts community.",
  openGraph: {
    type: "website",
    siteName: "Drafts",
    title: "Drafts — stories worth sharing",
    description: "Read, write, and share ideas with the Drafts community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Drafts — stories worth sharing",
    description: "Read, write, and share ideas with the Drafts community.",
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
      </body>
    </html>
  );
}
