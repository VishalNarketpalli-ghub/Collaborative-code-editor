# Collaborative Code Editor

A real-time, multi-user collaborative code editor featuring synchronous editing, remote execution, in-app messaging, and comprehensive session management. Built using a Node.js/Express/Socket.io backend and a React/Vite frontend.

## Features

### Real-Time Collaboration
- Multiple users can edit the same files concurrently with live synchronization of code.
- Visual display of cursor locations and selections for all active participants in a room.
- User presence tracking showing active members with custom color-coded avatars in the topbar.

### Document & File Management
- Tabbed interface supporting multiple open files simultaneously.
- Responsive sidebar with file explorer allowing hosts to create, rename, and delete files.
- Resizable panel layout separating the file explorer, editor, and output/chat regions.

### Integrated Chat System
- Built-in text chat for users to communicate within a session.
- System notifications indicating when users join or leave the room.
- Participant dropdown overlay showing roles (Host vs Guest) and allowing host action overrides.

### Code Execution
- Remote code execution interface with input redirection support via standard input (stdin).
- Success outputs highlighted in green, with standard error (stderr) highlighted in red.
- Quick clear option for output consoles.

### Session & Access Control
- User authentication utilizing JWT tokens and password hashing.
- User profile screen showing historical rooms created or joined, with option to delete or clear history.
- Host privileges including session termination, and user expulsion (kick) or permanent ban from active rooms.
- Custom non-blocking modal confirmations and toast notifications replacing native web browser dialogs.

## Technologies Used

### Backend
- Node.js & Express
- Socket.io (WebSocket protocols for real-time state synchronization)
- MongoDB & Mongoose (data persistence)
- JSON Web Token (JWT) & bcrypt (authentication and security)

### Frontend
- React & Vite
- Monaco Editor (VS Code core editor engine)
- Socket.io-client
- Tailwind CSS & Vanilla CSS
- Axios (HTTP client)
- React Router DOM (client-side routing)

## Project Structure

```
Collaborative-code-editor/
├── Backend/
│   ├── models/          # Mongoose schema definitions (User, Room, Message, Code)
│   ├── routes/          # Express API route endpoints
│   ├── sockets/         # Socket.io connection handlers and room namespaces
│   ├── middleware/      # JWT auth verifying middleware
│   ├── server.js        # Server entrance and configuration
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── editor/  # Monaco editor integration, file explorer, and tab bars
    │   │   ├── layout/  # Page headers, footers, and layouts
    │   │   ├── pages/   # Editor page, Profile, Authentication screens, Home
    │   │   ├── room/    # Create room and Join room components
    │   │   └── ui/      # Shared custom modals and toast components
    │   ├── context/     # Auth and Toast context providers
    │   ├── utils/       # Axios and helper modules
    │   ├── App.jsx      # Main application router and root
    │   └── index.css    # Global stylesheet rules
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas cloud database)

### Installation & Configuration

1. Clone the repository:
   ```bash
   git clone https://github.com/VishalNarketpalli-ghub/Collaborative-code-editor.git
   cd Collaborative-code-editor
   ```

2. Setup the backend configuration:
   - Navigate to the `Backend/` directory.
   - Create a `.env` file inside the `Backend/` folder.
   - Define the following configuration variables:
     ```env
     PORT=6600
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_signature_secret
     ```
   - Install the backend dependencies:
     ```bash
     npm install
     ```

3. Setup the frontend configuration:
   - Navigate to the `Frontend/` directory.
   - Ensure the server connection endpoint configured in `src/utils/axios.js` matches the backend host port.
   - Install the frontend dependencies:
     ```bash
     npm install
     ```

### Running the Application

1. Start the Backend server:
   ```bash
   cd Backend
   npm run dev
   ```
   The backend server starts running on port `6600`.

2. Start the Frontend development server:
   ```bash
   cd Frontend
   npm run dev
   ```
   The frontend server starts running on `http://localhost:5173/`. Open this URL in your web browser.

### Building for Production

To bundle the frontend for production deployment:
```bash
cd Frontend
npm run build
```
This builds static assets into the `dist/` directory.
