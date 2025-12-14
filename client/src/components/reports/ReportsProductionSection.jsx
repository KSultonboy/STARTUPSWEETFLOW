// client/src/components/reports/ReportsProductionSection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function ReportsProductionSection({ stats }) {
    const navigate = useNavigate();

    if (!stats) return null;

    const totalQuantity = stats.productionQuantity || 0;
    const batchCount = stats.productionBatchCount || 0;

    const handleGoToHistory = () => {
        // Ishlab chiqarish tarixiga o'tkazamiz va type=production filtrini yuboramiz
        navigate("/history?type=production");
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "flex-start",
            }}
        >
            <div>
                <div
                    style={{
                        fontSize: 13,
                        opacity: 0.8,
                        marginBottom: 2,
                    }}
                >
                    Umumiy ishlab chiqarish
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {totalQuantity.toLocaleString("uz-UZ")} birlik
                </div>
                <div
                    style={{
                        fontSize: 13,
                        opacity: 0.8,
                        marginTop: 2,
                    }}
                >
                    Partiyalar soni: <strong>{batchCount} ta</strong>
                </div>
            </div>

            <button
                type="button"
                className="button-primary"
                style={{
                    boxShadow: "none",
                    paddingInline: 14,
                    fontSize: 13,
                    alignSelf: "flex-start",
                }}
                onClick={handleGoToHistory}
            >
                Ishlab chiqarish tarixini ko‘rish
            </button>
        </div>
    );
}

export default ReportsProductionSection;
