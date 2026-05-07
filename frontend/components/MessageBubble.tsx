"use client";

interface Props {
  role: "user" | "assistant" | "tool";
  content: string;
}

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap text-sm ${
          isUser
            ? "bg-blue-600 text-white"
            : role === "tool"
            ? "bg-emerald-900/60 text-emerald-100 border border-emerald-700"
            : "bg-slate-800 text-slate-100"
        }`}
      >
        {content}
      </div>
    </div>
  );
}