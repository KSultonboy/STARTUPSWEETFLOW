// client/src/components/products/ProductsFilterBar.jsx
import React from "react";

function ProductsFilterBar({ totalCount, filter, onFilterChange, filterOptions }) {
    return (
        <div className="filterbar filterbar--space">
            <div className="filterbar__meta">
                Jami: <strong>{totalCount}</strong> ta mahsulot
            </div>

            <div className="filterbar__field">
                <label>Filter</label>
                <select className="input" value={filter} onChange={(e) => onFilterChange(e.target.value)}>
                    {filterOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default ProductsFilterBar;
