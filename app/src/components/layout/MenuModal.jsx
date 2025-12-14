import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function MenuModal({ visible, onClose, navigation }) {
    const { user, logout } = useAuth();
    const role = String(user?.role || "").toLowerCase();

    const isAdmin = role === "admin";
    const isBranch = role === "branch";
    const isProduction = role === "production";

    const menu = [];

    if (isAdmin) {
        menu.push(
            { label: "Hisobotlar", screen: "Reports", icon: "📊" },
            { label: "Filiallar", screen: "Branches", icon: "🏬" },
            { label: "Foydalanuvchilar", screen: "Users", icon: "👥" },
            { label: "Xarajatlar", screen: "Expenses", icon: "💸" },
            { label: "Omborxona", screen: "Warehouse", icon: "📦" },
            { label: "Asosiy Catalog", screen: "Products", icon: "🍰" },
            { label: "Transferlar", screen: "Transfers", icon: "🚚" },
            { label: "Vazvratlar", screen: "Returns", icon: "↩️" },
            { label: "Tarix", screen: "History", icon: "🕒" }
        );
    }

    if (isBranch) {
        menu.push(
            { label: "Sotuv", screen: "Sales", icon: "💵" },
            { label: "Omborxona", screen: "Warehouse", icon: "📦" },
            { label: "Qabul qilish", screen: "Receiving", icon: "🚚" },
            { label: "Vazvratlar", screen: "Returns", icon: "↩️" },
            { label: "Sotuv tarixi", screen: "History", icon: "🕒" }
        );
    }

    if (isProduction) {
        menu.push(
            { label: "Production kiritish", screen: "Production", icon: "🏭" },
            { label: "Omborxona", screen: "Warehouse", icon: "📦" },
            { label: "Production tarixi", screen: "History", icon: "🕒" }
        );
    }

    const go = (screen) => {
        onClose?.();
        navigation?.navigate(screen);
    };

    const handleLogout = async () => {
        await logout();
        onClose?.();
        navigation?.reset({ index: 0, routes: [{ name: "Login" }] });
    };

    return (
        <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.card} onPress={() => { }}>
                    <View style={styles.header}>
                        <View style={styles.logo}><Text style={styles.logoText}>R</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>Ruxshona Tort</Text>
                            <Text style={styles.subtitle}>
                                {user?.full_name || "User"} • {user?.role || "-"}
                            </Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </Pressable>
                    </View>

                    <View style={styles.menu}>
                        {menu.map((m) => (
                            <Pressable key={m.screen} onPress={() => go(m.screen)} style={styles.item}>
                                <Text style={styles.itemIcon}>{m.icon}</Text>
                                <Text style={styles.itemLabel}>{m.label}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Pressable onPress={handleLogout} style={styles.logout}>
                        <Text style={styles.logoutText}>Chiqish</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.70)",
        justifyContent: "center",
        padding: 14,
    },
    card: {
        backgroundColor: "#020617",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(30,64,175,0.45)",
        gap: 10,
    },
    logo: {
        width: 42,
        height: 42,
        borderRadius: 999,
        backgroundColor: "#3b82f6",
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: { color: "#fff", fontSize: 18, fontWeight: "800" },
    title: { color: "#f9fafb", fontSize: 16, fontWeight: "800" },
    subtitle: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
    closeBtn: { paddingHorizontal: 6, paddingVertical: 4 },
    closeText: { color: "#e5e7eb", fontSize: 18 },

    menu: { padding: 8 },
    item: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    itemIcon: { fontSize: 18 },
    itemLabel: { color: "#e5e7eb", fontSize: 15, fontWeight: "600" },

    logout: {
        margin: 12,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#dc2626",
        alignItems: "center",
    },
    logoutText: { color: "#fff", fontWeight: "800" },
});
