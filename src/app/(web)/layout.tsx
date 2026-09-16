import { BackgroundBeams } from '@/components/motion/BackgroundBeams';

// Marketing pages are intentionally dark-only (brand look); the app itself follows the user's theme.
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative min-h-screen bg-black text-white">
      <BackgroundBeams />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
