import React, { useState } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Show user message immediately
    const newMessages: Message[] = [
      ...messages,
      { role: "user", text: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json(); // { reply: string }
      const assistantReply = (data.reply ?? "").toString();

      setMessages([
        ...newMessages,
        { role: "assistant", text: assistantReply },
      ]);
    } catch (err: any) {
      console.error(err);
      setError("Sorry, something went wrong talking to the assistant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        maxWidth: 480,
        height: 400,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0 }}>HSSE Assistant</h3>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 0",
          marginBottom: 8,
          borderTop: "1px solid #eee",
          borderBottom: "1px solid #eee",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#888" }}>
            Ask anything about incidents, audits, near misses, or HSSE
            procedures…
          </p>
        )}

        {messages.map((m, index) => (
          <div
            key={index}
            style={{
              marginBottom: 8,
              textAlign: m.role === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: 12,
                background:
                  m.role === "user" ? "#2563eb" : "rgba(15,118,110,0.08)",
                color: m.role === "user" ? "#fff" : "#111",
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 4, fontSize: 12 }}>
          {error}
        </div>
      )}

      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          style={{
            flex: 1,
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            background: loading ? "#9ca3af" : "#059669",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
};

export default ChatAssistant;
