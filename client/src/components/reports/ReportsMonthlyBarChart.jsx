// client/src/components/reports/ReportsMonthlyBarChart.jsx
import React from "react";

function ReportsMonthlyBarChart({ data }) {
    return (
        <div className="card">
            {(!data || data.length === 0) ? (
                <p>Ushbu davr uchun savdo ma’lumotlari topilmadi.</p>
            ) : (
                <div className="report-bar-chart">
                    {data.map((item) => (
                        <div
                            key={item.sale_date}
                            className="report-bar-row"
                        >
                            <div className="report-bar-label">
                                {item.label}
                            </div>
                            <div className="report-bar">
                                <div
                                    className="report-bar-fill"
                                    style={{ width: item.width + "%" }}
                                />
                            </div>
                            <div className="report-bar-value">
                                {item.amount.toLocaleString("uz-UZ")} so‘m
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReportsMonthlyBarChart;
