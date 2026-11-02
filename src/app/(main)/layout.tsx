/**
 * Authenticated area. Swaps the UI face to Urbanist for everything under
 * /dashboard (portals — dialogs, menus — inherit it because the override sits
 * on <body>, where next/font defines the variables; `body[class]` out-ranks
 * that single class). The <style> is emitted server-side, so there's no font
 * flash, and it unmounts with this layout, so marketing/login keep Geist.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`body[class]{--font-sans:var(--font-urbanist);--font-heading:var(--font-urbanist);}`}</style>
      {children}
    </>
  );
}
