// client/src/pages/CashPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/authContext";

const MODES = [
    { key: "day", label: "Kunlik" },
    { key: "week", label: "Haftalik" },
    { key: "month", label: "Oylik" },
    { key: "year", label: "Yillik" },
];

function money(n) {
    return Number(n || 0).toLocaleString("uz-UZ");
}

export default function CashPage() {
    const { user } = useAuth();

    const isAdmin = user?.role === "admin";
    const isBranch = user?.role === "branch";

    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [mode, setMode] = useState("day");

    // Admin uchun: BRANCH / OUTLET tab
    const [branchType, setBranchType] = useState("BRANCH");

    // Branchlar ro‘yxati (admin uchun select)
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState("");

    // Summary + entries
    const [summary, setSummary] = useState(null);
    const [entries, setEntries] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [outAmount, setOutAmount] = useState("");
    const [outNote, setOutNote] = useState("");
    const [saving, setSaving] = useState(false);

    // Branch user bo‘lsa o‘z branchId
    const effectiveBranchId = useMemo(() => {
        if (isBranch) return user?.branch_id ? String(user.branch_id) : "";
        return selectedBranchId;
    }, [isBranch, user, selectedBranchId]);

    // Admin branchType o‘zgarsa — branch selectni tozalaymiz
    useEffect(() => {
        setSelectedBranchId("");
    }, [branchType]);

    // Admin bo‘lsa branches olib kelamiz
    useEffect(() => {
        const loadBranches = async () => {
            if (!isAdmin) return;
            try {
                const res = await api.get("/branches");
                setBranches(res.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        loadBranches();
    }, [isAdmin]);

    const fetchAll = async () => {
        setError("");
        setLoading(true);
        try {
            const params = {
                date,
                mode,
                branchType,
            };
            if (effectiveBranchId) params.branchId = effectiveBranchId;

            const [sumRes, listRes] = await Promise.all([
                api.get("/cash/summary", { params }),
                api.get("/cash", { params }),
            ]);

            setSummary(sumRes.data || null);
            setEntries(listRes.data || []);
        } catch (e) {
            console.error(e);
            setError(e?.response?.data?.message || "Kassa ma'lumotlarini olishda xatolik");
            setSummary(null);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, mode, branchType, effectiveBranchId]);

    const currentTotals = summary?.totals || {
        sales_amount_period: 0,
        cash_in_period: 0,
        cash_out_period: 0,
        current_amount: 0,
    };

    const rows = summary?.byBranch || [];

    const openCashOut = () => {
        setOutAmount("");
        setOutNote("");
        setModalOpen(true);
        setError("");
    };

    const submitCashOut = async () => {
        setError("");

        const amt = Number(outAmount);
        if (!(amt > 0)) {
            setError("Summa 0 dan katta bo‘lishi kerak");
            return;
        }

        const branch_id = Number(effectiveBranchId);
        if (!branch_id) {
            setError("Branch tanlanmagan (yoki branch userda branch_id yo‘q)");
            return;
        }

        try {
            setSaving(true);
            await api.post("/cash/out", {
                branch_id,
                amount: amt,
                cash_date: date,
                note: outNote || "Admin pul oldi",
            });
            setModalOpen(false);
            fetchAll();
        } catch (e) {
            console.error(e);
            setError(e?.response?.data?.message || "Pul olishni saqlashda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const deleteEntry = async (id) => {
        if (!confirm("Ushbu kassa yozuvini o‘chirmoqchimisiz?")) return;
        try {
            await api.delete(`/cash/${id}`);
            fetchAll();
        } catch (e) {
            console.error(e);
            alert("O‘chirishda xatolik");
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Kassa</h1>
                    <p className="page-subtitle">
                        Sotuvdan tushgan pul avtomatik hisoblanadi. Admin “pul oldim” desa kassadan ayriladi.
                    </p>
                </div>

                <div className="page-header-actions" style={{ gap: 8, flexWrap: "wrap" }}>
                    <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
                        {MODES.map((m) => (
                            <option key={m.key} value={m.key}>
                                {m.label}
                            </option>
                        ))}
                    </select>

                    <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

                    {isAdmin && (
                        <select className="input" value={branchType} onChange={(e) => setBranchType(e.target.value)}>
                            <option value="BRANCH">Filial kassalari</option>
                            <option value="OUTLET">Do‘kon kassalari</option>
                        </select>
                    )}

                    {isAdmin && (
                        <select className="input" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
                            <option value="">Barchasi</option>
                            {branches
                                .filter((b) => {
                                    const t = String(b.branch_type || "BRANCH").toUpperCase();
                                    return t === String(branchType).toUpperCase();
                                })
                                .map((b) => (
                                    <option key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </option>
                                ))}
                        </select>
                    )}

                    {/* Admin ham, branch ham pul oldim bosishi mumkin bo‘lsin dedingiz (admin oladi, branch ko‘radi).
              Agar branchda tugma bo‘lmasin desangiz, bu tugmani faqat isAdmin qiling. */}
                    <button className="button-primary" onClick={openCashOut}>
                        Pul oldim
                    </button>
                </div>
            </div>

            {error && (
                <div className="info-box info-box--error" style={{ marginBottom: 8 }}>
                    {error}
                </div>
            )}

            {/* Summary cards */}
            <div className="card-grid card-grid-4">
                <div className="card">
                    <div className="card-title">Hozirgi kassa (Current)</div>
                    <div className="card-value">{money(currentTotals.current_amount)} so‘m</div>
                    <div className="card-subtitle">Sotuv + kirim − admin olgan pul</div>
                </div>

                <div className="card">
                    <div className="card-title">Period sotuv</div>
                    <div className="card-value">{money(currentTotals.sales_amount_period)} so‘m</div>
                    <div className="card-subtitle">Tanlangan sana/rejim bo‘yicha</div>
                </div>

                <div className="card">
                    <div className="card-title">Period kirim</div>
                    <div className="card-value">{money(currentTotals.cash_in_period)} so‘m</div>
                    <div className="card-subtitle">Qo‘lda kiritilgan kirimlar</div>
                </div>

                <div className="card">
                    <div className="card-title">Period admin olgan</div>
                    <div className="card-value">{money(currentTotals.cash_out_period)} so‘m</div>
                    <div className="card-subtitle">Pul oldim yozuvlari</div>
                </div>
            </div>

            {/* Admin uchun: branchlar kesimida jadval */}
            {isAdmin && (
                <div className="page-section">
                    <div className="page-section-header">
                        <h2 className="page-section-title">Joylar bo‘yicha kassa holati</h2>
                        <p className="page-section-subtitle">BranchType: {branchType}</p>
                    </div>

                    <div className="card">
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Joy</th>
                                        <th>Period sotuv</th>
                                        <th>Period kirim</th>
                                        <th>Period admin olgan</th>
                                        <th>Current</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center" }}>
                                                {loading ? "Yuklanmoqda..." : "Ma'lumot topilmadi"}
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((r, idx) => (
                                            <tr key={r.branch_id}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <div>{r.branch_name}</div>
                                                    <div style={{ fontSize: 11, opacity: 0.7 }}>{r.branch_type}</div>
                                                </td>
                                                <td>{money(r.sales_amount_period)} </td>
                                                <td>{money(r.cash_in_period)} </td>
                                                <td>{money(r.cash_out_period)} </td>
                                                <td style={{ fontWeight: 700 }}>{money(r.current_amount)} </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Entries history */}
            <div className="page-section">
                <div className="page-section-header">
                    <h2 className="page-section-title">Kassa yozuvlari (history)</h2>
                    <p className="page-section-subtitle">
                        {effectiveBranchId ? `Branch ID: ${effectiveBranchId}` : "Barcha"}
                    </p>
                </div>

                <div className="card">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Sana</th>
                                    <th>Joy</th>
                                    <th>Summa</th>
                                    <th>Izoh</th>
                                    <th>Kim kiritdi</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center" }}>
                                            {loading ? "Yuklanmoqda..." : "Yozuvlar yo‘q"}
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((e, i) => (
                                        <tr key={e.id}>
                                            <td>{i + 1}</td>
                                            <td>{e.cash_date}</td>
                                            <td>
                                                <div>{e.branch_name}</div>
                                                <div style={{ fontSize: 11, opacity: 0.7 }}>{e.branch_type}</div>
                                            </td>
                                            <td style={{ fontWeight: 700 }}>
                                                {money(e.amount)} {Number(e.amount) < 0 ? "(OUT)" : "(IN)"}
                                            </td>
                                            <td>{e.note || "—"}</td>
                                            <td>{e.created_by_name || "—"}</td>
                                            <td style={{ textAlign: "right" }}>
                                                {isAdmin && (
                                                    <button className="button-danger" onClick={() => deleteEntry(e.id)}>
                                                        O‘chirish
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div className="modal-header">
                            <div className="modal-title">Pul oldim</div>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            {!effectiveBranchId && isAdmin && (
                                <div className="info-box info-box--error" style={{ marginBottom: 10 }}>
                                    Avval branch tanlang (Barchasi bo‘lib turgan bo‘lsa pul olish yozilmaydi)
                                </div>
                            )}

                            <label className="label">Summa (so‘m)</label>
                            <input className="input" value={outAmount} onChange={(e) => setOutAmount(e.target.value)} />

                            <label className="label" style={{ marginTop: 10 }}>
                                Izoh
                            </label>
                            <input className="input" value={outNote} onChange={(e) => setOutNote(e.target.value)} placeholder="Masalan: inkassatsiya" />
                        </div>

                        <div className="modal-footer" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button className="button-secondary" onClick={() => setModalOpen(false)}>
                                Bekor qilish
                            </button>
                            <button className="button-primary" onClick={submitCashOut} disabled={saving}>
                                {saving ? "Saqlanmoqda..." : "Saqlash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
