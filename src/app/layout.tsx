import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk, Urbanist } from "next/font/google";
import "./globals.css";
import "tldraw/tldraw.css";
// Liveblocks default styles (+ dark theme keyed off the `dark` class on <html>)
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-ui/styles/dark/attributes.css";
import "@liveblocks/react-tiptap/styles.css";
import "lenis/dist/lenis.css";
import { ThemeProvider } from "@/lib/provider/ThemeProvider";
import { SmoothScrollProvider } from "@/lib/provider/SmoothScrollProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
// App-shell face (dashboard only — see (main)/layout.tsx). Marketing keeps Geist/Space Grotesk.
const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: {
    default: "Cognify — Smart Bookmark Hub",
    template: "%s · Cognify",
  },
  description: "Organize links, boards and docs in one collaborative workspace.",
  applicationName: "Cognify",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: '/favicon.ico?v=3', sizes: 'any' },
      { url: '/favicon.png?v=3', sizes: '64x64', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=3',
    apple: '/apple-icon.png?v=3',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(geist.variable, spaceGrotesk.variable, geistMono.variable, urbanist.variable, "min-h-screen antialiased")}>
        <SmoothScrollProvider>
          <ThemeProvider>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            <Toaster position="bottom-center" />
          </ThemeProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
