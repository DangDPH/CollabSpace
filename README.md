# 🚀 CollabSpace

**CollabSpace** is a premium, real-time collaborative platform designed for teams to brainstorm, document, and communicate seamlessly. It integrates a powerful whiteboard, a rich-text editor, and real-time voice and chat communication into a single unified workspace.

---

## ✨ Key Features

- **Unified Dashboard**: A clean and modern center to manage, create, and search through all your collaborative boards.
- **Interactive Whiteboard**: A high-performance drawing canvas with shapes, freehand drawing, and real-time state synchronization.
- **Rich Document Editor**: A real-time collaborative text editor for shared notes and documentation.
- **Real-Time Voice & Chat**: Integrated WebRTC voice communication and instant messaging to keep teams connected while they work.
- **Microphone Optimized**: Built-in "Sync" logic to support voice chat on **iOS, Android, and Windows**.
- **Dockerized Architecture**: Fully containerized for easy deployment and consistent performance.

---

## 📋 Prerequisites

The entire platform is now Dockerized. You only need two things installed:

- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/)
- **Git**: To clone the repository.

---

## 🛠️ Quick Start Guide

Follow these steps to get CollabSpace running in under 2 minutes.

### 1. Launch the Platform
Run the following command in your terminal (at the project root):
```bash
docker-compose up --build -d
```
*This command builds the images and starts the Unified Frontend, Backend, Real-time Server, MySQL, and MongoDB all at once.*

### 2. Access the Workspace
- **Main App (Unified Gateway)**: [http://localhost](http://localhost)

> [!NOTE]
> Since this is a fresh Docker database, click **"Create Account"** to register a new user first!

---

## 🌍 Global Sharing (Presentation Mode)

To share your board with a remote team or test on mobile devices across the internet:

1. **Start the Tunnel**: Run this in a new terminal:
   ```bash
   npx cloudflared tunnel --url http://localhost:80
   ```
2. **Join**: Share the secure **`https://...trycloudflare.com`** link provided by the terminal.

---

## 🎤 Voice Chat Tips
- **HTTPS is Mandatory**: Browsers only allow microphone access on `https` links or `localhost`. Always use the tunnel link for remote testing.
- **Mobile Users (iOS/Android)**: After joining voice, tap the **🔄 Sync** button in the Voice Box to activate the audio system.

---

## 📦 System Architecture

The platform is orchestrated via `docker-compose` with all services unified through a single entry point:

| Service | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + Nginx | Unified UI and Gateway on Port 80. |
| **Backend** | FastAPI (Python) | REST API for users, authentication, and board logic. |
| **Realtime** | Node.js (Socket.io) | Handles live canvas sync and WebRTC voice. |
| **MySQL** | MySQL 8.0 | Stores user profiles and account data. |
| **MongoDB** | MongoDB | Stores collaborative board data and canvas states. |

---

## ⌨️ Developer Commands

| Action | Command |
| :--- | :--- |
| **Stop All Services** | `docker-compose down` |
| **Real-time Logs** | `docker-compose logs -f` |
| **Force Rebuild** | `docker-compose up --build -d` |
| **Wipe Databases** | `docker-compose down -v` |

---

## 📂 Project Structure
- `frontend/`: React source code and Nginx gateway configuration.
- `backend/`: FastAPI source code and Python dependencies.
- `realtime-server/`: Node.js Socket.io logic.
- `docker-compose.yml`: The main orchestration file.
