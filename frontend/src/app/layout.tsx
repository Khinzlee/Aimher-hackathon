import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Activity } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aimher — Symptom Intensity",
  description: "Log symptom intensity and track condition burden",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: '#00897B' }}
              >
                <Activity className="h-4 w-4" />
              </span>
              <span className="font-bold text-gray-900">Aimher</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 pb-24">{children}</main>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
