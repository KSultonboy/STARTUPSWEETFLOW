import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0b1220" },

    header: {
        padding: 16,
        backgroundColor: "#0f172a",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#1f2937",
    },
    title: { fontSize: 20, fontWeight: "900", color: "#e5e7eb" },
    addBtn: {
        backgroundColor: "#2563eb",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addBtnText: { color: "#fff", fontWeight: "900" },

    list: { padding: 16 },

    card: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    cardTitle: { fontSize: 18, fontWeight: "900", color: "#e5e7eb", flex: 1, paddingRight: 10 },

    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#1f2937",
        backgroundColor: "#111827",
    },
    badgeText: { fontSize: 10, fontWeight: "900", color: "#cbd5e1" },

    infoText: { color: "#94a3b8", marginBottom: 2, fontWeight: "700" },

    cardFooter: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 },
    editBtn: {
        backgroundColor: "#111827",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    deleteBtn: {
        backgroundColor: "rgba(239,68,68,0.15)",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.25)",
    },
    btnText: { color: "#e5e7eb", fontWeight: "900", fontSize: 12 },
    deleteBtnText: { color: "#f87171", fontWeight: "900", fontSize: 12 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 18 },
    modalContent: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    modalTitle: { fontSize: 18, fontWeight: "900", textAlign: "center", color: "#e5e7eb", marginBottom: 12 },

    label: { fontWeight: "900", marginBottom: 6, color: "#cbd5e1" },
    input: {
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 12,
        padding: 12,
        backgroundColor: "#111827",
        color: "#e5e7eb",
        marginBottom: 12,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#111827",
        marginBottom: 12,
    },

    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    switchLabel: { color: "#e5e7eb", fontWeight: "900" },

    modalButtons: { flexDirection: "row", gap: 10, marginTop: 6 },
    modalBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
    cancelBtn: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937" },
    saveBtn: { backgroundColor: "#2563eb" },
    modalBtnText: { fontWeight: "900", color: "#e5e7eb" },

    errorText: { color: "#fca5a5", marginBottom: 10, textAlign: "center", fontWeight: "900" },
    emptyText: { textAlign: "center", marginTop: 24, color: "#94a3b8", fontWeight: "800" },
});
