import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "לבריכה! — מזג אוויר ובריכה בבאר שבע",
  description: "מדד UV בזמן אמת לבאר שבע, תחזית שבועית, ומי בבריכה עכשיו",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body className="min-h-screen text-[color:var(--color-ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
