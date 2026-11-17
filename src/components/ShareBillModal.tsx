"use client";
import { useRef, useEffect } from "react";
import { PaperBill } from "./PaperBill";

export function ShareBillModal({
  expense,
  groupName,
  members = [],
  onClose
}: {
  expense: any;
  groupName: string;
  members?: { user_id: string; name: string }[];
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  const getMemberName = (userId: string) => members.find((m) => m.user_id === userId)?.name ?? "Former member";

  return (
    <dialog ref={dialog} className="modal" onClose={onClose}>
      <div className="modal-box">
        <button onClick={onClose} className="btn btn-ghost absolute right-2 top-2">✕</button>
        <h3 className="font-bold text-lg mb-4">Share Bill</h3>
        <PaperBill
          groupName={groupName}
          title={expense.title}
          amountMinor={Number(expense.amount_minor)}
          currency={expense.currency}
          payments={expense.expense_payments ?? []}
          splits={expense.expense_splits ?? []}
          getMemberName={getMemberName}
          status="PENDING"
          onShare={async (dataUrl) => {
            try {
              const res = await fetch(dataUrl);
              const blob = await res.blob();
              const file = new File([blob], `bill-${expense.title.toLowerCase().replace(/\s+/g, "-")}.png`, { type: "image/png" });

              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: `SplitLoL Bill: ${expense.title}`,
                  text: `Bhai pesa hi pesa! 💸😂❤️ Settle up on SplitLoL.`,
                  files: [file],
                });
                onClose();
                return;
              }
            } catch (err) {
              console.log("Web share failed or unsupported, fallback to download", err);
            }

            // Fallback
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `bill-${expense.id}.png`;
            link.click();
            onClose();
          }}
        />
      </div>
    </dialog>
  );
}
