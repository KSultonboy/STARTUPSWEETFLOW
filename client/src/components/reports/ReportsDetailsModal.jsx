// client/src/components/reports/ReportsDetailsModal.jsx
import React from "react";

function ReportsDetailsModal({ open, title, onClose, children, maxWidth = 800 }) {
    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.65)",
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "#020617",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.5)",
                    maxWidth,
                    width: "100%",
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid rgba(30,64,175,0.6)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "#e5e7eb",
                            fontSize: 18,
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div
                    style={{
                        padding: 12,
                        overflowY: "auto",
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

export default ReportsDetailsModal;
