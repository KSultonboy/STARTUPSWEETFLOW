// client/src/components/users/UsersTable.jsx
import React from "react";

function getBranchLabel(user, branches) {
    if (user.branch_name) {
        if (user.branch_code) {
            return `${user.branch_name} (${user.branch_code})`;
        }
        return user.branch_name;
    }
    if (!user.branch_id) return "-";
    const b = branches.find((br) => br.id === user.branch_id);
    if (!b) return user.branch_id;
    return b.code ? `${b.name} (${b.code})` : b.name;
}

function UsersTable({ users, branches, loading, onEdit, onDelete }) {
    if (loading) {
        return <p>Yuklanmoqda...</p>;
    }

    if (!users.length) {
        return <p>Hali userlar yo‘q.</p>;
    }

    return (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ism</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Branch</th>
                        <th style={{ width: 140 }}>Amallar</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.full_name}</td>
                            <td>{u.username}</td>
                            <td>
                                <span className={`badge ${u.role === "admin" ? "badge-primary" : "badge-secondary"}`}>
                                    {u.role}
                                </span>
                            </td>
                            <td>{getBranchLabel(u, branches)}</td>
                            <td>
                                <div className="history-actions">
                                    <button
                                        type="button"
                                        className="btn-icon btn-icon--edit"
                                        title="Edit"
                                        onClick={() => onEdit(u)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-icon btn-icon--delete"
                                        title="Delete"
                                        onClick={() => onDelete(u)}
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

export default UsersTable;
