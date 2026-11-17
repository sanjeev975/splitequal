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
        // Fallback for browsers that don't support file sharing
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
        amount={1250}
        currency="₹"
        status="PENDING"
        onShare={share}
      />
    </div>
  );
}
