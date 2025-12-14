import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b1220" },

    header: {
        padding: 16,
        backgroundColor: "#0f172a",
        borderBottomWidth: 1,
        borderColor: "#1f2937",
    },
    title: { fontSize: 24, fontWeight: "800", color: "#e5e7eb" },

    tabs: {
        flexDirection: "row",
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: "#0f172a",
        borderBottomWidth: 1,
        borderColor: "#1f2937",
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    activeTab: {
        backgroundColor: "#0b2a55",
        borderColor: "#2563eb",
    },
    tabText: { fontWeight: "800", color: "#94a3b8" },
    activeTabText: { color: "#93c5fd" },

    box: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: "#0f172a",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
        padding: 16,
    },
    boxTitle: { fontSize: 18, fontWeight: "900", color: "#e5e7eb", marginBottom: 14 },

    label: { fontSize: 13, fontWeight: "800", color: "#cbd5e1", marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        backgroundColor: "#111827",
        color: "#e5e7eb",
        marginBottom: 12,
    },

    pickerWrap: {
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#111827",
        marginBottom: 10,
    },

    itemRow: {
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        marginBottom: 10,
    },

    qtyRow: { flexDirection: "row", alignItems: "center" },

    removeBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        marginLeft: 10,
        backgroundColor: "rgba(239,68,68,0.15)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    removeBtnText: { color: "#f87171", fontWeight: "900" },

    addBtn: {
        marginTop: 4,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    addBtnText: { color: "#e5e7eb", fontWeight: "900" },

    submitBtn: {
        marginTop: 12,
        backgroundColor: "#2563eb",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
    disabled: { opacity: 0.65 },

    infoBox: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1f2937",
        backgroundColor: "#0f172a",
    },
    infoText: { color: "#93c5fd", fontWeight: "800" },

    errorBox: {
        backgroundColor: "rgba(239,68,68,0.12)",
        padding: 12,
        margin: 16,
        marginBottom: 0,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#ef4444",
    },
    errorText: { color: "#fca5a5", fontWeight: "900" },

    successBox: {
        backgroundColor: "rgba(34,197,94,0.12)",
        padding: 12,
        margin: 16,
        marginBottom: 0,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#22c55e",
    },
    successText: { color: "#86efac", fontWeight: "900" },

    sectionTitle: {
        marginTop: 10,
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: "900",
        color: "#e5e7eb",
    },

    historyCard: {
        marginHorizontal: 16,
        marginTop: 10,
        backgroundColor: "#0f172a",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
        overflow: "hidden",
    },
    historyHeader: {
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderColor: "#1f2937",
    },
    historyDate: { color: "#e5e7eb", fontWeight: "900", fontSize: 16 },
    historyAmount: { color: "#4ade80", fontWeight: "900" },

    historyMeta: { paddingHorizontal: 14, paddingTop: 10, color: "#94a3b8" },

    historyBody: { padding: 14, backgroundColor: "#0b1220" },
    historyItem: { color: "#e5e7eb", marginBottom: 6 },

    rowActions: { flexDirection: "row", gap: 10, marginTop: 10 },
    actionBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    actionBtnText: { color: "#e5e7eb", fontWeight: "900" },
    deleteBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "rgba(239,68,68,0.15)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.25)",
    },
    deleteBtnText: { color: "#f87171", fontWeight: "900" },

    emptyText: { textAlign: "center", padding: 24, color: "#94a3b8" },
});
