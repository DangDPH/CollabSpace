import { useState } from "react";
import '../../board.css';

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello!", sender: "other" },
    { id: 2, text: "Welcome to the real-time board 👋", sender: "other" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), text: input, sender: "me" }]);
    setInput("");
  };

  return (
    <div className="board-chat-panel">
      {/* Header */}
      <div className="chat-header">
        <span>Team Chat</span>
        <button className="chat-close-btn" onClick={onClose} title="Close Chat">
          &times;
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble-wrap ${
              msg.sender === "me" ? "me" : "other"
            }`}
          >
            <div className={`chat-bubble ${msg.sender === "me" ? "me" : "other"}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type message..."
          className="chat-input"
        />
        <button
          onClick={sendMessage}
          className="toolbar-btn bg-pink"
          style={{ padding: '8px 16px' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}