# 🚀 CollabSpace

**CollabSpace** is a premium, real-time collaborative platform designed for teams to brainstorm, document, and communicate seamlessly. It integrates a powerful whiteboard, a rich-text editor, and real-time voice and chat communication into a single unified workspace.

---

## ✨ Key Features

- **Unified Dashboard**: A clean and modern center to manage, create, and search through all your collaborative boards.
- **Interactive Whiteboard**: A high-performance drawing canvas with shapes, freehand drawing, and real-time state synchronization.
- **Rich Document Editor**: A real-time collaborative text editor for shared notes and documentation.
- **Real-Time Voice & Chat**: Integrated WebRTC voice communication and instant messaging to keep teams connected while they work.
- **Smart User Management**: Personalized profiles with consistent avatars and secure authentication.
- **Dockerized Architecture**: Fully containerized for easy deployment and consistent performance.

---

## 📋 Prerequisites

The entire platform is now **Dockerized**. You only need one thing installed:

- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/)
- **Git**: To clone the repository.

---

## 🛠️ Quick Start Guide

Follow these steps to get CollabSpace running in under 2 minutes.

### 1. Clone the Repository
```bash
git clone [YOUR_REPO_URL]
cd WEB
```

### 2. Launch the Platform
Run the following command in your terminal (at the project root):
```bash
docker-compose up --build -d
```
*This command builds the images and starts the Frontend, Backend, Real-time Server, MySQL, and MongoDB all at once.*

### 3. Access the App
- **Frontend**: [http://localhost](http://localhost)
- **Backend API**: `http://localhost:8000`
- **Real-time Server**: `http://localhost:3000`

> [!NOTE]
> Since this is a fresh Docker database, your old accounts are gone. Click **"Create Account"** to register a new user first!

---

## 📦 System Architecture

The platform is orchestrated via `docker-compose` with 5 core services:

| Service | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + Nginx | The user interface and SPA routing. |
| **Backend** | FastAPI (Python) | REST API for users, authentication, and board logic. |
| **Realtime** | Node.js (Socket.io) | Handles live canvas sync and WebRTC voice. |
| **MySQL** | MySQL 8.0 | Stores user profiles and account data. |
| **MongoDB** | MongoDB | Stores collaborative board data and canvas states. |

---

## ⌨️ Developer Commands

Use these commands to manage your local environment:

| Action | Command |
| :--- | :--- |
| **Stop All Services** | `docker-compose down` |
| **Real-time Logs** | `docker-compose logs -f` |
| **View Backend Logs** | `docker-compose logs -f backend` |
| **Force Rebuild** | `docker-compose up --build -d` |
| **Wipe Databases** | `docker-compose down -v` |

---

## 📂 Project Structure

- `frontend/`: React source code and Nginx configuration.
- `backend/`: FastAPI source code and Python dependencies.
- `realtime-server/`: Node.js Socket.io logic.
- `docker-compose.yml`: The main orchestration file.
