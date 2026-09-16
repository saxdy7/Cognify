import { BackgroundBeams } from '@/components/motion/BackgroundBeams';

// Auth screens share the marketing look (dark, beams) rather than the app shell.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative min-h-screen bg-black text-white">
      <BackgroundBeams />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
