import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import api from "../services/api";
import { styles } from "./ExpensesScreen.styles";

const TYPE_INGREDIENTS = "ingredients";
const TYPE_DECOR = "decor";
const TYPE_UTILITY = "utility";

const TABS = [
    { key: TYPE_INGREDIENTS, label: "Masalliqlar" },
    { key: TYPE_DECOR, label: "Bezaklar" },
    { key: TYPE_UTILITY, label: "Kommunal" },
];

export default function ExpensesScreen() {
    const [activeTab, setActiveTab] = useState(TYPE_INGREDIENTS);

    // Form
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState(""); // ✅ nimadan bo'lganini
    const [items, setItems] = useState([{ product_id: "", quantity: "", unit_price: "" }]);
    const [editingExpense, setEditingExpense] = useState(null);

    // Products
    const [ingredientProducts, setIngredientProducts] = useState([]);
    const [decorProducts, setDecorProducts] = useState([]);
    const [utilityProducts, setUtilityProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // List
    const [expenses, setExpenses] = useState([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [expandedExpenseId, setExpandedExpenseId] = useState(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchResources = async () => {
            setLoadingProducts(true);
            try {
                const [pRes, dRes, uRes] = await Promise.all([
                    api.get("/products"),
                    api.get("/products/decorations"),
                    api.get("/products/utilities"),
                ]);

                const allProducts = pRes.data || [];
                setIngredientProducts(allProducts.filter((p) => String(p.category).toUpperCase() === "INGREDIENT"));
                setDecorProducts(dRes.data || []);
                setUtilityProducts(uRes.data || []);
            } catch (err) {
                console.error(err);
                setError("Mahsulotlarni yuklashda xatolik");
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchResources();
    }, []);

    useEffect(() => {
        fetchExpenses();
        resetForm();
    }, [activeTab]);

    const getProductOptions = () => {
        if (activeTab === TYPE_INGREDIENTS) return ingredientProducts;
        if (activeTab === TYPE_DECOR) return decorProducts;
        return utilityProducts;
    };

    const allProductsMap = useMemo(() => {
        const map = new Map();
        [...ingredientProducts, ...decorProducts, ...utilityProducts].forEach((p) => {
            map.set(String(p.id), p);
        });
        return map;
    }, [ingredientProducts, decorProducts, utilityProducts]);

    const getProductNameById = (id) => {
        const p = allProductsMap.get(String(id));
        return p?.name || "";
    };

    const fetchExpenses = async () => {
        setLoadingExpenses(true);
        try {
            setError("");
            const res = await api.get("/expenses", { params: { type: activeTab } });
            setExpenses(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Xarajatlarni yuklashda xatolik");
        } finally {
            setLoadingExpenses(false);
        }
    };

    const resetForm = () => {
        setItems([{ product_id: "", quantity: "", unit_price: "" }]);
        setDate(new Date().toISOString().slice(0, 10));
        setDescription("");
        setEditingExpense(null);
        setExpandedExpenseId(null);
    };

    const handleItemChange = (index, field, value) => {
        setItems((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const addRow = () => setItems((prev) => [...prev, { product_id: "", quantity: "", unit_price: "" }]);

    const removeRow = (index) => {
        if (items.length === 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const buildPreparedItems = () => {
        const prepared = [];

        for (const it of items) {
            const product_id = it.product_id ? Number(it.product_id) : null;
            const quantity = Number(it.quantity || 0);
            const unit_price = Number(it.unit_price || 0);

            if (!product_id) continue;

            // ✅ nomsiz fix: name doim product nomidan
            const name = getProductNameById(product_id);

            if (activeTab === TYPE_INGREDIENTS) {
                if (quantity > 0 && unit_price > 0) {
                    prepared.push({ product_id, name, quantity, unit_price });
                }
            } else if (activeTab === TYPE_DECOR) {
                if (unit_price > 0) {
                    const qty = quantity > 0 ? quantity : 1;
                    const calculatedPrice = unit_price / qty;
                    prepared.push({ product_id, name, quantity: qty, unit_price: calculatedPrice });
                }
            } else if (activeTab === TYPE_UTILITY) {
                if (unit_price > 0) {
                    prepared.push({ product_id, name, quantity: 1, unit_price });
                }
            }
        }

        return prepared;
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        const preparedItems = buildPreparedItems();

        if (!preparedItems.length) {
            setError("Kamida bitta to'g'ri to'ldirilgan qator kerak");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                type: activeTab,
                date,
                description: description?.trim() || null, // ✅ nimadan bo'lganini
                items: preparedItems,
            };

            if (editingExpense?.id) {
                await api.put(`/expenses/${editingExpense.id}`, payload);
                setSuccess("Xarajat yangilandi");
            } else {
                await api.post("/expenses", payload);
                setSuccess("Xarajat saqlandi");
            }

            resetForm();
            fetchExpenses();
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Saqlashda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (row) => {
        Alert.alert("O'chirish", "Ushbu xarajatni o'chirmoqchimisiz?", [
            { text: "Yo'q", style: "cancel" },
            {
                text: "Ha",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/expenses/${row.id}`);
                        fetchExpenses();
                    } catch (err) {
                        Alert.alert("Xatolik", "O'chirishda xatolik");
                    }
                },
            },
        ]);
    };

    const startEdit = (row) => {
        setEditingExpense(row);
        setDate(row.expense_date || new Date().toISOString().slice(0, 10));
        setDescription(row.description || "");
        const mapped = (row.items || []).map((it) => ({
            product_id: String(it.product_id || ""),
            quantity: String(it.quantity ?? ""),
            unit_price: String(it.unit_price ?? ""),
        }));
        setItems(mapped.length ? mapped : [{ product_id: "", quantity: "", unit_price: "" }]);
        setExpandedExpenseId(row.id);
    };

    const toggleExpand = (id) => setExpandedExpenseId(expandedExpenseId === id ? null : id);

    const ListHeader = () => (
        <View>
            <View style={styles.header}>
                <Text style={styles.title}>Xarajatlar</Text>
            </View>

            <View style={styles.tabs}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {editingExpense ? (
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>✏️ Tahrirlash rejimi: #{editingExpense.id}</Text>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                        <TouchableOpacity style={styles.actionBtn} onPress={resetForm}>
                            <Text style={styles.actionBtnText}>Reset</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
            {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}

            <View style={styles.box}>
                <Text style={styles.boxTitle}>{editingExpense ? "Xarajatni tahrirlash" : "Yangi xarajat"}</Text>

                <Text style={styles.label}>Sana</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#64748b" />

                <Text style={styles.label}>Nimadan bo'ldi? (izoh)</Text>
                <TextInput
                    style={styles.input}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Masalan: gaz, bezak, shakar..."
                    placeholderTextColor="#64748b"
                />

                {items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                        <View style={styles.pickerWrap}>
                            <Picker
                                selectedValue={item.product_id}
                                onValueChange={(val) => handleItemChange(index, "product_id", val)}
                            >
                                <Picker.Item label={loadingProducts ? "Yuklanmoqda..." : "Tanlang..."} value="" />
                                {getProductOptions().map((p) => (
                                    <Picker.Item key={p.id} label={p.name} value={String(p.id)} />
                                ))}
                            </Picker>
                        </View>

                        <View style={styles.qtyRow}>
                            {activeTab !== TYPE_UTILITY && (
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    value={item.quantity}
                                    onChangeText={(val) => handleItemChange(index, "quantity", val)}
                                    placeholder="Miqdor"
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                />
                            )}

                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0, marginLeft: activeTab !== TYPE_UTILITY ? 10 : 0 }]}
                                value={item.unit_price}
                                onChangeText={(val) => handleItemChange(index, "unit_price", val)}
                                placeholder={activeTab === TYPE_INGREDIENTS ? "Narx (1 dona)" : "Jami summa"}
                                placeholderTextColor="#64748b"
                                keyboardType="numeric"
                            />

                            {items.length > 1 && (
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeRow(index)}>
                                    <Text style={styles.removeBtnText}>X</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.addBtn} onPress={addRow}>
                    <Text style={styles.addBtnText}>+ Qator qo'shish</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitBtn, saving && styles.disabled]}
                    onPress={handleSubmit}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editingExpense ? "Yangilash" : "Saqlash"}</Text>}
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Xarajatlar tarixi</Text>
        </View>
    );

    const renderExpense = ({ item }) => {
        const expanded = expandedExpenseId === item.id;

        return (
            <TouchableOpacity style={styles.historyCard} onPress={() => toggleExpand(item.id)}>
                <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{item.expense_date}</Text>
                    <Text style={styles.historyAmount}>{Number(item.total_amount || 0).toLocaleString()} so'm</Text>
                </View>

                {item.description ? <Text style={styles.historyMeta}>Izoh: {item.description}</Text> : null}

                {expanded && (
                    <View style={styles.historyBody}>
                        {(item.items || []).map((it, idx) => {
                            const name =
                                it.name ||
                                it.product_name ||
                                getProductNameById(it.product_id) ||
                                "Nomsiz";
                            return (
                                <Text key={idx} style={styles.historyItem}>
                                    • {name}: {it.quantity} x {Number(it.unit_price || 0).toLocaleString()}
                                </Text>
                            );
                        })}

                        <View style={styles.rowActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => startEdit(item)}>
                                <Text style={styles.actionBtnText}>✏️ Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                                <Text style={styles.deleteBtnText}>🗑️ O'chirish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            style={styles.container}
            data={expenses}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderExpense}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={{ paddingBottom: 30 }}
            refreshing={loadingExpenses}
            onRefresh={fetchExpenses}
            ListEmptyComponent={!loadingExpenses ? <Text style={styles.emptyText}>Ma'lumot topilmadi</Text> : null}
        />
    );
}
