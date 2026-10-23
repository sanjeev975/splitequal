export function Logo({ size = 28 }: { size?: number }) {
  return (<span className="inline-flex items-center gap-2 font-display text-xl font-bold text-fg">
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="9" className="fill-primary" />
      <rect x="6" y="9" width="20" height="5" rx="2.5" className="fill-on" /><rect x="6" y="18" width="20" height="5" rx="2.5" className="fill-on" opacity=".7" />
      <rect x="6" y="15.2" width="20" height="1.6" className="fill-on" opacity=".5" /></svg>Splitequal</span>);
}
