// client/src/pages/BranchesPage.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";

import BranchForm from "../components/branches/BranchForm";
import BranchesTable from "../components/branches/BranchesTable";

function BranchesPage() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
    const [editingBranch, setEditingBranch] = useState(null); // null => yangi
    const [name, setName] = useState("");
    const [branchType, setBranchType] = useState("BRANCH"); // BRANCH | OUTLET
    const [useCentralStock, setUseCentralStock] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const resetForm = () => {
        setEditingBranch(null);
        setName("");
        setBranchType("BRANCH");
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
            setError("Filial va do‘konlar ro‘yxatini yuklashda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setName(branch.name || "");
        setBranchType(branch.branch_type || "BRANCH");
        setUseCentralStock(!!branch.use_central_stock);
        setIsActive(branch.is_active !== 0);
        setSuccess("");
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (branch) => {
        if (
            !window.confirm(
                `“${branch.name}” joyini o‘chirishni istaysizmi? (faol emas holatiga o‘tadi)`
            )
        ) {
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await api.delete(`/branches/${branch.id}`);
            setSuccess(
                "Joy (filial/do‘kon) o‘chirildi (faol emas holatiga o‘tkazildi)."
            );
            await loadBranches();
            if (editingBranch && editingBranch.id === branch.id) {
                resetForm();
            }
        } catch (err) {
            console.error(err);
            setError("Joyni o‘chirishda xatolik.");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Nomi majburiy.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                name: name.trim(),
                branch_type: branchType,
                is_active: isActive ? 1 : 0,
                use_central_stock:
                    branchType === "BRANCH" ? (useCentralStock ? 1 : 0) : 0,
            };

            if (editingBranch) {
                await api.put(`/branches/${editingBranch.id}`, payload);
                setSuccess("Joy ma’lumotlari yangilandi.");
            } else {
                await api.post("/branches", payload);
                setSuccess("Yangi joy qo‘shildi.");
            }

            resetForm();
            await loadBranches();
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.message || "Joyni saqlashda xatolik.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const title = "Filiallar va do‘konlar";

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{title}</h1>
                    <p className="page-subtitle">
                        Filiallar va ulgurji do‘konlar ro‘yxati. Filiallarda ombor turi
                        alohida, do‘konlar esa faqat savdo nuqtasi sifatida yuritiladi.
                    </p>
                </div>
            </div>

            {error && (
                <div
                    className="info-box info-box--error"
                    style={{ marginBottom: 8 }}
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="info-box info-box--success"
                    style={{ marginBottom: 8 }}
                >
                    {success}
                </div>
            )}

            {/* Form */}
            <BranchForm
                editingBranch={editingBranch}
                name={name}
                branchType={branchType}
                useCentralStock={useCentralStock}
                isActive={isActive}
                saving={saving}
                onNameChange={setName}
                onBranchTypeChange={setBranchType}
                onUseCentralStockChange={setUseCentralStock}
                onIsActiveChange={setIsActive}
                onSubmit={handleSubmit}
                onReset={resetForm}
            />
            {/* Table */}
            <BranchesTable
                branches={branches}
                loading={loading}
                saving={saving}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}

export default BranchesPage;
