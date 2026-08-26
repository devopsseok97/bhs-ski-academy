"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export default function Modal({ open, title, children, onClose, footer }: ModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-alpine/55 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-2xl bg-surface shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-xl font-bold text-alpine">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate transition-colors hover:bg-ice hover:text-alpine"
            aria-label="모달 닫기"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="px-5 py-5 text-alpine">{children}</div>
        {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
      </section>
    </div>
  );
}
