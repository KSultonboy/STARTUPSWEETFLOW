// client/src/components/reports/ReportsFilterBar.jsx
import React from "react";

const MODES = [
    { key: "day", label: "Kunlik" },
    { key: "week", label: "Haftalik" },
    { key: "month", label: "Oylik" },
    { key: "year", label: "Yillik" },
];

function ReportsFilterBar({ mode, date, onModeChange, onDateChange, onExportPdf }) {
    const currentYear = date ? date.slice(0, 4) : "2025";
    const currentMonth = date ? date.slice(0, 7) : `${currentYear}-01`;

    const handleModeClick = (m) => {
        if (m === mode) return;
        if (onModeChange) onModeChange(m);
    };

    const handleDayOrWeekChange = (e) => {
        const v = e.target.value;
        if (!v) return;
        onDateChange?.(v);
    };

    const handleMonthChange = (e) => {
        const v = e.target.value; // YYYY-MM
        if (!v) return;
        onDateChange?.(`${v}-01`);
    };

    const handleYearChange = (e) => {
        const v = e.target.value; // YYYY
        if (!v) return;
        const year = v.padStart(4, "0");
        onDateChange?.(`${year}-01-01`);
    };

    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "flex-end",
            }}
        >
            {/* Mode toggle */}
            <div
                style={{
                    display: "inline-flex",
                    borderRadius: 999,
                    padding: 2,
                    background: "rgba(15,23,42,0.8)",
                    border: "1px solid rgba(148,163,184,0.6)",
                }}
            >
                {MODES.map((m) => {
                    const active = m.key === mode;
                    return (
                        <button
                            key={m.key}
                            type="button"
                            onClick={() => handleModeClick(m.key)}
                            style={{
                                border: "none",
                                padding: "4px 10px",
                                fontSize: 12,
                                borderRadius: 999,
                                cursor: "pointer",
                                backgroundColor: active ? "#e5e7eb" : "transparent",
                                color: active ? "#0b1120" : "#e5e7eb",
                            }}
                        >
                            {m.label}
                        </button>
                    );
                })}
            </div>

            {/* Date / Month / Year input */}
            {mode === "day" || mode === "week" ? (
                <input
                    className="input"
                    type="date"
                    value={date}
                    onChange={handleDayOrWeekChange}
                    style={{ minWidth: 140 }}
                />
            ) : null}

            {mode === "month" && (
                <input
                    className="input"
                    type="month"
                    value={currentMonth}
                    onChange={handleMonthChange}
                    style={{ minWidth: 140 }}
                />
            )}

            {mode === "year" && (
                <input
                    className="input"
                    type="number"
                    min="2000"
                    max="2100"
                    value={currentYear}
                    onChange={handleYearChange}
                    style={{ minWidth: 100 }}
                />
            )}

            {/* PDF export button */}
            <button
                type="button"
                className="button-primary"
                onClick={onExportPdf}
                style={{ boxShadow: "none", paddingInline: 14, fontSize: 13 }}
            >
                PDF hisobot
            </button>
        </div>
    );
}

export default ReportsFilterBar;
