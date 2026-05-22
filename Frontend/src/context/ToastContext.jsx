import { createContext, useContext, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// ToastContext -- provides a global showToast() function accessible from any
// component without prop-drilling.
//
// Usage:
//   const { showToast } = useToast();
//   showToast("Something happened", "error");   // types: "info" | "error" | "success"
//
// The toast auto-dismisses after 4 seconds. Only one toast is shown at a time;
// a new toast replaces the previous one.
// ---------------------------------------------------------------------------

const ToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within a <ToastProvider>");
    }
    return ctx;
}

export function ToastProvider({ children }) {
    // toast shape: { message: string, type: "info"|"error"|"success" } | null
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = "info") => {
        setToast({ message, type });

        // Auto-dismiss after 4 seconds. If another toast fires before this
        // timer, the old timer is harmless since setToast(null) on a stale
        // value is a no-op visually (the new toast replaced it already).
        setTimeout(() => {
            setToast((prev) => {
                // Only clear if this is the same toast (avoids clearing a
                // newer toast that appeared while the timer was pending).
                if (prev && prev.message === message) return null;
                return prev;
            });
        }, 4000);
    }, []);

    const dismissToast = useCallback(() => setToast(null), []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Render the toast at the top of the viewport. Uses the same
                visual style as the EditorPage notification banner. */}
            {toast && (
                <div className={`global-toast global-toast--${toast.type}`}>
                    {toast.message}
                    <button
                        className="global-toast-close"
                        onClick={dismissToast}
                    >
                        x
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
}
