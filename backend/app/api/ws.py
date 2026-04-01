from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

router = APIRouter()

class ConnectionManager:
    """Acts as the traffic cop, keeping track of who is in which room."""
    def __init__(self):
        # A dictionary mapping room IDs to a list of connected users
        # Format: {"board_123": [user1_socket, user2_socket]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, board_id: str):
        """Called when a user opens the board."""
        await websocket.accept() # Open the connection
        
        # If the room doesn't exist yet, create it
        if board_id not in self.active_connections:
            self.active_connections[board_id] = []
            
        # Add the user to the room
        self.active_connections[board_id].append(websocket)

    def disconnect(self, websocket: WebSocket, board_id: str):
        """Called when a user closes their browser tab."""
        if board_id in self.active_connections:
            self.active_connections[board_id].remove(websocket)
            
            # If the room is empty, delete it from memory to save RAM
            if not self.active_connections[board_id]:
                del self.active_connections[board_id]

    async def broadcast(self, message: str, board_id: str, sender: WebSocket):
        """Sends a message to everyone in the room EXCEPT the person who drew it."""
        if board_id in self.active_connections:
            for connection in self.active_connections[board_id]:
                if connection != sender:
                    await connection.send_text(message)

# Create one single manager to handle all rooms
manager = ConnectionManager()

@router.websocket("/ws/{board_id}")
async def websocket_endpoint(websocket: WebSocket, board_id: str):
    """The actual URL the frontend WebSocket connects to."""
    await manager.connect(websocket, board_id)
    try:
        # Keep the connection open forever, listening for messages
        while True:
            # 1. Wait for the user to draw something
            data = await websocket.receive_text()
            
            # 2. Tell everyone else in the room what they drew
            await manager.broadcast(data, board_id, sender=websocket)
            
    except WebSocketDisconnect:
        # 3. Clean up if they leave
        manager.disconnect(websocket, board_id)
