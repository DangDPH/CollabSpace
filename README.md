# 🚀 CollabSpace

**CollabSpace** is a premium, real-time collaborative platform designed for teams to brainstorm, document, and communicate seamlessly. It integrates a powerful whiteboard, a rich-text editor, and real-time voice and chat communication into a single unified workspace.

---

## ✨ Key Features

- **Unified Dashboard**: A clean and modern center to manage, create, and search through all your collaborative boards.
- **Interactive Whiteboard**: A high-performance drawing canvas (powered by Konva) with shapes, freehand drawing, and real-time state synchronization.
- **Rich Document Editor**: A real-time collaborative text editor (powered by Quill) for shared notes and documentation.
- **Real-Time Voice & Chat**: Integrated WebRTC voice communication and instant messaging to keep teams connected while they work.
- **Smart User Management**: Personalized profiles with consistent avatars and secure authentication.
- **Responsive Design**: Optimized for both large monitors and smaller laptop screens with a standardized, premium UI.

---

## 📋 System Requirements (Prerequisites)

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **Python**: v3.10.0 or higher
- **Docker & Docker Compose**: Required for running the MongoDB and MySQL databases.
- **Git**: For version control and cloning the repository.
- **Web Browser**: Chrome, Edge, or Firefox (recommended for WebRTC support).

---

## 🛠️ System Installation & Usage Guide (Quick Start)

Follow these steps to get CollabSpace running locally on your machine.

### 1. Clone the Repository
```bash
git clone [YOUR_REPO_URL]
cd [REPO_NAME]
```

### 2. Environment Setup

#### **Frontend**
```bash
cd frontend
npm install
cd ..
```

#### **Backend & Real-time Server**
```bash
# Backend
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
cd ..

# Real-time Server
cd realtime-server
npm install
cd ..
```

### 3. Launching the Platform
We have provided a unified batch file for Windows users to start all components (Docker, Python API, Node Server, and React Frontend) at once.

**Simply double-click or run:**
```bash
start_all.bat
```

### 4. Accessing the App
Once all terminal windows are running:
- **Frontend**: [https://localhost:5173](https://localhost:5173)
- **Backend API**: `http://localhost:8000`
- **Real-time Server**: `http://localhost:3000`

> [!NOTE]
> When you first access the site, you may see a "Your connection is not private" warning. This is expected due to the local self-signed certificate required for WebRTC. Click **Advanced -> Proceed to localhost** to enter the app.

---

## 📦 Project Structure

- `frontend/`: React source code and UI assets.
- `backend/`: FastAPI source code and database configurations.
- `realtime-server/`: Node.js/Socket.io logic for live collaboration and voice handlers.
- `start_all.bat`: The main orchestrator script for local development.
