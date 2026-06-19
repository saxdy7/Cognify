import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "tldraw/tldraw.css";
import { BackgroundBeams } from "@/components/BackgroundBeams";
import { Toaster } from "sonner";

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
        className={`${spaceGrotesk.variable} ${geistMono.variable} antialiased bg-white dark:bg-black relative min-h-screen`}
        suppressHydrationWarning
      >
        <BackgroundBeams />
        <div className="relative z-10" suppressHydrationWarning>
          {children}
        </div>
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
