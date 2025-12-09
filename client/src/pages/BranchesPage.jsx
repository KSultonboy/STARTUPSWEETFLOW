import React, { useEffect, useState } from "react";
import api from "../services/api";

function BranchesPage() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // BRANCH / OUTLET tab
    const [activeTab, setActiveTab] = useState("BRANCH"); // 'BRANCH' | 'OUTLET'

    // Form state
    const [editingBranch, setEditingBranch] = useState(null); // null => yangi, object => edit
    const [name, setName] = useState("");
    const [useCentralStock, setUseCentralStock] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const resetForm = () => {
        setEditingBranch(null);
        setName("");
        setUseCentralStock(false);
        setIsActive(true);
        setError("");
        setSuccess("");
    };

    const loadBranches = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/branches");
            setBranches(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Filiallar va do‘konlar ro‘yxatini yuklashda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const handleEdit = (branch) => {
        const type = (branch.type || "BRANCH").toUpperCase();

        setActiveTab(type); // Filialni bossam – Filial tabiga, Do'konni bossam – Do'kon tabiga o'tadi
        setEditingBranch(branch);
        setName(branch.name || "");
        setUseCentralStock(!!branch.use_central_stock);
        setIsActive(branch.is_active !== 0);
        setSuccess("");
        setError("");
    };

    const handleDelete = async (branch) => {
        const label =
            (branch.type || "BRANCH").toUpperCase() === "OUTLET"
                ? "do‘konni"
                : "filialni";

        if (
            !window.confirm(
                `“${branch.name}” ${label} o‘chirishni istaysizmi? (nofaol holatga o‘tadi)`
            )
        ) {
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await api.delete(`/branches/${branch.id}`);
            setSuccess("Yozuv nofaol holatiga o‘tkazildi.");
            await loadBranches();
            if (editingBranch && editingBranch.id === branch.id) {
                resetForm();
            }
        } catch (err) {
            console.error(err);
            setError("O‘chirishda xatolik.");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError(
                activeTab === "OUTLET"
                    ? "Do‘kon / supermarket nomini kiriting."
                    : "Filial nomini kiriting."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                name: name.trim(),
                is_active: isActive ? 1 : 0,
                // 🟣 faqat FILIAL uchun ombor turi ishlaydi
                use_central_stock:
                    activeTab === "BRANCH" && !editingBranch?.type
                        ? useCentralStock
                            ? 1
                            : 0
                        : activeTab === "BRANCH"
                            ? useCentralStock
                                ? 1
                                : 0
                            : 0,
                type: activeTab, // 'BRANCH' | 'OUTLET'
            };

            if (editingBranch) {
                await api.put(`/branches/${editingBranch.id}`, payload);
                setSuccess(
                    activeTab === "OUTLET"
                        ? "Do‘kon ma’lumotlari yangilandi."
                        : "Filial ma’lumotlari yangilandi."
                );
            } else {
                await api.post("/branches", payload);
                setSuccess(
                    activeTab === "OUTLET"
                        ? "Yangi do‘kon qo‘shildi."
                        : "Yangi filial qo‘shildi."
                );
            }

            resetForm();
            await loadBranches();
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message || "Saqlashda xatolik yuz berdi.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const filteredBranches = branches.filter((b) =>
        activeTab === "BRANCH"
            ? (b.type || "BRANCH").toUpperCase() === "BRANCH"
            : (b.type || "BRANCH").toUpperCase() === "OUTLET"
    );

    const title = "Filiallar va do‘konlar";

    const isOutletTab = activeTab === "OUTLET";

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{title}</h1>
                    <p className="page-subtitle">
                        Filiallar (o‘z ombori bilan) va ulgurji/supermarket{" "}
                        do‘konlar ro‘yxati.
                    </p>
                </div>
            </div>

            {error && (
                <div className="info-box info-box--error" style={{ marginBottom: 8 }}>
                    {error}
                </div>
            )}

            {success && (
                <div className="info-box info-box--success" style={{ marginBottom: 8 }}>
                    {success}
                </div>
            )}

            {/* Form card */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div
                    className="card-header"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <h2 className="card-title" style={{ marginBottom: 0 }}>
                        {editingBranch
                            ? isOutletTab
                                ? "Do‘konni tahrirlash"
                                : "Filialni tahrirlash"
                            : isOutletTab
                                ? "Yangi do‘kon qo‘shish"
                                : "Yangi filial qo‘shish"}
                    </h2>

                    {/* Tab switch: Filiallar / Do‘konlar */}
                    <div
                        style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: 2,
                            background: "rgba(15,23,42,0.8)",
                            border: "1px solid rgba(148,163,184,0.6)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("BRANCH");
                                resetForm();
                            }}
                            style={{
                                border: "none",
                                padding: "4px 12px",
                                fontSize: 12,
                                borderRadius: 999,
                                cursor: "pointer",
                                backgroundColor:
                                    activeTab === "BRANCH" ? "#e5e7eb" : "transparent",
                                color:
                                    activeTab === "BRANCH" ? "#0b1120" : "#e5e7eb",
                            }}
                        >
                            Filiallar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("OUTLET");
                                resetForm();
                            }}
                            style={{
                                border: "none",
                                padding: "4px 12px",
                                fontSize: 12,
                                borderRadius: 999,
                                cursor: "pointer",
                                backgroundColor:
                                    activeTab === "OUTLET" ? "#e5e7eb" : "transparent",
                                color:
                                    activeTab === "OUTLET" ? "#0b1120" : "#e5e7eb",
                            }}
                        >
                            Do‘konlar
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">
                                {isOutletTab ? "Do‘kon / supermarket nomi" : "Filial nomi"}
                            </label>
                            <input
                                className="input"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={
                                    isOutletTab
                                        ? "Masalan: Korzinka Chilonzor, Makro Sergeli..."
                                        : "Masalan: Chilonzor, Sergeli..."
                                }
                            />
                        </div>

                        {/* Ombor turi – faqat FILIALlar uchun ko‘rinadi */}
                        {!isOutletTab && (
                            <div className="form-group">
                                <label className="form-label">Ombor turi</label>
                                <select
                                    className="input"
                                    value={useCentralStock ? "central" : "separate"}
                                    onChange={(e) =>
                                        setUseCentralStock(e.target.value === "central")
                                    }
                                >
                                    <option value="separate">Alohida ombor</option>
                                    <option value="central">
                                        Markaziy ombor bilan birga
                                    </option>
                                </select>
                                <small className="form-hint">
                                    Agar filial markaziy ishlab chiqarish yonida bo‘lsa va
                                    alohida ombor yuritilmasa, &quot;Markaziy ombor bilan
                                    birga&quot; ni tanlang.
                                </small>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Holati</label>
                            <select
                                className="input"
                                value={isActive ? "1" : "0"}
                                onChange={(e) => setIsActive(e.target.value === "1")}
                            >
                                <option value="1">Faol</option>
                                <option value="0">Nofaol</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: 12 }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving
                                ? "Saqlanmoqda..."
                                : editingBranch
                                    ? "O‘zgartirish"
                                    : "Qo‘shish"}
                        </button>

                        {editingBranch && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ marginLeft: 8 }}
                                onClick={resetForm}
                                disabled={saving}
                            >
                                Bekor qilish
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Table card */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        {isOutletTab ? "Do‘konlar ro‘yxati" : "Filiallar ro‘yxati"}
                    </h2>
                </div>

                {loading ? (
                    <p>Yuklanmoqda...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nomi</th>
                                    {!isOutletTab && <th>Ombor turi</th>}
                                    <th>Holati</th>
                                    <th style={{ width: 160 }}>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBranches.length === 0 ? (
                                    <tr>
                                        <td colSpan={isOutletTab ? 4 : 5} style={{ textAlign: "center" }}>
                                            {isOutletTab
                                                ? "Birorta do‘kon topilmadi."
                                                : "Birorta filial topilmadi."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBranches.map((branch, index) => (
                                        <tr key={branch.id}>
                                            <td>{index + 1}</td>
                                            <td>{branch.name}</td>
                                            {!isOutletTab && (
                                                <td>
                                                    {branch.use_central_stock ? (
                                                        <span className="badge badge-info">
                                                            Markaziy bilan birga
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-secondary">
                                                            Alohida ombor
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            <td>
                                                {branch.is_active ? (
                                                    <span className="badge badge-success">
                                                        Faol
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-danger">
                                                        Nofaol
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-small"
                                                    onClick={() => handleEdit(branch)}
                                                    style={{ marginRight: 8 }}
                                                >
                                                    Tahrirlash
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-small btn-danger"
                                                    onClick={() => handleDelete(branch)}
                                                    disabled={saving}
                                                >
                                                    O‘chirish
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BranchesPage;
