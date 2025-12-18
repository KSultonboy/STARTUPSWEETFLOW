import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function WalletPopover() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('INFO'); // INFO | PAY

    // Real wallet state fetched from server
    const [wallet, setWallet] = useState(null);
    const [loadingWallet, setLoadingWallet] = useState(false);

    useEffect(() => {
        if (isOpen) fetchWallet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const fetchWallet = async () => {
        if (!user?.tenantId) return;
        setLoadingWallet(true);
        try {
            const res = await api.get(`/wallet`);
            setWallet(res.data);
        } catch (err) {
            console.error('Wallet fetch error', err);
        } finally {
            setLoadingWallet(false);
        }
    };

    const computeNextBillingDate = (w) => {
        const now = new Date();
        // If we have lastBilledAt, add one month
        if (w.lastBilledAt) {
            const last = new Date(w.lastBilledAt);
            const next = new Date(last);
            next.setMonth(next.getMonth() + 1);
            return next;
        }
        // Otherwise use billingDay in current month or next
        const next = new Date(now);
        next.setDate(w.billingDay || 1);
        if (next < now) {
            next.setMonth(next.getMonth() + 1);
        }
        return next;
    };

    const daysUntil = (d) => {
        const now = new Date();
        return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    };

    const daysInPeriod = (next) => {
        const now = new Date();
        const diff = Math.abs(next - now);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const price = wallet?.plan?.price || 0;
    const balance = wallet?.balance || 0;

    const nextBillingDate = wallet ? computeNextBillingDate(wallet) : null;
    const expiryDate = nextBillingDate || (wallet?.contractEndDate ? new Date(wallet.contractEndDate) : null);
    const daysLeft = nextBillingDate ? daysUntil(nextBillingDate) : null;
    const totalDays = nextBillingDate ? daysInPeriod(nextBillingDate) : 30;

    const statusColor = (() => {
        // If balance covers next month, green
        if (balance >= price && price > 0) return 'var(--color-success)';

        if (!daysLeft) return 'var(--color-warning)';
        if (daysLeft <= 3) return 'var(--color-danger)';
        if (daysLeft <= Math.ceil(totalDays / 2)) return 'var(--color-warning)';
        return 'var(--color-success)';
    })();

    const buttonLabel =
        wallet && daysLeft != null
            ? `Tarif: ${daysLeft} kun qoldi · Balans: ${balance.toLocaleString()} so'm`
            : 'Tarif';

    // Payment Form State
    const [amount, setAmount] = useState(price || 0);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [formError, setFormError] = useState('');
    const [processing, setProcessing] = useState(false);

    const handlePayment = async (e) => {
        e.preventDefault();
        setFormError('');

        // Simple validation: 16-digit card number and optional MM/YY expiry
        const cleanedCard = (cardNumber || '').replace(/\s+/g, '');
        if (!cleanedCard || !/^\d{16}$/.test(cleanedCard)) {
            setFormError('Karta raqamini 16 ta raqam bilan kiriting.');
            return;
        }
        if (!amount || Number(amount) <= 0) {
            setFormError("Summa noto'g'ri.");
            return;
        }
        if (cardExpiry) {
            const m = cardExpiry.trim();
            if (!/^\d{2}\/\d{2}$/.test(m)) {
                setFormError("Amal qilish muddatini MM/YY formatida kiriting.");
                return;
            }
        }

        setProcessing(true);
        try {
            // Call backend top-up endpoint (card ma'lumotlari hozircha faqat tekshiruv uchun)
            await api.post(`/wallet/topup`, { amount, cardNumber: cleanedCard, cardExpiry });
            alert("Top-up muvaffaqiyatli!");
            await fetchWallet();
            setView('INFO');
            setIsOpen(false);
            setCardNumber('');
            setCardExpiry('');
            setFormError('');
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                className="button-primary"
                style={{
                    backgroundColor: statusColor,
                    borderColor: statusColor,
                    color: '#fff',
                    padding: '6px 16px',
                    fontSize: 13,
                    boxShadow: `0 0 10px ${statusColor}40`
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ marginRight: 6 }}>💳</span>
                {loadingWallet ? 'Yuklanmoqda...' : buttonLabel}
            </button>

            {isOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        className="card"
                        style={{
                            position: 'absolute',
                            top: '45px',
                            right: 0,
                            width: 300,
                            zIndex: 100,
                            padding: 16,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            border: '1px solid var(--border-color)',
                        }}
                    >
                        {view === 'INFO' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Joriy Tarif</h4>
                                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{wallet?.plan?.name || 'Tarif tanlanmagan'}</div>
                                </div>
                                {expiryDate && (
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Tugash sanasi</h4>
                                        <div style={{ fontSize: 15 }}>{expiryDate.toLocaleDateString()}</div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: 13 }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Xizmat narxi</div>
                                        <div style={{ fontWeight: 700 }}>{price.toLocaleString()} so'm / oy</div>
                                    </div>

                                    <div style={{ padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: 13, textAlign: 'right' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Balans</div>
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                color: balance >= price ? 'var(--color-success)' : 'var(--text-main)',
                                            }}
                                        >
                                            {balance.toLocaleString()} so'm
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        className="button-primary"
                                        onClick={() => setView('PAY')}
                                        style={{ flex: 1 }}
                                    >
                                        To'lov qilish / Uzaytirish
                                    </button>
                                    <button type="button" className="button-secondary" onClick={fetchWallet}>
                                        Yangilash
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: 15 }}>To'lov</h4>
                                    <button
                                        type="button"
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        onClick={() => setView('INFO')}
                                    >
                                        Orqaga
                                    </button>
                                </div>

                                <div>
                                    <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Karta raqami (16 raqam)</label>
                                    <input
                                        className="input"
                                        type="text"
                                        value={cardNumber}
                                        onChange={e => setCardNumber(e.target.value)}
                                        placeholder="8600 1234 5678 9012"
                                        maxLength={19}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Amal qilish muddati (MM/YY)</label>
                                        <input
                                            className="input"
                                            type="text"
                                            value={cardExpiry}
                                            onChange={e => setCardExpiry(e.target.value)}
                                            placeholder="12/26"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Summa (so'm)</label>
                                        <input
                                            className="input"
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(Number(e.target.value))}
                                            min={1000}
                                            required
                                        />
                                    </div>
                                </div>

                                {formError && (
                                    <div style={{ fontSize: 12, color: 'var(--color-danger)' }}>
                                        {formError}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        type="button"
                                        className="button-secondary"
                                        onClick={() => setView('INFO')}
                                    >
                                        Bekor
                                    </button>
                                    <button
                                        type="submit"
                                        className="button-primary"
                                        disabled={processing}
                                        style={{ flex: 1 }}
                                    >
                                        {processing ? "Bajarilmoqda..." : "Top-up"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
