import React from "react";
import { View, Text } from "react-native";
import { colors, typography, radius } from "../../styles";
import { reportStyles } from "../../styles/reports";

export default function ReportsMonthlyBarChartNative({ monthLabel, data = [] }) {
    return (
        <View style={reportStyles.section}>
            <Text style={reportStyles.sectionTitle}>
                Oylik savdo dinamikasi (kunlar kesimida)
            </Text>
            <Text style={reportStyles.sectionSubtitle}>Sana bo‘yicha oy: {monthLabel}</Text>

            {!data?.length ? (
                <Text style={reportStyles.empty}>Ushbu oy uchun savdo ma’lumotlari topilmadi.</Text>
            ) : (
                <View style={[reportStyles.card, { padding: 8 }]}>
                    {data.map((item) => (
                        <View
                            key={item.sale_date}
                            style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
                        >
                            <Text style={[typography.small, { width: 44, color: colors.muted }]}>
                                {item.label}
                            </Text>

                            <View
                                style={{
                                    flex: 1,
                                    height: 8,
                                    borderRadius: radius.pill,
                                    backgroundColor: colors.bg,
                                    borderWidth: 1,
                                    borderColor: "#1f2937",
                                    overflow: "hidden",
                                    marginHorizontal: 6,
                                }}
                            >
                                <View
                                    style={{
                                        height: "100%",
                                        width: `${item.width}%`,
                                        borderRadius: radius.pill,
                                        backgroundColor: "#3b82f6",
                                    }}
                                />
                            </View>

                            <Text style={[typography.small, { width: 98, color: colors.text, textAlign: "right" }]}>
                                {Number(item.amount || 0).toLocaleString("uz-UZ")} so‘m
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
