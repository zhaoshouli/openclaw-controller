import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer
}: PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: ReactNode;
}>) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-white shadow-panel">
          <div className="flex items-start justify-between border-b border-line px-6 py-5">
            <div>
              <Dialog.Title className="text-xl font-semibold text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-2 text-sm text-slate-500">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="max-h-[68vh] overflow-y-auto px-6 py-6">{children}</div>
          {footer ? <div className="border-t border-line px-6 py-4">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

