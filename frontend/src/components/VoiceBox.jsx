import { useState, useRef, useEffect, useCallback } from "react";
import { FaMicrophone, FaPhone, FaVolumeUp } from "react-icons/fa";
import { useSocket } from "../context/SocketContext";

export default function VoiceBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [inVoice, setInVoice] = useState(false);
  const [micOn, setMicOn] = useState(false);    // mic starts OFF
  const [audioOn, setAudioOn] = useState(true);
  const [micAvailable, setMicAvailable] = useState(true); // can we use mic?
  const [voiceUsers, setVoiceUsers] = useState([]);

  const { socket, boardId, userId, username } = useSocket();

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { socketId: RTCPeerConnection }
  const remoteAudiosRef = useRef({});    // { socketId: HTMLAudioElement }
  const socketRef = useRef(socket);      // always-current socket reference
  const inVoiceRef = useRef(false);      // ref mirror for use in callbacks

  // Keep refs in sync so callbacks inside PeerConnection don't go stale
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { inVoiceRef.current = inVoice; }, [inVoice]);

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

  // WebRTC ICE servers
  const iceConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  /**
   * Create a peer connection for a specific remote socket.
   *   - Add local tracks (if we have mic)
   *   - Set up ontrack to receive remote audio
   *   - Set up ICE candidate forwarding
   */
  const createPeerConnection = useCallback((targetSocketId) => {
    // If we already have a connection to this peer, close it first
    if (peerConnectionsRef.current[targetSocketId]) {
      peerConnectionsRef.current[targetSocketId].close();
    }

    const pc = new RTCPeerConnection(iceConfig);

    // Add our local audio tracks (if available)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote audio
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      console.log('[Voice] Received remote track from:', targetSocketId);

      // Clean up old audio element if it exists
      if (remoteAudiosRef.current[targetSocketId]) {
        remoteAudiosRef.current[targetSocketId].pause();
        remoteAudiosRef.current[targetSocketId].srcObject = null;
        try { remoteAudiosRef.current[targetSocketId].remove(); } catch (_) {}
      }

      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.playsInline = true;
      audio.volume = 1.0;

      // Append to DOM — required by some mobile browsers (Safari)
      audio.style.display = 'none';
      document.body.appendChild(audio);

      // Explicit play() — autoplay alone is unreliable, especially on mobile
      audio.play().then(() => {
        console.log('[Voice] Remote audio playing for:', targetSocketId);
      }).catch(err => {
        console.warn('[Voice] Autoplay blocked for', targetSocketId, '- will retry on user gesture:', err.message);
      });

      remoteAudiosRef.current[targetSocketId] = audio;
    };

    // Forward ICE candidates to the target peer via the signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('voice_ice_candidate', {
          board_id: boardId,
          user_id: userId,
          payload: {
            target_socket_id: targetSocketId,
            candidate: event.candidate,
          }
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[Voice] ICE state for ${targetSocketId}:`, pc.iceConnectionState);
      // If the connection failed, try to restart ICE
      if (pc.iceConnectionState === 'failed') {
        console.warn('[Voice] ICE failed for', targetSocketId, '- attempting restart');
        pc.restartIce();
      }
    };

    peerConnectionsRef.current[targetSocketId] = pc;
    return pc;
  }, [boardId, userId]);

  // ─── Socket event handlers for WebRTC signaling ─────────────────
  useEffect(() => {
    if (!socket) return;

    /**
     * Another user joined voice → we send them an offer
     */
    const handleVoiceJoin = async ({ from_socket_id, user_id: joinUserId, username: joinUsername }) => {
      if (from_socket_id === socket.id) return;
      if (!inVoiceRef.current) return; // we're not in voice, ignore

      const peerName = joinUsername || joinUserId;
      console.log('[Voice] Peer joined:', peerName, from_socket_id);

      setVoiceUsers(prev => {
        if (prev.find(u => u.socketId === from_socket_id)) return prev;
        return [...prev, { socketId: from_socket_id, userId: joinUserId, username: peerName, micOn: true }];
      });

      // Create offer and send to the new peer
      const pc = createPeerConnection(from_socket_id);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('voice_offer', {
        board_id: boardId,
        user_id: userId,
        username: username,   // ← send our username so the peer can display it
        payload: {
          target_socket_id: from_socket_id,
          sdp: offer,
        }
      });
    };

    /**
     * Received an offer from another peer → send back an answer
     */
    const handleVoiceOffer = async ({ user_id: offerUserId, username: offerUsername, payload }) => {
      const { from_socket_id, sdp } = payload;
      const peerName = offerUsername || offerUserId;
      console.log('[Voice] Received offer from:', peerName, from_socket_id);

      // Auto-accept: create connection and answer
      const pc = createPeerConnection(from_socket_id);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('voice_answer', {
        board_id: boardId,
        user_id: userId,
        username: username,   // ← send our username
        payload: {
          target_socket_id: from_socket_id,
          sdp: answer,
        }
      });

      // Add this peer to user list if not already there
      setVoiceUsers(prev => {
        if (prev.find(u => u.socketId === from_socket_id)) return prev;
        return [...prev, { socketId: from_socket_id, userId: offerUserId, username: peerName, micOn: true }];
      });
    };

    /**
     * Received an answer to our offer
     */
    const handleVoiceAnswer = async ({ user_id: ansUserId, username: ansUsername, payload }) => {
      const { from_socket_id, sdp } = payload;
      const peerName = ansUsername || ansUserId;
      console.log('[Voice] Received answer from:', peerName, from_socket_id);

      const pc = peerConnectionsRef.current[from_socket_id];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }

      // Update the peer's username if we only had 'Peer' or a UUID before
      setVoiceUsers(prev => prev.map(u =>
        u.socketId === from_socket_id ? { ...u, username: peerName, userId: ansUserId } : u
      ));
    };

    /**
     * ICE candidate exchange
     */
    const handleIceCandidate = async ({ payload }) => {
      const { from_socket_id, candidate } = payload;
      const pc = peerConnectionsRef.current[from_socket_id];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[Voice] Failed to add ICE candidate:', err);
        }
      }
    };

    /**
     * A peer left voice
     */
    const handleVoiceLeave = ({ from_socket_id }) => {
      console.log('[Voice] Peer left:', from_socket_id);
      setVoiceUsers(prev => prev.filter(u => u.socketId !== from_socket_id));

      const pc = peerConnectionsRef.current[from_socket_id];
      if (pc) { pc.close(); delete peerConnectionsRef.current[from_socket_id]; }
      const audio = remoteAudiosRef.current[from_socket_id];
      if (audio) {
        audio.pause();
        audio.srcObject = null;
        try { audio.remove(); } catch (_) {}
        delete remoteAudiosRef.current[from_socket_id];
      }
    };

    /**
     * A peer toggled their mute state → update UI
     */
    const handleToggleMute = ({ from_socket_id, payload }) => {
      const { muted } = payload || {};
      console.log('[Voice] Peer mute toggle:', from_socket_id, 'muted:', muted);
      setVoiceUsers(prev => prev.map(u =>
        u.socketId === from_socket_id ? { ...u, micOn: !muted } : u
      ));
    };

    socket.on('voice_join', handleVoiceJoin);
    socket.on('voice_offer', handleVoiceOffer);
    socket.on('voice_answer', handleVoiceAnswer);
    socket.on('voice_ice_candidate', handleIceCandidate);
    socket.on('voice_leave', handleVoiceLeave);
    socket.on('toggle_mute', handleToggleMute);

    return () => {
      socket.off('voice_join', handleVoiceJoin);
      socket.off('voice_offer', handleVoiceOffer);
      socket.off('voice_answer', handleVoiceAnswer);
      socket.off('voice_ice_candidate', handleIceCandidate);
      socket.off('voice_leave', handleVoiceLeave);
      socket.off('toggle_mute', handleToggleMute);
    };
  }, [socket, boardId, userId, username, createPeerConnection]);

  /**
   * Join the voice channel.
   * Step 1: Try to acquire microphone (optional — can still listen)
   * Step 2: Emit voice_join to tell other peers we're here
   */
  const joinVoice = async () => {
    // Try to get mic — but don't block if it fails
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setMicOn(true);
      setMicAvailable(true);
      console.log('[Voice] Microphone acquired');
    } catch (err) {
      console.warn('[Voice] Microphone not available:', err.message);
      localStreamRef.current = null;
      setMicOn(false);
      setMicAvailable(false);
      // Don't block — user can still listen to others
    }

    setInVoice(true);

    // Tell everyone we joined — include our username
    if (socket) {
      socket.emit('voice_join', { board_id: boardId, user_id: userId, username: username });
    }
  };

  /**
   * Leave the voice channel — clean up all WebRTC resources.
   */
  const leaveVoice = () => {
    // Stop local audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    // Stop and remove all remote audio elements
    Object.values(remoteAudiosRef.current).forEach(audio => {
      audio.pause();
      audio.srcObject = null;
      try { audio.remove(); } catch (_) {}
    });
    remoteAudiosRef.current = {};

    setVoiceUsers([]);
    setInVoice(false);
    setMicOn(false);

    if (socket) {
      socket.emit('voice_leave', { board_id: boardId, user_id: userId });
    }
  };

  /**
   * Toggle microphone on/off.
   * If mic was never acquired (micAvailable=false), try again.
   * Emits toggle_mute to peers so they can update their UI.
   */
  const toggleMic = async () => {
    if (!localStreamRef.current) {
      // Try to acquire mic now
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setMicOn(true);
        setMicAvailable(true);

        // Add tracks to all existing peer connections
        Object.entries(peerConnectionsRef.current).forEach(([socketId, pc]) => {
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
        });

        // Broadcast unmuted state
        if (socket) {
          socket.emit('toggle_mute', {
            board_id: boardId,
            user_id: userId,
            username: username,
            payload: { muted: false },
          });
        }
      } catch (err) {
        console.warn('[Voice] Still cannot access microphone:', err.message);
        setMicAvailable(false);
      }
      return;
    }

    // Toggle existing mic tracks
    const newMicState = !micOn;
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = newMicState;
    });
    setMicOn(newMicState);

    // Broadcast mute state to peers
    if (socket) {
      socket.emit('toggle_mute', {
        board_id: boardId,
        user_id: userId,
        username: username,
        payload: { muted: !newMicState },
      });
    }
  };

  const toggleAudio = () => {
    const newAudioState = !audioOn;
    Object.values(remoteAudiosRef.current).forEach(audio => {
      audio.muted = !newAudioState;
    });
    setAudioOn(newAudioState);
  };

  // Retry playing any blocked audio elements (for mobile autoplay policy)
  const retryPlayback = useCallback(() => {
    Object.entries(remoteAudiosRef.current).forEach(([sid, audio]) => {
      if (audio.paused && audio.srcObject) {
        audio.play().then(() => {
          console.log('[Voice] Resumed playback for:', sid);
        }).catch(() => {});
      }
    });
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

          <div className="voice-body" onClick={retryPlayback}>
            {!inVoice ? (
              <button className="join-btn" onClick={joinVoice}>Join Voice Chat</button>
            ) : (
              <div className="voice-users">
                {/* Show ourselves */}
                <div className="voice-user">
                  <span className="user-name">{username} (You)</span>
                  <span className="user-mic" style={{ position: "relative" }}>
                    <FaMicrophone
                      color={!micAvailable ? "#ccc" : (micOn ? "#4CAF50" : "#000")}
                      size={iconSize}
                    />
                    {(!micOn || !micAvailable) && (
                      <svg
                        style={{ position: "absolute", top: 0, left: 0 }}
                        width={iconSize} height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={!micAvailable ? "#ccc" : "#000"}
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <line x1="5" y1="5" x2="19" y2="19" />
                      </svg>
                    )}
                  </span>
                </div>

                {/* Show "mic unavailable" hint */}
                {!micAvailable && (
                  <div style={{ fontSize: 11, color: '#ef4444', textAlign: 'center', padding: '4px 0' }}>
                    ⚠️ Mic unavailable — use HTTPS to enable
                  </div>
                )}

                {/* Other voice users */}
                {voiceUsers.map((user) => (
                  <div key={user.socketId} className="voice-user">
                    <span className="user-name">{user.username || user.userId}</span>
                    <span className="user-mic" style={{ position: "relative" }}>
                      <FaMicrophone
                        color={user.micOn ? "#4CAF50" : "#999"}
                        size={iconSize}
                      />
                      {!user.micOn && (
                        <svg
                          style={{ position: "absolute", top: 0, left: 0 }}
                          width={iconSize} height={iconSize}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#999"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <line x1="5" y1="5" x2="19" y2="19" />
                        </svg>
                      )}
                    </span>
                  </div>
                ))}

                {voiceUsers.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 8 }}>
                    Waiting for others to join...
                  </div>
                )}
              </div>
            )}
          </div>

          {inVoice && (
            <div className="voice-footer">
              <button className="mic-btn" onClick={toggleMic} style={{ position: "relative", padding: 0 }}>
                <FaMicrophone color={micOn ? iconColor : "#999"} size={iconSize} />
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
                    <line x1="5" y1="5" x2="19" y2="19" />
                  </svg>
                )}
              </button>

              <button onClick={toggleAudio} style={{ border: "none", cursor: "pointer", fontSize: "20px", color: "#1E88E5", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C6.477 1 2 5.477 2 11v6a2 2 0 0 0 2 2h1v-8H4v-1c0-4.418 3.582-8 8-8s8 3.582 8 8v1h-1v8h1a2 2 0 0 0 2-2v-6c0-5.523-4.477-10-10-10z"/>
                  {!audioOn && <line x1="2" y1="2" x2="22" y2="22" stroke="#1E88E5" strokeWidth="2"/>}
                </svg>
              </button>

              <button className="leave-btn" onClick={leaveVoice}>
                Leave <FaPhone />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}