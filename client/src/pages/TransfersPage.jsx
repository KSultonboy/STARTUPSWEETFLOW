import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
    PENDING: "Davom qilmoqda",
    PARTIAL: "Qisman bajarildi",
    COMPLETED: "To‘liq bajarildi",
    CANCELLED: "Bekor qilingan",
};

const STATUS_COLORS = {
    PENDING: "#f59e0b", // orange
    PARTIAL: "#eab308", // yellow
    COMPLETED: "#22c55e", // green
    CANCELLED: "#ef4444", // red
};

function TransfersPage() {
    const { user } = useAuth();

    // Rejim: BRANCH (filiallar) | OUTLET (do'konlar)
    const [mode, setMode] = useState("BRANCH");

    const [transferDate, setTransferDate] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    });

    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);

    const [toBranchId, setToBranchId] = useState("");
    const [note, setNote] = useState("");

    const [items, setItems] = useState([{ product_id: "", quantity: "" }]);

    const [transfers, setTransfers] = useState([]);
    const [selectedTransferId, setSelectedTransferId] = useState(null);

    const [filterToId, setFilterToId] = useState("all");

    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingTransfers, setLoadingTransfers] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionLoadingItemId, setActionLoadingItemId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Mahsulot tanlashda: PRODUCT + DECORATION hammasi ko'rinsin
    const productOptions = useMemo(
        () =>
            (products || []).filter((p) => {
                const cat = String(p.category || "").toUpperCase();
                return !cat || cat === "PRODUCT" || cat === "DECORATION";
            }),
        [products]
    );

    // Filiallar va do'konlarni ajratamiz
    const branchOptions = useMemo(
        () =>
            (branches || []).filter(
                (b) =>
                    (b.type || "BRANCH").toUpperCase() === "BRANCH" &&
                    b.is_active !== 0
            ),
        [branches]
    );

    const outletOptions = useMemo(
        () =>
            (branches || []).filter(
                (b) =>
                    (b.type || "BRANCH").toUpperCase() === "OUTLET" &&
                    b.is_active !== 0
            ),
        [branches]
    );

    const destinationOptions =
        mode === "BRANCH" ? branchOptions : outletOptions;

    const fetchBranches = async () => {
        try {
            setLoadingBranches(true);
            const res = await api.get("/branches");
            setBranches(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Filial va do‘konlarni yuklashda xatolik");
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const res = await api.get("/products");
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Mahsulotlarni yuklashda xatolik");
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchTransfers = async () => {
        try {
            setLoadingTransfers(true);
            const res = await api.get("/transfers");
            setTransfers(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Transferlarni yuklashda xatolik");
        } finally {
            setLoadingTransfers(false);
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchProducts();
        fetchTransfers();
    }, []);

    const resetForm = () => {
        setToBranchId("");
        setNote("");
        setItems([{ product_id: "", quantity: "" }]);
        setError("");
        setSuccess("");
    };

    const handleItemChange = (index, field, value) => {
        setItems((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
    };

    const addRow = () => {
        setItems((prev) => [...prev, { product_id: "", quantity: "" }]);
    };

    const removeRow = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const cleanedItems = items
            .map((row) => ({
                product_id: row.product_id ? Number(row.product_id) : 0,
                quantity: Number(row.quantity) || 0,
            }))
            .filter((r) => r.product_id && r.quantity > 0);

        if (!toBranchId) {
            setError(
                mode === "BRANCH"
                    ? "Filialni tanlang."
                    : "Do‘kon / supermarketni tanlang."
            );
            return;
        }

        if (cleanedItems.length === 0) {
            setError(
                "Kamida bitta mahsulot va miqdor kiritish kerak (quantity > 0)"
            );
            return;
        }

        const payload = {
            transfer_date: transferDate,
            to_branch_id: Number(toBranchId),
            note: note || null,
            created_by: user?.id || null,
            items: cleanedItems,
        };

        try {
            setSaving(true);
            const res = await api.post("/transfers", payload);
            const created = res.data;

            setTransfers((prev) => [created, ...prev]);
            setSuccess(
                mode === "BRANCH"
                    ? "Filialga transfer muvaffaqiyatli yaratildi."
                    : "Do‘konga transfer muvaffaqiyatli yaratildi."
            );
            resetForm();
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Transferni yaratishda xatolik.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    // Rejim bo'yicha transferlarni filter qilamiz
    const filteredTransfers = useMemo(() => {
        const isOutletMode = mode === "OUTLET";

        const list = (transfers || []).filter((t) => {
            const tType = (t.to_branch_type || "BRANCH").toUpperCase();
            if (isOutletMode) {
                return tType === "OUTLET";
            }
            return tType === "BRANCH";
        });

        if (filterToId === "all") return list;
        return list.filter(
            (t) => String(t.to_branch_id) === String(filterToId)
        );
    }, [transfers, mode, filterToId]);

    const selectedTransfer = useMemo(
        () => transfers.find((t) => t.id === selectedTransferId) || null,
        [selectedTransferId, transfers]
    );

    const selectedIsOutlet =
        selectedTransfer &&
        (selectedTransfer.to_branch_type || "BRANCH").toUpperCase() === "OUTLET";

    const renderStatusBadge = (status) => {
        const label = STATUS_LABELS[status] || status;
        const bg = STATUS_COLORS[status] || "#6b7280";
        return (
            <span
                style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    background: bg,
                    color: "#0b1120",
                }}
            >
                {label}
            </span>
        );
    };

    // Do'kon transferidagi itemni QABUL QILISH
    const handleAcceptItem = async (transfer, item) => {
        if (!transfer || !item) return;
        if ((transfer.to_branch_type || "BRANCH").toUpperCase() !== "OUTLET") {
            return;
        }

        setError("");
        setSuccess("");
        setActionLoadingItemId(item.id);

        try {
            await api.post(
                `/transfers/${transfer.id}/items/${item.id}/accept`,
                {
                    branch_id: transfer.to_branch_id,
                }
            );

            // yangilangan transferni olib, ro'yxatga qo'yamiz
            const res = await api.get(`/transfers/${transfer.id}`);
            const updated = res.data;
            setTransfers((prev) =>
                prev.map((t) => (t.id === transfer.id ? updated : t))
            );
            setSuccess("Mahsulot qabul qilindi (do‘kon omboriga kiritildi).");
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Mahsulotni qabul qilishda xatolik.";
            setError(msg);
        } finally {
            setActionLoadingItemId(null);
        }
    };

    // Do'kon transferidagi itemni BEKOR QILISH
    const handleRejectItem = async (transfer, item) => {
        if (!transfer || !item) return;
        if ((transfer.to_branch_type || "BRANCH").toUpperCase() !== "OUTLET") {
            return;
        }

        setError("");
        setSuccess("");
        setActionLoadingItemId(item.id);

        try {
            await api.post(
                `/transfers/${transfer.id}/items/${item.id}/reject`,
                {
                    branch_id: transfer.to_branch_id,
                }
            );

            const res = await api.get(`/transfers/${transfer.id}`);
            const updated = res.data;
            setTransfers((prev) =>
                prev.map((t) => (t.id === transfer.id ? updated : t))
            );
            setSuccess(
                "Mahsulot bekor qilindi va markaziy omborga qaytarildi."
            );
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Mahsulotni bekor qilishda xatolik.";
            setError(msg);
        } finally {
            setActionLoadingItemId(null);
        }
    };

    const pageTitle =
        mode === "BRANCH"
            ? "Filiallarga transferlar"
            : "Do‘kon / supermarketlarga transferlar";

    const pageSubtitle =
        mode === "BRANCH"
            ? "Markaziy ombordan filial omborlariga mahsulot va bezaklarni jo‘natish (filial o‘z sahifasida qabul qiladi)."
            : "Markaziy ombordan do‘kon va supermarketlarga jo‘natish va shu yerning o‘zida qabul qilish.";

    const filterLabel =
        mode === "BRANCH" ? "Filial:" : "Do‘kon:";

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{pageTitle}</h1>
                    <p className="page-subtitle">{pageSubtitle}</p>
                </div>

                <div className="page-header-actions" style={{ gap: 8 }}>
                    {/* Rejim tanlash: Filial / Do'kon */}
                    <div
                        style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: 2,
                            background: "rgba(15,23,42,0.8)",
                            border: "1px solid rgba(148,163,184,0.6)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setMode("BRANCH");
                                setFilterToId("all");
                                setSelectedTransferId(null);
                                setError("");
                                setSuccess("");
                            }}
                            style={{
                                border: "none",
                                padding: "4px 12px",
                                fontSize: 12,
                                borderRadius: 999,
                                cursor: "pointer",
                                backgroundColor:
                                    mode === "BRANCH" ? "#e5e7eb" : "transparent",
                                color: mode === "BRANCH" ? "#0b1120" : "#e5e7eb",
                            }}
                        >
                            Filiallar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMode("OUTLET");
                                setFilterToId("all");
                                setSelectedTransferId(null);
                                setError("");
                                setSuccess("");
                            }}
                            style={{
                                border: "none",
                                padding: "4px 12px",
                                fontSize: 12,
                                borderRadius: 999,
                                cursor: "pointer",
                                backgroundColor:
                                    mode === "OUTLET" ? "#e5e7eb" : "transparent",
                                color: mode === "OUTLET" ? "#0b1120" : "#e5e7eb",
                            }}
                        >
                            Do‘konlar
                        </button>
                    </div>

                    <input
                        className="input"
                        type="date"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="info-box info-box--error" style={{ marginBottom: 8 }}>
                    {error}
                </div>
            )}
            {success && (
                <div className="info-box info-box--muted" style={{ marginBottom: 8 }}>
                    {success}
                </div>
            )}

            {/* Transfer yaratish formasi */}
            <div className="card">
                <div className="card-title">
                    {mode === "BRANCH"
                        ? "Filialga yangi transfer yaratish"
                        : "Do‘konga yangi transfer yaratish"}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div>
                            <label>{mode === "BRANCH" ? "Filial" : "Do‘kon / supermarket"}</label>
                            <select
                                className="input"
                                value={toBranchId}
                                onChange={(e) => setToBranchId(e.target.value)}
                                disabled={loadingBranches}
                            >
                                <option value="">
                                    {mode === "BRANCH"
                                        ? "Filial tanlang"
                                        : "Do‘kon / supermarket tanlang"}
                                </option>
                                {destinationOptions.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} {b.code ? `(${b.code})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="table-wrapper" style={{ marginTop: 10 }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: "45%" }}>Mahsulot / bezak</th>
                                    <th style={{ width: "25%" }}>Miqdor</th>
                                    <th style={{ width: "10%" }} />
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row, index) => (
                                    <tr key={index}>
                                        <td>
                                            <select
                                                className="input"
                                                value={row.product_id}
                                                onChange={(e) =>
                                                    handleItemChange(index, "product_id", e.target.value)
                                                }
                                                disabled={loadingProducts}
                                            >
                                                <option value="">Tanlang...</option>
                                                {productOptions.map((p) => {
                                                    const cat = String(p.category || "").toUpperCase();
                                                    const isDecor = cat === "DECORATION";
                                                    return (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}{" "}
                                                            {p.unit === "kg" ? "(kg)" : "(dona)"}{" "}
                                                            {isDecor ? "[dekor]" : ""}
                                                        </option>
                                                    );
                                                })}
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
                                                    handleItemChange(index, "quantity", e.target.value)
                                                }
                                                placeholder="Miqdor"
                                            />
                                        </td>
                                        <td>
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="button-primary"
                                                    style={{
                                                        padding: "4px 8px",
                                                        fontSize: 11,
                                                        boxShadow: "none",
                                                    }}
                                                    onClick={() => removeRow(index)}
                                                >
                                                    O‘chirish
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div
                        style={{
                            marginTop: 10,
                            marginBottom: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <div style={{ fontSize: 13, color: "#9ca3af" }}>
                            Mahsulotlar va bezaklar ro‘yxatiga qatorlar qo‘shing va
                            miqdorlarini kiriting.
                        </div>
                        <button
                            type="button"
                            className="button-primary"
                            style={{ boxShadow: "none" }}
                            onClick={addRow}
                        >
                            Qator qo‘shish
                        </button>
                    </div>

                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                        <label>Eslatma (ixtiyoriy)</label>
                        <textarea
                            className="input"
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={
                                mode === "BRANCH"
                                    ? "Masalan: Xonqa filialiga ertalabki jo‘natma..."
                                    : "Masalan: Korzinka Chilonzor savdo nuqtasiga jo‘natma..."
                            }
                        />
                    </div>

                    <div
                        style={{
                            marginTop: 14,
                            display: "flex",
                            justifyContent: "flex-end",
                        }}
                    >
                        <button className="button-primary" type="submit" disabled={saving}>
                            {saving ? "Saqlanmoqda..." : "Transfer yaratish"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Transferlar ro'yxati */}
            <div className="card" style={{ marginTop: 16 }}>
                <div
                    className="card-title"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <span>
                        {mode === "BRANCH"
                            ? "Filiallarga transferlar"
                            : "Do‘konlarga transferlar"}
                    </span>

                    {/* Filial / do'kon bo‘yicha filter */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#9ca3af" }}>{filterLabel}</span>
                        <select
                            className="input"
                            style={{ minWidth: 140 }}
                            value={filterToId}
                            onChange={(e) => setFilterToId(e.target.value)}
                        >
                            <option value="all">Barchasi</option>
                            {destinationOptions.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name} {b.code ? `(${b.code})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loadingTransfers ? (
                    <p>Yuklanmoqda...</p>
                ) : filteredTransfers.length === 0 ? (
                    <p>Tanlangan filtrlarga mos transfer topilmadi.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Sana</th>
                                    <th>{mode === "BRANCH" ? "Filial" : "Do‘kon"}</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransfers.map((t, idx) => (
                                    <tr
                                        key={t.id}
                                        onClick={() =>
                                            setSelectedTransferId(
                                                t.id === selectedTransferId ? null : t.id
                                            )
                                        }
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>{idx + 1}</td>
                                        <td>{t.transfer_date}</td>
                                        <td>{t.to_branch_name || t.to_branch_id}</td>
                                        <td>{renderStatusBadge(t.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Detallar – tanlangan transfer ostida mahsulotlar holati */}
                {selectedTransfer && (
                    <div
                        style={{
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: "1px solid rgba(148,163,184,0.3)",
                        }}
                    >
                        <div
                            style={{
                                marginBottom: 6,
                                fontSize: 14,
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>
                                Transfer ID: <strong>{selectedTransfer.id}</strong> –{" "}
                                {STATUS_LABELS[selectedTransfer.status] ||
                                    selectedTransfer.status}
                            </span>
                            <span style={{ fontSize: 13, color: "#9ca3af" }}>
                                {selectedTransfer.note || ""}
                            </span>
                        </div>

                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Mahsulot / bezak</th>
                                        <th>Miqdor</th>
                                        <th>Status</th>
                                        {selectedIsOutlet && (
                                            <th style={{ width: 220 }}>Amal</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedTransfer.items || []).map((it, idx) => (
                                        <tr key={it.id}>
                                            <td>{idx + 1}</td>
                                            <td>{it.product_name}</td>
                                            <td>
                                                {it.quantity}{" "}
                                                {it.product_unit === "kg" ? "kg" : "dona"}
                                            </td>
                                            <td>
                                                {it.status === "PENDING" && (
                                                    <span
                                                        style={{ fontSize: 13, color: "#facc15" }}
                                                    >
                                                        Kutilmoqda
                                                    </span>
                                                )}
                                                {it.status === "ACCEPTED" && (
                                                    <span
                                                        style={{ fontSize: 13, color: "#22c55e" }}
                                                    >
                                                        Qabul qilingan
                                                    </span>
                                                )}
                                                {it.status === "REJECTED" && (
                                                    <span
                                                        style={{ fontSize: 13, color: "#f97316" }}
                                                    >
                                                        Bekor qilingan (markaziyga qaytdi)
                                                    </span>
                                                )}
                                            </td>

                                            {/* faqat DO'KON transferlarida shu yerda qabul/ bekor qilish */}
                                            {selectedIsOutlet && (
                                                <td>
                                                    {it.status === "PENDING" ? (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 6,
                                                                justifyContent: "flex-start",
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="button-primary"
                                                                style={{
                                                                    padding: "3px 8px",
                                                                    fontSize: 11,
                                                                    boxShadow: "none",
                                                                    backgroundColor: "#22c55e",
                                                                }}
                                                                disabled={actionLoadingItemId === it.id}
                                                                onClick={() =>
                                                                    handleAcceptItem(selectedTransfer, it)
                                                                }
                                                            >
                                                                {actionLoadingItemId === it.id
                                                                    ? "..."
                                                                    : "Qabul qilish"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="button-primary"
                                                                style={{
                                                                    padding: "3px 8px",
                                                                    fontSize: 11,
                                                                    boxShadow: "none",
                                                                    backgroundColor: "#f97316",
                                                                }}
                                                                disabled={actionLoadingItemId === it.id}
                                                                onClick={() =>
                                                                    handleRejectItem(selectedTransfer, it)
                                                                }
                                                            >
                                                                {actionLoadingItemId === it.id
                                                                    ? "..."
                                                                    : "Bekor qilish"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TransfersPage;
