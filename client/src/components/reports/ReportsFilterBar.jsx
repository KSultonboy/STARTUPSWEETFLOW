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

    return (
        <div className="filterbar">
            <div className="filterbar__group filterbar__group--modes">
                {MODES.map((m) => {
                    const active = m.key === mode;
                    return (
                        <button
                            key={m.key}
                            type="button"
                            onClick={() => onModeChange?.(m.key)}
                            className={`filterbar__mode ${active ? "is-active" : ""}`}
                        >
                            {m.label}
                        </button>
                    );
                })}
            </div>

            <div className="filterbar__group filterbar__group--inputs">
                {(mode === "day" || mode === "week") && (
                    <input
                        className="input"
                        type="date"
                        value={date}
                        onChange={(e) => onDateChange?.(e.target.value)}
                    />
                )}

                {mode === "month" && (
                    <input
                        className="input"
                        type="month"
                        value={currentMonth}
                        onChange={(e) => onDateChange?.(`${e.target.value}-01`)}
                    />
                )}

                {mode === "year" && (
                    <input
                        className="input"
                        type="number"
                        min="2000"
                        max="2100"
                        value={currentYear}
                        onChange={(e) => onDateChange?.(`${String(e.target.value).padStart(4, "0")}-01-01`)}
                    />
                )}

                <button type="button" className="button-primary filterbar__btn" onClick={onExportPdf}>
                    PDF hisobot
                </button>
            </div>
        </div>
    );
}

export default ReportsFilterBar;
