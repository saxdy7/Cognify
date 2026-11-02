/**
 * Swaps the UI face to Urbanist for the page it is rendered in (marketing and
 * auth screens, same as the dashboard). Emitted server-side so there is no font
 * flash; `body[class]` out-ranks the single next/font variable class on <body>,
 * and the <style> unmounts with the layout so other routes keep their fonts.
 */
export function UrbanistScope() {
  return <style>{`body[class]{--font-sans:var(--font-urbanist);--font-heading:var(--font-urbanist);}`}</style>;
}
