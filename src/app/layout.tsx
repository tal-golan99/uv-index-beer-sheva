import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UV Index — באר שבע",
  description: "מדד UV בזמן אמת לבאר שבע עם גרפים ומערכת התראות",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
