"use client";
import { useRef } from "react";
import { toPng } from "html-to-image";
import { fmt } from "@/lib/format";

export function PaperBill({
  groupName,
  title,
  amountMinor,
  currency,
  payments,
  splits,
  getMemberName,
  status = "PENDING",
  onShare
}: {
  groupName: string;
  title: string;
  amountMinor: number;
  currency: string;
  payments: { user_id: string; amount_minor: number }[];
  splits: { user_id: string; amount_minor: number }[];
  getMemberName: (userId: string) => string;
  status?: "PENDING" | "SETTLED";
  onShare: (dataUrl: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!ref.current) return;
    // Increased scale for better resolution on high-DPI phone screens
    const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
    onShare(dataUrl);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={ref}
        className="w-[360px] bg-white p-8 relative shadow-2xl font-sans text-gray-900 border border-gray-200"
      >
        {/* Receipt Header */}
        <div className="text-center mb-6">
          <div className="text-2xl font-extrabold text-indigo-600 tracking-tighter">SplitLoL</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{groupName}</div>
        </div>

        {/* Title */}
        <div className="text-center mb-6 border-b border-gray-200 pb-4">
          <p className="text-xl font-bold text-gray-800">{title}</p>
        </div>

        {/* Breakdown */}
        <div className="space-y-6 text-sm">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">Paid By</p>
            {payments.map((p, idx) => (
              <div key={idx} className="flex justify-between py-1">
                <span className="font-medium text-gray-700">{getMemberName(p.user_id)}</span>
                <span className="font-bold">{fmt(Number(p.amount_minor), currency)}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">Split / Owes</p>
            {splits.map((s, idx) => (
              <div key={idx} className="flex justify-between py-1">
                <span className="font-medium text-gray-700">{getMemberName(s.user_id)}</span>
                <span className="font-bold">{fmt(Number(s.amount_minor), currency)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="mt-8 pt-4 border-t-2 border-gray-900 flex justify-between items-center">
          <span className="font-black text-lg">TOTAL</span>
          <span className="text-2xl font-black">{fmt(amountMinor, currency)}</span>
        </div>

        {/* Status Stamp */}
        <div className="mt-8 flex justify-center">
          <div className={`px-6 py-1.5 border-4 border-double font-black text-lg uppercase tracking-widest transform -rotate-3 ${status === "SETTLED" ? "border-green-600 text-green-600" : "border-red-600 text-red-600"}`}>
            {status}
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] text-center text-gray-400 mt-10 uppercase tracking-widest">
          {new Date().toLocaleDateString()} · Settle up on SplitLoL
        </div>
      </div>

      <button onClick={handleShare} className="btn btn-lime w-[320px]">Share Receipt</button>
    </div>
  );
}
