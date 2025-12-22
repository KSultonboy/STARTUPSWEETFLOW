// client/src/pages/HistoryPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/authContext";

import HistoryFilters from "../components/history/HistoryFilters";
import HistoryTable from "../components/history/HistoryTable";

function HistoryPage() {
    const { user } = useAuth(); // { id, role, branch_id, branch_name }
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = user?.role === "admin";
    const isProduction = user?.role === "production";
    const isSales = user?.role === "sales";

    // URL query parametridan boshlang'ich typeFilterni olamiz (masalan: ?type=production)
    const searchParams = new URLSearchParams(location.search);
    const initialTypeFromUrl = searchParams.get("type") || "all";

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filtrlar (faqat admin uchun)
    const [typeFilter, setTypeFilter] = useState(initialTypeFromUrl);
    const [branchFilter, setBranchFilter] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Xabarlar
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const params = {};

            if (isAdmin) {
                if (typeFilter !== "all") params.type = typeFilter;
                if (branchFilter !== "all") params.branch_id = branchFilter;
                if (fromDate) params.from = fromDate;
                if (toDate) params.to = toDate;
            }

            if (isProduction) {
                // Ishlab chiqarish xodimlari faqat production tarixini ko'radi
                params.type = "production";
            }

            if (isSales) {
                params.type = "sale";
                params.branch_id = user.branch_id;
            }

            const res = await api.get("/history/activities", { params });
            setItems(res.data || []);
        } catch (err) {
            console.error("History load error:", err);
            setError("Tarixni yuklashda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typeFilter, branchFilter, fromDate, toDate, isProduction, isSales]);

    // --- Amal tugmalari handlerlari ---

    const handleEdit = (row) => {
        // Hozircha faqat vazvrat tahriri ReturnsPage ga olib boradi
        if (row.type === "return") {
            navigate(`/returns?edit=${row.id}`);
            return;
        }

        // Keyinchalik transfer / sale / production uchun ham shu yerda yo'naltiramiz
        setSuccess("");
        setError("Bu tur uchun tahrirlash hali yoqilgan emas.");
    };

    const handleDelete = async (row) => {
        // Hozircha faqat vazvratni o'chirish backendiga ulangan
        if (row.type !== "return") {
            setError("Bu turdagi tarixni o‘chirish hali yoqilmagan.");
            return;
        }

        if (
            !window.confirm(
                "Rostdan ham bu vazvratni o‘chirishni xohlaysizmi? (faqat PENDING bo‘lsa o‘chadi)"
            )
        ) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await api.delete(`/returns/${row.id}`);
            setSuccess("Vazvrat muvaffaqiyatli o‘chirildi.");

            await loadHistory();
        } catch (err) {
            console.error("History delete error:", err);
            const msg =
                err?.response?.data?.message ||
                "Tarixdagi vazvratni o‘chirishda xatolik.";
            setError(msg);
        }
    };

    return (
        <div className="page">
            <h1 className="page-title">Umumiy tarix</h1>

            <HistoryFilters
                isAdmin={isAdmin}
                typeFilter={typeFilter}
                branchFilter={branchFilter}
                fromDate={fromDate}
                toDate={toDate}
                onTypeChange={setTypeFilter}
                onBranchChange={setBranchFilter}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onRefresh={loadHistory}
            />

            {isProduction && (
                <p className="info">
                    Siz ishlab chiqarish bo‘limi xodimisiz. Faqat ishlab chiqarish tarixi
                    ko‘rinadi.
                </p>
            )}

            {isSales && (
                <p className="info">
                    Siz <b>{user.branch_name}</b> filialining sotuvlarini ko‘ryapsiz.
                </p>
            )}

            {error && (
                <div
                    className="info-box info-box--error"
                    style={{ marginBottom: 8, marginTop: 8 }}
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="info-box info-box--success"
                    style={{ marginBottom: 8, marginTop: 8 }}
                >
                    {success}
                </div>
            )}

            <HistoryTable
                items={items}
                loading={loading}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}

export default HistoryPage;
