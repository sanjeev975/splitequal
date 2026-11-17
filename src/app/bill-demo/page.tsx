"use client";
import { PaperBill } from "@/components/PaperBill";

export default function BillDemo() {
  const share = async (dataUrl: string) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "bill.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "SplitLoL Bill",
          text: "Check out this bill!",
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "bill.png";
        link.click();
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  return (
    <div className="p-8">
      <PaperBill
        groupName="Italy 🇮🇹"
        title="Dinner at Roma"
        amountMinor={125000}
        currency="INR"
        payments={[{ user_id: "u1", amount_minor: 125000 }]}
        splits={[{ user_id: "u1", amount_minor: 62500 }, { user_id: "u2", amount_minor: 62500 }]}
        getMemberName={(id) => id === "u1" ? "Aman" : "Rahul"}
        status="PENDING"
        onShare={share}
      />
    </div>
  );
}
