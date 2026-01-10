import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insider Trading Tracker - SEC Form 4 Filings",
  description: "Track insider buying and selling activity for US publicly traded companies. Real-time SEC Form 4 filings data.",
  keywords: ["insider trading", "SEC", "Form 4", "stock market", "insider buying", "insider selling"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
