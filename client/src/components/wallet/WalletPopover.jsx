import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/authContext";
import api from "../../services/api";

export default function WalletPopover() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState("INFO"); // INFO | PAY

    const rootRef = useRef(null);

    // Real wallet state fetched from server
    const [wallet, setWallet] = useState(null);
    const [loadingWallet, setLoadingWallet] = useState(false);

    useEffect(() => {
        if (isOpen) fetchWallet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // ESC close + click outside close (extra safety)
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        const onClickOutside = (e) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target)) setIsOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("mousedown", onClickOutside);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("mousedown", onClickOutside);
        };
    }, [isOpen]);

    const fetchWallet = async () => {
        if (!user?.tenantId) return;
        setLoadingWallet(true);
        try {
            const res = await api.get(`/wallet`);
            setWallet(res.data);
        } catch (err) {
            console.error("Wallet fetch error", err);
        } finally {
            setLoadingWallet(false);
        }
    };

    const computeNextBillingDate = (w) => {
        const now = new Date();
        if (w.lastBilledAt) {
            const last = new Date(w.lastBilledAt);
            const next = new Date(last);
            next.setMonth(next.getMonth() + 1);
            return next;
        }
        const next = new Date(now);
        next.setDate(w.billingDay || 1);
        if (next < now) next.setMonth(next.getMonth() + 1);
        return next;
    };

    const daysUntil = (d) => {
        const now = new Date();
        return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    };

    const price = wallet?.plan?.price || 0;
    const balance = wallet?.balance || 0;

    const nextBillingDate = wallet ? computeNextBillingDate(wallet) : null;
    const expiryDate =
        nextBillingDate || (wallet?.contractEndDate ? new Date(wallet.contractEndDate) : null);
    const daysLeft = nextBillingDate ? daysUntil(nextBillingDate) : null;

    const statusColor = (() => {
        if (balance >= price && price > 0) return "var(--color-success)";
        if (daysLeft == null) return "var(--color-warning)";
        if (daysLeft <= 3) return "var(--color-danger)";
        if (daysLeft <= 15) return "var(--color-warning)";
        return "var(--color-success)";
    })();

    const buttonLabel =
        wallet && daysLeft != null
            ? `Tarif: ${daysLeft} kun · Balans: ${balance.toLocaleString()} so'm`
            : "Tarif";

    // Payment Form State
    const [amount, setAmount] = useState(price || 0);
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [formError, setFormError] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (price > 0) setAmount(price);
    }, [price]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setFormError("");

        const cleanedCard = (cardNumber || "").replace(/\s+/g, "");
        if (!cleanedCard || !/^\d{16}$/.test(cleanedCard)) {
            setFormError("Karta raqamini 16 ta raqam bilan kiriting.");
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
            await api.post(`/wallet/topup`, {
                amount,
                cardNumber: cleanedCard,
                cardExpiry,
            });
            alert("Top-up muvaffaqiyatli!");
            await fetchWallet();
            setView("INFO");
            setIsOpen(false);
            setCardNumber("");
            setCardExpiry("");
            setFormError("");
        } catch (err) {
            alert("Xatolik: " + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="wallet" ref={rootRef}>
            <button
                className="button-primary wallet__btn"
                style={{
                    backgroundColor: statusColor,
                    borderColor: statusColor,
                    boxShadow: `0 0 10px ${statusColor}40`,
                }}
                onClick={() => setIsOpen((p) => !p)}
                type="button"
            >
                <span className="wallet__icon">💳</span>
                <span className="wallet__label">{loadingWallet ? "Yuklanmoqda..." : buttonLabel}</span>
            </button>

            {isOpen && (
                <>
                    <div className="wallet__overlay" onClick={() => setIsOpen(false)} />
                    <div className="card wallet__panel">
                        {view === "INFO" ? (
                            <div className="wallet__content">
                                <div>
                                    <h4 className="wallet__muted">Joriy Tarif</h4>
                                    <div className="wallet__title">{wallet?.plan?.name || "Tarif tanlanmagan"}</div>
                                </div>

                                {expiryDate && (
                                    <div>
                                        <h4 className="wallet__muted">Tugash sanasi</h4>
                                        <div className="wallet__value">{expiryDate.toLocaleDateString()}</div>
                                    </div>
                                )}

                                <div className="wallet__stats">
                                    <div className="wallet__stat">
                                        <div className="wallet__muted">Xizmat narxi</div>
                                        <div className="wallet__bold">{price.toLocaleString()} so'm / oy</div>
                                    </div>

                                    <div className="wallet__stat wallet__stat--right">
                                        <div className="wallet__muted">Balans</div>
                                        <div
                                            className="wallet__bold"
                                            style={{
                                                color: balance >= price ? "var(--color-success)" : "var(--text-main)",
                                            }}
                                        >
                                            {balance.toLocaleString()} so'm
                                        </div>
                                    </div>
                                </div>

                                <div className="wallet__actions">
                                    <button className="button-primary" onClick={() => setView("PAY")} type="button">
                                        To'lov qilish / Uzaytirish
                                    </button>
                                    <button type="button" className="button-secondary" onClick={fetchWallet}>
                                        Yangilash
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handlePayment} className="wallet__form">
                                <div className="wallet__formhead">
                                    <h4 style={{ margin: 0, fontSize: 15 }}>To'lov</h4>
                                    <button
                                        type="button"
                                        className="wallet__back"
                                        onClick={() => setView("INFO")}
                                    >
                                        Orqaga
                                    </button>
                                </div>

                                <div>
                                    <label style={{ fontSize: 12 }}>Karta raqami (16 raqam)</label>
                                    <input
                                        className="input"
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        placeholder="8600 1234 5678 9012"
                                        maxLength={19}
                                        required
                                    />
                                </div>

                                <div className="wallet__row">
                                    <div>
                                        <label style={{ fontSize: 12 }}>Amal qilish muddati (MM/YY)</label>
                                        <input
                                            className="input"
                                            type="text"
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(e.target.value)}
                                            placeholder="12/26"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12 }}>Summa (so'm)</label>
                                        <input
                                            className="input"
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(Number(e.target.value))}
                                            min={1000}
                                            required
                                        />
                                    </div>
                                </div>

                                {formError && <div className="wallet__error">{formError}</div>}

                                <div className="wallet__actions">
                                    <button type="button" className="button-secondary" onClick={() => setView("INFO")}>
                                        Bekor
                                    </button>
                                    <button type="submit" className="button-primary" disabled={processing}>
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
