// client/src/pages/ExpensesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/authContext";

import ExpensesTabs from "../components/expenses/ExpensesTabs";
import ExpensesForm from "../components/expenses/ExpensesForm";
import ExpensesList from "../components/expenses/ExpensesList";

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

    // Forma satrlari
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

    const productLabel = isIngredients
        ? "Masalliq *"
        : isDecor
            ? "Bezak mahsulot *"
            : "Kommunal to‘lov *";

    // Umumiy summa (faqat ko‘rsatish uchun)
    const totalCalculated = useMemo(() => {
        if (isIngredients) {
            return items.reduce((sum, row) => {
                const q = Number(row.quantity || 0);
                const p = Number(row.unit_price || 0);
                if (!q || !p) return sum;
                return sum + q * p;
            }, 0);
        }

        return items.reduce((sum, row) => {
            const total = Number(row.unit_price || 0);
            if (!total) return sum;
            return sum + total;
        }, 0);
    }, [items, isIngredients]);

    // Mahsulotlarni yuklash
    useEffect(() => {
        const loadIngredients = async () => {
            try {
                setLoadingIngredientProducts(true);
                const res = await api.get("/products");
                const all = res.data || [];
                const ingrs = all.filter((p) => p.category === "INGREDIENT");
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
        setError("");
        setSuccess("");
    };

    const handleItemChange = (index, field, value) => {
        const productOptions = isIngredients
            ? ingredientProducts
            : isDecor
                ? decorProducts
                : utilityProducts;

        setItems((prev) => {
            const copy = [...prev];
            const row = { ...copy[index], [field]: value };

            if (field === "product_id") {
                const p = productOptions.find((x) => String(x.id) === String(value));
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
                if (!quantity || quantity <= 0) continue;
                if (!unit_price || unit_price <= 0) continue;

                const p = ingredientProducts.find((x) => x.id === product_id);
                name = p?.name || name;

                preparedItems.push({
                    product_id,
                    name,
                    quantity,
                    unit_price,
                });
            } else if (isDecor) {
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
                type: activeTab,
                date,
                description: "",
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
                        quantity: it.quantity != null ? String(it.quantity) : "",
                        unit_price: it.unit_price != null ? String(it.unit_price) : "",
                    }))
                );
            } else {
                setItems(
                    expense.items.map((it) => {
                        const q = Number(it.quantity || 0);
                        const p = Number(it.unit_price || 0);
                        const lineTotal = q && p ? String(q * p) : p ? String(p) : "";

                        return {
                            product_id: it.product_id || "",
                            name: it.name || "",
                            quantity:
                                expense.type === TYPE_DECOR && it.quantity != null
                                    ? String(it.quantity)
                                    : "",
                            unit_price: lineTotal,
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
                err?.response?.data?.message || "Xarajatni o‘chirishda xatolik.";
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
            <ExpensesTabs
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={onTabChange}
            />

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
            <ExpensesForm
                typeLabel={typeLabel}
                currentTabInfo={currentTabInfo}
                productLabel={productLabel}
                items={items}
                isIngredients={isIngredients}
                isDecor={isDecor}
                isUtility={isUtility}
                ingredientProducts={ingredientProducts}
                decorProducts={decorProducts}
                utilityProducts={utilityProducts}
                loadingIngredientProducts={loadingIngredientProducts}
                loadingDecorProducts={loadingDecorProducts}
                loadingUtilityProducts={loadingUtilityProducts}
                totalCalculated={totalCalculated}
                saving={saving}
                editingId={editingId}
                onSubmit={handleSubmit}
                onCancelEdit={handleCancelEdit}
                onAddRow={addRow}
                onRemoveRow={removeRow}
                onItemChange={handleItemChange}
            />

            {/* RO'YXAT */}
            <ExpensesList
                typeLabel={typeLabel}
                expenses={expenses}
                loading={loadingExpenses}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}

export default ExpensesPage;
