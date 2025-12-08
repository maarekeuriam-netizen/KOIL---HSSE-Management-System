// src/components/HSSEAssistant.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Loader2,
  Shield,
  Trash2,
  Sparkles,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  meta?: {
    type?: "ai" | "action";
  };
}

const quickPrompts = [
  "Show me all open incidents and near misses.",
  "Summarize this month’s HSSE performance.",
  "Draft an email to report a near miss to my supervisor.",
  "What training records are expiring soon?",
];

const createId = () => Math.random().toString(36).slice(2);

export const HSSEAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content:
        "Mauri! I am your KOIL HSSE Assistant. You can ask about incidents, near misses, audits, training, or ask me to help draft emails and reports.",
      meta: { type: "ai" },
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearChat = () => {
    setMessages([
      {
        id: createId(),
        role: "assistant",
        content:
          "I have cleared our previous conversation. How can I assist you with HSSE now?",
        meta: { type: "ai" },
      },
    ]);
  };

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  // --- Local HSSE actions (“execute requests”) -----------------------------
  const handleLocalAction = async (text: string): Promise<boolean> => {
    const lower = text.toLowerCase().trim();

    // 1) Show open incidents & near misses
    if (
      lower.includes("open incidents") ||
      lower.startsWith("/open-incidents")
    ) {
      setIsLoading(true);
      try {
        const [{ data: incidentRows }, { data: nearMissRows }] =
          await Promise.all([
            supabase
              .from("incidents") // <-- adjust table name if different
              .select("id, title, status")
              .in("status", ["open", "in_progress", "in progress"]),
            supabase
              .from("near_misses") // <-- adjust table name if different
              .select("id, title, status")
              .in("status", ["open", "in_progress", "in progress"]),
          ]);

        const incidentCount = incidentRows?.length ?? 0;
        const nearMissCount = nearMissRows?.length ?? 0;

        let summary = `Here is a quick summary of open items:\n\n`;
        summary += `• Open / in-progress incidents: ${incidentCount}\n`;
        summary += `• Open / in-progress near misses: ${nearMissCount}\n`;

        if (incidentCount > 0) {
          summary += `\nIncidents:\n`;
          summary += (incidentRows || [])
            .slice(0, 5)
            .map(
              (i: any) =>
                `- #${i.id}: ${i.title ?? "No title"} (${i.status ?? "status?"})`
            )
            .join("\n");
          if (incidentCount > 5) {
            summary += `\n...and ${incidentCount - 5} more.`;
          }
        }

        if (nearMissCount > 0) {
          summary += `\n\nNear Misses:\n`;
          summary += (nearMissRows || [])
            .slice(0, 5)
            .map(
              (i: any) =>
                `- #${i.id}: ${i.title ?? "No title"} (${i.status ?? "status?"})`
            )
            .join("\n");
          if (nearMissCount > 5) {
            summary += `\n...and ${nearMissCount - 5} more.`;
          }
        }

        appendMessage({
          id: createId(),
          role: "assistant",
          content: summary,
          meta: { type: "action" },
        });
      } catch (error) {
        console.error(error);
        appendMessage({
          id: createId(),
          role: "assistant",
          content:
            "I tried to load open incidents and near misses from Supabase but something went wrong. Please check the console or your Supabase tables.",
          meta: { type: "action" },
        });
      } finally {
        setIsLoading(false);
      }
      return true;
    }

    // 2) HSSE performance this month
    if (
      lower.includes("this month") &&
      (lower.includes("hsse performance") || lower.includes("summary"))
    ) {
      setIsLoading(true);
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const toIso = (d: Date) => d.toISOString();

        const [{ data: incidents }, { data: nearMisses }, { data: audits }] =
          await Promise.all([
            supabase
              .from("incidents") // <-- adjust if needed
              .select("id")
              .gte("created_at", toIso(startOfMonth)),
            supabase
              .from("near_misses") // <-- adjust if needed
              .select("id")
              .gte("created_at", toIso(startOfMonth)),
            supabase
              .from("audits") // <-- adjust if needed
              .select("id")
              .gte("created_at", toIso(startOfMonth)),
          ]);

        const summary = [
          "Here is a quick HSSE performance snapshot for this month:",
          "",
          `• Incidents recorded: ${incidents?.length ?? 0}`,
          `• Near misses recorded: ${nearMisses?.length ?? 0}`,
          `• Audits conducted: ${audits?.length ?? 0}`,
          "",
          "You can ask me to help write a short HSSE summary report for the Board or Management.",
        ].join("\n");

        appendMessage({
          id: createId(),
          role: "assistant",
          content: summary,
          meta: { type: "action" },
        });
      } catch (error) {
        console.error(error);
        appendMessage({
          id: createId(),
          role: "assistant",
          content:
            "I could not load this month’s HSSE numbers from Supabase. Please check the console or your database columns (created_at).",
          meta: { type: "action" },
        });
      } finally {
        setIsLoading(false);
      }
      return true;
    }

    // 3) Training expiring soon
    if (
      lower.includes("training") &&
      (lower.includes("expiring soon") || lower.includes("expire soon"))
    ) {
      setIsLoading(true);
      try {
        const now = new Date();
        const in30 = new Date();
        in30.setDate(now.getDate() + 30);

        const [{ data: trainings }] = await Promise.all([
          supabase
            .from("training_records") // <-- adjust table name if needed
            .select("id, staff_name, course_name, valid_until")
            .gte("valid_until", now.toISOString())
            .lte("valid_until", in30.toISOString()),
        ]);

        const count = trainings?.length ?? 0;
        let summary = `Training records expiring in the next 30 days: ${count}.`;

        if (count > 0) {
          summary += "\n\nDetails (showing up to 10):\n";
          summary += (trainings || [])
            .slice(0, 10)
            .map((t: any) => {
              const date = t.valid_until
                ? new Date(t.valid_until).toLocaleDateString()
                : "no date";
              return `- ${t.staff_name ?? "Staff"} – ${
                t.course_name ?? "Course"
              } (expires ${date})`;
            })
            .join("\n");
        }

        appendMessage({
          id: createId(),
          role: "assistant",
          content: summary,
          meta: { type: "action" },
        });
      } catch (error) {
        console.error(error);
        appendMessage({
          id: createId(),
          role: "assistant",
          content:
            "I tried to look up training that will expire soon but something failed. Please confirm your training_records table and valid_until column.",
          meta: { type: "action" },
        });
      } finally {
        setIsLoading(false);
      }
      return true;
    }

    return false;
  };

  // --- OpenAI chat via /api/chat -------------------------------------------
  const sendToAssistant = async (text: string) => {
    setIsLoading(true);
    try {
      const payload = {
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content }))
          .concat({ role: "user" as const, content: text }),
        context:
          "You are an HSSE assistant for Kiribati Oil Company (KOIL). You help with incidents, near misses, audits, training, emails, and reports. Keep answers concise and practical.",
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      const assistantContent =
        data.reply ||
        data.message?.content ||
        data.content ||
        (Array.isArray(data.messages)
          ? data.messages[data.messages.length - 1]?.content
          : "");

      if (!assistantContent) {
        throw new Error("No content returned from /api/chat");
      }

      appendMessage({
        id: createId(),
        role: "assistant",
        content: assistantContent,
        meta: { type: "ai" },
      });
    } catch (error) {
      console.error(error);
      appendMessage({
        id: createId(),
        role: "assistant",
        content:
          "Sorry, I could not reach the AI service (/api/chat). Please check your Vercel function and OpenAI key.",
        meta: { type: "ai" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };
    appendMessage(userMsg);
    setInput("");

    // Try to execute local HSSE actions first
    const handled = await handleLocalAction(trimmed);
    if (!handled) {
      await sendToAssistant(trimmed);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
            <Shield className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              HSSE AI Assistant
            </p>
            <p className="text-xs text-slate-500">
              Ask about incidents, audits, training or drafting emails.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {messages.map((m) => {
          const isUser = m.role === "user";
          const isAction = m.meta?.type === "action";

          return (
            <div
              key={m.id}
              className={`flex ${
                isUser ? "justify-end" : "justify-start"
              } text-sm`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : isAction
                    ? "bg-sky-50 text-slate-900 border border-sky-100 rounded-bl-sm"
                    : "bg-slate-100 text-slate-900 rounded-bl-sm"
                }`}
              >
                {m.meta?.type === "action" && (
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-sky-600">
                    <Zap className="h-3 w-3" />
                    <span>Executed from Supabase</span>
                  </div>
                )}
                <p className="whitespace-pre-line">{m.content}</p>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <p className="text-xs text-slate-400">
            Start by asking: &quot;Show me all open incidents and near
            misses.&quot;
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="border-t px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-200"
            >
              <Sparkles className="h-3 w-3" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t px-3 py-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            className="flex-1 resize-none rounded-lg border px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Type your HSSE question or request..."
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
