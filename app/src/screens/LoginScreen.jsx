import React, { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Pressable, Linking } from "react-native";
import { useAuth } from "../context/AuthContext";

import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import { colors, spacing, typography, radius, shadows } from "../styles";
import { API_BASE_URL } from "../services/api";

export default function LoginScreen() {
    const { login } = useAuth();

    const [form, setForm] = useState({ tenantSlug: "", username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");

        if (!form.tenantSlug.trim() || !form.username.trim() || !form.password.trim()) {
            setError("Do'kon ID (slug), username va parolni kiriting");
            return;
        }

        try {
            setLoading(true);
            await login(form.username, form.password, form.tenantSlug);
        } catch (err) {
            console.error("Login error:", err.response?.data || err.message);
            setError(err.response?.data?.message || "Login xatosi");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPlatformLogin = async () => {
        try {
            const base = API_BASE_URL.replace(/\/api\/?$/i, "");
            const url = `${base}/platform/login`;
            await Linking.openURL(url);
        } catch (e) {
            console.warn("Platform login URL error", e);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <Screen scroll={true} contentStyle={{ justifyContent: "center", paddingVertical: spacing.xxl }}>
                {/* Logo */}
                <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
                    <View
                        style={[
                            {
                                width: 60,
                                height: 60,
                                borderRadius: 999,
                                backgroundColor: colors.primary,
                                alignItems: "center",
                                justifyContent: "center",
                            },
                            shadows.primary,
                        ]}
                    >
                        <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>R</Text>
                    </View>
                </View>

                <Card style={{ borderRadius: radius.xl, paddingVertical: 26, paddingHorizontal: 22 }}>
                    <View style={{ alignItems: "center", marginBottom: spacing.md }}>
                        <Text style={[typography.h1, { color: colors.text }]}>Ruxshona Tort Admin</Text>
                        <Text style={[typography.small, { color: colors.muted, marginTop: 6 }]}>Ichki tizimga kirish</Text>
                    </View>

                    {error ? (
                        <View
                            style={{
                                width: "100%",
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: radius.sm,
                                backgroundColor: colors.dangerBg,
                                borderWidth: 1,
                                borderColor: "rgba(239, 68, 68, 0.6)",
                                marginBottom: spacing.md,
                            }}
                        >
                            <Text style={{ color: "#fca5a5", fontSize: 13 }}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={{ gap: 12 }}>
                        <TextField
                            label="Do'kon ID (Slug)"
                            value={form.tenantSlug}
                            onChangeText={(t) => setForm((p) => ({ ...p, tenantSlug: t }))}
                            placeholder="ruxshona"
                            autoCapitalize="none"
                        />
                        <TextField
                            label="Username"
                            value={form.username}
                            onChangeText={(t) => setForm((p) => ({ ...p, username: t }))}
                            placeholder="admin"
                            autoCapitalize="none"
                        />
                        <TextField
                            label="Password"
                            value={form.password}
                            onChangeText={(t) => setForm((p) => ({ ...p, password: t }))}
                            placeholder="********"
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <View style={{ marginTop: spacing.md, alignItems: "center", gap: 8 }}>
                            <Button
                                title={loading ? "Kirilmoqda..." : "Kirish"}
                                loading={loading}
                                onPress={handleSubmit}
                            />
                            <Pressable onPress={handleOpenPlatformLogin} style={{ paddingVertical: 4 }}>
                                <Text style={{ fontSize: 12, color: colors.muted }}>
                                    Platform adminmisiz? Brauzerda ochish
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </Card>
            </Screen>
        </KeyboardAvoidingView>
    );
}

