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
    const dataUrl = await toPng(ref.current, { cacheBust: true });
    onShare(dataUrl);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={ref}
        className="w-[340px] bg-[#fefdfa] p-6 relative shadow-lg font-mono text-gray-800 border-x-4 border-dashed border-[#e5e7eb]"
        style={{ backgroundImage: "linear-gradient(180deg, transparent 50%, #e5e7eb 50%)", backgroundSize: "100% 10px" }}
      >
        {/* Torn Top Edge */}
        <div className="absolute -top-2 left-0 right-0 h-4 bg-[#fefdfa]" style={{ clipPath: "polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)" }}></div>

        <div className="text-center mb-4">
          <div className="font-display font-bold text-xl text-primary">SplitLoL</div>
          <div className="text-xs text-muted uppercase tracking-wider">{groupName}</div>
        </div>

        <div className="border-b border-dashed border-gray-300 pb-3 mb-3 text-center">
          <p className="text-base font-bold truncate">{title}</p>
          <p className="text-2xl font-bold font-mono mt-1">{fmt(amountMinor, currency)}</p>
        </div>

        {/* Breakdown Section */}
        <div className="space-y-3 text-xs border-b border-dashed border-gray-300 pb-3 mb-3">
          {payments && payments.length > 0 && (
            <div>
              <p className="font-bold text-muted uppercase tracking-wider mb-1">Paid By</p>
              {payments.map((p, idx) => (
                <div key={idx} className="flex justify-between py-0.5">
                  <span className="truncate pr-2">{getMemberName(p.user_id)}</span>
                  <span className="font-mono font-semibold">{fmt(Number(p.amount_minor), currency)}</span>
                </div>
              ))}
            </div>
          )}

          {splits && splits.length > 0 && (
            <div>
              <p className="font-bold text-muted uppercase tracking-wider mb-1">Split / Owes</p>
              {splits.map((s, idx) => (
                <div key={idx} className="flex justify-between py-0.5">
                  <span className="truncate pr-2">{getMemberName(s.user_id)}</span>
                  <span className="font-mono font-semibold">{fmt(Number(s.amount_minor), currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center py-2">
          <p className="italic text-xs text-gray-600">"Bhai pesa hi pesa! 💸😂❤️"</p>
        </div>

        <div className="text-center my-3">
          <div className={`inline-block px-3 py-0.5 border-2 text-xs font-bold transform -rotate-3 ${status === "SETTLED" ? "border-green-600 text-green-600" : "border-red-600 text-red-600"}`}>
            {status}
          </div>
        </div>

        <div className="text-[10px] text-center text-gray-400 mt-4">
          {new Date().toLocaleDateString()} · Settle up on SplitLoL
        </div>

        {/* Torn Bottom Edge */}
        <div className="absolute -bottom-2 left-0 right-0 h-4 bg-[#fefdfa]" style={{ clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)" }}></div>
      </div>

      <button onClick={handleShare} className="btn btn-lime">Share Receipt</button>
    </div>
  );
}
