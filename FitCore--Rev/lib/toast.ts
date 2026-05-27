type ToastKind = "success" | "error" | "warning" | "info";

const activeToasts = new Set<string>();
const activeToastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export interface ToastPayload {
  message: string;
  kind?: ToastKind;
}

export function showToast(message: string, kind: ToastKind = "info") {
  if (typeof window === "undefined") return;

  if (activeToasts.has(message)) return;

  activeToasts.add(message);
  const previousTimer = activeToastTimers.get(message);
  if (previousTimer) {
    clearTimeout(previousTimer);
  }

  const timer = setTimeout(() => {
    activeToasts.delete(message);
    activeToastTimers.delete(message);
  }, 5000);

  activeToastTimers.set(message, timer);

  window.dispatchEvent(
    new CustomEvent<ToastPayload>("fitcore:toast", {
      detail: { message, kind },
    })
  );
}

export function showErrorToast(message: string) {
  showToast(message, "error");
}

export function showSuccessToast(message: string) {
  showToast(message, "success");
}

export function showWarningToast(message: string) {
  showToast(message, "warning");
}
