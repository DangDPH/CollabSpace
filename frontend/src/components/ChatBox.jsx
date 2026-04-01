import { useState, useRef, useEffect } from "react";

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [position, setPosition] = useState({ x: 0, y: 0 });

  const dragData = useRef({
    isDragging: false,
    offsetX: 0,
    offsetY: 0
  });

  useEffect(() => {
    setPosition({
      x: window.innerWidth - 340,
      y: window.innerHeight - 420
    });
  }, []);

  const endRef = useRef(null);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: input,
      user: "me",
      time: formatTime()
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // drag
  const handleMouseDown = (e) => {
    dragData.current.isDragging = true;
    dragData.current.offsetX = e.clientX - position.x;
    dragData.current.offsetY = e.clientY - position.y;
  };

  const handleMouseMove = (e) => {
    if (!dragData.current.isDragging) return;

    setPosition({
      x: e.clientX - dragData.current.offsetX,
      y: e.clientY - dragData.current.offsetY
    });
  };

  const handleMouseUp = () => {
    dragData.current.isDragging = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
            <path d="M9.036 15.804l-.396 5.592c.567 0 .813-.243 1.11-.534l2.664-2.55 5.52 4.038c1.011.558 1.728.264 1.998-.936l3.624-16.98c.324-1.512-.546-2.106-1.53-1.74L1.86 9.402c-1.47.576-1.446 1.392-.252 1.764l5.46 1.704L19.92 6.24c.612-.396 1.17-.177.714.219" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div
          className="chat-box"
          style={{
            left: position.x,
            top: position.y
          }}
        >
          <div className="chat-header" onMouseDown={handleMouseDown}>
            Chat
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="chat-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg ${msg.user}`}>
                <div className="msg-text">{msg.text}</div>
                <div className="msg-time">{msg.time}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* 💬 INPUT KIỂU MESSENGER */}
          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Aa"
            />

            <button className="send-btn" onClick={sendMessage}>
              <svg width="22" height="22" fill="#229ed9" viewBox="0 0 24 24">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}