// client/src/pages/ProductsPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const FILTER_ALL = "ALL";
const FILTER_KG = "KG";
const FILTER_PIECE = "PIECE";
const FILTER_DECOR = "DECOR";
const FILTER_UTILITY = "UTILITY";
const FILTER_PRODUCT = "PRODUCT_ONLY";
const FILTER_INGREDIENT = "INGREDIENT_ONLY";

const CATEGORY_PRODUCT = "PRODUCT";
const CATEGORY_DECORATION = "DECORATION";
const CATEGORY_UTILITY = "UTILITY";
const CATEGORY_INGREDIENT = "INGREDIENT";

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState(FILTER_ALL);

    const [form, setForm] = useState({
        name: "",
        unit: "dona", // 'dona' yoki 'kg'
        price: "",
        wholesale_price: "",
        category: CATEGORY_PRODUCT, // PRODUCT | DECORATION | UTILITY | INGREDIENT
    });

    const formatUnit = (unit) => {
        if (!unit) return "-";
        if (unit === "piece") return "dona";
        if (unit === "dona") return "dona";
        return unit;
    };

    const formatCategory = (category) => {
        if (!category) return "-";
        if (category === CATEGORY_DECORATION) return "Dekoratsiya / bezak";
        if (category === CATEGORY_PRODUCT) return "Ishlab chiqilgan mahsulot";
        if (category === CATEGORY_UTILITY) return "Kommunal / xizmat";
        if (category === CATEGORY_INGREDIENT) return "Masalliq";
        return category;
    };

    const isProduct = form.category === CATEGORY_PRODUCT;
    const isDecor = form.category === CATEGORY_DECORATION;
    const isUtility = form.category === CATEGORY_UTILITY;
    const isIngredient = form.category === CATEGORY_INGREDIENT;

    const nameLabel = isUtility
        ? "Kommunal xizmat nomi"
        : isIngredient
            ? "Masalliq nomi"
            : "Mahsulot nomi";

    const priceLabel =
        isUtility || isIngredient ? "Narx" : "Filiallar uchun narx";

    // Productlarni yuklash
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/products");
            const data = res.data || [];
            // Yangi qo'shilganlar tepada ko'rinsin
            setProducts(data.slice().reverse());
        } catch (err) {
            console.error(err);
            setError("Mahsulotlarni yuklashda xato");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Form o‘zgarishlari
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "category") {
            setForm((prev) => ({
                ...prev,
                category: value,
                unit:
                    value === CATEGORY_UTILITY
                        ? "dona"
                        : prev.unit || "dona",
                wholesale_price:
                    value === CATEGORY_PRODUCT ? prev.wholesale_price : "",
            }));
            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setForm({
            name: "",
            unit: "dona",
            price: "",
            wholesale_price: "",
            category: CATEGORY_PRODUCT,
        });
        setEditingId(null);
    };

    // Mahsulot qo‘shish / tahrirlash
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.name.trim()) {
            setError(
                isUtility
                    ? "Kommunal xizmat nomi majburiy"
                    : isIngredient
                        ? "Masalliq nomi majburiy"
                        : "Mahsulot nomi majburiy"
            );
            return;
        }

        try {
            setSaving(true);

            const payload = {
                name: form.name.trim(),
                unit: isUtility ? "dona" : form.unit,
                category: form.category,
                price: Number(form.price) || 0,
                wholesale_price:
                    isProduct && form.wholesale_price !== ""
                        ? Number(form.wholesale_price) || 0
                        : 0,
            };

            if (editingId) {
                const res = await api.put(`/products/${editingId}`, payload);
                const updated = res.data;
                setProducts((prev) =>
                    prev.map((p) => (p.id === editingId ? updated : p))
                );
            } else {
                const res = await api.post("/products", payload);
                setProducts((prev) => [res.data, ...prev]);
            }

            resetForm();
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Mahsulotni saqlashda xatolik";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product) => {
        setEditingId(product.id);
        setForm({
            name: product.name || "",
            unit: product.unit === "kg" ? "kg" : "dona",
            price:
                typeof product.price === "number" ? String(product.price) : "",
            wholesale_price:
                typeof product.wholesale_price === "number"
                    ? String(product.wholesale_price)
                    : "",
            category: product.category || CATEGORY_PRODUCT,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleDelete = async (product) => {
        const confirmed = window.confirm(
            `"${product.name}" mahsulotini haqiqatan ham o'chirmoqchimisiz?`
        );
        if (!confirmed) return;

        try {
            await api.delete(`/products/${product.id}`);
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Mahsulotni o'chirishda xatolik";
            setError(msg);
        }
    };

    const filteredProducts = useMemo(
        () =>
            products.filter((p) => {
                if (filter === FILTER_KG) return p.unit === "kg";
                if (filter === FILTER_PIECE)
                    return p.unit === "piece" || p.unit === "dona";
                if (filter === FILTER_DECOR)
                    return p.category === CATEGORY_DECORATION;
                if (filter === FILTER_UTILITY)
                    return p.category === CATEGORY_UTILITY;
                if (filter === FILTER_PRODUCT)
                    return p.category === CATEGORY_PRODUCT;
                if (filter === FILTER_INGREDIENT)
                    return p.category === CATEGORY_INGREDIENT;
                return true;
            }),
        [products, filter]
    );

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Mahsulotlar</h1>
                    <p className="page-subtitle">
                        Ishlab chiqilgan mahsulotlar, masalliqlar, bezaklar va
                        kommunal xizmatlar ro&apos;yxati.
                    </p>
                </div>
            </div>

            <div className="card">
                {/* Error box */}
                {error && (
                    <div
                        style={{
                            marginBottom: 12,
                            padding: 8,
                            borderRadius: 6,
                            background: "#ffe5e5",
                            color: "#a20000",
                            fontSize: 13,
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Add / edit product form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        {/* Kategoriya eng tepada */}
                        <div>
                            <label>Kategoriya</label>
                            <select
                                className="input"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                            >
                                <option value={CATEGORY_PRODUCT}>
                                    Ishlab chiqilgan mahsulot
                                </option>
                                <option value={CATEGORY_INGREDIENT}>
                                    Masalliq
                                </option>
                                <option value={CATEGORY_DECORATION}>
                                    Dekoratsiya / bezak
                                </option>
                                <option value={CATEGORY_UTILITY}>
                                    Kommunal / xizmat
                                </option>
                            </select>
                        </div>

                        {/* Nomi */}
                        <div>
                            <label>{nameLabel}</label>
                            <input
                                className="input"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder={
                                    isUtility
                                        ? "Masalan: Elektr energiyasi"
                                        : isIngredient
                                            ? "Masalan: Un 50kg"
                                            : "Masalan: Tort 1 kg"
                                }
                            />
                        </div>

                        {/* Birlik – kommunalda ko'rinmaydi */}
                        {!isUtility && (
                            <div>
                                <label>Birlik</label>
                                <select
                                    className="input"
                                    name="unit"
                                    value={form.unit}
                                    onChange={handleChange}
                                >
                                    <option value="dona">dona</option>
                                    <option value="kg">kg</option>
                                </select>
                            </div>
                        )}

                        {/* Narx – hamma kategoriyada bor, label o'zgaradi */}
                        <div>
                            <label>{priceLabel}</label>
                            <input
                                className="input"
                                name="price"
                                type="number"
                                value={form.price}
                                onChange={handleChange}
                                placeholder="0"
                            />
                        </div>

                        {/* Do‘konlar uchun narx – faqat ishlab chiqilgan mahsulot uchun */}
                        {isProduct && (
                            <div>
                                <label>Do‘konlar uchun narx (ulgurji)</label>
                                <input
                                    className="input"
                                    name="wholesale_price"
                                    type="number"
                                    value={form.wholesale_price}
                                    onChange={handleChange}
                                    placeholder="0"
                                />
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                        }}
                    >
                        <button className="button-primary" disabled={saving}>
                            {saving
                                ? "Saqlanmoqda..."
                                : editingId
                                    ? "O'zgartirishni saqlash"
                                    : "Qo‘shish"}
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

                <hr style={{ margin: "20px 0" }} />

                {/* Filter panel */}
                <div
                    style={{
                        marginBottom: 10,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                        Jami: <strong>{products.length}</strong> ta mahsulot
                    </div>

                    <div style={{ minWidth: 220 }}>
                        <label
                            style={{
                                fontSize: 12,
                                display: "block",
                                marginBottom: 4,
                                opacity: 0.8,
                            }}
                        >
                            Filter
                        </label>
                        <select
                            className="input"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value={FILTER_ALL}>Hammasi</option>
                            <option value={FILTER_KG}>Faqat kg</option>
                            <option value={FILTER_PIECE}>Faqat dona</option>
                            <option value={FILTER_PRODUCT}>
                                Faqat ishlab chiqilgan mahsulotlar
                            </option>
                            <option value={FILTER_INGREDIENT}>
                                Faqat masalliqlar
                            </option>
                            <option value={FILTER_DECOR}>
                                Faqat bezaklar
                            </option>
                            <option value={FILTER_UTILITY}>
                                Faqat kommunal
                            </option>
                        </select>
                    </div>
                </div>

                {/* Products list */}
                {loading ? (
                    <p>Yuklanmoqda...</p>
                ) : filteredProducts.length === 0 ? (
                    <p>Ko‘rsatiladigan mahsulot yo‘q.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>T/r</th>
                                    <th>Nomi</th>
                                    <th>Birlik</th>
                                    <th>Kategoriya</th>
                                    <th>Narx</th>
                                    <th>Do‘kon narxi</th>
                                    <th style={{ width: 140 }}>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((p, index) => (
                                    <tr key={p.id}>
                                        <td>{index + 1}</td>
                                        <td>{p.name}</td>
                                        <td>{formatUnit(p.unit)}</td>
                                        <td>{formatCategory(p.category)}</td>
                                        <td>
                                            {typeof p.price === "number"
                                                ? p.price.toLocaleString("uz-UZ")
                                                : "-"}
                                        </td>
                                        <td>
                                            {p.category === CATEGORY_PRODUCT &&
                                                typeof p.wholesale_price === "number" &&
                                                p.wholesale_price > 0
                                                ? p.wholesale_price.toLocaleString(
                                                    "uz-UZ"
                                                )
                                                : "-"}
                                        </td>
                                        <td>
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
                                                    }}
                                                    onClick={() => handleEdit(p)}
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
                                                        background: "#dc2626",
                                                    }}
                                                    onClick={() => handleDelete(p)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductsPage;
