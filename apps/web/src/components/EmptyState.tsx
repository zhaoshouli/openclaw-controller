import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[28px] border border-dashed border-line bg-white px-8 py-14 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-50 text-slate-300">
        {icon}
      </div>
      <h3 className="text-2xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">{description}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}

