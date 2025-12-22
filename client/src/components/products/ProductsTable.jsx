// client/src/components/products/ProductsTable.jsx
import React from "react";

const CATEGORY_PRODUCT = "PRODUCT";
const CATEGORY_DECORATION = "DECORATION";
const CATEGORY_UTILITY = "UTILITY";
const CATEGORY_INGREDIENT = "INGREDIENT";

function formatUnit(unit) {
    if (!unit) return "—";
    if (unit === "piece") return "dona";
    if (unit === "dona") return "dona";
    return unit;
}

function formatCategory(category) {
    if (!category) return "—";
    if (category === CATEGORY_DECORATION) return "Dekoratsiya / bezak";
    if (category === CATEGORY_PRODUCT) return "Ishlab chiqilgan mahsulot";
    if (category === CATEGORY_UTILITY) return "Kommunal / xizmat";
    if (category === CATEGORY_INGREDIENT) return "Masalliq";
    return category;
}

function ProductsTable({ loading, products, onEdit, onDelete }) {
    if (loading) return <p>Yuklanmoqda...</p>;
    if (!products.length) return <p>Ko‘rsatiladigan mahsulot yo‘q.</p>;

    return (
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
                        <th style={{ width: 120 }}>Amallar</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p, index) => (
                        <tr key={p.id}>
                            <td data-label="T/r">{index + 1}</td>
                            <td data-label="Nomi">{p.name}</td>
                            <td data-label="Birlik">{formatUnit(p.unit)}</td>
                            <td data-label="Kategoriya">{formatCategory(p.category)}</td>
                            <td data-label="Narx">
                                {typeof p.price === "number" ? p.price.toLocaleString("uz-UZ") : "—"}
                            </td>
                            <td data-label="Do‘kon narxi">
                                {p.category === CATEGORY_PRODUCT &&
                                    typeof p.wholesale_price === "number" &&
                                    p.wholesale_price > 0
                                    ? p.wholesale_price.toLocaleString("uz-UZ")
                                    : "—"}
                            </td>
                            <td data-label="Amallar">
                                <div className="history-actions">
                                    <button
                                        type="button"
                                        className="btn-icon btn-icon--edit"
                                        title="Tahrirlash"
                                        onClick={() => onEdit(p)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-icon btn-icon--delete"
                                        title="O‘chirish"
                                        onClick={() => onDelete(p)}
                                    >
                                        🗑
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ProductsTable;
