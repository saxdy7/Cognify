import { UrbanistScope } from '@/components/site/UrbanistScope';

// Marketing pages share the app's skin (mesh ground, Urbanist, frosted cards) and now follow the
// visitor's theme — light by default on light systems, ink in dark mode — instead of forcing dark.
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-ui relative min-h-screen text-foreground">
      <UrbanistScope />
      {children}
    </div>
  );
}
