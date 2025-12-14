import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import { colors, spacing, typography, radius } from "../styles";

export default function ProductionScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [batchDate, setBatchDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState("");
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([{ product_id: "", quantity: "" }]);

    const [loadingProducts, setLoadingProducts] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <Pressable onPress={() => navigation.openDrawer()} style={{ paddingHorizontal: 12 }}>
                    <Text style={{ color: colors.text, fontSize: 22 }}>≡</Text>
                </Pressable>
            ),
        });
    }, [navigation]);

    const productOptions = useMemo(() => {
        return (products || []).filter((p) => String(p.category || "PRODUCT").toUpperCase() === "PRODUCT");
    }, [products]);

    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const res = await api.get("/products");
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Mahsulotlarni yuklashda xatolik");
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleItemChange = (index, field, value) => {
        setItems((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    };

    const addRow = () => setItems((prev) => [...prev, { product_id: "", quantity: "" }]);

    const removeRow = (index) => {
        if (items.length === 1) {
            setError("Kamida bitta qator bo'lishi kerak");
            return;
        }
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setNote("");
        setItems([{ product_id: "", quantity: "" }]);
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        const cleanedItems = items
            .map((row) => ({
                product_id: row.product_id ? Number(row.product_id) : 0,
                quantity: Number(row.quantity) || 0,
            }))
            .filter((r) => r.product_id && r.quantity > 0);

        if (cleanedItems.length === 0) {
            setError("Kamida bitta mahsulot va miqdor kiritish kerak (quantity > 0).");
            return;
        }

        const payload = {
            batch_date: batchDate,
            shift: null,
            note: note || null,
            created_by: user?.id || null,
            items: cleanedItems,
        };

        try {
            setSaving(true);
            await api.post("/production", payload);
            setSuccess("Ishlab chiqarish partiyasi muvaffaqiyatli saqlandi.");
            resetForm();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Ishlab chiqarish partiyasini saqlashda xatolik.");
        } finally {
            setSaving(false);
        }
    };

    const renderItem = ({ item, index }) => {
        const product = productOptions.find((p) => String(p.id) === String(item.product_id));

        return (
            <Card style={{ marginBottom: 12 }}>
                <Text style={[typography.body, { color: colors.text, fontWeight: "900", marginBottom: 8 }]}>
                    Pozitsiya #{index + 1}
                </Text>

                <Text style={[typography.small, { color: colors.muted, marginBottom: 6 }]}>Mahsulot</Text>
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        overflow: "hidden",
                        backgroundColor: colors.panel,
                        marginBottom: 12,
                    }}
                >
                    <Picker
                        selectedValue={item.product_id}
                        onValueChange={(value) => handleItemChange(index, "product_id", value)}
                        enabled={!loadingProducts}
                        dropdownIconColor={colors.text}
                        style={{ color: colors.text }}
                    >
                        <Picker.Item label={loadingProducts ? "Yuklanmoqda..." : "Mahsulot tanlang"} value="" />
                        {productOptions.map((p) => (
                            <Picker.Item key={p.id} label={`${p.name}${p.unit ? ` (${p.unit})` : ""}`} value={String(p.id)} />
                        ))}
                    </Picker>
                </View>

                <Text style={[typography.small, { color: colors.muted, marginBottom: 6 }]}>Miqdor</Text>
                <TextInput
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: colors.text,
                        backgroundColor: colors.panel,
                    }}
                    keyboardType="numeric"
                    value={item.quantity}
                    onChangeText={(value) => handleItemChange(index, "quantity", value)}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                />

                {product ? (
                    <Text style={[typography.small, { color: colors.muted, marginTop: 8 }]}>
                        Birlik: <Text style={{ color: colors.text, fontWeight: "900" }}>{product.unit || "dona"}</Text>
                    </Text>
                ) : null}

                {items.length > 1 ? (
                    <Pressable
                        onPress={() => removeRow(index)}
                        style={({ pressed }) => [
                            {
                                marginTop: 12,
                                paddingVertical: 10,
                                borderRadius: radius.md,
                                backgroundColor: "rgba(239,68,68,0.16)",
                                borderWidth: 1,
                                borderColor: "rgba(239,68,68,0.5)",
                                alignItems: "center",
                            },
                            pressed && { opacity: 0.85 },
                        ]}
                    >
                        <Text style={[typography.body, { color: "#fecaca", fontWeight: "900" }]}>O'chirish</Text>
                    </Pressable>
                ) : null}
            </Card>
        );
    };

    return (
        <Screen scroll={false}>
            <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.md }}>
                <Text style={[typography.h1, { color: colors.text }]}>Production</Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 6 }]}>
                    Kunlik ishlab chiqarilgan mahsulotlar partiyasini kiritish.
                </Text>
            </View>

            <Card style={{ marginBottom: 12 }}>
                <Text style={[typography.small, { color: colors.muted, marginBottom: 6 }]}>Sana (YYYY-MM-DD)</Text>
                <TextInput
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: colors.text,
                        backgroundColor: colors.panel,
                    }}
                    value={batchDate}
                    onChangeText={setBatchDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.muted}
                />
            </Card>

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

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(_, index) => `item-${index}`}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 18 }}
                ListHeaderComponent={
                    <Text style={[typography.small, { color: colors.muted, marginBottom: 10, textAlign: "center" }]}>
                        Qatorlar qo‘shing, mahsulot tanlang va miqdorini kiriting.
                    </Text>
                }
            />

            <Card>
                <Text style={[typography.small, { color: colors.muted, marginBottom: 6 }]}>Eslatma (ixtiyoriy)</Text>
                <TextInput
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: colors.text,
                        backgroundColor: colors.panel,
                        minHeight: 60,
                        textAlignVertical: "top",
                    }}
                    multiline
                    value={note}
                    onChangeText={setNote}
                    placeholder="Masalan: Tug'ilgan kun buyurtmalari uchun..."
                    placeholderTextColor={colors.muted}
                />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                    <Pressable
                        onPress={addRow}
                        style={({ pressed }) => [
                            {
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: radius.md,
                                backgroundColor: colors.panel,
                                borderWidth: 1,
                                borderColor: colors.border,
                                alignItems: "center",
                            },
                            pressed && { opacity: 0.85 },
                        ]}
                    >
                        <Text style={[typography.body, { color: colors.text, fontWeight: "900" }]}>+ Qator qo'shish</Text>
                    </Pressable>

                    <Pressable
                        onPress={handleSubmit}
                        disabled={saving}
                        style={({ pressed }) => [
                            {
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: radius.md,
                                backgroundColor: saving ? "rgba(59,130,246,0.45)" : "#3b82f6",
                                alignItems: "center",
                            },
                            pressed && !saving && { opacity: 0.9 },
                        ]}
                    >
                        {saving ? (
                            <ActivityIndicator />
                        ) : (
                            <Text style={[typography.body, { color: "#e5e7eb", fontWeight: "900" }]}>Partiyani saqlash</Text>
                        )}
                    </Pressable>
                </View>
            </Card>
        </Screen>
    );
}
