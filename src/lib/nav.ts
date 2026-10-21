/** A tab is active on its own page and on pages below it (/groups is active on /groups/abc), but not on look-alikes (/groupsx). */
export const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");
