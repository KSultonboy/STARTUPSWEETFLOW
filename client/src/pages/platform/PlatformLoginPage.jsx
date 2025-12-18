import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PlatformLoginPage() {
    const { loginPlatform } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await loginPlatform(form.email, form.password);
            navigate('/platform/tenants');
        } catch (err) {
            setError('Login xatosi: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="card auth-card">
                <div className="auth-header">
                    <div className="auth-title">Platform Admin</div>
                    <div className="auth-subtitle">Boshqaruv paneliga kirish</div>
                </div>

                {error && <div className="info-box info-box--error" style={{ marginBottom: 16 }}>{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="auth-input"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="auth-input"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="button-primary auth-button">
                        Kirish
                    </button>
                </form>
            </div>
        </div>
    );
}
