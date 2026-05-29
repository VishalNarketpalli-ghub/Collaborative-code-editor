<p align="center">
  <h1 align="center">🖥️ Collaborative Code Editor</h1>
  <p align="center">
    A real-time, multi-user collaborative code editor with live synchronization, remote code execution, in-app messaging, and comprehensive session management.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Monaco_Editor-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [WebSocket Events](#-websocket-events)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Collaborative Code Editor** is a full-stack web application that enables multiple developers to write, edit, and execute code together in real time. Built with a **Node.js/Express 5/Socket.io** backend and a **React 19/Vite 6** frontend, it delivers a seamless collaborative experience reminiscent of VS Code Live Share — directly in the browser.

Users can create or join coding rooms, write code across multiple files with a tabbed editor, chat with collaborators, execute code remotely via JDoodle, and manage participants with host-level access controls including kick and ban functionality.

---

## ✨ Key Features

### 🔄 Real-Time Collaboration
- **Live code synchronization** across all participants using Socket.io WebSockets
- **Peer-to-peer code sync** — new joiners receive the latest editor state from active peers, with database fallback
- **Remote cursor tracking** with real-time position broadcasting
- **User presence system** showing online participants with join/leave notifications
- **Active file tracking** — see which file each collaborator is currently editing

### 📁 Multi-File Management
- **Multi-file tabbed interface** supporting up to 10 files per room
- **Interactive file explorer** in a resizable sidebar (host-only create/rename/delete)
- **Resizable panel layout** separating file explorer, editor, and output/chat regions
- **Language-aware syntax highlighting** powered by Monaco Editor (the VS Code engine)
- **Host-controlled language setting** with live broadcast to all participants

### 💬 Integrated Chat System
- **Persistent chat messaging** with real-time delivery and database storage
- **Chat history retrieval** — messages are loaded from the database when joining
- **System notifications** for user join/leave events

### ▶️ Code Execution
- **Remote code execution** via JDoodle API with support for JavaScript, Python, C++, and Java
- **Standard input (stdin) support** for interactive programs
- **Separated stdout/stderr output** with color-coded display
- **Real-time execution status** broadcasting to all room participants

### 🔐 Session & Access Control
- **JWT-based authentication** with bcrypt password hashing
- **Room password protection** for secure session access
- **User profile dashboard** showing session history (rooms created/joined)
- **Host privileges** — kick users, ban users permanently, end/reopen sessions
- **Ban persistence** — banned users are stored in the database and cannot rejoin
- **Session lifecycle management** — rooms can be ended and reopened by the host
- **Custom non-blocking modals & toast notifications** replacing native browser dialogs

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  React 19   │  │ Monaco Editor│  │   Socket.io Client       │ │
│  │  (Vite 6)   │  │              │  │  (JWT Auth Handshake)    │ │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬──────────────┘ │
│         │ Axios          │                      │                │
└─────────┼────────────────┼──────────────────────┼────────────────┘
          │ REST API       │                      │ WebSocket
          │                │                      │
┌─────────┼────────────────┼──────────────────────┼────────────────┐
│         ▼                ▼                      ▼                │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────────┐ │
│  │  Express 5   │  │  Controllers  │  │   Socket.io Handlers   │ │
│  │  Routes      │  │  auth | room  │  │  code | chat | cursor  │ │
│  │  /api/auth   │  │  code | chat  │  │                        │ │
│  │  /api/room   │  │               │  │  ┌──────────────────┐  │ │
│  │  /api/code   │  │               │  │  │  JDoodle API     │  │ │
│  │  /api/chat   │  │               │  │  │  (Code Execution)│  │ │
│  └──────┬───────┘  └───────┬───────┘  │  └──────────────────┘  │ │
│         │                  │          └───────────┬─────────────┘ │
│         │  verifyToken     │                      │              │
│         │  Middleware       │                      │              │
│         └──────────────────┼──────────────────────┘              │
│                            ▼                                     │
│                   ┌─────────────────┐                            │
│                   │    MongoDB      │                            │
│                   │   (Mongoose)    │                            │
│                   │                 │                            │
│                   │  users | rooms  │                            │
│                   │  codefiles      │                            │
│                   │  chatmessages   │                            │
│                   └─────────────────┘                            │
│                       Server (Node.js — ESM)                     │
└──────────────────────────────────────────────────────────────────┘
```

**Key Architectural Patterns:**
- **Dual communication**: REST for CRUD operations, Socket.io for real-time collaboration
- **Peer-to-peer sync with DB fallback**: New joiners get state from peers; if no peers are online, the server falls back to the database
- **Host-based authorization**: Mutating operations (file CRUD, kick, ban, end session, language change) are restricted to the room creator
- **JWT auth on both channels**: REST routes use `verifyToken` middleware; Socket.io validates JWT during the handshake

---

## 🛠️ Tech Stack

| Layer        | Technology                        | Purpose                              |
|:-------------|:----------------------------------|:-------------------------------------|
| **Runtime**  | Node.js                           | Server-side JavaScript runtime       |
| **Server**   | Express.js v5                     | REST API framework                   |
| **Real-time**| Socket.io v4.8                    | WebSocket-based bidirectional comms   |
| **Database** | MongoDB + Mongoose v9             | Document-based data persistence      |
| **Auth**     | JWT + bcrypt                      | Token-based authentication           |
| **Frontend** | React 19 + Vite 6                 | Component-based UI with fast HMR     |
| **Editor**   | Monaco Editor (@monaco-editor/react) | VS Code-grade code editing        |
| **Styling**  | Tailwind CSS v4 + Vanilla CSS     | Utility-first + custom styling       |
| **HTTP**     | Axios                             | HTTP client for API requests         |
| **Routing**  | React Router DOM v7               | Client-side navigation               |
| **Execution**| JDoodle API                       | Sandboxed remote code execution      |
| **Deployment**| Vercel (Frontend) + Render (Backend) | Cloud hosting                     |

---

## 📂 Project Structure

```
Collaborative-code-editor/
│
├── Backend/                        # Node.js + Express 5 API server (ESM)
│   ├── config/
│   │   └── db.js                   # MongoDB connection initialization
│   ├── controllers/
│   │   ├── authController.js       # Register, login, logout, get user
│   │   ├── chatController.js       # Chat history retrieval
│   │   ├── codeController.js       # Multi-file CRUD (create/read/save/delete/rename)
│   │   ├── compileController.js    # Judge0 integration (inactive)
│   │   └── roomController.js       # Room CRUD, join, kick, ban, session management
│   ├── middleware/
│   │   └── verifyToken.js          # JWT token verification middleware
│   ├── models/
│   │   ├── Codefile.js             # Code file schema (compound unique index)
│   │   ├── Room.js                 # Room/session schema with participants & bans
│   │   ├── User.js                 # User account schema
│   │   └── chatMessage.js          # Chat message schema
│   ├── routes/
│   │   ├── authRoutes.js           # Auth endpoints (/api/auth/*)
│   │   ├── chatRoutes.js           # Chat endpoints (/api/chat/*)
│   │   ├── codeRoutes.js           # Code/file endpoints (/api/code/*)
│   │   ├── compilerRouts.js        # Compile endpoints (not mounted)
│   │   └── roomRoutes.js           # Room endpoints (/api/room/*)
│   ├── services/
│   │   └── executeService.js       # JDoodle API integration
│   ├── sockets/
│   │   ├── index.js                # Socket.io server initialization & JWT auth
│   │   ├── socketHandler.js        # Main socket event router + disconnect handler
│   │   ├── codeSocket.js           # Code sync, file events, execution, kick/ban
│   │   ├── chatSocket.js           # Real-time chat messaging
│   │   └── cursorSocket.js         # Cursor position broadcasting
│   ├── server.js                   # Application entry point
│   ├── package.json
│   └── .env                        # Environment variables (not committed)
│
├── Frontend/                       # React 19 + Vite 6 client application
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/             # Monaco editor, file explorer, tabs
│   │   │   ├── layout/             # Header, footer, page layout
│   │   │   ├── pages/              # Full page views (Editor, Profile, Auth, Home)
│   │   │   ├── room/               # Room creation & joining components
│   │   │   └── ui/                 # Reusable modals, toasts, UI primitives
│   │   ├── context/                # React Context providers (Auth, Toast)
│   │   ├── utils/                  # Axios instance, socket connection, helpers
│   │   ├── App.jsx                 # Root component with routing
│   │   ├── main.jsx                # Application entry point
│   │   └── index.css               # Global styles
│   ├── index.html                  # HTML template
│   ├── vite.config.js              # Vite build configuration
│   ├── vercel.json                 # Vercel deployment config (SPA rewrites)
│   └── package.json
│
└── README.md                       # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version            | Notes                                      |
|:------------|:-------------------|:-------------------------------------------|
| **Node.js** | v18.0.0 or higher  |                                            |
| **npm**     | v9.0.0 or higher   |                                            |
| **MongoDB** | v6.0+              | Local instance or [Atlas](https://www.mongodb.com/atlas) |
| **JDoodle** | —                  | [API credentials](https://www.jdoodle.com/compiler-api) for code execution |

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/VishalNarketpalli-ghub/Collaborative-code-editor.git
   cd Collaborative-code-editor
   ```

2. **Install backend dependencies**

   ```bash
   cd Backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../Frontend
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file in the `Backend/` directory (see [Environment Variables](#-environment-variables) below).

---

## 🔑 Environment Variables

Create a `Backend/.env` file with the following variables:

| Variable               | Required | Description                                  | Example                     |
|:-----------------------|:--------:|:---------------------------------------------|:----------------------------|
| `PORT`                 | ✅       | Port the backend server listens on           | `6600`                      |
| `MONGO_URI`            | ✅       | MongoDB connection string                    | `mongodb+srv://...`         |
| `JWT_SECRET`           | ✅       | Secret key for signing JWT tokens            | `your_super_secret_key`     |
| `JWT_EXPIRES_IN`       | ❌       | Token expiry duration (hardcoded to `1h`)    | `1h`                        |
| `JDOODLE_CLIENT_ID`    | ✅       | JDoodle API client ID                        | `abc123...`                 |
| `JDOODLE_CLIENT_SECRET`| ✅       | JDoodle API client secret                    | `xyz789...`                 |
| `FRONTEND_URL`         | ✅       | Frontend URL for production CORS whitelist   | `https://your-app.vercel.app` |

```env
PORT=6600
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/collab-editor
JWT_SECRET=your_jwt_secret_key_here
JDOODLE_CLIENT_ID=your_jdoodle_client_id
JDOODLE_CLIENT_SECRET=your_jdoodle_client_secret
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Security Note:** Never commit the `.env` file to version control. The `.gitignore` is already configured to exclude it.

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 — Start the Backend:**
```bash
cd Backend
npm run dev
```
> The server starts on `http://localhost:6600` with nodemon for auto-reload.

**Terminal 2 — Start the Frontend:**
```bash
cd Frontend
npm run dev
```
> The client starts on `http://localhost:5173` with Vite HMR.

### Production Build

```bash
cd Frontend
npm run build
```
> Outputs optimized static assets to `Frontend/dist/`.

---

## 🌐 Deployment

### Frontend (Vercel)

The frontend includes a [`vercel.json`](Frontend/vercel.json) configuration for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Deploy via the [Vercel CLI](https://vercel.com/docs/cli) or connect the GitHub repository through the Vercel dashboard.

### Backend (Render / Railway / Any Node.js Host)

1. Set all required environment variables from the table above
2. Set the **build command** to `npm install`
3. Set the **start command** to `npm start` (or `node server.js`)
4. Ensure `FRONTEND_URL` points to your deployed frontend origin

> **Note:** The Socket.io server is configured with `["websocket", "polling"]` transports and extended ping timeouts (60s timeout, 25s interval) for compatibility with hosting platforms like Render.

---

## 📡 API Reference

### Authentication — `/api/auth`

| Method | Endpoint     | Auth | Description                            |
|:-------|:-------------|:----:|:---------------------------------------|
| POST   | `/register`  | ❌   | Register a new user account            |
| POST   | `/login`     | ❌   | Authenticate and receive a JWT token   |
| POST   | `/logout`    | ✅   | Logout and clear auth cookie           |
| GET    | `/getuser`   | ✅   | Get current user profile with rooms    |

### Rooms — `/api/room`

| Method | Endpoint              | Auth | Description                                    |
|:-------|:----------------------|:----:|:-----------------------------------------------|
| POST   | `/create`             | ✅   | Create a new coding room (title, password, language) |
| POST   | `/join`               | ✅   | Join a room (roomId + password, checks bans)   |
| GET    | `/history`            | ✅   | Get user's room history                        |
| DELETE | `/all`                | ✅   | Delete all rooms from user history             |
| DELETE | `/:roomId`            | ✅   | Delete room (host: full delete; guest: remove from history) |
| GET    | `/:roomId`            | ✅   | Get room details with populated participants   |
| PATCH  | `/:roomId/end`        | ✅   | End session (host only, deletes chat)          |
| PATCH  | `/:roomId/reopen`     | ✅   | Reopen session (host only, clears chat)        |

### Code Files — `/api/code`

| Method | Endpoint                            | Auth | Description                        |
|:-------|:------------------------------------|:----:|:-----------------------------------|
| GET    | `/:roomId/files`                    | ✅   | List all file metadata (no content)|
| GET    | `/:roomId/file/:filename`           | ✅   | Get a single file with full content|
| POST   | `/:roomId/file`                     | ✅   | Create a new file (host only, max 10) |
| PUT    | `/:roomId/file/:filename`           | ✅   | Save file content (host only)      |
| DELETE | `/:roomId/file/:filename`           | ✅   | Delete a file (host only)          |
| PATCH  | `/:roomId/file/:filename/rename`    | ✅   | Rename a file (host only)          |

### Chat — `/api/chat`

| Method | Endpoint      | Auth | Description                              |
|:-------|:--------------|:----:|:-----------------------------------------|
| GET    | `/:roomId`    | ✅   | Get full chat history for a room         |

---

## 🔌 WebSocket Events

### Client → Server

| Event                | Payload                                      | Description                               |
|:---------------------|:---------------------------------------------|:------------------------------------------|
| `join-room`          | `{ roomId, username }`                       | Join a coding room                        |
| `code_change`        | `{ roomId, code, filename }`                 | Broadcast code edits                      |
| `cursor_move`        | `{ roomId, line, column }`                   | Share cursor position                     |
| `send-message`       | `{ roomId, message }`                        | Send a chat message                       |
| `file_created`       | `{ roomId, file }`                           | Notify peers of new file (host)           |
| `file_deleted`       | `{ roomId, filename }`                       | Notify peers of file deletion (host)      |
| `file_renamed`       | `{ roomId, oldName, newName, newLanguage }`  | Notify peers of file rename (host)        |
| `active_file_switch` | `{ roomId, filename }`                       | Broadcast active file change              |
| `run_code`           | `{ roomId, source_code, language, stdin }`   | Execute code via JDoodle                  |
| `kick_user`          | `{ roomId, targetUserId }`                   | Kick a user (host only)                   |
| `ban_user`           | `{ roomId, targetUserId }`                   | Ban a user permanently (host only)        |
| `language_change`    | `{ roomId, language }`                       | Change room language (host only)          |
| `end_session`        | `{ roomId }`                                 | End the session (host only)               |
| `leave_room`         | `{ roomId }`                                 | Leave the coding room                     |

### Server → Client

| Event                | Payload                                | Description                              |
|:---------------------|:---------------------------------------|:-----------------------------------------|
| `code_update`        | `{ code, filename }`                   | Receive code changes from others         |
| `cursor_update`      | `{ userId, username, line, column }`   | Receive cursor position updates          |
| `receive_message`    | `ChatMessage (populated sender)`       | Receive chat message                     |
| `user_joined`        | `{ userId, username }`                 | Notification of new participant          |
| `user_left`          | `{ userId, username }`                 | Notification of participant leaving      |
| `room_users`         | `[{ userId, username }]`               | Full list of online users (on join)      |
| `code_sync`          | `{ code, filename }`                   | Code state from peer (on join)           |
| `db_file_sync`       | `{ files: [{ filename, content, language }] }` | DB fallback state (on join)     |
| `file_created`       | `{ file }`                             | New file created                         |
| `file_deleted`       | `{ filename }`                         | File deleted                             |
| `file_renamed`       | `{ oldName, newName, newLanguage }`    | File renamed                             |
| `peer_switched_file` | `{ userId, username, filename }`       | Peer changed active file                 |
| `execution_status`   | `"Running..."`                         | Code execution started                   |
| `code_output`        | `{ stdout, stderr, exitCode }`         | Code execution result                    |
| `kicked`             | —                                      | Notify user they were kicked             |
| `banned`             | —                                      | Notify user they were banned             |
| `language_update`    | `language`                             | Language changed by host                 |
| `session_ended`      | —                                      | Session ended by host                    |
| `join_error`         | `string`                               | Error message when join fails            |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix     | Purpose                       |
|:-----------|:------------------------------|
| `feat:`    | New feature                   |
| `fix:`     | Bug fix                       |
| `docs:`    | Documentation changes         |
| `style:`   | Code formatting (no logic)    |
| `refactor:`| Code refactoring              |
| `test:`    | Adding or updating tests      |
| `chore:`   | Maintenance tasks             |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/VishalNarketpalli-ghub">Vishal Narketpalli</a>
</p>
