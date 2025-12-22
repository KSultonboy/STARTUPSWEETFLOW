// client/src/context/AuthContext.jsx
import { useState } from "react";
import api from "../services/api";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("rt_user");
        if (!storedUser) return null;
        try {
            return JSON.parse(storedUser);
        } catch {
            localStorage.removeItem("rt_user");
            return null;
        }
    });
    const [loading] = useState(false);

    const login = async (username, password, tenantSlug) => {
        const res = await api.post("/auth/login", {
            username,
            password,
            tenantSlug: tenantSlug || undefined
        });
        const { accessToken, refreshToken, user } = res.data;

        localStorage.setItem("rt_access_token", accessToken);
        localStorage.setItem("rt_refresh_token", refreshToken);
        localStorage.setItem("rt_user", JSON.stringify(user));

        setUser(user);
    };

    const loginPlatform = async (email, password) => {
        const res = await api.post("/platform/auth/login", { email, password });
        const { token, user } = res.data; // Platform login returns { token, user }

        // We use same storage execution but maybe differentiation is needed?
        // Since platform owner doesn't have tenant, it fits safely.
        localStorage.setItem("rt_access_token", token);
        // Platform owner might not have refresh token in this MVP implementation
        localStorage.setItem("rt_user", JSON.stringify(user));

        setUser(user);
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem("rt_refresh_token");
            if (refreshToken) {
                await api.post("/auth/logout", { refreshToken });
            }
        } catch (err) {
            console.warn("logout request error:", err);
        }

        localStorage.removeItem("rt_access_token");
        localStorage.removeItem("rt_refresh_token");
        localStorage.removeItem("rt_user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginPlatform, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
