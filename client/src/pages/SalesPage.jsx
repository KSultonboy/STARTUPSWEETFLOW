import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function SalesPage() {
    const { user } = useAuth();

    const [products, setProducts] = useState([]);
    const [saleDate, setSaleDate] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    });

    const [items, setItems] = useState([
        { product_id: "", quantity: "", unit_price: "" },
    ]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // popup uchun
    const [pendingPayload, setPendingPayload] = useState(null);
    const [shortages, setShortages] = useState(null); // [{product_id, required, available}]

    // Barcode input (hardware skaner + qo'lda kiritish)
    const [barcodeInput, setBarcodeInput] = useState("");
    const [barcodeLoading, setBarcodeLoading] = useState(false);

    // Mahsulotlarni yuklash
    const fetchProducts = async () => {
        try {
            const res = await api.get("/products");
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Mahsulotlar ro'yxatini yuklashda xatolik.");
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const findProduct = (id) => {
        return products.find((p) => String(p.id) === String(id));
    };

    const applyScannedProduct = (product) => {
        if (!product) return;

        // Mahsulot ro'yxatiga yo'q bo'lsa qo'shib qo'yamiz
        setProducts((prev) => {
            const exists = prev.find((p) => p.id === product.id);
            if (exists) return prev;
            return [...prev, product];
        });

        // Sotuv ro'yxatiga qo'shish yoki qty ni oshirish
        setItems((prev) => {
            const idx = prev.findIndex(
                (row) => String(row.product_id) === String(product.id)
            );
            if (idx !== -1) {
                return prev.map((row, i) => {
                    if (i !== idx) return row;
                    const currentQty = Number(row.quantity) || 0;
                    return {
                        ...row,
                        quantity: String(currentQty + 1),
                        unit_price: row.unit_price || String(product.price || ""),
                    };
                });
            }

            return [
                ...prev,
                {
                    product_id: String(product.id),
                    quantity: "1",
                    unit_price: String(product.price || ""),
                },
            ];
        });
    };

    const handleItemChange = (index, field, value) => {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                if (field === "product_id") {
                    const product = findProduct(value);
                    return {
                        ...item,
                        product_id: value,
                        unit_price: product ? product.price || "" : "",
                    };
                }

                return { ...item, [field]: value };
            })
        );
    };

    const addRow = () => {
        setItems((prev) => [
            ...prev,
            { product_id: "", quantity: "", unit_price: "" },
        ]);
    };

    const removeRow = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const totalAmount = useMemo(() => {
        return items.reduce((sum, row) => {
            const q = Number(row.quantity) || 0;
            const p = Number(row.unit_price) || 0;
            return sum + q * p;
        }, 0);
    }, [items]);

    const buildPayload = () => {
        if (!user?.branch_id) {
            throw new Error("Foydalanuvchiga filial biriktirilmagan.");
        }

        const cleanedItems = items
            .map((item) => ({
                product_id: Number(item.product_id) || null,
                quantity: Number(item.quantity) || 0,
                unit_price: Number(item.unit_price) || 0,
            }))
            .filter((i) => i.product_id && i.quantity > 0);

        if (cleanedItems.length === 0) {
            throw new Error(
                "Kamida bitta to'g'ri to'ldirilgan pozitsiya kiritish kerak."
            );
        }

        return {
            branch_id: user.branch_id,
            user_id: user.id,
            sale_date: saleDate,
            items: cleanedItems,
        };
    };

    const sendSale = async (payload, { allowNegative = false } = {}) => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");
            setShortages(null);
            setPendingPayload(null);

            const body = allowNegative
                ? { ...payload, allow_negative_stock: true }
                : payload;

            await api.post("/sales", body);

            setSuccess("Sotuv muvaffaqiyatli saqlandi.");
            setItems([{ product_id: "", quantity: "", unit_price: "" }]);
        } catch (err) {
            console.error(err);
            const data = err.response?.data;

            if (data?.shortages && !allowNegative) {
                // Omborda yetmayapti -> popup uchun ma'lumotlarni saqlaymiz
                setPendingPayload(payload);
                setShortages(data.shortages);
            } else {
                const msg =
                    data?.message || "Sotuvni saqlashda xatolik yuz berdi.";
                setError(msg);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setShortages(null);
        setPendingPayload(null);

        try {
            const payload = buildPayload();
            await sendSale(payload, { allowNegative: false });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCancelShortage = () => {
        setShortages(null);
        setPendingPayload(null);
    };

    const handleForceSale = async () => {
        if (!pendingPayload) return;
        await sendSale(pendingPayload, { allowNegative: true });
    };

    const getProductName = (productId) => {
        const p = findProduct(productId);
        return p ? p.name : `ID: ${productId}`;
    };

    const handleBarcodeSubmit = async (e) => {
        e.preventDefault();
        const code = barcodeInput.trim();
        if (!code) return;

        try {
            setBarcodeLoading(true);
            setError("");
            setSuccess("");

            const res = await api.get(
                `/products/by-barcode/${encodeURIComponent(code)}`
            );
            const product = res.data;
            applyScannedProduct(product);

            setSuccess(
                `Shtrix kod bo'yicha mahsulot qo'shildi: ${product.name}`
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
                    <h1 className="page-title">Sotuv kiritish</h1>
                    <p className="page-subtitle">
                        Ushbu filial bo‘yicha sotuv cheklarini kiritish.
                    </p>
                </div>

                <div className="page-header-actions" style={{ gap: 8 }}>
                    <form
                        onSubmit={handleBarcodeSubmit}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
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
                            className="button-secondary"
                            disabled={barcodeLoading}
                        >
                            {barcodeLoading ? "..." : "Shtrix koddan qo'shish"}
                        </button>
                    </form>
                    <input
                        className="input"
                        type="date"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
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

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Mahsulot</th>
                                    <th>Miqdor</th>
                                    <th>Narx</th>
                                    <th>Jami</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row, index) => {
                                    const quantity = Number(row.quantity) || 0;
                                    const price = Number(row.unit_price) || 0;
                                    const total = quantity * price;

                                    return (
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
                                                >
                                                    <option value="">Mahsulotni tanlang</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} {p.unit ? `(${p.unit})` : ""}{" "}
                                                            {p.price ? `- ${p.price} so'm` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    className="input"
                                                    type="number"
                                                    min="0"
                                                    value={row.quantity}
                                                    onChange={(e) =>
                                                        handleItemChange(index, "quantity", e.target.value)
                                                    }
                                                    placeholder="Miqdor"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="input"
                                                    type="number"
                                                    min="0"
                                                    value={row.unit_price}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            index,
                                                            "unit_price",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Narx"
                                                />
                                            </td>
                                            <td>{total.toLocaleString("uz-UZ")}</td>
                                            <td>
                                                <button
                                                    className="btn-icon btn-icon--delete"
                                                    onClick={() => removeRow(index)}
                                                >
                                                    🗑
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div
                        style={{
                            marginTop: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                        }}
                    >
                        <div style={{ fontSize: 14 }}>
                            Umumiy summa:{" "}
                            <strong>{totalAmount.toLocaleString("uz-UZ")} so‘m</strong>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                type="button"
                                className="button-primary"
                                style={{ boxShadow: "none" }}
                                onClick={addRow}
                            >
                                Qator qo‘shish
                            </button>

                            <button
                                className="button-primary"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? "Saqlanmoqda..." : "Sotuvni saqlash"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* OMBORDA YETARLI EMAS POPUP */}
            {shortages && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15,23,42,0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 50,
                    }}
                >
                    <div
                        style={{
                            background: "var(--rt-surface)",
                            borderRadius: "16px",
                            padding: "18px 20px",
                            maxWidth: "460px",
                            width: "100%",
                            boxShadow: "0 24px 60px rgba(15,23,42,0.65)",
                            border: "1px solid var(--rt-border-subtle)",
                        }}
                    >
                        <h3 style={{ margin: 0, marginBottom: 6, fontSize: 18 }}>
                            Omborda mahsulot yetarli emas
                        </h3>
                        <p
                            style={{
                                fontSize: 13,
                                color: "var(--rt-text-muted)",
                                marginBottom: 10,
                            }}
                        >
                            Quyidagi mahsulotlar uchun sotilayotgan miqdor ombordagi
                            qoldiqdan ko‘p. Baribir sotuvni tasdiqlashni xohlaysizmi?
                        </p>

                        <ul
                            style={{
                                paddingLeft: 16,
                                margin: 0,
                                marginBottom: 12,
                                fontSize: 13,
                            }}
                        >
                            {shortages.map((s) => (
                                <li key={s.product_id}>
                                    <strong>{getProductName(s.product_id)}</strong>: kerak{" "}
                                    {s.required}, omborda {s.available}
                                </li>
                            ))}
                        </ul>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 8,
                                marginTop: 8,
                            }}
                        >
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={handleCancelShortage}
                            >
                                Bekor qilish (Esc)
                            </button>

                            <button
                                type="button"
                                className="button-primary"
                                onClick={handleForceSale}
                            >
                                Baribir sotish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalesPage;
