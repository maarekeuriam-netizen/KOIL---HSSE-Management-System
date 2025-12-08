import { useState } from "react";

export default function ChatAssistant() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setReply(data.reply || "No response received.");
    } catch (err) {
      setReply("Error contacting HSSE Assistant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h3>🤖 HSSE Assistant</h3>

      <textarea
        rows={3}
        placeholder="Ask about incidents, near misses, risks..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <button onClick={sendMessage} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>

      {reply && (
        <div style={{ marginTop: 12, background: "#f9f9f9", padding: 10 }}>
          <strong>Assistant:</strong>
          <p>{reply}</p>
        </div>
      )}
    </div>
  );
}
