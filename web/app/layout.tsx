import type { Metadata } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import { LocationCityInit } from "@/src/components/layout/LocationCityInit";
import { ThemeInit } from "@/src/components/layout/ThemeInit";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-cp-sans",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cp-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-cp-mono",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${inter.variable} ${anton.variable} ${jetbrainsMono.variable} h-full antialiased`}
      data-theme="bright"
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeInit />
        <LocationCityInit />
        <div className="buildverse-backdrop" aria-hidden="true">
          <span className="buildverse-orbit buildverse-orbit-a cp-orbit-drift" />
          <span className="buildverse-orbit buildverse-orbit-b cp-orbit-drift" />
          <span className="buildverse-orbit buildverse-orbit-c cp-orbit-drift" />
        </div>
        {children}
      </body>
    </html>
  );
}
