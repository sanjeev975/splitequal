// EDIT THIS FILE: replace every [bracketed] value, then have a lawyer review the Privacy Policy and Terms. Both pages read from here.
export const LEGAL = {
  operator: "Splitequal",
  email: "support@splitequal.com",
  dataRegion: "India (Mumbai)",
  emailProvider: "Resend",
  backupDays: "30",
  updated: "19 October 2026",
};

export const hasPlaceholders = () => Object.values(LEGAL).some((v) => typeof v === "string" && v.includes("["));
