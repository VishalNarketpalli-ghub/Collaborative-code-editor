import { useState, useRef, useEffect } from "react";
import API from "../../utils/axios";
import { getSocket } from "../../socket-files/socket";

// ---------------------------------------------------------------------------
// File-extension icon mapping — returns an SVG colour class
// ---------------------------------------------------------------------------
const EXT_COLORS = {
    js:   "#f7df1e",
    jsx:  "#61dafb",
    ts:   "#3178c6",
    tsx:  "#61dafb",
    py:   "#3572a5",
    java: "#b07219",
    cpp:  "#f34b7d",
    c:    "#555555",
    cs:   "#178600",
    go:   "#00add8",
    rs:   "#dea584",
    rb:   "#701516",
    html: "#e34c26",
    css:  "#563d7c",
    json: "#cbcb41",
    md:   "#083fa1",
    sh:   "#89e051",
    sql:  "#e38c00",
    xml:  "#0060ac",
    yaml: "#cb171e",
    yml:  "#cb171e",
};

function fileExtColor(filename) {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return EXT_COLORS[ext] || "#9ca3af";
}

// Small file icon SVG
function FileIcon({ filename }) {
    const color = fileExtColor(filename);
    return (
        <svg
            width="14"
            height="16"
            viewBox="0 0 14 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
        >
            <path
                d="M2 1h7l3 3v11H2V1z"
                fill="#1e2433"
                stroke={color}
                strokeWidth="1.2"
            />
            <path d="M9 1v3h3" stroke={color} strokeWidth="1.2" fill="none" />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// FileExplorer component
//
// Props:
//   roomId      {string}   — the room identifier
//   files       {Array}    — list of { _id, filename, language, ... }
//   activeFile  {string}   — currently active filename
//   isHost      {boolean}  — controls whether CRUD controls are visible
//   onFileSelect(filename) — called when the user clicks a file
//   onFilesChange(files)   — called with the updated file list after mutation
//   maxFiles    {number}   — cap enforced by the server (default 10)
// ---------------------------------------------------------------------------
function FileExplorer({
    roomId,
    files,
    activeFile,
    isHost,
    onFileSelect,
    onFilesChange,
    maxFiles = 10,
}) {
    const [isCreating, setIsCreating] = useState(false);
    const [newFilename, setNewFilename] = useState("");
    const [renamingFile, setRenamingFile] = useState(null); // filename being renamed
    const [renameValue, setRenameValue] = useState("");
    const [error, setError] = useState("");

    const newFileInputRef = useRef(null);
    const renameInputRef = useRef(null);

    // Auto-focus the new-file input when the creation form appears.
    useEffect(() => {
        if (isCreating) {
            newFileInputRef.current?.focus();
        }
    }, [isCreating]);

    // Auto-focus the rename input when renaming starts.
    useEffect(() => {
        if (renamingFile) {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        }
    }, [renamingFile]);

    const clearError = () => setError("");

    // -- Create --
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const name = newFilename.trim();
        if (!name) return;

        try {
            const { data: file } = await API.post(`/code/${roomId}/file`, { filename: name });

            const updated = [...files, file];
            onFilesChange(updated);

            // Broadcast the new file to all other participants.
            getSocket().emit("file_created", { roomId, file });

            // Open the newly created file immediately.
            onFileSelect(file.filename);

            setNewFilename("");
            setIsCreating(false);
            clearError();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create file");
        }
    };

    const handleCreateKeyDown = (e) => {
        if (e.key === "Escape") {
            setIsCreating(false);
            setNewFilename("");
            clearError();
        }
    };

    // -- Delete --
    const handleDelete = async (filename, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return;

        try {
            await API.delete(`/code/${roomId}/file/${encodeURIComponent(filename)}`);

            const updated = files.filter((f) => f.filename !== filename);
            onFilesChange(updated);

            // Notify peers.
            getSocket().emit("file_deleted", { roomId, filename });

            // If the deleted file was active, switch to the first remaining file.
            if (activeFile === filename && updated.length > 0) {
                onFileSelect(updated[0].filename);
            } else if (updated.length === 0) {
                onFileSelect(null);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete file");
        }
    };

    // -- Rename --
    const startRename = (filename, e) => {
        e.stopPropagation();
        setRenamingFile(filename);
        setRenameValue(filename);
        clearError();
    };

    const handleRenameSubmit = async (e) => {
        e?.preventDefault();
        const newName = renameValue.trim();

        if (!newName || newName === renamingFile) {
            setRenamingFile(null);
            return;
        }

        try {
            const { data } = await API.patch(
                `/code/${roomId}/file/${encodeURIComponent(renamingFile)}/rename`,
                { newName }
            );

            const updatedFile = data.file;
            const updated = files.map((f) =>
                f.filename === renamingFile ? { ...f, ...updatedFile } : f
            );
            onFilesChange(updated);

            // Notify peers.
            getSocket().emit("file_renamed", {
                roomId,
                oldName: renamingFile,
                newName: updatedFile.filename,
                newLanguage: updatedFile.language,
            });

            // If the renamed file is active, update the active filename.
            if (activeFile === renamingFile) {
                onFileSelect(updatedFile.filename);
            }

            setRenamingFile(null);
            clearError();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to rename file");
        }
    };

    const handleRenameKeyDown = (e) => {
        if (e.key === "Enter") handleRenameSubmit();
        if (e.key === "Escape") setRenamingFile(null);
    };

    const atLimit = files.length >= maxFiles;

    return (
        <div className="file-explorer">
            {/* Header */}
            <div className="fe-header">
                <span className="fe-title">Files</span>
                {isHost && (
                    <button
                        className="fe-new-btn"
                        onClick={() => {
                            if (atLimit) {
                                setError(`Max ${maxFiles} files per room`);
                                return;
                            }
                            clearError();
                            setIsCreating(true);
                        }}
                        title="New file"
                        disabled={atLimit}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="fe-error" onClick={clearError}>
                    {error}
                </div>
            )}

            {/* File list */}
            <div className="fe-list">
                {files.map((file) => (
                    <div
                        key={file._id || file.filename}
                        className={`fe-item${activeFile === file.filename ? " fe-item--active" : ""}`}
                        onClick={() => onFileSelect(file.filename)}
                        title={file.filename}
                    >
                        <FileIcon filename={file.filename} />

                        {renamingFile === file.filename ? (
                            // Inline rename input
                            <input
                                ref={renameInputRef}
                                className="fe-rename-input"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={handleRenameKeyDown}
                                onBlur={handleRenameSubmit}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="fe-filename">{file.filename}</span>
                        )}

                        {/* Host-only action icons (rename + delete) */}
                        {isHost && renamingFile !== file.filename && (
                            <div className="fe-actions">
                                <button
                                    className="fe-action-btn"
                                    title="Rename"
                                    onClick={(e) => startRename(file.filename, e)}
                                >
                                    {/* Pencil icon */}
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button
                                    className="fe-action-btn fe-action-btn--delete"
                                    title="Delete"
                                    onClick={(e) => handleDelete(file.filename, e)}
                                >
                                    {/* Trash icon */}
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {/* New-file creation form */}
                {isCreating && (
                    <form
                        className="fe-create-form"
                        onSubmit={handleCreateSubmit}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FileIcon filename={newFilename || "file"} />
                        <input
                            ref={newFileInputRef}
                            className="fe-create-input"
                            value={newFilename}
                            onChange={(e) => setNewFilename(e.target.value)}
                            onKeyDown={handleCreateKeyDown}
                            placeholder="filename.js"
                        />
                    </form>
                )}

                {/* Empty state */}
                {files.length === 0 && !isCreating && (
                    <div className="fe-empty">
                        {isHost
                            ? "No files yet. Click + to create one."
                            : "Waiting for host to create files."}
                    </div>
                )}
            </div>

            {/* File count indicator */}
            {files.length > 0 && (
                <div className="fe-footer">
                    {files.length} / {maxFiles} files
                </div>
            )}
        </div>
    );
}

export default FileExplorer;
