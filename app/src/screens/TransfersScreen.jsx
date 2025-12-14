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
import { useAuth } from "../context/AuthContext";
import { styles } from "./TransfersScreen.styles";

const STATUS_LABELS = {
    PENDING: "Kutilmoqda",
    COMPLETED: "Yakunlandi",
    CANCELLED: "Bekor qilindi",
    PARTIAL: "Qisman",
};

export default function TransfersScreen() {
    const { user } = useAuth();

    const [mode, setMode] = useState("BRANCH"); // BRANCH | OUTLET

    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [transfers, setTransfers] = useState([]);

    const [activeTab, setActiveTab] = useState("form"); // form | list
    const [loading, setLoading] = useState(false);
    const [loadingResources, setLoadingResources] = useState(false);

    const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [toBranchId, setToBranchId] = useState("");
    const [note, setNote] = useState("");
    const [items, setItems] = useState([{ product_id: "", quantity: "" }]);
    const [saving, setSaving] = useState(false);

    const [expandedId, setExpandedId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoadingResources(true);
            try {
                const [bRes, pRes] = await Promise.all([api.get("/branches"), api.get("/products")]);
                setBranches(bRes.data || []);
                setProducts(pRes.data || []);
            } catch (err) {
                console.error(err);
                setError("Ma'lumotlarni yuklashda xatolik");
            } finally {
                setLoadingResources(false);
            }
        };

        fetchData();
        fetchTransfers();
    }, []);

    const fetchTransfers = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/transfers");
            setTransfers(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Transferlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const productOptions = useMemo(() => {
        return (products || []).filter((p) => {
            const cat = String(p.category || "").toUpperCase();
            return !cat || cat === "PRODUCT" || cat === "DECORATION";
        });
    }, [products]);

    const branchOptions = useMemo(() => {
        return (branches || []).filter(
            (b) => (b.branch_type || "BRANCH").toUpperCase() === "BRANCH" && b.is_active !== 0
        );
    }, [branches]);

    const outletOptions = useMemo(() => {
        return (branches || []).filter(
            (b) => (b.branch_type || "BRANCH").toUpperCase() === "OUTLET" && b.is_active !== 0
        );
    }, [branches]);

    const destinationOptions = mode === "BRANCH" ? branchOptions : outletOptions;

    const filteredTransfers = useMemo(() => {
        const isOutletMode = mode === "OUTLET";
        return (transfers || []).filter((t) => {
            const tType = (t.to_branch_type || "BRANCH").toUpperCase();
            return isOutletMode ? tType === "OUTLET" : tType === "BRANCH";
        });
    }, [transfers, mode]);

    const handleItemChange = (index, field, value) => {
        setItems((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    };

    const addRow = () => setItems((prev) => [...prev, { product_id: "", quantity: "" }]);

    const removeRow = (index) => {
        if (items.length === 1) {
            Alert.alert("Diqqat", "Kamida bitta qator bo'lishi kerak");
            return;
        }
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setToBranchId("");
        setNote("");
        setItems([{ product_id: "", quantity: "" }]);
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!toBranchId) {
            setError(mode === "BRANCH" ? "Filialni tanlang" : "Do'konni tanlang");
            return;
        }

        const cleanedItems = items
            .map((row) => ({
                product_id: row.product_id ? Number(row.product_id) : 0,
                quantity: Number(row.quantity) || 0,
            }))
            .filter((r) => r.product_id && r.quantity > 0);

        if (!cleanedItems.length) {
            setError("Kamida bitta mahsulot va miqdor kiritish kerak");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                transfer_date: transferDate,
                to_branch_id: Number(toBranchId),
                note: note || null,
                items: cleanedItems,
                created_by: user?.id,
            };

            await api.post("/transfers", payload);
            setSuccess("Transfer muvaffaqiyatli yaratildi");
            resetForm();
            fetchTransfers();
            setActiveTab("list");
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    const deleteTransfer = (id) => {
        Alert.alert("Bekor qilish", "Haqiqatan ham bekor qilmoqchimisiz?", [
            { text: "Yo'q", style: "cancel" },
            {
                text: "Ha",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/transfers/${id}`);
                        setSuccess("Transfer bekor qilindi");
                        fetchTransfers();
                    } catch (err) {
                        setError("O'chirishda xatolik");
                    }
                },
            },
        ]);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING": return { color: "#fbbf24" };
            case "COMPLETED": return { color: "#4ade80" };
            case "CANCELLED": return { color: "#f87171" };
            default: return { color: "#94a3b8" };
        }
    };

    const getItemStatusLabel = (status) => {
        if (!status) return "—";
        if (status === "PENDING") return "Kutilmoqda";
        if (status === "ACCEPTED") return "Qabul";
        if (status === "REJECTED") return "Bekor";
        return status;
    };

    const ListHeader = () => (
        <View>
            <View style={styles.header}>
                <Text style={styles.title}>Transferlar</Text>

                <View style={styles.modeContainer}>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === "BRANCH" && styles.activeModeBtn]}
                        onPress={() => setMode("BRANCH")}
                    >
                        <Text style={[styles.modeText, mode === "BRANCH" && styles.activeModeText]}>Filiallar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === "OUTLET" && styles.activeModeBtn]}
                        onPress={() => setMode("OUTLET")}
                    >
                        <Text style={[styles.modeText, mode === "OUTLET" && styles.activeModeText]}>Do'konlar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "form" && styles.activeTab]}
                        onPress={() => setActiveTab("form")}
                    >
                        <Text style={[styles.tabText, activeTab === "form" && styles.activeTabText]}>Yangi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "list" && styles.activeTab]}
                        onPress={() => setActiveTab("list")}
                    >
                        <Text style={[styles.tabText, activeTab === "list" && styles.activeTabText]}>Tarix</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
            {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}

            {activeTab === "form" ? (
                <View style={styles.box}>
                    <Text style={styles.boxTitle}>Yangi transfer</Text>

                    <Text style={styles.label}>Sana</Text>
                    <TextInput
                        style={styles.input}
                        value={transferDate}
                        onChangeText={setTransferDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#64748b"
                    />

                    <Text style={styles.label}>{mode === "BRANCH" ? "Qaysi filialga?" : "Qaysi do'konga?"}</Text>
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={toBranchId} onValueChange={setToBranchId} enabled={!loadingResources}>
                            <Picker.Item label="Tanlang..." value="" />
                            {destinationOptions.map((b) => (
                                <Picker.Item key={b.id} label={b.name} value={String(b.id)} />
                            ))}
                        </Picker>
                    </View>

                    {items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={styles.pickerWrap}>
                                <Picker
                                    selectedValue={item.product_id}
                                    onValueChange={(val) => handleItemChange(index, "product_id", val)}
                                >
                                    <Picker.Item label="Mahsulot tanlang" value="" />
                                    {productOptions.map((p) => (
                                        <Picker.Item key={p.id} label={p.name} value={String(p.id)} />
                                    ))}
                                </Picker>
                            </View>

                            <View style={styles.qtyRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    value={item.quantity}
                                    onChangeText={(val) => handleItemChange(index, "quantity", val)}
                                    placeholder="Miqdor"
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

                    <Text style={[styles.label, { marginTop: 12 }]}>Izoh (ixtiyoriy)</Text>
                    <TextInput
                        style={[styles.input, { minHeight: 60 }]}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Izoh..."
                        placeholderTextColor="#64748b"
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, saving && styles.disabled]}
                        onPress={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Yuborish</Text>}
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );

    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

    const renderTransfer = ({ item }) => {
        const expanded = expandedId === item.id;

        return (
            <View style={styles.historyCard}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.headerRow}>
                        <Text style={styles.historyTitle}># {item.id} • {item.to_branch_name}</Text>
                        <Text style={[styles.statusBadge, getStatusColor(item.status)]}>
                            {STATUS_LABELS[item.status] || item.status}
                        </Text>
                    </View>
                    <Text style={styles.metaText}>Sana: {item.transfer_date}</Text>
                    {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
                </TouchableOpacity>

                {expanded && (
                    <View style={styles.cardBody}>
                        {(item.items || []).length ? (
                            (item.items || []).map((it, idx) => (
                                <View key={idx} style={{ marginBottom: 10 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <Text style={styles.itemLine}>
                                            • {it.product_name} — {it.quantity} {it.product_unit || ""}
                                        </Text>
                                        <View style={styles.pill}>
                                            <Text style={styles.pillText}>{getItemStatusLabel(it.status)}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: "#94a3b8" }}>Mahsulotlar ro'yxati yo'q</Text>
                        )}

                        {item.status === "PENDING" && (
                            <View style={styles.rowActions}>
                                <TouchableOpacity style={styles.dangerBtn} onPress={() => deleteTransfer(item.id)}>
                                    <Text style={styles.dangerBtnText}>Bekor qilish</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    if (activeTab === "form") {
        return (
            <View style={styles.container}>
                <ListHeader />
            </View>
        );
    }

    return (
        <FlatList
            style={styles.container}
            data={filteredTransfers}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderTransfer}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            refreshing={loading}
            onRefresh={fetchTransfers}
            ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Transferlar topilmadi</Text> : null}
        />
    );
}
