import { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaPhone, FaVolumeUp } from "react-icons/fa";

const mockUsers = [
  { id: 1, name: "Alice", speaking: true, micOn: true },
  { id: 2, name: "Bob", speaking: false, micOn: true },
  { id: 3, name: "Charlie", speaking: false, micOn: false },
];

export default function VoiceBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [inVoice, setInVoice] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragData = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    setPosition({
      x: window.innerWidth - 340,
      y: window.innerHeight - 520
    });
  }, []);

  const handleMouseDown = (e) => {
    dragData.current.isDragging = true;
    dragData.current.offsetX = e.clientX - position.x;
    dragData.current.offsetY = e.clientY - position.y;
  };
  const handleMouseMove = (e) => {
    if (!dragData.current.isDragging) return;
    setPosition({ x: e.clientX - dragData.current.offsetX, y: e.clientY - dragData.current.offsetY });
  };
  const handleMouseUp = () => { dragData.current.isDragging = false; };
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const iconSize = 22;
  const iconColor = "#1E88E5";

  return (
    <>
      {!isOpen && (
        <button className="voice-toggle" onClick={() => setIsOpen(true)}>
          <FaVolumeUp color="#FFFFFF" size={28} />
        </button>
      )}

      {isOpen && (
        <div className="voice-box" style={{ left: position.x, top: position.y }}>
          <div className="voice-header" onMouseDown={handleMouseDown}>
            Voice Chat
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="voice-body">
            {!inVoice ? (
              <button className="join-btn" onClick={() => setInVoice(true)}>Join Voice Chat</button>
            ) : (
              <div className="voice-users">
                {mockUsers.map((user) => (
                  <div key={user.id} className="voice-user">
                    <span className="user-name">{user.name}</span>
                    <span className="user-mic" style={{ position: "relative" }}>
                      <FaMicrophone
                        color={user.micOn ? (user.speaking ? "#4CAF50" : "#000") : "#000"}
                        size={iconSize}
                      />
                      {!user.micOn && (
                        <svg
                          style={{ position: "absolute", top: 0, left: 0 }}
                          width={iconSize} height={iconSize}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#000"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <line x1="5" y1="5" x2="19" y2="19" stroke="#000"strokeWidth="2" />
                        </svg>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {inVoice && (
            <div className="voice-footer">
              <button className="mic-btn" onClick={() => setMicOn(!micOn)} style={{ position: "relative", padding: 0 }}>
                <FaMicrophone color={iconColor} size={iconSize} />
                {!micOn && (
                  <svg
                    style={{ position: "absolute", top: 0, left: 0 }}
                    width={iconSize} height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={iconColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="5" y1="5" x2="19" y2="19" stroke={iconColor} strokeWidth="2" />
                  </svg>
                )}
              </button>

               {/* Headphones button kiểu Discord */}
              <button onClick={() => setAudioOn(!audioOn)} style={{ border: "none", cursor: "pointer", fontSize: "20px", color: "#1E88E5", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C6.477 1 2 5.477 2 11v6a2 2 0 0 0 2 2h1v-8H4v-1c0-4.418 3.582-8 8-8s8 3.582 8 8v1h-1v8h1a2 2 0 0 0 2-2v-6c0-5.523-4.477-10-10-10z"/>
                  {!audioOn && <line x1="2" y1="2" x2="22" y2="22" stroke="#1E88E5" strokeWidth="2"/>}
                </svg>
              </button>
              <button className="leave-btn" onClick={() => setInVoice(false)}>
                Leave <FaPhone />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}