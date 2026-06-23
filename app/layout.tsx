import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CONFERENCE } from "@/data/schedule";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const title = "StartFest 2026 Companion — Silicon Slopes";
const description =
  "Browse the StartFest 2026 agenda, build your personal schedule, see who's going, get conflict warnings, and add sessions to your calendar. No sign-up required to explore.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "StartFest Companion",
  authors: [{ name: "Taha Salahuddin Abbasi" }],
  openGraph: {
    title,
    description,
    siteName: "StartFest Companion",
    type: "website",
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title, description },
  keywords: [
    "StartFest",
    "StartFest 2026",
    "Silicon Slopes",
    "conference schedule",
    "Utah startups",
    "tech conference Utah",
  ],
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23071a45'/%3E%3Cpath d='M38 28 L70 50 L38 72 Z' fill='%23c6f23e'/%3E%3C/svg%3E",
      },
    ],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://startfest.vercel.app"),
};

export const viewport: Viewport = {
  themeColor: "#071a45",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
