// client/src/pages/ReturnsPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/authContext";

// Componentlar
import BranchReturnForm from "../components/returns/BranchReturnForm";
import OutletReturnForm from "../components/returns/OutletReturnForm";
import ReturnsTable from "../components/returns/ReturnsTable";
import ReturnDetailDrawer from "../components/returns/ReturnDetailDrawer";

function ReturnsPage() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    const isAdmin = user?.role === "admin";
    const isBranch = user?.role === "branch";

    // URL'dan /returns?edit=ID kelgan bo'lsa
    const initialEditId = searchParams.get("edit");

    // Admin rejimi: BRANCH (filial) / OUTLET (do‘kon)
    const [mode, setMode] = useState("BRANCH");

    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);

    // --- Filial formasi (branch) ---
    const [date, setDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [comment, setComment] = useState("");
    const [items, setItems] = useState([
        { product_id: "", quantity: "", unit: "", reason: "" },
    ]);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    // --- Outlet formasi (admin) ---
    const [outletDate, setOutletDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [outletBranchId, setOutletBranchId] = useState("");
    const [outletComment, setOutletComment] = useState("");
    const [outletItems, setOutletItems] = useState([
        { product_id: "", quantity: "", unit: "", reason: "" },
    ]);
    const [outletSaving, setOutletSaving] = useState(false);

    // Ro'yxat + filterlar
    const [list, setList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    const [branchFilter, setBranchFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Detal (drawer)
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [approving, setApproving] = useState(false);
    const [itemActionLoading, setItemActionLoading] = useState(false);

    // Xabarlar
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // *** Faqat PRODUCT / DECORATION mahsulotlari ***
    const productOptions = useMemo(
        () =>
            (products || []).filter((p) => {
                const cat = String(p.category || "").toUpperCase();
                return cat === "PRODUCT" || cat === "DECORATION";
            }),
        [products]
    );

    // Filial / do'kon options
    const branchOptions = useMemo(
        () =>
            (branches || []).filter(
                (b) =>
                    b.is_active !== 0 &&
                    String(b.branch_type || "BRANCH").toUpperCase() === "BRANCH"
            ),
        [branches]
    );

    const outletOptions = useMemo(
        () =>
            (branches || []).filter(
                (b) =>
                    b.is_active !== 0 &&
                    String(b.branch_type || "BRANCH").toUpperCase() === "OUTLET"
            ),
        [branches]
    );

    // Admin vazvratlar ro'yxati: BRANCH / OUTLET bo'yicha filter
    const visibleList = useMemo(() => {
        if (!isAdmin) return list || [];
        const targetType = mode === "OUTLET" ? "OUTLET" : "BRANCH";
        return (list || []).filter((row) => {
            const bt = String(row.branch_type || "BRANCH").toUpperCase();
            return bt === targetType;
        });
    }, [list, mode, isAdmin]);

    // --- API chaqiruvlar ---

    const loadBranches = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get("/branches");
            setBranches(res.data || []);
        } catch (err) {
            console.error(err);
        }
    }, [isAdmin]);

    const loadProducts = useCallback(async () => {
        try {
            const res = await api.get("/products");
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const loadReturns = async () => {
        try {
            setLoadingList(true);
            setError("");

            const params = { limit: 50, offset: 0 };

            if (isAdmin) {
                if (branchFilter !== "all") params.branch_id = branchFilter;
                if (statusFilter && statusFilter !== "all") params.status = statusFilter;
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

    // --- Hooks ---

    useEffect(() => {
        loadProducts();
        loadBranches();
    }, [loadProducts, loadBranches]);

    useEffect(() => {
        loadReturns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchFilter, statusFilter, dateFrom, dateTo]);

    // History'dan /returns?edit=ID bilan kelganda
    useEffect(() => {
        if (initialEditId && isBranch) {
            loadReturnForEdit(initialEditId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialEditId, isBranch]);

    // --- Branch form helpers ---

    const handleItemChange = (index, field, value) => {
        setItems((prev) => {
            const copy = [...prev];
            const row = { ...copy[index], [field]: value };

            if (field === "product_id") {
                const product = productOptions.find(
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

    const resetBranchForm = () => {
        setEditingId(null);
        setDate(new Date().toISOString().slice(0, 10));
        setComment("");
        setItems([{ product_id: "", quantity: "", unit: "", reason: "" }]);
    };

    const loadReturnForEdit = async (id) => {
        if (!isBranch && !isAdmin) return;

        setError("");
        setSuccess("");
        setEditLoading(true);

        try {
            const res = await api.get(`/returns/${id}`);
            const data = res.data;

            setEditingId(data.header.id);
            setDate(data.header.return_date);
            setComment(data.header.comment || "");
            setItems(
                (data.items || []).map((it) => ({
                    product_id: it.product_id,
                    quantity: it.quantity,
                    unit: it.unit || "",
                    reason: it.reason || "",
                }))
            );

            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Vazvratni tahrirlash uchun ma’lumotni yuklashda xatolik.";
            setError(msg);
        } finally {
            setEditLoading(false);
        }
    };

    const handleBranchSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!isBranch && !isAdmin) {
            setError("Vazvratni faqat filial xodimi yoki admin kiritadi.");
            return;
        }

        if (!user?.branch_id && !isAdmin) {
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
                branch_id: isAdmin ? null : (user.branch_id || null),
            };

            if (editingId) {
                await api.put(`/returns/${editingId}`, payload);
                setSuccess("Vazvrat muvaffaqiyatli tahrirlandi.");
            } else {
                await api.post("/returns", payload);
                setSuccess("Vazvrat so‘rovi yuborildi. Admin tasdiqlashi kerak.");
            }

            resetBranchForm();
            await loadReturns();
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message || "Vazvratni saqlashda xatolik.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const deleteReturn = async (row) => {
        if (
            !window.confirm(
                "Rostdan ham bu vazvratni o‘chirishni istaysizmi? (Faqat PENDING holatda)"
            )
        ) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            await api.delete(`/returns/${row.id}`);

            if (editingId && Number(editingId) === Number(row.id)) {
                resetBranchForm();
            }

            await loadReturns();
            setSuccess("Vazvrat o‘chirildi.");
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Vazvratni o‘chirishda xatolik.";
            setError(msg);
        }
    };

    // --- Outlet form handlers ---

    const handleOutletItemChange = (index, field, value) => {
        setOutletItems((prev) => {
            const copy = [...prev];
            const row = { ...copy[index], [field]: value };

            if (field === "product_id") {
                const product = productOptions.find(
                    (p) => String(p.id) === String(value)
                );
                row.unit = product?.unit || "";
            }

            copy[index] = row;
            return copy;
        });
    };

    const addOutletRow = () => {
        setOutletItems((prev) => [
            ...prev,
            { product_id: "", quantity: "", unit: "", reason: "" },
        ]);
    };

    const removeOutletRow = (index) => {
        setOutletItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleOutletSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!isAdmin) {
            setError("Bu bo‘lim faqat admin uchun.");
            return;
        }

        if (!outletBranchId) {
            setError("Do‘kon / supermarketni tanlang.");
            return;
        }

        if (outletItems.length === 0) {
            setError("Kamida bitta mahsulot kiriting.");
            return;
        }

        const preparedItems = [];
        for (const it of outletItems) {
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
            setOutletSaving(true);

            const payload = {
                date: outletDate,
                comment: outletComment || "",
                items: preparedItems,
                branch_id: Number(outletBranchId),
            };

            const res = await api.post("/returns", payload);
            const created = res.data;

            await api.post(`/returns/${created.id}/approve`);
            setStatusFilter("all");

            setSuccess("Do‘kondan vazvrat kiritildi va qabul qilindi.");
            setOutletItems([
                { product_id: "", quantity: "", unit: "", reason: "" },
            ]);
            setOutletComment("");
            setOutletBranchId("");
            setOutletDate(new Date().toISOString().slice(0, 10));
            await loadReturns();
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message ||
                "Do‘kon vazvratini saqlashda yoki tasdiqlashda xatolik.";
            setError(msg);
        } finally {
            setOutletSaving(false);
        }
    };

    // --- Drawer / approve/cancel ---

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

    // --- UI ---

    const pageTitle = isAdmin
        ? mode === "BRANCH"
            ? "Vazvratlar – filiallardan kelgan qaytishlar"
            : "Vazvratlar – do‘kon / supermarketlardan qaytish"
        : "Vazvratlar (markaziy omborga qaytarish)";

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{pageTitle}</h1>
                    <p className="page-subtitle">
                        Transfer: markaziy ombordan filiallarga va do‘konlarga jo‘natish. <br />
                        Vazvrat: filiallar yoki do‘konlardan markaziy omborga qaytarish.
                    </p>
                </div>

                {isAdmin && (
                    <div className="page-header-actions" style={{ gap: 8 }}>
                        {/* Rejim tanlash: Filial / Do‘kon */}
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
                                    setBranchFilter("all");
                                    setStatusFilter("PENDING");
                                    setSelectedReturn(null);
                                    setError("");
                                    setSuccess("");
                                }}
                                className={`button-toggle ${mode === "BRANCH" ? "active" : ""}`}
                            >
                                Filial vazvratlari
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("OUTLET");
                                    setBranchFilter("all");
                                    setStatusFilter("all");
                                    setSelectedReturn(null);
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
                                Do‘kon vazvratlari
                            </button>
                        </div>

                        {/* Filterlar */}
                        <select
                            className="input"
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                        >
                            <option value="all">
                                {mode === "BRANCH" ? "Barcha filiallar" : "Barcha do‘konlar"}
                            </option>
                            {(mode === "BRANCH" ? branchOptions : outletOptions).map((b) => (
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

            {/* Filial formasi */}
            <BranchReturnForm
                isBranch={isBranch}
                branchName={user?.branch_name}
                editingId={editingId}
                editLoading={editLoading}
                saving={saving}
                date={date}
                comment={comment}
                items={items}
                productOptions={productOptions}
                onDateChange={setDate}
                onCommentChange={setComment}
                onItemChange={handleItemChange}
                onAddRow={addRow}
                onRemoveRow={removeRow}
                onSubmit={handleBranchSubmit}
                onCancelEdit={resetBranchForm}
            />

            {/* Outlet formasi (admin + OUTLET rejimi) */}
            <OutletReturnForm
                visible={isAdmin && mode === "OUTLET"}
                outletDate={outletDate}
                outletBranchId={outletBranchId}
                outletComment={outletComment}
                outletItems={outletItems}
                outletOptions={outletOptions}
                productOptions={productOptions}
                outletSaving={outletSaving}
                onOutletDateChange={setOutletDate}
                onOutletBranchChange={setOutletBranchId}
                onOutletCommentChange={setOutletComment}
                onOutletItemChange={handleOutletItemChange}
                onAddOutletRow={addOutletRow}
                onRemoveOutletRow={removeOutletRow}
                onOutletSubmit={handleOutletSubmit}
            />

            {/* Ro'yxat */}
            <ReturnsTable
                isAdmin={isAdmin}
                mode={mode}
                visibleList={visibleList}
                loadingList={loadingList}
                isBranch={isBranch}
                saving={saving}
                outletSaving={outletSaving}
                onOpenDetail={openDetail}
                onEditRow={(row) => loadReturnForEdit(row.id)}
                onDeleteRow={deleteReturn}
            />

            {/* Detal drawer */}
            <ReturnDetailDrawer
                isAdmin={isAdmin}
                selectedReturn={selectedReturn}
                loadingDetail={loadingDetail}
                approving={approving}
                itemActionLoading={itemActionLoading}
                onClose={() => setSelectedReturn(null)}
                onApproveAll={approveSelected}
                onApproveItem={approveItem}
                onCancelItem={cancelItem}
            />
        </div>
    );
}

export default ReturnsPage;
