import { UrbanistScope } from '@/components/site/UrbanistScope';

// Sign-in / sign-up share the marketing skin and follow the visitor's theme.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-ui relative min-h-svh text-foreground">
      <UrbanistScope />
      {children}
    </div>
  );
}
