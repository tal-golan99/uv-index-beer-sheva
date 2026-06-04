import type { Metadata } from "next";
import { Assistant, Suez_One } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-assistant",
  display: "swap",
});

// Display face for headings/hero — a strong Hebrew slab that pairs on a real
// contrast axis with the humanist Assistant body (single weight; inherently heavy).
const suez = Suez_One({
  subsets: ["hebrew", "latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UV Pool · באר שבע",
  description: "מדד UV בזמן אמת ומי נמצא בבריכה עכשיו, בבאר שבע",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${assistant.variable} ${suez.variable}`}>
      <body className="min-h-screen text-[color:var(--color-ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
