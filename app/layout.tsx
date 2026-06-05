import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahmud Cafe - Hesap Takip",
  description: "Arkadaş grubu hesap takip uygulaması",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
