import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
    PENDING: "Davom qilmoqda",
    PARTIAL: "Qisman bajarildi",
    COMPLETED: "To‘liq bajarildi",
    CANCELLED: "Bekor qilingan",
};

function ReceivingPage() {
    const { user } = useAuth();
    const branchId = user?.branch_id || null;

    const [transfers, setTransfers] = useState([]);
    const [selectedTransferId, setSelectedTransferId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [savingItemId, setSavingItemId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [barcodeInput, setBarcodeInput] = useState("");
    const [barcodeLoading, setBarcodeLoading] = useState(false);

    const fetchTransfers = async () => {
        if (!branchId) return;
        try {
            setLoading(true);
            const res = await api.get(
                `/transfers/incoming/branch/${branchId}`
            );
            setTransfers(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Kiruvchi transferlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransfers();
    }, [branchId]);

    const selectedTransfer = useMemo(
        () => transfers.find((t) => t.id === selectedTransferId) || null,
        [selectedTransferId, transfers]
    );

    const handleAction = async (transferId, itemId, action) => {
        if (!branchId) {
            setError("Branch ID aniqlanmadi");
            return;
        }

        const confirmText =
            action === "accept"
                ? "Bu mahsulotni qabul qilmoqchimisiz?"
                : "Bu mahsulotni BEKOR qilib, markaziy omborga qaytarmoqchimisiz?";

        const ok = window.confirm(confirmText);
        if (!ok) return;

        try {
            setSavingItemId(itemId);
            setError("");
            setSuccess("");

            const url =
                action === "accept"
                    ? `/transfers/${transferId}/items/${itemId}/accept`
                    : `/transfers/${transferId}/items/${itemId}/reject`;

            const res = await api.post(url, { branch_id: branchId });
            const updated = res.data;

            setTransfers((prev) =>
                prev.map((t) => (t.id === updated.id ? updated : t))
            );
            setSuccess("Amal muvaffaqiyatli bajarildi.");
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message ||
                "Amalni bajarishda xatolik.";
            setError(msg);
        } finally {
            setSavingItemId(null);
        }
    };

    const handleBarcodeSubmit = async (e) => {
        e.preventDefault();
        const code = barcodeInput.trim();
        if (!code) return;
        if (!selectedTransfer) {
            setError("Avval transferni tanlang.");
            return;
        }
        try {
            setBarcodeLoading(true);
            setError("");
            setSuccess("");

            const res = await api.get(
                `/products/by-barcode/${encodeURIComponent(code)}`
            );
            const product = res.data;

            const pendingItem =
                (selectedTransfer.items || []).find(
                    (it) =>
                        it.status === "PENDING" &&
                        String(it.product_id) === String(product.id)
                ) || null;

            if (!pendingItem) {
                setError(
                    "Bu transferda ushbu mahsulot topilmadi yoki allaqachon qabul qilingan."
                );
                return;
            }

            await handleAction(selectedTransfer.id, pendingItem.id, "accept");
            setSuccess(
                `Shtrix kod bo'yicha qabul qilindi: ${product.name}`
            );
            setBarcodeInput("");
        } catch (err) {
            console.error(err);
            setError("Shtrix kod bo'yicha mahsulot topilmadi.");
        } finally {
            setBarcodeLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Qabul qilish</h1>
                    <p className="page-subtitle">
                        Markaziy ombordan kelgan transferlarni qabul qilish yoki bekor
                        qilish.
                    </p>
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

            <div className="card">
                <div className="card-title">Kelayotgan transferlar</div>

                {loading ? (
                    <p>Yuklanmoqda...</p>
                ) : transfers.length === 0 ? (
                    <p>Hozircha qabul qilish kerak bo‘lgan transferlar yo‘q.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Sana</th>
                                    <th>Markaz / Filial</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map((t, idx) => (
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
                                        <td>{t.from_branch_name || "Markaziy ombor"}</td>
                                        <td>
                                            <span style={{ fontSize: 13 }}>
                                                {STATUS_LABELS[t.status] || t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedTransfer && (
                    <div
                        style={{
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: "1px solid rgba(148,163,184,0.3)",
                        }}
                    >
                        <form
                            onSubmit={handleBarcodeSubmit}
                            style={{
                                marginBottom: 8,
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <input
                                className="input"
                                type="text"
                                placeholder="Shtrix kodni skanerlang yoki yozing"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                style={{ maxWidth: 260 }}
                            />
                            <button
                                type="submit"
                                className="btn btn-secondary"
                                disabled={barcodeLoading}
                            >
                                {barcodeLoading
                                    ? "..."
                                    : "Shtrix kod bilan qabul qilish"}
                            </button>
                        </form>

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
                                        <th>Mahsulot</th>
                                        <th>Miqdor</th>
                                        <th>Holat</th>
                                        <th>Amal</th>
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
                                                    <span style={{ fontSize: 13, color: "#facc15" }}>
                                                        Kutilmoqda
                                                    </span>
                                                )}
                                                {it.status === "ACCEPTED" && (
                                                    <span style={{ fontSize: 13, color: "#22c55e" }}>
                                                        Qabul qilingan
                                                    </span>
                                                )}
                                                {it.status === "REJECTED" && (
                                                    <span style={{ fontSize: 13, color: "#f97316" }}>
                                                        Bekor qilingan
                                                    </span>
                                                )}
                                            </td>
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
                                                            disabled={savingItemId === it.id}
                                                            onClick={() =>
                                                                handleAction(selectedTransfer.id, it.id, "accept")
                                                            }
                                                        >
                                                            {savingItemId === it.id
                                                                ? "..."
                                                                : "Qabul qilish"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="button-danger"
                                                            disabled={savingItemId === it.id}
                                                            onClick={() =>
                                                                handleAction(selectedTransfer.id, it.id, "reject")
                                                            }
                                                        >
                                                            {savingItemId === it.id
                                                                ? "..."
                                                                : "Bekor qilish"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
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

export default ReceivingPage;
