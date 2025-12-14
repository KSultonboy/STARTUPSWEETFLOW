// client/src/services/api.js
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Access tokenni olish uchun helper
function getAccessToken() {
    return localStorage.getItem("rt_access_token");
}
function getRefreshToken() {
    return localStorage.getItem("rt_refresh_token");
}

// REQUEST INTERCEPTOR – har bir requestga access token qo'shamiz
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
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

            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                // refresh yo'q – to'g'ridan-to'g'ri logout
                localStorage.removeItem("rt_access_token");
                localStorage.removeItem("rt_refresh_token");
                localStorage.removeItem("rt_user");
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login?expired=1";
                }
                return Promise.reject(error);
            }

            try {
                // Bir vaqtning o'zida faqat bitta refresh bo'lishi uchun
                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshPromise = api
                        .post("/auth/refresh", { refreshToken })
                        .then((res) => {
                            const {
                                accessToken: newAccess,
                                refreshToken: newRefresh,
                                user,
                            } = res.data || {};

                            if (newAccess) {
                                localStorage.setItem(
                                    "rt_access_token",
                                    newAccess
                                );
                            }
                            if (newRefresh) {
                                localStorage.setItem(
                                    "rt_refresh_token",
                                    newRefresh
                                );
                            }
                            if (user) {
                                localStorage.setItem(
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

                localStorage.removeItem("rt_access_token");
                localStorage.removeItem("rt_refresh_token");
                localStorage.removeItem("rt_user");

                if (window.location.pathname !== "/login") {
                    window.location.href = "/login?expired=1";
                }

                return Promise.reject(err);
            }
        }

        // Boshqa 401 lar (masalan invalid token)
        if (status === 401 && !isRefreshUrl) {
            localStorage.removeItem("rt_access_token");
            localStorage.removeItem("rt_refresh_token");
            localStorage.removeItem("rt_user");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login?expired=1"
            }
        }

        return Promise.reject(error);
    }
);

export default api;
