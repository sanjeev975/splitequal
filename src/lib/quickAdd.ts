export const PERSONAL = "__personal"; // the "Personal (just me)" choice
export const NEW_GROUP = "__new";     // the "+ Create a new group" choice
type G = { id: string; type: string };
/** Which "Add to" choice to start on: an explicit one (?g=), else the last one used, else your first shared group, else Personal. */
export function defaultSelection({ initial, last, groups }: { initial?: string | null; last?: string | null; groups: G[] }): string {
  const personal = groups.find((g) => g.type === "Personal"); const shared = groups.filter((g) => g.type !== "Personal");
  const valid = (id?: string | null): string | null => { if (!id) return null; if (id === PERSONAL || (personal && id === personal.id)) return PERSONAL; return shared.some((g) => g.id === id) ? id : null; };
  return valid(initial) ?? valid(last) ?? shared[0]?.id ?? PERSONAL;
}
