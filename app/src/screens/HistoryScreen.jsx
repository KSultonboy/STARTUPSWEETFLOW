import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import { colors, spacing, typography, radius } from "../styles";

const TYPE_LABEL = {
    sale: "Sotuv",
    transfer: "Transfer",
    production: "Ishlab chiqarish",
    return: "Vazvrat",
};

function typeBadge(type) {
    const t = String(type || "").toLowerCase();
    if (t === "sale") return { color: "#bbf7d0", border: "rgba(34,197,94,0.45)", bg: "rgba(34,197,94,0.12)" };
    if (t === "transfer") return { color: "#bfdbfe", border: "rgba(59,130,246,0.45)", bg: "rgba(59,130,246,0.12)" };
    if (t === "production") return { color: "#fde68a", border: "rgba(250,204,21,0.45)", bg: "rgba(250,204,21,0.10)" };
    if (t === "return") return { color: "#fecaca", border: "rgba(239,68,68,0.45)", bg: "rgba(239,68,68,0.12)" };
    return { color: colors.text, border: colors.border, bg: colors.panel };
}

export default function HistoryScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const role = String(user?.role || "").toLowerCase();
    const isAdmin = role === "admin";
    const isProduction = role === "production";
    const isBranch = role === "branch";

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [typeFilter, setTypeFilter] = useState("all"); // admin only

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <Pressable onPress={() => navigation.openDrawer()} style={{ paddingHorizontal: 12 }}>
                    <Text style={{ color: colors.text, fontSize: 22 }}>≡</Text>
                </Pressable>
            ),
        });
    }, [navigation]);

    const screenTitle = useMemo(() => {
        if (isProduction) return "Ishlab chiqarish tarixi";
        if (isBranch) return "Sotuv tarixi";
        return "Umumiy tarix";
    }, [isProduction, isBranch]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const params = {};

            if (isAdmin) {
                if (typeFilter !== "all") params.type = typeFilter;
            }
            if (isProduction) params.type = "production";
            if (isBranch) {
                params.type = "sale";
                params.branch_id = user.branch_id;
            }

            const res = await api.get("/history/activities", { params });
            setItems(res.data || []);
        } catch (err) {
            console.error("History load error:", err);
            setError("Tarixni yuklashda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [typeFilter, isProduction, isBranch]);

    const handleDeleteReturnFromHistory = async (row) => {
        if (String(row.type) !== "return") {
            setError("Bu turdagi tarixni o'chirish hozircha yoqilmagan.");
            return;
        }

        Alert.alert("O'chirishni tasdiqlang", "Rostdan ham bu vazvratni o'chirmoqchimisiz?", [
            { text: "Bekor", style: "cancel" },
            {
                text: "O'chirish",
                style: "destructive",
                onPress: async () => {
                    try {
                        setError("");
                        setSuccess("");
                        await api.delete(`/returns/${row.id}`);
                        setSuccess("Vazvrat o'chirildi.");
                        loadHistory();
                    } catch (err) {
                        console.error(err);
                        setError(err?.response?.data?.message || "O'chirishda xatolik.");
                    }
                },
            },
        ]);
    };

    const FilterChip = ({ value, label }) => {
        const active = typeFilter === value;
        return (
            <Pressable
                onPress={() => setTypeFilter(value)}
                style={({ pressed }) => [
                    {
                        paddingVertical: 7,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        backgroundColor: active ? "#3b82f6" : colors.panel,
                        borderWidth: 1,
                        borderColor: active ? "#3b82f6" : colors.border,
                    },
                    pressed && { opacity: 0.9 },
                ]}
            >
                <Text style={[typography.small, { color: active ? "#e5e7eb" : colors.text, fontWeight: "900" }]}>{label}</Text>
            </Pressable>
        );
    };

    const renderItem = ({ item }) => {
        const b = typeBadge(item.type);
        const dateText = item.created_at ? new Date(item.created_at).toLocaleDateString("uz-UZ") : "—";

        return (
            <Card style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: b.border, backgroundColor: b.bg }}>
                        <Text style={[typography.small, { color: b.color, fontWeight: "900" }]}>{TYPE_LABEL[item.type] || item.type}</Text>
                    </View>
                    <Text style={[typography.small, { color: colors.muted }]}>{dateText}</Text>
                </View>

                <View style={{ marginTop: 10, gap: 4 }}>
                    {item.branch_name ? (
                        <Text style={[typography.small, { color: colors.muted }]}>
                            Filial: <Text style={{ color: colors.text, fontWeight: "900" }}>{item.branch_name}</Text>
                        </Text>
                    ) : null}

                    {item.user_name ? (
                        <Text style={[typography.small, { color: colors.muted }]}>
                            Foydalanuvchi: <Text style={{ color: colors.text, fontWeight: "900" }}>{item.user_name}</Text>
                        </Text>
                    ) : null}

                    {item.total_amount ? (
                        <Text style={[typography.small, { color: colors.muted }]}>
                            Summa: <Text style={{ color: "#fde68a", fontWeight: "900" }}>{Number(item.total_amount).toLocaleString("uz-UZ")} so'm</Text>
                        </Text>
                    ) : null}

                    {item.status ? (
                        <Text style={[typography.small, { color: colors.muted }]}>
                            Holat: <Text style={{ color: colors.text, fontWeight: "900" }}>{String(item.status)}</Text>
                        </Text>
                    ) : null}
                </View>

                {String(item.type) === "return" && isAdmin ? (
                    <Pressable onPress={() => handleDeleteReturnFromHistory(item)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                        <Text style={[typography.small, { color: "#fecaca", fontWeight: "900", marginTop: 12 }]}>O'chirish</Text>
                    </Pressable>
                ) : null}
            </Card>
        );
    };

    return (
        <Screen scroll={false}>
            <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.md }}>
                <Text style={[typography.h1, { color: colors.text }]}>{screenTitle}</Text>

                {isAdmin ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                        <FilterChip value="all" label="Barchasi" />
                        <FilterChip value="sale" label="Sotuv" />
                        <FilterChip value="transfer" label="Transfer" />
                        <FilterChip value="production" label="Ishlab chiqarish" />
                        <FilterChip value="return" label="Vazvrat" />

                        <Pressable
                            onPress={loadHistory}
                            style={({ pressed }) => [
                                {
                                    paddingVertical: 7,
                                    paddingHorizontal: 10,
                                    borderRadius: 999,
                                    backgroundColor: colors.panel,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                },
                                pressed && { opacity: 0.9 },
                            ]}
                        >
                            <Text style={[typography.small, { color: colors.text, fontWeight: "900" }]}>🔄 Yangilash</Text>
                        </Pressable>
                    </View>
                ) : null}
            </View>

            {error ? (
                <View style={{ marginBottom: 10, padding: 10, borderRadius: radius.md, backgroundColor: "rgba(239,68,68,0.12)" }}>
                    <Text style={[typography.small, { color: "#fecaca" }]}>{error}</Text>
                </View>
            ) : null}

            {success ? (
                <View style={{ marginBottom: 10, padding: 10, borderRadius: radius.md, backgroundColor: "rgba(34,197,94,0.12)" }}>
                    <Text style={[typography.small, { color: "#bbf7d0" }]}>{success}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator />
                    <Text style={[typography.small, { color: colors.text, marginTop: 8 }]}>Yuklanmoqda...</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => `${item.type}-${item.id}`}
                    contentContainerStyle={{ paddingBottom: 18 }}
                    refreshing={loading}
                    onRefresh={loadHistory}
                    ListEmptyComponent={<Text style={[typography.small, { color: colors.muted, textAlign: "center", marginTop: 30 }]}>Tarix bo'sh</Text>}
                />
            )}
        </Screen>
    );
}
