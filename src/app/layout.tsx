import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gem Merchants",
  description: "A personal learning-project clone of a classic gem-trading board game.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
