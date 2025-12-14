import React from "react";
import { View, Text } from "react-native";
import { colors, typography } from "../../styles";
import { reportStyles } from "../../styles/reports";

export default function ReportsTopProductsSection({ date, topProducts = [], loading }) {
    return (
        <View style={reportStyles.section}>
            <Text style={reportStyles.sectionTitle}>Eng ko‘p sotilgan mahsulotlar</Text>
            <Text style={reportStyles.sectionSubtitle}>Sana: {date}</Text>

            {loading ? <Text style={reportStyles.empty}>Jadval yangilanmoqda...</Text> : null}

            <View style={[reportStyles.list, { paddingHorizontal: 4, paddingVertical: 4 }]}>
                {!topProducts?.length ? (
                    <Text style={[reportStyles.empty, { paddingHorizontal: 8, paddingVertical: 6 }]}>
                        Ushbu sana uchun savdo topilmadi.
                    </Text>
                ) : (
                    topProducts.map((item, index) => (
                        <View
                            key={item.product_id + "-" + index}
                            style={{
                                flexDirection: "row",
                                paddingVertical: 10,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                borderBottomColor: "#111827",
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={[typography.body, { color: colors.text, fontWeight: "700" }]}>
                                    {index + 1}. {item.product_name}
                                </Text>
                                <Text style={[typography.small, { color: colors.muted, marginTop: 2 }]}>
                                    {item.branch_name || "—"}
                                </Text>
                            </View>

                            <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                                <Text style={[typography.small, { color: "#a5b4fc", fontWeight: "700" }]}>
                                    {(item.sold_quantity || 0).toLocaleString("uz-UZ")} dona
                                </Text>
                                <Text style={[typography.small, { color: "#facc15", fontWeight: "800", marginTop: 2 }]}>
                                    {(item.total_amount || 0).toLocaleString("uz-UZ")} so‘m
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </View>
    );
}
