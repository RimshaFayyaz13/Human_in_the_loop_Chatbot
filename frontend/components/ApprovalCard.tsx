"use client";
import { useState } from "react";
import type { PendingApproval } from "@/lib/api";

interface Props {
  pending: PendingApproval;
  onDecide: (decision: "approve" | "reject", feedback?: string) => void;
  loading: boolean;
}

export default function ApprovalCard({ pending, onDecide, loading }: Props) {
  const [feedback, setFeedback] = useState("");
  return (
    <div className="border border-amber-500/50 bg-amber-500/10 rounded-xl p-4 my-3">
      <div className="text-amber-300 font-semibold mb-1">
        🛑 Approval required
      </div>
      <div className="text-sm mb-2">{pending.description}</div>
      <pre className="text-xs bg-black/40 rounded p-2 overflow-auto mb-2">
{JSON.stringify(pending.tool_args, null, 2)}
      </pre>
      <input
        className="w-full text-sm rounded bg-slate-900 border border-slate-700 px-2 py-1 mb-2"
        placeholder="Optional reason if rejecting..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={() => onDecide("approve")}
          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-sm disabled:opacity-50"
        >
          ✅ Approve
        </button>
        <button
          disabled={loading}
          onClick={() => onDecide("reject", feedback)}
          className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-sm disabled:opacity-50"
        >
          ❌ Reject
        </button>
      </div>
    </div>
  );
}