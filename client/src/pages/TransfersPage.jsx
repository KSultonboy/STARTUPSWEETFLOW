// client/src/pages/TransfersPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import TransferForm from "../components/transfers/TransferForm";
import TransfersTable from "../components/transfers/TransfersTable";

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
    const [editLoading, setEditLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

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
                    (b.branch_type || "BRANCH").toUpperCase() === "BRANCH" &&
                    b.is_active !== 0
            ),
        [branches]
    );

    const outletOptions = useMemo(
        () =>
            (branches || []).filter(
                (b) =>
                    (b.branch_type || "BRANCH").toUpperCase() === "OUTLET" &&
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetForm = () => {
        setEditingId(null);
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
            if (editingId) {
                const res = await api.put(`/transfers/${editingId}`, payload);
                const updated = res.data;
                setTransfers((prev) =>
                    prev.map((t) => (t.id === updated.id ? updated : t))
                );
                setSuccess("Transfer muvaffaqiyatli tahrirlandi.");
            } else {
                const res = await api.post("/transfers", payload);
                const created = res.data;
                setTransfers((prev) => [created, ...prev]);
                setSuccess(
                    mode === "BRANCH"
                        ? "Filialga transfer muvaffaqiyatli yaratildi."
                        : "Do‘konga transfer muvaffaqiyatli yaratildi."
                );
            }

            resetForm();
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Transferni saqlashda xatolik.";
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

    // Transferni tahrirlash (faqat PENDING)
    const loadTransferForEdit = async (t) => {
        setError("");
        setSuccess("");

        setEditLoading(true);
        try {
            const res = await api.get(`/transfers/${t.id}`);
            const data = res.data;

            setEditingId(data.id);
            setTransferDate(data.transfer_date);
            setToBranchId(data.to_branch_id);
            setNote(data.note || "");
            setItems(
                (data.items || []).map((it) => ({
                    product_id: it.product_id,
                    quantity: it.quantity,
                }))
            );

            // Detal uchun open qilingan bo'lsa ham yaxshi, lekin formaga fokus beramiz
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Transferni tahrirlash uchun ma’lumotni yuklashda xatolik.";
            setError(msg);
        } finally {
            setEditLoading(false);
        }
    };

    const deleteTransfer = async (t) => {
        if (
            !window.confirm(
                "Rostdan ham bu transferni bekor qilishni istaysizmi? (Faqat barcha bandlari PENDING bo‘lsa)"
            )
        ) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            await api.delete(`/transfers/${t.id}`);

            // status CANCELLED bo'ladi, lekin ro'yxatdan olib tashlaymiz
            setTransfers((prev) => prev.filter((x) => x.id !== t.id));

            if (editingId && Number(editingId) === Number(t.id)) {
                resetForm();
            }
            if (selectedTransferId === t.id) {
                setSelectedTransferId(null);
            }

            setSuccess("Transfer bekor qilindi.");
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Transferni bekor qilishda xatolik.";
            setError(msg);
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
                            className={`button-toggle ${mode === "BRANCH" ? "active" : ""}`}
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
                            className={`button-toggle ${mode === "OUTLET" ? "active" : ""}`}
                        >
                            Do‘konlar
                        </button>
                    </div>
                </div>
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

            <TransferForm
                mode={mode}
                transferDate={transferDate}
                onTransferDateChange={setTransferDate}
                destinationOptions={destinationOptions}
                loadingBranches={loadingBranches}
                loadingProducts={loadingProducts}
                toBranchId={toBranchId}
                onToBranchChange={setToBranchId}
                items={items}
                onItemChange={handleItemChange}
                onAddRow={addRow}
                onRemoveRow={removeRow}
                note={note}
                onNoteChange={setNote}
                onSubmit={handleSubmit}
                saving={saving || editLoading}
                editingId={editingId}
                onCancelEdit={resetForm}
                productOptions={productOptions}
            />

            <TransfersTable
                mode={mode}
                destinationOptions={destinationOptions}
                filterToId={filterToId}
                onFilterToIdChange={setFilterToId}
                loadingTransfers={loadingTransfers}
                filteredTransfers={filteredTransfers}
                selectedTransfer={selectedTransfer}
                selectedTransferId={selectedTransferId}
                onSelectTransferId={setSelectedTransferId}
                selectedIsOutlet={selectedIsOutlet}
                onAcceptItem={handleAcceptItem}
                onRejectItem={handleRejectItem}
                actionLoadingItemId={actionLoadingItemId}
                onEditTransfer={loadTransferForEdit}
                onDeleteTransfer={deleteTransfer}
            />
        </div>
    );
}

export default TransfersPage;
