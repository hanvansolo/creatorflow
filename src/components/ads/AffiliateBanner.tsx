/**
 * CJ Affiliate banner placement.
 *
 * Handles the two awkward-sized creatives (359×240 and 640×300) without
 * letting them look like Geocities 2003:
 *  - Centered inside a framed container that matches the site dark theme.
 *  - "Sponsored" label above for Google AdSense compliance (ads must be
 *    clearly labelled) + required rel="sponsored nofollow noopener".
 *  - Banner scales down fluidly on narrow viewports while preserving
 *    aspect ratio (max-width: 100% + height: auto).
 *  - Opens in a new tab, target="_top" so it breaks out of any iframes.
 */

type BannerVariant = 'medium' | 'wide';

const BANNERS: Record<BannerVariant, {
  clickUrl: string;
  imageUrl: string;
  width: number;
  height: number;
}> = {
  medium: {
    clickUrl: 'https://www.anrdoezrs.net/click-101732240-17133749',
    imageUrl: 'https://www.tqlkg.com/image-101732240-17133749',
    width: 359,
    height: 240,
  },
  wide: {
    clickUrl: 'https://www.anrdoezrs.net/click-101732240-17141188',
    imageUrl: 'https://www.awltovhc.com/image-101732240-17141188',
    width: 640,
    height: 300,
  },
};

interface Props {
  variant: BannerVariant;
  className?: string;
}

export function AffiliateBanner({ variant, className = '' }: Props) {
  const b = BANNERS[variant];
  return (
    <div className={`my-6 ${className}`}>
      <div
        className="mx-auto rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 shadow-sm"
        style={{ maxWidth: `${b.width + 24}px` }} /* native width + padding */
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Sponsored
          </span>
        </div>
        <a
          href={b.clickUrl}
          target="_blank"
          rel="sponsored nofollow noopener"
          className="block overflow-hidden rounded-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.imageUrl}
            width={b.width}
            height={b.height}
            alt="Sponsored partner"
            loading="lazy"
            className="block h-auto w-full object-cover"
            style={{ aspectRatio: `${b.width} / ${b.height}` }}
          />
        </a>
      </div>
    </div>
  );
}

/**
 * Rotates between the two banners based on a deterministic seed so two
 * placements on the same page don't show the same creative. Pass the
 * page slug / match id as `seed`.
 */
export function AffiliateBannerRotator({ seed, className }: { seed?: string; className?: string }) {
  const hash = (seed || String(Math.floor(Date.now() / 3600_000))) // bucket by hour otherwise
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const variant: BannerVariant = hash % 2 === 0 ? 'wide' : 'medium';
  return <AffiliateBanner variant={variant} className={className} />;
}
