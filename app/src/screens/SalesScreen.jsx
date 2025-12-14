import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator, Modal } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import { colors, spacing, typography, radius } from "../styles";

export default function SalesScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [products, setProducts] = useState([]);
    const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));

    const [items, setItems] = useState([{ product_id: "", quantity: "", unit_price: "" }]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [pendingPayload, setPendingPayload] = useState(null);
    const [shortages, setShortages] = useState(null);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <Pressable onPress={() => navigation.openDrawer()} style={{ paddingHorizontal: 12 }}>
                    <Text style={{ color: colors.text, fontSize: 22 }}>≡</Text>
                </Pressable>
            ),
        });
    }, [navigation]);

    const fetchProducts = async () => {
        try {
            const res = await api.get("/products");
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Mahsulotlar ro'yxatini yuklashda xatolik.");
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Sotuvga faqat PRODUCT kategoriyani chiqaramiz (xohlasangiz DECOR ham qo‘shamiz)
    const productOptions = useMemo(() => {
        return (products || []).filter((p) => String(p.category || "PRODUCT").toUpperCase() === "PRODUCT");
    }, [products]);

    const findProduct = (id) => productOptions.find((p) => String(p.id) === String(id));

    const handleItemChange = (index, field, value) => {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                if (field === "product_id") {
                    const product = findProduct(value);
                    return {
                        ...item,
                        product_id: value,
                        unit_price: product ? String(product.price || "") : "",
                    };
                }

                return { ...item, [field]: value };
            })
        );
    };

    const addRow = () => setItems((prev) => [...prev, { product_id: "", quantity: "", unit_price: "" }]);

    const removeRow = (index) => {
        if (items.length === 1) {
            setError("Kamida bitta qator bo'lishi kerak");
            return;
        }
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const totalAmount = useMemo(() => {
        return items.reduce((sum, row) => {
            const q = Number(row.quantity) || 0;
            const p = Number(row.unit_price) || 0;
            return sum + q * p;
        }, 0);
    }, [items]);

    const buildPayload = () => {
        if (!user?.branch_id) throw new Error("Foydalanuvchiga filial biriktirilmagan.");

        const cleanedItems = items
            .map((item) => ({
                product_id: Number(item.product_id) || null,
                quantity: Number(item.quantity) || 0,
                unit_price: Number(item.unit_price) || 0,
            }))
            .filter((i) => i.product_id && i.quantity > 0);

        if (cleanedItems.length === 0) {
            throw new Error("Kamida bitta to'g'ri to'ldirilgan pozitsiya kiritish kerak.");
        }

        return {
            branch_id: user.branch_id,
            user_id: user.id,
            sale_date: saleDate,
            items: cleanedItems,
        };
    };

    const sendSale = async (payload, { allowNegative = false } = {}) => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");
            setShortages(null);
            setPendingPayload(null);

            const body = allowNegative ? { ...payload, allow_negative_stock: true } : payload;

            await api.post("/sales", body);

            setSuccess("Sotuv muvaffaqiyatli saqlandi.");
            setItems([{ product_id: "", quantity: "", unit_price: "" }]);
        } catch (err) {
            console.error(err);
            const data = err.response?.data;

            if (data?.shortages && !allowNegative) {
                setPendingPayload(payload);
                setShortages(data.shortages);
            } else {
                setError(data?.message || "Sotuvni saqlashda xatolik yuz berdi.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");
        setShortages(null);
        setPendingPayload(null);

        try {
            const payload = buildPayload();
            await sendSale(payload, { allowNegative: false });
        } catch (err) {
            setError(err.message);
        }
    };

    const getProductName = (productId) => {
        const p = findProduct(productId);
        return p ? p.name : `ID: ${productId}`;
    };

    const renderItem = ({ item, index }) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const total = quantity * price;

        return (
            <Card style={{ marginBottom: 12 }}>
                <Text style={[typography.body, { color: colors.text, fontWeight: "800", marginBottom: 8 }]}>
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
                        dropdownIconColor={colors.text}
                        style={{ color: colors.text }}
                    >
                        <Picker.Item label="Mahsulotni tanlang" value="" />
                        {productOptions.map((p) => (
                            <Picker.Item
                                key={p.id}
                                label={`${p.name}${p.unit ? ` (${p.unit})` : ""}${p.price ? ` - ${p.price} so'm` : ""}`}
                                value={String(p.id)}
                            />
                        ))}
                    </Picker>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
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
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={[typography.small, { color: colors.muted, marginBottom: 6 }]}>Narx</Text>
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
                            value={item.unit_price}
                            onChangeText={(value) => handleItemChange(index, "unit_price", value)}
                            placeholder="0"
                            placeholderTextColor={colors.muted}
                        />
                    </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
                    <Text style={[typography.body, { color: "#facc15", fontWeight: "900" }]}>
                        Jami: {total.toLocaleString("uz-UZ")} so'm
                    </Text>

                    {items.length > 1 ? (
                        <Pressable
                            onPress={() => removeRow(index)}
                            style={({ pressed }) => [
                                {
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderRadius: radius.md,
                                    backgroundColor: "rgba(239,68,68,0.16)",
                                    borderWidth: 1,
                                    borderColor: "rgba(239,68,68,0.5)",
                                },
                                pressed && { opacity: 0.85 },
                            ]}
                        >
                            <Text style={[typography.small, { color: "#fecaca", fontWeight: "800" }]}>O'chirish</Text>
                        </Pressable>
                    ) : null}
                </View>
            </Card>
        );
    };

    return (
        <Screen scroll={false}>
            <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.md }}>
                <Text style={[typography.h1, { color: colors.text }]}>Sotuv</Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 6 }]}>
                    Ushbu filial bo'yicha sotuv cheklarini kiritish.
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
                    value={saleDate}
                    onChangeText={setSaleDate}
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
                contentContainerStyle={{ paddingBottom: 18 }}
                style={{ flex: 1 }}
            />

            <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>Umumiy summa:</Text>
                    <Text style={[typography.body, { color: "#facc15", fontWeight: "900" }]}>
                        {totalAmount.toLocaleString("uz-UZ")} so'm
                    </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
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
                        <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>+ Qator qo'shish</Text>
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
                            <Text style={[typography.body, { color: "#e5e7eb", fontWeight: "900" }]}>Sotuvni saqlash</Text>
                        )}
                    </Pressable>
                </View>
            </Card>

            {/* Shortage Modal */}
            <Modal visible={!!shortages} transparent animationType="fade" onRequestClose={() => setShortages(null)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", padding: 18, justifyContent: "center" }}>
                    <View
                        style={{
                            backgroundColor: colors.bg,
                            borderRadius: radius.lg,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 14,
                        }}
                    >
                        <Text style={[typography.body, { color: colors.text, fontWeight: "900" }]}>
                            Omborda mahsulot yetarli emas
                        </Text>
                        <Text style={[typography.small, { color: colors.muted, marginTop: 6, lineHeight: 16 }]}>
                            Quyidagi mahsulotlar uchun sotilayotgan miqdor ombordagi qoldiqdan ko'p. Baribir sotuvni tasdiqlaysizmi?
                        </Text>

                        <View style={{ marginTop: 10 }}>
                            {shortages?.map((s) => (
                                <Text key={s.product_id} style={[typography.small, { color: colors.text, marginBottom: 6 }]}>
                                    • <Text style={{ fontWeight: "900" }}>{getProductName(s.product_id)}</Text>: kerak {s.required}, omborda{" "}
                                    {s.available}
                                </Text>
                            ))}
                        </View>

                        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                            <Pressable
                                onPress={() => {
                                    setShortages(null);
                                    setPendingPayload(null);
                                }}
                                style={({ pressed }) => [
                                    {
                                        flex: 1,
                                        paddingVertical: 10,
                                        borderRadius: radius.md,
                                        backgroundColor: colors.panel,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        alignItems: "center",
                                    },
                                    pressed && { opacity: 0.85 },
                                ]}
                            >
                                <Text style={[typography.body, { color: colors.text, fontWeight: "800" }]}>Bekor qilish</Text>
                            </Pressable>

                            <Pressable
                                onPress={async () => {
                                    if (!pendingPayload) return;
                                    await sendSale(pendingPayload, { allowNegative: true });
                                }}
                                style={({ pressed }) => [
                                    { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: "#3b82f6", alignItems: "center" },
                                    pressed && { opacity: 0.9 },
                                ]}
                            >
                                <Text style={[typography.body, { color: "#e5e7eb", fontWeight: "900" }]}>Baribir sotish</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}
