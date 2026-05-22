import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// ConfirmModal -- a reusable dark-themed confirmation dialog.
//
// Replaces all browser window.confirm() calls across the app. Renders a
// centered card over a blurred backdrop with two action buttons.
//
// Props:
//   isOpen      {boolean}   -- controls visibility
//   title       {string}    -- modal heading (e.g. "End Session")
//   message     {string}    -- descriptive body text
//   confirmText {string}    -- label for the confirm button (default "Confirm")
//   cancelText  {string}    -- label for the cancel button  (default "Cancel")
//   variant     {"danger"|"default"} -- controls confirm button color
//   onConfirm   {function}  -- called when the user confirms
//   onCancel    {function}  -- called when the user cancels or presses Escape
// ---------------------------------------------------------------------------
function ConfirmModal({
    isOpen,
    title = "Confirm",
    message = "",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    onConfirm,
    onCancel,
}) {
    const confirmBtnRef = useRef(null);

    // Auto-focus the confirm button when the modal opens so the user can
    // press Enter to confirm or Tab to the Cancel button.
    useEffect(() => {
        if (isOpen && confirmBtnRef.current) {
            confirmBtnRef.current.focus();
        }
    }, [isOpen]);

    // Close on Escape key press.
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onCancel?.();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            {/* Stop click propagation so clicking inside the card does not
                trigger the backdrop's onCancel handler. */}
            <div
                className="confirm-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="confirm-modal-title">{title}</h3>
                {message && (
                    <p className="confirm-modal-msg">{message}</p>
                )}

                <div className="confirm-modal-actions">
                    <button
                        className="confirm-modal-btn confirm-modal-btn--cancel"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        className={`confirm-modal-btn confirm-modal-btn--confirm${
                            variant === "danger" ? " confirm-modal-btn--danger" : ""
                        }`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
