import { ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";

export interface RoundedSelectOption {
  label: string;
  value: string;
}

interface RoundedSelectProps {
  value: string;
  options: RoundedSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RoundedSelect({
  value,
  options,
  onChange,
  placeholder = "请选择"
}: RoundedSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "input flex items-center justify-between gap-3 text-left",
          open && "border-brand-500 ring-2 ring-brand-100"
        )}
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-slate-400 transition", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[20px] border border-line bg-white shadow-panel">
          <div className="max-h-64 overflow-y-auto p-2">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition",
                    active
                      ? "bg-brand-50 font-semibold text-brand-600"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {active ? <Check size={15} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

