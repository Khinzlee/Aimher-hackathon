"use client";

import { useSyncExternalStore } from "react";

export interface ToastMessage {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toasts: ToastMessage[] = [];
const EMPTY_TOASTS: ToastMessage[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return toasts;
}

export function toast(props: Omit<ToastMessage, "id">) {
  const id = nextId++;
  toasts = [...toasts, { ...props, id }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 4000);
}

export function useToast() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_TOASTS);
  return { toasts: items, toast };
}
