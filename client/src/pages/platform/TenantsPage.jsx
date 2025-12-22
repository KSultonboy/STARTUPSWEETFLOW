import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

export default function TenantsPage() {
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);

    // Consolidated Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        planId: '',
        adminFullName: '',
        username: '',
        password: '',
        contractEndDate: '', // DATE (backendda avtomatik to'ldiriladi)
        status: 'ACTIVE'
    });

    const [formMode, setFormMode] = useState('CREATE'); // CREATE | EDIT
    const [editingId, setEditingId] = useState(null);

    // Local UI state for delete modal and password reveal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletePin, setDeletePin] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const [lastCreatedPasswords, setLastCreatedPasswords] = useState({});

    const [showRevealModal, setShowRevealModal] = useState(false);
    const [revealTarget, setRevealTarget] = useState(null);
    const [revealPin, setRevealPin] = useState('');
    const [revealError, setRevealError] = useState('');
    const [revealedPassword, setRevealedPassword] = useState('');

    const loadTenants = useCallback(async () => {
        try {
            const res = await api.get('/platform/tenants');
            setTenants(res.data);
        } catch (err) {
            console.error("Xatolik:", err);
        }
    }, []);

    const handleDeleteRequest = (tenant) => {
        setDeleteTarget(tenant);
        setDeletePin('');
        setDeleteError('');
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (deletePin !== '1960') {
            setDeleteError('Kod noto‘g‘ri');
            return;
        }

        try {
            await api.delete(`/platform/tenants/${deleteTarget.id}`);
            setShowDeleteModal(false);
            loadTenants();
        } catch (err) {
            setDeleteError(err.response?.data?.message || err.message || 'Xatolik');
        }
    };

    const handleRevealRequest = (tenant) => {
        setRevealTarget(tenant);
        setRevealPin('');
        setRevealError('');
        setRevealedPassword('');
        setShowRevealModal(true);
    };

    const confirmReveal = async () => {
        if (revealPin !== '1960') {
            setRevealError('Kod noto‘g‘ri');
            return;
        }

        setRevealError('');
        // reset visible password while we fetch
        setRevealedPassword('');

        // If we have the password locally (recently created), show it
        const pwd = lastCreatedPasswords[revealTarget?.id];
        if (pwd) {
            setRevealedPassword(pwd);
            return;
        }

        // Otherwise call server to generate a temporary password and return it
        try {
            const res = await api.post(`/platform/tenants/${revealTarget.id}/reset-admin-password`);
            const pwdFromServer = res.data?.password;
            if (pwdFromServer) {
                // Cache it locally so it can be revealed again during this session
                setLastCreatedPasswords(prev => ({ ...prev, [revealTarget.id]: pwdFromServer }));
                setRevealedPassword(pwdFromServer);
            } else {
                // explicit null -> show the 'not saved on server' message
                setRevealedPassword(null);
                setRevealError('Parol serverda saqlanmaganligi sababli ko\'rsatilmaydi.');
            }
        } catch (err) {
            setRevealError(err.response?.data?.message || err.message || 'Xatolik');
        }
    };

    const loadPlans = useCallback(async () => {
        try {
            const res = await api.get('/platform/plans');
            setPlans(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadTenants();
            loadPlans();
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [loadTenants, loadPlans]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formMode === 'CREATE') {
                const res = await api.post('/platform/tenants', formData);
                const created = res.data;
                // keep the admin password locally for immediate reveal (not persisted)
                if (created?.id && formData.password) {
                    setLastCreatedPasswords(prev => ({ ...prev, [created.id]: formData.password }));
                }
                alert("Do'kon va Admin muvaffaqiyatli yaratildi!");
            } else {
                // Edit Logic (Maybe separate endpoint)
                await api.put(`/platform/tenants/${editingId}`, formData);
                alert("O'zgarishlar saqlandi");
            }

            // Reset
            setFormData({
                name: '',
                slug: '',
                planId: '',
                adminFullName: '',
                username: '',
                password: '',
                contractEndDate: '',
                status: 'ACTIVE'
            });
            setFormMode('CREATE');
            setEditingId(null);
            loadTenants();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEdit = (tenant) => {
        setFormMode('EDIT');
        setEditingId(tenant.id);
        setFormData({
            name: tenant.name,
            slug: tenant.slug,
            planId: tenant.plan_id || '',
            adminFullName: tenant.admin_full_name || '',
            username: tenant.admin_username || '',
            password: '',
            contractEndDate: tenant.contract_end_date || '',
            status: tenant.status || 'ACTIVE'
        });
    };

    const handleToggleStatus = async (tenant) => {
        const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        if (!window.confirm(`Ushbu do'konni ${nextStatus} holatiga o'tkazishni xohlaysizmi?`)) return;
        try {
            await api.put(`/platform/tenants/${tenant.id}`, { status: nextStatus });
            await loadTenants();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{ padding: '0 20px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 className="page-title">Tizim Foydalanuvchilari</h1>
            </div>

            {/* Layout switched to Column: Form Top, Table Bottom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* FORM CARD (TOP) */}
                <div className="card" style={{ width: '100%' }}>
                    <h3 style={{ marginBottom: 20, fontSize: '1.25rem' }}>
                        {formMode === 'CREATE' ? "Yangi Do'kon Qo'shish" : "Do'konni Tahrirlash"}
                    </h3>
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 20,
                            alignItems: 'end'
                        }}
                    >
                        {/* Row 1: Tenant Info */}
                        <div className="form-group">
                            <label>Do'kon Nomi</label>
                            <input
                                className="input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Masalan: Alpha Cakes"
                            />
                        </div>
                        <div className="form-group">
                            <label>Slug (URL)</label>
                            <input
                                className="input"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                required
                                placeholder="alpha-cakes"
                            />
                        </div>
                        <div className="form-group">
                            <label>Tarif (Plan)</label>
                            <select
                                className="input"
                                value={formData.planId}
                                onChange={e => setFormData({ ...formData, planId: e.target.value })}
                            >
                                <option value="">Tanlang...</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Row 2: Contract, Status & Admin */}
                        <div className="form-group">
                            <label>Shartnoma muddati (Expiry)</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.contractEndDate}
                                onChange={e => setFormData({ ...formData, contractEndDate: e.target.value })}
                                placeholder="Avtomatik hisoblanadi"
                            />
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="input"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="SUSPENDED">SUSPENDED</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Admin Username</label>
                            <input
                                className="input"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required={formMode === 'CREATE'}
                                placeholder="admin_login"
                            />
                        </div>
                        <div className="form-group">
                            <label>{formMode === 'CREATE' ? "Admin Parol" : "Admin Parol (ixtiyoriy)"}</label>
                            <input
                                className="input"
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required={formMode === 'CREATE'}
                                placeholder={formMode === 'CREATE' ? "******" : "Yangi parol yoki bo'sh qoldiring"}
                            />
                        </div>

                        <div className="form-group">
                            <label>Admin Ism</label>
                            <input
                                className="input"
                                value={formData.adminFullName}
                                onChange={e => setFormData({ ...formData, adminFullName: e.target.value })}
                                required={formMode === 'CREATE'}
                                placeholder="Ism Familiya"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="submit" className="button-primary button--input-size">
                                {formMode === 'CREATE' ? "Yaratish" : "Saqlash"}
                            </button>
                            {formMode === 'EDIT' && (
                                <button
                                    type="button"
                                    className="button-secondary"
                                    onClick={() => {
                                        setFormMode('CREATE');
                                        setFormData({
                                            name: '',
                                            slug: '',
                                            planId: '',
                                            adminFullName: '',
                                            username: '',
                                            password: '',
                                            contractEndDate: '',
                                            status: 'ACTIVE'
                                        });
                                    }}
                                >
                                    Bekor qilish
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* TABLE CARD (BOTTOM) */}
                <div className="card" style={{ width: '100%' }}>
                    <h3 style={{ marginBottom: 20 }}>Mavjud Do'konlar ro'yxati</h3>
                    <div className="table-wrapper">
                        <table className="app-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nom</th>
                                    <th>Slug</th>
                                    <th>Tarif</th>
                                    <th>Admin Login</th>
                                    <th>Status</th>
                                    <th>Holat</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Ma'lumot yo'q</td></tr>
                                ) : tenants.map(t => (
                                    <tr key={t.id}>
                                        <td>#{t.id}</td>
                                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                                        <td>
                                            <span className="badge badge--indigo">{t.slug}</span>
                                        </td>
                                        <td>
                                            {t.plan_id ? (plans.find(p => p.id == t.plan_id)?.name || `Plan ${t.plan_id}`) : '-'}
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                {t.admin_username || '---'}
                                            </span>
                                        </td>
                                        <td>
                                            {/* Password column: show masked by default, allow reveal via modal (PIN-protected) */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontWeight: 600, letterSpacing: 2 }}>
                                                    {'******'}
                                                </span>
                                                <button className="btn-icon" title="Ko'rish" onClick={() => handleRevealRequest(t)}>
                                                    👁️
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(t)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                    color: 'var(--color-primary)',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {t.status || 'ACTIVE'}
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    className="btn-icon"
                                                    title="Tahrirlash"
                                                    onClick={() => handleEdit(t)}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-icon btn-icon--delete"
                                                    title="O'chirish"
                                                    onClick={() => handleDeleteRequest(t)}
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
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Do'konni o‘chirishni tasdiqlash</h3>
                        <p>To‘liq o‘chirish uchun quyidagi maxsus PIN kodni kiriting:</p>
                        <input className="input" value={deletePin} onChange={e => setDeletePin(e.target.value)} placeholder="PIN" />
                        {deleteError && <div style={{ color: 'var(--color-danger)', marginTop: 8 }}>{deleteError}</div>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                            <button className="button-secondary" onClick={() => setShowDeleteModal(false)}>Bekor qilish</button>
                            <button className="button-danger" onClick={confirmDelete}>O‘chirish</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reveal Password Modal */}
            {showRevealModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Admin parolni ko'rish</h3>
                        <p>Parolni ko'rish uchun PIN kodni kiriting:</p>
                        <input className="input" value={revealPin} onChange={e => setRevealPin(e.target.value)} placeholder="PIN" />
                        {revealError && <div style={{ color: 'var(--color-danger)', marginTop: 8 }}>{revealError}</div>}
                        {revealedPassword !== '' && revealedPassword != null && (
                            <div style={{ marginTop: 10 }}>
                                <strong>Parol:</strong> {revealedPassword}
                            </div>
                        )}
                        {revealedPassword === null && (
                            <div style={{ marginTop: 10, color: 'var(--text-muted)' }}>
                                Parol serverda saqlanmaganligi sababli ko'rsatilmaydi.
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                            <button className="button-secondary" onClick={() => setShowRevealModal(false)}>Bekor qilish</button>
                            <button className="button-primary" onClick={confirmReveal}>Ko'rish</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
