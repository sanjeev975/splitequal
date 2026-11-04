export const fmt = (minor: number, cur: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(minor / 100); // display only
