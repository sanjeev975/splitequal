export function Logo({ size = 32 }: { size?: number }) {
  return (<span className="inline-flex items-center gap-2 font-display font-bold text-navy text-xl">
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="9" fill="#14213d"/>
      <rect x="6" y="9" width="20" height="5" rx="2.5" fill="#f0734a"/><rect x="6" y="18" width="20" height="5" rx="2.5" fill="#b8a9f0"/>
      <rect x="6" y="14" width="20" height="1.6" fill="#fbf6ea"/></svg>Splitequal</span>);
}
