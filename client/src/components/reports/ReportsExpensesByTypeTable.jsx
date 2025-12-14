// client/src/components/reports/ReportsExpensesByTypeTable.jsx
import React from "react";

function ReportsExpensesByTypeTable({ expensesByType, expenseTypeLabel }) {
    return (
        <div className="card">
            {!expensesByType || expensesByType.length === 0 ? (
                <p>Ushbu davr uchun xarajatlar topilmadi.</p>
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Turi</th>
                                <th>Summasi (so‘m)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expensesByType.map((row, index) => (
                                <tr key={row.expense_type || index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        {expenseTypeLabel(row.expense_type)}
                                    </td>
                                    <td>
                                        {(row.total_amount || 0).toLocaleString(
                                            "uz-UZ"
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ReportsExpensesByTypeTable;
