import Link from "next/link";
// Shown inside the app (you are still signed in) when a group can't be opened: you left, were removed, or it was deleted. We can't tell which, and shouldn't.
export default function GroupUnavailable() {
  return (<div className="card mx-auto max-w-md space-y-3 text-center"><h1 className="font-display text-2xl font-bold">This group isn't available</h1>
    <p className="text-muted">You may have left it or been removed, or it may have been deleted. Your account and your other groups are fine.</p>
    <div className="flex flex-wrap justify-center gap-2"><Link className="btn" href="/groups">My groups</Link><Link className="btn bg-inset text-fg" href="/notifications">Notifications</Link></div></div>);
}
