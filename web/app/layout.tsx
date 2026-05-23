import type { Metadata } from "next";
import { ThemeInit } from "@/src/components/layout/ThemeInit";
import "./globals.css";

export const metadata: Metadata = {
  title: "CityPramaan",
  description: "Verified repairs and accountability for public infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
