// app/src/components/reports/ReportsSalesByBranchSection.jsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { colors, typography } from "../../styles";
import { reportStyles } from "../../styles/reports";

export default function ReportsSalesByBranchSection({
    date,
    salesByBranch = [],
    outletTransfersByBranch = [],
    returnsByBranchToday = [],
    locationTypeLabel,
}) {
    const rows = useMemo(() => {
        const map = new Map();

        (salesByBranch || []).forEach((row) => {
            const id = row.branch_id ?? "null";
            const existing = map.get(id) || {
                branch_id: row.branch_id,
                branch_name: row.branch_name || "—",
                branch_type: row.branch_type || "BRANCH",
                sale_count: 0,
                sales_amount: 0,
                transfer_amount: 0,
                returns_amount: 0,
            };
            existing.sale_count += row.sale_count || 0;
            existing.sales_amount += row.total_amount || 0;
            map.set(id, existing);
        });

        (outletTransfersByBranch || []).forEach((row) => {
            const id = row.branch_id ?? "null";
            const existing = map.get(id) || {
                branch_id: row.branch_id,
                branch_name: row.branch_name || "—",
                branch_type: row.branch_type || "OUTLET",
                sale_count: 0,
                sales_amount: 0,
                transfer_amount: 0,
                returns_amount: 0,
            };
            existing.transfer_amount += row.total_amount || 0;
            map.set(id, existing);
        });

        (returnsByBranchToday || []).forEach((row) => {
            const id = row.branch_id ?? "null";
            const existing = map.get(id) || {
                branch_id: row.branch_id,
                branch_name: row.branch_name || "—",
                branch_type: row.branch_type || "BRANCH",
                sale_count: 0,
                sales_amount: 0,
                transfer_amount: 0,
                returns_amount: 0,
            };
            existing.returns_amount += row.total_amount || 0;
            map.set(id, existing);
        });

        const result = Array.from(map.values());
        result.sort((a, b) => {
            const incomeA =
                (String(a.branch_type || "").toUpperCase() === "OUTLET"
                    ? a.transfer_amount
                    : a.sales_amount) || 0;
            const incomeB =
                (String(b.branch_type || "").toUpperCase() === "OUTLET"
                    ? b.transfer_amount
                    : b.sales_amount) || 0;
            return incomeB - incomeA;
        });
        return result;
    }, [salesByBranch, outletTransfersByBranch, returnsByBranchToday]);

    const money = (n) => Number(n || 0).toLocaleString("uz-UZ");

    return (
        <View style={reportStyles.section}>
            <View style={styles.headerRow}>
                <Text style={reportStyles.sectionTitle}>
                    Filial va do‘konlar bo‘yicha savdo holati
                </Text>
                <Text style={reportStyles.sectionSubtitle}>Sana: {date}</Text>
            </View>

            {rows.length === 0 ? (
                <Text style={reportStyles.empty}>Ushbu sana uchun savdo topilmadi.</Text>
            ) : (
                <View style={styles.tableWrap}>
                    {/* ✅ Bitta horizontal scroll: header + rows shu ichida */}
                    <ScrollView horizontal showsHorizontalScrollIndicator>
                        <View style={styles.tableMinWidth}>
                            {/* Table header */}
                            <View style={[styles.tr, styles.thRow]}>
                                <Text style={[styles.th, styles.colIndex]}>#</Text>
                                <Text style={[styles.th, styles.colName]}>FILIAL / DO‘KON</Text>
                                <Text style={[styles.th, styles.colChecks]}>CHEKLAR SONI</Text>
                                <Text style={[styles.th, styles.colIncome]}>DAROMAD (SO‘M)</Text>
                                <Text style={[styles.th, styles.colReturns]}>VAZVRAT (SO‘M)</Text>
                                <Text style={[styles.th, styles.colDebt]}>QARZ (SO‘M)</Text>
                            </View>

                            {/* Rows */}
                            {rows.map((row, index) => {
                                const type = String(row.branch_type || "BRANCH").toUpperCase();
                                const isOutlet = type === "OUTLET";

                                const income = isOutlet
                                    ? row.transfer_amount || 0
                                    : row.sales_amount || 0;

                                const returnsAmount = row.returns_amount || 0;
                                const debt = income - returnsAmount;

                                return (
                                    <View
                                        key={(row.branch_id || "null") + "-" + index}
                                        style={[
                                            styles.tr,
                                            styles.tdRow,
                                            index % 2 === 0 ? styles.zebra1 : styles.zebra2,
                                        ]}
                                    >
                                        <Text style={[styles.td, styles.colIndex]}>
                                            {index + 1}
                                        </Text>

                                        <View style={[styles.colName, styles.nameCell]}>
                                            <Text
                                                style={[
                                                    typography.body,
                                                    { color: colors.text, fontWeight: "800" },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {row.branch_name || "—"}
                                            </Text>
                                            <Text
                                                style={[
                                                    typography.small,
                                                    { color: colors.muted, marginTop: 2 },
                                                ]}
                                            >
                                                {locationTypeLabel ? locationTypeLabel(type) : type}
                                            </Text>
                                        </View>

                                        <Text style={[styles.td, styles.colChecks]}>
                                            {isOutlet
                                                ? "—"
                                                : (row.sale_count || 0).toLocaleString("uz-UZ")}
                                        </Text>

                                        <Text style={[styles.td, styles.colIncome]}>
                                            {money(income)}
                                        </Text>

                                        <Text style={[styles.td, styles.colReturns]}>
                                            {money(returnsAmount)}
                                        </Text>

                                        <Text style={[styles.td, styles.colDebt]}>
                                            {money(debt)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
    },

    tableWrap: {
        marginTop: 12,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1f2937",
        backgroundColor: "#0b1220",
    },

    // Jadval uzun bo'lsa ham siqilmasin
    tableMinWidth: {
        minWidth: 1200, // ✅ shu “uzun” qilish uchun
    },

    tr: {
        flexDirection: "row",
        alignItems: "center",
    },

    thRow: {
        backgroundColor: "#111827",
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937",
    },

    th: {
        color: "#9ca3af",
        fontWeight: "900",
        fontSize: 12,
        letterSpacing: 0.5,
    },

    tdRow: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#111827",
    },

    td: {
        color: "#e5e7eb",
        fontWeight: "800",
        fontSize: 14,
    },

    zebra1: { backgroundColor: "#0b1220" },
    zebra2: { backgroundColor: "#0d1526" },

    // Column widths (rasmdagi kabi)
    colIndex: { width: 50 },
    colName: { width: 520 },
    colChecks: { width: 200 },
    colIncome: { width: 230 },
    colReturns: { width: 230 },
    colDebt: { width: 220 },

    nameCell: {
        paddingRight: 10,
    },
});
