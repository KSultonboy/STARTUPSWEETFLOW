// app/src/services/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// API Base URL
//  - EXPO_PUBLIC_API_URL faqat host yoki domen bo'lsin:
//      http://localhost:5000
//      http://192.168.0.10:5000
//      https://api.mysaas.com
//  - Quyida trailing slash va /api ni avtomatik tozalaymiz.
const rawEnv = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000").trim();
let normalized = rawEnv.replace(/\/$/, "");   // oxiridagi / ni olib tashlaymiz
normalized = normalized.replace(/\/api$/, ""); // agar oxirida /api bo'lsa, uni ham olib tashlaymiz

export const API_BASE_URL = `${normalized}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Access tokenni olish uchun helper
async function getAccessToken() {
    return await AsyncStorage.getItem("rt_access_token");
}

async function getRefreshToken() {
    return await AsyncStorage.getItem("rt_refresh_token");
}

// REQUEST INTERCEPTOR – har bir requestga access token qo'shamiz
api.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// REFRESH jarayonini boshqarish uchun flag/queue
let isRefreshing = false;
let refreshPromise = null;

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config || {};
        const status = error?.response?.status;
        const message = (error?.response?.data?.message || "").toLowerCase();

        // Agar refreshning o'zi 401 bo'lsa – qayta urinmaymiz
        const isRefreshUrl =
            originalRequest?.url &&
            originalRequest.url.includes("/auth/refresh");

        // JWT expired – access token muddati tugagan
        if (
            status === 401 &&
            message.includes("jwt expired") &&
            !originalRequest._retry &&
            !isRefreshUrl
        ) {
            originalRequest._retry = true;

            const refreshToken = await getRefreshToken();
            if (!refreshToken) {
                // refresh yo'q – to'g'ridan-to'g'ri logout
                await AsyncStorage.removeItem("rt_access_token");
                await AsyncStorage.removeItem("rt_refresh_token");
                await AsyncStorage.removeItem("rt_user");
                return Promise.reject(error);
            }

            try {
                // Bir vaqtning o'zida faqat bitta refresh bo'lishi uchun
                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshPromise = api
                        .post("/auth/refresh", { refreshToken })
                        .then(async (res) => {
                            const {
                                accessToken: newAccess,
                                refreshToken: newRefresh,
                                user,
                            } = res.data || {};

                            if (newAccess) {
                                await AsyncStorage.setItem(
                                    "rt_access_token",
                                    newAccess
                                );
                            }
                            if (newRefresh) {
                                await AsyncStorage.setItem(
                                    "rt_refresh_token",
                                    newRefresh
                                );
                            }
                            if (user) {
                                await AsyncStorage.setItem(
                                    "rt_user",
                                    JSON.stringify(user)
                                );
                            }

                            return newAccess;
                        })
                        .finally(() => {
                            isRefreshing = false;
                        });
                }

                const newAccessToken = await refreshPromise;

                if (!newAccessToken) {
                    throw new Error("Yangi access token olinmadi");
                }

                // Eski requestni yangi token bilan qayta jo'natamiz
                originalRequest.headers =
                    originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (err) {
                console.error("Tokenni yangilashda xato:", err);

                await AsyncStorage.removeItem("rt_access_token");
                await AsyncStorage.removeItem("rt_refresh_token");
                await AsyncStorage.removeItem("rt_user");

                return Promise.reject(err);
            }
        }

        // Boshqa 401 lar (masalan invalid token)
        if (status === 401 && !isRefreshUrl) {
            await AsyncStorage.removeItem("rt_access_token");
            await AsyncStorage.removeItem("rt_refresh_token");
            await AsyncStorage.removeItem("rt_user");
        }

        return Promise.reject(error);
    }
);

// Tokenni global headerga qo'yish (backward compatibility uchun)
export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
}

export default api;
