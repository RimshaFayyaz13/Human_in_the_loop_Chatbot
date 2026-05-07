const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export interface PendingApproval {
  tool_name: string;
  tool_args: Record<string, any>;
  description: string;
}

export interface ChatResponse {
  thread_id: string;
  status: "message" | "awaiting_approval" | "tool_done";
  reply?: string;
  pending?: PendingApproval;
  tool_result?: any;
}

export async function sendMessage(thread_id: string, message: string): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thread_id, message }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function sendApproval(
  thread_id: string,
  decision: "approve" | "reject",
  feedback?: string
): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thread_id, decision, feedback }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}