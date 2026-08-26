import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "배호성 스키 아카데미 | 반편성 안내",
  description: "반편성표 확인",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full bg-ice text-alpine">{children}</body>
    </html>
  );
}
