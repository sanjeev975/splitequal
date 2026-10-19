// EDIT THIS FILE: replace every [bracketed] value, then have a lawyer review the Privacy Policy and Terms. Both pages read from here.
export const LEGAL = {
  operator: "[Your name or company name]",
  address: "[Your address, city, country]",
  email: "[support@yourdomain.com]",
  grievance: "[Grievance Officer: name and email]",
  jurisdiction: "[City], India",
  dataRegion: "[confirm: India (Mumbai)]",
  emailProvider: "[your email provider, e.g. Resend]",
  backupDays: "[30]",
  updated: "19 October 2026",
};
export const hasPlaceholders = () => Object.values(LEGAL).some((v) => v.includes("["));
