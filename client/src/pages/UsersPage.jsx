// client/src/pages/UsersPage.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

import UsersForm from "../components/users/UsersForm";
import UsersTable from "../components/users/UsersTable";

function UsersPage() {
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [form, setForm] = useState({
        full_name: "",
        username: "",
        password: "",
        role: "admin",
        branch_id: "",
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/users");
            setUsers(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Userlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await api.get("/branches");
            setBranches(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setForm({
            full_name: "",
            username: "",
            password: "",
            role: "admin",
            branch_id: "",
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const payload = {
            full_name: form.full_name.trim(),
            username: form.username.trim(),
            role: form.role,
            branch_id:
                form.role === "branch" && form.branch_id
                    ? Number(form.branch_id)
                    : null,
        };

        if (!payload.full_name || !payload.username) {
            setError("Ism va username majburiy");
            return;
        }

        if (!editingId) {
            if (!form.password) {
                setError("Parol majburiy");
                return;
            }
            payload.password = form.password;
        } else if (form.password) {
            payload.password = form.password;
        }

        try {
            setSaving(true);

            if (editingId) {
                const res = await api.put(`/users/${editingId}`, payload);
                const updated = res.data;
                setUsers((prev) =>
                    prev.map((u) => (u.id === editingId ? updated : u))
                );
            } else {
                const res = await api.post("/users", payload);
                setUsers((prev) => [res.data, ...prev]);
            }

            resetForm();
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Userni saqlashda xatolik";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setForm({
            full_name: user.full_name || "",
            username: user.username || "",
            password: "",
            role: user.role || "admin",
            branch_id: user.branch_id ? String(user.branch_id) : "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleDelete = async (user) => {
        const confirmed = window.confirm(
            `"${user.full_name}" foydalanuvchini haqiqatan ham o'chirmoqchimisiz?`
        );
        if (!confirmed) return;

        try {
            await api.delete(`/users/${user.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Userni o'chirishda xatolik";
            setError(msg);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Foydalanuvchilar</h1>
                    <p className="page-subtitle">
                        Tizimdagi foydalanuvchilar va ularning rollari.
                    </p>
                </div>
            </div>

            <div className="card">
                <div className="card-title">Foydalanuvchilar (Users)</div>

                {error && (
                    <div className="info-box info-box--error" style={{ marginBottom: 12 }}>
                        {error}
                    </div>
                )}

                <UsersForm
                    form={form}
                    branches={branches}
                    editingId={editingId}
                    saving={saving}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancelEdit={handleCancelEdit}
                />

                <hr style={{ margin: "20px 0" }} />

                <UsersTable
                    users={users}
                    branches={branches}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}

export default UsersPage;
