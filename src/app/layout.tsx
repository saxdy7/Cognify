import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BackgroundBeams } from "@/components/BackgroundBeams";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cognify | Smart Bookmark Hub",
  description: "Organize your digital life with AI-powered smart containers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-white dark:bg-black relative min-h-screen`}
      >
        <BackgroundBeams />
        <div className="relative z-10">
          {children}
        </div>
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
