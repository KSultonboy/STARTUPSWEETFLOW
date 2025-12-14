// client/src/components/reports/ReportsSalesByBranchTable.jsx
import React, { useMemo } from "react";

/**
 * props:
 *  - salesByBranch
 *  - outletTransfersByBranch
 *  - returnsByBranchToday
 *  - cashByBranchPeriod: [{ branch_id, branch_name, branch_type, total_amount }]
 *  - locationTypeLabel
 */
function ReportsSalesByBranchTable({
    salesByBranch = [],
    outletTransfersByBranch = [],
    returnsByBranchToday = [],
    cashByBranchPeriod = [],
    locationTypeLabel,
}) {
    const rows = useMemo(() => {
        const map = new Map();

        (salesByBranch || []).forEach((row) => {
            const id = row.branch_id ?? "null";
            const existing = map.get(id) || {
                branch_id: row.branch_id,
                branch_name: row.branch_name || "—",
                branch_type: row.branch_type || "BRANCH",
                sale_count: 0,
                sales_amount: 0,
                transfer_amount: 0,
                returns_amount: 0,
                cash_received: 0,
            };
            existing.sale_count = (existing.sale_count || 0) + (row.sale_count || 0);
            existing.sales_amount = (existing.sales_amount || 0) + (row.total_amount || 0);
            map.set(id, existing);
        });

        (outletTransfersByBranch || []).forEach((row) => {
            const id = row.branch_id ?? "null";
            const existing = map.get(id) || {
                branch_id: row.branch_id,
                branch_name: row.branch_name || "—",
                branch_type: row.branch_type || "OUTLET",
                sale_count: 0,
                sales_amount: 0,
                transfer_amount: 0,
                returns_amount: 0,
                cash_received: 0,
            };
            existing.transfer_amount = (existing.transfer_amount || 0) + (row.total_amount || 0);
            map.set(id, existing);
        });

        (returnsByBranchToday || []).forEach((row) => {
            const id = row.branch_id ?? "null";
            const existing = map.get(id) || {
                branch_id: row.branch_id,
                branch_name: row.branch_name || "—",
                branch_type: row.branch_type || "BRANCH",
                sale_count: 0,
                sales_amount: 0,
                transfer_amount: 0,
                returns_amount: 0,
                cash_received: 0,
            };
            existing.returns_amount = (existing.returns_amount || 0) + (row.total_amount || 0);
            map.set(id, existing);
        });

        (cashByBranchPeriod || []).forEach((row) => {
            const id = row.branch_id ?? "null";
            const existing = map.get(id) || {
                branch_id: row.branch_id,
                branch_name: row.branch_name || "—",
                branch_type: row.branch_type || "BRANCH",
                sale_count: 0,
                sales_amount: 0,
                transfer_amount: 0,
                returns_amount: 0,
                cash_received: 0,
            };
            existing.cash_received = (existing.cash_received || 0) + (row.total_amount || 0);
            map.set(id, existing);
        });

        const result = Array.from(map.values());

        result.sort((a, b) => {
            const typeA = String(a.branch_type || "BRANCH").toUpperCase();
            const typeB = String(b.branch_type || "BRANCH").toUpperCase();
            const incomeA = (typeA === "OUTLET" ? a.transfer_amount : a.sales_amount) || 0;
            const incomeB = (typeB === "OUTLET" ? b.transfer_amount : b.sales_amount) || 0;
            return incomeB - incomeA;
        });

        return result;
    }, [salesByBranch, outletTransfersByBranch, returnsByBranchToday, cashByBranchPeriod]);

    return (
        <div className="table-wrapper">
            <table className="table" style={{ minWidth: 980 }}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Filial / do‘kon</th>
                        <th>Cheklar soni</th>
                        <th>Daromad (so‘m)</th>
                        <th>Olingan pul (so‘m)</th>
                        <th>Vazvrat (so‘m)</th>
                        <th>Qarz (so‘m)</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center" }}>
                                Ushbu sana uchun savdo topilmadi.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, index) => {
                            const type = String(row.branch_type || "BRANCH").toUpperCase();
                            const isOutlet = type === "OUTLET";

                            const income = isOutlet ? row.transfer_amount || 0 : row.sales_amount || 0;
                            const received = row.cash_received || 0;
                            const returnsAmount = row.returns_amount || 0;

                            // ✅ YANGI FORMULA:
                            const debt = income - returnsAmount - received;

                            return (
                                <tr key={(row.branch_id || "null") + "-" + index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <div>{row.branch_name || "—"}</div>
                                        <div style={{ fontSize: 11, opacity: 0.7 }}>
                                            {locationTypeLabel ? locationTypeLabel(type) : type}
                                        </div>
                                    </td>
                                    <td>{isOutlet ? "—" : (row.sale_count || 0).toLocaleString("uz-UZ")}</td>
                                    <td>{income.toLocaleString("uz-UZ")}</td>
                                    <td>{received.toLocaleString("uz-UZ")}</td>
                                    <td>{returnsAmount.toLocaleString("uz-UZ")}</td>
                                    <td>{debt.toLocaleString("uz-UZ")}</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default ReportsSalesByBranchTable;
