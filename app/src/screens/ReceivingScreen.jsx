import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
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

    // Barcode scanner state (Receiving)
    const [scannerVisible, setScannerVisible] = useState(false);
    const [scannerPermission, setScannerPermission] = useState(null);
    const [scannerBusy, setScannerBusy] = useState(false);
    const [scannerTransferId, setScannerTransferId] = useState(null);

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

    const openScannerForTransfer = async (transferId) => {
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
            setScannerTransferId(transferId);
            setScannerVisible(true);
        } catch (err) {
            console.error(err);
            setError("Kameraga ruxsat so'rashda xatolik.");
        }
    };

    const handleBarCodeScanned = async ({ data }) => {
        if (scannerBusy) return;
        setScannerBusy(true);

        try {
            const code = String(data || "").trim();
            if (!code) return;

            // 1) Mahsulotni barcode bo'yicha topamiz
            const res = await api.get(`/products/by-barcode/${encodeURIComponent(code)}`);
            const product = res.data;

            if (!product || !product.id) {
                setError("Shtrix kod bo'yicha mahsulot topilmadi.");
                return;
            }

            // 2) Skaner faollashtirilgan transferni topamiz
            const transfer = transfers.find((t) => t.id === scannerTransferId);
            if (!transfer) {
                setError("Transfer topilmadi.");
                return;
            }

            // 3) Shu transfer ichida ushbu mahsulot bo'yicha PENDING itemni topamiz
            const pendingItem = (transfer.items || []).find(
                (it) =>
                    it.status === "PENDING" &&
                    String(it.product_id) === String(product.id)
            );

            if (!pendingItem) {
                setError("Bu transferda ushbu mahsulot topilmadi yoki allaqachon qabul qilingan.");
                return;
            }

            // 4) Itemni qabul qilish oqimini ishga tushiramiz
            handleAction(transfer.id, pendingItem.id, "accept");
            setSuccess(`Skaner bo'yicha qabul qilindi: ${product.name}`);
        } catch (err) {
            console.error(err);
            setError("Shtrix kodni qayta ishlashda xatolik.");
        } finally {
            setScannerVisible(false);
            setScannerBusy(false);
        }
    };

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

                        <View style={{ marginBottom: 8, flexDirection: "row", justifyContent: "flex-end" }}>
                            <TouchableOpacity
                                style={styles.scanBtn}
                                onPress={() => openScannerForTransfer(item.id)}
                            >
                                <Text style={styles.scanBtnText}>📷 Skaner bilan qabul qilish</Text>
                            </TouchableOpacity>
                        </View>

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
        <>
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
                            Mahsulot shtrix kodini kameraga yo'naltiring
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
        </>
    );
}
