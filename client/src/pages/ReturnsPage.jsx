// client/src/pages/ReturnsPage.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function statusBadgeClass(status) {
    switch (status) {
        case "PENDING":
            return "badge-warning";
        case "APPROVED":
            return "badge-success";
        case "CANCELED":
            return "badge-danger";
        default:
            return "badge-secondary";
    }
}

function statusLabel(status) {
    switch (status) {
        case "PENDING":
            return "Kutilmoqda";
        case "APPROVED":
            return "Qabul qilingan";
        case "CANCELED":
            return "Bekor qilingan";
        default:
            return status || "—";
    }
}

function ReturnsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const isBranch = user?.role === "branch";

    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);

    // Forma (branch uchun)
    const [date, setDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [comment, setComment] = useState("");
    const [items, setItems] = useState([
        { product_id: "", quantity: "", unit: "", reason: "" },
    ]);

    // Ro'yxat
    const [list, setList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Admin filterlari
    const [branchFilter, setBranchFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Detal (admin uchun)
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [approving, setApproving] = useState(false);
    const [itemActionLoading, setItemActionLoading] = useState(false);

    const loadBranches = async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get("/branches");
            setBranches(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await api.get("/products");
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadReturns = async () => {
        try {
            setLoadingList(true);
            setError("");

            const params = { limit: 50, offset: 0 };

            if (isAdmin) {
                if (branchFilter !== "all") params.branch_id = branchFilter;
                if (statusFilter && statusFilter !== "all")
                    params.status = statusFilter;
                if (dateFrom) params.date_from = dateFrom;
                if (dateTo) params.date_to = dateTo;
            }

            const res = await api.get("/returns", { params });
            setList(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Vazvratlar ro‘yxatini yuklashda xatolik.");
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        loadProducts();
        loadBranches();
    }, []);

    useEffect(() => {
        loadReturns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchFilter, statusFilter, dateFrom, dateTo]);

    const handleItemChange = (index, field, value) => {
        setItems((prev) => {
            const copy = [...prev];
            const row = { ...copy[index], [field]: value };

            if (field === "product_id") {
                const product = products.find(
                    (p) => String(p.id) === String(value)
                );
                row.unit = product?.unit || "";
            }

            copy[index] = row;
            return copy;
        });
    };

    const addRow = () => {
        setItems((prev) => [
            ...prev,
            { product_id: "", quantity: "", unit: "", reason: "" },
        ]);
    };

    const removeRow = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!isBranch) {
            setError("Vazvratni faqat filial xodimi kiritadi.");
            return;
        }

        if (!user?.branch_id) {
            setError(
                "Profilga filial biriktirilmagan. Iltimos, admin bilan bog‘laning."
            );
            return;
        }

        if (items.length === 0) {
            setError("Kamida bitta mahsulot kiriting.");
            return;
        }

        const preparedItems = [];
        for (const it of items) {
            if (!it.product_id || !it.quantity) continue;
            preparedItems.push({
                product_id: Number(it.product_id),
                quantity: Number(it.quantity),
                unit: it.unit || "",
                reason: it.reason || "",
            });
        }

        if (preparedItems.length === 0) {
            setError("Kamida bitta to‘liq mahsulot qatori kiriting.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                date,
                comment: comment || "",
                items: preparedItems,
                branch_id: user.branch_id || null,
            };

            await api.post("/returns", payload);

            setSuccess("Vazvrat so‘rovi yuborildi. Admin tasdiqlashi kerak.");
            setItems([{ product_id: "", quantity: "", unit: "", reason: "" }]);
            setComment("");
            await loadReturns();
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Vazvratni saqlashda xatolik.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const openDetail = async (row) => {
        if (!isAdmin) return;
        setSelectedReturn(null);
        setLoadingDetail(true);
        setError("");
        try {
            const res = await api.get(`/returns/${row.id}`);
            setSelectedReturn(res.data);
        } catch (err) {
            console.error(err);
            setError("Qaytish ma’lumotini yuklashda xatolik.");
        } finally {
            setLoadingDetail(false);
        }
    };

    const reloadDetail = async (id) => {
        try {
            const res = await api.get(`/returns/${id}`);
            setSelectedReturn(res.data);
        } catch (err) {
            console.error(err);
            setError("Qaytish ma’lumotini qayta yuklashda xatolik.");
        }
    };

    const approveSelected = async () => {
        if (!selectedReturn) return;
        setApproving(true);
        setError("");
        try {
            await api.post(`/returns/${selectedReturn.header.id}/approve`);
            setSuccess("Barcha kutilayotgan mahsulotlar qabul qilindi.");
            setSelectedReturn(null);
            await loadReturns();
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Vazvratni tasdiqlashda xatolik.";
            setError(msg);
        } finally {
            setApproving(false);
        }
    };

    const approveItem = async (item) => {
        if (!selectedReturn) return;
        setItemActionLoading(true);
        setError("");
        try {
            await api.post(
                `/returns/${selectedReturn.header.id}/items/${item.id}/approve`
            );
            setSuccess("Mahsulot qabul qilindi.");
            await reloadDetail(selectedReturn.header.id);
            await loadReturns();
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Mahsulotni tasdiqlashda xatolik.";
            setError(msg);
        } finally {
            setItemActionLoading(false);
        }
    };

    const cancelItem = async (item) => {
        if (!selectedReturn) return;
        setItemActionLoading(true);
        setError("");
        try {
            await api.post(
                `/returns/${selectedReturn.header.id}/items/${item.id}/cancel`
            );
            setSuccess("Mahsulot vazvrati bekor qilindi.");
            await reloadDetail(selectedReturn.header.id);
            await loadReturns();
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Mahsulotni bekor qilishda xatolik.";
            setError(msg);
        } finally {
            setItemActionLoading(false);
        }
    };

    const pageTitle = isAdmin
        ? "Vazvratlar (filiallardan kelayotgan qaytishlar)"
        : "Vazvratlar (markaziy omborga qaytarish)";

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{pageTitle}</h1>
                    <p className="page-subtitle">
                        Transfer: markaziy ombordan filiallarga jo‘natish. <br />
                        Vazvrat: filiallardan markaziy omborga qaytarish.
                    </p>
                </div>

                {isAdmin && (
                    <div className="page-header-actions" style={{ gap: 8 }}>
                        <select
                            className="input"
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                        >
                            <option value="all">Barcha filiallar</option>
                            {branches
                                .filter((b) => b.is_active !== 0)
                                .map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                        </select>

                        <select
                            className="input"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="PENDING">Faqat kutilayotgan</option>
                            <option value="APPROVED">Faqat qabul qilingan</option>
                            <option value="CANCELED">Faqat bekor qilingan</option>
                            <option value="all">Barchasi</option>
                        </select>

                        <input
                            className="input"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <input
                            className="input"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {error && (
                <div className="info-box info-box--error" style={{ marginBottom: 8 }}>
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="info-box info-box--success"
                    style={{ marginBottom: 8 }}
                >
                    {success}
                </div>
            )}

            {/* Filial uchun forma */}
            {isBranch && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                        <div>
                            <div className="card-title">Yangi vazvrat kiritish</div>
                            <div className="card-subtitle">
                                {user?.branch_name || "Filial"} ➜ Markaziy ombor
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Sana</label>
                                <input
                                    className="input"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Izoh (ixtiyoriy)</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Masalan: yaroqlilik muddati, noto‘g‘ri kelgan mahsulot..."
                                />
                            </div>
                        </div>

                        <div className="table-wrapper" style={{ marginTop: 16 }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Mahsulot</th>
                                        <th>Miqdor</th>
                                        <th>O‘lchov</th>
                                        <th>Sabab / Izoh</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((row, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <select
                                                    className="input"
                                                    value={row.product_id}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            index,
                                                            "product_id",
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">Tanlang...</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    className="input"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={row.quantity}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            index,
                                                            "quantity",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="input"
                                                    type="text"
                                                    value={row.unit}
                                                    onChange={(e) =>
                                                        handleItemChange(index, "unit", e.target.value)
                                                    }
                                                    placeholder="kg / dona ..."
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="input"
                                                    type="text"
                                                    value={row.reason}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            index,
                                                            "reason",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Sabab (ixtiyoriy)"
                                                />
                                            </td>
                                            <td>
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-small btn-danger"
                                                        onClick={() => removeRow(index)}
                                                        disabled={saving}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div
                            className="form-actions"
                            style={{ marginTop: 12, display: "flex", gap: 8 }}
                        >
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={addRow}
                                disabled={saving}
                            >
                                + Qator qo‘shish
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? "Yuborilmoqda..." : "Vazvratni yuborish"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Ro'yxat – admin va branch uchun umumiy */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">
                            {isAdmin
                                ? "Filiallardan kelayotgan vazvratlar"
                                : "Mening vazvratlarim"}
                        </div>
                        <div className="card-subtitle">
                            So‘nggi yuborilgan va qabul qilingan qaytishlar.
                        </div>
                    </div>
                </div>

                {loadingList ? (
                    <p>Yuklanmoqda...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Sana</th>
                                    <th>Filial</th>
                                    <th>Bandlar</th>
                                    <th>Umumiy miqdor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center" }}>
                                            Hali vazvrat yo‘q.
                                        </td>
                                    </tr>
                                ) : (
                                    list.map((row, index) => (
                                        <tr
                                            key={row.id}
                                            onClick={() => openDetail(row)}
                                            style={{
                                                cursor: isAdmin ? "pointer" : "default",
                                            }}
                                        >
                                            <td>{index + 1}</td>
                                            <td>{row.return_date}</td>
                                            <td>{row.branch_name || "—"}</td>
                                            <td>{row.item_count}</td>
                                            <td>{row.total_quantity}</td>
                                            <td>
                                                <span
                                                    className={`badge ${statusBadgeClass(row.status)}`}
                                                >
                                                    {statusLabel(row.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Admin uchun detal panel / modal */}
            {isAdmin && selectedReturn && (
                <div className="drawer drawer-right">
                    <div
                        className="drawer-backdrop"
                        onClick={() => setSelectedReturn(null)}
                    />
                    <div className="drawer-content">
                        <div className="drawer-header">
                            <h2 className="drawer-title">
                                Vazvrat #{selectedReturn.header.id}
                            </h2>
                            <button
                                className="btn btn-small btn-secondary"
                                onClick={() => setSelectedReturn(null)}
                            >
                                Yopish
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p>Yuklanmoqda...</p>
                        ) : (
                            <>
                                <div className="drawer-section">
                                    <div>
                                        <b>Sana:</b> {selectedReturn.header.return_date}
                                    </div>
                                    <div>
                                        <b>Filial:</b>{" "}
                                        {selectedReturn.header.branch_name || "—"}
                                    </div>
                                    <div>
                                        <b>Status:</b>{" "}
                                        <span
                                            className={`badge ${statusBadgeClass(
                                                selectedReturn.header.status
                                            )}`}
                                        >
                                            {statusLabel(selectedReturn.header.status)}
                                        </span>
                                    </div>
                                    <div>
                                        <b>Izoh:</b>{" "}
                                        {selectedReturn.header.comment || "—"}
                                    </div>
                                </div>

                                <div className="drawer-section">
                                    <h3>Mahsulotlar</h3>
                                    <div className="table-wrapper">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Mahsulot</th>
                                                    <th>Miqdor</th>
                                                    <th>O‘lchov</th>
                                                    <th>Sabab</th>
                                                    <th>Status</th>
                                                    <th>Amallar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedReturn.items.map((it, idx) => (
                                                    <tr key={it.id}>
                                                        <td>{idx + 1}</td>
                                                        <td>{it.product_name}</td>
                                                        <td>{it.quantity}</td>
                                                        <td>{it.unit || "—"}</td>
                                                        <td>{it.reason || "—"}</td>
                                                        <td>
                                                            <span
                                                                className={`badge ${statusBadgeClass(
                                                                    it.status
                                                                )}`}
                                                            >
                                                                {statusLabel(it.status)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {selectedReturn.header.status === "PENDING" &&
                                                                it.status === "PENDING" && (
                                                                    <div
                                                                        style={{
                                                                            display: "flex",
                                                                            gap: 6,
                                                                            flexWrap: "wrap",
                                                                        }}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-small btn-primary"
                                                                            onClick={() => approveItem(it)}
                                                                            disabled={itemActionLoading}
                                                                        >
                                                                            Qabul qilish
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-small btn-secondary"
                                                                            onClick={() => cancelItem(it)}
                                                                            disabled={itemActionLoading}
                                                                        >
                                                                            Bekor qilish
                                                                        </button>
                                                                    </div>
                                                                )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {selectedReturn.header.status === "PENDING" && (
                                    <div
                                        className="drawer-footer"
                                        style={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            gap: 8,
                                        }}
                                    >
                                        <button
                                            className="btn btn-primary btn-small"
                                            onClick={approveSelected}
                                            disabled={approving || itemActionLoading}
                                        >
                                            {approving
                                                ? "Qabul qilinmoqda..."
                                                : "Barchasini qabul qilish"}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReturnsPage;
