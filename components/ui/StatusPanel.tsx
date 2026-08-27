import type { ReactNode } from "react";

type StatusPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "error";
};

export default function StatusPanel({
  title,
  description,
  action,
  tone = "default",
}: StatusPanelProps) {
  const isError = tone === "error";

  return (
    <section
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`rounded-2xl border p-6 text-center shadow-sm ${
        isError
          ? "border-danger/25 bg-danger/5 text-danger"
          : "border-border bg-surface text-alpine"
      }`}
    >
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-2 text-sm leading-6 opacity-80">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </section>
  );
}
