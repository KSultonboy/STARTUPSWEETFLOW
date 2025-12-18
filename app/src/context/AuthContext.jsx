// app/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);   // { id, full_name, role, ... }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const storedUser = await AsyncStorage.getItem("rt_user");
                if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch {
                        await AsyncStorage.removeItem("rt_user");
                    }
                }
            } catch (err) {
                console.log("Auth load error:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async (username, password, tenantSlug) => {
        const res = await api.post("/auth/login", {
            username,
            password,
            tenantSlug: tenantSlug || undefined,
        });
        const { accessToken, refreshToken, user } = res.data;

        // tokenlarni saqlaymiz
        await AsyncStorage.setItem("rt_access_token", accessToken);
        await AsyncStorage.setItem("rt_refresh_token", refreshToken);
        await AsyncStorage.setItem("rt_user", JSON.stringify(user));

        setUser(user);
    };

    const logout = async () => {
        try {
            const refreshToken = await AsyncStorage.getItem("rt_refresh_token");
            if (refreshToken) {
                // serverga ham xabar berib qo'yamiz
                await api.post("/auth/logout", { refreshToken });
            }
        } catch (err) {
            console.warn("logout request error:", err);
        }

        await AsyncStorage.removeItem("rt_access_token");
        await AsyncStorage.removeItem("rt_refresh_token");
        await AsyncStorage.removeItem("rt_user");
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
