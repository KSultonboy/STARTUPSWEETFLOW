// client/src/pages/ProductsPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

import ProductForm from "../components/products/ProductForm";
import ProductsFilterBar from "../components/products/ProductsFilterBar";
import ProductsTable from "../components/products/ProductsTable";

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

    const isProduct = form.category === CATEGORY_PRODUCT;
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
                unit: value === CATEGORY_UTILITY ? "dona" : prev.unit || "dona",
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

        const normalizedName = form.name.trim().toLowerCase();
        const existingByName = (products || []).find(
            (p) => String(p.name || "").trim().toLowerCase() === normalizedName
        );
        if (existingByName && Number(existingByName.id) !== Number(editingId)) {
            setError("Bu nomdagi mahsulot allaqachon mavjud.");
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
            price: typeof product.price === "number" ? String(product.price) : "",
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
                if (filter === FILTER_DECOR) return p.category === CATEGORY_DECORATION;
                if (filter === FILTER_UTILITY) return p.category === CATEGORY_UTILITY;
                if (filter === FILTER_PRODUCT) return p.category === CATEGORY_PRODUCT;
                if (filter === FILTER_INGREDIENT)
                    return p.category === CATEGORY_INGREDIENT;
                return true;
            }),
        [products, filter]
    );

    const filterOptions = [
        { value: FILTER_ALL, label: "Hammasi" },
        { value: FILTER_KG, label: "Faqat kg" },
        { value: FILTER_PIECE, label: "Faqat dona" },
        {
            value: FILTER_PRODUCT,
            label: "Faqat ishlab chiqilgan mahsulotlar",
        },
        { value: FILTER_INGREDIENT, label: "Faqat masalliqlar" },
        { value: FILTER_DECOR, label: "Faqat bezaklar" },
        { value: FILTER_UTILITY, label: "Faqat kommunal" },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Mahsulotlar</h1>
                    <p className="page-subtitle">
                        Ishlab chiqilgan mahsulotlar, masalliqlar, bezaklar va kommunal
                        xizmatlar ro&apos;yxati.
                    </p>
                </div>
            </div>

            <div className="card">
                {/* Error box */}
                {error && (
                    <div
                        className="info-box info-box--error"
                        style={{ marginBottom: 12 }}
                    >
                        {error}
                    </div>
                )}

                {/* Form */}
                <ProductForm
                    form={form}
                    isProduct={isProduct}
                    isUtility={isUtility}
                    isIngredient={isIngredient}
                    nameLabel={nameLabel}
                    priceLabel={priceLabel}
                    saving={saving}
                    editingId={editingId}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancelEdit={handleCancelEdit}
                />

                <hr style={{ margin: "20px 0" }} />

                {/* Filter panel */}
                <ProductsFilterBar
                    totalCount={products.length}
                    filter={filter}
                    onFilterChange={setFilter}
                    filterOptions={filterOptions}
                />

                {/* Products list */}
                <ProductsTable
                    loading={loading}
                    products={filteredProducts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}

export default ProductsPage;
