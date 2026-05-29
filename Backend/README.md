# 🖧 Collaborative Code Editor — Backend

The server-side component of the Collaborative Code Editor. Built with **Node.js**, **Express 5**, **Socket.io**, and **MongoDB**, this backend provides RESTful APIs for authentication, room management, and multi-file code storage, real-time WebSocket communication for live collaboration, and a code execution service powered by the JDoodle API.

> **Module System:** ES Modules (ESM) — uses `import`/`export` syntax throughout.

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [API Endpoints](#-api-endpoints)
- [Database Models](#-database-models)
- [Socket.io Configuration](#-socketio-configuration)
- [Socket Events](#-socket-events)
- [Middleware](#-middleware)
- [Services](#-services)
- [Error Handling](#-error-handling)

---

## 🏗️ Architecture

```
                    ┌─────────────────────────┐
                    │     Client Requests      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      server.js           │
                    │  (Express 5 + HTTP)      │
                    │                          │
                    │  Middleware Stack:        │
                    │  1. CORS                 │
                    │  2. express.json()       │
                    │  3. cookieParser()       │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼────────┐  ┌─────▼──────┐  ┌───────▼────────┐
    │   HTTP Routes     │  │  Socket.io │  │   Middleware    │
    │  /api/auth        │  │  Handlers  │  │  (verifyToken) │
    │  /api/room        │  │            │  │                │
    │  /api/code        │  │  codeSocket│  │                │
    │  /api/chat        │  │  chatSocket│  │                │
    └─────────┬────────┘  │  cursorSock│  └───────┬────────┘
              │           └─────┬──────┘          │
    ┌─────────▼────────┐       │                  │
    │   Controllers     │       │                  │
    │  auth | room      │  ┌────▼──────┐          │
    │  code | chat      │  │  Services │          │
    │  compile (unused) │  │  JDoodle  │          │
    └─────────┬────────┘  └────┬──────┘          │
              │                │                  │
              └────────┬───────┘──────────────────┘
                       │
              ┌────────▼─────────┐
              │     MongoDB       │
              │    (Mongoose 9)   │
              │                   │
              │  users | rooms    │
              │  codefiles        │
              │  chatmessages     │
              └───────────────────┘
```

---

## 🛠️ Tech Stack

| Package             | Version   | Purpose                                        |
|:--------------------|:----------|:-----------------------------------------------|
| **express**         | ^5.2.1    | HTTP server and REST API framework (v5)        |
| **socket.io**       | ^4.8.3    | Real-time bidirectional WebSocket communication|
| **mongoose**        | ^9.3.0    | MongoDB ODM for schema-based data modeling     |
| **mongodb**         | ^7.2.0    | MongoDB native driver                          |
| **jsonwebtoken**    | ^9.0.3    | JWT token generation and verification          |
| **bcrypt**          | ^6.0.0    | Password hashing and comparison                |
| **cors**            | ^2.8.6    | Cross-Origin Resource Sharing middleware        |
| **cookie-parser**   | ^1.4.7    | Cookie parsing middleware                      |
| **dotenv**          | ^17.4.2   | Environment variable management                |
| **axios**           | ^1.13.6   | HTTP client for external API calls (JDoodle)   |
| **nodemon** (dev)   | ^3.1.14   | Development auto-restart on file changes       |

---

## 📂 Directory Structure

```
Backend/
├── config/
│   └── db.js                   # MongoDB connection initialization
│
├── controllers/
│   ├── authController.js       # Register, login, logout, get current user
│   ├── chatController.js       # Chat history retrieval
│   ├── codeController.js       # Multi-file CRUD (create/read/save/delete/rename)
│   ├── compileController.js    # Judge0 integration (⚠️ route not mounted)
│   └── roomController.js       # Room CRUD, join, kick, ban, session lifecycle
│
├── middleware/
│   └── verifyToken.js          # JWT token verification middleware
│
├── models/
│   ├── Codefile.js             # Code file schema with compound unique index
│   ├── Room.js                 # Room/session schema with participants & bans
│   ├── User.js                 # User account schema
│   └── chatMessage.js          # Chat message schema
│
├── routes/
│   ├── authRoutes.js           # Authentication route definitions
│   ├── chatRoutes.js           # Chat route definitions
│   ├── codeRoutes.js           # Code/file route definitions
│   ├── compilerRouts.js        # Compile route definitions (⚠️ not mounted)
│   └── roomRoutes.js           # Room management route definitions
│
├── services/
│   └── executeService.js       # JDoodle API integration for code execution
│
├── sockets/
│   ├── index.js                # Socket.io server initialization & JWT auth middleware
│   ├── socketHandler.js        # Main socket event router + disconnect handler
│   ├── codeSocket.js           # Code sync, file events, execution, kick/ban
│   ├── chatSocket.js           # Real-time chat messaging
│   └── cursorSocket.js         # Cursor position broadcasting
│
├── server.js                   # Application entry point
├── package.json                # Dependencies and scripts
├── .env                        # Environment configuration (⚠️ do not commit)
└── .gitignore                  # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **MongoDB** v6.0+ — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **JDoodle API** credentials — [sign up here](https://www.jdoodle.com/compiler-api)

### Installation

```bash
# Navigate to the backend directory
cd Backend

# Install dependencies
npm install
```

### Quick Start

```bash
# 1. Create a .env file (see Environment Variables section)
# 2. Start in development mode
npm run dev
```

The server will start on `http://localhost:6600` (or your configured `PORT`).

---

## 🔑 Environment Variables

Create a `.env` file in the root of the `Backend/` directory:

```env
PORT=6600
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/collab-editor
JWT_SECRET=your_jwt_secret_key_here
JDOODLE_CLIENT_ID=your_jdoodle_client_id
JDOODLE_CLIENT_SECRET=your_jdoodle_client_secret
FRONTEND_URL=http://localhost:5173
```

| Variable               | Required | Description                                              |
|:-----------------------|:--------:|:---------------------------------------------------------|
| `PORT`                 | ✅       | Port number for the Express server                       |
| `MONGO_URI`            | ✅       | MongoDB connection string (local or Atlas)               |
| `JWT_SECRET`           | ✅       | Secret key used for signing and verifying JWT tokens     |
| `JWT_EXPIRES_IN`       | ❌       | Token expiry duration (currently hardcoded to `1h`)      |
| `JDOODLE_CLIENT_ID`    | ✅       | JDoodle API client ID for code execution                 |
| `JDOODLE_CLIENT_SECRET`| ✅       | JDoodle API client secret                                |
| `FRONTEND_URL`         | ✅       | Frontend origin URL for production CORS configuration    |

> ⚠️ **Security Note:** Never commit the `.env` file to version control. It is already included in `.gitignore`.

---

## 📜 Available Scripts

| Script           | Command              | Description                                    |
|:-----------------|:---------------------|:-----------------------------------------------|
| `npm run dev`    | `nodemon server.js`  | Start with auto-reload for development         |
| `npm start`      | `node server.js`     | Start in production mode                       |
| `npm test`       | —                    | Placeholder (not yet configured)               |

---

## 📡 API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint     | Auth | Description                                   | Request Body                    |
|:-------|:-------------|:----:|:----------------------------------------------|:--------------------------------|
| POST   | `/register`  | ❌   | Create a new user account                     | `{ username, email, password }` |
| POST   | `/login`     | ❌   | Authenticate and receive a JWT token          | `{ email, password }`           |
| POST   | `/logout`    | ✅   | Clear auth cookie and logout                  | —                               |
| GET    | `/getuser`   | ✅   | Get current user profile with populated rooms | —                               |

**Login response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "664f...",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Rooms — `/api/room`

| Method | Endpoint              | Auth | Description                                          |
|:-------|:----------------------|:----:|:-----------------------------------------------------|
| POST   | `/create`             | ✅   | Create a new room (title, password, language)        |
| POST   | `/join`               | ✅   | Join a room (roomId + password); checks ban & active |
| GET    | `/history`            | ✅   | Get all rooms the user has created or joined         |
| DELETE | `/all`                | ✅   | Delete all rooms from user's history                 |
| DELETE | `/:roomId`            | ✅   | Delete room — host: full delete; guest: remove from history |
| GET    | `/:roomId`            | ✅   | Get room details with populated participants/creator |
| PATCH  | `/:roomId/end`        | ✅   | End session (host only) — also deletes chat messages |
| PATCH  | `/:roomId/reopen`     | ✅   | Reopen session (host only) — clears chat             |

### Code Files — `/api/code`

| Method | Endpoint                            | Auth | Description                                    |
|:-------|:------------------------------------|:----:|:-----------------------------------------------|
| GET    | `/:roomId/files`                    | ✅   | List all file metadata for a room (no content) |
| GET    | `/:roomId/file/:filename`           | ✅   | Get a single file with full content            |
| POST   | `/:roomId/file`                     | ✅   | Create a new file (host only, max 10 per room) |
| PUT    | `/:roomId/file/:filename`           | ✅   | Save/update file content (host only)           |
| DELETE | `/:roomId/file/:filename`           | ✅   | Delete a file (host only)                      |
| PATCH  | `/:roomId/file/:filename/rename`    | ✅   | Rename a file (host only)                      |
| GET    | `/:roomId`                          | ✅   | **Legacy**: Get the oldest file in room        |
| PUT    | `/:roomId`                          | ✅   | **Legacy**: Save code (host only)              |

### Chat — `/api/chat`

| Method | Endpoint      | Auth | Description                              |
|:-------|:--------------|:----:|:-----------------------------------------|
| GET    | `/:roomId`    | ✅   | Get full chat history sorted by date     |

---

## 🗄️ Database Models

### User — Collection: `"user"`

| Field        | Type         | Constraints          | Description                    |
|:-------------|:-------------|:---------------------|:-------------------------------|
| `username`   | String       | Required, Trim       | Display name                   |
| `email`      | String       | Required, Unique     | Account email address          |
| `password`   | String       | Required             | bcrypt-hashed password         |
| `avatar`     | String       | Optional             | Avatar URL                     |
| `rooms`      | [ObjectId]   | Ref → `"room"`       | Rooms the user has been in     |
| `createdAt`  | Date         | Auto (timestamps)    | Account creation timestamp     |
| `updatedAt`  | Date         | Auto (timestamps)    | Last update timestamp          |

### Room — Collection: `"room"`

| Field          | Type         | Default              | Constraints          | Description                        |
|:---------------|:-------------|:---------------------|:---------------------|:-----------------------------------|
| `roomId`       | String       | —                    | Required, Unique     | Human-readable room identifier     |
| `title`        | String       | `"Untitled Room"`    | —                    | Room display name                  |
| `createdBy`    | ObjectId     | —                    | Ref → `"user"`, Required | Room host/creator              |
| `language`     | String       | `"Python"`           | —                    | Default programming language       |
| `password`     | String       | `""`                 | —                    | Room access password               |
| `participants` | [ObjectId]   | —                    | Ref → `"user"`       | Active participants                |
| `bannedUsers`  | [ObjectId]   | —                    | Ref → `"user"`       | Permanently banned users           |
| `isActive`     | Boolean      | `true`               | —                    | Whether the session is active      |
| `createdAt`    | Date         | Auto (timestamps)    | —                    | Room creation timestamp            |
| `updatedAt`    | Date         | Auto (timestamps)    | —                    | Last update timestamp              |

### CodeFile — Collection: `"CodeFile"`

| Field          | Type       | Default          | Constraints                        | Description                     |
|:---------------|:-----------|:-----------------|:-----------------------------------|:--------------------------------|
| `room`         | ObjectId   | —                | Ref → `"Room"`, Required           | Associated room                 |
| `roomId`       | String     | —                | Required                           | Denormalized room identifier    |
| `filename`     | String     | —                | Required, Trim                     | Name of the file                |
| `language`     | String     | `"javascript"`   | —                                  | Programming language            |
| `content`      | String     | `""`             | —                                  | File source code                |
| `lastEditedBy` | ObjectId   | —                | Ref → `"user"`                     | Last editor                     |
| `createdAt`    | Date       | Auto (timestamps)| —                                  | Creation timestamp              |

> **Unique Compound Index:** `{ room: 1, filename: 1 }` — prevents duplicate filenames within a room.

### ChatMessage — Collection: `"ChatMessage"`

| Field      | Type       | Constraints          | Description                       |
|:-----------|:-----------|:---------------------|:----------------------------------|
| `room`     | ObjectId   | Ref → `"room"`, Required | Associated room               |
| `sender`   | ObjectId   | Ref → `"user"`, Required | Message author                |
| `message`  | String     | Required, Trim       | Message text content              |
| `createdAt`| Date       | Auto (timestamps)    | Send timestamp                    |
| `updatedAt`| Date       | Auto (timestamps)    | Last update timestamp             |

---

## 🔌 Socket.io Configuration

### Server Initialization (`sockets/index.js`)

- **CORS Origins:** `localhost:5173`, `localhost:3000`, `process.env.FRONTEND_URL`
- **Transports:** `["websocket", "polling"]` (for hosting platform compatibility, e.g., Render)
- **Ping Timeout:** 60,000 ms
- **Ping Interval:** 25,000 ms
- **Authentication:** JWT verification via `socket.handshake.auth.token`
  - On successful auth, sets `socket.data.userId`, `socket.data.username`, and `socket.user`

### Event Handler Registration (`socketHandler.js`)

On each connection, registers three handler modules:
1. `codeSocket(io, socket)` — code sync, file events, execution, kick/ban, language, session
2. `cursorSocket(io, socket)` — cursor position broadcasting
3. `chatSocket(io, socket)` — real-time chat

Also handles the `disconnecting` event to broadcast `user_left` to all rooms the socket was in.

---

## 🔗 Socket Events

### Code Events (`codeSocket.js`)

#### Client → Server

| Event                | Payload                                      | Description                                                    |
|:---------------------|:---------------------------------------------|:---------------------------------------------------------------|
| `join-room`          | `{ roomId, username }`                       | Join room — validates active/ban/participant status, syncs code |
| `send_code_sync`     | `{ targetSocketId, code, filename }`         | Relay code state to a specific new joiner                      |
| `code_change`        | `{ roomId, code, filename }`                 | Broadcast code edit to room peers                              |
| `leave_room`         | `{ roomId }`                                 | Leave room, broadcast departure                                |
| `kick_user`          | `{ roomId, targetUserId }`                   | Host only: remove user from room                               |
| `ban_user`           | `{ roomId, targetUserId }`                   | Host only: permanently ban user (persists to DB)               |
| `language_change`    | `{ roomId, language }`                       | Host only: change room language (persists to DB)               |
| `end_session`        | `{ roomId }`                                 | Host only: set room inactive                                   |
| `run_code`           | `{ roomId, source_code, language, stdin }`   | Execute code via JDoodle, broadcast result                     |
| `file_created`       | `{ roomId, file }`                           | Host only: relay new file to peers                             |
| `file_deleted`       | `{ roomId, filename }`                       | Host only: relay file deletion                                 |
| `file_renamed`       | `{ roomId, oldName, newName, newLanguage }`  | Host only: relay file rename                                   |
| `active_file_switch` | `{ roomId, filename }`                       | Broadcast which file user is editing                           |

#### Server → Client

| Event                  | Payload                                        | Description                                     |
|:-----------------------|:-----------------------------------------------|:------------------------------------------------|
| `room_users`           | `[{ userId, username }]`                       | Full list of online users (sent on join)        |
| `user_joined`          | `{ userId, username }`                         | New user joined the room                        |
| `user_left`            | `{ userId, username }`                         | User left/kicked/banned/disconnected            |
| `request_code_sync`    | `{ targetSocketId, requestActiveFile }`        | Ask a peer to send their current code           |
| `code_sync`            | `{ code, filename }`                           | Code state relayed from peer to new joiner      |
| `db_file_sync`         | `{ files: [{ filename, content, language }] }` | DB fallback when no peers are online            |
| `code_update`          | `{ code, filename }`                           | Real-time code change from another user         |
| `kicked`               | —                                              | Notify user they were kicked                    |
| `banned`               | —                                              | Notify user they were banned                    |
| `language_update`      | `language`                                     | Language changed by host                        |
| `session_ended`        | —                                              | Session ended by host                           |
| `execution_status`     | `"Running..."`                                 | Code execution started                          |
| `code_output`          | `{ stdout, stderr, exitCode }`                 | Code execution result                           |
| `file_created`         | `{ file }`                                     | New file created by host                        |
| `file_deleted`         | `{ filename }`                                 | File deleted by host                            |
| `file_renamed`         | `{ oldName, newName, newLanguage }`            | File renamed by host                            |
| `peer_switched_file`   | `{ userId, username, filename }`               | Peer switched their active file                 |
| `join_error`           | `string`                                       | Error message when join fails                   |

### Chat Events (`chatSocket.js`)

| Direction        | Event             | Payload                                      | Description                 |
|:-----------------|:------------------|:---------------------------------------------|:----------------------------|
| Client → Server  | `send-message`    | `{ roomId, message }`                        | Send a chat message         |
| Server → Client  | `receive_message` | `ChatMessage (populated sender.username)`    | Broadcast message to room   |

### Cursor Events (`cursorSocket.js`)

| Direction        | Event             | Payload                                      | Description                 |
|:-----------------|:------------------|:---------------------------------------------|:----------------------------|
| Client → Server  | `cursor_move`     | `{ roomId, line, column }`                   | Send cursor position        |
| Server → Client  | `cursor_update`   | `{ userId, username, line, column }`         | Broadcast cursor position   |

---

## 🛡️ Middleware

### `verifyToken.js`

JWT-based authentication middleware applied to all protected routes.

**Flow:**
1. Extracts the `Authorization` header from the incoming request
2. Validates the `Bearer <token>` format
3. Verifies the token using `JWT_SECRET`
4. Attaches the decoded payload (`userId`, `email`) to `req.user`
5. Calls `next()` on success, or returns `401 Unauthorized` on failure

**Usage:**
```javascript
import { verifyToken } from '../middleware/verifyToken.js';

router.get('/getuser', verifyToken, getCurrentUser);
```

---

## ⚙️ Services

### `executeService.js`

Integrates with the [JDoodle API](https://www.jdoodle.com/compiler-api) for sandboxed remote code execution.

**Supported Languages:**

| Language     | JDoodle Language ID | Version Index |
|:-------------|:--------------------|:--------------|
| `javascript` | `nodejs`            | v17.x        |
| `python`     | `python3`           | v3.10        |
| `cpp`        | `cpp`               | C++ 17       |
| `java`       | `java`              | JDK 17       |

**Configuration:** Uses `JDOODLE_CLIENT_ID` and `JDOODLE_CLIENT_SECRET` environment variables.

**Called by:** The `run_code` socket event in `codeSocket.js`.

> **Note:** There is also a `compileController.js` that integrates with the Judge0 API (`https://ce.judge0.com`), but its route (`compilerRouts.js`) is **not mounted** in `server.js`.

---

## ⚠️ Error Handling

The server implements a global error handler in `server.js` with consistent error classification:

| Status | Type                  | Description                                           |
|:-------|:----------------------|:------------------------------------------------------|
| 400    | `ValidationError`     | Mongoose schema validation failure                    |
| 400    | `CastError`           | Invalid ObjectId or type casting failure              |
| 404    | Not Found             | Route or resource does not exist                      |
| 409    | Duplicate Key (11000) | Unique constraint violation (e.g., duplicate email)   |
| 401    | Unauthorized          | Invalid or missing JWT token                          |
| 500    | Internal Server Error | Unexpected server errors (fallback)                   |

Error responses follow a consistent JSON format:
```json
{
  "message": "Descriptive error message",
  "error": "Detailed error info (development only)"
}
```

---

<p align="center">
  <sub>Part of the <a href="../README.md">Collaborative Code Editor</a> project</sub>
</p>
