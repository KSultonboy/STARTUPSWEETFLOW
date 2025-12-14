import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import { colors, spacing, typography, radius } from "../styles";

export default function WarehouseScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const role = String(user?.role || "").toLowerCase();
    const isAdmin = role === "admin";
    const isBranch = role === "branch";

    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [branchFilter, setBranchFilter] = useState("all");
    const [productFilter, setProductFilter] = useState("all");

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <Pressable onPress={() => navigation.openDrawer()} style={{ paddingHorizontal: 12 }}>
                    <Text style={{ color: colors.text, fontSize: 22 }}>≡</Text>
                </Pressable>
            ),
        });
    }, [navigation]);

    const fetchStock = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {};

            if (isBranch && user?.branch_id) {
                params.branch_id = user.branch_id;
            } else if (isAdmin && branchFilter !== "all") {
                params.branch_id = branchFilter;
            }

            const res = await api.get("/warehouse/stock", { params });
            setStock(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Ombor qoldiqlarini yuklashda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, [branchFilter, isBranch, user?.branch_id]);

    const branches = useMemo(() => {
        if (!isAdmin) return [];
        const map = new Map();

        (stock || []).forEach((item) => {
            const type = String(item.branch_type || "BRANCH").toUpperCase();
            if (type === "OUTLET") return;

            const id = item.branch_id ?? "central";
            const name = item.branch_name || "Markaziy ombor";
            if (!map.has(id)) map.set(id, { name });
        });

        const result = [{ id: "all", name: "Barchasi" }, { id: "central", name: "Markaziy ombor" }];

        for (const [id, info] of map.entries()) {
            if (id === "central") continue;
            result.push({ id, name: info.name });
        }

        return result;
    }, [stock, isAdmin]);

    const products = useMemo(() => {
        const map = new Map();
        (stock || []).forEach((item) => {
            if (!map.has(item.product_id)) map.set(item.product_id, item.product_name);
        });

        const result = [{ id: "all", name: "Barchasi" }];
        for (const [id, name] of map.entries()) result.push({ id, name });
        return result;
    }, [stock]);

    const filteredStocks = useMemo(() => {
        return (stock || []).filter((item) => {
            const type = String(item.branch_type || "BRANCH").toUpperCase();
            if (type === "OUTLET") return false;

            const byProduct = productFilter === "all" || String(item.product_id) === String(productFilter);
            return byProduct;
        });
    }, [stock, productFilter]);

    const title = isBranch && user?.branch_name ? `Omborxona (${user.branch_name})` : "Omborxona";

    const Row = ({ item }) => (
        <View
            style={{
                flexDirection: "row",
                gap: 10,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#111827",
            }}
        >
            <View style={{ flex: 2 }}>
                <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>{item.product_name}</Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 2 }]}>
                    {item.branch_name || "Markaziy"}
                </Text>
            </View>

            <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[typography.body, { color: "#facc15", fontWeight: "900" }]}>
                    {(item.quantity || 0).toLocaleString("uz-UZ")}
                </Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 2 }]}>{item.unit || ""}</Text>
            </View>
        </View>
    );

    return (
        <Screen scroll={false}>
            <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.md }}>
                <Text style={[typography.h1, { color: colors.text }]}>{title}</Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 6 }]}>
                    Mahsulot qoldiqlari va ombor holatini kuzatish bo'limi
                </Text>
            </View>

            {isAdmin ? (
                <Card style={{ marginBottom: 12 }}>
                    <Text style={[typography.small, { color: colors.muted, marginBottom: 6 }]}>Filial filter</Text>
                    <View
                        style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: radius.md,
                            overflow: "hidden",
                            backgroundColor: colors.panel,
                        }}
                    >
                        <Picker
                            selectedValue={branchFilter}
                            onValueChange={(value) => {
                                setBranchFilter(value);
                                setProductFilter("all");
                            }}
                            dropdownIconColor={colors.text}
                            style={{ color: colors.text }}
                        >
                            {branches.map((b) => (
                                <Picker.Item key={b.id} label={b.name} value={b.id} />
                            ))}
                        </Picker>
                    </View>
                </Card>
            ) : null}

            <Card style={{ marginBottom: 12 }}>
                <Text style={[typography.small, { color: colors.muted, marginBottom: 6 }]}>Mahsulot filter</Text>
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        overflow: "hidden",
                        backgroundColor: colors.panel,
                    }}
                >
                    <Picker
                        selectedValue={productFilter}
                        onValueChange={setProductFilter}
                        dropdownIconColor={colors.text}
                        style={{ color: colors.text }}
                    >
                        {products.map((p) => (
                            <Picker.Item key={p.id} label={p.name} value={p.id} />
                        ))}
                    </Picker>
                </View>
            </Card>

            {error ? (
                <View style={{ marginBottom: 10, padding: 10, borderRadius: radius.md, backgroundColor: "rgba(239,68,68,0.12)" }}>
                    <Text style={[typography.small, { color: "#fecaca" }]}>{error}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator />
                    <Text style={[typography.small, { color: colors.text, marginTop: 8 }]}>Yuklanmoqda...</Text>
                </View>
            ) : (
                <Card style={{ flex: 1 }}>
                    {!filteredStocks.length ? (
                        <Text style={[typography.small, { color: colors.muted }]}>Ma'lumot yo'q</Text>
                    ) : (
                        <FlatList
                            data={filteredStocks}
                            renderItem={({ item }) => <Row item={item} />}
                            keyExtractor={(item, index) => `${item.product_id}-${item.branch_id}-${index}`}
                        />
                    )}
                </Card>
            )}
        </Screen>
    );
}
