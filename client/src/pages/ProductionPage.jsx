import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/authContext";

function ProductionPage() {
    const { user } = useAuth();

    // Sana – default bugungi kun
    const [batchDate, setBatchDate] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    });

    const [note, setNote] = useState("");

    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([{ product_id: "", quantity: "" }]);

    const [loadingProducts, setLoadingProducts] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Faqat asosiy mahsulotlar (PRODUCT kategoriyadagi)
    const productOptions = useMemo(
        () =>
            (products || []).filter(
                (p) =>
                    !p.category || String(p.category).toUpperCase() === "PRODUCT"
            ),
        [products]
    );

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

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleItemChange = (index, field, value) => {
        setItems((prev) =>
            prev.map((row, i) =>
                i === index ? { ...row, [field]: value } : row
            )
        );
    };

    const addRow = () => {
        setItems((prev) => [...prev, { product_id: "", quantity: "" }]);
    };

    const removeRow = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setNote("");
        setItems([{ product_id: "", quantity: "" }]);
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

        if (cleanedItems.length === 0) {
            setError(
                "Kamida bitta mahsulot va miqdor kiritish kerak (quantity > 0)."
            );
            return;
        }

        const payload = {
            batch_date: batchDate,
            shift: null, // smena ishlatmayapmiz, null yuborib qo'yamiz
            note: note || null,
            created_by: user?.id || null,
            items: cleanedItems,
        };

        try {
            setSaving(true);
            await api.post("/production", payload);
            setSuccess("Ishlab chiqarish partiyasi muvaffaqiyatli saqlandi.");
            resetForm();
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message ||
                "Ishlab chiqarish partiyasini saqlashda xatolik.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Ishlab chiqarish kiritish</h1>
                    <p className="page-subtitle">
                        Kunlik ishlab chiqarilgan mahsulotlar partiyasini kiritish.
                    </p>
                </div>

                <div className="page-header-actions">
                    <input
                        className="input"
                        type="date"
                        value={batchDate}
                        onChange={(e) => setBatchDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Error / success */}
            {error && (
                <div
                    className="info-box info-box--error"
                    style={{ marginBottom: 8 }}
                >
                    {error}
                </div>
            )}
            {success && (
                <div
                    className="info-box info-box--muted"
                    style={{ marginBottom: 8 }}
                >
                    {success}
                </div>
            )}

            {/* Form card – faqat kiritish */}
            <div className="card">
                <form onSubmit={handleSubmit}>
                    {/* Jadval – mahsulotlar */}
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: "45%" }}>Mahsulot</th>
                                    <th style={{ width: "25%" }}>Miqdor</th>
                                    <th style={{ width: "10%" }}></th>
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
                                                    handleItemChange(
                                                        index,
                                                        "product_id",
                                                        e.target.value
                                                    )
                                                }
                                                disabled={loadingProducts}
                                            >
                                                <option value="">Mahsulot tanlang</option>
                                                {productOptions.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}{" "}
                                                        {p.unit === "kg" ? "(kg)" : "(dona)"}
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
                                                placeholder="Miqdor"
                                            />
                                        </td>
                                        <td>
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-icon btn-icon--delete"
                                                    onClick={() => removeRow(index)}
                                                >
                                                    🗑
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Qator qo'shish + izoh */}
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
                            Mahsulotlar ro&apos;yxatiga qatorlar qo&apos;shing va
                            miqdorlarini kiriting.
                        </div>

                        <button
                            type="button"
                            className="button-primary"
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
                            placeholder="Masalan: Tug'ilgan kun buyurtmalari uchun..."
                        />
                    </div>

                    <div
                        style={{
                            marginTop: 14,
                            display: "flex",
                            justifyContent: "flex-end",
                        }}
                    >
                        <button
                            className="button-primary"
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saqlanmoqda..."
                                : "Ishlab chiqarish partiyasini saqlash"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProductionPage;
