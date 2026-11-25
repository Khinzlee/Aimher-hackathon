"use client";

import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border px-4 py-3 shadow-lg pointer-events-auto ${
            t.variant === "destructive"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-white border-gray-200 text-gray-800"
          }`}
        >
          {t.title && <p className="text-sm font-semibold">{t.title}</p>}
          {t.description && <p className="text-xs mt-0.5 opacity-80">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}
