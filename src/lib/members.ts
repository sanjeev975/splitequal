export type Member = { user_id: string; name: string };
/** Groups membership rows by group, and labels people who share a display name with their @username so they can be told apart. */
export function membersByGroup(rows: any[]): Record<string, Member[]> {
  const raw: Record<string, { user_id: string; dn: string; un: string }[]> = {};
  for (const r of rows ?? []) (raw[r.group_id] ??= []).push({ user_id: r.user_id, dn: r.profiles?.display_name || "Member", un: r.profiles?.username || "" });
  const out: Record<string, Member[]> = {};
  for (const [g, list] of Object.entries(raw)) out[g] = list.map((m) => ({ user_id: m.user_id, name: list.some((o) => o.user_id !== m.user_id && o.dn.trim().toLowerCase() === m.dn.trim().toLowerCase()) ? `${m.dn} (@${m.un})` : m.dn }));
  return out;
}
