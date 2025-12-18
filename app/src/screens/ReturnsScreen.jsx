import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { BarCodeScanner } from "expo-barcode-scanner";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { styles } from "./ReturnsScreen.styles";

const STATUS_LABELS = {
    PENDING: "Kutilmoqda",
    APPROVED: "Qabul qilingan",
    REJECTED: "Bekor qilingan",
    PARTIAL: "Qisman",
};

export default function ReturnsScreen() {
    const { user } = useAuth();
    const isBranch = user?.role === "branch";
    const isAdmin = user?.role === "admin";

    const [activeTab, setActiveTab] = useState("form"); // form | list

    // products
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // form
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [comment, setComment] = useState("");
    const [items, setItems] = useState([{ product_id: "", quantity: "", unit: "", reason: "" }]);
    const [saving, setSaving] = useState(false);

    // list
    const [returnsList, setReturnsList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Barcode scanner state (Returns)
    const [scannerVisible, setScannerVisible] = useState(false);
    const [scannerPermission, setScannerPermission] = useState(null);
    const [scannerBusy, setScannerBusy] = useState(false);

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

    const fetchReturns = async () => {
        try {
            setLoadingList(true);
            const params = { limit: 50 };
            if (isBranch) params.branch_id = user.branch_id;
            const res = await api.get("/returns", { params });
            setReturnsList(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Vazvratlar tarixini yuklashda xatolik");
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchReturns();
    }, []);

    // only PRODUCT / DECORATION
    const productOptions = useMemo(() => {
        return (products || []).filter((p) => {
            const cat = String(p.category || "").toUpperCase();
            return cat === "PRODUCT" || cat === "DECORATION";
        });
    }, [products]);

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING": return { color: "#fbbf24" };
            case "APPROVED": return { color: "#4ade80" };
            case "REJECTED": return { color: "#f87171" };
            default: return { color: "#94a3b8" };
        }
    };

    const getItemStatusLabel = (status) => {
        switch (status) {
            case "PENDING": return "Kutilmoqda";
            case "APPROVED": return "Qabul";
            case "REJECTED": return "Bekor";
            default: return status;
        }
    };

    const applyScannedProduct = (product) => {
        if (!product) return;

        setProducts((prev) => {
            const exists = prev.find((p) => p.id === product.id);
            if (exists) return prev;
            return [...prev, product];
        });

        setItems((prev) => {
            const idx = prev.findIndex((row) => String(row.product_id) === String(product.id));
            if (idx !== -1) {
                return prev.map((row, i) => {
                    if (i !== idx) return row;
                    const currentQty = Number(row.quantity) || 0;
                    return {
                        ...row,
                        quantity: String(currentQty + 1),
                        unit: row.unit || product.unit || "",
                    };
                });
            }

            return [
                ...prev,
                {
                    product_id: String(product.id),
                    quantity: "1",
                    unit: product.unit || "",
                    reason: "",
                },
            ];
        });
    };

    const lookupByBarcode = async (code) => {
        const trimmed = String(code || "").trim();
        if (!trimmed) return;
        try {
            const res = await api.get(`/products/by-barcode/${encodeURIComponent(trimmed)}`);
            const product = res.data;
            applyScannedProduct(product);
            setSuccess(`Shtrix kod bo'yicha vazvratga qo'shildi: ${product.name}`);
        } catch (err) {
            console.error(err);
            setError("Shtrix kod bo'yicha mahsulot topilmadi.");
        }
    };

    const openScanner = async () => {
        setError("");
        setSuccess("");
        try {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            const granted = status === "granted";
            setScannerPermission(granted);
            if (!granted) {
                setError("Kamera uchun ruxsat berilmadi.");
                return;
            }
            setScannerBusy(false);
            setScannerVisible(true);
        } catch (err) {
            console.error(err);
            setError("Kameraga ruxsat so'rashda xatolik.");
        }
    };

    const handleBarCodeScanned = async ({ data }) => {
        if (scannerBusy) return;
        setScannerBusy(true);
        await lookupByBarcode(data);
        setScannerVisible(false);
        setScannerBusy(false);
    };

    const handleItemChange = (index, field, value) => {
        setItems((prev) => {
            const copy = [...prev];
            const row = { ...copy[index], [field]: value };

            if (field === "product_id") {
                const product = productOptions.find((p) => String(p.id) === String(value));
                row.unit = product?.unit || "";
            }

            copy[index] = row;
            return copy;
        });
    };

    const addRow = () =>
        setItems((prev) => [...prev, { product_id: "", quantity: "", unit: "", reason: "" }]);

    const removeRow = (index) => {
        if (items.length === 1) {
            Alert.alert("Diqqat", "Kamida bitta qator bo'lishi kerak");
            return;
        }
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!user?.branch_id && !isAdmin) {
            setError("Profilga filial biriktirilmagan.");
            return;
        }

        const preparedItems = items
            .map((it) => ({
                product_id: it.product_id ? Number(it.product_id) : 0,
                quantity: Number(it.quantity) || 0,
                unit: it.unit || "",
                reason: it.reason || "",
            }))
            .filter((x) => x.product_id && x.quantity > 0);

        if (!preparedItems.length) {
            setError("Kamida bitta to'liq mahsulot qatori kiriting.");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                date,
                comment: comment || "",
                items: preparedItems,
                branch_id: user.branch_id,
            };

            await api.post("/returns", payload);
            setSuccess("Vazvrat so'rovi yuborildi.");

            setComment("");
            setItems([{ product_id: "", quantity: "", unit: "", reason: "" }]);

            await fetchReturns();
            setActiveTab("list");
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Vazvratni saqlashda xatolik.");
        } finally {
            setSaving(false);
        }
    };

    const deleteReturn = async (id) => {
        Alert.alert("O'chirish", "Haqiqatan ham o'chirmoqchimisiz?", [
            { text: "Yo'q", style: "cancel" },
            {
                text: "Ha",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/returns/${id}`);
                        setSuccess("Vazvrat o'chirildi");
                        fetchReturns();
                    } catch (err) {
                        setError("O'chirishda xatolik");
                    }
                },
            },
        ]);
    };

    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

    const ListHeader = () => (
        <View>
            <View style={styles.header}>
                <Text style={styles.title}>Vazvratlar</Text>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "form" && styles.activeTab]}
                        onPress={() => setActiveTab("form")}
                    >
                        <Text style={[styles.tabText, activeTab === "form" && styles.activeTabText]}>
                            Yangi
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === "list" && styles.activeTab]}
                        onPress={() => setActiveTab("list")}
                    >
                        <Text style={[styles.tabText, activeTab === "list" && styles.activeTabText]}>
                            Tarix
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
            {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}

            {activeTab === "form" ? (
                <View style={styles.box}>
                    <Text style={styles.boxTitle}>Yangi vazvrat</Text>

                    <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
                        <Text style={styles.scanBtnText}>📷 Shtrix kodni skanerlash</Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Sana</Text>
                    <TextInput
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#64748b"
                    />

                    {items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.rowTitle}>Mahsulot {index + 1}</Text>

                            <View style={styles.pickerWrap}>
                                <Picker
                                    selectedValue={item.product_id}
                                    onValueChange={(val) => handleItemChange(index, "product_id", val)}
                                    enabled={!loadingProducts}
                                >
                                    <Picker.Item label="Mahsulot tanlang" value="" />
                                    {productOptions.map((p) => (
                                        <Picker.Item key={p.id} label={p.name} value={String(p.id)} />
                                    ))}
                                </Picker>
                            </View>

                            <View style={styles.rowInputs}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    value={item.quantity}
                                    onChangeText={(val) => handleItemChange(index, "quantity", val)}
                                    placeholder="Miqdor"
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={[styles.input, { flex: 2, marginBottom: 0 }]}
                                    value={item.reason}
                                    onChangeText={(val) => handleItemChange(index, "reason", val)}
                                    placeholder="Sabab (ixtiyoriy)"
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            {items.length > 1 ? (
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeRow(index)}>
                                    <Text style={styles.removeBtnText}>Qatorni o'chirish</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addBtn} onPress={addRow}>
                        <Text style={styles.addBtnText}>+ Qator qo'shish</Text>
                    </TouchableOpacity>

                    <Text style={[styles.label, { marginTop: 12 }]}>Umumiy izoh</Text>
                    <TextInput
                        style={[styles.input, { minHeight: 60 }]}
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Izoh..."
                        placeholderTextColor="#64748b"
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, saving && styles.disabled]}
                        onPress={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Saqlash</Text>}
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );

    const renderReturn = ({ item }) => {
        const expanded = expandedId === item.id;

        return (
            <View style={styles.historyCard}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.headerRow}>
                        <Text style={styles.historyTitle}># {item.id} • {item.return_date}</Text>
                        <Text style={[styles.statusBadge, getStatusColor(item.status)]}>
                            {STATUS_LABELS[item.status] || item.status}
                        </Text>
                    </View>
                    <Text style={styles.metaText}>Filial: {item.branch_name}</Text>
                    {item.comment ? <Text style={styles.noteText}>{item.comment}</Text> : null}
                </TouchableOpacity>

                {expanded && (
                    <View style={styles.cardBody}>
                        {(item.items || []).length ? (
                            (item.items || []).map((it, idx) => (
                                <View key={idx} style={{ marginBottom: 10 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <Text style={styles.itemLine}>
                                            • {it.product_name} — {it.quantity} {it.unit || it.product_unit || ""}
                                        </Text>
                                        <View style={styles.pill}>
                                            <Text style={styles.pillText}>{getItemStatusLabel(it.status)}</Text>
                                        </View>
                                    </View>
                                    {it.reason ? <Text style={{ color: "#94a3b8", marginTop: 4 }}>Sabab: {it.reason}</Text> : null}
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: "#94a3b8" }}>Mahsulotlar ro'yxati yo'q</Text>
                        )}

                        {item.status === "PENDING" && (
                            <View style={styles.actionsRow}>
                                <TouchableOpacity style={styles.dangerBtn} onPress={() => deleteReturn(item.id)}>
                                    <Text style={styles.dangerBtnText}>🗑️ O'chirish</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    // ✅ list tab bo'lsa FlatList, form tab bo'lsa oddiy view (ListHeader ichida)
    if (activeTab === "form") {
        return (
            <View style={styles.container}>
                <ListHeader />
                <Modal
                    visible={scannerVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setScannerVisible(false)}
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: "rgba(0,0,0,0.85)",
                            justifyContent: "center",
                            padding: 16,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                overflow: "hidden",
                                borderWidth: 1,
                                borderColor: "rgba(148,163,184,0.7)",
                            }}
                        >
                            {scannerPermission ? (
                                <BarCodeScanner
                                    onBarCodeScanned={handleBarCodeScanned}
                                    style={{ flex: 1 }}
                                />
                            ) : (
                                <View
                                    style={{
                                        flex: 1,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "#020617",
                                    }}
                                >
                                    <Text style={{ color: "#e5e7eb", marginBottom: 12, fontSize: 16 }}>
                                        Kameraga ruxsat berilmadi
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setScannerVisible(false)}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            borderRadius: 8,
                                            backgroundColor: "#1f2937",
                                        }}
                                    >
                                        <Text style={{ color: "#e5e7eb", fontWeight: "600" }}>Yopish</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View
                            style={{
                                marginTop: 12,
                                padding: 10,
                                backgroundColor: "rgba(15,23,42,0.95)",
                                borderRadius: 10,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <Text style={{ color: "#e5e7eb", fontSize: 13 }}>
                                Vazvrat uchun mahsulot shtrix kodini skaner qiling
                            </Text>
                            <TouchableOpacity
                                onPress={() => setScannerVisible(false)}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                    backgroundColor: "#0f172a",
                                }}
                            >
                                <Text style={{ color: "#e5e7eb", fontWeight: "700" }}>Yopish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    return (
        <FlatList
            style={styles.container}
            data={returnsList}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderReturn}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            refreshing={loadingList}
            onRefresh={fetchReturns}
            ListEmptyComponent={!loadingList ? <Text style={styles.emptyText}>Vazvratlar yo'q</Text> : null}
        />
    );
}
