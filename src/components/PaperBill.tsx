"use client";
import { useRef } from "react";
import { toPng } from "html-to-image";

export function PaperBill({
  groupName,
  title,
  amount,
  currency,
  status,
  onShare
}: {
  groupName: string;
  title: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SETTLED";
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
        className="w-[320px] bg-[#fefdfa] p-6 relative shadow-lg font-mono border-x-4 border-dashed border-[#e5e7eb]"
        style={{ backgroundImage: "linear-gradient(180deg, transparent 50%, #e5e7eb 50%)", backgroundSize: "100% 10px" }}
      >
        {/* Torn Top Edge */}
        <div className="absolute -top-2 left-0 right-0 h-4 bg-[#fefdfa]" style={{ clipPath: "polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)" }}></div>

        <div className="text-center mb-6">
          <div className="font-display font-bold text-xl text-primary">SplitLoL</div>
          <div className="text-sm text-muted">{groupName}</div>
        </div>

        <div className="border-b border-dashed border-gray-300 py-4 mb-4 text-center">
          <p className="text-lg font-bold">{title}</p>
          <p className="text-3xl font-bold mt-2">{currency} {amount.toLocaleString()}</p>
        </div>

        <div className="text-center py-4">
          <p className="italic text-gray-600">"Bhai pesa hi pesa! 💸😂❤️"</p>
        </div>

        <div className="text-center mt-6">
          <div className={`inline-block px-4 py-1 border-2 font-bold transform -rotate-6 ${status === "SETTLED" ? "border-green-600 text-green-600" : "border-red-600 text-red-600"}`}>
            {status}
          </div>
        </div>

        <div className="text-[10px] text-center text-gray-400 mt-8">
          {new Date().toLocaleDateString()} · Settle up on SplitLoL
        </div>

        {/* Torn Bottom Edge */}
        <div className="absolute -bottom-2 left-0 right-0 h-4 bg-[#fefdfa]" style={{ clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)" }}></div>
      </div>

      <button onClick={handleShare} className="btn btn-lime">Share Receipt</button>
    </div>
  );
}
