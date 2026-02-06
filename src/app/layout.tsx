import type { Metadata } from "next";
import "./globals.css";
import "@/lib/fontawesome";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
