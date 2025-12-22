import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

function LoginPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "", tenantSlug: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Agar allaqachon login bo'lgan bo'lsa, default route ga yuboramiz
    useEffect(() => {
        if (user) {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setLoading(true);
            await login(form.username, form.password, form.tenantSlug);
            navigate("/", { replace: true });
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Login xatosi";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-logo">
                <div className="app-logo">S</div>
            </div>

            <div className="card auth-card">
                <div className="auth-header">
                    <div className="auth-title">Xush kelibsiz</div>
                    <div className="auth-subtitle">Tizimga kirish uchun ma'lumotlaringizni kiriting</div>
                </div>

                {error && <div className="info-box info-box--error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Do'kon ID (Slug)</label>
                        <input
                            className="input auth-input"
                            name="tenantSlug"
                            value={form.tenantSlug}
                            onChange={handleChange}
                            placeholder="ex: ruxshona"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <input
                            className="input auth-input"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="admin"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            className="input auth-input"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <div className="auth-actions">
                        <button
                            className="button-primary auth-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Kirilmoqda..." : "Kirish"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
