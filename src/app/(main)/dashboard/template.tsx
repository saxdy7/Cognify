/**
 * Route transition: a template re-mounts on every navigation, so each page
 * fades up out of a soft blur (the "focus pull" both references use).
 * Pure CSS (see `.page-enter` in globals.css) so no `filter`/`transform`
 * is left on the element afterwards — fixed children and the canvas are safe.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter flex min-h-0 flex-1 flex-col">{children}</div>;
}
