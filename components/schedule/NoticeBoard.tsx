"use client";

export type Notice = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
};

type NoticeBoardProps = {
  notices: Notice[];
  placement?: "content" | "header";
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);
}

export default function NoticeBoard({ notices, placement = "content" }: NoticeBoardProps) {
  if (notices.length === 0) return null;

  const inHeader = placement === "header";

  return (
    <section
      aria-label="공지사항"
      className={inHeader ? "min-w-0 self-stretch" : "mx-auto mb-6 max-w-4xl px-1"}
    >
      <ul className="flex flex-col gap-3">
        {notices.map((notice) => {
          const pinned = notice.pinned;
          return (
            <li key={notice.id}>
              <article
                className={`flex overflow-hidden rounded-2xl border shadow-sm ${
                  pinned
                    ? "border-sunset/40 bg-white"
                    : "border-border bg-white"
                } ${inHeader ? "h-full" : ""}`}
              >
                <div
                  aria-hidden="true"
                  className={`w-1.5 shrink-0 ${pinned ? "bg-sunset" : "bg-summit"}`}
                />
                <div className={`min-w-0 flex-1 px-4 py-4 ${inHeader ? "" : "sm:px-5 sm:py-5"}`}>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-[11px] font-bold tracking-[0.14em] ${
                        pinned ? "text-sunset" : "text-summit"
                      }`}
                    >
                      {pinned ? "중요 공지" : "공지"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate">
                      {formatWhen(notice.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-1 break-words text-[19px] font-black leading-tight tracking-[-0.02em] text-alpine sm:text-[21px]">
                    {notice.title}
                  </h2>
                  <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-6 text-alpine/85">
                    {notice.body}
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
