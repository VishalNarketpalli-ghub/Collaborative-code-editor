// TabBar.jsx
// Renders a VS Code-style tab row above the Monaco editor.
// Each open file gets a tab; clicking switches the active file.
// Non-host users can switch tabs but cannot create or delete files.

function TabBar({ files, activeFile, onTabClick }) {
    if (!files || files.length === 0) return null;

    return (
        <div className="tab-bar">
            {files.map((file) => {
                const isActive = file.filename === activeFile;
                return (
                    <button
                        key={file._id || file.filename}
                        className={`tab-item${isActive ? " tab-item--active" : ""}`}
                        onClick={() => onTabClick(file.filename)}
                        title={file.filename}
                    >
                        {/* Coloured language dot */}
                        <span
                            className="tab-lang-dot"
                            style={{ background: langDotColor(file.language) }}
                        />
                        <span className="tab-label">{file.filename}</span>

                        {/* Active-tab underline indicator rendered via CSS */}
                    </button>
                );
            })}
        </div>
    );
}

// Maps Monaco language identifiers to small accent colours for the tab dot.
function langDotColor(language) {
    const MAP = {
        javascript: "#f7df1e",
        typescript: "#3178c6",
        python:     "#3572a5",
        java:       "#b07219",
        cpp:        "#f34b7d",
        c:          "#555555",
        csharp:     "#178600",
        go:         "#00add8",
        rust:       "#dea584",
        ruby:       "#701516",
        html:       "#e34c26",
        css:        "#563d7c",
        json:       "#cbcb41",
        markdown:   "#083fa1",
        shell:      "#89e051",
        sql:        "#e38c00",
        plaintext:  "#6b7280",
    };
    return MAP[language] || "#6b7280";
}

export default TabBar;
