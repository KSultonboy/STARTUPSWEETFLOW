// client/src/pages/ExpensesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const TYPE_INGREDIENTS = "ingredients";
const TYPE_DECOR = "decor";
const TYPE_UTILITY = "utility";

const TABS = [
    { key: TYPE_INGREDIENTS, label: "Masalliqlar" },
    { key: TYPE_DECOR, label: "Bezaklar / salyut" },
    { key: TYPE_UTILITY, label: "Kommunal to‘lovlar" },
];

function ExpensesPage() {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState(TYPE_INGREDIENTS);

    const [date, setDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );

    // Products
    const [ingredientProducts, setIngredientProducts] = useState([]);
    const [decorProducts, setDecorProducts] = useState([]);
    const [utilityProducts, setUtilityProducts] = useState([]);

    const [loadingIngredientProducts, setLoadingIngredientProducts] =
        useState(false);
    const [loadingDecorProducts, setLoadingDecorProducts] = useState(false);
    const [loadingUtilityProducts, setLoadingUtilityProducts] = useState(false);

    // Forma satrlari – universal strukturada
    // unit_price:
    //  - ingredients: birlik narxi
    //  - decor & utility: JAMI SUMMA (umumiy)
    const [items, setItems] = useState([
        { product_id: "", name: "", quantity: "", unit_price: "" },
    ]);

    // Ro'yxat
    const [expenses, setExpenses] = useState([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);

    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const isIngredients = activeTab === TYPE_INGREDIENTS;
    const isDecor = activeTab === TYPE_DECOR;
    const isUtility = activeTab === TYPE_UTILITY;

    const productOptions = isIngredients
        ? ingredientProducts
        : isDecor
            ? decorProducts
            : utilityProducts;

    const productLabel = isIngredients
        ? "Masalliq *"
        : isDecor
            ? "Bezak mahsulot *"
            : "Kommunal to‘lov *";

    // Umumiy summa (frontendda faqat ko‘rsatish uchun)
    const totalCalculated = useMemo(() => {
        if (isIngredients) {
            // masalliqlar: miqdor * birlik narxi
            return items.reduce((sum, row) => {
                const q = Number(row.quantity || 0);
                const p = Number(row.unit_price || 0);
                if (!q || !p) return sum;
                return sum + q * p;
            }, 0);
        }

        // bezaklar & kommunal: foydalanuvchi kiritgan JAMI SUMMA lar yig‘indisi
        return items.reduce((sum, row) => {
            const total = Number(row.unit_price || 0);
            if (!total) return sum;
            return sum + total;
        }, 0);
    }, [items, isIngredients]);

    // Mahsulotlarni yuklash: masalliq, dekor va kommunal
    useEffect(() => {
        const loadIngredients = async () => {
            try {
                setLoadingIngredientProducts(true);
                const res = await api.get("/products");
                const all = res.data || [];
                const ingrs = all.filter(
                    (p) => p.category === "INGREDIENT"
                );
                setIngredientProducts(ingrs);
            } catch (err) {
                console.error("ingredient load error:", err);
                setError("Masalliq mahsulotlarini yuklashda xatolik.");
            } finally {
                setLoadingIngredientProducts(false);
            }
        };

        const loadDecor = async () => {
            try {
                setLoadingDecorProducts(true);
                const res = await api.get("/products/decorations");
                setDecorProducts(res.data || []);
            } catch (err) {
                console.error("decor load error:", err);
                setError("Bezak mahsulotlarini yuklashda xatolik.");
            } finally {
                setLoadingDecorProducts(false);
            }
        };

        const loadUtility = async () => {
            try {
                setLoadingUtilityProducts(true);
                const res = await api.get("/products/utilities");
                setUtilityProducts(res.data || []);
            } catch (err) {
                console.error("utility load error:", err);
                setError("Kommunal mahsulotlarini yuklashda xatolik.");
            } finally {
                setLoadingUtilityProducts(false);
            }
        };

        loadIngredients();
        loadDecor();
        loadUtility();
    }, []);

    // Tanlangan tur bo‘yicha xarajatlar ro‘yxatini yuklash
    const fetchExpenses = async (type = activeTab) => {
        try {
            setLoadingExpenses(true);
            const res = await api.get("/expenses", { params: { type } });
            setExpenses(res.data || []);
        } catch (err) {
            console.error("loadExpenses error:", err);
            setError("Xarajatlar ro‘yxatini yuklashda xatolik.");
        } finally {
            setLoadingExpenses(false);
        }
    };

    useEffect(() => {
        fetchExpenses(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const resetForm = () => {
        setDate(new Date().toISOString().slice(0, 10));
        setItems([{ product_id: "", name: "", quantity: "", unit_price: "" }]);
        setEditingId(null);
    };

    const onTabChange = (tabKey) => {
        setActiveTab(tabKey);
        resetForm();
    };

    const handleItemChange = (index, field, value) => {
        setItems((prev) => {
            const copy = [...prev];
            const row = { ...copy[index], [field]: value };

            if (field === "product_id") {
                const p = productOptions.find(
                    (x) => String(x.id) === String(value)
                );
                if (p) {
                    row.name = p.name;
                }
            }

            copy[index] = row;
            return copy;
        });
    };

    const addRow = () => {
        setItems((prev) => [
            ...prev,
            { product_id: "", name: "", quantity: "", unit_price: "" },
        ]);
    };

    const removeRow = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const preparedItems = [];

        for (const it of items) {
            let product_id = it.product_id ? Number(it.product_id) : null;
            let quantity = Number(it.quantity || 0);
            let unit_price = Number(it.unit_price || 0);
            let name = (it.name || "").trim();

            if (!product_id) continue;

            if (isIngredients) {
                // Masalliqlar – product tanlaydi, miqdor + birlik narxi
                if (!quantity || quantity <= 0) continue;
                if (!unit_price || unit_price <= 0) continue;

                const p = ingredientProducts.find(
                    (x) => x.id === product_id
                );
                name = p?.name || name;

                preparedItems.push({
                    product_id,
                    name,
                    quantity,
                    unit_price,
                });
            } else if (isDecor) {
                // Bezaklar – product, miqdor (ixtiyoriy), JAMI SUMMA
                if (!unit_price || unit_price <= 0) continue;

                if (!quantity || quantity <= 0) {
                    quantity = 1;
                }

                const totalSum = unit_price;
                const calculatedUnitPrice = totalSum / quantity;

                preparedItems.push({
                    product_id,
                    name: "",
                    quantity,
                    unit_price: calculatedUnitPrice,
                });
            } else if (isUtility) {
                // Kommunal – product, JAMI SUMMA
                if (!unit_price || unit_price <= 0) continue;

                preparedItems.push({
                    product_id,
                    name: "",
                    quantity: 1,
                    unit_price,
                });
            }
        }

        if (!preparedItems.length) {
            setError("Kamida bitta to‘liq xarajat bandini kiriting.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                type: activeTab, // ingredients | decor | utility
                date, // backendda expense_date ga aylantiriladi
                description: "", // izohni ishlatmaymiz
                items: preparedItems,
                created_by: user?.id || null,
            };

            if (editingId) {
                await api.put(`/expenses/${editingId}`, payload);
                setSuccess("Xarajat muvaffaqiyatli yangilandi.");
            } else {
                await api.post("/expenses", payload);
                setSuccess("Xarajat muvaffaqiyatli saqlandi.");
            }

            resetForm();
            await fetchExpenses(activeTab);
        } catch (err) {
            console.error("create/update expense error:", err);
            const msg =
                err?.response?.data?.message ||
                err.message ||
                "Xarajatni saqlashda xatolik.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (expense) => {
        setEditingId(expense.id);
        setActiveTab(expense.type || TYPE_INGREDIENTS);
        setDate(expense.expense_date || date);

        if (Array.isArray(expense.items) && expense.items.length > 0) {
            if (expense.type === TYPE_INGREDIENTS) {
                setItems(
                    expense.items.map((it) => ({
                        product_id: it.product_id || "",
                        name: it.name || "",
                        quantity:
                            it.quantity != null ? String(it.quantity) : "",
                        unit_price:
                            it.unit_price != null ? String(it.unit_price) : "",
                    }))
                );
            } else {
                setItems(
                    expense.items.map((it) => {
                        const q = Number(it.quantity || 0);
                        const p = Number(it.unit_price || 0);
                        const lineTotal =
                            q && p ? String(q * p) : p ? String(p) : "";

                        return {
                            product_id: it.product_id || "",
                            name: it.name || "",
                            quantity:
                                expense.type === TYPE_DECOR && it.quantity != null
                                    ? String(it.quantity)
                                    : "",
                            unit_price: lineTotal, // formdagi "Jami summa"
                        };
                    })
                );
            }
        } else {
            setItems([{ product_id: "", name: "", quantity: "", unit_price: "" }]);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleDelete = async (expense) => {
        const confirmed = window.confirm(
            `Ushbu xarajatni (${expense.expense_date}, ${expense.total_amount} so'm) o‘chirishni xohlaysizmi?`
        );
        if (!confirmed) return;

        try {
            await api.delete(`/expenses/${expense.id}`);
            setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
        } catch (err) {
            console.error("delete expense error:", err);
            const msg =
                err?.response?.data?.message ||
                "Xarajatni o‘chirishda xatolik.";
            setError(msg);
        }
    };

    const typeLabel = (() => {
        if (isIngredients) return "Masalliqlar";
        if (isDecor) return "Bezaklar / salyut";
        if (isUtility) return "Kommunal to‘lovlar";
        return "";
    })();

    const currentTabInfo = isIngredients
        ? "Masalliqlar – products → Masalliq bo‘limidan tanlanadi."
        : isDecor
            ? "Bezaklar – products → Dekoratsiya / bezak bo‘limidan tanlanadi. Jami summani kiriting."
            : "Kommunal to‘lovlar – products → Kommunal (UTILITY) bo‘limidan tanlanadi. Jami summani kiriting.";

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Xarajatlar</h1>
                    <p className="page-subtitle">
                        Masalliqlar, bezaklar va kommunal to‘lovlar bo‘yicha xarajatlarni
                        kiritish va ko‘rish.
                    </p>
                </div>

                <div className="page-header-actions">
                    <input
                        className="input"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            {/* TABLAR */}
            <div
                className="tabs"
                style={{
                    marginBottom: 12,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={
                            "button-primary" +
                            (activeTab === tab.key ? "" : " button-secondary")
                        }
                        style={{
                            padding: "10px 18px",
                            fontSize: 14,
                            boxShadow: "none",
                            opacity: activeTab === tab.key ? 1 : 0.75,
                            borderRadius: 12,
                            minWidth: 180,
                            textAlign: "center",
                        }}
                        onClick={() => onTabChange(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
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

            {/* FORMA */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">{typeLabel} xarajati</div>
                        <div className="card-subtitle">{currentTabInfo}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{productLabel}</th>

                                    {/* Miqdor – masalliqlar va bezaklar uchun */}
                                    {!isUtility && <th>Miqdor</th>}

                                    {/* Birlik narxi – faqat masalliqlar */}
                                    {isIngredients && <th>Birlik narxi</th>}

                                    {/* Jami / Jami summa kolonkalari */}
                                    {isIngredients && <th>Jami</th>}
                                    {!isIngredients && <th>Jami summa</th>}

                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row, index) => {
                                    const q = Number(row.quantity || 0);
                                    const p = Number(row.unit_price || 0);
                                    const total =
                                        isIngredients && q && p ? q * p : 0;

                                    const loadingProducts = isIngredients
                                        ? loadingIngredientProducts
                                        : isDecor
                                            ? loadingDecorProducts
                                            : loadingUtilityProducts;

                                    const placeholder = isIngredients
                                        ? "Masalliqni tanlang"
                                        : isDecor
                                            ? "Bezak mahsulotini tanlang"
                                            : "Kommunal mahsulotni tanlang";

                                    return (
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
                                                    <option value="">
                                                        {loadingProducts
                                                            ? "Yuklanmoqda..."
                                                            : placeholder}
                                                    </option>
                                                    {productOptions.map((p) => (
                                                        <option
                                                            key={p.id}
                                                            value={p.id}
                                                        >
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            {!isUtility && (
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
                                            )}

                                            {isIngredients && (
                                                <td>
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={row.unit_price}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                index,
                                                                "unit_price",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Birlik narxi"
                                                    />
                                                </td>
                                            )}

                                            {isIngredients ? (
                                                <td>
                                                    {total
                                                        ? total.toLocaleString(
                                                            "uz-UZ"
                                                        ) + " so‘m"
                                                        : "—"}
                                                </td>
                                            ) : (
                                                <td>
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={row.unit_price}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                index,
                                                                "unit_price",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Jami summa"
                                                    />
                                                </td>
                                            )}

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
                                                        onClick={() =>
                                                            removeRow(index)
                                                        }
                                                    >
                                                        O‘chirish
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
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
                        <div style={{ fontSize: 14 }}>
                            Umumiy summa (hisoblangan):{" "}
                            <strong>
                                {totalCalculated.toLocaleString("uz-UZ")} so‘m
                            </strong>
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

                    <div
                        style={{
                            marginTop: 14,
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                        }}
                    >
                        <button
                            className="button-primary"
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saqlanmoqda..."
                                : editingId
                                    ? "O‘zgartirishni saqlash"
                                    : "Xarajatni saqlash"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="button-primary"
                                style={{
                                    background: "transparent",
                                    border: "1px solid rgba(148,163,184,0.7)",
                                    color: "#e5e7eb",
                                    boxShadow: "none",
                                }}
                                onClick={handleCancelEdit}
                            >
                                Bekor qilish
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* RO'YXAT */}
            <div className="card" style={{ marginTop: 16 }}>
                <div
                    style={{
                        marginBottom: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div className="card-title" style={{ marginBottom: 0 }}>
                        {typeLabel} bo‘yicha so‘nggi xarajatlar
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                        Jami: <strong>{expenses.length}</strong> ta yozuv
                    </div>
                </div>

                {loadingExpenses ? (
                    <p>Yuklanmoqda...</p>
                ) : expenses.length === 0 ? (
                    <p>Hozircha bu bo‘lim bo‘yicha xarajatlar yo‘q.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>SANA</th>
                                    <th>NOMLAR</th>
                                    <th>UMUMIY SUMMA</th>
                                    <th style={{ width: 140 }}>AMALLAR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((exp) => {
                                    const itemsSummary =
                                        Array.isArray(exp.items) &&
                                            exp.items.length > 0
                                            ? exp.items
                                                .map(
                                                    (it) =>
                                                        it.name ||
                                                        it.product_name ||
                                                        ""
                                                )
                                                .filter(Boolean)
                                                .join(", ")
                                            : "-";

                                    return (
                                        <tr key={exp.id}>
                                            <td>{exp.expense_date}</td>
                                            <td>{itemsSummary}</td>
                                            <td>
                                                {typeof exp.total_amount ===
                                                    "number"
                                                    ? exp.total_amount.toLocaleString(
                                                        "uz-UZ"
                                                    )
                                                    : "-"}
                                            </td>
                                            <td>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 6,
                                                        justifyContent:
                                                            "flex-start",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        className="button-primary"
                                                        style={{
                                                            padding: "3px 8px",
                                                            fontSize: 11,
                                                            boxShadow: "none",
                                                        }}
                                                        onClick={() =>
                                                            handleEdit(exp)
                                                        }
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="button-primary"
                                                        style={{
                                                            padding: "3px 8px",
                                                            fontSize: 11,
                                                            boxShadow: "none",
                                                            background:
                                                                "#dc2626",
                                                        }}
                                                        onClick={() =>
                                                            handleDelete(exp)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExpensesPage;
