import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="AIMHER Health" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="font-bold text-[var(--ink)]">AIMHER</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 pb-24">{children}</main>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}
