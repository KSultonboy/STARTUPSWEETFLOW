import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b1220" },

    header: {
        padding: 16,
        backgroundColor: "#0f172a",
        borderBottomWidth: 1,
        borderColor: "#1f2937",
    },
    title: { fontSize: 24, fontWeight: "900", color: "#e5e7eb" },

    modeContainer: {
        marginTop: 12,
        flexDirection: "row",
        backgroundColor: "#111827",
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: "#1f2937",
        alignSelf: "flex-start",
    },
    modeBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
    activeModeBtn: { backgroundColor: "#0b2a55", borderWidth: 1, borderColor: "#2563eb" },
    modeText: { color: "#94a3b8", fontWeight: "900" },
    activeModeText: { color: "#93c5fd" },

    tabContainer: {
        marginTop: 10,
        flexDirection: "row",
        backgroundColor: "#111827",
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
    activeTab: { backgroundColor: "#0b2a55", borderWidth: 1, borderColor: "#2563eb" },
    tabText: { fontWeight: "900", color: "#94a3b8" },
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

    label: { fontSize: 13, fontWeight: "900", color: "#cbd5e1", marginBottom: 6 },
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

    qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },

    removeBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
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

    listContent: { paddingBottom: 30 },

    historyCard: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: "#0f172a",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
        overflow: "hidden",
    },
    cardHeader: { padding: 14, borderBottomWidth: 1, borderColor: "#1f2937" },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    historyTitle: { color: "#e5e7eb", fontWeight: "900", fontSize: 16, flex: 1, paddingRight: 10 },
    statusBadge: { fontWeight: "900", fontSize: 12 },
    metaText: { color: "#94a3b8", marginTop: 6, fontWeight: "700" },
    noteText: { color: "#a7b0c0", marginTop: 6, fontStyle: "italic" },

    cardBody: { padding: 14, backgroundColor: "#0b1220" },
    itemLine: { color: "#e5e7eb", marginBottom: 8 },

    pill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    pillText: { color: "#cbd5e1", fontWeight: "900", fontSize: 11 },

    rowActions: { flexDirection: "row", gap: 10, marginTop: 10 },
    dangerBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "rgba(239,68,68,0.15)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.25)",
    },
    dangerBtnText: { color: "#f87171", fontWeight: "900" },

    emptyText: { textAlign: "center", padding: 24, color: "#94a3b8", fontWeight: "800" },
});
