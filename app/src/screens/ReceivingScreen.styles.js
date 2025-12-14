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
    subtitle: { marginTop: 6, color: "#94a3b8", fontWeight: "700" },

    listContent: { padding: 16, paddingBottom: 30 },

    card: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
        overflow: "hidden",
        marginBottom: 12,
    },
    cardHeader: { padding: 14 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    transferTitle: { fontSize: 16, fontWeight: "900", color: "#e5e7eb" },
    statusBadge: { fontSize: 12, fontWeight: "900" },

    subText: { color: "#94a3b8", fontWeight: "700" },
    noteText: { color: "#a7b0c0", marginTop: 6, fontStyle: "italic" },

    cardBody: { borderTopWidth: 1, borderTopColor: "#1f2937", padding: 14, backgroundColor: "#0b1220" },
    itemsTitle: { color: "#e5e7eb", fontWeight: "900", marginBottom: 10 },

    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937",
    },
    itemInfo: { flex: 1 },
    itemName: { color: "#e5e7eb", fontWeight: "900" },
    itemQty: { color: "#94a3b8", marginTop: 2, fontWeight: "700" },
    itemStatus: { marginTop: 4, fontWeight: "900" },

    actionButtons: { flexDirection: "row", gap: 8, alignItems: "center" },
    btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, alignItems: "center", minWidth: 72 },
    btnAccept: { backgroundColor: "rgba(34,197,94,0.18)", borderWidth: 1, borderColor: "rgba(34,197,94,0.35)" },
    btnReject: { backgroundColor: "rgba(239,68,68,0.18)", borderWidth: 1, borderColor: "rgba(239,68,68,0.35)" },
    btnText: { color: "#e5e7eb", fontWeight: "900", fontSize: 12 },

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

    emptyText: { textAlign: "center", padding: 24, color: "#94a3b8", fontWeight: "800" },
});
