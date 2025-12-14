// client/src/components/reports/ReportsEntityModal.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";

function ModalWrapper({ title, onClose, children }) {
    if (!title) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 50,
            }}
        >
            <div
                className="card"
                style={{
                    maxWidth: 900,
                    width: "90%",
                    maxHeight: "80vh",
                    overflow: "auto",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <h2 className="card-title" style={{ marginBottom: 0 }}>
                        {title}
                    </h2>
                    <button
                        type="button"
                        className="button-primary"
                        style={{
                            background: "transparent",
                            border: "1px solid rgba(148,163,184,0.7)",
                            boxShadow: "none",
                            color: "#e5e7eb",
                            padding: "4px 10px",
                            fontSize: 12,
                        }}
                        onClick={onClose}
                    >
                        Yopish
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function ReportsEntityModal({ type, onClose }) {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!type) return;

        const load = async () => {
            try {
                setLoading(true);
                setError("");
                setRows([]);

                if (type === "branches" || type === "outlets") {
                    const res = await api.get("/branches");
                    const all = res.data || [];
                    const filtered =
                        type === "branches"
                            ? all.filter(
                                (b) =>
                                    (b.branch_type || "BRANCH").toUpperCase() ===
                                    "BRANCH"
                            )
                            : all.filter(
                                (b) =>
                                    (b.branch_type || "").toUpperCase() ===
                                    "OUTLET"
                            );
                    setRows(filtered);
                } else if (type === "users") {
                    const res = await api.get("/users");
                    setRows(res.data || []);
                } else if (type === "products") {
                    const res = await api.get("/products");
                    setRows(res.data || []);
                }
            } catch (err) {
                console.error(err);
                setError("Ma’lumotlarni yuklashda xatolik.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [type]);

    if (!type) return null;

    if (type === "branches" || type === "outlets") {
        const title =
            type === "branches"
                ? "Filiallar ro‘yxati"
                : "Ulgurji do‘konlar ro‘yxati";

        return (
            <ModalWrapper title={title} onClose={onClose}>
                {error && (
                    <div
                        className="info-box info-box--error"
                        style={{ marginBottom: 8 }}
                    >
                        {error}
                    </div>
                )}
                {loading ? (
                    <p>Yuklanmoqda...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nomi</th>
                                    <th>Holati</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            style={{ textAlign: "center" }}
                                        >
                                            Ma’lumot topilmadi.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((b, i) => (
                                        <tr key={b.id}>
                                            <td>{i + 1}</td>
                                            <td>{b.name}</td>
                                            <td>
                                                {b.is_active ? "Faol" : "Nofaol"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </ModalWrapper>
        );
    }

    if (type === "users") {
        return (
            <ModalWrapper title="Foydalanuvchilar ro‘yxati" onClose={onClose}>
                {error && (
                    <div
                        className="info-box info-box--error"
                        style={{ marginBottom: 8 }}
                    >
                        {error}
                    </div>
                )}
                {loading ? (
                    <p>Yuklanmoqda...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Ism</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            style={{ textAlign: "center" }}
                                        >
                                            Ma’lumot topilmadi.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((u, i) => (
                                        <tr key={u.id}>
                                            <td>{i + 1}</td>
                                            <td>{u.full_name}</td>
                                            <td>{u.username}</td>
                                            <td>{u.role}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </ModalWrapper>
        );
    }

    if (type === "products") {
        return (
            <ModalWrapper title="Mahsulotlar ro‘yxati" onClose={onClose}>
                {error && (
                    <div
                        className="info-box info-box--error"
                        style={{ marginBottom: 8 }}
                    >
                        {error}
                    </div>
                )}
                {loading ? (
                    <p>Yuklanmoqda...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nomi</th>
                                    <th>Birlik</th>
                                    <th>Kategoriya</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            style={{ textAlign: "center" }}
                                        >
                                            Ma’lumot topilmadi.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((p, i) => (
                                        <tr key={p.id}>
                                            <td>{i + 1}</td>
                                            <td>{p.name}</td>
                                            <td>{p.unit}</td>
                                            <td>{p.category}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </ModalWrapper>
        );
    }

    return null;
}

export default ReportsEntityModal;
