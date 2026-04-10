import { createContext, useContext, useState, type PropsWithChildren } from "react";

interface ToastItem {
  id: string;
  title: string;
  tone?: "default" | "error";
}

interface ToastContextValue {
  push: (title: string, tone?: ToastItem["tone"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push: ToastContextValue["push"] = (title, tone = "default") => {
    const item = { id: crypto.randomUUID(), title, tone };
    setItems((current) => [...current, item]);
    window.setTimeout(() => {
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    }, 2800);
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-6 top-6 z-[90] flex w-80 flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={
              item.tone === "error"
                ? "rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 shadow-panel"
                : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-panel"
            }
          >
            {item.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

