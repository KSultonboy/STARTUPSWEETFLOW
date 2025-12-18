import { useEffect, useState } from "react";
import api from "../../services/api";

export default function PlansPage() {
    const [plans, setPlans] = useState([]);

    // Form State
    const [form, setForm] = useState({
        name: '',
        price: '',
        features: {
            sales: true,
            warehouse: true,
            production: false,
            accounting: false
        }
    });

    // Edit State
    const [formMode, setFormMode] = useState('CREATE'); // CREATE | EDIT
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const res = await api.get('/platform/plans');
            const rows = res.data || [];
            setPlans(rows);

            // Agar allaqachon plan bo'lsa, uni default tahrirlash rejimiga o'tkazamiz (faqat bitta plan ishlatiladi)
            if (rows.length > 0) {
                const primary = rows[0];
                const feats = {
                    sales: false,
                    warehouse: false,
                    production: false,
                    accounting: false
                };
                if (primary.features) {
                    primary.features.forEach(f => {
                        if (feats.hasOwnProperty(f)) feats[f] = true;
                    });
                }

                setForm({
                    name: primary.name,
                    price: primary.price,
                    features: feats
                });
                setFormMode('EDIT');
                setEditingId(primary.id);
            } else {
                // Hech qanday plan bo'lmasa, default tavsiya etilgan plan yaratish imkoniyati
                setFormMode('CREATE');
                setEditingId(null);
                setForm({
                    name: 'Standart plan',
                    price: 300000,
                    features: {
                        sales: true,
                        warehouse: true,
                        production: true,
                        accounting: true
                    }
                });
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const featureList = Object.keys(form.features).filter(k => form.features[k]);

        const payload = {
            name: form.name,
            price: Number(form.price),
            features: featureList
        };

        try {
            if (formMode === 'CREATE') {
                // Faqat birinchi marta plan yo'q bo'lganda CREATE qilamiz
                await api.post('/platform/plans', payload);
                alert("Tarif yaratildi!");
            } else if (editingId) {
                await api.put(`/platform/plans/${editingId}`, payload);
                alert("Tarif yangilandi!");
            }

            resetForm();
            loadPlans();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.message || err.message));
        }
    };

    const resetForm = () => {
        if (plans.length > 0) {
            // Mavjud plan bo'lsa, uni qayta yuklab formani to'ldiramiz
            loadPlans();
        } else {
            setForm({
                name: '',
                price: '',
                features: {
                    sales: true,
                    warehouse: true,
                    production: false,
                    accounting: false
                }
            });
            setFormMode('CREATE');
            setEditingId(null);
        }
    };

    const handleEdit = () => {
        // Hozircha bitta plan bo'lgani uchun alohida edit tugmasiga ehtiyoj yo'q,
        // card tepadagi form to'g'ridan-to'g'ri tahrirlash rejimida ishlaydi.
        return;
    };

    const handleDelete = () => {
        // Birinchi bosqichda tarifni o'chirishni cheklab qo'yamiz
        alert("Tarifni o'chirishga hozircha ruxsat berilmagan. Bitta asosiy plan bilan ishlaymiz.");
    };

    const toggleFeature = (key) => {
        setForm(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [key]: !prev.features[key]
            }
        }));
    };

    return (
        <div style={{ padding: '0 20px 40px' }}>
            <h1 className="page-title" style={{ marginBottom: 24 }}>Tariflar (Plans)</h1>

            {/* Layout switched to Column: Form Top, Table Bottom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* FORM CARD (Top) */}
                <div className="card" style={{ width: '100%' }}>
                    <h3 style={{ marginBottom: 20, fontSize: '1.25rem' }}>{formMode === 'CREATE' ? "Yangi Tarif" : "Tarifni Tahrirlash"}</h3>
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 20,
                            alignItems: 'end'
                        }}
                    >
                        <div className="form-group">
                            <label>Nom</label>
                            <input
                                className="input"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder="Masalan: Premium Plan"
                            />
                        </div>
                        <div className="form-group">
                            <label>Narx (oyiga)</label>
                            <input
                                className="input"
                                type="number"
                                value={form.price}
                                onChange={e => setForm({ ...form, price: e.target.value })}
                                placeholder="500000"
                            />
                        </div>

                        <div className="form-group" style={{ gridRow: '1 / 3', gridColumn: 3 }}>
                            <label style={{ marginBottom: 8, display: 'block' }}>Modullar (Features)</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label className="feature-toggle">
                                    <input
                                        type="checkbox"
                                        checked={form.features.sales}
                                        onChange={() => toggleFeature('sales')}
                                    />
                                    <span>Sotuv (Sales)</span>
                                </label>
                                <label className="feature-toggle">
                                    <input
                                        type="checkbox"
                                        checked={form.features.warehouse}
                                        onChange={() => toggleFeature('warehouse')}
                                    />
                                    <span>Ombor (Warehouse)</span>
                                </label>
                                <label className="feature-toggle">
                                    <input
                                        type="checkbox"
                                        checked={form.features.production}
                                        onChange={() => toggleFeature('production')}
                                    />
                                    <span>Ishlab chiqarish (Production)</span>
                                </label>
                                <label className="feature-toggle">
                                    <input
                                        type="checkbox"
                                        checked={form.features.accounting}
                                        onChange={() => toggleFeature('accounting')}
                                    />
                                    <span>Buxgalteriya (Accounting)</span>
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, gridColumn: '1 / 3' }}>
                            <button className="button-primary button--input-size" type="submit" style={{ flex: 1 }}>
                                {formMode === 'CREATE' ? "Saqlash" : "Yangilash"}
                            </button>
                            {formMode === 'EDIT' && (
                                <button type="button" className="button-secondary button--input-size" onClick={resetForm}>
                                    Bekor qilish
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* LIST CARD (Bottom) */}
                <div className="card" style={{ width: '100%' }}>
                    <h3 style={{ marginBottom: 20 }}>Mavjud Tariflar</h3>
                    <div className="table-wrapper">
                        <table className="app-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nom</th>
                                    <th>Narx</th>
                                    <th>Modullar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map(p => (
                                    <tr key={p.id}>
                                        <td>#{p.id}</td>
                                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                                        <td>
                                            <span className="badge badge--success">
                                                {p.price ? p.price.toLocaleString() : '0'} so'm
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {p.features && p.features.map(f => (
                                                    <span key={f} className="badge badge--indigo">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    className="btn-icon"
                                                    title="Tahrirlash"
                                                    onClick={() => handleEdit(p)}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-icon btn-icon--delete"
                                                    title="O'chirish"
                                                    onClick={() => handleDelete(p.id)}
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
        </div>
    );
}
