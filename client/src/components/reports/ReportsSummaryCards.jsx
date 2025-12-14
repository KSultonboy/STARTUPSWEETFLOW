// client/src/components/reports/ReportsSummaryCards.jsx
import React from "react";

/**
 * cards: [
 *   {
 *     key: string,
 *     title: string,
 *     value: string,
 *     subtitle?: string,
 *     rawValue?: number,
 *     clickable?: boolean,
 *   }
 * ]
 */
function ReportsSummaryCards({ cards = [], onCardClick }) {
    if (!cards || cards.length === 0) return null;

    const firstEight = cards.slice(0, 8);
    const nextTwo = cards.slice(8, 10);
    const last = cards[10];

    const handleClick = (card) => {
        if (!card.clickable || !onCardClick) return;
        onCardClick(card);
    };

    const getProfitStyles = (card) => {
        if (card.key !== "profit") return {};

        const v = Number(card.rawValue || 0);
        let background = "";
        let borderColor = "";
        let color = "#0f172a";

        if (v < 0) {
            background = "linear-gradient(135deg, #7f1d1d, #b91c1c)";
            borderColor = "#fecaca";
            color = "#fef2f2";
        } else if (v <= 50000000) {
            background = "linear-gradient(135deg, #78350f, #ca8a04)";
            borderColor = "#facc15";
            color = "#fefce8";
        } else {
            background = "linear-gradient(135deg, #14532d, #16a34a)";
            borderColor = "#4ade80";
            color = "#ecfdf5";
        }

        return {
            background,
            border: `1px solid ${borderColor}`,
            color,
        };
    };

    const renderCardInner = (card) => {
        const clickable = !!card.clickable;
        const profitStyles = getProfitStyles(card);

        return (
            <div
                className="card"
                style={{
                    cursor: clickable ? "pointer" : "default",
                    transition: "transform 0.12s ease, box-shadow 0.12s ease",
                    ...profitStyles,
                }}
                onClick={() => handleClick(card)}
                onMouseEnter={(e) => {
                    if (!clickable && card.key !== "profit") return;
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                        "0 12px 25px rgba(15,23,42,0.35)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "";
                }}
            >
                <div className="card-title">{card.title}</div>
                <div className="card-value">{card.value}</div>
                {card.subtitle && (
                    <div className="card-subtitle">{card.subtitle}</div>
                )}
                {card.key === "profit" && (
                    <div
                        style={{
                            marginTop: 6,
                            fontSize: 12,
                            opacity: 0.9,
                        }}
                    >
                        Sof foyda holati
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* 1–8: grid 4x2 */}
            {firstEight.length > 0 && (
                <div className="card-grid card-grid-4">
                    {firstEight.map((card) => (
                        <div key={card.key}>{renderCardInner(card)}</div>
                    ))}
                </div>
            )}

            {/* 9–10: 50% / 50% */}
            {nextTwo.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    {nextTwo.map((card) => (
                        <div
                            key={card.key}
                            style={{ flex: "1 1 50%", minWidth: 0 }}
                        >
                            {renderCardInner(card)}
                        </div>
                    ))}
                </div>
            )}

            {/* 11: full-width profit */}
            {last && (
                <div style={{ width: "100%" }}>{renderCardInner(last)}</div>
            )}
        </div>
    );
}

export default ReportsSummaryCards;
