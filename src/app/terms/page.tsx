import { LegalPage, type Section } from "@/components/LegalPage";
import { LEGAL as L } from "@/lib/legal";
export const metadata = { title: "Terms of Service · Splitequal" };
const sections: Section[] = [
  ["Agreement", `These terms are between you and ${L.operator} (“we”) and cover your use of Splitequal. By creating an account or using the app you agree to them and to our Privacy Policy. You must be at least 18 and able to enter a contract.`],
  ["What Splitequal is, and is not", ["Splitequal is a tool for recording shared expenses and working out who owes whom.", "It is not a bank, wallet, payment service or financial adviser. We do not hold, move or verify money.", "Pay links (UPI, Venmo) just open another app. A payment only counts in Splitequal once the person receiving it confirms.", "Suggested repayments are recommendations. Disputes about money are between you and the other people in your group."]],
  ["Your account", "Give accurate information, keep your password secret, and tell us if you suspect misuse. You are responsible for activity under your account. One person per account."],
  ["Groups and other people", ["What you add to a group is visible to its members, and admins can remove members.", "Anyone with a valid invite link can join the group it was made for, so share links carefully and revoke ones you no longer need.", "Only add or upload personal information about others (names, receipts) if you have a good reason and, where needed, their permission."]],
  ["Acceptable use", "Do not use Splitequal for anything unlawful, fraudulent or abusive; to harass others; to upload malicious or illegal content; to attack, overload or scrape the service; or to get around its limits or security."],
  ["Your content", "You keep ownership of what you add. You give us permission to store, process and show it as needed to run the service for you and your groups."],
  ["Accuracy", "We calculate splits in whole paise/cents with documented rounding rules, but you are responsible for checking amounts before you pay or rely on them, and for keeping your own records if you need them."],
  ["Availability and changes", "We work to keep Splitequal running but provide it “as is”, without a promise of uninterrupted or error-free service. We may change or remove features and set fair-use limits."],
  ["Ending your use", "You can delete your account at any time in Profile. We may suspend or close accounts that break these terms or put others at risk. Expenses shared with others may remain in their groups as described in the Privacy Policy."],
  ["Liability", "To the extent the law allows, we are not liable for indirect or consequential losses, lost profits, or losses from payments or disputes between users. Our total liability for any claim is limited to [amount, to be set with your lawyer]. Nothing here limits liability that cannot be limited by law."],
  ["Governing law", `These terms are governed by the laws of India. Courts in ${L.jurisdiction} have jurisdiction, subject to any consumer rights that cannot be waived.`],
  ["Changes and contact", `We may update these terms; the date above shows the latest version and we will give notice of material changes. Questions: ${L.email}.`],
];
export default function Terms() { return <LegalPage title="Terms of Service" sections={sections} />; }
