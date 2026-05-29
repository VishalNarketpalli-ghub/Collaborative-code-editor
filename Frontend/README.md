# 🖥️ Collaborative Code Editor — Frontend

The client-side component of the Collaborative Code Editor. Built with **React 19**, **Vite 6**, and **Tailwind CSS v4**, this application provides a responsive, high-performance editor interface featuring real-time code synchronization, remote execution, in-app messaging, cursor tracking, and session management.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Application Architecture](#-application-architecture)
- [Routing Map](#-routing-map)
- [Key Contexts & State](#-key-contexts--state)
- [Styling Approach](#-styling-approach)
- [Build & Deployment](#-build--deployment)

---

## ✨ Features

### 🔄 Real-Time Collaboration
- **Socket.io Client** integration with handshake-level JWT authentication.
- **Peer-to-Peer Code Sync Protocol** which retrieves the latest code states from active peers upon joining (falling back to database sync if no peers are online).
- **Remote Cursor Synchronization** displaying color-coded cursor indicators and username tags in the Monaco editor.
- **Active File Switch Sync** showing other users which file you are currently viewing.

### 📁 Multi-File Management
- **VS Code-Style Sidebar** featuring a collapsible file explorer.
- **Tabbed Interface** allowing users to switch between up to 10 active files in a room.
- **Host Privileges**: Only the room creator (host) can create, rename, or delete files.
- **Language-Aware Editing** powered by Monaco Editor (with syntax highlighting, auto-complete, and indentation rules).

### 💬 Collaborative Room Tools
- **Live Room Chat** that populates message history from the database on join.
- **Participant Panel** showing a list of active users, their roles, and assigning them distinct styling colors.
- **Execution Output Panel** with a terminal-like display supporting standard input (`stdin`) redirection.
- **Host Actions** allowing the room owner to kick users, ban users permanently, change room languages, and end sessions.

### 🎨 User Interface & Experience
- **Fluid Grid Layout** with resizable panels separating explorer, editor, and console/chat.
- **Custom UI Overlays**: Modal dialogs (`ConfirmModal`) and feedback popups (`ToastContext`) replacing browser defaults.
- **Interactive Landing Page** with dynamic animations and clear user guides.
- **User Dashboard** displaying active session history, room metadata, and hosting controls.

---

## 🛠️ Tech Stack

| Library / Tool | Version | Purpose |
|:---|:---|:---|
| **React** | ^19.1.1 | Core UI view library |
| **Vite** | ^7.1.7 | Frontend builder and dev server |
| **Monaco Editor** | ^0.55.1 | Code editor engine with built-in IntelliSense |
| **Tailwind CSS** | ^4.2.1 | Utility-first styling framework |
| **Socket.io-client**| ^4.8.3 | Real-time WebSocket connection engine |
| **React Router DOM**| ^7.13.1 | Single-Page Application (SPA) client-side routing |
| **React Hook Form** | ^7.71.2 | Validated form handling (login/registration) |
| **Axios** | ^1.13.6 | Promise-based HTTP client for REST APIs |
| **React Icons** | ^5.6.0 | Modern SVG icon sets |
| **React Type Animation**| ^3.2.0 | Typing animations for landing pages |

---

## 📂 Directory Structure

```
Frontend/
├── public/                     # Static files (favicons, assets)
├── src/
│   ├── api/                    # API wrappers (currently empty placeholders)
│   ├── assets/                 # Images & shared style lists
│   │   ├── feature.jpeg        # Marketing landing illustration
│   │   └── style-collecton.js  # Reusable Tailwind styling presets
│   ├── components/
│   │   ├── editor/             # Editor-specific components
│   │   │   ├── FileExplorer.jsx# Sidebar file navigator
│   │   │   ├── TabBar.jsx      # Opened files tab row
│   │   │   └── editor.css      # Custom BEM styles for the workspace
│   │   ├── layout/             # Global wrapper components
│   │   │   ├── Header.jsx      # Navigation bar (mobile/desktop responsive)
│   │   │   ├── Footer.jsx      # Footnote signature
│   │   │   └── RootLayout.jsx  # Layout structure
│   │   ├── pages/              # Main routing views
│   │   │   ├── EditorPage.jsx  # Primary workspace (1200+ lines of collaboration logic)
│   │   │   ├── Home.jsx        # App landing page
│   │   │   ├── Login.jsx       # Account sign in page
│   │   │   ├── Profile.jsx     # User dashboard & session logs
│   │   │   ├── Register.jsx    # Account registration page
│   │   │   └── Room.jsx        # Room creation/joining portal
│   │   ├── room/               # Room-specific configuration pages
│   │   │   ├── CreateRoom.jsx  # New session form
│   │   │   └── JoinRoom.jsx    # Join session form
│   │   └── ui/                 # Reusable layout primitives
│   │       └── ConfirmModal.jsx# Context-dismissible dialog overlay
│   ├── context/                # Global React Context providers
│   │   ├── AuthContext.jsx     # Auth state, login/logout, tokens
│   │   ├── SocketContext.jsx   # Client socket singleton export
│   │   └── ToastContext.jsx    # System notifications
│   ├── socket-files/           # Centralized Socket connection layer
│   │   └── socket.js           # Reconnection logic & socket wrapper
│   ├── utils/                  # Shared utilities
│   │   ├── axios.js            # Axios client with interceptors
│   │   └── languageMap.js      # Language-to-compiler mapping dictionary
│   ├── App.jsx                 # Main application routes wrapper
│   ├── main.jsx                # Web application mount entrypoint
│   └── index.css               # Main stylesheet (Tailwind v4 base)
│
├── vite.config.js              # Vite packaging config
├── vercel.json                 # Vercel client-side routing configs
├── eslint.config.js            # ESLint rules
└── package.json                # NPM configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- A running backend server (see [Backend README](../Backend/README.md))

### Installation

```bash
# Navigate to the frontend directory
cd Frontend

# Install package dependencies
npm install
```

### Running the App Locally

Ensure the backend server is running, then launch the Vite dev server:

```bash
# Start in development mode
npm run dev
```

The application will start on `http://localhost:5173`. Open this URL in your web browser.

---

## 🔑 Environment Variables

The application can be configured using environment variables. Create a `.env` or `.env.local` file in the `Frontend/` folder:

```env
VITE_API_URL=http://localhost:6600/api
VITE_SOCKET_URL=http://localhost:6600
```

| Variable | Default Value | Description |
|:---|:---|:---|
| `VITE_API_URL` | `http://localhost:6600/api` | Base HTTP endpoint for user/room REST APIs |
| `VITE_SOCKET_URL` | `http://localhost:6600` | Address of the Socket.io WebSocket server |

---

## 📜 Available Scripts

| Script | Command | Description |
|:---|:---|:---|
| `npm run dev` | `vite` | Starts the Vite development server with HMR |
| `npm run build` | `vite build` | Builds highly optimized static production files in `dist/` |
| `npm run preview`| `vite preview` | Locally serves the production build for testing |
| `npm run lint` | `eslint .` | Lints files to locate warnings and syntax bugs |

---

## 🏗️ Application Architecture

```
main.jsx
└── AuthProvider (Restores session, connects socket on success)
    └── App.jsx (Routes config)
        └── ToastProvider (Notification alerts context)
            └── RouterProvider
                ├── RootLayout (Default wrapper for Header, Content, Footer)
                │   ├── Header (Responsive nav menu)
                │   ├── Outlet (Animates sub-pages on transition)
                │   │   ├── Home
                │   │   ├── Login
                │   │   ├── Register
                │   │   ├── PrivateRoute → Room Hub
                │   │   ├── PrivateRoute → CreateRoom
                │   │   ├── PrivateRoute → JoinRoom
                │   │   └── PrivateRoute → Profile
                │   └── Footer
                └── PrivateRoute → EditorPage (Stand-alone editor workspace)
                    ├── FileExplorer (Sidebar structure)
                    ├── TabBar (Dynamic open tabs)
                    ├── Monaco Editor (Syntax workspace)
                    └── Console / Chat panels
```

---

## 🛣️ Routing Map

All pages are configured inside [App.jsx](file:///c:/Users/visha/OneDrive/Desktop/Collaborative%20Code%20Editor/Collaborative-code-editor/Frontend/src/App.jsx). Paths protected by `PrivateRoute` will redirect unauthenticated users to `/login`.

| Path | Layout | Auth | Description |
|:---|:---|:---:|:---|
| `/` | `RootLayout` | ❌ | Landing page with hero section & features |
| `/login` | `RootLayout` | ❌ | Login screen (uses `react-hook-form`) |
| `/register`| `RootLayout` | ❌ | Registration screen (uses `react-hook-form`) |
| `/room` | `RootLayout` | ✅ | Session Hub (Create/Join choices) |
| `/create-room`| `RootLayout`| ✅ | Configure name, language, & password |
| `/join-room`| `RootLayout` | ✅ | Enter roomId & password to access workspace |
| `/profile` | `RootLayout` | ✅ | Dashboard showing room logs and histories |
| `/room/:roomId`| `None` (Standalone)| ✅ | Main collaborative code workspace |

---

## 🔌 Key Contexts & State

### `AuthContext`
- **Location**: `src/context/AuthContext.jsx`
- **State**: `user` object (`_id`, `username`, `email`), `loading` status.
- **Methods**: `login(data)` to register credentials and save tokens to localStorage; `logout()` to remove credentials and tear down the socket connection.
- **Lifecycle**: Automatically requests `GET /auth/getuser` on application load to restore sessions and connect to Socket.io.

### `ToastContext`
- **Location**: `src/context/ToastContext.jsx`
- **State**: `toast` object (`message`, `type` e.g., success, error, notification).
- **Methods**: `showToast(message, type)` to prompt a custom alert on the top-right corner. Automatically clears after 4 seconds.

### `Socket Manager`
- **Location**: `src/socket-files/socket.js`
- **Features**: Exports client methods (`connectSocket`, `getSocket`, `disconnectSocket`). Handles connection limits and falls back to polling if WebSockets fail.

---

## 🎨 Styling Approach

The project uses a hybrid styling method, combining the speed of **Tailwind CSS v4** with the separation of concerns provided by **Vanilla CSS**.

1. **Tailwind CSS v4**
   - Configured via Vite's `@tailwindcss/vite` plugin.
   - Provides responsive designs (`md:`, `lg:`), text gradients, animations, flexboxes, and layouts.
   - Reusable class libraries are predefined in `assets/style-collecton.js`.

2. **Vanilla CSS (`src/components/editor/editor.css`)**
   - Contains 950+ lines of custom scoped CSS specifically for the editor layout.
   - Uses BEM prefixes (`.editor-*`, `.fe-*`, `.tab-*`, `.chat-*`, `.online-*`) for structural styling.
   - Handles custom scrollbars, panel resizers, console inputs, and Monaco cursor decorators.

3. **Theme Variables (`src/index.css`)**
   - Configures the design tokens for dark themes:
     - Backgrounds: `--bg-base` (`#030712`), `--bg-surface` (`#0f1117`), `--bg-elevated` (`#161b27`)
     - Borders: `--border` (`#1f2937`), `--border-bright` (`#374151`)
     - Text: `--text-primary` (`#e5e7eb`), `--text-secondary` (`#9ca3af`)

---

## 🌐 Build & Deployment

### Build Command
Compile production assets into static folders:
```bash
npm run build
```
This script exports the production application into `Frontend/dist/`.

### Deployment Config (Vercel)
The project includes a `vercel.json` file to route page refreshes in Single-Page Applications (SPA) back to the entry template:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

<p align="center">
  <sub>Part of the <a href="../README.md">Collaborative Code Editor</a> project</sub>
</p>
