import React from "react";
import { View, Text } from "react-native";
import { colors, typography } from "../../styles";
import { reportStyles } from "../../styles/reports";

export default function ReportsExpensesByTypeSection({
    date,
    expensesByType = [],
    expenseTypeLabel,
}) {
    return (
        <View style={reportStyles.section}>
            <Text style={reportStyles.sectionTitle}>
                Xarajatlar taqsimoti (turlar bo‘yicha)
            </Text>
            <Text style={reportStyles.sectionSubtitle}>Sana: {date}</Text>

            {!expensesByType?.length ? (
                <Text style={reportStyles.empty}>Ushbu davr uchun xarajatlar topilmadi.</Text>
            ) : (
                <View style={reportStyles.list}>
                    {expensesByType.map((row, index) => (
                        <View
                            key={row.expense_type || index}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderBottomWidth: 1,
                                borderBottomColor: "#111827",
                            }}
                        >
                            <Text style={[typography.small, { color: colors.muted, marginRight: 6 }]}>
                                {index + 1}.
                            </Text>

                            <View style={{ flex: 1 }}>
                                <Text style={[typography.body, { color: colors.text }]}>
                                    {expenseTypeLabel ? expenseTypeLabel(row.expense_type) : row.expense_type || "—"}
                                </Text>
                            </View>

                            <Text style={[typography.small, { fontWeight: "800", color: "#facc15", marginLeft: 6 }]}>
                                {(row.total_amount || 0).toLocaleString("uz-UZ")} so‘m
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
