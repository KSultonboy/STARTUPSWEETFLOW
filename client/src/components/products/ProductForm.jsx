// client/src/components/products/ProductForm.jsx
import React from "react";

const CATEGORY_PRODUCT = "PRODUCT";
const CATEGORY_DECORATION = "DECORATION";
const CATEGORY_UTILITY = "UTILITY";
const CATEGORY_INGREDIENT = "INGREDIENT";

function ProductForm({
    form,
    isProduct,
    isUtility,
    isIngredient,
    nameLabel,
    priceLabel,
    saving,
    editingId,
    onChange,
    onSubmit,
    onCancelEdit,
}) {
    return (
        <form onSubmit={onSubmit}>
            <div className="form-row">
                {/* Kategoriya */}
                <div>
                    <label className="form-label">Kategoriya</label>
                    <select
                        className="input"
                        name="category"
                        value={form.category}
                        onChange={onChange}
                    >
                        <option value={CATEGORY_PRODUCT}>Ishlab chiqilgan mahsulot</option>
                        <option value={CATEGORY_INGREDIENT}>Masalliq</option>
                        <option value={CATEGORY_DECORATION}>Dekoratsiya / bezak</option>
                        <option value={CATEGORY_UTILITY}>Kommunal / xizmat</option>
                    </select>
                </div>

                {/* Nomi */}
                <div>
                    <label className="form-label">{nameLabel}</label>
                    <input
                        className="input"
                        name="name"
                        value={form.name}
                        onChange={onChange}
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

                {/* Shtrix kod (ixtiyoriy, lekin maxsus sotuv uchun foydali) */}
                <div>
                    <label className="form-label">Shtrix kod (Barcode)</label>
                    <input
                        className="input"
                        name="barcode"
                        value={form.barcode || ""}
                        onChange={onChange}
                        placeholder="Masalan: 4780012345678"
                    />
                </div>

                {/* Birlik – kommunalda ko‘rinmaydi */}
                {!isUtility && (
                    <div>
                        <label className="form-label">Birlik</label>
                        <select
                            className="input"
                            name="unit"
                            value={form.unit}
                            onChange={onChange}
                        >
                            <option value="dona">dona</option>
                            <option value="kg">kg</option>
                        </select>
                    </div>
                )}

                {/* Narx – hamma kategoriyada bor, label o‘zgaradi */}
                <div>
                    <label className="form-label">{priceLabel}</label>
                    <input
                        className="input"
                        name="price"
                        type="number"
                        value={form.price}
                        onChange={onChange}
                        placeholder="0"
                    />
                </div>

                {/* Do‘konlar uchun narx – faqat ishlab chiqilgan mahsulot uchun */}
                {isProduct && (
                    <div>
                        <label className="form-label">Do‘konlar uchun narx (ulgurji)</label>
                        <input
                            className="input"
                            name="wholesale_price"
                            type="number"
                            value={form.wholesale_price}
                            onChange={onChange}
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
                <button className="btn button-primary" disabled={saving}>
                    {saving
                        ? "Saqlanmoqda..."
                        : editingId
                            ? "O‘zgartirishni saqlash"
                            : "Qo‘shish"}
                </button>

                {editingId && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ boxShadow: "none" }}
                        onClick={onCancelEdit}
                    >
                        Bekor qilish
                    </button>
                )}
            </div>
        </form>
    );
}

export default ProductForm;
