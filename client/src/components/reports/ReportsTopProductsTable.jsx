// client/src/components/reports/ReportsTopProductsTable.jsx
import React from "react";

function ReportsTopProductsTable({ topProducts }) {
    return (
        <div className="card">
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Mahsulot</th>
                            <th>Filial / Do‘kon</th>
                            <th>Soni</th>
                            <th>Summasi (so‘m)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!topProducts || topProducts.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center" }}>
                                    Ushbu davr uchun savdo topilmadi.
                                </td>
                            </tr>
                        ) : (
                            topProducts.map((item, index) => (
                                <tr
                                    key={item.product_id + "-" + index}
                                >
                                    <td>{index + 1}</td>
                                    <td>{item.product_name}</td>
                                    <td>{item.branch_name || "—"}</td>
                                    <td>{item.sold_quantity}</td>
                                    <td>
                                        {(item.total_amount || 0).toLocaleString(
                                            "uz-UZ"
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ReportsTopProductsTable;
