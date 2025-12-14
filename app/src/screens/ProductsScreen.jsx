import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    ActivityIndicator,
    Modal,
    ScrollView,
    Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

import api from "../services/api";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import { colors, spacing, typography, radius } from "../styles";

const FILTER_ALL = "ALL";
const FILTER_PRODUCT = "PRODUCT_ONLY";
const FILTER_INGREDIENT = "INGREDIENT_ONLY";

const CATEGORY_PRODUCT = "PRODUCT";
const CATEGORY_DECORATION = "DECORATION";
const CATEGORY_UTILITY = "UTILITY";
const CATEGORY_INGREDIENT = "INGREDIENT";

function catLabel(category) {
    const map = {
        PRODUCT: "Mahsulot",
        DECORATION: "Dekor",
        UTILITY: "Aksessuar",
        INGREDIENT: "Ingredient",
    };
    return map[String(category || "").toUpperCase()] || category || "—";
}

export default function ProductsScreen() {
    const navigation = useNavigation();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [filterType, setFilterType] = useState(FILTER_ALL);
    const [searchQuery, setSearchQuery] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        category: CATEGORY_PRODUCT,
        unit: "",
        price: "",
        description: "",
    });

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
            setLoading(true);
            setError("");
            const res = await api.get("/products");
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Mahsulotlarni yuklashda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        if (field === "category") {
            let autoUnit = "";
            if (value === CATEGORY_INGREDIENT) autoUnit = "kg";
            else if (value === CATEGORY_PRODUCT) autoUnit = "dona";
            setFormData((prev) => ({ ...prev, unit: autoUnit }));
        }
    };

    const resetForm = () => {
        setFormData({ name: "", category: CATEGORY_PRODUCT, unit: "", price: "", description: "" });
        setEditingProduct(null);
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        try {
            const payload = {
                name: formData.name.trim(),
                category: formData.category,
                unit: formData.unit.trim() || null,
                price: formData.price ? Number(formData.price) : null,
                description: formData.description.trim() || null,
            };

            if (!payload.name) {
                setError("Mahsulot nomi kiritilishi shart.");
                return;
            }

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, payload);
                setSuccess("Mahsulot yangilandi.");
            } else {
                await api.post("/products", payload);
                setSuccess("Mahsulot qo'shildi.");
            }

            await fetchProducts();
            resetForm();
            setShowModal(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Xatolik yuz berdi.");
        }
    };

    const handleEdit = (p) => {
        setEditingProduct(p);
        setFormData({
            name: p.name || "",
            category: p.category || CATEGORY_PRODUCT,
            unit: p.unit || "",
            price: p.price ? String(p.price) : "",
            description: p.description || "",
        });
        setShowModal(true);
    };

    const handleDelete = (p) => {
        Alert.alert("O'chirish", `"${p.name}" mahsulotini o'chirmoqchimisiz?`, [
            { text: "Bekor", style: "cancel" },
            {
                text: "O'chirish",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/products/${p.id}`);
                        setSuccess("Mahsulot o'chirildi.");
                        fetchProducts();
                    } catch (err) {
                        console.error(err);
                        setError(err.response?.data?.message || "O'chirishda xatolik.");
                    }
                },
            },
        ]);
    };

    const filteredProducts = useMemo(() => {
        return (products || []).filter((p) => {
            const cat = String(p.category || "").toUpperCase();

            let byType = true;
            if (filterType === FILTER_PRODUCT) byType = cat !== "INGREDIENT";
            if (filterType === FILTER_INGREDIENT) byType = cat === "INGREDIENT";

            const bySearch = !searchQuery || String(p.name || "").toLowerCase().includes(searchQuery.toLowerCase());
            return byType && bySearch;
        });
    }, [products, filterType, searchQuery]);

    const FilterChip = ({ value, label }) => {
        const active = filterType === value;
        return (
            <Pressable
                onPress={() => setFilterType(value)}
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

    const renderProduct = ({ item }) => {
        return (
            <Card style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[typography.body, { color: colors.text, fontWeight: "900" }]}>{item.name}</Text>
                        <Text style={[typography.small, { color: colors.muted, marginTop: 4 }]}>
                            Kategoriya: <Text style={{ color: colors.text, fontWeight: "900" }}>{catLabel(item.category)}</Text>
                        </Text>

                        {item.unit ? (
                            <Text style={[typography.small, { color: colors.muted, marginTop: 4 }]}>
                                Birlik: <Text style={{ color: colors.text, fontWeight: "900" }}>{item.unit}</Text>
                            </Text>
                        ) : null}

                        {item.price ? (
                            <Text style={[typography.small, { color: colors.muted, marginTop: 4 }]}>
                                Narx: <Text style={{ color: "#fde68a", fontWeight: "900" }}>{Number(item.price).toLocaleString("uz-UZ")} so'm</Text>
                            </Text>
                        ) : null}

                        {item.description ? (
                            <Text style={[typography.small, { color: "#a5b4fc", marginTop: 6 }]} numberOfLines={2}>
                                {item.description}
                            </Text>
                        ) : null}
                    </View>

                    <View style={{ alignItems: "flex-end", gap: 8 }}>
                        <Pressable onPress={() => handleEdit(item)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                            <Text style={[typography.small, { color: "#bfdbfe", fontWeight: "900" }]}>✏️ Tahrirlash</Text>
                        </Pressable>
                        <Pressable onPress={() => handleDelete(item)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                            <Text style={[typography.small, { color: "#fecaca", fontWeight: "900" }]}>🗑️ O'chirish</Text>
                        </Pressable>
                    </View>
                </View>
            </Card>
        );
    };

    return (
        <Screen scroll={false}>
            <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.md }}>
                <Text style={[typography.h1, { color: colors.text }]}>Mahsulotlar</Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 6 }]}>
                    Tizimdagi barcha mahsulotlar va ingredientlar
                </Text>
            </View>

            <Card style={{ marginBottom: 12 }}>
                <Text style={[typography.small, { color: colors.muted, marginBottom: 6 }]}>Qidirish</Text>
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
                    placeholder="Qidirish..."
                    placeholderTextColor={colors.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    <FilterChip value={FILTER_ALL} label="Barchasi" />
                    <FilterChip value={FILTER_PRODUCT} label="Mahsulotlar" />
                    <FilterChip value={FILTER_INGREDIENT} label="Ingredientlar" />
                </View>

                <Pressable
                    onPress={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    style={({ pressed }) => [
                        {
                            marginTop: 12,
                            paddingVertical: 12,
                            borderRadius: radius.md,
                            backgroundColor: "#3b82f6",
                            alignItems: "center",
                        },
                        pressed && { opacity: 0.9 },
                    ]}
                >
                    <Text style={[typography.body, { color: "#e5e7eb", fontWeight: "900" }]}>+ Qo'shish</Text>
                </Pressable>
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

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator />
                    <Text style={[typography.small, { color: colors.text, marginTop: 8 }]}>Yuklanmoqda...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProduct}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ paddingBottom: 18 }}
                    ListEmptyComponent={<Text style={[typography.small, { color: colors.muted, textAlign: "center", marginTop: 30 }]}>Hech narsa topilmadi</Text>}
                    refreshing={loading}
                    onRefresh={fetchProducts}
                />
            )}

            {/* Modal Add/Edit */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.65)", justifyContent: "flex-end" }}>
                    <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(148,163,184,0.5)", maxHeight: "90%" }}>
                        <ScrollView>
                            <Text style={[typography.h1, { color: colors.text, fontSize: 18 }]}>
                                {editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
                            </Text>

                            <Text style={[typography.small, { color: colors.muted, marginTop: 12, marginBottom: 6 }]}>Nomi *</Text>
                            <TextInput
                                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, backgroundColor: colors.panel }}
                                value={formData.name}
                                onChangeText={(v) => handleChange("name", v)}
                                placeholder="Mahsulot nomi"
                                placeholderTextColor={colors.muted}
                            />

                            <Text style={[typography.small, { color: colors.muted, marginTop: 12, marginBottom: 6 }]}>Kategoriya *</Text>
                            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.panel }}>
                                <Picker
                                    selectedValue={formData.category}
                                    onValueChange={(v) => handleChange("category", v)}
                                    dropdownIconColor={colors.text}
                                    style={{ color: colors.text }}
                                >
                                    <Picker.Item label="Mahsulot" value={CATEGORY_PRODUCT} />
                                    <Picker.Item label="Dekor" value={CATEGORY_DECORATION} />
                                    <Picker.Item label="Aksessuar" value={CATEGORY_UTILITY} />
                                    <Picker.Item label="Ingredient" value={CATEGORY_INGREDIENT} />
                                </Picker>
                            </View>

                            <Text style={[typography.small, { color: colors.muted, marginTop: 12, marginBottom: 6 }]}>O'lchov birligi</Text>
                            <TextInput
                                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, backgroundColor: colors.panel }}
                                value={formData.unit}
                                onChangeText={(v) => handleChange("unit", v)}
                                placeholder="kg, dona..."
                                placeholderTextColor={colors.muted}
                            />

                            <Text style={[typography.small, { color: colors.muted, marginTop: 12, marginBottom: 6 }]}>Narx (so'm)</Text>
                            <TextInput
                                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, backgroundColor: colors.panel }}
                                value={formData.price}
                                onChangeText={(v) => handleChange("price", v)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.muted}
                            />

                            <Text style={[typography.small, { color: colors.muted, marginTop: 12, marginBottom: 6 }]}>Izoh</Text>
                            <TextInput
                                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, backgroundColor: colors.panel, minHeight: 80, textAlignVertical: "top" }}
                                value={formData.description}
                                onChangeText={(v) => handleChange("description", v)}
                                placeholder="Qo'shimcha ma'lumot..."
                                placeholderTextColor={colors.muted}
                                multiline
                            />

                            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                                <Pressable
                                    onPress={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    style={({ pressed }) => [
                                        { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
                                        pressed && { opacity: 0.9 },
                                    ]}
                                >
                                    <Text style={[typography.body, { color: colors.text, fontWeight: "900" }]}>Bekor</Text>
                                </Pressable>

                                <Pressable
                                    onPress={handleSubmit}
                                    style={({ pressed }) => [
                                        { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: "#3b82f6", alignItems: "center" },
                                        pressed && { opacity: 0.9 },
                                    ]}
                                >
                                    <Text style={[typography.body, { color: "#e5e7eb", fontWeight: "900" }]}>Saqlash</Text>
                                </Pressable>
                            </View>

                            <View style={{ height: 10 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}
