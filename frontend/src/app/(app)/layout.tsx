import { Suspense } from "react";
import BottomNav from "@/components/BottomNav";
import { Providers } from "@/components/Providers";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="app-shell">
        {children}
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </div>
    </Providers>
  );
}
