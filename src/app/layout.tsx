import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/lib/fontawesome";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Worshippy - Worship Lyrics Deck Generator",
  description:
    "Generate polished PowerPoint worship lyrics decks from song titles. Paste your set list, get a beautiful .pptx ready for projection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
