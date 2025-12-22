import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { styles } from "./ReceivingScreen.styles";

const STATUS_LABELS = {
    PENDING: "Davom qilmoqda",
    PARTIAL: "Qisman bajarildi",
    COMPLETED: "To'liq bajarildi",
    CANCELLED: "Bekor qilingan",
};

export default function ReceivingScreen() {
    const { user } = useAuth();
    const branchId = user?.branch_id || null;

    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedTransferId, setExpandedTransferId] = useState(null);
    const [savingItemId, setSavingItemId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchTransfers = async () => {
        if (!branchId) return;
        try {
            setLoading(true);
            setError("");
            const res = await api.get(`/transfers/incoming/branch/${branchId}`);
            setTransfers(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Kiruvchi transferlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransfers();
    }, [branchId]);

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING": return { color: "#fbbf24" };
            case "COMPLETED": return { color: "#4ade80" };
            case "CANCELLED": return { color: "#f87171" };
            default: return { color: "#94a3b8" };
        }
    };

    const getItemStatusLabel = (status) => {
        switch (status) {
            case "PENDING": return "Kutilmoqda";
            case "ACCEPTED": return "Qabul";
            case "REJECTED": return "Bekor";
            default: return status;
        }
    };

    const getItemStatusStyle = (status) => {
        switch (status) {
            case "PENDING": return { color: "#fbbf24" };
            case "ACCEPTED": return { color: "#4ade80" };
            case "REJECTED": return { color: "#f87171" };
            default: return { color: "#94a3b8" };
        }
    };

    const toggleExpand = (id) => setExpandedTransferId(expandedTransferId === id ? null : id);

    const handleAction = async (transferId, itemId, action) => {
        if (!branchId) {
            setError("Branch ID aniqlanmadi");
            return;
        }

        const confirmText =
            action === "accept"
                ? "Bu mahsulotni qabul qilmoqchimisiz?"
                : "Bu mahsulotni BEKOR qilib, markaziy omborga qaytarmoqchimisiz?";

        Alert.alert("Tasdiqlash", confirmText, [
            { text: "Yo'q", style: "cancel" },
            {
                text: "Ha",
                style: action === "reject" ? "destructive" : "default",
                onPress: async () => {
                    try {
                        setSavingItemId(itemId);
                        setError("");
                        setSuccess("");

                        const url =
                            action === "accept"
                                ? `/transfers/${transferId}/items/${itemId}/accept`
                                : `/transfers/${transferId}/items/${itemId}/reject`;

                        const res = await api.post(url, { branch_id: branchId });
                        const updated = res.data;

                        setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                        setSuccess("Amal muvaffaqiyatli bajarildi.");
                    } catch (err) {
                        console.error(err);
                        setError(err.response?.data?.message || "Amalni bajarishda xatolik.");
                    } finally {
                        setSavingItemId(null);
                    }
                },
            },
        ]);
    };

    const renderTransferItem = ({ item }) => {
        const isExpanded = expandedTransferId === item.id;

        return (
            <View style={styles.card}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.headerRow}>
                        <Text style={styles.transferTitle}>Transfer #{item.id}</Text>
                        <Text style={[styles.statusBadge, getStatusColor(item.status)]}>
                            {STATUS_LABELS[item.status] || item.status}
                        </Text>
                    </View>

                    <Text style={styles.subText}>
                        Sana: {item.transfer_date} | Dan: {item.from_branch_name || "Markaziy ombor"}
                    </Text>
                    {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.cardBody}>
                        <Text style={styles.itemsTitle}>Mahsulotlar:</Text>
{(item.items || []).map((it) => (
                            <View key={it.id} style={styles.itemRow}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{it.product_name}</Text>
                                    <Text style={styles.itemQty}>
                                        {it.quantity} {it.product_unit === "kg" ? "kg" : "dona"}
                                    </Text>
                                    <Text style={[styles.itemStatus, getItemStatusStyle(it.status)]}>
                                        {getItemStatusLabel(it.status)}
                                    </Text>
                                </View>

                                {it.status === "PENDING" ? (
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={[styles.btn, styles.btnAccept]}
                                            onPress={() => handleAction(item.id, it.id, "accept")}
                                            disabled={savingItemId === it.id}
                                        >
                                            {savingItemId === it.id ? (
                                                <ActivityIndicator />
                                            ) : (
                                                <Text style={styles.btnText}>Qabul</Text>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.btn, styles.btnReject]}
                                            onPress={() => handleAction(item.id, it.id, "reject")}
                                            disabled={savingItemId === it.id}
                                        >
                                            {savingItemId === it.id ? (
                                                <ActivityIndicator />
                                            ) : (
                                                <Text style={styles.btnText}>Bekor</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const ListHeader = () => (
        <View>
            <View style={styles.header}>
                <Text style={styles.title}>Qabul qilish</Text>
                <Text style={styles.subtitle}>Markaziy ombordan kelgan transferlar</Text>
            </View>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
            {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
        </View>
    );

    return (
        <FlatList
            style={styles.container}
            data={transfers}
            renderItem={renderTransferItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Hozircha transferlar yo'q</Text> : null}
            refreshing={loading}
            onRefresh={fetchTransfers}
        />
    );
}
