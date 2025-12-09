// client/src/pages/HistoryPage.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatTypeLabel(type) {
    if (!type) return "—";
    switch (type) {
        case "sales":
            return "Sotuv";
        case "transfer":
            return "Transfer";
        case "production":
            return "Ishlab chiqarish";
        case "return":
            return "Vazvrat";
        default:
            return type;
    }
}

function formatAmount(amount) {
    if (amount == null) return "—";
    const num = Number(amount);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString("uz-UZ") + " so‘m";
}

function HistoryPage() {
    const { user } = useAuth(); // { id, role, branch_id, branch_name }

    const isAdmin = user?.role === "admin";
    const isProduction = user?.role === "production";
    const isSales = user?.role === "sales";

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Admin filter states
    const [typeFilter, setTypeFilter] = useState("all");
    const [branchFilter, setBranchFilter] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const loadHistory = async () => {
        try {
            setLoading(true);

            const params = {};

            if (isAdmin) {
                if (typeFilter !== "all") params.type = typeFilter;
                if (branchFilter !== "all") params.branch_id = branchFilter;
                if (fromDate) params.from = fromDate;
                if (toDate) params.to = toDate;
            }

            if (isProduction) {
                params.type = "production";
            }

            if (isSales) {
                params.type = "sales";
                params.branch_id = user.branch_id;
            }

            const res = await api.get("/history/activities", { params });
            setItems(res.data || []);
        } catch (err) {
            console.error("History load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typeFilter, branchFilter, fromDate, toDate]);

    return (
        <div className="page">
            <h1 className="page-title">Umumiy tarix</h1>

            {/* ADMIN FILTERLAR */}
            {isAdmin && (
                <div
                    className="filters"
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 12,
                    }}
                >
                    <select
                        className="input"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">Turlar: barchasi</option>
                        <option value="sales">Sotuv</option>
                        <option value="transfer">Transfer</option>
                        <option value="production">Ishlab chiqarish</option>
                        <option value="return">Vazvrat</option>
                    </select>

                    {/* Agar sendan branchlar ro‘yxatini olish kerak bo‘lsa,
              keyin alohida branchlar API’sidan yuklab, shu yerda map qilamiz.
              Hozircha filter strukturasi tayyor tursin. */}
                    <select
                        className="input"
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                    >
                        <option value="all">Filiallar: barchasi</option>
                        {/* <option value="1">Chilonzor</option> ... */}
                    </select>

                    <input
                        type="date"
                        className="input"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />

                    <input
                        type="date"
                        className="input"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />

                    <button className="btn btn-primary" onClick={loadHistory}>
                        Yangilash
                    </button>
                </div>
            )}

            {isProduction && (
                <p className="info">
                    Siz ishlab chiqarish bo‘limi xodimisiz. Faqat ishlab chiqarish tarixi
                    ko‘rinadi.
                </p>
            )}

            {isSales && (
                <p className="info">
                    Siz <b>{user.branch_name}</b> filialining sotuvlarini ko‘ryapsiz.
                </p>
            )}

            {/* TARIX JADVALI */}
            <div className="card" style={{ marginTop: 20 }}>
                <div className="table-wrapper">
                    {loading ? (
                        <p>Yuklanmoqda...</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Sana</th>
                                    <th>Turi</th>
                                    <th>Filial / Yo‘nalish</th>
                                    <th>Izoh</th>
                                    <th>Summasi</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center" }}>
                                            Ma’lumot topilmadi
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((row, i) => (
                                        <tr key={`${row.type}-${row.id}-${row.activity_date}`}>
                                            <td>{i + 1}</td>
                                            <td>{row.activity_date}</td>
                                            <td>{formatTypeLabel(row.type)}</td>
                                            <td>{row.branch_name || "—"}</td>
                                            <td>{row.description || "—"}</td>
                                            <td>{formatAmount(row.amount)}</td>
                                            <td>{row.status || "—"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HistoryPage;
