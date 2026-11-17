"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("feature");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const { data: { user } } = await supabaseBrowser().auth.getUser();
    if (!user) { setStatus("error"); return; }
    const { error } = await supabaseBrowser().from("feedback").insert({ message, category, user_id: user.id });
    if (error) {
      console.error(error);
      setStatus("error");
    } else {
      setMessage("");
      setStatus("success");
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 max-w-md mt-6">
      <h2 className="h-card">Send feedback</h2>
      <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="feature">Feature Request</option>
        <option value="bug">Report a Bug</option>
        <option value="service">Service/General</option>
        <option value="other">Other</option>
      </select>
      <textarea
        className="field"
        rows={4}
        placeholder="How can we improve SplitLoL?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        minLength={10}
      />
      <button className="btn" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : "Submit feedback"}
      </button>
      {status === "success" && <p className="text-sm text-good">Feedback submitted. Thank you!</p>}
      {status === "error" && <p className="text-sm text-danger">Failed to send feedback. Please try again.</p>}
    </form>
  );
}
