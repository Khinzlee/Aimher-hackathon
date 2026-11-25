import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });

export const metadata: Metadata = {
  title: "AIMHER Health",
  description: "Metabolic & Syndromic Health Monitor",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSans.variable}>{children}</body>
    </html>
  );
}
