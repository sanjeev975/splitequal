"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { splitExpense, toMinor, totalWithAdjustments, validatePayments, type Method } from "@/lib/money/split";
import { fmt } from "@/lib/format";
import { uploadReceipt } from "./Receipts";
export const CATEGORIES = ["Rent", "Electricity", "Water", "Internet", "Groceries", "Restaurants", "Transport", "Flights", "Hotels", "Fuel", "Taxi", "Entertainment", "Shopping", "Medical", "Household supplies", "Tickets", "Subscriptions", "Other"];
type M = { user_id: string; name: string };
export type GuestSave = { title: string; amountMinor: number; date: string; category: string; method: string; notes: string | null; payments: { member: string; amount: number }[]; splits: { member: string; amount: number }[] };
export type Edit = { id: string; title: string; amountMinor: number; date: string; category: string; notes: string; payments: { user_id: string; amount: number }[]; splits: Record<string, number> };
const money = (n: number) => `${Math.floor(n / 100)}.${String(n % 100).padStart(2, "0")}`;
export function AddExpense({ groupId, currency, members, me, edit, onDone, onSave }: { groupId: string; currency: string; members: M[]; me: string; edit?: Edit; onDone?: () => void; onSave?: (e: GuestSave) => void }) {
  const r = useRouter(); const sb = supabaseBrowser();
  const [title, setTitle] = useState(edit?.title ?? ""); const [date, setDate] = useState(edit?.date ?? new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(edit?.category ?? "Other"); const [notes, setNotes] = useState(edit?.notes ?? "");
  const [amount, setAmount] = useState(edit ? money(edit.amountMinor) : ""); const [adj, setAdj] = useState({ tax: "", service: "", tip: "", discount: "" });
  const [multi, setMulti] = useState((edit?.payments.length ?? 0) > 1); const [payer, setPayer] = useState(edit?.payments[0]?.user_id ?? me);
  const [payAmts, setPayAmts] = useState<Record<string, string>>(edit ? Object.fromEntries(edit.payments.map((p) => [p.user_id, money(p.amount)])) : {});
  const [method, setMethod] = useState<Method>(edit ? "exact" : "equal");
  const [vals, setVals] = useState<Record<string, string>>(edit ? Object.fromEntries(Object.entries(edit.splits).map(([k, v]) => [k, money(v)])) : {});
  const [sel, setSel] = useState<Record<string, boolean>>(() => Object.fromEntries(members.map((m) => [m.user_id, edit ? m.user_id in edit.splits : true])));
  const [file, setFile] = useState<File | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const opt = (v: string) => (v.trim() ? toMinor(v, currency) : 0);
  function compute() {
    const total = totalWithAdjustments(toMinor(amount, currency), { tax: opt(adj.tax), service: opt(adj.service), tip: opt(adj.tip), discount: opt(adj.discount) });
    const payments = multi ? members.filter((m) => payAmts[m.user_id]?.trim()).map((m) => ({ userId: m.user_id, amount: toMinor(payAmts[m.user_id], currency) })) : [{ userId: payer, amount: total }];
    validatePayments(total, payments);
    const ps = members.filter((m) => sel[m.user_id]).map((m) => { const v = vals[m.user_id] || "0";
      return { id: m.user_id, value: method === "equal" ? undefined : method === "shares" ? parseInt(v, 10) : method === "percent" ? toMinor(v, "INR") : toMinor(v, currency) }; });
    return { total, payments, split: splitExpense(total, method, ps) };
  }
  let calc: ReturnType<typeof compute> | null = null; let calcErr = "";
  if (amount.trim()) { try { calc = compute(); } catch (x) { calcErr = (x as Error).message; } }
  async function go(e: React.FormEvent) {
    e.preventDefault(); setErr(""); if (!calc) return setErr(calcErr || "Enter an amount.");
    if (onSave) { // guest mode: save locally, no network
      onSave({ title: title.trim(), amountMinor: calc.total, date, category, method, notes: notes.trim() || null, payments: calc.payments.map((p) => ({ member: p.userId, amount: p.amount })), splits: Object.entries(calc.split).map(([member, amount]) => ({ member, amount })) });
      setTitle(""); setAmount(""); setNotes(""); setVals({}); setAdj({ tax: "", service: "", tip: "", discount: "" }); onDone?.(); return; }
    setBusy(true);
    const p_payments = calc.payments.map((p) => ({ user_id: p.userId, amount: p.amount })); const p_splits = Object.entries(calc.split).map(([user_id, a]) => ({ user_id, amount: a }));
    const base = { p_title: title.trim(), p_amount: calc.total, p_date: date, p_category: category, p_method: method, p_notes: notes.trim() || null, p_payments, p_splits };
    const { data, error } = edit ? await sb.rpc("update_expense", { p_id: edit.id, ...base }) : await sb.rpc("create_expense", { p_group: groupId, p_currency: currency, ...base });
    if (error) { setBusy(false); return setErr(error.message); }
    if (file && !edit) { try { await uploadReceipt(sb, groupId, data as string, file); } catch (x) { setErr(`Expense saved, but the receipt failed: ${(x as Error).message}`); } }
    setBusy(false); setTitle(""); setAmount(""); setNotes(""); setVals({}); setFile(null); setAdj({ tax: "", service: "", tip: "", discount: "" }); r.refresh(); onDone?.();
  }
  const hint = { equal: "", shares: "shares (whole numbers)", percent: "percent, e.g. 33.33", exact: `amount in ${currency}` }[method]; const nm = (id: string) => members.find((m) => m.user_id === id)?.name ?? "Member";
  return (<form onSubmit={go} className="card space-y-3"><h2 className="font-display text-xl font-bold">{edit ? "Edit expense" : "Add expense"}</h2>
    <div className="grid gap-2 sm:grid-cols-2">
      <input className="field" placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
      <input className="field" type="date" required value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
      <input className="field" inputMode="decimal" placeholder={`Amount (${currency})`} required value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />
      <select className="field" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
    <textarea className="field" rows={2} maxLength={500} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Notes" />
    <details className="inset"><summary className="cursor-pointer font-semibold">Tax, service charge, tip, discount (optional)</summary>
      <div className="grid grid-cols-2 gap-2 mt-2">{(["tax", "service", "tip", "discount"] as const).map((k) => <label key={k} className="text-sm capitalize">{k}<input className="field" inputMode="decimal" value={adj[k]} onChange={(e) => setAdj({ ...adj, [k]: e.target.value })} /></label>)}</div>
      <p className="text-xs mt-1">Tax, service and tip are added on top of the amount above; discount is subtracted. The split uses the final total.</p></details>
    <div className="space-y-2"><label className="text-sm flex items-center gap-2"><input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />Multiple payers</label>
      {!multi ? <label className="text-sm block">Paid by<select className="field" value={payer} onChange={(e) => setPayer(e.target.value)}>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}</select></label>
        : <div className="inset space-y-1">{members.map((m) => <label key={m.user_id} className="flex items-center gap-2 text-sm"><span className="flex-1">{m.name} paid</span><input className="field !w-32" inputMode="decimal" placeholder="0.00" value={payAmts[m.user_id] ?? ""} onChange={(e) => setPayAmts({ ...payAmts, [m.user_id]: e.target.value })} /></label>)}</div>}</div>
    <label className="text-sm block">Split<select className="field" value={method} onChange={(e) => setMethod(e.target.value as Method)}>
      <option value="equal">Equally</option><option value="shares">By shares</option><option value="percent">By percentage</option><option value="exact">Exact amounts</option></select></label>
    <div className="inset space-y-2">{members.map((m) => (<div key={m.user_id} className="flex items-center gap-2"><label className="flex items-center gap-2 flex-1"><input type="checkbox" checked={!!sel[m.user_id]} onChange={(e) => setSel({ ...sel, [m.user_id]: e.target.checked })} />{m.name}</label>
      {method !== "equal" && sel[m.user_id] && <input className="field !w-32" placeholder={hint} aria-label={`${m.name} ${hint}`} value={vals[m.user_id] ?? ""} onChange={(e) => setVals({ ...vals, [m.user_id]: e.target.value })} />}</div>))}</div>
    <div className="receipt" aria-live="polite"><p className="font-bold">Live preview</p>
      {calc ? <><p>Total to split: {fmt(calc.total, currency)}</p>{Object.entries(calc.split).map(([id, a]) => <p key={id}>{nm(id)} owes {fmt(a, currency)}</p>)}
        <p className="text-xs opacity-70 mt-1">Any leftover paise are assigned deterministically so shares add up exactly.</p></> : <p className={calcErr ? "text-danger" : "opacity-70"} role={calcErr ? "alert" : undefined}>{calcErr || "Enter an amount to see the split."}</p>}</div>
    {!edit && !onSave && <label className="text-sm block">Receipt (optional, JPG/PNG/WebP/PDF, max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>}
    {err && <p role="alert" className="text-danger text-sm">{err}</p>}
    <button className="btn btn-coral" disabled={busy || !calc}>{busy ? "Saving…" : edit ? "Save changes" : "Save expense"}</button></form>);
}
