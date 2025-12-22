// client/src/pages/WarehousePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/authContext";

import WarehouseFilters from "../components/warehouse/WarehouseFilters";
import WarehouseTable from "../components/warehouse/WarehouseTable";

function WarehousePage() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const isBranch = user?.role === "branch";

    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [branchFilter, setBranchFilter] = useState("all");
    const [productFilter, setProductFilter] = useState("all");

    const fetchStock = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {};

            if (isBranch && user?.branch_id) {
                // filial / do'kon user – faqat o'z joyini ko'radi
                params.branch_id = user.branch_id;
            } else if (isAdmin && branchFilter !== "all") {
                // admin: 'central' yoki aniq filial id
                params.branch_id = branchFilter;
            }

            const res = await api.get("/warehouse/stock", { params });
            setStock(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Ombor qoldiqlarini yuklashda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchFilter, isBranch, user?.branch_id]);

    // 🔹 Admin uchun filiallar dropdown – OUTLET larni ko‘rsatmaymiz
    const branches = useMemo(() => {
        if (!isAdmin) return [];

        const map = new Map();

        stock.forEach((item) => {
            const type = String(item.branch_type || "BRANCH").toUpperCase();
            if (type === "OUTLET") return; // do‘konlarni umuman ko‘rsatmaymiz

            const id = item.branch_id ?? "central";
            const name = item.branch_name || "Markaziy ombor";

            if (!map.has(id)) {
                map.set(id, { name, type });
            }
        });

        const result = [{ id: "all", name: "Barchasi" }];

        // Markaziy omborni alohida doimiy qo‘shamiz
        result.push({ id: "central", name: "Markaziy ombor" });

        for (const [id, info] of map.entries()) {
            if (id === "central") continue;
            result.push({ id, name: info.name });
        }

        return result;
    }, [stock, isAdmin]);

    // Mahsulotlar dropdown ro‘yхati
    const products = useMemo(() => {
        const map = new Map();

        stock.forEach((item) => {
            if (!map.has(item.product_id)) {
                map.set(item.product_id, item.product_name);
            }
        });

        const result = [{ id: "all", name: "Barchasi" }];
        for (const [id, name] of map.entries()) {
            result.push({ id, name });
        }

        return result;
    }, [stock]);

    // 🔹 Jadvalda OUTLET qoldiqlarini umuman ko‘rsatmaymiz
    const filteredStocks = useMemo(() => {
        return (stock || []).filter((item) => {
            const type = String(item.branch_type || "BRANCH").toUpperCase();
            if (type === "OUTLET") return false; // do‘konlar ombori chiqmasin

            const byProduct =
                productFilter === "all" ||
                String(item.product_id) === String(productFilter);

            return byProduct;
        });
    }, [stock, productFilter]);

    const title =
        isBranch && user?.branch_name
            ? `Omborxona (${user.branch_name})`
            : "Omborxona";

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{title}</h1>
                    <p className="page-subtitle">
                        Mahsulot qoldiqlari va ombor holatini kuzatish bo‘limi.
                    </p>
                </div>

                <WarehouseFilters
                    isAdmin={isAdmin}
                    branches={branches}
                    branchFilter={branchFilter}
                    onBranchFilterChange={(val) => {
                        setBranchFilter(val);
                        setProductFilter("all"); // filial o‘zgarsa – mahsulot filtri reset
                    }}
                    products={products}
                    productFilter={productFilter}
                    onProductFilterChange={setProductFilter}
                />
            </div>

            {error && (
                <div className="info-box info-box--error" style={{ marginBottom: 8 }}>
                    {error}
                </div>
            )}

            <WarehouseTable loading={loading} stocks={filteredStocks} />
        </div>
    );
}

export default WarehousePage;
