import React from "react";
import { View, Text } from "react-native";
import Button from "../ui/Button";
import { colors, typography } from "../../styles";
import { reportStyles } from "../../styles/reports";

export default function ReportsProductionSectionNative({ stats, onGoToHistory }) {
    if (!stats) return null;

    const totalQuantity = stats.productionQuantity || 0;
    const batchCount = stats.productionBatchCount || 0;

    return (
        <View style={[reportStyles.card, { marginTop: 16, padding: 12, flexDirection: "row", justifyContent: "space-between", gap: 10 }]}>
            <View style={{ flex: 1 }}>
                <Text style={[typography.small, { color: colors.muted }]}>Umumiy ishlab chiqarish</Text>
                <Text style={[typography.h1, { color: colors.text, marginTop: 2 }]}>
                    {totalQuantity.toLocaleString("uz-UZ")} birlik
                </Text>
                <Text style={[typography.small, { color: colors.muted, marginTop: 6 }]}>
                    Partiyalar soni: <Text style={{ fontWeight: "800", color: colors.text }}>{batchCount} ta</Text>
                </Text>
            </View>

            {onGoToHistory ? (
                <View style={{ alignSelf: "flex-start" }}>
                    <Button title="Tarix" variant="primary" onPress={onGoToHistory} />
                </View>
            ) : null}
        </View>
    );
}
