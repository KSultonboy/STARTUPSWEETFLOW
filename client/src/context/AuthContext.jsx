// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);   // { id, full_name, role, ... }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("rt_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem("rt_user");
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const res = await api.post("/auth/login", { username, password });
        const { accessToken, refreshToken, user } = res.data;

        // tokenlarni saqlaymiz
        localStorage.setItem("rt_access_token", accessToken);
        localStorage.setItem("rt_refresh_token", refreshToken);
        localStorage.setItem("rt_user", JSON.stringify(user));

        setUser(user);
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem("rt_refresh_token");
            if (refreshToken) {
                // serverga ham xabar berib qo'yamiz (hozircha stateless, lekin keyin kengaytirish oson bo'ladi)
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
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
